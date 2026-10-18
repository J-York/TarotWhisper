# Mystic Tarot（神秘塔罗）

*[English](./README.md) · 简体中文*

一个基于 **Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS 4** 的塔罗占卜 Web 应用。  
支持完整 78 张 Rider–Waite–Smith 牌组、多种牌阵、流式 AI 解读与本地历史记录。

---

## 功能特性

- 🃏 **完整牌组**：大阿卡纳 + 小阿卡纳，共 78 张
- ✨ **多牌阵**：单张牌、三张牌、凯尔特十字等
- 🔮 **AI 流式解读**：通过可配置 LLM 接口实时返回内容（SSE）
- 💬 **神谕对话**：首页支持「神谕选牌」与「我自己抽」，选牌阵、洗牌、翻牌和追问都在同一段对话中完成
- 📅 **今日与牌典**：每日一牌、农历日历、个人札记与完整牌组索引
- ⚙️ **可配置 API**：支持自定义 endpoint / model / apiKey
- 🕰️ **历史记录**：本地保存占卜结果，可查看详情、批量删除、清空
- 🌌 **纸本手札风格**：纸张底色、朱砂强调色与霞鹜文楷手写字体

---

## 技术栈

- **框架**：Next.js 16（App Router）
- **UI**：React 19、Tailwind CSS 4
- **语言**：TypeScript 5（strict）
- **代码规范**：ESLint 9（`eslint-config-next`）
- **渲染内容**：`react-markdown`

---

## 快速开始

### 1) 安装依赖

```bash
npm install
```

### 2) 启动开发环境

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)

### 3) 构建与生产运行

```bash
npm run build
npm run start
```

### 4) 代码检查

```bash
npm run lint
npm test
```

---

## API 配置说明

应用首次使用时可在页面右上角的配置入口中填写：

- `endpoint`：兼容 OpenAI Chat Completions 的接口地址
  - 例如：`https://api.openai.com/v1/chat/completions`
- `apiKey`：你的密钥
- `model`：模型名称（默认 `gpt-4o-mini`）

配置保存在浏览器 `localStorage`，仅在本地生效。

导航包含神谕（`/`）、今日（`/daily`）、牌典（`/library`）与手札（`/history`）。旧的 `/agent` 和 `/reading` 地址会重定向到首页。

---

## 项目结构

```text
.
├─ app/
│  ├─ api/interpret/route.ts       # AI 解读接口（流式转发）
│  ├─ history/                     # 手札列表与详情页
│  ├─ daily/page.tsx               # 今日一牌、日历与札记
│  ├─ library/page.tsx             # 牌典索引与牌面详情
│  ├─ globals.css                  # 全局样式与主题效果
│  ├─ layout.tsx
│  └─ page.tsx                     # 神谕对话，含亲手抽牌流程
├─ components/                     # OracleLetter、Composer、SpreadBoard、Dialog 等
├─ hooks/                          # useAgentChat、useApiConfig、useConfirm 等
├─ lib/
│  ├─ api/                         # LLM 调用与 prompt
│  ├─ tarot/                       # 牌组、牌阵、类型定义
│  └─ readingStorage.ts            # 本地历史存储
├─ tests/                          # Vitest 测试
├─ public/cards/                   # 塔罗牌图片资源
└─ scripts/download-cards.js       # 下载牌图脚本
```

---

## 数据与隐私

- 历史记录与 API 配置默认保存在浏览器本地 `localStorage`
- 服务端不持久化你的占卜历史
- 请妥善保管 API Key，不要在公共环境泄露

---

## 注意事项

- 使用 Vitest + Testing Library + jsdom 验证逻辑与组件
- TypeScript 严格模式已开启，请保持类型安全
- 若你使用第三方兼容接口，请确认其支持 Chat Completions 与流式输出

---

## 许可证

源代码以 [MIT License](./LICENSE) 发布。

该许可仅覆盖代码，**不包含** `public/cards/` 下的牌面素材。这些图片源自 Rider–Waite–Smith 牌组（Pamela Colman Smith，1909），在美国及多数司法辖区已进入公有领域，但具体扫描件取自第三方档案站点，请在再分发或商用前自行确认其授权范围。
