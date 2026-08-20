# 萌宠之家 · 前端

React 18 + Vite 5 + Tailwind 3 前端。首页含 7 Tab + Mega Menu、左侧固定快捷栏、Banner 轮播 + 跳动悬浮框、热门商品 / AI 医生 / 铲屎官达人 / 社区瀑布流（刷新）、悬浮智能客服（SSE 流式）。

## 技术栈

- React 18 + React Router 7
- Vite 5（开发服务器 + 构建）
- Tailwind CSS 3 + PostCSS / autoprefixer
- lucide-react（图标）
- 原生 EventSource（SSE 流式接收）

## 目录结构

```
frontend/
├─ index.html
├─ vite.config.js              # /api 代理到后端 8088
├─ tailwind.config.js          # 设计 token（配色/字体/动画）
├─ postcss.config.js
├─ package.json / package-lock.json
├─ public/assets/              # 静态图片资源（社区/商城/首页，~196M）
└─ src/
   ├─ main.jsx / App.jsx       # 入口 + 路由
   ├─ api.js                   # 后端请求封装（带 JWT 拦截器）
   ├─ index.css                # Tailwind 指令 + 全局样式
   ├─ components/
   │  ├─ pages/                # HomePage/MallPage/ConsultPage/CommunityPage/PetPage/...
   │  ├─ layouts/              # AppLayout / ProtectedRoute
   │  ├─ common/               # Reveal/SectionBlock/StatBar/Timeline/UnderDev
   │  ├─ Hero/TopNav/LeftSidebar/MobileTabBar/Footer
   │  ├─ CustomerServiceWidget  # 悬浮智能客服（SSE 流式）
   │  ├─ SeckillSection        # 秒杀区块
   │  └─ PetImg/ImageUpload/...
   ├─ pages/community/         # AdoptPage/PetHomePage/TopicPage
   └─ data/                    # mock.js / nav / mallContent / localImages / petImages
```

## 环境变量

| 变量 | 用途 |
|---|---|
| `VITE_AMAP_KEY` | 高德地图 JS API（同城服务地图） |
| `VITE_AMAP_SECRET` | 高德 Web 端安全密钥 |

写入 `frontend/.env`（已在 `.gitignore`，含密钥勿外发明文）。

## 开发与构建

```bash
cd frontend
npm install            # 首次装依赖
npm run dev            # 开发服务器 http://localhost:5173
npm run build          # 生产构建 → dist/
npm run preview        # 预览构建产物
```

开发模式下 `/api` 请求经 Vite 代理转发到后端 `http://localhost:8088`（见 `vite.config.js`）。

## 与后端的约定

- 所有接口前缀 `/api`，JWT 通过 `api.js` 的请求拦截器自动附加 `Authorization: Bearer <token>`。
- 悬浮客服 `/api/customer-service/stream?msg=` 与 AI 问诊走 SSE，前端用原生 `EventSource` 逐 chunk 渲染。
- 秒杀抢券返回订单创建中状态，订单落库由后端 MQ 异步完成，前端轮询/提示。

## 图片资源说明

`public/assets/` 下的图片由根目录 `crawl_pets.js`（宠物图爬虫）从 `picture/` 源素材复制而来。若需要重新生成图片资源，在项目根目录运行：
```bash
node crawl_pets.js
```

详见根目录 [README.md](../README.md) 与迁移指南 [MIGRATION.md](../MIGRATION.md)。
