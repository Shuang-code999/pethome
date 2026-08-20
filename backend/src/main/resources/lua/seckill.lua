-- 秒杀原子操作：时间校验 + 扣库存 + 防重复，全部在 Redis 完成
-- KEYS[1] = seckill:stock:{voucherId}    库存值
-- KEYS[2] = seckill:user:{voucherId}     已抢用户 Set
-- KEYS[3] = seckill:meta:{voucherId}     voucher 元信息 Hash {begin, end}
-- ARGV[1] = userId
-- ARGV[2] = nowMs (客户端时间不可信，用服务端时间)
-- 返回:
--   0  成功
--   1  库存不足
--   2  重复下单
--   3  未开始
--   4  已结束
--   5  元信息缺失（需上层回源 DB 后重试）
if redis.call('SISMEMBER', KEYS[2], ARGV[1]) == 1 then
    return 2
end
local meta = redis.call('HMGET', KEYS[3], 'begin', 'ended')
local beginTs = tonumber(meta[1])
local endTs = tonumber(meta[2])
if beginTs == nil or endTs == nil then
    return 5
end
local now = tonumber(ARGV[2])
if now < beginTs then
    return 3
end
if now > endTs then
    return 4
end
local stock = tonumber(redis.call('GET', KEYS[1]))
if stock == nil or stock <= 0 then
    return 1
end
redis.call('DECR', KEYS[1])
redis.call('SADD', KEYS[2], ARGV[1])
return 0
