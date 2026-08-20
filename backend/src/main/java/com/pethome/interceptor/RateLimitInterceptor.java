package com.pethome.interceptor;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pethome.common.Constants;
import com.pethome.common.Result;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Collections;

import lombok.extern.slf4j.Slf4j;

/** 限流拦截器：Redis + Lua 令牌桶，按 IP 维度防刷 */
@Slf4j
@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    @Autowired
    private StringRedisTemplate redis;
    @Autowired
    private DefaultRedisScript<Long> rateLimitScript;
    @Autowired
    private ObjectMapper objectMapper;

    @Value("${pethome.rate-limit.tokens}")
    private long tokens;
    @Value("${pethome.rate-limit.capacity}")
    private long capacity;

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse resp, Object h) throws Exception {
        String ip = clientIp(req);
        String key = Constants.RATE_LIMIT + ip + ":" + req.getRequestURI();
        long now = System.currentTimeMillis() / 1000;
        Long allowed;
        try {
            allowed = redis.execute(rateLimitScript,
                    Collections.singletonList(key),
                    String.valueOf(capacity), String.valueOf(tokens),
                    String.valueOf(now), "1");
        } catch (Exception e) {
            log.warn("Redis 限流异常，已放行: {}", e.getMessage());
            return true;
        }
        if (allowed == null || allowed == 0) {
            resp.setStatus(429);
            resp.setContentType("application/json;charset=UTF-8");
            resp.getWriter().write(objectMapper.writeValueAsString(
                    Result.fail(429, "请求过于频繁，请稍后再试")));
            return false;
        }
        return true;
    }

    private String clientIp(HttpServletRequest req) {
        String ip = req.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty()) ip = req.getRemoteAddr();
        return ip == null ? "unknown" : ip.split(",")[0].trim();
    }
}
