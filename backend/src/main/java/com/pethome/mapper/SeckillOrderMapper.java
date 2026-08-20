package com.pethome.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.pethome.entity.SeckillOrder;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

public interface SeckillOrderMapper extends BaseMapper<SeckillOrder> {

    /**
     * 乐观锁支付：仅当 status=0 且 version 匹配时置为已支付，version+1。
     * 返回影响行数：1=竞争成功，0=已被超时关单或已支付（并发竞争失败）。
     */
    @Update("UPDATE seckill_order SET status = 1, version = version + 1 " +
            "WHERE id = #{id} AND status = 0 AND version = #{version}")
    int payIfUnpaid(@Param("id") Long id, @Param("version") Integer version);

    /**
     * 乐观锁关单：仅当 status=0 且 version 匹配时置为已超时取消，version+1。
     * 返回影响行数：1=关单成功（需回滚库存），0=已被支付或已关单（幂等跳过）。
     */
    @Update("UPDATE seckill_order SET status = 2, version = version + 1 " +
            "WHERE id = #{id} AND status = 0 AND version = #{version}")
    int cancelIfUnpaid(@Param("id") Long id, @Param("version") Integer version);
}
