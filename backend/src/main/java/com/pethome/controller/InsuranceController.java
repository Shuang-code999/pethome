package com.pethome.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.pethome.common.Result;
import com.pethome.entity.InsurancePlan;
import com.pethome.mapper.InsurancePlanMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** 保险方案：列出所有上架的保险方案 */
@RestController
@RequestMapping("/insurance")
@RequiredArgsConstructor
public class InsuranceController {

    private final InsurancePlanMapper insurancePlanMapper;

    /** 列出所有上架保险方案 */
    @GetMapping("/plans")
    public Result<List<InsurancePlan>> plans() {
        return Result.ok(insurancePlanMapper.selectList(
                new LambdaQueryWrapper<InsurancePlan>()
                        .eq(InsurancePlan::getActive, true)
                        .orderByAsc(InsurancePlan::getSortOrder)));
    }

    /** 保险方案详情 */
    @GetMapping("/plans/{id}")
    public Result<InsurancePlan> detail(@PathVariable Long id) {
        InsurancePlan p = insurancePlanMapper.selectById(id);
        if (p == null) return Result.fail(404, "方案不存在");
        return Result.ok(p);
    }
}