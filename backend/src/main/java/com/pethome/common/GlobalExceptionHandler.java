package com.pethome.common;

import com.pethome.config.TraceIdFilter;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * 全局异常翻译：
 *  - BizException 走 ErrorCode
 *  - 401/403 走标准 HTTP 状态码
 *  - 其他异常 500，并附 traceId 方便排查
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BizException.class)
    public Result<Void> biz(BizException e) {
        log.warn("业务异常 code={} msg={}", e.getCode(), e.getMessage());
        return Result.fail(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<Void> valid(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getFieldError() != null
                ? e.getBindingResult().getFieldError().getDefaultMessage() : ErrorCode.PARAM_INVALID.getMsg();
        return Result.fail(ErrorCode.PARAM_INVALID.getCode(), msg);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Result<Void>> illegalState(IllegalStateException e) {
        // 通常是 "未登录"，JwtInterceptor 抛 BizException(UNAUTHORIZED)
        if (e.getMessage() != null && e.getMessage().contains("未登录")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Result.fail(ErrorCode.UNAUTHORIZED.getCode(), "未登录或登录过期"));
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Result.fail(400, e.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public Result<Map<String, Object>> other(Exception e) {
        String traceId = MDC.get(TraceIdFilter.MDC_KEY);
        log.error("系统异常 traceId={}", traceId, e);
        Map<String, Object> data = new HashMap<>();
        if (traceId != null) data.put("traceId", traceId);
        return Result.fail(ErrorCode.INTERNAL_ERROR.getCode(),
                ErrorCode.INTERNAL_ERROR.getMsg() + (traceId != null ? " (traceId=" + traceId + ")" : ""));
    }
}
