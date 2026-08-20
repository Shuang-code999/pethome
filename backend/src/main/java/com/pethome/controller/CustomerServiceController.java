package com.pethome.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

/** 悬浮智能客服：SSE 流式输出（百炼 qwen-plus）
 *  前端 EventSource 调用，逐字推送 */
@RestController
@RequestMapping("/customer-service")
@RequiredArgsConstructor
public class CustomerServiceController {

    private final ChatClient chatClient;

    /** 流式对话：GET /api/customer-service/stream?msg=你好
     *  返回 text/event-stream，每个 chunk 作为一个 data: 行 */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> stream(@RequestParam String msg) {
        return chatClient.prompt()
                .user(msg)
                .stream()
                .content();
    }
}
