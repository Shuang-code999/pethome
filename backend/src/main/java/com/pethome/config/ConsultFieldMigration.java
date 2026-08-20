package com.pethome.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 启动时迁移：给已存在的 consult_session 表补齐 pet_id 列（针对性问诊上下文绑定）。
 *
 * 背景：schema.sql 的 CREATE TABLE IF NOT EXISTS 对旧库不生效（不会 ALTER）。
 * MySQL 8 不支持 ADD COLUMN IF NOT EXISTS，所以用 INFORMATION_SCHEMA 查列存不存在，
 * 不存在就 ALTER，存在就跳过——幂等。与 SeckillFieldMigration 同一套思路。
 *
 * @Order(11) 让它在 DataSource 初始化之后执行（晚于 seckill 迁移）。
 */
@Slf4j
@Component
@Order(11)
@RequiredArgsConstructor
public class ConsultFieldMigration implements CommandLineRunner {

    private final JdbcTemplate jdbc;

    @Override
    public void run(String... args) {
        try {
            Integer tableCount = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES " +
                    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'consult_session'",
                    Integer.class);
            if (tableCount == null || tableCount == 0) {
                log.info("[Consult 迁移] consult_session 表尚未创建（schema.sql 会处理），跳过迁移");
                return;
            }

            List<String> existing = jdbc.queryForList(
                    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS " +
                    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'consult_session'",
                    String.class);

            if (!existing.contains("pet_id")) {
                jdbc.execute("ALTER TABLE `consult_session` " +
                        "ADD COLUMN `pet_id` BIGINT COMMENT '关联宠物档案，用于针对性问诊上下文' AFTER `user_id`");
                jdbc.execute("ALTER TABLE `consult_session` ADD INDEX `idx_pet` (`pet_id`)");
                log.info("[Consult 迁移] ✓ consult_session 新增 pet_id 列 + idx_pet 索引");
            } else {
                log.info("[Consult 迁移] pet_id 列已存在，无需迁移");
            }
        } catch (Exception e) {
            log.error("[Consult 迁移] ✗ 失败！原因：{}", e.getMessage(), e);
        }
    }
}
