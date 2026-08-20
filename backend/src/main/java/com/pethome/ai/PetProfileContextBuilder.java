package com.pethome.ai;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.pethome.config.ConsultConfig;
import com.pethome.entity.HealthRecord;
import com.pethome.entity.Pet;
import com.pethome.entity.WeightRecord;
import com.pethome.mapper.HealthRecordMapper;
import com.pethome.mapper.WeightRecordMapper;
import com.pethome.service.PetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Period;
import java.util.List;

/**
 * 宠物档案上下文构建器：把宠物档案 + 近期体重 + 健康记录拼成结构化文本，
 * 注入问诊 System Prompt，使 AI 能给出基于该宠物档案的针对性建议。
 *
 * 设计为「内置功能」：会话绑定 petId 后，每次问诊自动注入，对调用方透明。
 * 任何环节失败（宠物被删/字段缺失）都安全降级为空串，不影响问诊主流程。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PetProfileContextBuilder {

    private final PetService petService;
    private final WeightRecordMapper weightRecordMapper;
    private final HealthRecordMapper healthRecordMapper;
    private final ConsultConfig consultConfig;

    /**
     * 构建档案上下文文本。petId 为空或加载失败时返回空串（通用问诊，向后兼容）。
     */
    public String build(Long petId) {
        if (petId == null) {
            return "";
        }
        try {
            Pet pet = petService.getById(petId); // 内置归属校验 + 旁路缓存
            if (pet == null) {
                return "";
            }
            StringBuilder sb = new StringBuilder();
            sb.append("\n\n【当前问诊宠物档案】\n");

            // ---- 基础资料 ----
            appendLine(sb, "姓名", pet.getName());
            appendLine(sb, "物种", pet.getSpecies());
            appendLine(sb, "品种", pet.getBreed());
            appendLine(sb, "性别", genderText(pet.getGender()));
            appendLine(sb, "年龄", ageText(pet));
            appendLine(sb, "体重", weightText(pet));
            appendLine(sb, "绝育", neuteredText(pet.getNeutered()));
            appendLine(sb, "毛色", pet.getCoatColor());
            appendLine(sb, "主食", pet.getStapleFood());
            appendLine(sb, "血统编号", pet.getPedigreeNo());
            appendLine(sb, "芯片号", pet.getChipNo());

            // ---- 风险备注（针对性建议的关键依据） ----
            appendLine(sb, "过敏史", pet.getAllergy());
            appendLine(sb, "慢性病", pet.getChronicDisease());
            appendLine(sb, "禁忌药物", pet.getForbiddenDrugs());
            appendLine(sb, "脾气性格", pet.getTemperament());
            appendLine(sb, "应激情况", pet.getStress());
            appendLine(sb, "特殊照料", pet.getSpecialCare());

            // ---- 近期体重趋势 ----
            String weightTrend = buildWeightTrend(pet.getId());
            if (!weightTrend.isBlank()) {
                sb.append("- 近期体重：").append(weightTrend).append("\n");
            }

            // ---- 健康记录（疫苗/驱虫/体检等，含到期提醒） ----
            String healthSummary = buildHealthSummary(pet.getId());
            if (!healthSummary.isBlank()) {
                sb.append("- 健康记录：").append(healthSummary).append("\n");
            }

            // ---- 注入指令：引导模型结合档案给针对性建议 ----
            String instruction = consultConfig.getProfilePrompt();
            if (instruction != null && !instruction.isBlank()) {
                sb.append("\n").append(instruction.trim()).append("\n");
            }
            return sb.toString();
        } catch (Exception e) {
            log.warn("[PetProfileContextBuilder] 构建档案上下文失败 petId={}: {}", petId, e.getMessage());
            return "";
        }
    }

    /** 近期体重（最近 3 条，时间正序），标注趋势 */
    private String buildWeightTrend(Long petId) {
        List<WeightRecord> records = weightRecordMapper.selectList(
                new LambdaQueryWrapper<WeightRecord>()
                        .eq(WeightRecord::getPetId, petId)
                        .orderByDesc(WeightRecord::getRecordDate)
                        .last("limit 3"));
        if (records.isEmpty()) {
            return "";
        }
        java.util.Collections.reverse(records); // 时间正序
        StringBuilder w = new StringBuilder();
        for (int i = 0; i < records.size(); i++) {
            WeightRecord r = records.get(i);
            if (i > 0) w.append(" → ");
            w.append(r.getRecordDate()).append(" ").append(r.getWeight()).append("kg");
        }
        if (records.size() >= 2) {
            BigDecimal first = records.get(0).getWeight();
            BigDecimal last = records.get(records.size() - 1).getWeight();
            if (first != null && last != null) {
                int cmp = last.compareTo(first);
                if (cmp > 0) w.append("（上升）");
                else if (cmp < 0) w.append("（下降）");
                else w.append("（持平）");
            }
        }
        return w.toString();
    }

    /** 健康记录（最近 5 条，突出 nextDate 到期项） */
    private String buildHealthSummary(Long petId) {
        List<HealthRecord> records = healthRecordMapper.selectList(
                new LambdaQueryWrapper<HealthRecord>()
                        .eq(HealthRecord::getPetId, petId)
                        .orderByDesc(HealthRecord::getRecordDate)
                        .last("limit 5"));
        if (records.isEmpty()) {
            return "";
        }
        StringBuilder h = new StringBuilder();
        for (HealthRecord r : records) {
            if (h.length() > 0) h.append("；");
            h.append(nullToEmpty(r.getType())).append("/")
                    .append(nullToEmpty(r.getName()));
            if (r.getRecordDate() != null) h.append("(记录 ").append(r.getRecordDate()).append(")");
            if (r.getNextDate() != null) {
                String due = r.getNextDate().isBefore(LocalDate.now()) ? "已到期" : "下次 " + r.getNextDate();
                h.append("(").append(due).append(")");
            }
        }
        return h.toString();
    }

    private String ageText(Pet pet) {
        if (pet.getBirthday() != null) {
            Period p = Period.between(pet.getBirthday(), LocalDate.now());
            if (p.getYears() > 0 && p.getMonths() > 0) {
                return p.getYears() + " 岁 " + p.getMonths() + " 个月（出生 " + pet.getBirthday() + "）";
            } else if (p.getYears() > 0) {
                return p.getYears() + " 岁（出生 " + pet.getBirthday() + "）";
            } else if (p.getMonths() > 0) {
                return p.getMonths() + " 个月（出生 " + pet.getBirthday() + "）";
            } else if (p.getDays() >= 0) {
                return "不足 1 个月（出生 " + pet.getBirthday() + "）";
            }
        }
        return nullToEmpty(pet.getAgeText());
    }

    private String weightText(Pet pet) {
        // 优先用最新体重记录，回退档案 weight 字段
        BigDecimal w = pet.getWeight();
        return w == null ? null : w + " kg";
    }

    private String genderText(Integer gender) {
        if (gender == null) return null;
        return switch (gender) {
            case 0 -> "母";
            case 1 -> "公";
            default -> "未知";
        };
    }

    private String neuteredText(Integer neutered) {
        if (neutered == null) return null;
        return neutered == 1 ? "已绝育" : "未绝育";
    }

    private void appendLine(StringBuilder sb, String label, String value) {
        if (value == null || value.isBlank()) return;
        sb.append("- ").append(label).append("：").append(value).append("\n");
    }

    private String nullToEmpty(String s) {
        return s == null ? "" : s;
    }
}
