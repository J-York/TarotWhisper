# Vercel 部署指南

## 环境变量配置

在 Vercel 项目设置中添加以下环境变量以启用内置 LLM 配置：

### 必需变量

| 变量名 | 示例值 | 说明 |
|--------|--------|------|
| `ENABLE_FALLBACK_LLM` | `true` | 启用内置配置 |
| `FALLBACK_LLM_ENDPOINT` | `https://api.openai.com/v1/chat/completions` | API 端点 |
| `FALLBACK_LLM_KEY` | `sk-proj-...` | 你的 API 密钥 |
| `FALLBACK_LLM_MODEL` | `gpt-4o-mini` | 模型名称 |

### 可选变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `RATE_LIMIT_PER_HOUR` | `10` | 每 IP 每小时请求限制 |

## 配置步骤

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** → **Environment Variables**
4. 添加上述变量
5. 点击 **Save**
6. 触发重新部署（或等待下次自动部署）

## 验证配置

部署完成后，访问：
```
https://your-domain.vercel.app/api/config
```

应该返回：
```json
{
  "fallbackAvailable": true,
  "rateLimit": 10
}
```

## 禁用内置配置

如果你想禁用内置配置，只需：
- 将 `ENABLE_FALLBACK_LLM` 设置为 `false`
- 或删除该环境变量

## 安全提示

✅ 环境变量仅在服务器端可用，不会暴露给客户端
✅ 定期检查 OpenAI 使用情况，避免超出预算
✅ 根据实际情况调整速率限制
