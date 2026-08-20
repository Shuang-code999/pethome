package com.pethome.controller;

import com.pethome.common.Result;
import com.pethome.entity.WeightRecord;
import com.pethome.service.WeightService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class WeightController {

    private final WeightService weightService;

    @GetMapping("/pet/{petId}/weight")
    public Result<List<WeightRecord>> list(@PathVariable Long petId) {
        return Result.ok(weightService.listByPet(petId));
    }

    @PostMapping("/pet/{petId}/weight")
    public Result<WeightRecord> create(@PathVariable Long petId, @RequestBody WeightRecord record) {
        return Result.ok(weightService.create(petId, record));
    }

    @DeleteMapping("/pet/{petId}/weight/{id}")
    public Result<Void> delete(@PathVariable Long petId, @PathVariable Long id) {
        weightService.delete(petId, id);
        return Result.ok();
    }

    @GetMapping("/pet/{petId}/weight/stats")
    public Result<Map<String, Object>> stats(@PathVariable Long petId) {
        return Result.ok(weightService.stats(petId));
    }
}