package com.pethome.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("seckill_voucher")
public class SeckillVoucher {
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;
    private String name;
    private Integer total;
    private Integer remain;
    private BigDecimal discount;
    private LocalDateTime beginTime;
    private LocalDateTime endTime;
    private LocalDateTime createTime;
}
