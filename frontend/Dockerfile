# syntax=docker/dockerfile:1
# 萌宠之家 前端镜像：multi-stage（node 构建 → nginx 托管静态）

# ---------- 1. 构建阶段 ----------
FROM node:18-alpine AS builder
WORKDIR /build

# 先拷依赖清单，利用层缓存
COPY package*.json ./
RUN npm ci

# 拷源码 + .env（VITE_ 变量在 build 阶段注入）
COPY . .

# 生产构建 → dist/
RUN npm run build

# ---------- 2. 运行阶段 ----------
FROM nginx:alpine
# 时区
ENV TZ=Asia/Shanghai

# 静态产物
COPY --from=builder /build/dist /usr/share/nginx/html
# nginx 配置（SPA 兜底 + /api 反代 + SSE 关缓冲）
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
