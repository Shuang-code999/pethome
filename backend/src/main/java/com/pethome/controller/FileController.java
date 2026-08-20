package com.pethome.controller;

import com.pethome.common.Result;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

/** 文件上传：本地存储，返回 /uploads/xxx 可访问 URL */
@Slf4j
@RestController
@RequestMapping("/file")
@RequiredArgsConstructor
public class FileController {

    @Value("${pethome.upload.dir:uploads}")
    private String uploadDir;

    @PostMapping("/upload")
    public Result<Map<String, String>> upload(@RequestParam("file") MultipartFile file,
                                                  HttpServletRequest req) {
        if (file == null || file.isEmpty()) {
            return Result.fail(400, "请选择文件");
        }
        String original = file.getOriginalFilename();
        String ext = original != null && original.lastIndexOf('.') > 0
                ? original.substring(original.lastIndexOf('.'))
                : "";
        // 限制常见图片格式
        String lower = ext.toLowerCase();
        if (!lower.matches("\\.(jpg|jpeg|png|gif|webp)")) {
            return Result.fail(400, "仅支持 jpg/png/gif/webp 图片");
        }
        String filename = UUID.randomUUID().toString().replace("-", "") + lower;
        try {
            Path dir = Paths.get(uploadDir);
            if (!Files.exists(dir)) Files.createDirectories(dir);
            Path target = dir.resolve(filename);
            file.transferTo(target);
            String url = req.getScheme() + "://" + req.getServerName() + ":" + req.getServerPort()
                    + req.getContextPath() + "/uploads/" + filename;
            return Result.ok(Map.of("url", url, "filename", filename));
        } catch (IOException e) {
            log.error("文件上传失败", e);
            return Result.fail(500, "上传失败");
        }
    }
}
