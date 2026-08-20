package com.pethome.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {

    /** 通用 RedisTemplate：String key + JSON value */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory cf, ObjectMapper objectMapper) {
        RedisTemplate<String, Object> tpl = new RedisTemplate<>();
        tpl.setConnectionFactory(cf);
        StringRedisSerializer k = new StringRedisSerializer();
        GenericJackson2JsonRedisSerializer v = new GenericJackson2JsonRedisSerializer(objectMapper);
        tpl.setKeySerializer(k);
        tpl.setHashKeySerializer(k);
        tpl.setValueSerializer(v);
        tpl.setHashValueSerializer(v);
        tpl.afterPropertiesSet();
        return tpl;
    }

    /** 秒杀 Lua 脚本 */
    @Bean
    public DefaultRedisScript<Long> seckillScript() {
        DefaultRedisScript<Long> s = new DefaultRedisScript<>();
        s.setLocation(new org.springframework.core.io.ClassPathResource("lua/seckill.lua"));
        s.setResultType(Long.class);
        return s;
    }

    /** 限流 Lua 脚本 */
    @Bean
    public DefaultRedisScript<Long> rateLimitScript() {
        DefaultRedisScript<Long> s = new DefaultRedisScript<>();
        s.setLocation(new org.springframework.core.io.ClassPathResource("lua/ratelimit.lua"));
        s.setResultType(Long.class);
        return s;
    }

    /** Feed 批量推送 Lua 脚本 */
    @Bean
    public DefaultRedisScript<Long> feedPushScript() {
        DefaultRedisScript<Long> s = new DefaultRedisScript<>();
        s.setLocation(new org.springframework.core.io.ClassPathResource("lua/feed_push.lua"));
        s.setResultType(Long.class);
        return s;
    }
}
