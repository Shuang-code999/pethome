package com.pethome.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.pethome.common.BizException;
import com.pethome.common.Constants;
import com.pethome.common.ErrorCode;
import com.pethome.entity.Comment;
import com.pethome.entity.Post;
import com.pethome.entity.PostLike;
import com.pethome.entity.User;
import com.pethome.mapper.CommentMapper;
import com.pethome.mapper.FollowMapper;
import com.pethome.mapper.PostLikeMapper;
import com.pethome.mapper.PostMapper;
import com.pethome.mapper.UserMapper;
import com.pethome.util.UserContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 社区：发帖 + Feed 流（Redis ZSet 推模式）+ 点赞/评论
 *  - Feed 推送走 Lua 单次 RTT 完成（替代 O(N) 次 ZSet.add）
 *  - 推送异步化（@Async pethomeAsync）不阻塞主线程
 *  - SQL LIMIT 强制白名单 [1, 50]
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PostService {

    private static final int MAX_PAGE_SIZE = 50;
    private static final int FEED_MAX_LEN = 1000;

    private final PostMapper postMapper;
    private final UserMapper userMapper;
    private final FollowMapper followMapper;
    private final PostLikeMapper postLikeMapper;
    private final CommentMapper commentMapper;
    private final StringRedisTemplate redis;
    private final DefaultRedisScript<Long> feedPushScript;

    /** 发帖：写 DB + 异步推送到粉丝 Feed 收件箱 */
    public Post create(Post post) {
        Long userId = UserContext.require();
        User user = userMapper.selectById(userId);
        post.setUserId(userId);
        post.setAuthor(user == null ? "匿名" : user.getNickname());
        post.setLikes(0);
        post.setComments(0);
        post.setCreateTime(LocalDateTime.now());
        postMapper.insert(post);

        // 推模式：异步执行，不阻塞发帖主线程
        List<Long> receivers = new ArrayList<>(followMapper.findFollowers(userId));
        receivers.add(userId);
        pushFeedAsync(receivers, post.getId(), post.getCreateTime());
        log.info("发帖成功 post={} 推送 {} 人（异步）", post.getId(), receivers.size());
        return post;
    }

    /** 异步推 Feed：Lua 批量写，单次 RTT */
    @Async("pethomeAsync")
    public void pushFeedAsync(List<Long> receivers, Long postId, LocalDateTime createTime) {
        try {
            if (receivers.isEmpty()) return;
            long score = createTime.atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli();
            List<String> keys = receivers.stream()
                    .map(uid -> Constants.FEED + uid)
                    .collect(Collectors.toList());
            redis.execute(feedPushScript, keys,
                    String.valueOf(postId), String.valueOf(score), String.valueOf(FEED_MAX_LEN));
        } catch (Exception e) {
            log.error("Feed 推送失败 postId={} size={}", postId, receivers.size(), e);
        }
    }

    /** Feed 流
     *  - size 强制白名单 [1, MAX_PAGE_SIZE]，杜绝 SQL 注入
     */
    public List<Post> feed(String tab, long max, int size, String type) {
        int safeSize = clampSize(size);
        LambdaQueryWrapper<Post> wrapper = new LambdaQueryWrapper<Post>()
                .eq(type != null && !type.isEmpty() && !"all".equalsIgnoreCase(type), Post::getType, type);
        if ("follow".equals(tab)) {
            Long userId = UserContext.require();
            String key = Constants.FEED + userId;
            Set<String> ids = max == 0
                    ? redis.opsForZSet().reverseRange(key, 0, safeSize - 1L)
                    : redis.opsForZSet().reverseRangeByScore(key, 0, max, 0, safeSize);
            if (ids == null || ids.isEmpty()) return Collections.emptyList();
            List<Long> idList = ids.stream().map(Long::parseLong).collect(Collectors.toList());
            return postMapper.selectBatchIds(idList);
        }
        if ("latest".equals(tab)) {
            return postMapper.selectList(wrapper.orderByDesc(Post::getCreateTime)
                    .last("LIMIT " + safeSize));
        }
        // recommend: 按热度
        return postMapper.selectList(wrapper.orderByDesc(Post::getLikes, Post::getCreateTime)
                .last("LIMIT " + safeSize));
    }

    /** size 白名单：[1, MAX_PAGE_SIZE] */
    private int clampSize(int size) {
        if (size < 1) return 20;
        return Math.min(size, MAX_PAGE_SIZE);
    }

    public Post getById(Long id) {
        Post post = postMapper.selectById(id);
        if (post == null) throw new BizException(ErrorCode.POST_NOT_FOUND);
        return post;
    }

    @Transactional
    public void like(Long postId) {
        Long userId = UserContext.require();
        Post post = postMapper.selectById(postId);
        if (post == null) throw new BizException(ErrorCode.POST_NOT_FOUND);
        PostLike like = new PostLike();
        like.setPostId(postId);
        like.setUserId(userId);
        try {
            postLikeMapper.insert(like);
            postMapper.update(null, new LambdaUpdateWrapper<Post>()
                    .eq(Post::getId, postId)
                    .setSql("likes = likes + 1"));
        } catch (Exception e) {
            throw new BizException(ErrorCode.POST_ALREADY_LIKED);
        }
    }

    @Transactional
    public void unlike(Long postId) {
        Long userId = UserContext.require();
        int rows = postLikeMapper.delete(new LambdaQueryWrapper<PostLike>()
                .eq(PostLike::getPostId, postId)
                .eq(PostLike::getUserId, userId));
        if (rows > 0) {
            postMapper.update(null, new LambdaUpdateWrapper<Post>()
                    .eq(Post::getId, postId)
                    .setSql("likes = GREATEST(likes - 1, 0)"));
        }
    }

    public List<Comment> comments(Long postId) {
        return commentMapper.findByPostId(postId);
    }

    @Transactional
    public Comment comment(Long postId, String content, Long parentId) {
        Long userId = UserContext.require();
        Post post = postMapper.selectById(postId);
        if (post == null) throw new BizException(ErrorCode.POST_NOT_FOUND);
        User user = userMapper.selectById(userId);
        Comment c = new Comment();
        c.setPostId(postId);
        c.setUserId(userId);
        c.setAuthor(user == null ? "匿名" : user.getNickname());
        c.setContent(content);
        c.setParentId(parentId);
        commentMapper.insert(c);
        postMapper.update(null, new LambdaUpdateWrapper<Post>()
                .eq(Post::getId, postId)
                .setSql("comments = comments + 1"));
        return c;
    }

    public boolean isLiked(Long postId) {
        Long userId = UserContext.get();
        if (userId == null) return false;
        return postLikeMapper.selectCount(new LambdaQueryWrapper<PostLike>()
                .eq(PostLike::getPostId, postId)
                .eq(PostLike::getUserId, userId)) > 0;
    }

    /** 某用户的帖子列表（用于用户主页 / 我的帖子） */
    public List<Post> postsByUser(Long userId, int size) {
        int safeSize = clampSize(size);
        return postMapper.selectList(new LambdaQueryWrapper<Post>()
                .eq(Post::getUserId, userId)
                .orderByDesc(Post::getCreateTime)
                .last("LIMIT " + safeSize));
    }

    /**
     * 热门：按 type 分类，按 likes DESC 取前 N（默认 30）
     *  用于问答区/话题活动「热门」tab
     */
    public List<Post> hot(String type, int limit) {
        int safeSize = clampSize(limit <= 0 ? 30 : limit);
        LambdaQueryWrapper<Post> wrapper = new LambdaQueryWrapper<Post>()
                .orderByDesc(Post::getLikes, Post::getCreateTime)
                .last("LIMIT " + safeSize);
        if (StringUtils.hasText(type) && !"all".equalsIgnoreCase(type)) {
            wrapper.eq(Post::getType, type);
        }
        return postMapper.selectList(wrapper);
    }

    /**
     * 推荐：随机 / 同城（简化用 RAND()）+ type 过滤
     *  用于话题活动 / 问答区「推荐」tab
     */
    public List<Post> recommend(String type, String city, int limit) {
        int safeSize = clampSize(limit <= 0 ? 20 : limit);
        // 注意：仅传 ORDER BY RAND() LIMIT N，避免与默认 orderBy 重复
        LambdaQueryWrapper<Post> wrapper = new LambdaQueryWrapper<Post>()
                .last("ORDER BY RAND() LIMIT " + safeSize);
        if (StringUtils.hasText(type) && !"all".equalsIgnoreCase(type)) {
            wrapper.eq(Post::getType, type);
        }
        return postMapper.selectList(wrapper);
    }
}
