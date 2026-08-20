package com.pethome.common;

import lombok.Getter;

/**
 * 业务异常：尽量用 ErrorCode 枚举，避免散落硬编码
 */
@Getter
public class BizException extends RuntimeException {
    private final int code;

    public BizException(String msg) {
        super(msg);
        this.code = ErrorCode.INTERNAL_ERROR.getCode();
    }

    public BizException(int code, String msg) {
        super(msg);
        this.code = code;
    }

    public BizException(ErrorCode ec) {
        super(ec.getMsg());
        this.code = ec.getCode();
    }

    public BizException(ErrorCode ec, String msg) {
        super(msg);
        this.code = ec.getCode();
    }
}
