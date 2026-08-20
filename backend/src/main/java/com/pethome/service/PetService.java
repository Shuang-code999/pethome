package com.pethome.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.pethome.common.BizException;
import com.pethome.common.Constants;
import com.pethome.entity.Pet;
import com.pethome.mapper.PetMapper;
import com.pethome.util.UserContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class PetService {

    private final PetMapper petMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    /** 我的宠物列表 */
    public List<Pet> myPets() {
        return petMapper.selectList(new LambdaQueryWrapper<Pet>()
                .eq(Pet::getUserId, UserContext.require())
                .orderByDesc(Pet::getCreateTime));
    }

    /** 查宠物档案：旁路缓存（高频读）
     *  cache-aside: 先 Redis -> 未命中查 DB -> 回写缓存 */
    public Pet getById(Long id) {
        String key = Constants.PET_CACHE + id;
        Object cached = redisTemplate.opsForValue().get(key);
        if (cached instanceof Pet) {
            Pet cp = (Pet) cached;
            // 缓存命中但归属校验失败（孤儿缓存 / 别人缓存）→ 删缓存走 DB
            if (cp.getUserId() == null || cp.getUserId().equals(UserContext.require())) {
                return cp;
            }
            redisTemplate.delete(key);
        }
        Pet pet = petMapper.selectById(id);
        if (pet == null) throw new BizException(404, "宠物档案不存在");
        // 兼容：旧数据 pet.userId 为 NULL → 自动归属当前用户（孤儿宠物回填）
        if (pet.getUserId() == null) {
            log.warn("[PetService.getById] 宠物 {} 的 userId 为 NULL，自动归属到当前用户 {}", id, UserContext.require());
            pet.setUserId(UserContext.require());
            petMapper.updateById(pet);
        } else if (!pet.getUserId().equals(UserContext.require())) {
            throw new BizException(403, "无权访问");
        }
        redisTemplate.opsForValue().set(key, pet, 30, TimeUnit.MINUTES);
        return pet;
    }

    /** 新建档案 */
    public Pet create(Pet pet) {
        pet.setUserId(UserContext.require());
        petMapper.insert(pet);
        return pet;
    }

    /** 更新档案：先更新 DB 再删缓存（旁路缓存写策略）
     *  兼容：孤儿宠物（userId NULL）允许当前用户接管 */
    public Pet update(Long id, Pet pet) {
        Long currentUser = UserContext.require();
        Pet exist = petMapper.selectById(id);
        if (exist == null) throw new BizException(404, "宠物档案不存在");
        if (exist.getUserId() == null) {
            log.warn("[PetService.update] 宠物 {} 孤儿宠物，自动归属到当前用户 {}", id, currentUser);
            exist.setUserId(currentUser);
            petMapper.updateById(exist);
        } else if (!exist.getUserId().equals(currentUser)) {
            log.warn("[PetService.update] 宠物 {} 归属用户 {}，但当前用户 {} 无权操作",
                    id, exist.getUserId(), currentUser);
            throw new BizException(403, "无权操作");
        }
        pet.setId(id);
        pet.setUserId(exist.getUserId());
        petMapper.updateById(pet);
        redisTemplate.delete(Constants.PET_CACHE + id);
        return petMapper.selectById(id);
    }

    /** 删除档案：兼容孤儿宠物
     *  兼容：孤儿宠物（userId NULL）允许当前用户接管
     *  兼容：归属不一致时（数据漂移/换号登录）打印强日志，方便排查 */
    public void delete(Long id) {
        Long currentUser = UserContext.require();
        Pet exist = petMapper.selectById(id);
        if (exist == null) throw new BizException(404, "宠物档案不存在");
        if (exist.getUserId() == null) {
            log.warn("[PetService.delete] 宠物 {} 孤儿宠物，自动归属到当前用户 {}", id, currentUser);
            exist.setUserId(currentUser);
            petMapper.updateById(exist);
        } else if (!exist.getUserId().equals(currentUser)) {
            // 归属漂移：日志里同时打印两端 ID，便于排查 token / 账号切换问题
            log.warn("[PetService.delete] 宠物 {} 归属用户 {}，但当前用户 {} 无权操作（疑似换号/数据漂移）",
                    id, exist.getUserId(), currentUser);
            throw new BizException(403, "无权操作：宠物归属异常，请重新登录或联系管理员");
        }
        petMapper.deleteById(id);
        redisTemplate.delete(Constants.PET_CACHE + id);
    }
}
