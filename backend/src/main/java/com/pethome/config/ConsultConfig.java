package com.pethome.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

/** AI 问诊配置：模型列表 + 知识库开关 */
@Data
@Configuration
@ConfigurationProperties(prefix = "pethome.consult")
public class ConsultConfig {

    /** 系统提示词 */
    private String systemPrompt;

    /** 宠物档案上下文注入指令（拼在档案信息之后，引导模型给出针对性建议） */
    private String profilePrompt;

    /** 可选模型列表 */
    private List<ModelOption> models = new ArrayList<>();

    /** 知识库配置 */
    private KnowledgeBase knowledgeBase = new KnowledgeBase();

    @Data
    public static class ModelOption {
        private String id;
        private String name;
        private String desc;
        private boolean isDefault;
    }

    @Data
    public static class KnowledgeBase {
        private boolean enabled = true;
        private int topK = 3;
    }

    /** 获取默认模型 ID */
    public String getDefaultModel() {
        return models.stream()
                .filter(ModelOption::isDefault)
                .findFirst()
                .map(ModelOption::getId)
                .orElse(models.isEmpty() ? "qwen-plus" : models.get(0).getId());
    }
}