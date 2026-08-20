package com.pethome.config;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ：秒杀异步下单（削峰） + 订单超时关单（延迟队列 + 死信队列）
 *
 * 关单链路：
 *  1. 异步下单成功后，往【延迟队列 seckill.delay.queue】发一条带 TTL(30min) 的消息，该队列无人消费。
 *  2. 消息 TTL 到期 → 成为死信 → 被转发到【死信交换机 SECKILL_DLX】，路由键 order.cancel。
 *  3. 路由到【死信队列 seckill.cancel.queue】→ OrderCancelListener 消费：乐观锁关单 + 回滚库存。
 *
 * 为什么用 TTL + DLX：无需安装 rabbitmq_delayed_message_exchange 插件，原生支持。
 * 注：per-message TTL + DLX 存在队头阻塞（队首消息未过期时，后面已过期的消息会等），
 *     秒杀场景下同一券的订单 TTL 一致，可接受；如需任意延迟可改用延迟插件。
 */
@Configuration
public class RabbitMQConfig {

    public static final String SECKILL_EXCHANGE = "pethome.seckill";
    public static final String SECKILL_QUEUE = "pethome.seckill.queue";
    public static final String SECKILL_KEY = "order.create";

    /** 死信交换机：延迟消息过期后转发到这里 */
    public static final String SECKILL_DLX = "pethome.seckill.dlx";
    /** 延迟队列：暂存带 TTL 的消息，无人消费，过期后死信 */
    public static final String SECKILL_DELAY_QUEUE = "pethome.seckill.delay.queue";
    /** 死信队列：真正被 OrderCancelListener 消费 */
    public static final String SECKILL_CANCEL_QUEUE = "pethome.seckill.cancel.queue";
    public static final String SECKILL_CANCEL_KEY = "order.cancel";

    @Bean
    public DirectExchange seckillExchange() {
        return ExchangeBuilder.directExchange(SECKILL_EXCHANGE).durable(true).build();
    }

    @Bean
    public Queue seckillQueue() {
        return QueueBuilder.durable(SECKILL_QUEUE).build();
    }

    @Bean
    public Binding seckillBinding() {
        return BindingBuilder.bind(seckillQueue()).to(seckillExchange()).with(SECKILL_KEY);
    }

    /** 死信交换机 */
    @Bean
    public DirectExchange seckillDlx() {
        return ExchangeBuilder.directExchange(SECKILL_DLX).durable(true).build();
    }

    /** 死信队列：消费端真正监听 */
    @Bean
    public Queue seckillCancelQueue() {
        return QueueBuilder.durable(SECKILL_CANCEL_QUEUE).build();
    }

    @Bean
    public Binding seckillCancelBinding() {
        return BindingBuilder.bind(seckillCancelQueue()).to(seckillDlx()).with(SECKILL_CANCEL_KEY);
    }

    /**
     * 延迟队列：消息在此暂存，过期后转发到 SECKILL_DLX，路由键统一改为 order.cancel。
     * 注意：x-dead-letter-routing-key 会覆盖原始 routing key，保证死信按固定键路由。
     */
    @Bean
    public Queue seckillDelayQueue() {
        return QueueBuilder.durable(SECKILL_DELAY_QUEUE)
                .withArgument("x-dead-letter-exchange", SECKILL_DLX)
                .withArgument("x-dead-letter-routing-key", SECKILL_CANCEL_KEY)
                .build();
    }
}
