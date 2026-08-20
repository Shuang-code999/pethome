package com.pethome.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("notification")
public class Notification {
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;
    private Long userId;
    private String type;        // health/private/follow/system
    private String title;
    private String content;
    private Integer isRead;
    private Long refId;
    private LocalDateTime createTime;

    /** 触发者 user_id（私信/关注来源） */
    @TableField("actor_id")
    private Long actorId;

    @TableField("actor_nickname")
    private String actorNickname;

    @TableField("actor_avatar")
    private String actorAvatar;
}