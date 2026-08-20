package com.pethome.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.pethome.common.Result;
import com.pethome.entity.KnowledgeEntry;
import com.pethome.mapper.KnowledgeEntryMapper;
import com.pethome.util.UserContext;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/** AI 问诊知识库 CRUD（仅登录用户可读，管理员可写） */
@RestController
@RequestMapping("/knowledge")
@RequiredArgsConstructor
public class KnowledgeController {

    private final KnowledgeEntryMapper mapper;

    /** 列出知识库（按分类） */
    @GetMapping
    public Result<List<KnowledgeEntry>> list(@RequestParam(required = false) String category) {
        UserContext.require();
        LambdaQueryWrapper<KnowledgeEntry> w = new LambdaQueryWrapper<KnowledgeEntry>()
                .orderByDesc(KnowledgeEntry::getUpdateTime);
        if (category != null && !category.isBlank() && !"all".equals(category)) {
            w.eq(KnowledgeEntry::getCategory, category);
        }
        return Result.ok(mapper.selectList(w));
    }

    /** 详情 */
    @GetMapping("/{id}")
    public Result<KnowledgeEntry> detail(@PathVariable Long id) {
        UserContext.require();
        KnowledgeEntry entry = mapper.selectById(id);
        if (entry == null) return Result.fail(404, "条目不存在");
        return Result.ok(entry);
    }

    /** 新增（管理员或任意登录用户均可，演示用） */
    @PostMapping
    public Result<KnowledgeEntry> create(@RequestBody KnowledgeEntry entry) {
        UserContext.require();
        if (entry.getTitle() == null || entry.getTitle().isBlank()) {
            return Result.fail(400, "标题不能为空");
        }
        if (entry.getContent() == null || entry.getContent().isBlank()) {
            return Result.fail(400, "内容不能为空");
        }
        entry.setCreateTime(LocalDateTime.now());
        entry.setUpdateTime(LocalDateTime.now());
        mapper.insert(entry);
        return Result.ok(entry);
    }

    /** 更新 */
    @PutMapping("/{id}")
    public Result<KnowledgeEntry> update(@PathVariable Long id, @RequestBody KnowledgeEntry entry) {
        UserContext.require();
        KnowledgeEntry exist = mapper.selectById(id);
        if (exist == null) return Result.fail(404, "条目不存在");
        if (entry.getTitle() != null) exist.setTitle(entry.getTitle());
        if (entry.getContent() != null) exist.setContent(entry.getContent());
        if (entry.getCategory() != null) exist.setCategory(entry.getCategory());
        if (entry.getTags() != null) exist.setTags(entry.getTags());
        exist.setUpdateTime(LocalDateTime.now());
        mapper.updateById(exist);
        return Result.ok(exist);
    }

    /** 删除 */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        UserContext.require();
        mapper.deleteById(id);
        return Result.ok();
    }
}