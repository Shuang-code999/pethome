package com.pethome.config;

import com.pethome.interceptor.JwtInterceptor;
import com.pethome.interceptor.RateLimitInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final JwtInterceptor jwtInterceptor;
    private final RateLimitInterceptor rateLimitInterceptor;

    /** 注入当前 profile，dev 用通配，pro 用白名单 */
    @Value("${spring.profiles.active:dev}")
    private String activeProfile;

    /** 同源白名单（生产可改为具体域名） */
    private static final List<String> PROD_ORIGINS = List.of(
            "https://pethome.example.com",
            "https://admin.pethome.example.com"
    );

    /** 白名单：不需登录即可访问 */
    private static final String[] WHITELIST = {
            "/user/code/**",
            "/user/sms/**",
            "/user/login",
            "/user/login/phone",
            "/product/**",
            "/seckill/list",
            "/community/feed",
            "/community/posts/hot",
            "/community/posts/recommend",
            "/community/posts/*",
            "/search/**",
            "/uploads/**",
            "/image/**",
            "/customer-service/**",
            "/weather/**",
            "/location/**",
            "/pay/notify",
            "/consult/models",
            "/doctor/**",
            "/service/types",
            "/service/pet-types",
            "/service/categories",
            "/service/services/**",
            "/service/{type}/list",
            "/service/amap-search",
            "/service/amap-around",
            "/service/amap-photos",
            "/error"
    };

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 限流拦截器（最先执行）
        registry.addInterceptor(rateLimitInterceptor).addPathPatterns("/**");
        // JWT 鉴权拦截器
        registry.addInterceptor(jwtInterceptor)
                .addPathPatterns("/**")
                .excludePathPatterns(WHITELIST);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + System.getProperty("user.dir") + "/uploads/");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        CorsRegistration r = registry.addMapping("/**");
        boolean isDev = "dev".equalsIgnoreCase(activeProfile) || "local".equalsIgnoreCase(activeProfile);
        if (isDev) {
            // dev：通配 + 凭证（方便本地双端不同端口调试）
            r.allowedOriginPatterns("*")
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(true)
                    .maxAge(3600);
        } else {
            // pro/uat：白名单 + 凭证
            r.allowedOrigins(PROD_ORIGINS.toArray(new String[0]))
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(true)
                    .maxAge(3600);
        }
    }
}
