# 萌宠之家 · 后端

Spring Boot 3.3 + Spring AI 1.0 后端，覆盖秒杀/多级缓存/Feed 流/限流/AI 问诊等高并发场景。商家资质、支付、物流、短信等需资质的功能做模拟。

## 技术栈

| 关注点 | 方案 |
|---|---|
| 框架 | Spring Boot 3.3.5 (JDK 17) |
| AI | Spring AI 1.0（OpenAI 兼容 → 阿里云百炼 DashScope） |
| ORM | MyBatis-Plus 3.5.7 |
| 数据库 | MySQL 8.0 |
| 缓存/锁 | Redis 7 + Redisson 3.34 + Caffeine 3.1 |
| 消息队列 | RabbitMQ 3.13 |
| 鉴权 | JWT (jjwt 0.12.6) |
| 工具 | Hutool 5.8、Lombok |

## 目录结构

```
backend/
├─ pom.xml                       # Maven 依赖与构建
├─ docker-compose.yml            # MySQL/Redis/RabbitMQ 一键起
├─ build.bat / run.bat           # 编译 / 运行（内置本机 JDK17 路径）
├─ seed_data.sql                 # 种子数据（用户/宠物/商品/帖子等）
├─ seed_services.sql             # 同城服务种子数据
└─ src/main/
   ├─ java/com/pethome/
   │  ├─ PethomeApplication.java # 启动类 (@SpringBootApplication @EnableScheduling @MapperScan)
   │  ├─ ai/                     # AiConfig(模型配置) RagService(知识库检索)
   │  ├─ common/                 # Result/BizException/ErrorCode/GlobalExceptionHandler/Constants
   │  ├─ config/                 # RedisConfig/CaffeineConfig/RabbitMQConfig/MybatisPlusConfig/...
   │  ├─ controller/             # 20+ REST Controller
   │  ├─ dto/ entity/ mapper/    # 数据层
   │  ├─ interceptcor/           # JwtInterceptor / RateLimitInterceptor
   │  ├─ service/                # 业务逻辑（秒杀/订单超时/Feed 等核心功能）
   │  └─ util/                   # JwtUtil/IdGenerator(雪花)/UserContext/UnsplashUtil
   └─ resources/
      ├─ application.yml         # 主配置（环境变量占位）
      ├─ schema.sql              # 建表 DDL（启动自动执行，IF NOT EXISTS）
      ├─ knowledge/pet-care.md   # RAG 知识库源文档
      └─ lua/                    # seckill.lua / ratelimit.lua / feed_push.lua
```

## 环境变量

`application.yml` 全部用 `${VAR:default}` 占位，默认值仅本地开发用。生产/迁移请通过环境变量或 `backend/.env` 覆盖：

| 变量 | 用途 | 必填 |
|---|---|---|
| `BAILIAN_API_KEY` | 百炼 DashScope 大模型密钥（AI 问诊/客服） | 否（不设则 AI 不可用，其余功能不受影响） |
| `DB_PASSWORD` | MySQL root 密码（默认 root123） | 是 |
| `DB_HOST` / `REDIS_HOST` / `MQ_HOST` | 中间件地址（默认 localhost） | 是 |
| `MQ_USERNAME` / `MQ_PASSWORD` | RabbitMQ 账号（默认 pet/pet123） | 是 |
| `AMAP_API_KEY` | 高德 Web API（同城服务门店 POI） | 否 |
| `UNSPLASH_ACCESS_KEY` | Unsplash（商品图） | 否 |
| `WEATHER_API_KEY` | OpenWeatherMap | 否 |
| `ALIYUN_ACCESS_KEY_ID/SECRET` 等 | 阿里云短信（个人免资质） | 否 |
| `TENCENT_SECRET_ID/KEY` | 腾讯云 OCR | 否 |
| `ALIPAY_*` | 支付宝沙箱 | 否 |
| `JWT_SECRET` | JWT 签名密钥 | 否（有默认，生产务必改） |

> 密钥属敏感信息。`.env` 已在 `.gitignore`，**勿提交、勿随项目明文外发**。

## 构建与运行

```bash
# 1. 起中间件
cd backend
docker compose up -d          # MySQL 3306 / Redis 6379 / RabbitMQ 5672,15672

# 2. 编译（需 JDK 17）
mvn -DskipTests compile       # 或 build.bat（内置 JAVA_HOME）

# 3. 运行
mvn -DskipTests spring-boot:run   # 或 run.bat
# 服务：http://localhost:8088/api
```

首次启动 MySQL 容器会自动执行 `schema.sql` 建表。种子数据需手动导入：
```bash
mysql -uroot -p pet_home < seed_data.sql
mysql -uroot -p pet_home < seed_services.sql
```

## 核心功能

| # | 功能 | 关键文件 |
|---|---|---|
| 1 | 秒杀：Redis+Lua 原子扣库存 + RabbitMQ 异步下单 + 三重幂等 | `SeckillService` / `lua/seckill.lua` / `SeckillOrderListener` |
| 2 | 订单超时取消：延迟队列 + 死信交换机 + 乐观锁防并发重复关单 | `RabbitMQConfig` / `OrderCancelListener` / `SeckillOrderMapper.cancelIfUnpaid` |
| 3 | 商品多级缓存：Caffeine L1 + Redis L2 + 三防（穿透/击穿/雪崩） | `ProductService` / `CaffeineConfig` |
| 4 | 社区 Feed 流：Redis ZSet 推模式 + Lua 批量推送(单 RTT) + @Async | `PostService` / `lua/feed_push.lua` |
| 5 | 限流：Redis+Lua 令牌桶（IP+URI 维度，超限 429） | `RateLimitInterceptor` / `lua/ratelimit.lua` |

### 订单超时取消功能要点

- 下单后 `SeckillOrderListener` 把 `orderId:voucherId:userId` 发入延迟队列（per-message TTL，默认 30 分钟，`pethome.seckill.pay-timeout-min` 可改）。
- TTL 到期无人消费 → 死信交换机 `pethome.seckill.dlx` → 死信队列 `pethome.seckill.cancel.queue`。
- `OrderCancelListener` 消费：乐观锁 `cancelIfUnpaid`（`WHERE status=0 AND version=?`）保证仅一方关单成功；成功则回滚库存（DB `remain+1` / Redis `stock+1` / `SREM` 用户可重抢）。
- 支付端 `pay()` 同样走乐观锁 `payIfUnpaid`，与关单竞争同一 `version`，败方影响行数=0 抛 `SECKILL_ORDER_CLOSED`。
- `SeckillOrder.version` 字段由 `SeckillFieldMigration` 启动时幂等 `ALTER` 补齐（MySQL 8 无 `ADD COLUMN IF NOT EXISTS`）。

## 主要接口（节选）

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| POST | `/api/user/sms/{phone}` | 否 | 发送短信验证码（模拟 1234） |
| POST | `/api/user/login/phone` | 否 | 手机号验证码登录/注册，返回 JWT |
| GET/POST/PUT/DELETE | `/api/pet/**` | 是 | 宠物档案 CRUD（Redis 缓存） |
| GET | `/api/product/{id}` | 否 | 商品详情（Caffeine+Redis 二级缓存） |
| GET | `/api/seckill/list` | 否 | 秒杀券列表 |
| POST | `/api/seckill/{voucherId}` | 是 | 抢券（Lua 扣库存 + MQ 异步下单） |
| POST | `/api/seckill/pay/{orderId}` | 是 | 模拟支付（乐观锁） |
| POST | `/api/community/posts` | 是 | 发帖（推送粉丝 Feed） |
| GET | `/api/community/feed` | 是 | Feed 流（Redis ZSet） |
| POST | `/api/consult/chat` | 否 | AI 问诊（百炼 + RAG + SSE） |
| GET | `/api/customer-service/stream?msg=` | 否 | 悬浮客服 SSE 流式 |

## 模拟点（个人无资质）

| 真功能 | 模拟做法 |
|---|---|
| 短信验证码 | 固定 `1234`，写 Redis，控制台打印 |
| 支付 | `/seckill/pay/{orderId}` 直接乐观锁改状态为已支付 |
| 商家资质 | 不做审核 |
| 物流/保险/处方药 | 未做，前端 mock |

详见根目录 [README.md](../README.md) 与迁移指南 [MIGRATION.md](../MIGRATION.md)。
