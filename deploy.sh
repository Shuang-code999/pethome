#!/usr/bin/env bash
# 萌宠之家 · 云服务器一键部署（全部容器化）
# 前提：已装 Docker + Docker Compose 插件（`docker compose version` 能跑）
set -euo pipefail
cd "$(dirname "$0")"

echo "==> [1/4] 检查 backend/.env 是否存在（含 API 密钥）..."
if [ ! -f backend/.env ]; then
  echo "✗ 缺少 backend/.env。请把本地 backend/.env 拷到服务器（含 BAILIAN_API_KEY 等密钥）。"
  exit 1
fi

echo "==> [2/4] 构建镜像（首次较慢，后端 maven 拉依赖 + 前端 npm 装包）..."
docker compose build

echo "==> [3/4] 启动全部服务..."
docker compose up -d

echo "==> [4/4] 等待 MySQL 就绪后导入种子数据（可选，首次部署执行一次）..."
echo "    docker compose exec -T mysql mysql -uroot -proot123 pet_home < backend/seed_data.sql"
echo "    docker compose exec -T mysql mysql -uroot -proot123 pet_home < backend/seed_services.sql"

echo ""
echo "==> 状态："
docker compose ps
echo ""
echo "访问：http://<服务器IP>/   （前端 + /api 已由 nginx 反代到 backend）"
echo "日志：docker compose logs -f backend"
echo "停止：docker compose down"
