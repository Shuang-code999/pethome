package com.pethome.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("pet")
public class Pet {
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;
    private Long userId;
    private String name;
    private String species;
    private String breed;
    private Integer gender;
    private LocalDate birthday;
    private BigDecimal weight;
    private Integer neutered;
    private String chipNo;
    private String avatar;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;

    // ============ 扩展字段（v2 档案增强） ============

    // 基础资料
    /** 毛色（如 "奶油色"、"虎斑"） */
    private String coatColor;
    /** 血统编号（CKU / CFA 等协会注册号） */
    private String pedigreeNo;
    /** 年龄（字符串，允许用户直接填写，如 "3 岁 5 个月"） */
    private String ageText;

    // 饲养信息
    /** 到家日期 */
    private LocalDate arriveDate;
    /** 日常主食（"皇家 K36 主粮 + 鸡胸肉"） */
    private String stapleFood;

    // 重要风险备注
    /** 过敏史 */
    private String allergy;
    /** 慢性病 */
    private String chronicDisease;
    /** 脾气性格 */
    private String temperament;
    /** 应激情况 */
    private String stress;
    /** 禁忌药物 */
    private String forbiddenDrugs;
    /** 特殊照料要求 */
    private String specialCare;
}
