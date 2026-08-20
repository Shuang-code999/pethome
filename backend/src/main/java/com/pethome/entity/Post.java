package com.pethome.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("post")
public class Post {
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;
    private Long userId;
    private String author;
    private String title;
    private String body;
    private String images;
    private String type;
    private Integer likes;
    private Integer comments;
    private LocalDateTime createTime;
}
