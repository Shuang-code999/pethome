# 萌宠之家 · 文档与流程图

本目录存放项目的架构与流程图资产。

## Visio 流程图

4 张图，每张含 `.vsdx`（Visio 可编辑原生形状）/ `.png` / `.svg` / `.pdf` 四种格式：

| 文件 | 内容 |
|---|---|
| [01-overall](visio/01-overall.png) | 总流程：前端 → 请求拦截层(JWT/限流) → Controller → 四大模块(秒杀/商品/社区/AI) → 中间件层(MySQL/Redis/RabbitMQ/百炼) |
| [02-seckill](visio/02-seckill.png) | 秒杀 + 订单超时取消：Lua 原子扣库存 → MQ 异步下单 → 延迟队列+死信关单 → 乐观锁竞争(支付 vs 关单) |
| [03-cache](visio/03-cache.png) | 商品多级缓存三防：Caffeine L1 → Redis L2 → MySQL L3，含穿透(空值缓存)/击穿(Redisson 互斥锁)/雪崩(TTL 抖动) |
| [04-ai](visio/04-ai.png) | AI 问诊 + RAG：多轮历史 → RAG 检索 → 拼装 Prompt → ChatClient.stream → SSE 流式；含知识库/向量库/百炼/多模态分支 |

## 重新生成流程图

绘制脚本在 `../.visio-tools/draw_diagrams.ps1`，自包含（PowerShell 驱动本机 Visio COM，不依赖外部仓库）。

```bash
cd .visio-tools
powershell -NoProfile -File draw_diagrams.ps1        # 重绘全部 4 张
powershell -NoProfile -File draw_diagrams.ps1 -Which 2   # 仅重绘 02-seckill
```

- 修改对应 `Draw-Overall` / `Draw-Seckill` / `Draw-Cache` / `Draw-AI` 函数后重跑即可。
- 画布坐标为"参考像素"（如 1600×1000），脚本内部经 `VX/VY` 映射到 Visio 英寸单位。
- 需本机安装 Microsoft Visio（任意支持 COM 的版本）。

## 坐标系约定

- 左上为原点 `(0,0)`，x 向右、y 向下，单位为参考像素。
- `VX(x) = PageW * x / RefW`，`VY(y) = PageH - PageH*y/RefH`（y 翻转：参考 y=0 在顶部 → Visio 顶部）。
- `ArrowV(x, y1, y2, ...)`：箭头终点(箭头头)在 `y2`；`ArrowH(x1, x2, y, ...)`：终点在 `x2`。
