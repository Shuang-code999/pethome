package com.pethome.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("consult_message")
public class ConsultMessage {
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;
    private Long sessionId;
    private String role;
    private String content;
    private String imageUrl;
    private LocalDateTime createTime;
}
