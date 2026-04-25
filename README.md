# 游迹 AI 文旅规划平台

一个面向开源与持续迭代的文旅类全栈应用骨架，当前已经包含：

- React + Vite 前端展示页
- 高德地图 JS API 地图与景点标注
- 高德 Web Service 路径规划接入位
- Express + TypeScript 后端接口
- SQLite 持久化
- JWT 登录注册与景点收藏
- LangChain + OpenAI 兼容模型生成多日行程

## 项目结构

```text
lvyou/
├─ web/      # React 前端
├─ server/   # Express + LangChain 后端
└─ package.json
```

## 快速启动

1. 安装根依赖

```bash
npm install
```

2. 配置前后端环境变量

- 复制 `web/.env.example` 为 `web/.env`
- 复制 `server/.env.example` 为 `server/.env`

3. 启动开发环境

```bash
npm run dev
```

默认地址：

- 前端：`http://localhost:5173`
- 后端：`http://localhost:3001`

## 环境变量

前端：

- `VITE_AMAP_KEY`：高德地图 JS API Key
- `VITE_API_BASE_URL`：前端请求后端的基础地址，默认 `/api`

后端：

- `DB_PATH`：SQLite 数据库文件路径
- `JWT_SECRET`：JWT 签名密钥
- `AMAP_WEB_SERVICE_KEY`：高德 Web 服务 Key，用于真实路径规划
- `OPENAI_API_KEY` / `OPENAI_BASE_URL` / `OPENAI_MODEL`：LangChain 大模型生成行程所需

## 构建

```bash
npm run build
```

## 当前能力

- 城市景点展示与地图打点
- AI 行程规划
- 真实路径规划，未配置高德 Web Service Key 时自动降级为直线估算
- 本地账号注册、登录、收藏
- SQLite 持久化收藏数据
