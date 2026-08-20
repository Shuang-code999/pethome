package com.pethome.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("reminder")
public class Reminder {
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;
    private Long userId;
    private Long petId;
    private String title;
    private LocalDate remindDate;
    private Integer status;
    private LocalDateTime createTime;
}
