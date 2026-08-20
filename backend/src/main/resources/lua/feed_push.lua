-- Feed 推模式：批量写 ZSet + 截断，单次 RTT 完成
-- KEYS = feed:user:{userId1}, feed:user:{userId2}, ...
-- ARGV[1] = postId
-- ARGV[2] = score (post.createTime ms)
-- ARGV[3] = maxLen (收件箱保留最大长度)
for i = 1, #KEYS do
    redis.call('ZADD', KEYS[i], ARGV[2], ARGV[1])
    -- 保留 score 最大的 maxLen 条（按 score 从大到小排，截断头部低分）
    local size = redis.call('ZCARD', KEYS[i])
    if size > tonumber(ARGV[3]) then
        redis.call('ZREMRANGEBYRANK', KEYS[i], 0, size - tonumber(ARGV[3]) - 1)
    end
end
return #KEYS
