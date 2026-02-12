# 安全分析：API Key 保护

## 问题：用户能否通过抓包获取 API Key？

**答案：不能。** 当前实现是安全的。

## 网络请求流程分析

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│ 用户浏览器   │────①───→│ 你的服务器    │────②───→│ 上游 LLM API │
│             │←───④────│ (Vercel)     │←───③────│             │
└─────────────┘         └──────────────┘         └─────────────┘
   可抓包                   不可抓包
```

### ① 浏览器 → 服务器（用户可抓包）

**请求内容：**
```json
POST /api/interpret
{
  "question": "我的问题",
  "spread": {...},
  "drawnCards": [...],
  "apiConfig": {
    "endpoint": "https://api.openai.com/v1/chat/completions",
    "apiKey": "",  // 空字符串！
    "model": "gpt-4o-mini"
  }
}
```

**关键点：** `apiConfig.apiKey` 是空的，不包含你的内置 API Key。

### ② 服务器 → 上游 API（用户不可抓包）

**请求内容：**
```http
POST https://api.openai.com/v1/chat/completions
Authorization: Bearer sk-your-secret-key  ← 你的 API Key
Content-Type: application/json

{
  "model": "gpt-4o-mini",
  "messages": [...],
  "stream": true
}
```

**关键点：** 这个请求发生在服务器端（Vercel），用户无法抓包看到。

### ③④ 响应流

服务器将上游 API 的响应流式传输回浏览器，不包含任何 API Key 信息。

## 为什么用户无法获取 API Key？

### 1. 服务器端替换
```typescript
// 在服务器端（用户看不到这段代码的执行）
if (!apiConfig.apiKey && FALLBACK_CONFIG.enabled) {
  effectiveConfig = FALLBACK_CONFIG;  // 使用服务器端的密钥
}
```

### 2. 环境变量隔离
- API Key 存储在 Vercel 环境变量中
- 环境变量只在服务器端可访问
- Next.js 不会将服务器端环境变量发送到客户端

### 3. 网络隔离
- 用户只能抓包自己浏览器的网络请求
- 无法抓包 Vercel 服务器的出站请求
- 除非用户能物理访问 Vercel 的服务器（不可能）

## 额外的安全措施

### 1. 错误消息清理
```typescript
// 清理错误消息中可能泄露的敏感信息
const sanitizedError = errorText
  .replace(/Bearer\s+[^\s]+/gi, 'Bearer [REDACTED]')
  .replace(/sk-[a-zA-Z0-9]+/gi, '[REDACTED]')
  .replace(new RegExp(effectiveConfig.apiKey, 'g'), '[REDACTED]');
```

即使上游 API 在错误消息中返回了 API Key（极少见），也会被清理。

### 2. 防止配置伪造
```typescript
// 如果客户端发送的配置与内置配置完全匹配，拒绝请求
if (apiConfig.apiKey === FALLBACK_CONFIG.apiKey) {
  return new Response(JSON.stringify({ error: '无效的配置' }), { status: 403 });
}
```

防止有人通过某种方式获取了内置配置并尝试直接使用。

### 3. 速率限制
```typescript
// 基于 IP 的速率限制
if (!checkRateLimit(ip)) {
  return new Response(JSON.stringify({ error: '请求过于频繁' }), { status: 429 });
}
```

即使有人尝试暴力破解或滥用，也会被速率限制阻止。

## 可能的攻击向量分析

### ❌ 攻击 1：抓包浏览器请求
**方法：** 使用 Chrome DevTools 或 Wireshark 抓包
**结果：** 只能看到空的 `apiConfig.apiKey`
**防御：** ✅ 客户端不发送内置 API Key

### ❌ 攻击 2：查看客户端代码
**方法：** 查看浏览器中的 JavaScript 代码
**结果：** 代码中没有硬编码的 API Key
**防御：** ✅ API Key 只存在于服务器端环境变量

### ❌ 攻击 3：反编译 Next.js 构建产物
**方法：** 下载并分析 `_next/static/` 文件
**结果：** 构建产物中不包含服务器端环境变量
**防御：** ✅ Next.js 不会将服务器端环境变量打包到客户端

### ❌ 攻击 4：通过错误消息泄露
**方法：** 触发错误，希望错误消息包含 API Key
**结果：** 错误消息已被清理
**防御：** ✅ 实现了错误消息清理机制

### ❌ 攻击 5：中间人攻击（MITM）
**方法：** 拦截 HTTPS 请求
**结果：** 只能看到浏览器到服务器的请求（不包含 API Key）
**防御：** ✅ API Key 在服务器端添加，不经过客户端

### ❌ 攻击 6：服务器端代码注入
**方法：** 尝试通过输入注入代码读取环境变量
**结果：** Next.js 和 TypeScript 的类型安全防止了注入
**防御：** ✅ 使用类型安全的 API，没有 `eval()` 或动态代码执行

## 唯一的风险场景

### ⚠️ 服务器被攻破
如果攻击者能够：
1. 获取 Vercel 账号访问权限
2. 或者通过 RCE（远程代码执行）漏洞访问服务器

那么他们可以读取环境变量。

**缓解措施：**
- 使用强密码和 2FA 保护 Vercel 账号
- 定期更新依赖，修复安全漏洞
- 在 OpenAI 控制台设置使用限额
- 定期轮换 API Key
- 监控异常使用情况

## 结论

✅ **当前实现是安全的**，用户无法通过正常手段（抓包、查看代码等）获取你的 API Key。

✅ **已实现多层防御**：
- 环境变量隔离
- 服务器端替换
- 错误消息清理
- 配置伪造防护
- 速率限制

✅ **符合行业最佳实践**：
- 与 Vercel、Netlify 等平台的标准做法一致
- 与 SaaS 应用的 API 代理模式相同
- 遵循"永不信任客户端"原则

## 推荐的额外措施

1. **监控使用情况**
   - 在 OpenAI 控制台查看 API 使用统计
   - 设置使用量告警

2. **设置使用限额**
   - 在 OpenAI 控制台设置月度预算
   - 防止意外超支

3. **定期轮换密钥**
   - 每 3-6 个月更换一次 API Key
   - 在 Vercel 中更新环境变量

4. **日志监控**
   - 记录使用内置配置的请求
   - 监控异常流量模式

5. **考虑升级速率限制**
   - 使用 Vercel KV 或 Upstash Redis
   - 实现更精细的限流策略
