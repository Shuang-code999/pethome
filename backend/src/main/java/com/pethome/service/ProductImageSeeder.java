package com.pethome.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.pethome.entity.Product;
import com.pethome.mapper.ProductMapper;
import com.pethome.util.UnsplashUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * 商品图片播种器：启动时检查商品是否使用占位图（picsum.photos），
 * 如果是则通过 Unsplash API 按分类关键词拉取真实商品图替换。
 * 只在首次运行时执行（Redis 标记），不影响后续启动速度。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ProductImageSeeder implements ApplicationRunner {

    private final ProductMapper productMapper;
    private final UnsplashUtil unsplash;
    private final StringRedisTemplate redis;

    /** 商品分类 → Unsplash 搜索关键词（英文命中率更高） */
    private static final Map<String, String> CATEGORY_KW = Map.of(
            "主粮",  "pet food kibble",
            "零食",  "pet treats snacks",
            "猫砂",  "cat litter box",
            "驱虫",  "pet medicine veterinary",
            "玩具",  "pet toys dog cat",
            "用品",  "pet accessories supplies",
            "洗护",  "pet grooming shampoo",
            "保健",  "pet health supplements"
    );

    @Override
    public void run(ApplicationArguments args) {
        // 幂等：已经播种过就跳过
        if ("done".equals(redis.opsForValue().get("product:image-seeded"))) {
            log.debug("[ProductSeeder] 已播种，跳过");
            return;
        }

        try {
            seedImages();
            redis.opsForValue().set("product:image-seeded", "done");
            log.info("[ProductSeeder] 商品图片播种完成");
        } catch (Exception e) {
            log.warn("[ProductSeeder] 播种失败（不影响启动）: {}", e.getMessage());
        }
    }

    /** 手动触发重新播种（清除 Redis 标记后重跑） */
    public void reseed() {
        redis.delete("product:image-seeded");
        seedImages();
        redis.opsForValue().set("product:image-seeded", "done");
    }

    private void seedImages() {
        var products = productMapper.selectList(
                new LambdaQueryWrapper<Product>()
                        .like(Product::getImage, "picsum")
                        .or()
                        .isNull(Product::getImage)
                        .or()
                        .eq(Product::getImage, "")
        );

        if (products.isEmpty()) {
            log.info("[ProductSeeder] 所有商品已有图片，无需播种");
            return;
        }

        log.info("[ProductSeeder] 需更新 {} 个商品图片", products.size());
        int updated = 0;

        for (Product p : products) {
            String kw = CATEGORY_KW.getOrDefault(p.getCategory(), "pet products");
            String url = unsplash.randomImage(kw);
            if (url != null && !url.isBlank()) {
                p.setImage(url);
                productMapper.updateById(p);
                updated++;
                // Unsplash demo 限速 50 req/h，控制节奏
                if (updated % 10 == 0) {
                    try { Thread.sleep(1500); } catch (InterruptedException ignored) {}
                }
            }
        }
        log.info("[ProductSeeder] 成功更新 {}/{} 个商品图片", updated, products.size());
    }
}
