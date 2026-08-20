package com.pethome.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.pethome.entity.Notification;
import com.pethome.entity.Pet;
import com.pethome.entity.Reminder;
import com.pethome.mapper.NotificationMapper;
import com.pethome.mapper.PetMapper;
import com.pethome.mapper.ReminderMapper;
import com.pethome.util.UserContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 消息中心服务
 *
 * 设计要点：
 * - 用户级消息（type=reminder/remind_due 等），存储于 notification 表
 * - 提醒到期通知由 @Scheduled 每日 09:00 扫描 reminder 表，提前 3 天 / 当天 / 已过期未完成的提醒
 *   写入 notification 表（同一 reminder 同一天只写一次，避免重复打扰）
 * - 同时保留手动写入接口（service 层其他模块可调）
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationMapper notificationMapper;
    private final ReminderMapper reminderMapper;
    private final PetMapper petMapper;

    /** 我的消息列表（最新在前） */
    public List<Notification> myList() {
        return notificationMapper.selectList(new LambdaQueryWrapper<Notification>()
                .eq(Notification::getUserId, UserContext.require())
                .orderByDesc(Notification::getCreateTime));
    }

    /** 未读数 */
    public Long unreadCount() {
        return notificationMapper.selectCount(new LambdaQueryWrapper<Notification>()
                .eq(Notification::getUserId, UserContext.require())
                .eq(Notification::getIsRead, 0));
    }

    /**
     * 分组拉取（铃铛 / 消息中心页用）
     *  返回 { health:[], private:[], follow:[], unreadCount:Long }
     *  - 健康预警：先查 notification.type='health'；空时回退查 reminder（未来 7 天 status=0）拼装
     *  - 私信 / 关注：直接查 notification
     */
    public Map<String, Object> grouped() {
        Long userId = UserContext.require();
        int limit = 30;

        List<Notification> health = notificationMapper.selectList(new LambdaQueryWrapper<Notification>()
                .eq(Notification::getUserId, userId)
                .eq(Notification::getType, "health")
                .orderByDesc(Notification::getCreateTime)
                .last("LIMIT " + limit));
        if (health.isEmpty()) {
            List<Reminder> rs = reminderMapper.selectList(new LambdaQueryWrapper<Reminder>()
                    .eq(Reminder::getUserId, userId)
                    .le(Reminder::getRemindDate, LocalDate.now().plusDays(7))
                    .eq(Reminder::getStatus, 0)
                    .orderByAsc(Reminder::getRemindDate)
                    .last("LIMIT " + limit));
            for (Reminder r : rs) {
                Notification n = new Notification();
                n.setId(-r.getId());
                n.setType("health");
                n.setTitle("待办提醒：" + r.getTitle());
                n.setContent("提醒日期：" + r.getRemindDate());
                n.setIsRead(0);
                n.setRefId(r.getId());
                n.setCreateTime(r.getCreateTime());
                health.add(n);
            }
        }

        List<Notification> privates = notificationMapper.selectList(new LambdaQueryWrapper<Notification>()
                .eq(Notification::getUserId, userId)
                .eq(Notification::getType, "private")
                .orderByDesc(Notification::getCreateTime)
                .last("LIMIT " + limit));

        List<Notification> follows = notificationMapper.selectList(new LambdaQueryWrapper<Notification>()
                .eq(Notification::getUserId, userId)
                .eq(Notification::getType, "follow")
                .orderByDesc(Notification::getCreateTime)
                .last("LIMIT " + limit));

        long unread = notificationMapper.selectCount(new LambdaQueryWrapper<Notification>()
                .eq(Notification::getUserId, userId)
                .eq(Notification::getIsRead, 0));

        Map<String, Object> out = new java.util.LinkedHashMap<>();
        out.put("health", health);
        out.put("private", privates);
        out.put("follow", follows);
        out.put("unreadCount", unread);
        return out;
    }

    /** 标记单条已读 */
    public void markRead(Long id) {
        Notification n = notificationMapper.selectById(id);
        if (n == null || !n.getUserId().equals(UserContext.require())) return;
        if (n.getIsRead() != null && n.getIsRead() == 1) return;
        notificationMapper.update(null, new LambdaUpdateWrapper<Notification>()
                .eq(Notification::getId, id)
                .set(Notification::getIsRead, 1));
    }

    /** 全部标记已读 */
    public void markAllRead() {
        notificationMapper.update(null, new LambdaUpdateWrapper<Notification>()
                .eq(Notification::getUserId, UserContext.require())
                .eq(Notification::getIsRead, 0)
                .set(Notification::getIsRead, 1));
    }

    /** 手动写入一条通知（其他 service 可调） */
    public Notification push(Long userId, String type, String title, String content, Long refId) {
        Notification n = new Notification();
        n.setUserId(userId);
        n.setType(type);
        n.setTitle(title);
        n.setContent(content);
        n.setRefId(refId);
        n.setIsRead(0);
        notificationMapper.insert(n);
        return n;
    }

    /**
     * 每日 09:00 扫描即将到期的健康提醒，写入通知
     * cron: 秒 分 时 日 月 周
     */
    @Scheduled(cron = "0 0 9 * * *")
    public void scanExpiringReminders() {
        try {
            LocalDate today = LocalDate.now();
            // 未来 3 天内（含当天）+ 仍未完成（status=0）
            LocalDate horizon = today.plusDays(3);
            List<Reminder> dueList = reminderMapper.selectList(new LambdaQueryWrapper<Reminder>()
                    .eq(Reminder::getStatus, 0)
                    .between(Reminder::getRemindDate, today, horizon));

            if (dueList.isEmpty()) return;

            // 批量预取宠物名（避免循环里逐条查）
            Map<Long, String> petNames = new HashMap<>();
            for (Reminder r : dueList) {
                if (r.getPetId() != null && !petNames.containsKey(r.getPetId())) {
                    Pet p = petMapper.selectById(r.getPetId());
                    petNames.put(r.getPetId(), p != null ? p.getName() : "毛孩子");
                }
            }

            int created = 0;
            for (Reminder r : dueList) {
                long days = r.getRemindDate().toEpochDay() - today.toEpochDay();
                String petName = petNames.getOrDefault(r.getPetId(), "毛孩子");
                String title;
                String content;
                if (days == 0) {
                    title = "⏰ 今日就到：" + r.getTitle();
                    content = petName + " 的「" + r.getTitle() + "」今天到期，别忘了哦～";
                } else if (days == 1) {
                    title = "📅 明天到期：" + r.getTitle();
                    content = petName + " 的「" + r.getTitle() + "」明天到期，记得提前准备";
                } else {
                    title = "📅 " + days + " 天后：" + r.getTitle();
                    content = petName + " 的「" + r.getTitle() + "」将于 " + r.getRemindDate() + " 到期";
                }

                // 同一 reminder 同一天只推一次：检查当日是否已有同 refId + type 的通知
                Long existed = notificationMapper.selectCount(new LambdaQueryWrapper<Notification>()
                        .eq(Notification::getUserId, r.getUserId())
                        .eq(Notification::getType, "remind_due")
                        .eq(Notification::getRefId, r.getId())
                        .apply("DATE(create_time) = CURDATE()"));
                if (existed != null && existed > 0) continue;

                push(r.getUserId(), "remind_due", title, content, r.getId());
                created++;
            }
            if (created > 0) {
                log.info("[提醒扫描] 新增 {} 条到期通知", created);
            }
        } catch (Exception e) {
            log.error("[提醒扫描] 失败：{}", e.getMessage(), e);
        }
    }
}