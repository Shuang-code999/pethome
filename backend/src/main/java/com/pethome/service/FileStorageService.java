package com.pethome.service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/** 本地图片存储服务 */
@Slf4j
@Service
public class FileStorageService {

    @Value("${pethome.upload.dir:uploads}")
    private String uploadDir;

    public String getUploadDir() {
        return uploadDir;
    }

    public String store(MultipartFile file) throws IOException {
        String original = file.getOriginalFilename();
        String ext = original != null && original.lastIndexOf('.') > 0
                ? original.substring(original.lastIndexOf('.'))
                : "";
        String lower = ext.toLowerCase();
        if (!lower.matches("\\.(jpg|jpeg|png|gif|webp)")) {
            throw new IllegalArgumentException("仅支持 jpg/png/gif/webp 图片");
        }
        String filename = UUID.randomUUID().toString().replace("-", "") + lower;
        Path dir = Paths.get(uploadDir);
        if (!Files.exists(dir)) Files.createDirectories(dir);
        Path target = dir.resolve(filename);
        file.transferTo(target);
        return "/uploads/" + filename;
    }

    public String toAbsoluteUrl(String path, HttpServletRequest req) {
        if (path == null) return null;
        if (path.startsWith("http")) return path;
        String ctx = req.getContextPath();
        if (ctx == null) ctx = "";
        return req.getScheme() + "://" + req.getServerName() + ":" + req.getServerPort() + ctx + path;
    }
}
