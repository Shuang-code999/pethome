package com.pethome.common;

/** Redis Key 前缀常量 */
public class Constants {
    /** 宠物档案缓存: pet:info:{id} */
    public static final String PET_CACHE = "pet:info:";
    /** 商品缓存: product:info:{id} */
    public static final String PRODUCT_CACHE = "product:info:";
    /** 秒杀库存: seckill:stock:{voucherId} */
    public static final String SECKILL_STOCK = "seckill:stock:";
    /** 秒杀已抢用户: seckill:user:{voucherId} */
    public static final String SECKILL_USER = "seckill:user:";
    /** 短信验证码: sms:code:{phone} */
    public static final String SMS_CODE = "sms:code:";
    /** 社区 Feed 流(推模式): feed:user:{userId} */
    public static final String FEED = "feed:user:";
    /** 限流桶: ratelimit:bucket:{key} */
    public static final String RATE_LIMIT = "ratelimit:bucket:";
    /** JWT Header */
    public static final String AUTH_HEADER = "authorization";
    public static final String AUTH_PREFIX = "Bearer ";
    /** 模拟短信验证码（不接真实短信服务） */
    public static final String MOCK_SMS_CODE = "1234";
}
