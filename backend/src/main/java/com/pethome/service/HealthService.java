package com.pethome.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.pethome.common.BizException;
import com.pethome.entity.HealthRecord;
import com.pethome.entity.Pet;
import com.pethome.entity.Reminder;
import com.pethome.mapper.HealthRecordMapper;
import com.pethome.mapper.PetMapper;
import com.pethome.mapper.ReminderMapper;
import com.pethome.util.UserContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class HealthService {

    private final HealthRecordMapper healthRecordMapper;
    private final ReminderMapper reminderMapper;
    private final PetMapper petMapper;

    public List<HealthRecord> listByPet(Long petId) {
        Pet pet = petMapper.selectById(petId);
        if (pet == null) throw new BizException(404, "宠物不存在");
        // 兼容：旧数据 pet.userId 为 NULL → 自动归属当前用户（解决历史脏数据）
        if (pet.getUserId() == null) {
            pet.setUserId(UserContext.require());
            petMapper.updateById(pet);
        } else if (!pet.getUserId().equals(UserContext.require())) {
            throw new BizException(403, "无权访问");
        }
        return healthRecordMapper.selectList(new LambdaQueryWrapper<HealthRecord>()
                .eq(HealthRecord::getPetId, petId)
                .orderByDesc(HealthRecord::getRecordDate));
    }

    public HealthRecord create(Long petId, HealthRecord record) {
        Long currentUser = UserContext.require();
        Pet pet = petMapper.selectById(petId);
        if (pet == null) throw new BizException(404, "宠物不存在");

        // 兼容：旧数据 pet.userId 为 NULL（建档功能升级前创建、迁移时未补 userId）
        // → 视为"孤儿宠物"，自动归属当前用户；同时把宠物的 userId 回填，避免下次再踩坑
        if (pet.getUserId() == null) {
            log.warn("[HealthService.create] 宠物 {} 的 userId 为 NULL，自动归属到当前用户 {}", petId, currentUser);
            pet.setUserId(currentUser);
            petMapper.updateById(pet);
        } else if (!pet.getUserId().equals(currentUser)) {
            log.warn("[HealthService.create] 宠物 {} 归属用户 {}，但当前用户 {} 无权操作",
                    petId, pet.getUserId(), currentUser);
            throw new BizException(403, "无权操作");
        }

        record.setPetId(petId);
        record.setUserId(currentUser);
        healthRecordMapper.insert(record);

        // 如果有下次日期，自动生成提醒
        if (record.getNextDate() != null && record.getNextDate().isAfter(LocalDate.now())) {
            Reminder r = new Reminder();
            r.setUserId(currentUser);
            r.setPetId(petId);
            r.setTitle(pet.getName() + "的" + record.getName());
            r.setRemindDate(record.getNextDate());
            reminderMapper.insert(r);
        }
        return record;
    }

    public List<Reminder> myReminders() {
        return reminderMapper.selectList(new LambdaQueryWrapper<Reminder>()
                .eq(Reminder::getUserId, UserContext.require())
                .orderByAsc(Reminder::getRemindDate));
    }

    /** 按宠物 ID + 状态过滤提醒 */
    public List<Reminder> listReminders(Long petId, Integer status) {
        LambdaQueryWrapper<Reminder> qw = new LambdaQueryWrapper<Reminder>()
                .eq(Reminder::getUserId, UserContext.require())
                .orderByAsc(Reminder::getRemindDate);
        if (petId != null) qw.eq(Reminder::getPetId, petId);
        if (status != null) qw.eq(Reminder::getStatus, status);
        return reminderMapper.selectList(qw);
    }

    public Reminder createReminder(Reminder r) {
        r.setUserId(UserContext.require());
        if (r.getStatus() == null) r.setStatus(0);
        reminderMapper.insert(r);
        return r;
    }

    public void doneReminder(Long id) {
        Reminder r = reminderMapper.selectById(id);
        if (r == null || !r.getUserId().equals(UserContext.require())) {
            throw new BizException(403, "无权操作");
        }
        r.setStatus(1);
        reminderMapper.updateById(r);
    }

    public void deleteReminder(Long id) {
        Reminder r = reminderMapper.selectById(id);
        if (r == null || !r.getUserId().equals(UserContext.require())) {
            throw new BizException(403, "无权操作");
        }
        reminderMapper.deleteById(id);
    }
}
