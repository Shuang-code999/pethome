package com.pethome.interceptor;

import com.pethome.common.BizException;
import com.pethome.common.Constants;
import com.pethome.common.ErrorCode;
import com.pethome.util.JwtUtil;
import com.pethome.util.UserContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * JWT 鉴权：解析 token 写入 ThreadLocal，失败抛 BizException 走 GlobalExceptionHandler
 * 跨线程（@Async）由 AsyncConfig.TaskDecorator 透传
 */
@Component
@RequiredArgsConstructor
public class JwtInterceptor implements HandlerInterceptor {

    private final JwtUtil jwtUtil;

    @Override
    public boolean preHandle(@NonNull HttpServletRequest req, @NonNull HttpServletResponse resp, @NonNull Object h) {
        String token = req.getHeader(Constants.AUTH_HEADER);
        if (token == null) token = req.getHeader("Authorization");
        Long uid = jwtUtil.parse(token);
        if (uid == null) {
            throw new BizException(ErrorCode.UNAUTHORIZED);
        }
        UserContext.set(uid);
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest req, HttpServletResponse resp, Object h, Exception e) {
        UserContext.clear();
    }
}
