package com.pethome.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** 问诊预约：用户预约某医生某时段 */
@Data
@TableName("appointment")
public class Appointment {
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;
    private Long userId;
    private Long doctorId;
    private String doctorName;
    private String userPetName;       // 宠物名
    private String petType;           // 猫/狗
    private String symptoms;          // 症状描述
    private LocalDate apptDate;       // 预约日期
    private String apptSlot;          // 时段：09:00-10:00
    private String status;            // pending/confirmed/completed/cancelled
    private BigDecimal amount;        // 费用
    private String payStatus;         // unpaid/paid/refunded
    private LocalDateTime createTime;
}