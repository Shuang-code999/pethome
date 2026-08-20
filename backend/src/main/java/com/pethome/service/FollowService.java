package com.pethome.service;

import com.pethome.common.BizException;
import com.pethome.entity.User;
import com.pethome.mapper.FollowMapper;
import com.pethome.mapper.UserMapper;
import com.pethome.util.UserContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final FollowMapper followMapper;
    private final UserMapper userMapper;

    public void follow(Long targetId) {
        Long userId = UserContext.require();
        if (userId.equals(targetId)) throw new BizException(400, "不能关注自己");
        User target = userMapper.selectById(targetId);
        if (target == null) throw new BizException(404, "用户不存在");
        if (followMapper.isFollowing(userId, targetId) > 0) return;
        followMapper.follow(userId, targetId);
    }

    public void unfollow(Long targetId) {
        Long userId = UserContext.require();
        followMapper.unfollow(userId, targetId);
    }

    public List<User> followees() {
        return followMapper.findFolloweeUsers(UserContext.require());
    }

    public List<User> followers() {
        List<Long> ids = followMapper.findFollowers(UserContext.require());
        if (ids.isEmpty()) return List.of();
        return userMapper.selectBatchIds(ids);
    }

    public boolean isFollowing(Long targetId) {
        return followMapper.isFollowing(UserContext.require(), targetId) > 0;
    }
}
