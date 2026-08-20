package com.pethome.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("health_record")
public class HealthRecord {
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;
    private Long petId;
    private Long userId;
    private String type;
    private String name;
    private LocalDate recordDate;
    private LocalDate nextDate;
    private String note;
    private LocalDateTime createTime;
}
