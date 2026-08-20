package com.pethome.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("comment")
public class Comment {
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;
    private Long postId;
    private Long userId;
    private String author;
    private Long parentId;
    private String content;
    private LocalDateTime createTime;
}
