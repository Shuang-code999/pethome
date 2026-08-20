package com.pethome.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 启动时迁移：给已存在的 seckill_order 表补齐 version 列（乐观锁）。
 *
 * 背景：schema.sql 的 CREATE TABLE IF NOT EXISTS 对旧库不生效（不会 ALTER）。
 * MySQL 8 不支持 ADD COLUMN IF NOT EXISTS，所以用 INFORMATION_SCHEMA 查列存不存在，
 * 不存在就 ALTER，存在就跳过——幂等。与 PetFieldMigration 同一套思路。
 *
 * @Order(10) 让它在 DataSource 初始化之后执行。
 */
@Slf4j
@Component
@Order(10)
@RequiredArgsConstructor
public class SeckillFieldMigration implements CommandLineRunner {

    private final JdbcTemplate jdbc;

    @Override
    public void run(String... args) {
        try {
            // 1) 确认 seckill_order 表是否存在
            Integer tableCount = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES " +
                    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'seckill_order'",
                    Integer.class);
            if (tableCount == null || tableCount == 0) {
                log.info("[Seckill 迁移] seckill_order 表尚未创建（schema.sql 会处理），跳过迁移");
                return;
            }

            // 2) 查现有列
            List<String> existing = jdbc.queryForList(
                    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS " +
                    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'seckill_order'",
                    String.class);

            if (!existing.contains("version")) {
                jdbc.execute("ALTER TABLE `seckill_order` " +
                        "ADD COLUMN `version` INT NOT NULL DEFAULT 0 COMMENT '乐观锁版本号'");
                log.info("[Seckill 迁移] ✓ seckill_order 新增 version 列（乐观锁）");
            } else {
                log.info("[Seckill 迁移] version 列已存在，无需迁移");
            }
        } catch (Exception e) {
            log.error("[Seckill 迁移] ✗ 失败！原因：{}", e.getMessage(), e);
        }
    }
}
