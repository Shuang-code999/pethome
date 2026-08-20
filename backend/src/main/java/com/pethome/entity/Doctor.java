package com.pethome.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/** 真实在线医生：可被预约（区别于 mock 推荐医生） */
@Data
@TableName("doctor")
public class Doctor {
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;
    private String name;
    private String title;        // 主任医师 / 副主任医师
    private String dept;         // 内科 / 外科 / 皮肤科 / 急诊
    private String hospital;
    private String avatar;
    private String tags;         // 擅长标签
    private BigDecimal price;    // 问诊价格
    private Integer yearsExp;    // 从业年限
    private Double rating;       // 评分 0-5
    private Integer consultCount; // 累计问诊数
    private String bio;          // 简介
    private Boolean online;      // 是否在线
    private String licenseNo;    // 执业证号
    private LocalDateTime createTime;
}