package com.pethome.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("pet_note")
public class PetNote {
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;
    private Long petId;
    private Long userId;
    private String title;
    private String content;
    private String tags;
    private String images;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}