package com.pethome.service;

import com.pethome.config.RabbitMQConfig;
import com.pethome.entity.SeckillOrder;
import com.pethome.mapper.SeckillOrderMapper;
import com.pethome.mapper.SeckillVoucherMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/** 秒杀异步下单消费者：MQ 削峰 + Redisson 分布式锁防重复
 *  Lua 已保证不超卖，这里用分布式锁保证同一用户幂等落库；
 *  落库成功后写入延迟队列，TTL 到期由死信消费者触发超时关单 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SeckillOrderListener {

    private final SeckillOrderMapper orderMapper;
    private final SeckillVoucherMapper voucherMapper;
    private final RedissonClient redissonClient;
    private final RabbitTemplate rabbitTemplate;

    /** 订单支付超时时间（分钟），到期未支付则关单回滚库存 */
    @Value("${pethome.seckill.pay-timeout-min:30}")
    private long payTimeoutMin;

    @RabbitListener(queues = RabbitMQConfig.SECKILL_QUEUE)
    public void onMessage(String msg) {
        // msg = orderId:voucherId:userId
        String[] parts = msg.split(":");
        long orderId = Long.parseLong(parts[0]);
        long voucherId = Long.parseLong(parts[1]);
        long userId = Long.parseLong(parts[2]);

        // 分布式锁：voucherId+userId，防止消费者并发重复落库
        String lockKey = "lock:seckill:" + voucherId + ":" + userId;
        RLock lock = redissonClient.getLock(lockKey);
        try {
            if (!lock.tryLock()) {
                log.warn("未拿到锁，跳过重复订单 {}", lockKey);
                return;
            }
            SeckillOrder order = new SeckillOrder();
            order.setId(orderId);
            order.setVoucherId(voucherId);
            order.setUserId(userId);
            order.setStatus(0);
            order.setCreateTime(LocalDateTime.now());
            try {
                orderMapper.insert(order);
                // 数据库层兜底扣库存（保证最终一致）
                voucherMapper.decrRemain(voucherId);
                log.info("异步下单完成 orderId={} voucher={}", orderId, voucherId);
                // 落库成功 → 写延迟队列，TTL 到期触发超时关单
                sendDelayMessage(orderId, voucherId, userId);
            } catch (org.springframework.dao.DuplicateKeyException e) {
                // 唯一键 uk_voucher_user 兜底，幂等
                log.info("订单已存在，幂等跳过 {}", orderId);
            }
        } finally {
            if (lock.isHeldByCurrentThread()) lock.unlock();
        }
    }

    /** 往延迟队列发带 TTL 的消息，到期后死信到 SECKILL_CANCEL_QUEUE */
    private void sendDelayMessage(long orderId, long voucherId, long userId) {
        long ttlMs = payTimeoutMin * 60_000L;
        String payload = orderId + ":" + voucherId + ":" + userId;
        rabbitTemplate.convertAndSend("", RabbitMQConfig.SECKILL_DELAY_QUEUE, payload, m -> {
            m.getMessageProperties().setExpiration(String.valueOf(ttlMs));
            return m;
        });
        log.info("订单超时计时已启动 orderId={} ttlMs={}（到期未支付将自动关单）", orderId, ttlMs);
    }
}
