package com.pethome.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** 同城服务预约订单 */
@Data
@TableName("service_order")
public class ServiceOrder {
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;
    private Long userId;
    /** feeding/grooming/boarding/transport/training/funeral */
    private String serviceType;
    private Long providerId;
    private String providerName;
    private String petName;
    private String petType;
    private String address;
    private LocalDate apptDate;
    private String apptSlot;
    private String remark;
    private BigDecimal amount;
    /** pending/confirmed/completed/cancelled */
    private String status;
    private LocalDateTime createTime;
}