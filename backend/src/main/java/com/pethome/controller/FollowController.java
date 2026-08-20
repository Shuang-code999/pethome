package com.pethome.controller;

import com.pethome.common.Result;
import com.pethome.entity.User;
import com.pethome.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/follow")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    @PostMapping("/{userId}")
    public Result<Void> follow(@PathVariable Long userId) {
        followService.follow(userId);
        return Result.ok();
    }

    @DeleteMapping("/{userId}")
    public Result<Void> unfollow(@PathVariable Long userId) {
        followService.unfollow(userId);
        return Result.ok();
    }

    @GetMapping("/followees")
    public Result<List<User>> followees() {
        return Result.ok(followService.followees());
    }

    @GetMapping("/followers")
    public Result<List<User>> followers() {
        return Result.ok(followService.followers());
    }

    @GetMapping("/is-following/{userId}")
    public Result<Boolean> isFollowing(@PathVariable Long userId) {
        return Result.ok(followService.isFollowing(userId));
    }
}
