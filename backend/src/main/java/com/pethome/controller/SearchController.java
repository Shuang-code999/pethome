package com.pethome.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.pethome.common.Result;
import com.pethome.entity.Post;
import com.pethome.entity.Product;
import com.pethome.mapper.PostMapper;
import com.pethome.mapper.ProductMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 全局搜索：商品 + 帖子
 *  - 公开端点（不需登录）
 *  - 商品：name / tags / category 模糊
 *  - 帖子：title / body 模糊
 *  - 关键：手工按 UTF-8 解码 query string，绕开 Tomcat 默认 ISO-8859-1 解码导致中文乱码
 */
@RestController
@RequestMapping("/search")
@RequiredArgsConstructor
@Slf4j
public class SearchController {

    private final ProductMapper productMapper;
    private final PostMapper postMapper;
    private final DataSource dataSource;

    @GetMapping
    public Result<Map<String, Object>> search(HttpServletRequest req) {
        // 直接从原始 queryString 解析（不依赖 Tomcat 解码）
        String q = extractQFromRawQuery(req);
        log.info("[搜索] 原始 queryString={} 解析 q='{}' encoding={}",
                req.getQueryString(), q, req.getCharacterEncoding());
        if (!StringUtils.hasText(q)) {
            return Result.ok(Map.of("products", List.of(), "posts", List.of(), "q", ""));
        }
        final String kw = q.trim();

        // 诊断：当前 JDBC 连接字符集（首请求打印一次）
        diagnoseCharsetOnce();

        List<Product> products = productMapper.selectList(new LambdaQueryWrapper<Product>()
                .eq(Product::getStatus, 1)
                .and(w -> w.like(Product::getName, kw)
                        .or().like(Product::getTags, kw)
                        .or().like(Product::getCategory, kw))
                .orderByDesc(Product::getSales)
                .last("LIMIT 20"));

        List<Post> posts = postMapper.selectList(new LambdaQueryWrapper<Post>()
                .and(w -> w.like(Post::getTitle, kw).or().like(Post::getBody, kw))
                .orderByDesc(Post::getLikes, Post::getCreateTime)
                .last("LIMIT 20"));

        Map<String, Object> out = new HashMap<>();
        out.put("products", products);
        out.put("posts", posts);
        out.put("q", kw);
        return Result.ok(out);
    }

    private static volatile boolean DIAG_DONE = false;

    private void diagnoseCharsetOnce() {
        if (DIAG_DONE) return;
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            String[] diag = {
                "character_set_client", "character_set_connection", "character_set_results",
                "character_set_database", "character_set_server", "collation_database"
            };
            for (String v : diag) {
                stmt.execute("SHOW VARIABLES LIKE '" + v + "'");
                ResultSet rs = stmt.getResultSet();
                if (rs != null && rs.next()) {
                    log.info("[charset] {} = {}", rs.getString(1), rs.getString(2));
                }
            }
        } catch (Exception e) {
            log.warn("[charset] 诊断失败", e);
        }
        DIAG_DONE = true;
    }

    /**
     * 从原始 queryString（仍 URL 编码）里解析 ?q= 值，按 UTF-8 解码
     *  绕开 Tomcat 对 queryString 默认 ISO-8859-1 解码导致的中文乱码
     */
    private static String extractQFromRawQuery(HttpServletRequest req) {
        String raw = req.getQueryString();
        if (raw == null) return "";
        for (String part : raw.split("&")) {
            int eq = part.indexOf('=');
            if (eq < 0) continue;
            String key;
            try {
                key = URLDecoder.decode(part.substring(0, eq), StandardCharsets.UTF_8);
            } catch (Exception e) {
                key = part.substring(0, eq);
            }
            if ("q".equals(key)) {
                try {
                    return URLDecoder.decode(part.substring(eq + 1), StandardCharsets.UTF_8);
                } catch (Exception e) {
                    return part.substring(eq + 1);
                }
            }
        }
        return "";
    }
}
