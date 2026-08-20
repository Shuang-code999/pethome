package com.pethome.controller;

import com.pethome.common.Result;
import com.pethome.util.UnsplashUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Unsplash 图片代理：避免前端暴露 Access Key */
@RestController
@RequestMapping("/image")
@RequiredArgsConstructor
public class UnsplashController {

    private final UnsplashUtil unsplashUtil;

    @GetMapping("/random")
    public Result<Map<String, String>> random(@RequestParam String query) {
        String url = unsplashUtil.randomImage(query);
        if (url == null) {
            return Result.fail(500, "获取图片失败，请检查 Unsplash Key 或关键词");
        }
        return Result.ok(Map.of("url", url));
    }
}
