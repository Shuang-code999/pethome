package com.pethome.controller;

import com.pethome.common.Result;
import com.pethome.entity.SeckillVoucher;
import com.pethome.service.SeckillService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/seckill")
@RequiredArgsConstructor
public class SeckillController {

    private final SeckillService seckillService;

    /** 秒杀券列表（免登录可访问） */
    @GetMapping("/list")
    public Result<List<SeckillVoucher>> list() {
        return Result.ok(seckillService.list());
    }

    /** 抢券（需登录） */
    @PostMapping("/{voucherId}")
    public Result<Long> seckill(@PathVariable Long voucherId) {
        return Result.ok(seckillService.seckill(voucherId));
    }

    /** 模拟支付（不接真实支付） */
    @PostMapping("/pay/{orderId}")
    public Result<Void> pay(@PathVariable Long orderId) {
        seckillService.pay(orderId);
        return Result.ok();
    }
}
