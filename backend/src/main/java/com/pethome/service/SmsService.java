package com.pethome.service;

import com.aliyun.dypnsapi20170525.Client;
import com.aliyun.dypnsapi20170525.models.SendSmsVerifyCodeRequest;
import com.aliyun.dypnsapi20170525.models.SendSmsVerifyCodeResponse;
import com.aliyun.teaopenapi.models.Config;
import com.pethome.common.BizException;
import com.pethome.common.Constants;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.util.concurrent.ThreadLocalRandom;

/** 阿里云短信认证服务（个人开发者免资质）：未配置密钥时降级到控制台打印 */
@Slf4j
@Service
public class SmsService {

    private final StringRedisTemplate redis;
    private final Client client;
    private final boolean enabled;
    private final String signName;
    private final String templateCode;

    public SmsService(StringRedisTemplate redis,
                      @Value("${pethome.sms.access-key-id:}") String accessKeyId,
                      @Value("${pethome.sms.access-key-secret:}") String accessKeySecret,
                      @Value("${pethome.sms.sign-name:萌宠之家}") String signName,
                      @Value("${pethome.sms.template-code:}") String templateCode) {
        this.redis = redis;
        this.signName = signName;
        this.templateCode = templateCode;
        this.enabled = StringUtils.hasText(accessKeyId) && StringUtils.hasText(accessKeySecret);

        if (this.enabled) {
            try {
                Config config = new Config()
                        .setAccessKeyId(accessKeyId)
                        .setAccessKeySecret(accessKeySecret)
                        .setEndpoint("dypnsapi.aliyuncs.com");
                this.client = new Client(config);
                log.info("[短信] 阿里云短信认证已启用（个人免资质模式）签名={}", signName);
            } catch (Exception e) {
                throw new RuntimeException("初始化阿里云短信认证失败", e);
            }
        } else {
            this.client = null;
            log.info("[短信] 阿里云短信认证未配置，将使用控制台打印模式（开发环境）");
        }
    }

    /** 发送短信验证码 */
    public void sendSmsCode(String phone) {
        String code = randomCode();
        redis.opsForValue().set(Constants.SMS_CODE + phone, code, Duration.ofMinutes(5));

        if (!enabled) {
            log.info("[模拟短信] 手机号 {} 的验证码：{}（5分钟内有效）", phone, code);
            return;
        }

        try {
            SendSmsVerifyCodeRequest req = new SendSmsVerifyCodeRequest()
                    .setPhoneNumber(phone)
                    .setCodeLength(6L)
                    .setCodeType(1L)
                    .setReturnVerifyCode(true);

            // 签名和模板（短信认证需要在阿里云控制台创建签名和模板）
            if (StringUtils.hasText(signName)) {
                req.setSignName(signName);
            }
            if (StringUtils.hasText(templateCode)) {
                req.setTemplateCode(templateCode);
                // 传递模板变量：验证码和有效时长
                req.setTemplateParam("{\"code\":\"" + code + "\",\"min\":\"5\"}");
            }

            SendSmsVerifyCodeResponse resp = client.sendSmsVerifyCode(req);
            var body = resp.getBody();
            log.info("[短信] API 响应 phone={} httpStatus={} bizCode={} bizMsg={} success={}",
                    phone, resp.getStatusCode(),
                    body != null ? body.getCode() : "null",
                    body != null ? body.getMessage() : "null",
                    body != null ? body.getSuccess() : "null");

            if (body != null && Boolean.TRUE.equals(body.getSuccess())) {
                log.info("[短信] 发送成功 phone={}", phone);
            } else {
                log.warn("[短信] 业务失败 phone={} code={} msg={}",
                        phone,
                        body != null ? body.getCode() : "unknown",
                        body != null ? body.getMessage() : "unknown");
                // 降级到控制台打印
                log.info("[模拟短信] 手机号 {} 的验证码：{}（5分钟内有效）", phone, code);
            }
        } catch (Exception e) {
            log.error("[短信] 发送异常 phone={}", phone, e);
            // 降级到控制台打印，确保开发环境不受影响
            log.info("[模拟短信] 手机号 {} 的验证码：{}（5分钟内有效）", phone, code);
        }
    }

    private String randomCode() {
        return String.valueOf(ThreadLocalRandom.current().nextInt(100000, 1000000));
    }
}
