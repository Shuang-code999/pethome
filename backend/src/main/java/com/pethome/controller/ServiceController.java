package com.pethome.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.pethome.common.BizException;
import com.pethome.common.Result;
import com.pethome.entity.PetStore;
import com.pethome.entity.ServiceOrder;
import com.pethome.mapper.PetStoreMapper;
import com.pethome.mapper.ServiceOrderMapper;
import com.pethome.service.AmapService;
import com.pethome.util.UserContext;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * 同城服务：
 * 1. 通用列表：6 类服务 × 7 宠物类型过滤
 * 2. 每个类型独立的 list/book 端点，体现「后端跳转链接」语义
 */
@RestController
@RequestMapping("/service")
@RequiredArgsConstructor
public class ServiceController {

    private final PetStoreMapper petStoreMapper;
    private final ServiceOrderMapper serviceOrderMapper;
    private final AmapService amapService;

    /** 7 类服务 ↔ 高德 POI 搜索关键字的映射（用于拉真实门店照）
     *  每个子模块搜不同关键词 → 返回不同商家 */
    private static final Map<String, String> TYPE_TO_AMAP_KW = Map.of(
            "bath",       "宠物洗澡",
            "feeding",    "宠物上门喂养",
            "grooming",   "宠物美容",
            "walking",    "宠物遛狗",
            "boarding",   "宠物寄养",
            "transport",  "宠物托运",
            "training",   "宠物训练学校",
            "photography","宠物摄影",
            "funeral",    "宠物殡葬"
    );

    /** 6 大服务类型元数据 */
    private static final List<Map<String, Object>> SERVICE_TYPES = List.of(
            Map.of("code", "feeding", "name", "上门喂养", "mode", "上门",
                    "desc", "上门喂猫狗、清粪便、陪玩", "icon", "UtensilsCrossed", "color", "amber"),
            Map.of("code", "grooming", "name", "洗护美容", "mode", "到店+上门",
                    "desc", "洗澡、修剪、造型，到店或上门均可", "icon", "Sparkles", "color", "pink"),
            Map.of("code", "boarding", "name", "寄养托管", "mode", "到店",
                    "desc", "临时寄养、日托，含 24h 监控", "icon", "Home", "color", "blue"),
            Map.of("code", "transport", "name", "运输服务", "mode", "上门",
                    "desc", "接送、专车、上门取送、跨城搬家", "icon", "Bus", "color", "teal"),
            Map.of("code", "training", "name", "宠物训练", "mode", "到店",
                    "desc", "行为纠正、技能训练、社会化课程", "icon", "GraduationCap", "color", "indigo"),
            Map.of("code", "funeral", "name", "宠物殡葬", "mode", "上门",
                    "desc", "遗体处理、告别仪式、纪念品定制", "icon", "Flower2", "color", "gray")
    );

    /** 7 个宠物类型筛选 */
    private static final List<String> PET_TYPES = List.of(
            "全部", "狗狗", "猫猫", "小宠", "爬宠", "鸟类", "水族"
    );

    /** 6 类 service_type */
    private static final Set<String> VALID_TYPES = Set.of(
            "feeding", "grooming", "boarding", "transport", "training", "funeral"
    );

    // ============ 元数据接口 ============

    @GetMapping("/types")
    public Result<List<Map<String, Object>>> types() {
        return Result.ok(SERVICE_TYPES);
    }

    @GetMapping("/pet-types")
    public Result<List<String>> petTypes() {
        return Result.ok(PET_TYPES);
    }

    /** 兼容旧版 categories 接口 */
    @GetMapping("/categories")
    public Result<List<String>> categories() {
        return Result.ok(PET_TYPES);
    }

    // ============ 通用服务方查询 ============

    /**
     * 服务方列表（按类型/宠物类型/模式/排序过滤）
     * @param type feeding/grooming/boarding/transport/training/funeral（不传=全部）
     * @param pet 狗狗/猫猫/小宠/爬宠/鸟类/水族/全部（不传或全部=不过滤）
     * @param mode 到店/上门/双向（不传=不过滤）
     * @param sort distance/rating/default
     */
    @GetMapping("/services")
    public Result<List<PetStore>> services(@RequestParam(required = false) String type,
                                          @RequestParam(required = false) String pet,
                                          @RequestParam(required = false) String mode,
                                          @RequestParam(required = false, defaultValue = "distance") String sort) {
        return Result.ok(queryStores(type, pet, mode, sort));
    }

    @GetMapping("/services/{id}")
    public Result<PetStore> serviceDetail(@PathVariable Long id) {
        PetStore s = petStoreMapper.selectById(id);
        if (s == null) throw new BizException(404, "服务方不存在");
        if (s.getBookingUrl() == null || s.getBookingUrl().isBlank()) {
            s.setBookingUrl("/api/service/" + (s.getServiceType() == null ? "" : s.getServiceType()) + "/book/" + id);
        }
        return Result.ok(s);
    }

    /** 每个类型独立列表接口（语义化跳转链接） */
    @GetMapping("/{type}/list")
    public Result<List<PetStore>> typeList(@PathVariable String type,
                                           @RequestParam(required = false) String pet,
                                           @RequestParam(required = false, defaultValue = "distance") String sort) {
        if (!VALID_TYPES.contains(type)) throw new BizException(400, "未知服务类型");
        return Result.ok(queryStores(type, pet, null, sort));
    }

    // ============ 高德门店照片相关 ============

    /**
     * 高德搜索：按服务类型 + 城市返回 POI 列表（含真实门店照片）。
     * 前端 ServicePageTemplate 用此接口渲染卡片大图与详情。
     *
     * 改进：优先用 around 搜索——先地理编码拿城市坐标，再以坐标为圆心做周边搜索，
     * 这样不同子模块（洗护/寄养/殡葬…）各自搜不同关键词，能返回不同的附近商家。
     *
     * 兜底逻辑：高德未配置 / 搜索 0 结果时，从本地 pet_store 表读取同 service_type 的商家。
     *
     * GET /api/service/amap-search?type=feeding&city=北京&limit=10
     */
    @GetMapping("/amap-search")
    public Result<List<Map<String, Object>>> amapSearch(@RequestParam(required = false) String type,
                                                        @RequestParam(required = false) String city,
                                                        @RequestParam(required = false, defaultValue = "12") Integer limit) {
        String kw = TYPE_TO_AMAP_KW.getOrDefault(type, "宠物服务");
        String targetCity = StringUtils.hasText(city) ? city : "北京";

        // 1) 优先 around 搜索：先地理编码拿城市坐标，再以坐标为圆心搜周边（不同关键词→不同商家）
        double[] coord = amapService.geocode(targetCity);
        if (coord != null) {
            List<Map<String, Object>> pois = amapService.searchAround(kw, coord[1], coord[0], 15000, limit);
            if (pois != null && !pois.isEmpty()) {
                return Result.ok(pois);
            }
        }

        // 2) around 没结果时，用原始 text 搜索兜底
        List<Map<String, Object>> pois = amapService.searchText(kw, city, limit);
        if (pois != null && !pois.isEmpty()) {
            return Result.ok(pois);
        }

        // 3) Fallback：本地 pet_store 表（slug 适配：bath→grooming, walking→feeding, photography→grooming）
        String storeType = switch (type == null ? "" : type) {
            case "bath"        -> "grooming";   // 本地表没有 bath，归到 grooming
            case "walking"     -> "feeding";    // walking 没有本地表，归到 feeding（同为上门服务）
            case "photography" -> "grooming";   // photography 没有本地表，归到 grooming（摄影造型相关）
            default            -> type;
        };
        List<PetStore> stores = queryStores(storeType, null, null, "distance");
        if (stores.size() > limit) stores = stores.subList(0, limit);
        return Result.ok(storesToPois(stores));
    }

    /** 把 PetStore 列表转换成前端需要的 POI 形态（保持高德 POI 字段名一致）
     *  标记 _fallback=true，前端可据此隐藏虚假字段（电话、距离等） */
    private List<Map<String, Object>> storesToPois(List<PetStore> stores) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (PetStore s : stores) {
            Map<String, Object> p = new LinkedHashMap<>();
            p.put("id", String.valueOf(s.getId()));
            p.put("name", s.getName());
            p.put("type", s.getServiceType());
            p.put("address", s.getAddress() != null ? s.getAddress() : "");
            p.put("location", s.getLng() != null && s.getLat() != null ? s.getLng() + "," + s.getLat() : "");
            p.put("tel", s.getTel() == null ? "" : s.getTel());
            p.put("rating", s.getRating());
            // 兜底图：photo 为空时返回 null，前端 PetImg 用渐变占位
            p.put("photos", s.getPhoto() != null && !s.getPhoto().isBlank() ? List.of(s.getPhoto()) : List.of());
            // 额外字段（详情页可用）
            p.put("distance", s.getDistance());
            p.put("openTime", s.getOpenTime());
            p.put("tags", s.getTags());
            p.put("description", s.getDescription());
            p.put("priceRange", s.getPriceRange());
            p.put("serviceMode", s.getServiceMode());
            p.put("petTypes", s.getPetTypes());
            // 标记为 fallback 数据——前端据此隐藏虚假电话/距离并显示提示
            p.put("_fallback", true);
            out.add(p);
        }
        return out;
    }

    /**
     * 高德周边搜索：以经纬度为中心找附近门店。
     * GET /api/service/amap-around?type=grooming&lng=116.47&lat=39.92&radius=3000
     *
     * 修复：之前无论前端传什么 type，关键词都退化为「宠物」，导致洗护/美容/寄养等
     * 不同子模块都返回同一批附近门店。现在按 type 走 TYPE_TO_AMAP_KW 拿到对应的
     * 高德分类关键词（如「宠物美容」），保证每个子模块只搜自己品类的门店。
     */
    @GetMapping("/amap-around")
    public Result<List<Map<String, Object>>> amapAround(@RequestParam(required = false) String type,
                                                        @RequestParam(required = false) String keywords,
                                                        @RequestParam double lng,
                                                        @RequestParam double lat,
                                                        @RequestParam(required = false, defaultValue = "3000") Integer radius,
                                                        @RequestParam(required = false, defaultValue = "10") Integer limit) {
        String kw;
        if (StringUtils.hasText(keywords)) {
            kw = keywords;
        } else if (StringUtils.hasText(type)) {
            // 用每个服务子类型对应的细分关键词，避免 7 类全部命中同一批「宠物」店
            kw = TYPE_TO_AMAP_KW.getOrDefault(type, "宠物");
        } else {
            kw = "宠物";
        }
        return Result.ok(amapService.searchAround(kw, lat, lng, radius, limit));
    }

    /**
     * 高德门店照片池：前端用此为已有 PetStore 列表补真实照片。
     * GET /api/service/amap-photos?type=feeding&city=北京&count=6
     */
    @GetMapping("/amap-photos")
    public Result<List<String>> amapPhotos(@RequestParam(required = false) String type,
                                          @RequestParam(required = false) String city,
                                          @RequestParam(required = false, defaultValue = "6") Integer count) {
        String kw = TYPE_TO_AMAP_KW.getOrDefault(type, "宠物服务");
        List<Map<String, Object>> pois = amapService.searchText(kw, city, 10);
        List<String> photos = new ArrayList<>();
        for (Map<String, Object> p : pois) {
            @SuppressWarnings("unchecked")
            List<String> ph = (List<String>) p.get("photos");
            if (ph != null) photos.addAll(ph);
            if (photos.size() >= count) break;
        }
        return Result.ok(photos);
    }

    // ============ 6 个类型独立的下单接口 ============

    /** 上门喂养下单 */
    @PostMapping("/feeding/book/{id}")
    public Result<ServiceOrder> bookFeeding(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return Result.ok(bookService(id, "feeding", body, true));
    }

    /** 洗护美容下单 */
    @PostMapping("/grooming/book/{id}")
    public Result<ServiceOrder> bookGrooming(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return Result.ok(bookService(id, "grooming", body, false));
    }

    /** 寄养托管下单 */
    @PostMapping("/boarding/book/{id}")
    public Result<ServiceOrder> bookBoarding(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return Result.ok(bookService(id, "boarding", body, false));
    }

    /** 运输服务下单 */
    @PostMapping("/transport/book/{id}")
    public Result<ServiceOrder> bookTransport(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return Result.ok(bookService(id, "transport", body, true));
    }

    /** 宠物训练下单 */
    @PostMapping("/training/book/{id}")
    public Result<ServiceOrder> bookTraining(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return Result.ok(bookService(id, "training", body, false));
    }

    /** 宠物殡葬下单 */
    @PostMapping("/funeral/book/{id}")
    public Result<ServiceOrder> bookFuneral(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return Result.ok(bookService(id, "funeral", body, true));
    }

    /** 我的同城服务订单 */
    @GetMapping("/orders/mine")
    public Result<List<ServiceOrder>> myOrders() {
        Long userId = UserContext.require();
        return Result.ok(serviceOrderMapper.selectList(
                new LambdaQueryWrapper<ServiceOrder>()
                        .eq(ServiceOrder::getUserId, userId)
                        .orderByDesc(ServiceOrder::getCreateTime)));
    }

    // ============ 私有工具方法 ============

    private List<PetStore> queryStores(String type, String pet, String mode, String sort) {
        LambdaQueryWrapper<PetStore> w = new LambdaQueryWrapper<>();
        if (type != null && !type.isBlank() && !VALID_TYPES.contains(type)) {
            // 未知 type 不过滤，返回空
            return List.of();
        }
        if (type != null && !type.isBlank()) {
            w.eq(PetStore::getServiceType, type);
        }
        if (pet != null && !pet.isBlank() && !"全部".equals(pet)) {
            w.and(qw -> qw.like(PetStore::getPetTypes, pet));
        }
        if (mode != null && !mode.isBlank()) {
            w.and(qw -> qw.eq(PetStore::getServiceMode, mode)
                    .or().eq(PetStore::getServiceMode, "双向"));
        }
        switch (sort == null ? "distance" : sort) {
            case "rating":
                w.orderByDesc(PetStore::getRating).orderByAsc(PetStore::getDistance);
                break;
            case "distance":
            default:
                w.orderByAsc(PetStore::getDistance).orderByDesc(PetStore::getRating);
                break;
        }
        List<PetStore> list = petStoreMapper.selectList(w);
        // 补充 booking_url（用于前端跳转）
        list.forEach(s -> {
            if (s.getBookingUrl() == null || s.getBookingUrl().isBlank()) {
                s.setBookingUrl("/api/service/" + s.getServiceType() + "/book/" + s.getId());
            }
        });
        return list;
    }

    /**
     * 通用下单逻辑
     * @param id 服务方 id
     * @param type 服务类型（feeding/grooming/boarding/transport/training/funeral）
     * @param body 请求体：petName/petType/address/apptDate/apptSlot/remark
     * @param requireAddress 是否要求上门地址（上门/殡葬类需要）
     */
    private ServiceOrder bookService(Long id, String type, Map<String, Object> body, boolean requireAddress) {
        Long userId = UserContext.require();
        PetStore store = petStoreMapper.selectById(id);
        if (store == null) throw new BizException(404, "服务方不存在");
        if (!type.equals(store.getServiceType())) {
            throw new BizException(400, "服务类型不匹配");
        }

        String petName = (String) body.getOrDefault("petName", "");
        String petType = (String) body.getOrDefault("petType", "");
        String address = (String) body.getOrDefault("address", "");
        String slot = (String) body.getOrDefault("apptSlot", "");
        String remark = (String) body.getOrDefault("remark", "");
        Object dateObj = body.get("apptDate");

        if (requireAddress && (address == null || address.isBlank())) {
            throw new BizException(400, "请填写上门地址");
        }
        if (petName == null || petName.isBlank()) {
            throw new BizException(400, "请填写宠物名称");
        }
        LocalDate apptDate = null;
        if (dateObj != null && !dateObj.toString().isBlank()) {
            apptDate = LocalDate.parse(dateObj.toString());
            if (apptDate.isBefore(LocalDate.now())) {
                throw new BizException(400, "不能预约过去的日期");
            }
        }

        // 价格：从 price_range 字符串中提取首个数字作为预估金额
        BigDecimal amount = BigDecimal.ZERO;
        if (store.getPriceRange() != null) {
            String pr = store.getPriceRange();
            int idx = 0;
            while (idx < pr.length() && (pr.charAt(idx) < '0' || pr.charAt(idx) > '9')) idx++;
            int end = idx;
            while (end < pr.length() && pr.charAt(end) >= '0' && pr.charAt(end) <= '9') end++;
            if (end > idx) {
                try { amount = new BigDecimal(pr.substring(idx, end)); } catch (Exception ignore) {}
            }
        }

        ServiceOrder order = new ServiceOrder();
        order.setUserId(userId);
        order.setServiceType(type);
        order.setProviderId(id);
        order.setProviderName(store.getName());
        order.setPetName(petName);
        order.setPetType(petType);
        order.setAddress(address);
        order.setApptDate(apptDate);
        order.setApptSlot(slot);
        order.setRemark(remark);
        order.setAmount(amount);
        order.setStatus("pending");
        order.setCreateTime(LocalDateTime.now());
        serviceOrderMapper.insert(order);
        return order;
    }
}