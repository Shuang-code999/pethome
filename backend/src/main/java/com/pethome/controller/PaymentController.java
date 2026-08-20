package com.pethome.controller;

import com.pethome.common.Result;
import com.pethome.entity.Order;
import com.pethome.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/pay")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /** 创建支付订单（返回支付宝支付表单/链接） */
    @PostMapping("/create")
    public Result<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        String subject = (String) body.getOrDefault("subject", "萌宠之家-商品");
        Long productId = body.get("productId") instanceof Number n ? n.longValue() : null;
        String specLabel = (String) body.getOrDefault("specLabel", "");
        Integer quantity = body.get("quantity") instanceof Number n2 ? n2.intValue() : 1;
        return Result.ok(paymentService.createOrder(amount, subject, productId, specLabel, quantity));
    }

    /** 支付宝异步回调通知 */
    @PostMapping("/notify")
    public String notify(@RequestParam Map<String, String> params) {
        return paymentService.handleNotify(params);
    }

    /** 查询订单状态 */
    @GetMapping("/query/{orderNo}")
    public Result<Order> query(@PathVariable String orderNo) {
        Order order = paymentService.queryOrder(orderNo);
        if (order == null) return Result.fail(404, "订单不存在");
        return Result.ok(order);
    }

    /** 我的订单列表 */
    @GetMapping("/orders")
    public Result<List<Order>> myOrders() {
        return Result.ok(paymentService.myOrders());
    }

    /** 取消订单 */
    @PostMapping("/cancel/{orderNo}")
    public Result<Void> cancel(@PathVariable String orderNo) {
        paymentService.cancelOrder(orderNo);
        return Result.ok();
    }
}
