package com.pethome.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("`order`")
public class Order {
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;
    private String orderNo;
    private Long userId;
    private BigDecimal amount;
    private Integer status; // 0待支付 1已支付 2已取消
    private String subject;
    private String tradeNo; // 支付宝交易号
    private LocalDateTime payTime;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;

    /** 关联商品 ID */
    @TableField("product_id")
    private Long productId;

    /** 规格组合（例 500g/鸡肉） */
    @TableField("spec_label")
    private String specLabel;

    /** 购买数量 */
    private Integer quantity;
}