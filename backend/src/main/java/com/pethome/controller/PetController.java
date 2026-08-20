package com.pethome.controller;

import com.pethome.common.Result;
import com.pethome.entity.Pet;
import com.pethome.service.PetService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/pet")
@RequiredArgsConstructor
public class PetController {

    private final PetService petService;

    @GetMapping("/list")
    public Result<List<Pet>> myPets() {
        return Result.ok(petService.myPets());
    }

    @GetMapping("/{id}")
    public Result<Pet> get(@PathVariable Long id) {
        return Result.ok(petService.getById(id));
    }

    @PostMapping
    public Result<Pet> create(@RequestBody Pet pet) {
        return Result.ok(petService.create(pet));
    }

    @PutMapping("/{id}")
    public Result<Pet> update(@PathVariable Long id, @RequestBody Pet pet) {
        return Result.ok(petService.update(id, pet));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        petService.delete(id);
        return Result.ok();
    }
}
