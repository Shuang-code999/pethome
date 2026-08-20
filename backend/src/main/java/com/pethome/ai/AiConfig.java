package com.pethome.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.ai.chat.client.ChatClient;

/** Spring AI ChatClient：百炼 DashScope（OpenAI 兼容端点，见 application.yml） */
@Configuration
public class AiConfig {

    @Value("${pethome.customer-service.system-prompt}")
    private String systemPrompt;

    @Bean
    public ChatClient chatClient(ChatClient.Builder builder) {
        return builder.defaultSystem(systemPrompt).build();
    }
}
