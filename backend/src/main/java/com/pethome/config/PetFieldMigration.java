package com.pethome.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 启动时迁移：给已存在的 pet 表补齐 v2 档案扩展字段。
 *
 * 背景：schema.sql 的 CREATE TABLE IF NOT EXISTS 对旧库不生效（不会 ALTER）。
 * MySQL 8 不支持 ADD COLUMN IF NOT EXISTS，所以用 INFORMATION_SCHEMA 查列存不存在，
 * 不存在就 ALTER，存在就跳过——幂等。
 *
 * @Order(10) 让它在 DataSource 初始化之后执行，但不阻塞其它启动项。
 */
@Slf4j
@Component
@Order(10)
@RequiredArgsConstructor
public class PetFieldMigration implements CommandLineRunner {

    private final JdbcTemplate jdbc;

    private static final List<String> COLUMNS = List.of(
            "coat_color VARCHAR(32) DEFAULT NULL COMMENT '毛色'",
            "pedigree_no VARCHAR(64) DEFAULT NULL COMMENT '血统编号'",
            "age_text VARCHAR(32) DEFAULT NULL COMMENT '年龄文本'",
            "arrive_date DATE DEFAULT NULL COMMENT '到家日期'",
            "staple_food VARCHAR(255) DEFAULT NULL COMMENT '日常主食'",
            "allergy VARCHAR(255) DEFAULT NULL COMMENT '过敏史'",
            "chronic_disease VARCHAR(255) DEFAULT NULL COMMENT '慢性病'",
            "temperament VARCHAR(255) DEFAULT NULL COMMENT '脾气性格'",
            "stress VARCHAR(255) DEFAULT NULL COMMENT '应激情况'",
            "forbidden_drugs VARCHAR(255) DEFAULT NULL COMMENT '禁忌药物'",
            "special_care VARCHAR(500) DEFAULT NULL COMMENT '特殊照料要求'"
    );

    @Override
    public void run(String... args) {
        try {
            // 1) 先确认 pet 表是否存在（没有就跳过——schema.sql 会建）
            Integer tableCount = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES " +
                    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pet'",
                    Integer.class);
            if (tableCount == null || tableCount == 0) {
                log.info("[Pet 迁移] pet 表尚未创建（schema.sql 会处理），跳过迁移");
                return;
            }

            // 2) 查 pet 表的现有列
            List<String> existing = jdbc.queryForList(
                    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS " +
                    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pet'",
                    String.class);
            log.info("[Pet 迁移] pet 表当前共 {} 列", existing.size());

            // 3) 找缺失的列
            Map<String, String> missing = new LinkedHashMap<>();
            for (String def : COLUMNS) {
                String name = def.split("\\s+")[0];
                if (!existing.contains(name)) missing.put(name, def);
            }

            if (missing.isEmpty()) {
                log.info("[Pet 迁移] 字段已齐全（11 个扩展字段全部存在），无需迁移");
                return;
            }

            // 4) 一次性 ALTER
            StringBuilder sql = new StringBuilder("ALTER TABLE `pet` ");
            int i = 0;
            for (Map.Entry<String, String> e : missing.entrySet()) {
                if (i++ > 0) sql.append(", ");
                sql.append("ADD COLUMN ").append(e.getValue());
            }
            jdbc.execute(sql.toString());
            log.info("[Pet 迁移] ✓ 新增 {} 个字段：{}", missing.size(), missing.keySet());
        } catch (Exception e) {
            // 捕获后打印详细堆栈，方便排查权限/锁表等问题
            log.error("[Pet 迁移] ✗ 失败！新建宠物时写入 v2 字段会报 SQL 异常。原因：{}", e.getMessage(), e);
        }
    }
}
