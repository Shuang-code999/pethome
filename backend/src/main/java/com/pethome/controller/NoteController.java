package com.pethome.controller;

import com.pethome.common.Result;
import com.pethome.entity.PetNote;
import com.pethome.service.NoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    @GetMapping("/pet/{petId}/notes")
    public Result<List<PetNote>> list(@PathVariable Long petId) {
        return Result.ok(noteService.listByPet(petId));
    }

    @PostMapping("/pet/{petId}/notes")
    public Result<PetNote> create(@PathVariable Long petId, @RequestBody PetNote note) {
        return Result.ok(noteService.create(petId, note));
    }

    @PutMapping("/pet/notes/{id}")
    public Result<PetNote> update(@PathVariable Long id, @RequestBody PetNote note) {
        return Result.ok(noteService.update(id, note));
    }

    @DeleteMapping("/pet/notes/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        noteService.delete(id);
        return Result.ok();
    }
}