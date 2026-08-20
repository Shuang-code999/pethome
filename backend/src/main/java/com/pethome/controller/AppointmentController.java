package com.pethome.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.pethome.common.BizException;
import com.pethome.common.Result;
import com.pethome.entity.Appointment;
import com.pethome.entity.Doctor;
import com.pethome.mapper.AppointmentMapper;
import com.pethome.mapper.DoctorMapper;
import com.pethome.util.UserContext;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** 问诊预约：用户预约医生，锁定时段，写入数据库 */
@RestController
@RequestMapping("/appointment")
@RequiredArgsConstructor
public class AppointmentController {

    private final DoctorMapper doctorMapper;
    private final AppointmentMapper appointmentMapper;
    private final StringRedisTemplate redis;

    /** 医生某日已预约时段（不可重复预约） */
    @GetMapping("/booked-slots")
    public Result<List<String>> bookedSlots(@RequestParam Long doctorId,
                                            @RequestParam String date) {
        LambdaQueryWrapper<Appointment> w = new LambdaQueryWrapper<Appointment>()
                .eq(Appointment::getDoctorId, doctorId)
                .eq(Appointment::getApptDate, LocalDate.parse(date))
                .ne(Appointment::getStatus, "cancelled");
        return Result.ok(appointmentMapper.selectList(w).stream()
                .map(Appointment::getApptSlot)
                .toList());
    }

    /** 创建预约 */
    @PostMapping
    public Result<Appointment> create(@RequestBody Map<String, Object> body) {
        Long userId = UserContext.require();
        Long doctorId = ((Number) body.get("doctorId")).longValue();
        String dateStr = (String) body.get("apptDate");
        String slot = (String) body.get("apptSlot");
        String petName = (String) body.getOrDefault("userPetName", "");
        String petType = (String) body.getOrDefault("petType", "");
        String symptoms = (String) body.getOrDefault("symptoms", "");

        if (doctorId == null || dateStr == null || slot == null || slot.isBlank()) {
            throw new BizException(400, "请填写医生、日期、时段");
        }

        Doctor doctor = doctorMapper.selectById(doctorId);
        if (doctor == null) throw new BizException(404, "医生不存在");
        if (Boolean.FALSE.equals(doctor.getOnline())) {
            throw new BizException(400, "该医生当前不接诊，请选择其他医生");
        }

        LocalDate apptDate = LocalDate.parse(dateStr);
        if (apptDate.isBefore(LocalDate.now())) {
            throw new BizException(400, "不能预约过去的日期");
        }

        // 防止重复预约同医生同时段
        Long conflict = appointmentMapper.selectCount(new LambdaQueryWrapper<Appointment>()
                .eq(Appointment::getDoctorId, doctorId)
                .eq(Appointment::getApptDate, apptDate)
                .eq(Appointment::getApptSlot, slot)
                .ne(Appointment::getStatus, "cancelled"));
        if (conflict > 0) {
            throw new BizException(400, "该时段已被预约，请选择其他时段");
        }

        Appointment a = new Appointment();
        a.setUserId(userId);
        a.setDoctorId(doctorId);
        a.setDoctorName(doctor.getName());
        a.setUserPetName(petName);
        a.setPetType(petType);
        a.setSymptoms(symptoms);
        a.setApptDate(apptDate);
        a.setApptSlot(slot);
        a.setStatus("pending");
        a.setAmount(doctor.getPrice());
        a.setPayStatus("unpaid");
        a.setCreateTime(LocalDateTime.now());
        appointmentMapper.insert(a);

        // 增加医生问诊数（占位计数）
        doctor.setConsultCount((doctor.getConsultCount() == null ? 0 : doctor.getConsultCount()) + 1);
        doctorMapper.updateById(doctor);

        return Result.ok(a);
    }

    /** 我的预约列表 */
    @GetMapping("/mine")
    public Result<List<Appointment>> mine() {
        Long userId = UserContext.require();
        return Result.ok(appointmentMapper.selectList(
                new LambdaQueryWrapper<Appointment>()
                        .eq(Appointment::getUserId, userId)
                        .orderByDesc(Appointment::getCreateTime)));
    }

    /** 取消预约 */
    @PostMapping("/{id}/cancel")
    public Result<Void> cancel(@PathVariable Long id) {
        Long userId = UserContext.require();
        Appointment a = appointmentMapper.selectById(id);
        if (a == null) throw new BizException(404, "预约不存在");
        if (!a.getUserId().equals(userId)) throw new BizException(403, "无权操作");
        if ("completed".equals(a.getStatus())) throw new BizException(400, "已完成的预约不能取消");
        a.setStatus("cancelled");
        a.setPayStatus("refunded");
        appointmentMapper.updateById(a);
        return Result.ok();
    }

    /** 标记完成（demo：仅后端模拟） */
    @PostMapping("/{id}/complete")
    public Result<Void> complete(@PathVariable Long id) {
        Long userId = UserContext.require();
        Appointment a = appointmentMapper.selectById(id);
        if (a == null) throw new BizException(404, "预约不存在");
        if (!a.getUserId().equals(userId)) throw new BizException(403, "无权操作");
        a.setStatus("completed");
        a.setPayStatus("paid");
        appointmentMapper.updateById(a);
        return Result.ok();
    }

    /** 模拟支付 */
    @PostMapping("/{id}/pay")
    public Result<Map<String, Object>> pay(@PathVariable Long id) {
        Long userId = UserContext.require();
        Appointment a = appointmentMapper.selectById(id);
        if (a == null) throw new BizException(404, "预约不存在");
        if (!a.getUserId().equals(userId)) throw new BizException(403, "无权操作");
        if ("paid".equals(a.getPayStatus())) {
            return Result.fail(400, "已支付，无需重复支付");
        }
        // 模拟支付：直接标记成功
        a.setPayStatus("paid");
        a.setStatus("confirmed");
        appointmentMapper.updateById(a);
        Map<String, Object> data = new HashMap<>();
        data.put("payStatus", "paid");
        data.put("status", "confirmed");
        return Result.ok(data);
    }
}