package com.pethome.config;

import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Jackson 全局配置：将所有 Long 类型序列化为 String，
 * 防止雪花 ID（18-19 位）在 JavaScript 中因精度丢失被截断。
 *
 * 仅影响 HTTP JSON 响应，不影响 Redis 序列化或数据库存储。
 * Integer 类型的字段（如 likes, comments, count）不受影响。
 */
@Configuration
public class JacksonConfig {

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer longToStringCustomizer() {
        return builder -> {
            builder.serializerByType(Long.class, ToStringSerializer.instance);
            builder.serializerByType(Long.TYPE, ToStringSerializer.instance);
        };
    }
}
