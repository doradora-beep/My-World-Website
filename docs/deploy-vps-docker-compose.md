# VPS / 云服务器 + Docker Compose 部署文档

本文档适用于：在一台 VPS 或云服务器上使用 Docker Compose 部署完整项目，包括前端、后端、SQLite 数据库和上传文件。

当前生产访问地址：

```text
http://101.42.28.54:3003
```

容器内部服务端口为 `3001`，服务器对外暴露端口为 `3003`。

## 1. 部署架构

- 前端：Vite + React，构建产物为 `dist/`
- 后端：Fastify，生产入口为 `server/dist/server/index.js`
- 数据库：SQLite
- 上传文件：`storage/uploads`
- 容器编排：Docker Compose
- 健康检查：`GET /api/health`

生产数据保存在 Docker volume：

```text
the_explorer_storage
```

该 volume 中包含：

- SQLite 数据库：`/app/storage/the-explorer-prod.db`
- 上传文件：`/app/storage/uploads`

## 2. 服务器准备

安装 Docker 和 Docker Compose Plugin。

确认安装成功：

```bash
docker --version
docker compose version
```

如果服务器启用了防火墙，放行 `3003/tcp`：

```bash
sudo ufw allow 3003/tcp
sudo ufw status
```

## 3. 上传或拉取代码

在服务器上拉取 GitHub 仓库：

```bash
git clone <你的 GitHub 仓库地址>
cd <项目目录>
```

后续更新代码：

```bash
git pull
```

## 4. 配置生产环境变量

复制生产环境变量示例：

```bash
cp .env.production.example .env.production
```

编辑 `.env.production`：

```env
COOKIE_SECRET="请替换为长随机字符串"
OWNER_PIN="你的站长PIN"
OWNER_PIN_HASH=""
OPENAI_IMAGE_MODEL="gpt-image-1"
```

生成 `COOKIE_SECRET`：

```bash
openssl rand -hex 32
```

当前配置不启用 OpenAI 头像生成，`docker-compose.yml` 中已经将 `OPENAI_API_KEY` 设置为空。应用会使用本地 fallback 头像候选。

## 5. 构建并启动

在项目根目录执行：

```bash
docker compose up -d --build
```

查看日志：

```bash
docker compose logs -f app
```

首次启动时，容器会自动执行：

```bash
npx prisma db execute --file prisma/init.sql --schema prisma/schema.prisma
```

这会确保 SQLite 表结构存在。应用启动后还会执行现有种子数据逻辑。

## 6. 验证部署

检查健康状态：

```bash
curl http://101.42.28.54:3003/api/health
```

预期返回：

```json
{"ok":true}
```

浏览器访问：

```text
http://101.42.28.54:3003
```

验证功能：

- 页面能正常加载
- PIN 能登录站长编辑模式
- 头像 fallback 生成正常
- 图片上传正常
- 故事卡片新增、编辑、删除正常

## 7. 常用运维命令

查看容器状态：

```bash
docker compose ps
```

查看日志：

```bash
docker compose logs -f app
```

重启服务：

```bash
docker compose restart app
```

停止服务：

```bash
docker compose down
```

进入容器：

```bash
docker compose exec app sh
```

查看 volume：

```bash
docker volume inspect the_explorer_storage
```

## 8. 更新发布

在服务器项目目录执行：

```bash
git pull
docker compose up -d --build
docker compose logs -f app
```

确认健康检查：

```bash
curl http://101.42.28.54:3003/api/health
```

## 9. 数据备份

创建备份目录：

```bash
mkdir -p backups
```

备份 SQLite 数据库和上传文件：

```bash
docker run --rm \
  -v the_explorer_storage:/data \
  -v "$PWD/backups:/backup" \
  busybox sh -c 'tar czf /backup/the-explorer-$(date +%Y%m%d-%H%M%S).tgz -C /data .'
```

不要执行：

```bash
docker compose down -v
```

这会删除 Docker volume，导致生产数据库和上传文件丢失。

## 10. 数据恢复

停止服务：

```bash
docker compose down
```

恢复备份：

```bash
docker run --rm \
  -v the_explorer_storage:/data \
  -v "$PWD/backups:/backup" \
  busybox sh -c 'rm -rf /data/* && tar xzf /backup/你的备份文件.tgz -C /data'
```

重新启动：

```bash
docker compose up -d
```

## 11. 安全说明

当前访问地址是：

```text
http://101.42.28.54:3003
```

该地址没有 HTTPS。由于你选择使用明文 `OWNER_PIN`，站长 PIN 在公网 HTTP 传输时可能被窃听。

建议后续增加 Caddy 或 Nginx 反向代理，并启用 HTTPS。启用 HTTPS 后，可以让反向代理转发到：

```text
http://127.0.0.1:3003
```

最低限度建议：

- 使用复杂 `OWNER_PIN`
- 使用长随机 `COOKIE_SECRET`
- 只开放必要端口
- 定期备份 `the_explorer_storage`
- 不提交 `.env.production` 到 GitHub
