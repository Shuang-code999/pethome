package com.pethome.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.pethome.entity.PetStore;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface PetStoreMapper extends BaseMapper<PetStore> {
}