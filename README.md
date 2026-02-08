# Mystic Tarot（神秘塔罗）

一个基于 **Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS 4** 的塔罗占卜 Web 应用。  
支持完整 78 张 Rider–Waite–Smith 牌组、多种牌阵、流式 AI 解读与本地历史记录。

---

## 功能特性

- 🃏 **完整牌组**：大阿卡纳 + 小阿卡纳，共 78 张
- ✨ **多牌阵**：单张牌、三张牌、凯尔特十字等
- 🔮 **AI 流式解读**：通过可配置 LLM 接口实时返回内容（SSE）
- ⚙️ **可配置 API**：支持自定义 endpoint / model / apiKey
- 🕰️ **历史记录**：本地保存占卜结果，可查看详情、批量删除、清空
- 🌌 **沉浸式视觉风格**：暗色神秘主题 + glassmorphism

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
```

---

## API 配置说明

应用首次使用时可在页面右上角「API 设置」中填写：

- `endpoint`：兼容 OpenAI Chat Completions 的接口地址
  - 例如：`https://api.openai.com/v1/chat/completions`
- `apiKey`：你的密钥
- `model`：模型名称（默认 `gpt-4o-mini`）

配置保存在浏览器 `localStorage`，仅在本地生效。

---

## 项目结构

```text
.
├─ app/
│  ├─ api/interpret/route.ts       # AI 解读接口（流式转发）
│  ├─ history/                     # 历史记录页与详情页
│  ├─ reading/page.tsx             # 占卜主流程页面
│  ├─ globals.css                  # 全局样式与主题效果
│  ├─ layout.tsx
│  └─ page.tsx                     # 首页
├─ components/                     # UI 组件
├─ hooks/                          # 业务 hooks（如 useReading/useApiConfig）
├─ lib/
│  ├─ api/                         # LLM 调用与 prompt
│  ├─ tarot/                       # 牌组、牌阵、类型定义
│  └─ storage.ts                   # 本地历史存储
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

- 当前项目未配置测试框架（Jest/Vitest/Playwright）
- TypeScript 严格模式已开启，请保持类型安全
- 若你使用第三方兼容接口，请确认其支持 Chat Completions 与流式输出

---

## 许可证

项目代码许可证请按仓库实际设置为准。  
牌面资源来源于公开可用 Rider–Waite–Smith（1909）相关资源，请在商用前自行确认素材授权范围。
