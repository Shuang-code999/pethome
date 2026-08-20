package com.pethome.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("weight_record")
public class WeightRecord {
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;
    private Long petId;
    private Long userId;
    private BigDecimal weight;
    private LocalDate recordDate;
    private String note;
    private LocalDateTime createTime;
}