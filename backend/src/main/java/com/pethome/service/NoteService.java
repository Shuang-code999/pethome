package com.pethome.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.pethome.common.BizException;
import com.pethome.entity.Pet;
import com.pethome.entity.PetNote;
import com.pethome.mapper.PetMapper;
import com.pethome.mapper.PetNoteMapper;
import com.pethome.util.UserContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NoteService {

    private final PetNoteMapper petNoteMapper;
    private final PetMapper petMapper;

    public List<PetNote> listByPet(Long petId) {
        verifyOwner(petId);
        return petNoteMapper.selectList(new LambdaQueryWrapper<PetNote>()
                .eq(PetNote::getPetId, petId)
                .orderByDesc(PetNote::getUpdateTime));
    }

    public PetNote create(Long petId, PetNote note) {
        verifyOwner(petId);
        note.setPetId(petId);
        note.setUserId(UserContext.require());
        petNoteMapper.insert(note);
        return note;
    }

    public PetNote update(Long id, PetNote note) {
        PetNote existing = petNoteMapper.selectById(id);
        if (existing == null) throw new BizException(404, "笔记不存在");
        verifyOwner(existing.getPetId());
        existing.setTitle(note.getTitle());
        existing.setContent(note.getContent());
        existing.setTags(note.getTags());
        existing.setImages(note.getImages());
        petNoteMapper.updateById(existing);
        return existing;
    }

    public void delete(Long id) {
        PetNote existing = petNoteMapper.selectById(id);
        if (existing == null) throw new BizException(404, "笔记不存在");
        verifyOwner(existing.getPetId());
        petNoteMapper.deleteById(id);
    }

    private void verifyOwner(Long petId) {
        Pet pet = petMapper.selectById(petId);
        if (pet == null || !pet.getUserId().equals(UserContext.require())) {
            throw new BizException(403, "无权操作");
        }
    }
}