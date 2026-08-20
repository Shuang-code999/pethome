package com.pethome.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("consult_session")
public class ConsultSession {
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;
    private Long userId;
    /** 关联宠物档案 ID，用于针对性问诊上下文（可选，为空表示通用问诊） */
    private Long petId;
    private String title;
    private LocalDateTime createTime;
}
