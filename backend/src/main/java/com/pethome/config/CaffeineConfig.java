package com.pethome.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/** Caffeine 本地缓存：与 Redis 组成二级缓存，挡热点 key
 *  直接用 Caffeine Cache（不依赖 spring-boot-starter-cache） */
@Configuration
public class CaffeineConfig {

    /** 商品热点缓存 */
    @Bean
    public Cache<String, Object> productLocalCache() {
        return Caffeine.newBuilder()
                .expireAfterWrite(60, TimeUnit.SECONDS)
                .initialCapacity(64)
                .maximumSize(500)
                .build();
    }
}
