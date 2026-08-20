package com.pethome.common;

import lombok.Getter;

/**
 * 统一错误码：业务 1xxxx、鉴权 2xxxx、秒杀 3xxxx、订单 4xxxx
 * 与 BizException 配合使用，GlobalExceptionHandler 翻译为 Result
 */
@Getter
public enum ErrorCode {
    OK(200, "ok"),
    PARAM_INVALID(400, "参数错误"),
    UNAUTHORIZED(401, "未登录或登录过期"),
    FORBIDDEN(403, "无权操作"),
    NOT_FOUND(404, "资源不存在"),
    CONFLICT(409, "资源冲突"),

    USER_NOT_FOUND(10001, "用户不存在"),
    USER_NICKNAME_INVALID(10002, "昵称不合法"),
    USER_PHONE_INVALID(10003, "手机号格式错误"),

    PET_NOT_FOUND(11001, "宠物档案不存在"),
    PET_OWNER_MISMATCH(11002, "无权操作此宠物"),

    POST_NOT_FOUND(12001, "帖子不存在"),
    POST_ALREADY_LIKED(12002, "已经点赞过了"),

    SECKILL_NOT_FOUND(13001, "秒杀券不存在"),
    SECKILL_NOT_STARTED(13002, "秒杀未开始"),
    SECKILL_ENDED(13003, "秒杀已结束"),
    SECKILL_SOLD_OUT(13004, "手慢了，库存不足"),
    SECKILL_DUPLICATE(13005, "您已抢过该券，请勿重复"),
    SECKILL_ORDER_NOT_FOUND(13006, "订单不存在（可能还在异步创建中）"),
    SECKILL_ORDER_CLOSED(13007, "订单已超时关闭，无法支付"),

    APPOINTMENT_NOT_FOUND(14001, "预约不存在"),
    APPOINTMENT_SLOT_TAKEN(14002, "该时段已被预约"),

    ORDER_NOT_FOUND(15001, "订单不存在"),
    ORDER_STATUS_INVALID(15002, "订单状态不允许该操作"),

    RATE_LIMIT_EXCEEDED(20001, "操作过于频繁，请稍后再试"),

    INTERNAL_ERROR(500, "系统繁忙，请稍后再试");

    private final int code;
    private final String msg;

    ErrorCode(int code, String msg) {
        this.code = code;
        this.msg = msg;
    }
}
