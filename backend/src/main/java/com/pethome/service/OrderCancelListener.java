package com.pethome.service;

import com.pethome.common.Constants;
import com.pethome.config.RabbitMQConfig;
import com.pethome.entity.SeckillOrder;
import com.pethome.mapper.SeckillOrderMapper;
import com.pethome.mapper.SeckillVoucherMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

/**
 * 死信消费者：订单超时未支付自动关单 + 回滚库存
 *
 * 触发链路：异步下单后写延迟队列(TTL 30min) → 过期死信 → 本消费者。
 *
 * 并发竞争（支付回调 vs 超时关单）处理：
 *  乐观锁 cancelIfUnpaid：UPDATE ... WHERE status=0 AND version=?
 *  - 返回 1 行 → 我方关单成功，回滚 Redis/DB 库存 + 移除用户抢购记录（允许重抢）
 *  - 返回 0 行 → 支付已先于关单（version 已变），幂等跳过，不动库存
 *
 * 幂等：死信重复投递时，status 已非 0，WHERE 条件不匹配，影响 0 行，直接跳过。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderCancelListener {

    private final SeckillOrderMapper orderMapper;
    private final SeckillVoucherMapper voucherMapper;
    private final StringRedisTemplate redis;

    @RabbitListener(queues = RabbitMQConfig.SECKILL_CANCEL_QUEUE)
    public void onExpire(String msg) {
        // msg = orderId:voucherId:userId
        String[] parts = msg.split(":");
        long orderId = Long.parseLong(parts[0]);
        long voucherId = Long.parseLong(parts[1]);
        long userId = Long.parseLong(parts[2]);

        SeckillOrder order = orderMapper.selectById(orderId);
        if (order == null) {
            // 订单未落库（理论上延迟到期时一定已落库，兜底跳过）
            log.warn("[关单] 订单不存在 orderId={}，跳过", orderId);
            return;
        }
        if (order.getStatus() != 0) {
            // 已支付或已关单，幂等跳过
            log.info("[关单] 订单状态非未支付 orderId={} status={}，幂等跳过", orderId, order.getStatus());
            return;
        }

        // 乐观锁关单：竞争成功才回滚库存
        int rows = orderMapper.cancelIfUnpaid(order.getId(), order.getVersion());
        if (rows == 0) {
            // 支付先于关单赢了竞争，不动库存
            log.info("[关单] 订单已被支付/已关单 orderId={}，竞争失败跳过（不回滚库存）", orderId);
            return;
        }

        // 回滚库存：DB remain +1、Redis stock +1、移除用户抢购记录（允许重抢）
        voucherMapper.incrRemain(voucherId);
        redis.opsForValue().increment(Constants.SECKILL_STOCK + voucherId);
        redis.opsForSet().remove(Constants.SECKILL_USER + voucherId, String.valueOf(userId));
        log.info("[关单] ✓ 订单超时关单完成 orderId={} voucher={} 已回滚库存、解除用户抢购记录", orderId, voucherId);
    }
}
