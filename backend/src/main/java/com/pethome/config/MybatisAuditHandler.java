package com.pethome.config;

import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import com.pethome.util.UserContext;
import org.apache.ibatis.reflection.MetaObject;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * MyBatis-Plus 审计字段自动填充：
 *  insert: create_time / update_time
 *  update: update_time
 *  create_by / update_by：从 UserContext 拿当前用户
 */
@Component
public class MybatisAuditHandler implements MetaObjectHandler {

    @Override
    public void insertFill(MetaObject metaObject) {
        LocalDateTime now = LocalDateTime.now();
        strictInsertFill(metaObject, "createTime", LocalDateTime.class, now);
        strictInsertFill(metaObject, "updateTime", LocalDateTime.class, now);
        Long uid = UserContext.get();
        if (uid != null) {
            strictInsertFill(metaObject, "createBy", Long.class, uid);
            strictInsertFill(metaObject, "updateBy", Long.class, uid);
        }
    }

    @Override
    public void updateFill(MetaObject metaObject) {
        strictUpdateFill(metaObject, "updateTime", LocalDateTime.class, LocalDateTime.now());
        Long uid = UserContext.get();
        if (uid != null) {
            strictUpdateFill(metaObject, "updateBy", Long.class, uid);
        }
    }
}
