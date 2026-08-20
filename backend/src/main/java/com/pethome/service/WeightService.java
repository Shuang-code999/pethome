package com.pethome.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.pethome.common.BizException;
import com.pethome.entity.Pet;
import com.pethome.entity.WeightRecord;
import com.pethome.mapper.PetMapper;
import com.pethome.mapper.WeightRecordMapper;
import com.pethome.util.UserContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WeightService {

    private final WeightRecordMapper weightRecordMapper;
    private final PetMapper petMapper;

    public List<WeightRecord> listByPet(Long petId) {
        verifyOwner(petId);
        return weightRecordMapper.selectList(new LambdaQueryWrapper<WeightRecord>()
                .eq(WeightRecord::getPetId, petId)
                .orderByAsc(WeightRecord::getRecordDate));
    }

    public WeightRecord create(Long petId, WeightRecord record) {
        verifyOwner(petId);
        record.setPetId(petId);
        record.setUserId(UserContext.require());
        if (record.getRecordDate() == null) record.setRecordDate(LocalDate.now());
        // upsert: 同一天已有记录则更新
        WeightRecord existing = weightRecordMapper.selectOne(new LambdaQueryWrapper<WeightRecord>()
                .eq(WeightRecord::getPetId, petId)
                .eq(WeightRecord::getRecordDate, record.getRecordDate()));
        if (existing != null) {
            existing.setWeight(record.getWeight());
            existing.setNote(record.getNote());
            weightRecordMapper.updateById(existing);
            return existing;
        }
        weightRecordMapper.insert(record);
        return record;
    }

    public void delete(Long petId, Long id) {
        verifyOwner(petId);
        WeightRecord r = weightRecordMapper.selectById(id);
        if (r == null || !r.getPetId().equals(petId)) throw new BizException(404, "记录不存在");
        weightRecordMapper.deleteById(id);
    }

    /** 体重统计：当前/平均/趋势/标准区间 */
    public Map<String, Object> stats(Long petId) {
        verifyOwner(petId);
        Pet pet = petMapper.selectById(petId);
        List<WeightRecord> records = listByPet(petId);
        Map<String, Object> out = new HashMap<>();
        if (records.isEmpty()) {
            out.put("current", pet != null ? pet.getWeight() : BigDecimal.ZERO);
            out.put("average", pet != null ? pet.getWeight() : BigDecimal.ZERO);
            out.put("trend", "stable");
            out.put("min", BigDecimal.ZERO);
            out.put("max", BigDecimal.ZERO);
            out.put("count", 0);
            return out;
        }
        BigDecimal sum = BigDecimal.ZERO;
        BigDecimal min = records.get(0).getWeight();
        BigDecimal max = records.get(0).getWeight();
        for (WeightRecord r : records) {
            sum = sum.add(r.getWeight());
            if (r.getWeight().compareTo(min) < 0) min = r.getWeight();
            if (r.getWeight().compareTo(max) > 0) max = r.getWeight();
        }
        BigDecimal avg = sum.divide(BigDecimal.valueOf(records.size()), 2, java.math.RoundingMode.HALF_UP);
        WeightRecord current = records.get(records.size() - 1);
        String trend = "stable";
        if (records.size() >= 2) {
            WeightRecord prev = records.get(records.size() - 2);
            if (current.getWeight().compareTo(prev.getWeight()) > 0) trend = "up";
            else if (current.getWeight().compareTo(prev.getWeight()) < 0) trend = "down";
        }
        out.put("current", current.getWeight());
        out.put("average", avg);
        out.put("trend", trend);
        out.put("min", min);
        out.put("max", max);
        out.put("count", records.size());
        return out;
    }

    private void verifyOwner(Long petId) {
        Pet pet = petMapper.selectById(petId);
        if (pet == null || !pet.getUserId().equals(UserContext.require())) {
            throw new BizException(403, "无权操作");
        }
    }
}