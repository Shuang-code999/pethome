package com.pethome.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;

/** 同城服务方：宠物店、医院、上门服务者、训练学校、殡葬馆等（统一模型） */
@Data
@TableName("pet_store")
public class PetStore {
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;
    private String name;
    /** 供给方类型：门店/医院/个人/训练学校/殡葬馆 */
    private String category;
    /** 6 大服务类型之一：feeding/grooming/boarding/transport/training/funeral */
    private String serviceType;
    /** 到店/上门/双向 */
    private String serviceMode;
    /** 适用宠物（逗号分隔）：狗狗/猫猫/小宠/爬宠/鸟类/水族 */
    private String petTypes;
    /** 价格区间文本，如 ¥89-199 */
    private String priceRange;
    /** 后端跳转链接：/service/{type}/book/{id} */
    private String bookingUrl;
    private String address;
    private String city;
    private String district;
    private Double lat;
    private Double lng;
    private String tel;
    private BigDecimal rating;
    private Integer distance;
    private String openTime;
    private String photo;
    private String tags;
    private String description;
    private Integer sortOrder;
}