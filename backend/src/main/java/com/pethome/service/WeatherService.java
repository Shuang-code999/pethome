package com.pethome.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/** OpenWeatherMap 天气服务：根据坐标获取实时天气 + 宠物出行建议 */
@Slf4j
@Service
public class WeatherService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final StringRedisTemplate redis;
    private final String apiKey;
    private final boolean enabled;

    public WeatherService(StringRedisTemplate redis,
                          @Value("${pethome.weather.api-key:}") String apiKey) {
        this.redis = redis;
        this.apiKey = apiKey;
        this.enabled = StringUtils.hasText(apiKey);
        if (!enabled) {
            log.info("[天气] OpenWeatherMap 未配置 API Key，天气功能不可用");
        }
    }

    /** 获取天气 + 宠物出行建议，Redis 缓存 1 小时（按坐标精度 2 位） */
    public Map<String, Object> getWeather(double lat, double lng) {
        // 坐标精度 2 位 ≈ 1.1km 范围，同区域复用缓存
        String cacheKey = String.format("weather:%.2f:%.2f", lat, lng);
        String cached = redis.opsForValue().get(cacheKey);
        if (cached != null) {
            try {
                return objectMapper.readValue(cached, Map.class);
            } catch (Exception ignored) {}
        }

        if (!enabled) {
            return defaultWeather();
        }

        try {
            String url = String.format(
                "https://api.openweathermap.org/data/2.5/weather?lat=%.4f&lon=%.4f&appid=%s&units=metric&lang=zh_cn",
                lat, lng, apiKey);
            String json = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(json);

            Map<String, Object> result = new HashMap<>();
            result.put("temp", root.path("main").path("temp").asDouble());
            result.put("feelsLike", root.path("main").path("feels_like").asDouble());
            result.put("humidity", root.path("main").path("humidity").asInt());
            result.put("description", root.path("weather").get(0).path("description").asText(""));
            result.put("icon", root.path("weather").get(0).path("icon").asText(""));
            result.put("wind", root.path("wind").path("speed").asDouble());
            // 城市名：OpenWeatherMap 返回英文拼音（如 Houjiajiao），标记让前端判断
            String cityName = root.path("name").asText("");
            result.put("city", cityName);
            // 如果是纯拉丁字母/拼音（不含 CJK），前端可显示"当地"
            if (cityName.matches("^[a-zA-Z\\s\\-'.]+$")) {
                result.put("_cityPinyin", true);
            }

            // 生成宠物出行建议
            double temp = root.path("main").path("temp").asDouble();
            String desc = root.path("weather").get(0).path("main").asText("");
            Map<String, String> advice = generatePetAdvice(temp, desc);
            result.put("advice", advice.get("text"));
            result.put("adviceIcon", advice.get("icon"));
            result.put("adviceLevel", advice.get("level"));

            // 缓存 1 小时
            redis.opsForValue().set(cacheKey, objectMapper.writeValueAsString(result), Duration.ofHours(1));
            return result;
        } catch (Exception e) {
            log.warn("[天气] API 调用失败 lat={} lng={}", lat, lng, e);
            return defaultWeather();
        }
    }

    /** 根据温度和天气生成宠物出行建议 */
    private Map<String, String> generatePetAdvice(double temp, String weatherMain) {
        Map<String, String> advice = new HashMap<>();

        if ("Rain".equals(weatherMain) || "Drizzle".equals(weatherMain) || "Thunderstorm".equals(weatherMain)) {
            advice.put("text", "雨雪天气，建议室内活动，出门记得给宠物穿雨衣");
            advice.put("icon", "🌧️");
            advice.put("level", "warn");
        } else if ("Snow".equals(weatherMain)) {
            advice.put("text", "下雪天气，短毛犬注意保暖，出门穿宠物衣服");
            advice.put("icon", "❄️");
            advice.put("level", "warn");
        } else if (temp > 35) {
            advice.put("text", "高温预警！避免午间遛狗，注意防暑降温，多备饮水");
            advice.put("icon", "🔥");
            advice.put("level", "danger");
        } else if (temp > 30) {
            advice.put("text", "天气炎热，建议早晚遛狗，避免长时间户外活动");
            advice.put("icon", "☀️");
            advice.put("level", "warn");
        } else if (temp < 5) {
            advice.put("text", "低温天气，给短毛犬穿衣服，注意爪子防冻");
            advice.put("icon", "🧥");
            advice.put("level", "warn");
        } else if (temp >= 15 && temp <= 28) {
            advice.put("text", "天气适宜，适合带宠物出门散步、玩耍");
            advice.put("icon", "🌤️");
            advice.put("level", "ok");
        } else {
            advice.put("text", "天气尚可，可正常带宠物出门活动");
            advice.put("icon", "⛅");
            advice.put("level", "ok");
        }
        return advice;
    }

    private Map<String, Object> defaultWeather() {
        Map<String, Object> result = new HashMap<>();
        result.put("temp", 25.0);
        result.put("description", "天气数据暂不可用");
        result.put("advice", "无法获取天气，建议查看本地天气预报");
        result.put("adviceIcon", "🌡️");
        result.put("adviceLevel", "info");
        return result;
    }
}
