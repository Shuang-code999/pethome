package com.pethome.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.pethome.entity.SeckillVoucher;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

public interface SeckillVoucherMapper extends BaseMapper<SeckillVoucher> {
    /** 数据库层兜底扣减（保证不超卖） */
    @Update("UPDATE seckill_voucher SET remain = remain - 1 WHERE id = #{id} AND remain > 0")
    int decrRemain(@Param("id") Long id);

    /** 订单超时关单后回滚库存（remain + 1） */
    @Update("UPDATE seckill_voucher SET remain = remain + 1 WHERE id = #{id}")
    int incrRemain(@Param("id") Long id);
}
