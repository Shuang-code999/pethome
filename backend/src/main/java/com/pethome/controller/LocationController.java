package com.pethome.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pethome.common.Result;
import com.pethome.service.AmapService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

/**
 * 地理位置定位接口
 *
 * 降级策略：浏览器 geolocation 被拒/失败时，前端调用此接口通过 IP 反查城市
 * 真实 IP 获取优先级：Cf-Connecting-IP → X-Forwarded-For → X-Real-IP → remoteAddr
 */
@Slf4j
@RestController
@RequestMapping("/location")
public class LocationController {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AmapService amapService;

    public LocationController(AmapService amapService) {
        this.amapService = amapService;
    }

    /**
     * 根据客户端 IP 反查城市
     * GET /api/location/ip-city
     *
     * @return { city, region, country, lat, lng, ip, source }
     */
    @GetMapping("/ip-city")
    public Result<Map<String, Object>> ipCity(HttpServletRequest request) {
        String clientIp = extractClientIp(request);
        // 诊断日志：打印所有 IP 相关头
        log.info("[IP定位-DIAG] remoteAddr={} | Cf-Connecting-IP={} | X-Forwarded-For={} | X-Real-IP={}",
                request.getRemoteAddr(),
                request.getHeader("Cf-Connecting-IP"),
                request.getHeader("X-Forwarded-For"),
                request.getHeader("X-Real-IP"));
        Map<String, Object> result = new HashMap<>();
        result.put("ip", clientIp);
        result.put("source", "ip-api.com");

        try {
            // ip-api.com 免费版：无需 API key，支持 JSON 格式，限速 45 req/min
            String url = String.format("http://ip-api.com/json/%s?lang=zh-CN&fields=status,message,country,regionName,city,lat,lon,query",
                    clientIp);
            String json = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(json);

            if ("success".equalsIgnoreCase(root.path("status").asText())) {
                result.put("country", root.path("country").asText(""));
                result.put("region", root.path("regionName").asText(""));
                String city = root.path("city").asText("");
                result.put("city", city);
                result.put("lat", root.path("lat").asDouble(0));
                result.put("lng", root.path("lon").asDouble(0));
                log.info("[IP定位] ip={} → country={} region={} city={}",
                        clientIp, result.get("country"), result.get("region"), city);
            } else {
                String msg = root.path("message").asText("unknown");
                log.warn("[IP定位] ip-api 返回失败: ip={} msg={}", clientIp, msg);
                result.put("city", "");
                result.put("error", msg);
            }
        } catch (Exception e) {
            log.warn("[IP定位] 调用 ip-api.com 异常: {}", e.toString());
            result.put("city", "");
            result.put("error", e.getMessage());
        }

        return Result.ok(result);
    }

    /**
     * 逆地理编码：根据经纬度反查中文城市名（用于前端 UI 显示）
     * GET /api/location/regeo?lat=xxx&lng=xxx
     *
     * 前端拿到浏览器精确定位坐标后调用此接口获取中文城市名（如"上海市嘉定区"）
     * 用于显示，不影响坐标精度
     *
     * @return { province, city, district, address } 或空
     */
    @GetMapping("/regeo")
    public Result<Map<String, String>> regeo(
            @RequestParam double lat,
            @RequestParam double lng) {
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return Result.fail("坐标范围非法");
        }
        Map<String, String> result = amapService.regeo(lat, lng);
        if (result == null) {
            return Result.fail("逆地理编码失败");
        }
        return Result.ok(result);
    }

    /** 从请求头提取真实客户端 IP */
    private String extractClientIp(HttpServletRequest request) {
        // Cloudflare Tunnel 会注入 Cf-Connecting-IP
        String[] headers = {
                "Cf-Connecting-IP",
                "cf-connecting-ip",
                "X-Forwarded-For",
                "x-forwarded-for",
                "X-Real-IP",
                "x-real-ip",
                "Proxy-Client-IP",
                "proxy-client-ip"
        };
        for (String h : headers) {
            String val = request.getHeader(h);
            if (val != null && !val.isBlank() && !"unknown".equalsIgnoreCase(val)) {
                // X-Forwarded-For 可能是逗号分隔的多个 IP，取第一个
                int comma = val.indexOf(',');
                String ip = comma > 0 ? val.substring(0, comma).trim() : val.trim();
                if (!ip.isEmpty()) return ip;
            }
        }
        return request.getRemoteAddr();
    }
}
