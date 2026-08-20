package com.pethome.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("product")
public class Product {
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;
    private String name;
    private BigDecimal price;
    private BigDecimal oldPrice;
    private Integer stock;
    private String image;
    private String tags;
    private String category;
    private Integer status;
    private LocalDateTime createTime;

    /** 规格选项 JSON（数组内含 {name, options[]}） */
    @TableField("spec_options")
    private String specOptions;

    /** 销量 */
    private Integer sales;

    /** 商品详情（富文本/纯文本） */
    private String description;
}