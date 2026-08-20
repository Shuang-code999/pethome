package com.pethome.controller;

import com.pethome.common.Result;
import com.pethome.entity.HealthRecord;
import com.pethome.entity.Reminder;
import com.pethome.service.HealthService;
import com.pethome.service.OcrService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class HealthController {

    private final HealthService healthService;
    private final OcrService ocrService;

    @GetMapping("/pet/{petId}/health")
    public Result<List<HealthRecord>> listByPet(@PathVariable Long petId) {
        return Result.ok(healthService.listByPet(petId));
    }

    @PostMapping("/pet/{petId}/health")
    public Result<HealthRecord> create(@PathVariable Long petId, @RequestBody HealthRecord record) {
        return Result.ok(healthService.create(petId, record));
    }

    /** OCR 识别健康记录图片 */
    @PostMapping("/pet/ocr/health")
    public Result<Map<String, Object>> ocrHealth(@RequestBody Map<String, String> body) {
        String imageUrl = body.get("imageUrl");
        if (imageUrl == null || imageUrl.isBlank()) return Result.fail(400, "图片 URL 不能为空");
        return Result.ok(ocrService.recognizeHealthRecord(imageUrl));
    }

    @GetMapping("/reminders")
    public Result<List<Reminder>> reminders(@RequestParam(required = false) Long petId,
                                            @RequestParam(required = false) Integer status) {
        return Result.ok(healthService.listReminders(petId, status));
    }

    @PostMapping("/reminders")
    public Result<Reminder> createReminder(@RequestBody Reminder r) {
        return Result.ok(healthService.createReminder(r));
    }

    @PostMapping("/reminders/{id}/done")
    public Result<Void> done(@PathVariable Long id) {
        healthService.doneReminder(id);
        return Result.ok();
    }

    @DeleteMapping("/reminders/{id}")
    public Result<Void> deleteReminder(@PathVariable Long id) {
        healthService.deleteReminder(id);
        return Result.ok();
    }
}

