package com.pethome.controller;

import com.pethome.common.Result;
import com.pethome.entity.Notification;
import com.pethome.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notification")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/list")
    public Result<List<Notification>> list() {
        return Result.ok(notificationService.myList());
    }

    @GetMapping("/unread-count")
    public Result<Map<String, Long>> unreadCount() {
        return Result.ok(Map.of("count", notificationService.unreadCount()));
    }

    /** 分组拉取（铃铛 / 消息中心页用） */
    @GetMapping("/grouped")
    public Result<Map<String, Object>> grouped() {
        return Result.ok(notificationService.grouped());
    }

    @PostMapping("/{id}/read")
    public Result<Void> markRead(@PathVariable Long id) {
        notificationService.markRead(id);
        return Result.ok();
    }

    @PostMapping("/read-all")
    public Result<Void> markAllRead() {
        notificationService.markAllRead();
        return Result.ok();
    }
}