# 内置 LLM 配置指南

## 概述

本项目支持为没有自己 API Key 的用户提供内置的 LLM 服务。这个功能是可选的，并且通过环境变量进行安全配置。

## 安全特性

1. **API Key 不会暴露**: 密钥仅存储在服务器端环境变量中，永远不会发送到客户端
2. **不会提交到代码仓库**: 使用 `.env.local` 或 Vercel 环境变量，不会出现在 Git 历史中
3. **速率限制**: 内置配置会自动应用速率限制，防止滥用（默认每小时 10 次请求）
4. **用户配置优先**: 如果用户提供了自己的 API Key，将优先使用用户配置

## 在 Vercel 上配置

### 步骤 1: 添加环境变量

在 Vercel 项目设置中添加以下环境变量：

1. 进入你的 Vercel 项目
2. 点击 "Settings" > "Environment Variables"
3. 添加以下变量：

```
ENABLE_FALLBACK_LLM=true
FALLBACK_LLM_ENDPOINT=https://api.openai.com/v1/chat/completions
FALLBACK_LLM_KEY=sk-your-actual-api-key-here
FALLBACK_LLM_MODEL=gpt-4o-mini
RATE_LIMIT_PER_HOUR=10
```

### 步骤 2: 重新部署

添加环境变量后，触发一次重新部署以使配置生效。

## 本地开发配置

1. 复制 `.env.example` 为 `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. 编辑 `.env.local`，填入你的配置：
   ```
   ENABLE_FALLBACK_LLM=true
   FALLBACK_LLM_ENDPOINT=https://api.openai.com/v1/chat/completions
   FALLBACK_LLM_KEY=sk-your-actual-api-key-here
   FALLBACK_LLM_MODEL=gpt-4o-mini
   RATE_LIMIT_PER_HOUR=10
   ```

3. 确保 `.env.local` 已在 `.gitignore` 中（Next.js 默认已包含）

## 工作原理

1. **用户有 API Key**: 直接使用用户提供的配置，无速率限制
2. **用户无 API Key + 内置配置已启用**: 使用服务器端的内置配置，应用速率限制
3. **用户无 API Key + 内置配置未启用**: 提示用户配置 API Key

## 速率限制

- 使用内置配置时，每个 IP 地址每小时最多请求 `RATE_LIMIT_PER_HOUR` 次
- 超过限制后会返回 429 错误，提示用户配置自己的 API Key
- 用户使用自己的 API Key 时不受此限制

## 成本控制建议

1. 设置合理的速率限制（建议 5-20 次/小时）
2. 在 OpenAI 控制台设置月度使用限额
3. 定期监控 API 使用情况
4. 考虑使用更便宜的模型（如 gpt-4o-mini）

## 安全检查清单

- [ ] `.env.local` 已添加到 `.gitignore`
- [ ] 环境变量已在 Vercel 中配置，而非硬编码在代码中
- [ ] 已设置合理的速率限制
- [ ] 已在 OpenAI 控制台设置使用限额
- [ ] 定期检查 API 使用日志

## 禁用内置配置

如果你想禁用内置配置，只需：
- 在 Vercel 中将 `ENABLE_FALLBACK_LLM` 设置为 `false`
- 或者删除该环境变量

这样所有用户都必须提供自己的 API Key 才能使用服务。
