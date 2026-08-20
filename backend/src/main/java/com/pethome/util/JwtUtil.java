package com.pethome.util;

import com.pethome.common.Constants;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/** JWT 工具：签发与解析（无状态鉴权，扛并发天然支持） */
@Component
public class JwtUtil {

    @Value("${pethome.jwt.secret}")
    private String secret;
    @Value("${pethome.jwt.ttl}")
    private long ttl;

    private SecretKey key() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String create(Long userId) {
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + ttl))
                .signWith(key())
                .compact();
    }

    public Long parse(String token) {
        if (token == null || token.isEmpty()) return null;
        if (token.startsWith(Constants.AUTH_PREFIX)) {
            token = token.substring(Constants.AUTH_PREFIX.length());
        }
        try {
            Claims c = Jwts.parser().verifyWith(key()).build().parseSignedClaims(token).getPayload();
            return Long.valueOf(c.getSubject());
        } catch (Exception e) {
            return null;
        }
    }
}
