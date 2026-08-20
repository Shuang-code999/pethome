package com.pethome.service;

import com.tencentcloudapi.common.Credential;
import com.tencentcloudapi.ocr.v20181119.OcrClient;
import com.tencentcloudapi.ocr.v20181119.models.SmartStructuralOCRRequest;
import com.tencentcloudapi.ocr.v20181119.models.SmartStructuralOCRResponse;
import com.tencentcloudapi.ocr.v20181119.models.StructuralItem;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** 腾讯云 OCR 智能结构化识别：拍照识别疫苗本、体检报告 */
@Slf4j
@Service
public class OcrService {

    private final OcrClient ocrClient;
    private final boolean enabled;

    public OcrService(@Value("${pethome.tencent.secret-id:}") String secretId,
                      @Value("${pethome.tencent.secret-key:}") String secretKey) {
        this.enabled = StringUtils.hasText(secretId) && StringUtils.hasText(secretKey);
        if (this.enabled) {
            Credential credential = new Credential(secretId, secretKey);
            this.ocrClient = new OcrClient(credential, "ap-guangzhou");
            log.info("[OCR] 腾讯云 OCR 已启用");
        } else {
            this.ocrClient = null;
            log.info("[OCR] 腾讯云 OCR 未配置，识别功能不可用");
        }
    }

    /** 识别健康记录图片，返回结构化数据 */
    public Map<String, Object> recognizeHealthRecord(String imageUrl) {
        if (!enabled) {
            return Map.of("success", false, "message", "OCR 服务未配置");
        }

        try {
            SmartStructuralOCRRequest req = new SmartStructuralOCRRequest();
            req.setImageUrl(imageUrl);

            SmartStructuralOCRResponse resp = ocrClient.SmartStructuralOCR(req);
            StructuralItem[] items = resp.getStructuralItems();

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("rawText", new ArrayList<>());

            List<Map<String, String>> fields = new ArrayList<>();
            if (items != null) {
                for (StructuralItem item : items) {
                    Map<String, String> field = new HashMap<>();
                    field.put("name", item.getName());
                    field.put("value", item.getValue());
                    fields.add(field);
                }
            }
            result.put("fields", fields);

            // 尝试从识别结果中提取健康记录相关信息
            Map<String, String> healthData = extractHealthData(fields);
            result.put("healthData", healthData);

            log.info("[OCR] 识别完成，提取 {} 个字段", fields.size());
            return result;
        } catch (Exception e) {
            log.error("[OCR] 识别失败", e);
            return Map.of("success", false, "message", "识别失败: " + e.getMessage());
        }
    }

    /** 从 OCR 结果中提取健康记录关键字段 */
    private Map<String, String> extractHealthData(List<Map<String, String>> fields) {
        Map<String, String> data = new HashMap<>();
        for (Map<String, String> field : fields) {
            String name = field.get("name").toLowerCase();
            String value = field.get("value");

            if (name.contains("疫苗") || name.contains("名称") || name.contains("项目")) {
                data.putIfAbsent("name", value);
            } else if (name.contains("日期") || name.contains("时间") || name.contains("date")) {
                if (data.containsKey("recordDate")) {
                    data.putIfAbsent("nextDate", value);
                } else {
                    data.putIfAbsent("recordDate", value);
                }
            } else if (name.contains("医院") || name.contains("机构") || name.contains("备注")) {
                data.putIfAbsent("note", value);
            }
        }
        // 默认类型为疫苗
        data.putIfAbsent("type", "vaccine");
        return data;
    }
}
