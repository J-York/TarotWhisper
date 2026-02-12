# 安全的内置 LLM 配置方案

## 方案概述

本项目实现了一个安全的内置 LLM 配置系统，允许你为没有自己 API Key 的用户提供服务，同时确保你的 API 密钥不会泄露。

## 安全保障

### 1. API 密钥永不暴露
- ✅ 密钥仅存储在服务器端环境变量中
- ✅ 客户端代码永远无法访问内置密钥
- ✅ API 请求通过服务器端代理，密钥不会发送到浏览器

### 2. 不会提交到代码仓库
- ✅ 使用 `.env.local` 进行本地开发（已在 `.gitignore` 中）
- ✅ 使用 Vercel 环境变量进行生产部署
- ✅ 提供 `.env.example` 作为配置模板（不包含真实密钥）

### 3. 防止滥用
- ✅ 内置速率限制（默认每 IP 每小时 10 次请求）
- ✅ 用户可配置自己的 API Key 以解除限制
- ✅ 响应头标记是否使用了内置配置（便于监控）

### 4. 灵活配置
- ✅ 可以随时启用/禁用内置配置
- ✅ 用户配置优先于内置配置
- ✅ 支持任何兼容 OpenAI 格式的 API

## 快速开始

### 在 Vercel 上部署

1. **添加环境变量**

   在 Vercel 项目设置中添加：
   ```
   ENABLE_FALLBACK_LLM=true
   FALLBACK_LLM_ENDPOINT=https://api.openai.com/v1/chat/completions
   FALLBACK_LLM_KEY=sk-your-actual-api-key-here
   FALLBACK_LLM_MODEL=gpt-4o-mini
   RATE_LIMIT_PER_HOUR=10
   ```

2. **重新部署**

   添加环境变量后触发重新部署。

3. **验证**

   访问 `https://your-domain.vercel.app/api/config` 应该返回：
   ```json
   {
     "fallbackAvailable": true,
     "rateLimit": 10
   }
   ```

### 本地开发

1. **创建环境变量文件**
   ```bash
   cp .env.example .env.local
   ```

2. **编辑 `.env.local`**
   ```env
   ENABLE_FALLBACK_LLM=true
   FALLBACK_LLM_ENDPOINT=https://api.openai.com/v1/chat/completions
   FALLBACK_LLM_KEY=sk-your-actual-api-key-here
   FALLBACK_LLM_MODEL=gpt-4o-mini
   RATE_LIMIT_PER_HOUR=10
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

## 工作流程

```
用户发起请求
    ↓
检查用户是否提供了 API Key
    ↓
    ├─ 是 → 使用用户配置（无速率限制）
    │
    └─ 否 → 检查内置配置是否启用
            ↓
            ├─ 是 → 检查速率限制
            │       ↓
            │       ├─ 通过 → 使用内置配置
            │       └─ 超限 → 返回 429 错误
            │
            └─ 否 → 返回 400 错误（需要配置）
```

## 成本控制

### 1. 速率限制
默认每 IP 每小时 10 次请求。根据你的预算调整 `RATE_LIMIT_PER_HOUR`。

### 2. OpenAI 使用限额
在 OpenAI 控制台设置月度使用限额：
1. 访问 https://platform.openai.com/account/billing/limits
2. 设置 "Monthly budget" 限额

### 3. 选择经济模型
- `gpt-4o-mini`: 最经济（推荐）
- `gpt-3.5-turbo`: 较经济
- `gpt-4o`: 较贵

### 4. 监控使用情况
定期检查：
- Vercel 日志中的请求量
- OpenAI 控制台的使用统计
- 响应头 `X-Using-Fallback: true` 的请求数量

## 安全检查清单

部署前请确认：

- [ ] `.env.local` 已添加到 `.gitignore`（Next.js 默认已包含）
- [ ] 环境变量已在 Vercel 中配置，而非硬编码
- [ ] 已设置合理的速率限制
- [ ] 已在 OpenAI 控制台设置使用限额
- [ ] 已测试内置配置是否正常工作
- [ ] 已测试用户自定义配置是否优先生效
- [ ] 已测试速率限制是否生效

## 禁用内置配置

如果你想要求所有用户提供自己的 API Key：

1. 在 Vercel 中将 `ENABLE_FALLBACK_LLM` 设置为 `false`
2. 或者删除该环境变量
3. 重新部署

## 常见问题

### Q: 内置密钥会被用户看到吗？
A: 不会。密钥仅存在于服务器端环境变量中，永远不会发送到客户端。

### Q: 如何知道用户是否在使用内置配置？
A: 检查响应头 `X-Using-Fallback: true`，或查看浏览器控制台日志。

### Q: 速率限制是如何实现的？
A: 基于 IP 地址的内存计数器。生产环境建议使用 Redis 等持久化方案。

### Q: 可以使用其他 LLM 提供商吗？
A: 可以，只要 API 兼容 OpenAI 格式即可（如 Azure OpenAI、Claude via proxy 等）。

### Q: 如何升级速率限制方案？
A: 当前使用内存存储，重启会重置。建议使用 Vercel KV 或 Upstash Redis 实现持久化。

## 进一步优化

### 使用 Vercel KV 实现持久化速率限制

```typescript
import { kv } from '@vercel/kv';

async function checkRateLimit(ip: string): Promise<boolean> {
  const key = `ratelimit:${ip}`;
  const count = await kv.incr(key);

  if (count === 1) {
    await kv.expire(key, 3600); // 1 hour
  }

  return count <= RATE_LIMIT_PER_HOUR;
}
```

### 添加用户认证
为注册用户提供更高的速率限制或无限制访问。

### 添加使用统计
记录 API 使用情况，便于成本分析和优化。

## 相关文档

- [Vercel 环境变量文档](https://vercel.com/docs/concepts/projects/environment-variables)
- [OpenAI API 文档](https://platform.openai.com/docs/api-reference)
- [Next.js 环境变量](https://nextjs.org/docs/basic-features/environment-variables)
