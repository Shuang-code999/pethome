package com.pethome.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.pethome.entity.KnowledgeEntry;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface KnowledgeEntryMapper extends BaseMapper<KnowledgeEntry> {
}