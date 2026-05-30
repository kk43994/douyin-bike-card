# RideSnap 智能骑行卡

> 抖音风骑行交互卡片演示项目 — 真实接入高德地图、骑行路径规划、语音导航、3D 地图、附近骑友雷达。

仿抖音视频流的沉浸式手机演示页面（max-w 440px 居中），底部浮出可左右滑动切换的交互卡片，结合浏览器 GPS 定位 + 高德 Web 服务 API + JS API 2.0 + Web Speech API 完成"看视频 → 选目的地 → 规划路线 → 语音导航 → 找骑友"完整闭环。

---

## 技术栈

| 类别 | 选型 |
|---|---|
| 框架 | Next.js 16.2.6 (App Router + Turbopack) |
| UI | React 19, Tailwind v4, antd 6 (dark algorithm) |
| 动画 | GSAP 3 |
| 图标 | lucide-react |
| 地图服务端 | 高德 Web 服务 API (HTTP REST 走 Next Route Handler 代理) |
| 地图前端 | 高德 JS API 2.0 (@amap/amap-jsapi-loader) |
| 语音 | 浏览器原生 SpeechSynthesis (零依赖) |
| 定位 | navigator.geolocation + 高德 regeo 反向地理编码 |
| 语言 | TypeScript 5 |

---

## 功能清单

### 卡 0 · 入口 IdleBanner
- 抖音视频下方浮起的入口 banner
- 大字 CTA [开始识别]，按场景配色（山地橙 / 城市青）

### 卡 1 · 智能路线推荐 RouteCard
- **真实 GPS 起点** — `navigator.geolocation` + 高德 regeo 反向地理编码 → "浙江省温州市龙湾区蒲州街道..."
- **目的地选择器 DestinationPicker**
  - 顶部 [骑行相关 ●] / [全部地点] 切换 type 过滤
  - 输入框 debounce 500ms + AbortController 取消旧请求 → 调高德 inputtips
  - 空状态自动拉 **附近 5km 热门骑行点**（公园/绿道/景区/自行车店，含距离）
  - [起终点都设为我的位置] 一键环线
- **路线规划** — 高德 v4/direction/bicycling，返回 polyline + 中文 step instruction
- **实时天气** — 高德 weatherInfo (温度/天气/风向/风力/湿度)
- **真实 3D 地图** — 高德 JS API 2.0
  - 默认 pitch 50° 3D 视角，dark mapStyle
  - 右上角浮按钮: [3D] / [路况] / [卫星] 三层切换
  - 起终点 Marker + 骑行路线 Polyline + TileLayer.Traffic 实时路况层
- **语音导航** — Web Speech API SpeechSynthesis
  - 按 step 顺序中文朗读："第 1 步, 沿金屿路向西骑行 330 米左转"
  - 朗读中当前路段高亮发光
  - [语音导航] / [停止播报] 切换
- **场景识别置信度** — 用真实周边 POI 的 typecode 加权打分（公园/景区→山地分；商圈/主路→城市分）

### 卡 2 · 附近骑友雷达 BuddyCard
- 同心圆雷达（半径 = 距离）+ 中央自己头像
- 8-15 个骑友散布在雷达中（mock 数据，无真实 LBS 后端）
- GSAP 头像沿圆周缓慢漂移（每秒 ±2°），营造"实时"感
- 点头像弹 RiderInvite 卡：[约骑同行] / [打招呼]
- 顶部 [刷新] 触发雷达 sweep 动画
- 三色状态环：骑行中(绿) / 想约骑(强调色脉冲) / 休息中(灰)

### 卡片切换
- 左右滑（touch swipe / wheel deltaX / 键盘 ← →）
- **三层视差过渡**：背景层 0.25x / 中景层 0.5x / 前景层 1x 不同速度位移
- 卡片整体 scale 0.96→1，加强空间深度
- 底部 indicator 圆点宽度随进度变化

### 抖音外壳
- 状态栏 + 顶部 tab (直播/关注/**推荐**) + 侧栏 (头像/❤️/💬/⭐/↗️/🎵转盘) + caption + 底部 nav

---

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置高德 key (见下方)
cp .env.example .env.local
# 编辑 .env.local 填入你的 key

# 3. 启动 dev
npm run dev
# → http://localhost:3000

# 4. 浏览器同意 GPS 定位权限即可体验完整链路
```

---

## 环境变量

需要在 `.env.local` 配置 **2 个高德 key**（都免费）：

| 变量 | 用途 | 申请位置 |
|---|---|---|
| `AMAP_WEB_KEY` | **Web 服务 key** — 服务端代理走 HTTP REST API (regeo / inputtips / bicycling / place around / weather / district) | [lbs.amap.com](https://lbs.amap.com/dev/key/app) → 应用管理 → 创建应用 → 添加 key → 服务平台选 **Web 服务** |
| `NEXT_PUBLIC_AMAP_JS_KEY` | **Web 端 JS API key** — 前端 SDK 渲染真实地图 (2D/3D/路况/卫星) | 同上,服务平台选 **Web 端 (JS API)** |
| `NEXT_PUBLIC_AMAP_JS_SECURITY` | JS API 2.0 安全密钥 (2021/12 起强制) | 同 JS API key 一起生成,在该 key 的"安全密钥"字段 |

> **安全提示**: `AMAP_WEB_KEY` 仅走服务端 (Next Route Handler 代理),永不暴露给前端。`NEXT_PUBLIC_*` 会进客户端 bundle,建议在高德后台配域名白名单 + 每日配额上限。

**未配置 key 也能跑** — 应用会优雅降级：
- 没 `AMAP_WEB_KEY` → 所有 `/api/amap/*` 返回 503,前端显示空状态/错误提示
- 没 `NEXT_PUBLIC_AMAP_JS_KEY` → RouteCard 显示 "未配置 JS API key,真实地图不显示"
- 没 GPS 权限 → 自动 fallback 到杭州九溪 mock 坐标

---

## 项目结构

```
app/
├── ridesnap-demo.tsx        # 薄入口 (状态机 + 组合)
├── page.tsx / layout.tsx
├── globals.css
├── api/
│   └── amap/                # Next Route Handler 服务端代理
│       ├── bicycling/       # 骑行路径规划
│       ├── inputtips/       # 输入提示 (自动补全)
│       ├── place/           # POI 搜索 (around / text)
│       ├── regeo/           # 反向地理编码
│       ├── weather/         # 实时天气
│       └── district/        # 行政区域查询
├── lib/
│   ├── amap.ts              # 高德客户端 (fetch + cache + dedupe)
│   ├── amap-loader.ts       # JS API 2.0 loader (含 securityJsCode)
│   ├── amap-mock.ts         # 骑友雷达 mock 数据
│   ├── geo.ts               # 浏览器 Geolocation + cached regeo
│   ├── voice-nav.ts         # SpeechSynthesis 封装
│   ├── scene-profiles.ts    # 山地/城市视频配置
│   └── use-card-deck.ts     # 左右滑视差 hook (通用)
└── components/
    ├── atoms/               # CardShell / ControlChip / MetricBig / SegmentDot / ToastBar / LegendDot
    ├── douyin/              # StatusBar / TopBar / SideActions / Caption / BottomNav
    ├── scene/               # SceneAmbience / VideoScene / DemoControls
    └── cards/               # IdleBanner / ScanningCard / RouteCard (+RealAmap/RouteMiniMap) / BuddyCard / RiderAvatar / RiderInvite / DestinationPicker / CardDeckShell
```

每个 card / atom / chrome 组件**独立可替换**，符合模块化 + 热插拔原则：
- 加新卡 = 新建 `cards/XxxCard.tsx` + import 进 `ridesnap-demo` + 加进 `CARDS` 数组
- 换数据源 = 替换 `lib/amap.ts` 实现，组件零改动
- 复用 deck = 直接 import `useCardDeck` hook

---

## 性能 / 缓存

为减少高德接口延迟（单次 2-5s），所有客户端调用走 in-memory 缓存 + in-flight 去重：

| 接口 | TTL |
|---|---|
| regeo (反向地理) | 10 分钟 |
| place/around (周边 POI) | 5 分钟 |
| bicycling (路径规划) | 5 分钟 |
| weather (天气) | 10 分钟 |

inputtips 不缓存（用户输入频繁变化），但用 AbortController 取消旧请求 + 500ms debounce。

---

## 路线图

- [x] 阶段 1: 抖音 UI 骨架 + 移除占位 AI 面板
- [x] 阶段 2: mock 高德服务层 + 状态机改造
- [x] 阶段 3: 卡 1 RouteCard
- [x] 阶段 4: 卡 2 BuddyCard 雷达 + GSAP
- [x] 阶段 5: 左右滑视差切换 + indicator
- [x] 阶段 7: 接真实高德 Web 服务 API
- [x] 阶段 7-1: Geolocation + 目的地输入 + 路径规划代理
- [x] 阶段 7-2: 真实 POI 替换 mock + 天气 + 自行车类型过滤
- [x] 阶段 7-3: Web Speech 语音导航
- [x] 阶段 7-4: JS API 2.0 真实 3D 地图 + 实时路况层
- [ ] 阶段 6: 网图/mp4 视频背景 + Keep 风字体/spacing/token 统一
- [ ] 未来: navigator.geolocation.watchPosition 实时轨迹播报
- [ ] 未来: 卡 3 装备建议 / 卡 4 挑战榜 / 卡 5 分享
- [ ] 未来: 自建 LBS 后端替换骑友 mock

---

## 项目类型说明

这是一个 **Hackathon MVP 演示项目**,验证"刷到骑行视频 → 真接导航 → 找到同伴"的产品链路。
不是生产级 SaaS，所有 mock 数据(骑友 / 视频文案)用于演示，不代表真实业务能力。

---

## 协议

仅供学习/演示使用。高德地图数据/SDK 版权归 [高德开放平台](https://lbs.amap.com) 所有，使用前请遵守其 [服务条款](https://lbs.amap.com/agreement)。
