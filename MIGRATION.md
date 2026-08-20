# 迁移到其它电脑 · 打包清单与步骤

把项目搬到另一台电脑上能跑起来，需要打包**源码 + 配置 + 静态资源**，**排除**构建产物和依赖（目标机器重新生成）。下面按"要 / 不要"两列说明。

## 一、必须打包（源码与配置）

| 路径 | 说明 | 大小 |
|---|---|---|
| `backend/pom.xml` | Maven 依赖清单（目标机 `mvn` 自动拉依赖） | 小 |
| `backend/build.bat` `run.bat` | 编译/运行脚本（**注意**内含本机 JDK17 绝对路径，目标机需改） | 小 |
| `backend/docker-compose.yml` | MySQL/Redis/RabbitMQ 容器编排 | 小 |
| `backend/seed_data.sql` `seed_services.sql` | 种子数据 | 小 |
| `backend/src/` | **全部后端源码** + `application.yml` + `schema.sql` + `lua/` + `knowledge/` | 中 |
| `backend/.env` | **含真实密钥**，见下方⚠️ | 小 |
| `frontend/package.json` `package-lock.json` | 依赖清单（目标机 `npm install` 重装） | 小 |
| `frontend/index.html` `vite.config.js` `tailwind.config.js` `postcss.config.js` | 构建配置 | 小 |
| `frontend/src/` | **全部前端源码** | 中 |
| `frontend/.env` | 高德地图 Key（**含密钥**，见下方⚠️） | 小 |
| `frontend/public/assets/` | 前端服务的静态图片（社区/商城/首页） | **~196M** |
| `docs/` | Visio 流程图（png/svg/pdf/vsdx） | 小 |
| `.visio-tools/draw_diagrams.ps1` | 流程图重绘脚本（可选，需目标机装 Visio） | 小 |
| `README.md` `MIGRATION.md` `backend/README.md` `frontend/README.md` `docs/README.md` | 文档 | 小 |
| `crawl_pets.js` `generate_seed.js` `generate_seed.py` | 爬虫/种子生成器（可选） | 小 |
| `.gitignore` `.vscode/` | 编辑器与忽略规则 | 小 |

## 二、不要打包（可重新生成 / 与本机强绑定）

| 路径 | 原因 |
|---|---|
| `backend/target/` | Maven 构建产物，`mvn compile` 重新生成 |
| `backend/backend.log` `backend.err.log` `backend/mvn.log` | 运行日志 |
| `backend/shtr/` | 游离的重复文件（`NotificationController.java` 副本），建议删除而非打包 |
| `frontend/node_modules/` | npm 依赖，目标机 `npm install` 重装（~97M，且与平台相关） |
| `frontend/dist/` | 构建产物，`npm run build` 重新生成 |
| `frontend/.vite/` | Vite 缓存 |
| `picture/` | **可选排除**：爬虫原始素材（~194M）。前端实际用的是 `frontend/public/assets/`，若已打包该目录，`picture/` 可不带走；需要重新爬图再带 `crawl_pets.js` |
| `.claude/` | Claude Code 会话数据，与项目运行无关 |
| `.visio-tools/repo1/` `repo2/` | 克隆的第三方 skill 仓库，与本机环境相关，不必带走 |

## 三、目标电脑需要的环境（软件，非文件）

打包的是项目文件，目标机还得自己装运行环境：

| 软件 | 版本 | 用途 |
|---|---|---|
| **JDK** | 17（项目验证用 Eclipse Adoptium jdk-17.0.20.8-hotspot） | 后端编译运行 |
| **Maven** | 3.6+ | 后端构建（或用 IDE 自带） |
| **Docker Desktop** | 任意现代版 | 起 MySQL/Redis/RabbitMQ 容器 |
| **Node.js** | 18+（含 npm） | 前端构建 |
| **（可选）Microsoft Visio** | 任意支持 COM 的版本 | 重绘流程图，仅改图时需要 |
| **（可选）MySQL 客户端** | 8.x | 导入种子数据（或用容器内 mysql） |

## 四、迁移步骤

1. **打包**（在源机，排除可重生成的目录）。示例用 PowerShell 打成 zip：
   ```powershell
   cd D:\Users\lius7\Desktop
   Compress-Archive -Path pet-platform\backend\src,`
       pet-platform\backend\pom.xml, pet-platform\backend\build.bat, pet-platform\backend\run.bat,`
       pet-platform\backend\docker-compose.yml, pet-platform\backend\seed_data.sql, pet-platform\backend\seed_services.sql,`
       pet-platform\frontend\src, pet-platform\frontend\public, pet-platform\frontend\package.json, pet-platform\frontend\package-lock.json,`
       pet-platform\frontend\index.html, pet-platform\frontend\vite.config.js, pet-platform\frontend\tailwind.config.js, pet-platform\frontend\postcss.config.js,`
       pet-platform\docs, pet-platform\.visio-tools\draw_diagrams.ps1,`
       pet-platform\README.md, pet-platform\MIGRATION.md, pet-platform\backend\README.md, pet-platform\frontend\README.md, pet-platform\docs\README.md,`
       pet-platform\crawl_pets.js, pet-platform\generate_seed.js, pet-platform\generate_seed.py, pet-platform\.gitignore `
       -DestinationPath pet-platform-portable.zip
   ```
   > 上面**没有**包含 `backend/.env` 和 `frontend/.env`——它们含密钥，建议单独、加密传输（见下方⚠️）。若你信任目标机，可加进打包列表。

2. **传到目标机**，解压到任意目录（例如 `D:\pet-platform`）。

3. **装运行环境**：JDK17 / Maven / Docker / Node.js（见上表）。

4. **改 `backend/build.bat` 和 `run.bat`** 里的 `JAVA_HOME`，指向目标机的 JDK17 路径。

5. **放回 `.env`**：把 `backend/.env` 和 `frontend/.env` 放回各自目录（密钥不在压缩包里的话）。

6. **起中间件**：
   ```bash
   cd backend
   docker compose up -d
   ```

7. **装后端依赖 + 编译运行**：
   ```bash
   cd backend
   mvn -DskipTests compile          # 首次拉依赖需联网
   mvn -DskipTests spring-boot:run
   ```

8. **导入种子数据**（首次建库后）：
   ```bash
   mysql -uroot -proot123 pet_home < seed_data.sql
   mysql -uroot -proot123 pet_home < seed_services.sql
   ```

9. **装前端依赖 + 启动**：
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   打开 http://localhost:5173。

## 五、⚠️ 密钥安全提醒

`backend/.env` 与 `frontend/.env` 含**真实 API 密钥**（百炼、高德、阿里云短信、腾讯云 OCR、支付宝沙箱、Unsplash、天气等）：

- 已在 `.gitignore`，**不要提交到任何公开 Git 仓库**。
- 迁移时不要随压缩包明文外发；建议单独拷贝、用加密渠道传输，或迁移后在目标机重新填写。
- 若只是自己换电脑、信任目标机，直接连同 `.env` 一起打包即可，最省事。
- 公开/分享项目时，先用占位值替换 `.env` 里的真实 key，或干脆只发 `.env` 模板（变量名 + 空值）。

## 六、体积估算

| 方案 | 大小 | 适用 |
|---|---|---|
| 精简（不含 picture/、不含 .env、排除 node_modules/target/dist） | ~210M（主要是 `frontend/public/assets/` 图片） | 自己换电脑、信任目标机 |
| 极简（连 public/assets 也排除，目标机重新爬图） | ~5M | 仅传源码，目标机重新生成所有素材 |
| 完整（含 picture/ 源素材，排除可重生成产物） | ~400M | 离线环境，需原始素材 |
