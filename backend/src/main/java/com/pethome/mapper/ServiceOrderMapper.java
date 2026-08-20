package com.pethome.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.pethome.entity.ServiceOrder;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ServiceOrderMapper extends BaseMapper<ServiceOrder> {
}