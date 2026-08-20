package com.pethome;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling   // 开启 @Scheduled 定时任务（健康提醒到期通知等）
@MapperScan("com.pethome.mapper")
public class PethomeApplication {
    public static void main(String[] args) {
        SpringApplication.run(PethomeApplication.class, args);
    }
}
