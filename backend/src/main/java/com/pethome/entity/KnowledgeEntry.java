package com.pethome.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

/** 知识库条目：宠物养护知识，喂入 RAG 向量库 */
@Data
@TableName("knowledge_entry")
public class KnowledgeEntry {
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;
    /** 分类：疾病/养护/行为/营养 */
    private String category;
    private String title;
    private String content;
    /** 标签，逗号分隔 */
    private String tags;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}