package com.pethome.controller;

import com.pethome.common.Result;
import com.pethome.dto.PhoneLoginDTO;
import com.pethome.entity.User;
import com.pethome.mapper.UserMapper;
import com.pethome.service.SmsService;
import com.pethome.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final SmsService smsService;
    private final UserMapper userMapper;

    /** 发送短信验证码（未配置时控制台打印） */
    @PostMapping("/sms/{phone}")
    public Result<Void> sendSmsCode(@PathVariable @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式错误") String phone) {
        smsService.sendSmsCode(phone);
        return Result.ok();
    }

    /** 手机号短信验证码登录/注册 */
    @PostMapping("/login/phone")
    public Result<Map<String, Object>> loginByPhone(@RequestBody @Valid PhoneLoginDTO dto) {
        return Result.ok(userService.loginByPhone(dto.getPhone(), dto.getCode()));
    }

    /** 当前用户资料（需登录） */
    @GetMapping("/me")
    public Result<com.pethome.entity.User> me() {
        return Result.ok(userService.me());
    }

    /** 更新当前用户资料（昵称/头像） */
    @PutMapping("/me")
    public Result<com.pethome.entity.User> updateMe(@RequestBody Map<String, String> body) {
        return Result.ok(userService.updateProfile(body.get("nickname"), body.get("avatar")));
    }

    /** 用户公开主页（不含手机号等隐私字段） */
    @GetMapping("/{id}/profile")
    public Result<Map<String, Object>> profile(@PathVariable Long id) {
        User u = userMapper.selectById(id);
        if (u == null) return Result.fail(404, "用户不存在");
        Map<String, Object> out = new java.util.HashMap<>();
        out.put("id", u.getId());
        out.put("nickname", u.getNickname());
        out.put("avatar", u.getAvatar());
        out.put("createTime", u.getCreateTime());
        return Result.ok(out);
    }
}
