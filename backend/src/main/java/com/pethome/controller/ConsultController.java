package com.pethome.controller;

import com.pethome.ai.PetProfileContextBuilder;
import com.pethome.ai.RagService;
import com.pethome.common.BizException;
import com.pethome.common.Result;
import com.pethome.config.ConsultConfig;
import com.pethome.entity.ConsultMessage;
import com.pethome.entity.ConsultSession;
import com.pethome.mapper.ConsultMessageMapper;
import com.pethome.mapper.ConsultSessionMapper;
import com.pethome.service.FileStorageService;
import com.pethome.service.PetService;
import com.pethome.util.UserContext;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.content.Media;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.util.MimeTypeUtils;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;

/** AI 问诊：多轮对话 + RAG 知识库 + 图片问诊 */
@Slf4j
@RestController
@RequestMapping("/consult")
@RequiredArgsConstructor
public class ConsultController {

    private final ChatClient.Builder chatClientBuilder;
    private final ConsultSessionMapper sessionMapper;
    private final ConsultMessageMapper messageMapper;
    private final RagService ragService;
    private final PetProfileContextBuilder profileContextBuilder;
    private final PetService petService;
    private final FileStorageService fileStorageService;
    private final ConsultConfig consultConfig;

    @Value("${pethome.consult.system-prompt}")
    private String consultSystemPrompt;

    /** 获取可用模型列表 + 知识库状态（公开接口，无需登录） */
    @GetMapping("/models")
    public Result<Map<String, Object>> models() {
        Map<String, Object> data = new HashMap<>();
        data.put("models", consultConfig.getModels());
        data.put("defaultModel", consultConfig.getDefaultModel());
        data.put("knowledgeBase", Map.of(
                "enabled", consultConfig.getKnowledgeBase().isEnabled(),
                "topK", consultConfig.getKnowledgeBase().getTopK(),
                "docCount", ragService.getDocumentCount()
        ));
        return Result.ok(data);
    }

    /** 创建问诊会话。可传 petId 绑定宠物档案，后续问诊将自动注入该档案作为针对性上下文 */
    @PostMapping("/sessions")
    public Result<Long> createSession(@RequestBody(required = false) Map<String, Object> body) {
        Long userId = UserContext.require();
        ConsultSession session = new ConsultSession();
        session.setUserId(userId);
        String title = body == null ? null : (String) body.get("title");
        session.setTitle(title == null || title.toString().isBlank() ? "新的问诊" : title.toString());
        // 绑定宠物档案（可选）：校验归属，失败则不绑定（通用问诊）
        Long petId = body == null ? null : toLong(body.get("petId"));
        if (petId != null) {
            if (!validatePetOwnership(petId, userId)) {
                return Result.fail(400, "宠物不存在或不属于你");
            }
            session.setPetId(petId);
        }
        session.setCreateTime(LocalDateTime.now());
        sessionMapper.insert(session);
        return Result.ok(session.getId());
    }

    /** 给已有会话绑定/更换宠物档案（用于针对性问诊上下文）。petId 传 null 解绑 */
    @PutMapping("/sessions/{id}/pet")
    public Result<Void> bindPet(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        Long userId = UserContext.require();
        ConsultSession session = sessionMapper.selectById(id);
        if (session == null || !session.getUserId().equals(userId)) {
            return Result.fail(403, "无权访问该会话");
        }
        Long petId = body == null ? null : toLong(body.get("petId"));
        if (petId != null && !validatePetOwnership(petId, userId)) {
            return Result.fail(400, "宠物不存在或不属于你");
        }
        session.setPetId(petId);
        sessionMapper.updateById(session);
        return Result.ok(null);
    }

    /** 校验宠物存在且属于指定用户 */
    private boolean validatePetOwnership(Long petId, Long userId) {
        try {
            petService.getById(petId); // 内置归属校验：不属于则抛 BizException(403)
            return true;
        } catch (BizException e) {
            return false;
        }
    }

    private Long toLong(Object o) {
        if (o == null) return null;
        String s = o.toString().trim();
        if (s.isEmpty()) return null;
        try {
            return Long.valueOf(s);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /** 构建 System Prompt：基础提示 + 宠物档案上下文(若有) + RAG 知识(若启用) */
    private String buildSystemPrompt(Long petId, String knowledge) {
        return consultSystemPrompt + profileContextBuilder.build(petId) + knowledge;
    }

    /** 当前用户的会话列表 */
    @GetMapping("/sessions")
    public Result<List<ConsultSession>> sessions() {
        Long userId = UserContext.require();
        List<ConsultSession> list = sessionMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<ConsultSession>()
                        .eq(ConsultSession::getUserId, userId)
                        .orderByDesc(ConsultSession::getCreateTime));
        return Result.ok(list);
    }

    /** 获取会话消息 */
    @GetMapping("/sessions/{id}/messages")
    public Result<List<ConsultMessage>> messages(@PathVariable Long id) {
        Long userId = UserContext.require();
        ConsultSession session = sessionMapper.selectById(id);
        if (session == null || !session.getUserId().equals(userId)) {
            return Result.fail(403, "无权访问该会话");
        }
        List<ConsultMessage> list = messageMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<ConsultMessage>()
                        .eq(ConsultMessage::getSessionId, id)
                        .orderByAsc(ConsultMessage::getCreateTime));
        return Result.ok(list);
    }

    /** 发送消息（多轮 + RAG + 模型选择） */
    @PostMapping("/sessions/{id}/messages")
    public Result<ConsultMessage> sendMessage(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Long userId = UserContext.require();
        String content = body == null ? null : body.get("content");
        if (content == null || content.isBlank()) {
            return Result.fail(400, "消息内容不能为空");
        }
        ConsultSession session = sessionMapper.selectById(id);
        if (session == null || !session.getUserId().equals(userId)) {
            return Result.fail(403, "无权访问该会话");
        }
        // 解析模型：用户指定 > 会话记忆 > 默认
        String requestedModel = body.get("model");
        String requested = (requestedModel == null || requestedModel.isBlank())
                ? consultConfig.getDefaultModel()
                : requestedModel;
        final String modelId;
        // 校验模型可用
        boolean modelValid = consultConfig.getModels().stream()
                .anyMatch(m -> m.getId().equals(requested));
        modelId = modelValid ? requested : consultConfig.getDefaultModel();

        // 保存用户消息
        ConsultMessage userMsg = new ConsultMessage();
        userMsg.setSessionId(id);
        userMsg.setRole("user");
        userMsg.setContent(content);
        userMsg.setCreateTime(LocalDateTime.now());
        messageMapper.insert(userMsg);

        // 组装历史（最近 10 条）
        List<ConsultMessage> history = messageMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<ConsultMessage>()
                        .eq(ConsultMessage::getSessionId, id)
                        .orderByDesc(ConsultMessage::getCreateTime)
                        .last("limit 10"));
        Collections.reverse(history);

        // RAG 检索
        String knowledge = consultConfig.getKnowledgeBase().isEnabled()
                ? ragService.retrieve(content, consultConfig.getKnowledgeBase().getTopK())
                : "";

        List<Message> messages = new ArrayList<>();
        messages.add(new SystemMessage(buildSystemPrompt(session.getPetId(), knowledge)));
        for (ConsultMessage m : history) {
            if ("user".equals(m.getRole())) {
                messages.add(new UserMessage(m.getContent()));
            } else if ("assistant".equals(m.getRole())) {
                messages.add(new AssistantMessage(m.getContent()));
            }
        }

        String reply = callAi(messages, modelId);

        ConsultMessage assistantMsg = new ConsultMessage();
        assistantMsg.setSessionId(id);
        assistantMsg.setRole("assistant");
        assistantMsg.setContent(reply);
        assistantMsg.setCreateTime(LocalDateTime.now());
        messageMapper.insert(assistantMsg);

        // 首次消息自动更新会话标题
        if (history.size() <= 1 && (session.getTitle() == null || session.getTitle().startsWith("新的问诊"))) {
            String title = content.length() > 20 ? content.substring(0, 20) + "..." : content;
            session.setTitle(title);
            sessionMapper.updateById(session);
        }

        return Result.ok(assistantMsg);
    }

    /** 图片问诊（多模态）：自动创建会话。可传 petId 绑定宠物档案 */
    @PostMapping("/image")
    public Result<Map<String, Object>> imageConsult(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "model", required = false) String model,
            @RequestParam(value = "petId", required = false) Long petId,
            HttpServletRequest req) {
        Long userId = UserContext.require();
        if (file == null || file.isEmpty()) {
            return Result.fail(400, "请上传图片");
        }
        String modelId = (model == null || model.isBlank())
                ? consultConfig.getDefaultModel()
                : model;

        String path;
        try {
            path = fileStorageService.store(file);
        } catch (IOException e) {
            log.error("图片上传失败", e);
            return Result.fail(500, "图片上传失败");
        } catch (IllegalArgumentException e) {
            return Result.fail(400, e.getMessage());
        }
        String imageUrl = fileStorageService.toAbsoluteUrl(path, req);

        // 创建会话（可选绑定宠物档案）
        ConsultSession session = new ConsultSession();
        session.setUserId(userId);
        session.setTitle("图片问诊");
        if (petId != null && validatePetOwnership(petId, userId)) {
            session.setPetId(petId);
        }
        session.setCreateTime(LocalDateTime.now());
        sessionMapper.insert(session);

        String userText = (content == null || content.isBlank()) ? "请根据图片中的宠物皮肤/身体情况，给出初步分诊建议。" : content;

        // 保存用户图片消息
        ConsultMessage userMsg = new ConsultMessage();
        userMsg.setSessionId(session.getId());
        userMsg.setRole("user");
        userMsg.setContent(userText);
        userMsg.setImageUrl(path);
        userMsg.setCreateTime(LocalDateTime.now());
        messageMapper.insert(userMsg);

        // 多模态调用
        String reply;
        try {
            byte[] bytes = readImageBytes(path);
            org.springframework.util.MimeType mimeType = resolveMimeType(path);
            UserMessage userMessage = UserMessage.builder()
                    .text(userText)
                    .media(new Media(mimeType, new ByteArrayResource(bytes)))
                    .build();
            List<Message> messages = List.of(
                    new SystemMessage(buildSystemPrompt(session.getPetId(), "")),
                    userMessage);
            reply = callAi(messages, modelId);
        } catch (Exception e) {
            log.error("图片问诊 AI 调用失败", e);
            reply = "图片分析暂时不可用，已记录你的问题，建议尽快联系专业兽医。";
        }

        ConsultMessage assistantMsg = new ConsultMessage();
        assistantMsg.setSessionId(session.getId());
        assistantMsg.setRole("assistant");
        assistantMsg.setContent(reply);
        assistantMsg.setCreateTime(LocalDateTime.now());
        messageMapper.insert(assistantMsg);

        Map<String, Object> data = new HashMap<>();
        data.put("sessionId", session.getId());
        data.put("reply", reply);
        data.put("imageUrl", imageUrl);
        data.put("model", modelId);
        return Result.ok(data);
    }

    /**
     * 流式发送消息（SSE）
     * - 立刻保存用户消息
     * - 通过 SseEmitter 逐 chunk 推送 AI 回复
     * - 流式结束后保存 assistant 消息
     *
     * GET /consult/sessions/{id}/stream?content=xxx&model=qwen-plus
     */
    @GetMapping(value = "/sessions/{id}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamMessage(@PathVariable Long id,
                                   @RequestParam String content,
                                   @RequestParam(required = false) String model) {
        Long userId = UserContext.require();
        if (content == null || content.isBlank()) {
            SseEmitter e = new SseEmitter(0L);
            try { e.send(SseEmitter.event().name("error").data("消息内容不能为空")); e.complete(); } catch (Exception ignored) {}
            return e;
        }
        ConsultSession session = sessionMapper.selectById(id);
        if (session == null || !session.getUserId().equals(userId)) {
            SseEmitter e = new SseEmitter(0L);
            try { e.send(SseEmitter.event().name("error").data("无权访问该会话")); e.complete(); } catch (Exception ignored) {}
            return e;
        }
        String requested = (model == null || model.isBlank())
                ? consultConfig.getDefaultModel() : model;
        boolean valid = consultConfig.getModels().stream().anyMatch(m -> m.getId().equals(requested));
        final String modelId = valid ? requested : consultConfig.getDefaultModel();

        // 保存用户消息
        ConsultMessage userMsg = new ConsultMessage();
        userMsg.setSessionId(id);
        userMsg.setRole("user");
        userMsg.setContent(content);
        userMsg.setCreateTime(LocalDateTime.now());
        messageMapper.insert(userMsg);

        // 拉历史 + RAG
        List<ConsultMessage> history = messageMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<ConsultMessage>()
                        .eq(ConsultMessage::getSessionId, id)
                        .orderByDesc(ConsultMessage::getCreateTime)
                        .last("limit 10"));
        Collections.reverse(history);
        String knowledge = consultConfig.getKnowledgeBase().isEnabled()
                ? ragService.retrieve(content, consultConfig.getKnowledgeBase().getTopK())
                : "";
        List<Message> messages = new ArrayList<>();
        messages.add(new SystemMessage(buildSystemPrompt(session.getPetId(), knowledge)));
        for (ConsultMessage m : history) {
            if ("user".equals(m.getRole())) messages.add(new UserMessage(m.getContent()));
            else if ("assistant".equals(m.getRole())) messages.add(new AssistantMessage(m.getContent()));
        }

        // 30 分钟超时；0L = 永不超时（依赖客户端断开）
        SseEmitter emitter = new SseEmitter(30 * 60_000L);
        StringBuilder fullReply = new StringBuilder();
        try {
            chatClientBuilder.clone().build()
                    .prompt()
                    .messages(messages)
                    .options(org.springframework.ai.openai.OpenAiChatOptions.builder()
                            .model(modelId)
                            .streamUsage(true)
                            .build())
                    .stream()
                    .content()
                    .subscribe(
                            chunk -> {
                                if (chunk == null) return;
                                fullReply.append(chunk);
                                try { emitter.send(SseEmitter.event().name("message").data(chunk)); }
                                catch (Exception ex) { /* ignore */ }
                            },
                            err -> {
                                log.error("SSE 流式调用失败", err);
                                try {
                                    String fallback = "AI 服务暂时不可用，请稍后重试。";
                                    emitter.send(SseEmitter.event().name("error").data(fallback));
                                    emitter.send(SseEmitter.event().name("done").data(fallback));
                                    emitter.complete();
                                } catch (Exception ignored) {}
                            },
                            () -> {
                                // 流结束：保存 assistant 消息
                                try {
                                    String reply = fullReply.toString();
                                    if (reply.isBlank()) reply = "（AI 未返回内容）";
                                    ConsultMessage am = new ConsultMessage();
                                    am.setSessionId(id);
                                    am.setRole("assistant");
                                    am.setContent(reply);
                                    am.setCreateTime(LocalDateTime.now());
                                    messageMapper.insert(am);
                                    emitter.send(SseEmitter.event().name("done").data(reply));
                                    emitter.complete();
                                    // 首次消息自动更新会话标题
                                    if (history.size() <= 1 && (session.getTitle() == null || session.getTitle().startsWith("新的问诊"))) {
                                        String title = content.length() > 20 ? content.substring(0, 20) + "..." : content;
                                        session.setTitle(title);
                                        sessionMapper.updateById(session);
                                    }
                                } catch (Exception ex) {
                                    log.warn("SSE 完成回调失败", ex);
                                }
                            }
                    );
        } catch (Exception e) {
            log.error("启动 SSE 失败", e);
            try { emitter.send(SseEmitter.event().name("error").data("启动流式输出失败")); emitter.complete(); } catch (Exception ignored) {}
        }

        // 客户端断开兜底
        emitter.onCompletion(() -> log.debug("[SSE] session={} 完成", id));
        emitter.onTimeout(() -> { try { emitter.complete(); } catch (Exception ignored) {} });
        emitter.onError(e -> { try { emitter.complete(); } catch (Exception ignored) {} });
        return emitter;
    }

    private String callAi(List<Message> messages, String modelId) {
        try {
            return chatClientBuilder.clone()
                    .build()
                    .prompt()
                    .messages(messages)
                    .options(org.springframework.ai.openai.OpenAiChatOptions.builder()
                            .model(modelId)
                            .build())
                    .call()
                    .content();
        } catch (Exception e) {
            log.error("AI 调用失败 (model={}): {}", modelId, e.getMessage());
            return "AI 服务暂时不可用，请稍后重试；如宠物情况紧急，请立即就医。";
        }
    }

    private byte[] readImageBytes(String path) throws IOException {
        String uploadDir = fileStorageService.getUploadDir();
        Path base = Paths.get(uploadDir);
        String relative = path.startsWith("/uploads/") ? path.substring("/uploads/".length()) : path;
        return Files.readAllBytes(base.resolve(relative));
    }

    private org.springframework.util.MimeType resolveMimeType(String path) {
        String ext = "";
        int i = path.lastIndexOf('.');
        if (i > 0) ext = path.substring(i + 1).toLowerCase();
        return switch (ext) {
            case "png" -> MimeTypeUtils.IMAGE_PNG;
            case "gif" -> MimeTypeUtils.IMAGE_GIF;
            case "webp" -> org.springframework.util.MimeType.valueOf("image/webp");
            default -> MimeTypeUtils.IMAGE_JPEG;
        };
    }
}
