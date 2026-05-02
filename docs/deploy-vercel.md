# Vercel 部署文档

本文档适用于：代码提交到 GitHub，由 Vercel 自动部署前端。

当前项目包含 Fastify 后端、SQLite 数据库和本地上传文件。Vercel 适合托管前端静态资源，但不适合直接持久化 SQLite 数据库和 `storage/uploads` 上传文件。因此本部署方式只把前端部署到 Vercel，后端需要由一个外部服务提供。

本项目当前使用的外部后端地址：

```text
http://101.42.28.54:3003
```

## 1. 部署架构

- GitHub：代码仓库
- Vercel：构建并托管 React/Vite 前端
- 外部后端：提供 `/api`、`/uploads`、`/reference`
- 数据库和上传文件：不存放在 Vercel

## 2. 项目配置

项目根目录已提供 `vercel.json`：

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "installCommand": "npm ci",
  "buildCommand": "npm run build:client",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "http://101.42.28.54:3003/api/:path*"
    },
    {
      "source": "/uploads/:path*",
      "destination": "http://101.42.28.54:3003/uploads/:path*"
    },
    {
      "source": "/reference/:path*",
      "destination": "http://101.42.28.54:3003/reference/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

含义：

- Vercel 安装依赖：`npm ci`
- Vercel 构建命令：`npm run build:client`
- Vercel 输出目录：`dist`
- `/api/*` 代理到外部后端
- `/uploads/*` 代理到外部上传文件服务
- `/reference/*` 代理到外部静态资源服务
- 其他路由返回 `index.html`，支持单页应用路由

## 3. 推送代码到 GitHub

确认不要提交这些文件：

```text
.env
.env.production
.vercel
node_modules/
dist/
server/dist/
storage/
```

提交代码：

```bash
git add .
git commit -m "Add Vercel deployment configuration"
git push origin main
```

如果你的生产分支不是 `main`，在 Vercel 中选择实际生产分支。

## 4. 在 Vercel 导入项目

1. 打开 Vercel Dashboard。
2. 点击 `Add New...` -> `Project`。
3. 连接 GitHub。
4. 选择当前仓库。
5. Framework Preset 选择 `Vite`。
6. Root Directory 保持项目根目录。
7. Build Command 使用 `npm run build:client`。
8. Output Directory 使用 `dist`。
9. Install Command 使用 `npm ci`。
10. 点击 `Deploy`。

这些配置已经写入 `vercel.json`，通常 Vercel 会自动读取。

## 5. 部署后验证

假设 Vercel 域名是：

```text
https://your-project.vercel.app
```

检查前端：

```bash
curl -I https://your-project.vercel.app
```

检查后端代理：

```bash
curl https://your-project.vercel.app/api/health
```

预期返回：

```json
{"ok":true}
```

浏览器访问：

```text
https://your-project.vercel.app
```

进入站长编辑模式，验证：

- PIN 登录
- 头像 fallback 生成
- 图片上传
- 故事卡片新增、编辑、删除

## 6. 后续更新

每次推送到 GitHub 后，Vercel 会自动部署：

```bash
git add .
git commit -m "Update site"
git push origin main
```

如果只修改前端，等待 Vercel 自动部署完成即可。

如果修改了后端代码，还需要同步更新外部后端服务。

## 7. 安全说明

Vercel 前端默认使用 HTTPS，但当前代理目标是：

```text
http://101.42.28.54:3003
```

Vercel 到后端之间仍是 HTTP。由于当前项目使用明文 `OWNER_PIN`，建议后续给后端配置域名和 HTTPS，然后把 `vercel.json` 中的代理目标改为 HTTPS。

示例：

```json
{
  "source": "/api/:path*",
  "destination": "https://api.example.com/api/:path*"
}
```

## 8. 参考资料

- Vercel Git 部署：https://vercel.com/docs/deployments
- Vercel 导入项目：https://vercel.com/docs/getting-started-with-vercel
- Vercel rewrites：https://vercel.com/docs/routing/rewrites
- Vercel 文件使用说明：https://vercel.com/kb/guide/how-can-i-use-files-in-serverless-functions
