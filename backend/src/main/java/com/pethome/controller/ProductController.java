package com.pethome.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.pethome.common.Result;
import com.pethome.entity.Product;
import com.pethome.service.ProductService;
import com.pethome.service.ProductImageSeeder;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/product")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final ProductImageSeeder productImageSeeder;

    /** 商品列表（免登录可访问，支持分类/关键词/分页） */
    @GetMapping("/list")
    public Result<Page<Product>> list(@RequestParam(required = false) String category,
                                    @RequestParam(required = false) String keyword,
                                    @RequestParam(defaultValue = "1") int page,
                                    @RequestParam(defaultValue = "20") int size) {
        return Result.ok(productService.list(category, keyword, page, size));
    }

    /** 商品详情（二级缓存） */
    @GetMapping("/{id}")
    public Result<Product> get(@PathVariable Long id) {
        return Result.ok(productService.getById(id));
    }

    /** 手动触发商品图片重新播种（用 Unsplash 刷新图片） */
    @PostMapping("/reseed-images")
    public Result<String> reseedImages() {
        productImageSeeder.reseed();
        return Result.ok("图片播种完成");
    }
}
