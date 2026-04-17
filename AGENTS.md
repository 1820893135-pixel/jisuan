# 中国文化遗产导览项目协作说明

## 项目目标

这是一个准备开源的中国文化遗产导览 Web 应用，不是一次性比赛 demo。
需要保持真实应用质感，避免明显的“AI 工具页”风格。

## 当前产品方向

- 前端必须是多模块应用，不要把所有功能堆在一个页面。
- 当前主方向是“中国文化遗产导览 + 真实高德地图 + AI 行程规划”。
- 视觉上参考 `D:\lvyou\figma` 里的设计风格，偏文化、导览、应用化，而不是机械卡片堆叠。
- 地图能力优先使用真实高德能力：动态地图、3D 地图、POI 搜索、周边搜索、路线规划、URI 拉起高德。
- AI 规划继续保留 LangChain 接入。

## 当前代码状态

- 前端目录：`D:\lvyou\web`
- 后端目录：`D:\lvyou\server`
- 地图核心组件：`D:\lvyou\web\src\components\MapWorkspace.tsx`
- 地图页：`D:\lvyou\web\src\pages\ExplorePage.tsx`
- AMap 加载器：`D:\lvyou\web\src\lib\loadAMap.ts`
- 应用样式：`D:\lvyou\web\src\App.css`

## 已完成事项

- 已把地图页改成真实高德工作台，而不是仅展示两条线。
- 已接入真实 AMap JS API 插件：
  - Scale
  - ToolBar
  - MapType
  - Geolocation
  - PlaceSearch
  - AutoComplete
  - Walking
  - Driving
- 已保留 LangChain 行程规划能力。
- 已把高德 MCP 作为全局 Codex MCP 服务写入 `C:\Users\LRH\.codex\config.toml`。

## 高德 MCP 使用规则

如果任务涉及以下内容，优先使用高德 MCP：

- 城市 POI 搜索
- 周边推荐
- 路线规划建议
- 地图标注数据补全
- 地理信息查询

已注册的 MCP 服务名：

- `amap`

注意：

- 高德 MCP 已写入全局配置，但新增 MCP 后需要重启 Codex 桌面应用，当前旧会话不会热加载。
- 重启后优先验证 `amap` 服务是否可用，再继续地图增强。

## 已知问题

- 当前高德前端 JS key 存在平台匹配问题：`USERKEY_PLAT_NOMATCH`
- 当前高德 Web Service 路径规划有配额问题：`CUQPS_HAS_EXCEEDED_THE_LIMIT`
- 地图页现在功能比之前强，但视觉还没完全抠到成品应用级别，需要继续精修。
- `MapWorkspace.tsx` 里有一部分英文文案，是之前为绕开编码问题临时保留的，后续要改回更自然的中文产品文案。

## 重启后优先继续做的事

1. 验证 `amap` MCP 是否已在新会话中可用。
2. 用高德 MCP 补强真实地图页的数据体验：
   - 更自然的 POI 搜索结果
   - 更像地图应用的周边推荐
   - 更完整的路线信息
3. 继续把地图页和整体视觉往 `D:\lvyou\figma` 的风格靠拢。
4. 在不影响真实地图和 LangChain 的前提下，继续减少“工具感”和“AI 味”。

## 本地启动命令

根目录运行：

```powershell
npm run dev
```

常用地址：

- 前端：`http://localhost:5173`
- 地图页：`http://localhost:5173/map`
- 后端健康检查：`http://localhost:3001/api/health`

端口如果被占用，Vite 会自动切换，以终端输出为准。
