package com.pethome.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.pethome.common.BizException;
import com.pethome.common.Constants;
import com.pethome.entity.User;
import com.pethome.mapper.UserMapper;
import com.pethome.util.JwtUtil;
import com.pethome.util.UserContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;
    private final StringRedisTemplate redis;
    private final JwtUtil jwtUtil;

    /** 手机号短信验证码登录：校验验证码，用户不存在则自动注册，签发 JWT */
    public Map<String, Object> loginByPhone(String phone, String code) {
        String cache = redis.opsForValue().get(Constants.SMS_CODE + phone);
        if (cache == null || !cache.equals(code)) {
            throw new BizException(400, "验证码错误或已过期");
        }
        redis.delete(Constants.SMS_CODE + phone);

        User user = userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getPhone, phone));
        if (user == null) {
            user = new User();
            user.setPhone(phone);
            String tail = phone.length() >= 4 ? phone.substring(phone.length() - 4) : phone;
            user.setNickname("宠友" + tail);
            userMapper.insert(user);
        }
        String token = jwtUtil.create(user.getId());
        Map<String, Object> res = new HashMap<>();
        res.put("token", token);
        res.put("user", user);
        return res;
    }

    /** 当前登录用户信息 */
    public User me() {
        return userMapper.selectById(UserContext.require());
    }

    /** 更新当前用户资料（昵称、头像） */
    public User updateProfile(String nickname, String avatar) {
        Long uid = UserContext.require();
        User user = userMapper.selectById(uid);
        if (user == null) throw new BizException(404, "用户不存在");
        if (nickname != null && !nickname.isBlank()) {
            String n = nickname.trim();
            if (n.length() > 32) n = n.substring(0, 32);
            user.setNickname(n);
        }
        if (avatar != null && !avatar.isBlank()) {
            user.setAvatar(avatar);
        }
        userMapper.updateById(user);
        return user;
    }
}
