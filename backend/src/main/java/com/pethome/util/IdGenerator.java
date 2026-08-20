package com.pethome.util;

import com.baomidou.mybatisplus.core.incrementer.IdentifierGenerator;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicLong;

/**
 * 基于时间戳 + 节点 id + 序列号 的雪花 ID（单调递增、长度 18~19）
 * 解决 long*1000 假雪花的溢出 + 碰撞问题
 *  - 41 bit 时间戳（ms）
 *  - 10 bit 节点 id（节点启动时随机分配，单实例够用）
 *  - 12 bit 序列号（单毫秒内自增）
 */
@Component
public class IdGenerator implements IdentifierGenerator {

    private static final long EPOCH = 1700000000000L; // 2023-11-14 作为基准
    private static final long NODE_ID_BITS = 10L;
    private static final long SEQ_BITS = 12L;
    private static final long MAX_NODE_ID = (1L << NODE_ID_BITS) - 1L;
    private static final long MAX_SEQ = (1L << SEQ_BITS) - 1L;

    private final long nodeId = (long) (Math.random() * (MAX_NODE_ID + 1));
    private final AtomicLong lastTs = new AtomicLong(-1L);
    private final AtomicLong seq = new AtomicLong(0L);

    /** 同步生成下一个 id */
    public synchronized long nextId() {
        long ts = System.currentTimeMillis();
        if (ts == lastTs.get()) {
            long s = seq.incrementAndGet();
            if (s > MAX_SEQ) {
                // 等到下一毫秒
                while (System.currentTimeMillis() == lastTs.get()) Thread.onSpinWait();
                ts = System.currentTimeMillis();
                seq.set(0);
            }
        } else {
            seq.set(0);
        }
        lastTs.set(ts);
        return ((ts - EPOCH) << (NODE_ID_BITS + SEQ_BITS))
                | (nodeId << SEQ_BITS)
                | (seq.get() & MAX_SEQ);
    }

    /** MyBatis-Plus ASSIGN_ID 走这里 */
    @Override
    public Long nextId(Object entity) {
        return nextId();
    }
}
