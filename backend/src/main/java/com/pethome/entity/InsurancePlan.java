package com.pethome.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/** 保险方案 */
@Data
@TableName("insurance_plan")
public class InsurancePlan {
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;
    private String name;
    private String company;       // 承保公司
    private String tag;           // 推荐 / 热销 / 入门
    private BigDecimal price;     // 价格
    private String unit;          // /年
    private String deduct;        // 免赔额
    private String payout;        // 理赔说明
    private String coverage;      // 保障责任（JSON 字符串）
    private String highlights;    // 方案亮点（JSON 字符串）
    private Integer sortOrder;    // 排序
    private Boolean active;       // 是否上架
    private LocalDateTime createTime;
}