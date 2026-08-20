package com.pethome.config;

import com.pethome.util.UserContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.TaskDecorator;
import org.springframework.lang.NonNull;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * 异步线程池：把当前线程的 UserContext 透传到子线程
 * 这样 @Async 方法里 UserContext.require() 不会为 null
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean("pethomeAsync")
    public Executor pethomeAsync() {
        ThreadPoolTaskExecutor exec = new ThreadPoolTaskExecutor();
        exec.setCorePoolSize(4);
        exec.setMaxPoolSize(16);
        exec.setQueueCapacity(200);
        exec.setThreadNamePrefix("pethome-async-");
        exec.setTaskDecorator(new UserContextTaskDecorator());
        exec.initialize();
        return exec;
    }

    /** 透传 UserContext（用 InheritableThreadLocal 风格：捕获 + set + clear） */
    static class UserContextTaskDecorator implements TaskDecorator {
        @Override
        @NonNull
        public Runnable decorate(@NonNull Runnable runnable) {
            Long uid = UserContext.get();
            String traceId = org.slf4j.MDC.get("traceId");
            return () -> {
                try {
                    if (uid != null) UserContext.set(uid);
                    if (traceId != null) org.slf4j.MDC.put("traceId", traceId);
                    runnable.run();
                } finally {
                    UserContext.clear();
                    org.slf4j.MDC.clear();
                }
            };
        }
    }
}
