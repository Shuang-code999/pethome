package com.pethome.service;

import com.alipay.api.AlipayApiException;
import com.alipay.api.AlipayClient;
import com.alipay.api.DefaultAlipayClient;
import com.alipay.api.domain.AlipayTradePagePayModel;
import com.alipay.api.internal.util.AlipaySignature;
import com.alipay.api.request.AlipayTradePagePayRequest;
import com.alipay.api.request.AlipayTradeQueryRequest;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.pethome.common.BizException;
import com.pethome.entity.Order;
import com.pethome.mapper.OrderMapper;
import com.pethome.util.UserContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/** 支付宝沙箱支付服务 */
@Slf4j
@Service
public class PaymentService {

    private final OrderMapper orderMapper;
    private final AlipayClient alipayClient;
    private final String alipayPublicKey;
    private final String notifyUrl;
    private final boolean enabled;

    public PaymentService(OrderMapper orderMapper,
                          @Value("${pethome.alipay.app-id:}") String appId,
                          @Value("${pethome.alipay.private-key:}") String privateKey,
                          @Value("${pethome.alipay.public-key:}") String publicKey,
                          @Value("${pethome.alipay.gateway:https://openapi-sandbox.dl.alipaydev.com/gateway.do}") String gateway,
                          @Value("${pethome.alipay.notify-url:}") String notifyUrl) {
        this.orderMapper = orderMapper;
        this.alipayPublicKey = publicKey;
        this.notifyUrl = notifyUrl;
        this.enabled = StringUtils.hasText(appId) && StringUtils.hasText(privateKey) && StringUtils.hasText(publicKey);

        if (this.enabled) {
            this.alipayClient = new DefaultAlipayClient(gateway, appId, privateKey,
                    "json", "UTF-8", publicKey, "RSA2");
            log.info("[支付] 支付宝沙箱已启用，appId={}", appId);
        } else {
            this.alipayClient = null;
            log.info("[支付] 支付宝沙箱未配置，支付功能不可用");
        }
    }

    /** 创建订单并生成支付宝支付链接 */
    public Map<String, Object> createOrder(BigDecimal amount, String subject,
                                           Long productId, String specLabel, Integer quantity) {
        if (!enabled) throw new BizException(500, "支付服务未配置，请配置支付宝沙箱密钥");

        Long userId = UserContext.require();
        String orderNo = generateOrderNo();

        Order order = new Order();
        order.setOrderNo(orderNo);
        order.setUserId(userId);
        order.setAmount(amount);
        order.setSubject(subject);
        order.setStatus(0);
        if (productId != null) order.setProductId(productId);
        if (specLabel != null) order.setSpecLabel(specLabel);
        order.setQuantity(quantity == null || quantity < 1 ? 1 : quantity);
        orderMapper.insert(order);

        try {
            AlipayTradePagePayRequest request = new AlipayTradePagePayRequest();
            if (StringUtils.hasText(notifyUrl)) {
                request.setNotifyUrl(notifyUrl);
            }
            AlipayTradePagePayModel model = new AlipayTradePagePayModel();
            model.setOutTradeNo(orderNo);
            model.setTotalAmount(amount.toPlainString());
            model.setSubject(subject);
            model.setProductCode("FAST_INSTANT_TRADE_PAY");
            request.setBizModel(model);

            String form = alipayClient.pageExecute(request).getBody();
            log.info("[支付] 创建订单 orderNo={} amount={} productId={} spec={} qty={}",
                    orderNo, amount, productId, specLabel, order.getQuantity());
            return Map.of("orderNo", orderNo, "payForm", form, "orderId", order.getId());
        } catch (AlipayApiException e) {
            log.error("[支付] 创建支付失败 orderNo={}", orderNo, e);
            throw new BizException(500, "创建支付失败: " + e.getMessage());
        }
    }

    /** 兼容旧签名 */
    public Map<String, Object> createOrder(BigDecimal amount, String subject) {
        return createOrder(amount, subject, null, "", 1);
    }

    /** 处理支付宝异步回调通知 */
    public String handleNotify(Map<String, String> params) {
        try {
            boolean verified = AlipaySignature.rsaCheckV1(params, alipayPublicKey, "UTF-8", "RSA2");
            if (!verified) {
                log.warn("[支付] 回调验签失败");
                return "failure";
            }

            String orderNo = params.get("out_trade_no");
            String tradeStatus = params.get("trade_status");
            String tradeNo = params.get("trade_no");

            Order order = orderMapper.selectOne(new LambdaQueryWrapper<Order>().eq(Order::getOrderNo, orderNo));
            if (order == null) {
                log.warn("[支付] 订单不存在 orderNo={}", orderNo);
                return "failure";
            }

            if ("TRADE_SUCCESS".equals(tradeStatus) || "TRADE_FINISHED".equals(tradeStatus)) {
                if (order.getStatus() == 0) {
                    orderMapper.update(null, new LambdaUpdateWrapper<Order>()
                            .eq(Order::getId, order.getId())
                            .set(Order::getStatus, 1)
                            .set(Order::getTradeNo, tradeNo)
                            .set(Order::getPayTime, LocalDateTime.now()));
                    log.info("[支付] 支付成功 orderNo={} tradeNo={}", orderNo, tradeNo);
                }
            }
            return "success";
        } catch (AlipayApiException e) {
            log.error("[支付] 回调处理异常", e);
            return "failure";
        }
    }

    /** 查询订单状态 */
    public Order queryOrder(String orderNo) {
        return orderMapper.selectOne(new LambdaQueryWrapper<Order>().eq(Order::getOrderNo, orderNo));
    }

    /** 我的订单列表 */
    public List<Order> myOrders() {
        Long userId = UserContext.require();
        return orderMapper.selectList(new LambdaQueryWrapper<Order>()
                .eq(Order::getUserId, userId)
                .orderByDesc(Order::getCreateTime));
    }

    /** 取消订单 */
    public void cancelOrder(String orderNo) {
        Long userId = UserContext.require();
        Order order = orderMapper.selectOne(new LambdaQueryWrapper<Order>()
                .eq(Order::getOrderNo, orderNo)
                .eq(Order::getUserId, userId));
        if (order == null) throw new BizException(404, "订单不存在");
        if (order.getStatus() != 0) throw new BizException(400, "订单状态不允许取消");
        orderMapper.update(null, new LambdaUpdateWrapper<Order>()
                .eq(Order::getId, order.getId())
                .set(Order::getStatus, 2));
    }

    private String generateOrderNo() {
        String time = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        long seq = System.nanoTime() % 100000;
        return "PH" + time + String.format("%05d", seq);
    }
}
