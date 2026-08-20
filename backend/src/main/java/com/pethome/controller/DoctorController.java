package com.pethome.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.pethome.common.Result;
import com.pethome.entity.Doctor;
import com.pethome.mapper.DoctorMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** 真实在线医生（区别于 mock 推荐医生） */
@RestController
@RequestMapping("/doctor")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorMapper doctorMapper;

    /** 列出医生（可按科室/在线筛选） */
    @GetMapping
    public Result<List<Doctor>> list(@RequestParam(required = false) String dept,
                                     @RequestParam(required = false) Boolean onlineOnly) {
        LambdaQueryWrapper<Doctor> w = new LambdaQueryWrapper<Doctor>()
                .orderByDesc(Doctor::getOnline)
                .orderByDesc(Doctor::getRating)
                .orderByDesc(Doctor::getConsultCount);
        if (dept != null && !dept.isBlank() && !"all".equals(dept)) {
            w.eq(Doctor::getDept, dept);
        }
        if (onlineOnly != null && onlineOnly) {
            w.eq(Doctor::getOnline, true);
        }
        return Result.ok(doctorMapper.selectList(w));
    }

    /** 医生详情 */
    @GetMapping("/{id}")
    public Result<Doctor> detail(@PathVariable Long id) {
        Doctor d = doctorMapper.selectById(id);
        if (d == null) return Result.fail(404, "医生不存在");
        return Result.ok(d);
    }

    /** 列出所有科室（去重） */
    @GetMapping("/departments")
    public Result<List<String>> departments() {
        return Result.ok(doctorMapper.selectList(null).stream()
                .map(Doctor::getDept)
                .filter(d -> d != null && !d.isBlank())
                .distinct()
                .sorted()
                .toList());
    }
}