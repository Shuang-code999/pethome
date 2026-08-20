-- 令牌桶限流（Lua 原子）
-- KEYS[1] = ratelimit:bucket:{key}
-- ARGV[1] = capacity  桶容量
-- ARGV[2] = tokens    每秒补充速率
-- ARGV[3] = now        当前时间戳(秒)
-- ARGV[4] = requested  申请 token 数(通常1)
-- 返回: 1 放行 / 0 拒绝
local bucket = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local current = tonumber(bucket[1])
local last_ts = tonumber(bucket[2])
local capacity = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local requested = tonumber(ARGV[4])

if current == nil or last_ts == nil then
    current = capacity
    last_ts = now
end

-- 按时间差补充令牌
local delta = math.max(0, now - last_ts)
current = math.min(capacity, current + delta * rate)

local allowed = 0
if current >= requested then
    current = current - requested
    allowed = 1
end

redis.call('HMSET', KEYS[1], 'tokens', current, 'ts', now)
redis.call('EXPIRE', KEYS[1], 60)
return allowed
