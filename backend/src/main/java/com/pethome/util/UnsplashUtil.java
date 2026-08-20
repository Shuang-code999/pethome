package com.pethome.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;

/** Unsplash 图片工具：按关键词搜索宠物图片，本地缓存 1 小时 */
@Slf4j
@Component
public class UnsplashUtil {

    @Value("${unsplash.access-key:}")
    private String accessKey;

    private final RestClient restClient = RestClient.builder()
            .baseUrl("https://api.unsplash.com")
            .build();

    private final ObjectMapper mapper = new ObjectMapper();

    private Cache<String, String> cache;

    @PostConstruct
    public void init() {
        cache = Caffeine.newBuilder()
                .expireAfterWrite(1, TimeUnit.HOURS)
                .maximumSize(200)
                .build();
    }

    /** 按关键词返回一张随机图片 URL（每次调用返回不同图片） */
    public String randomImage(String query) {
        return fetchImage(query);
    }

    /** 按关键词返回图片 URL（缓存版本，同一 query 总是返回同一张图） */
    public String cachedImage(String query) {
        String cached = cache.getIfPresent(query);
        if (cached != null) return cached;
        String url = fetchImage(query);
        if (url != null) cache.put(query, url);
        return url;
    }

    private String fetchImage(String query) {
        if (!hasKey()) {
            log.warn("未配置 Unsplash Access Key");
            return null;
        }
        try {
            String q = URLEncoder.encode(query, StandardCharsets.UTF_8);
            String url = "/search/photos?query=" + q + "&per_page=20&orientation=landscape";
            String json = restClient.get()
                    .uri(url)
                    .header("Authorization", "Client-ID " + accessKey)
                    .retrieve()
                    .body(String.class);
            JsonNode root = mapper.readTree(json);
            JsonNode results = root.get("results");
            if (results == null || !results.isArray() || results.isEmpty()) {
                return null;
            }
            int idx = ThreadLocalRandom.current().nextInt(results.size());
            JsonNode urls = results.get(idx).get("urls");
            return urls.get("small").asText();
        } catch (Exception e) {
            log.warn("Unsplash 请求失败: {}", e.getMessage());
            return null;
        }
    }

    public boolean hasKey() {
        return accessKey != null && !accessKey.isBlank();
    }
}
