package com.pethome.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

/**
 * 高德 Web API 集成（同城服务模块专用）
 *
 * 能力：
 *  1. 关键词搜索：按"宠物医院 / 宠物美容 / 宠物寄养"等关键字返回 POI 列表
 *  2. 周边搜索：以经纬度为中心，返回附近同类商家
 *  3. 每条 POI 内含 photos 数组（实拍图），直接用于前端门店卡片 / 详情
 *
 * 注：高德 Place API v5（"新版"）走 https://restapi.amap.com/v5/place
 *     旧版（v3）已被官方弃用且 photo 字段不再返回真实门店图。
 *     这里使用 v5 + extensions=base（可获得 photos / biz_ext）。
 *
 * 限流：单 key 每日 5000 次；用 Redis 缓存 24h 避免重复打洞。
 */
@Slf4j
@Service
public class AmapService {

    private static final String V5_TEXT = "https://restapi.amap.com/v5/place/text";
    private static final String V5_AROUND = "https://restapi.amap.com/v5/place/around";
    private static final String V5_GEO  = "https://restapi.amap.com/v5/geocode/geo";
    private static final String V3_STATIC_PHOTO = "https://restapi.amap.com/v3/staticphoto";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final StringRedisTemplate redis;
    private final String apiKey;
    private final String defaultCity;

    public AmapService(StringRedisTemplate redis,
                       @Value("${pethome.amap.api-key:}") String apiKey,
                       @Value("${pethome.amap.default-city:北京}") String defaultCity) {
        this.redis = redis;
        this.apiKey = apiKey;
        this.defaultCity = defaultCity;
        if (!StringUtils.hasText(apiKey)) {
            log.warn("[高德] 未配置 AMAP_API_KEY，同城服务将降级为本地占位图");
        } else {
            log.info("[高德] API Key 已配置（默认城市={}）", defaultCity);
        }
    }

    public boolean enabled() {
        return StringUtils.hasText(apiKey);
    }

    /**
     * 关键词搜索：按服务类型 + 城市 找 POI
     *
     * @param keywords 高德 POI 分类关键字（"宠物医院"、"宠物美容"、"宠物寄养"等）
     * @param city     城市名（"北京"），可空，使用默认城市
     * @param limit    返回前 N 条（1-25）
     */
    public List<Map<String, Object>> searchText(String keywords, String city, int limit) {
        if (!enabled()) return List.of();
        String c = StringUtils.hasText(city) ? city : defaultCity;
        String cacheKey = String.format("amap:v2:text:%s:%s:%d", keywords, c, limit);
        return cachedSearch(cacheKey, () -> {
            try {
                String url = String.format("%s?key=%s&keywords=%s&city=%s&citylimit=true&page_size=%d&extensions=base&show_fields=photos,biz_ext",
                        V5_TEXT,
                        apiKey,
                        URLEncoder.encode(keywords, StandardCharsets.UTF_8),
                        URLEncoder.encode(c, StandardCharsets.UTF_8),
                        Math.max(1, Math.min(limit, 25)));
                return fetchAndParse(url);
            } catch (Exception e) {
                log.warn("[高德] text 搜索失败 kw={} city={} err={}", keywords, c, e.toString());
                return List.<Map<String, Object>>of();
            }
        });
    }

    /**
     * 周边搜索：以坐标为中心找 POI
     */
    public List<Map<String, Object>> searchAround(String keywords, double lat, double lng, int radius, int limit) {
        if (!enabled()) return List.of();
        String cacheKey = String.format("amap:v2:around:%.4f:%.4f:%s:%d:%d", lat, lng, keywords, radius, limit);
        return cachedSearch(cacheKey, () -> {
            try {
                String url = String.format("%s?key=%s&keywords=%s&location=%.6f,%.6f&radius=%d&page_size=%d&sortrule=distace&extensions=base&show_fields=photos,biz_ext",
                        V5_AROUND,
                        apiKey,
                        URLEncoder.encode(keywords, StandardCharsets.UTF_8),
                        lng, lat,    // 高德是 "lng,lat"
                        Math.max(100, Math.min(radius, 5000)),
                        Math.max(1, Math.min(limit, 25)));
                return fetchAndParse(url);
            } catch (Exception e) {
                log.warn("[高德] around 搜索失败 kw={} err={}", keywords, e.toString());
                return List.<Map<String, Object>>of();
            }
        });
    }

    /**
     * 地理编码：把城市名转成经纬度坐标（用于 text→around 降级搜索）
     * @return double[]{lng, lat} 或 null
     */
    public double[] geocode(String city) {
        if (!enabled() || !StringUtils.hasText(city)) return null;
        String cacheKey = "amap:v2:geo:" + city;
        try {
            String cached = redis.opsForValue().get(cacheKey);
            if (cached != null && cached.contains(",")) {
                String[] parts = cached.split(",");
                return new double[]{Double.parseDouble(parts[0]), Double.parseDouble(parts[1])};
            }
        } catch (Exception ignored) {}
        try {
            String url = String.format("%s?key=%s&address=%s",
                    V5_GEO, apiKey, URLEncoder.encode(city, StandardCharsets.UTF_8));
            String json = restTemplate.getForObject(new java.net.URI(url), String.class);
            JsonNode root = objectMapper.readTree(json);
            if (!"1".equals(root.path("status").asText(""))) return null;
            JsonNode geocodes = root.path("geocodes");
            if (!geocodes.isArray() || geocodes.isEmpty()) return null;
            String location = geocodes.get(0).path("location").asText("");
            if (!location.contains(",")) return null;
            String[] xy = location.split(",");
            double[] coord = new double[]{Double.parseDouble(xy[0]), Double.parseDouble(xy[1])};
            try { redis.opsForValue().set(cacheKey, coord[0] + "," + coord[1], Duration.ofHours(24)); } catch (Exception ignored) {}
            return coord;
        } catch (Exception e) {
            log.warn("[高德] 地理编码失败 city={} err={}", city, e.toString());
            return null;
        }
    }

    /**
     * 给定一条种子门店（PetStore），按其地址关键词找 POI，挑出照片最匹配的一组
     */
    public List<String> findPhotosForStore(String storeName, String city, String district, String category) {
        if (!enabled()) return List.of();
        String kw = StringUtils.hasText(category) ? category : "宠物服务";
        List<Map<String, Object>> pois = searchText(kw, StringUtils.hasText(city) ? city : defaultCity, 10);
        // 名字相似度最高的优先
        pois.sort((a, b) -> Double.compare(score(b, storeName, district), score(a, storeName, district)));
        List<String> out = new ArrayList<>();
        for (Map<String, Object> p : pois) {
            @SuppressWarnings("unchecked")
            List<String> ph = (List<String>) p.get("photos");
            if (ph != null) out.addAll(ph);
            if (out.size() >= 6) break;
        }
        return out;
    }

    /**
     * 逆地理编码：把经纬度坐标反查成中文城市名（用于 UI 显示）
     * @param lat 纬度
     * @param lng 经度
     * @return Map{ province, city, district, address } 或 null
     */
    public Map<String, String> regeo(double lat, double lng) {
        if (!enabled()) return null;
        String cacheKey = String.format("amap:v2:regeo:%.4f:%.4f", lat, lng);
        try {
            String cached = redis.opsForValue().get(cacheKey);
            if (cached != null && cached.contains("|")) {
                String[] parts = cached.split("\\|", -1);
                if (parts.length >= 4) {
                    Map<String, String> m = new HashMap<>();
                    m.put("province", parts[0]);
                    m.put("city", parts[1]);
                    m.put("district", parts[2]);
                    m.put("address", parts[3]);
                    return m;
                }
            }
        } catch (Exception ignored) {}
        try {
            // 高德 v3 regeo（逆地理编码）接口，返回中文省/市/区
            String url = String.format("https://restapi.amap.com/v3/geocode/regeo?key=%s&location=%.6f,%.6f&extensions=base",
                    apiKey, lng, lat);   // 高德 location 格式为 "lng,lat"
            String json = restTemplate.getForObject(new java.net.URI(url), String.class);
            JsonNode root = objectMapper.readTree(json);
            if (!"1".equals(root.path("status").asText(""))) {
                log.warn("[高德] regeo 失败 lat={},lng={} status={} info={}",
                        lat, lng, root.path("status").asText(), root.path("info").asText());
                return null;
            }
            JsonNode comp = root.path("regeocode").path("addressComponent");
            String province = comp.path("province").asText("");
            String city = comp.path("city").asText("");
            // 直辖市（如上海）city 字段可能为空数组或空字符串，用 province 兜底
            if (city.isEmpty() || "[]".equals(city)) city = province;
            String district = comp.path("district").asText("");
            String address = root.path("regeocode").path("formatted_address").asText("");
            Map<String, String> result = new HashMap<>();
            result.put("province", province);
            result.put("city", city);
            result.put("district", district);
            result.put("address", address);
            try {
                redis.opsForValue().set(cacheKey,
                        province + "|" + city + "|" + district + "|" + address,
                        Duration.ofHours(24));
            } catch (Exception ignored) {}
            log.info("[高德] regeo 成功 lat={},lng={} → {}{}{}",
                    lat, lng, province, city.isEmpty() ? "" : city, district.isEmpty() ? "" : district);
            return result;
        } catch (Exception e) {
            log.warn("[高德] regeo 异常 lat={},lng={} err={}", lat, lng, e.toString());
            return null;
        }
    }

    // ===== 私有 =====

    private double score(Map<String, Object> poi, String name, String district) {
        double s = 0;
        String n = str(poi.get("name"));
        if (StringUtils.hasText(name) && n.contains(name)) s += 5;
        if (StringUtils.hasText(name) && name.contains(n)) s += 3;
        String addr = str(poi.get("address"));
        if (StringUtils.hasText(district) && addr.contains(district)) s += 2;
        @SuppressWarnings("unchecked")
        List<String> ph = (List<String>) poi.get("photos");
        if (ph != null && !ph.isEmpty()) s += 1.0 / (1 + ph.size());
        return s;
    }

    private List<Map<String, Object>> fetchAndParse(String url) throws Exception {
        // 用 URI 对象绕过 RestTemplate 对 String URL 的二次解析/编码，
        // 避免已编码的中文参数（%E5%AE%89…）被再次处理导致高德收到乱码关键词。
        String json = restTemplate.getForObject(new java.net.URI(url), String.class);
        JsonNode root = objectMapper.readTree(json);
        String status = root.path("status").asText("");
        if (!"1".equals(status)) {
            String info = root.path("info").asText("");
            String infocode = root.path("infocode").asText("");
            if ("INVALID_USER_KEY".equals(info) || "10001".equals(infocode)) {
                log.error("[高德] API Key 无效或类型不匹配！后端 REST API 需要「Web服务」类型的 Key，而非「Web端」。" +
                        "请到 https://console.amap.com/dev/key/app 创建「Web服务」类型的 Key，" +
                        "然后设置环境变量 AMAP_API_KEY。当前 status={} info={} code={}", status, info, infocode);
            } else {
                log.warn("[高德] 返回非 1 status={} info={} code={}", status, info, infocode);
            }
            return List.of();
        }
        JsonNode pois = root.path("pois");
        if (!pois.isArray()) return List.of();
        List<Map<String, Object>> out = new ArrayList<>();
        for (JsonNode p : pois) {
            Map<String, Object> poi = new LinkedHashMap<>();
            poi.put("id", p.path("id").asText());
            poi.put("name", p.path("name").asText());
            poi.put("type", p.path("type").asText());
            poi.put("address", p.path("address").asText());
            poi.put("location", p.path("location").asText());
            poi.put("tel", p.path("tel").asText());

            // 解析经纬度
            String loc = p.path("location").asText("");
            if (loc.contains(",")) {
                String[] xy = loc.split(",");
                try {
                    poi.put("lng", Double.parseDouble(xy[0]));
                    poi.put("lat", Double.parseDouble(xy[1]));
                } catch (Exception ignore) {}
            }

            // 评分（高德 v5 不直接返回 rating，使用 biz_ext.rating 兜底）
            String rating = p.path("biz_ext").path("rating").asText("");
            if (StringUtils.hasText(rating)) {
                try { poi.put("rating", Double.parseDouble(rating)); } catch (Exception ignore) {}
            }

            // 照片
            List<String> photos = new ArrayList<>();
            JsonNode photosNode = p.path("photos");
            if (photosNode.isArray()) {
                for (JsonNode ph : photosNode) {
                    String url2 = ph.path("url").asText("");
                    if (StringUtils.hasText(url2)) photos.add(url2);
                }
            }
            poi.put("photos", photos);

            out.add(poi);
        }
        return out;
    }

    private List<Map<String, Object>> cachedSearch(String key, java.util.function.Supplier<List<Map<String, Object>>> loader) {
        try {
            String cached = redis.opsForValue().get(key);
            if (cached != null) {
                List<?> deserialized = objectMapper.readValue(cached, List.class);
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> typed = (List<Map<String, Object>>) deserialized;
                return typed;
            }
        } catch (Exception ignored) {}
        List<Map<String, Object>> list = loader.get();
        try {
            if (!list.isEmpty()) {
                redis.opsForValue().set(key, objectMapper.writeValueAsString(list), Duration.ofHours(24));
            }
        } catch (Exception ignored) {}
        return list;
    }

    private static String str(Object o) {
        return o == null ? "" : o.toString();
    }
}
