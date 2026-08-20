package com.pethome.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.github.benmanes.caffeine.cache.Cache;
import com.pethome.common.BizException;
import com.pethome.common.Constants;
import com.pethome.common.ErrorCode;
import com.pethome.entity.Product;
import com.pethome.mapper.ProductMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;

/**
 * 商品服务
 *  - 二级缓存（Caffeine L1 + Redis L2）
 *  - 三防：穿透（空值缓存 + 短 TTL）/ 击穿（分布式互斥锁重建）/ 雪崩（TTL 抖动）
 *  - update 写后清除缓存（旁路缓存）
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private static final String NULL_MARK = "__NULL__";
    private static final long BASE_TTL_MIN = 30;
    private static final long JITTER_MAX_SEC = 300; // 5min 抖动
    private static final long NULL_TTL_SEC = 60;

    private final ProductMapper productMapper;
    private final RedisTemplate<String, Object> redisTemplate;
    private final Cache<String, Object> productLocalCache;
    private final RedissonClient redissonClient;

    /** 商品列表（分页） */
    public Page<Product> list(String category, String keyword, int page, int size) {
        LambdaQueryWrapper<Product> wrapper = new LambdaQueryWrapper<Product>()
                .eq(Product::getStatus, 1)
                .le(Product::getId, 50);
        if (StringUtils.hasText(category) && !"全部".equals(category)) {
            wrapper.eq(Product::getCategory, category);
        }
        if (StringUtils.hasText(keyword)) {
            wrapper.like(Product::getName, keyword);
        }
        wrapper.orderByDesc(Product::getCreateTime);
        return productMapper.selectPage(new Page<>(page, size), wrapper);
    }

    /** 商品详情：二级缓存 + 三防 */
    public Product getById(Long id) {
        String l2Key = Constants.PRODUCT_CACHE + id;
        // L1 本地
        Object local = productLocalCache.getIfPresent(l2Key);
        if (local instanceof Product p) return p;
        if (NULL_MARK.equals(local)) {
            throw new BizException(ErrorCode.NOT_FOUND, "商品不存在");
        }
        // L2 Redis
        Object cached = redisTemplate.opsForValue().get(l2Key);
        if (cached instanceof Product p) {
            productLocalCache.put(l2Key, p);
            return p;
        }
        if (NULL_MARK.equals(cached)) {
            productLocalCache.put(l2Key, NULL_MARK);
            throw new BizException(ErrorCode.NOT_FOUND, "商品不存在");
        }
        // L3 DB
        return loadAndCache(id, l2Key);
    }

    /** 分布式锁防击穿：单实例重建 DB + 写缓存 */
    private Product loadAndCache(Long id, String l2Key) {
        String lockKey = Constants.PRODUCT_CACHE + "lock:" + id;
        RLock lock = redissonClient.getLock(lockKey);
        boolean acquired = false;
        try {
            acquired = lock.tryLock(2, 5, TimeUnit.SECONDS);
            if (!acquired) {
                // 抢不到锁直接再查一次 L2（其他线程已重建）
                Object after = redisTemplate.opsForValue().get(l2Key);
                if (after instanceof Product p) return p;
                if (NULL_MARK.equals(after)) throw new BizException(ErrorCode.NOT_FOUND, "商品不存在");
                // 仍查不到就让上层重试
                throw new BizException(ErrorCode.INTERNAL_ERROR, "查询冲突，请重试");
            }
            // 二次校验：拿锁后再看一次 L2
            Object after = redisTemplate.opsForValue().get(l2Key);
            if (after instanceof Product p) return p;
            if (NULL_MARK.equals(after)) throw new BizException(ErrorCode.NOT_FOUND, "商品不存在");
            // 回源 DB
            Product product = productMapper.selectById(id);
            if (product == null) {
                // 防穿透：空值缓存
                redisTemplate.opsForValue().set(l2Key, NULL_MARK, Duration.ofSeconds(NULL_TTL_SEC));
                productLocalCache.put(l2Key, NULL_MARK);
                throw new BizException(ErrorCode.NOT_FOUND, "商品不存在");
            }
            // 防雪崩：TTL 抖动
            long ttlSec = BASE_TTL_MIN * 60 + ThreadLocalRandom.current().nextLong(JITTER_MAX_SEC);
            redisTemplate.opsForValue().set(l2Key, product, Duration.ofSeconds(ttlSec));
            productLocalCache.put(l2Key, product);
            return product;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BizException(ErrorCode.INTERNAL_ERROR, "查询被中断");
        } finally {
            if (acquired && lock.isHeldByCurrentThread()) lock.unlock();
        }
    }

    /** 更新商品：写后清除缓存（旁路缓存） */
    public Product update(Long id, Product patch) {
        Product exist = productMapper.selectById(id);
        if (exist == null) throw new BizException(ErrorCode.NOT_FOUND, "商品不存在");
        if (patch.getName() != null) exist.setName(patch.getName());
        if (patch.getPrice() != null) exist.setPrice(patch.getPrice());
        if (patch.getOldPrice() != null) exist.setOldPrice(patch.getOldPrice());
        if (patch.getStock() != null) exist.setStock(patch.getStock());
        if (patch.getCategory() != null) exist.setCategory(patch.getCategory());
        if (patch.getImage() != null) exist.setImage(patch.getImage());
        if (patch.getTags() != null) exist.setTags(patch.getTags());
        if (patch.getStatus() != null) exist.setStatus(patch.getStatus());
        productMapper.updateById(exist);
        // 旁路失效：删 L1 + L2
        String l2Key = Constants.PRODUCT_CACHE + id;
        productLocalCache.invalidate(l2Key);
        redisTemplate.delete(l2Key);
        return exist;
    }
}
