package com.pethome.config;

import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.io.*;
import java.nio.file.*;
import java.util.*;

/**
 * 开机加载 backend/.env 到 Spring Environment（Spring Boot 3 不原生支持 .env）。
 * 用 EnvironmentPostProcessor 在上下文准备前注入，Spring AI 的 ${BAILIAN_API_KEY} 即可解析。
 */
public class EnvPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment env, org.springframework.boot.SpringApplication app) {
        Map<String, Object> map = new HashMap<>();
        // 找 .env：当前工作目录、项目根、backend/
        for (Path p : new Path[]{Paths.get(".env"), Paths.get("backend/.env"), Paths.get("../.env")}) {
          if (Files.exists(p)) {
            load(p, map);
          }
        }
        if (!map.isEmpty()) {
            env.getPropertySources().addFirst(new MapPropertySource("dotenv", map));
        }
    }

    private void load(Path file, Map<String, Object> map) {
        try (BufferedReader r = Files.newBufferedReader(file)) {
            String line;
            while ((line = r.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) continue;
                int eq = line.indexOf('=');
                if (eq <= 0) continue;
                String k = line.substring(0, eq).trim();
                String v = line.substring(eq + 1).trim();
                if (v.startsWith("\"") && v.endsWith("\"")) v = v.substring(1, v.length() - 1);
                // 仅当系统未设置时注入（系统环境变量优先）
                if (System.getenv(k) == null && System.getProperty(k) == null) {
                    map.put(k, v);
                }
            }
        } catch (IOException ignore) {
        }
    }
}
