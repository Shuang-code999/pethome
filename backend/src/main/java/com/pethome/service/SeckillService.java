package com.pethome.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.pethome.common.BizException;
import com.pethome.common.Constants;
import com.pethome.common.ErrorCode;
import com.pethome.entity.SeckillOrder;
import com.pethome.entity.SeckillVoucher;
import com.pethome.mapper.SeckillOrderMapper;
import com.pethome.mapper.SeckillVoucherMapper;
import com.pethome.util.IdGenerator;
import com.pethome.util.UserContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 秒杀：Redis + Lua 原子操作
 *  - 时间校验、库存、用户去重 全部下推到 Redis Lua，零 DB 回源
 *  - voucher 时间戳预热到 Redis Hash，单 key HMGET 完成元信息读取
 *  - 异步下单走 MQ 削峰
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SeckillService {

    private final SeckillVoucherMapper voucherMapper;
    private final SeckillOrderMapper orderMapper;
    private final StringRedisTemplate redis;
    private final DefaultRedisScript<Long> seckillScript;
    private final RabbitTemplate rabbitTemplate;
    private final IdGenerator idGenerator;

    private static final String META_KEY = "seckill:meta:";
    private static final long META_TTL_SEC = 24 * 3600L;

    /** 启动时把秒杀券库存 + 时间元信息预热到 Redis */
    @PostConstruct
    public void preheat() {
        List<SeckillVoucher> list = voucherMapper.selectList(null);
        for (SeckillVoucher v : list) {
            String stockKey = Constants.SECKILL_STOCK + v.getId();
            String metaKey = META_KEY + v.getId();
            if (Boolean.FALSE.equals(redis.hasKey(stockKey))) {
                redis.opsForValue().set(stockKey, String.valueOf(v.getRemain()));
                log.info("秒杀库存预热 voucher={} stock={}", v.getId(), v.getRemain());
            }
            Map<String, String> meta = new HashMap<>();
            meta.put("begin", String.valueOf(v.getBeginTime().toEpochSecond(ZoneOffset.ofHours(8))));
            meta.put("ended", String.valueOf(v.getEndTime().toEpochSecond(ZoneOffset.ofHours(8))));
            meta.put("name", v.getName());
            meta.put("price", String.valueOf(v.getDiscount()));
            redis.opsForHash().putAll(metaKey, meta);
            redis.expire(metaKey, java.time.Duration.ofSeconds(META_TTL_SEC));
        }
    }

    /** 秒杀券列表 */
    public List<SeckillVoucher> list() {
        return voucherMapper.selectList(new LambdaQueryWrapper<SeckillVoucher>()
                .le(SeckillVoucher::getBeginTime, LocalDateTime.now())
                .ge(SeckillVoucher::getEndTime, LocalDateTime.now()));
    }

    /** 抢券：Lua 原子操作（时间 + 库存 + 去重），零 DB 命中 */
    public Long seckill(Long voucherId) {
        Long userId = UserContext.require();
        long nowSec = System.currentTimeMillis() / 1000;
        Long r = redis.execute(seckillScript,
                List.of(Constants.SECKILL_STOCK + voucherId,
                        Constants.SECKILL_USER + voucherId,
                        META_KEY + voucherId),
                String.valueOf(userId), String.valueOf(nowSec));
        if (r == null) throw new BizException(ErrorCode.INTERNAL_ERROR, "秒杀异常");
        switch (r.intValue()) {
            case 1: throw new BizException(ErrorCode.SECKILL_SOLD_OUT);
            case 2: throw new BizException(ErrorCode.SECKILL_DUPLICATE);
            case 3: throw new BizException(ErrorCode.SECKILL_NOT_STARTED);
            case 4: throw new BizException(ErrorCode.SECKILL_ENDED);
            case 5:
                // 元信息缺失，回源 DB 补一次后重试一次
                log.warn("voucher={} meta 缺失，回源 DB", voucherId);
                refillMeta(voucherId);
                Long r2 = redis.execute(seckillScript,
                        List.of(Constants.SECKILL_STOCK + voucherId,
                                Constants.SECKILL_USER + voucherId,
                                META_KEY + voucherId),
                        String.valueOf(userId), String.valueOf(nowSec));
                if (r2 == null || r2 != 0) throw new BizException(ErrorCode.SECKILL_NOT_FOUND);
                break;
            case 0: break;
            default: throw new BizException(ErrorCode.INTERNAL_ERROR, "秒杀异常 r=" + r);
        }
        // 用真雪花 ID 替换原 long*1000 假雪花
        long orderId = idGenerator.nextId();
        rabbitTemplate.convertAndSend("pethome.seckill", "order.create",
                orderId + ":" + voucherId + ":" + userId);
        log.info("秒杀成功 voucher={} user={} orderId={}（异步下单中）", voucherId, userId, orderId);
        return orderId;
    }

    private void refillMeta(Long voucherId) {
        SeckillVoucher v = voucherMapper.selectById(voucherId);
        if (v == null) return;
        String metaKey = META_KEY + v.getId();
        Map<String, String> meta = new HashMap<>();
        meta.put("begin", String.valueOf(v.getBeginTime().toEpochSecond(ZoneOffset.ofHours(8))));
        meta.put("ended", String.valueOf(v.getEndTime().toEpochSecond(ZoneOffset.ofHours(8))));
        meta.put("name", v.getName());
        meta.put("price", String.valueOf(v.getDiscount()));
        redis.opsForHash().putAll(metaKey, meta);
        redis.expire(metaKey, java.time.Duration.ofSeconds(META_TTL_SEC));
    }

    /**
     * 模拟支付：乐观锁（version）防并发
     *  与「超时关单」竞争同一条订单：UPDATE ... WHERE status=0 AND version=?
     *  返回 0 行说明已被关单/已支付，支付失败。
     */
    public void pay(Long orderId) {
        Long userId = UserContext.require();
        SeckillOrder order = orderMapper.selectById(orderId);
        if (order == null) throw new BizException(ErrorCode.SECKILL_ORDER_NOT_FOUND);
        if (!order.getUserId().equals(userId)) throw new BizException(ErrorCode.FORBIDDEN);
        if (order.getStatus() == 1) throw new BizException(ErrorCode.ORDER_STATUS_INVALID, "订单已支付，请勿重复");
        if (order.getStatus() == 2) throw new BizException(ErrorCode.SECKILL_ORDER_CLOSED, "订单已超时关闭");
        int rows = orderMapper.payIfUnpaid(order.getId(), order.getVersion());
        if (rows == 0) {
            // 竞争失败：关单先于支付（version 已变）
            throw new BizException(ErrorCode.SECKILL_ORDER_CLOSED, "订单已超时关闭，支付失败");
        }
        log.info("支付成功 orderId={}", orderId);
    }
}
