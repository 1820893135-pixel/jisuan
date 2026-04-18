# Vercel + Railway 部署说明

本文档对应当前仓库的推荐上线方式：

- 前端 `web` 部署到 Vercel
- 后端 `server` 部署到 Railway
- 高德地图前端 JS Key 继续走 Vercel 域名
- SQLite 数据库存放到 Railway Volume

## 1. 部署前准备

先把仓库推到 GitHub，再分别在 Vercel 和 Railway 导入同一个仓库。

上线前需要准备的环境变量：

### 前端（Vercel）

- `VITE_API_BASE_URL`
- `VITE_AMAP_KEY`
- `VITE_AMAP_SECURITY_JS_CODE`

### 后端（Railway）

- `JWT_SECRET`
- `DB_PATH`
- `AMAP_WEB_SERVICE_KEY`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_MODEL`

## 2. 前端部署到 Vercel

### 项目设置

在 Vercel 导入仓库后，使用下面的设置：

- Framework Preset: `Vite`
- Root Directory: `web`
- Build Command: `npm run build`
- Output Directory: `dist`

仓库里已经添加了 [web/vercel.json](/D:/lvyou/web/vercel.json:1)，用于把所有前端路由回退到 `index.html`，这样 `/map`、`/planner` 这类客户端路由在线上可以直接打开，不会刷新后 404。

### 前端环境变量

建议至少配置：

```env
VITE_API_BASE_URL=https://your-backend.up.railway.app/api
VITE_AMAP_KEY=your-amap-js-key
VITE_AMAP_SECURITY_JS_CODE=your-amap-security-js-code
```

注意：

- `VITE_API_BASE_URL` 在线上不要继续保留 `/api`
- 要改成 Railway 后端的完整公网地址，并且带上 `/api`
- 例如：`https://lvyou-api-production.up.railway.app/api`

## 3. 后端部署到 Railway

### 服务设置

在 Railway 导入同一仓库后，创建一个 Web Service，并使用下面的设置：

- Root Directory: `server`
- Start Command: `npm run start`
- Healthcheck Path: `/api/health`

Railway 会注入 `PORT`，当前服务端代码已经读取 `PORT`，因此可以直接用于公网部署。

### 数据库存储

当前后端使用 SQLite，本地默认路径是 `./data/lvyou.db`。

线上部署时不要继续使用临时文件系统，推荐在 Railway 给该服务挂一个 Volume：

- Mount Path: `/data`
- `DB_PATH=/data/lvyou.db`

这样服务重启或重新部署后，用户、收藏等数据不会丢失。

### 后端环境变量示例

```env
JWT_SECRET=change-this-to-a-long-random-string
DB_PATH=/data/lvyou.db
AMAP_WEB_SERVICE_KEY=your-amap-web-service-key
OPENAI_API_KEY=your-openai-compatible-key
OPENAI_BASE_URL=https://your-openai-compatible-provider/v1
OPENAI_MODEL=gpt-5-mini
```

### 公开访问地址

Railway 服务创建成功后，到：

- `Settings`
- `Networking`
- `Generate Domain`

生成后端公网域名，再把这个域名填回 Vercel 的 `VITE_API_BASE_URL`。

## 4. 高德地图上线配置

当前项目真实接入了高德地图，所以域名白名单必须补齐。

### 前端 JS API Key

在高德开放平台里，把以下域名加入前端 JS Key 的 Referer 白名单：

- Vercel 分配的域名
- 之后绑定的自定义域名

如果不加，线上仍然会出现 `USERKEY_PLAT_NOMATCH`。

### 后端 Web Service Key

`AMAP_WEB_SERVICE_KEY` 只放在 Railway 后端环境变量中，不要放到前端。

## 5. 推荐的部署顺序

1. 先部署 Railway 后端
2. 拿到 Railway 公网域名
3. 再部署 Vercel 前端，并填入 `VITE_API_BASE_URL`
4. 最后去高德开放平台补前端域名白名单

## 6. 首次上线后的核对清单

上线后建议至少手动检查这些地址：

- 首页能否打开
- `/map` 是否能直接打开
- `/planner` 是否能正常请求后端
- `https://your-backend-domain/api/health` 是否返回 `ok: true`
- 地图是否还报高德域名不匹配

## 7. 可选优化

如果后续想让预览环境也更顺手，可以再补两项：

- 使用 Railway 的 Vercel Integration，把 Railway 环境变量同步到 Vercel
- 给后端增加专门的生产 CORS 白名单，而不是长期保持宽松跨域
