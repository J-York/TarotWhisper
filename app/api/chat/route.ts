import { NextRequest } from 'next/server'

// 常量配置
const MAX_MESSAGES = 50
const MAX_CONTENT_LENGTH = 10000
const VALID_ROLES = ['system', 'user', 'assistant'] as const

// 验证结果类型
interface ValidationResult {
  valid: boolean
  error?: string
}

// 消息类型
interface ChatMessage {
  role: string
  content: string
}

// 请求体类型
interface ChatRequestBody {
  messages: ChatMessage[]
  model?: string
  stream?: boolean
  [key: string]: unknown
}

const normalize = (value: string | undefined | null): string | null => {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const parseBoolean = (value: string | undefined | null): boolean => {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on'
}

/**
 * 验证聊天请求体
 * @param body 请求体
 * @returns 验证结果
 */
function validateChatRequest(body: unknown): ValidationResult {
  // 验证请求体是否为对象
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' }
  }

  const { messages, model, stream } = body as Record<string, unknown>

  // 验证 messages 是否为非空数组
  if (!Array.isArray(messages)) {
    return { valid: false, error: 'Messages must be an array' }
  }

  if (messages.length === 0) {
    return { valid: false, error: 'Messages must be a non-empty array' }
  }

  // 验证 messages 数组长度
  if (messages.length > MAX_MESSAGES) {
    return { valid: false, error: `Too many messages (max ${MAX_MESSAGES})` }
  }

  // 验证每条消息
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]

    // 验证消息是否为对象
    if (!msg || typeof msg !== 'object') {
      return { valid: false, error: 'Invalid message format' }
    }

    const { role, content } = msg as Record<string, unknown>

    // 验证 role 字段
    if (typeof role !== 'string') {
      return { valid: false, error: 'Message role must be a string' }
    }

    if (!VALID_ROLES.includes(role as typeof VALID_ROLES[number])) {
      return { valid: false, error: 'Invalid message role' }
    }

    // 验证 content 字段
    if (typeof content !== 'string') {
      return { valid: false, error: 'Message content must be a string' }
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      return { valid: false, error: `Message content too long (max ${MAX_CONTENT_LENGTH} chars)` }
    }
  }

  // 验证可选字段 model
  if (model !== undefined && typeof model !== 'string') {
    return { valid: false, error: 'Model must be a string' }
  }

  // 验证可选字段 stream
  if (stream !== undefined && typeof stream !== 'boolean') {
    return { valid: false, error: 'Stream must be a boolean' }
  }

  return { valid: true }
}

export async function POST(request: NextRequest) {
  try {
    const baseUrl = normalize(process.env.DEFAULT_LLM_BASE_URL)
    const apiKey = normalize(process.env.DEFAULT_LLM_API_KEY)
    const enabled = parseBoolean(process.env.DEFAULT_LLM_ENABLED)

    if (!enabled || !baseUrl || !apiKey) {
      return new Response(
        JSON.stringify({ error: '默认 LLM 配置未启用或配置不完整' }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // 解析请求体
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // 验证请求体
    const validation = validateChatRequest(body)
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const validatedBody = body as ChatRequestBody

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(validatedBody)
    })

    if (!response.ok) {
      // 在生产环境中不返回详细错误信息
      const isProduction = process.env.NODE_ENV === 'production'
      
      if (isProduction) {
        return new Response(
          JSON.stringify({
            error: 'LLM API 请求失败'
          }),
          {
            status: response.status,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      } else {
        const errorText = await response.text()
        return new Response(
          JSON.stringify({
            error: `LLM API 请求失败: ${response.status} ${response.statusText}`,
            details: errorText
          }),
          {
            status: response.status,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }

    if (validatedBody.stream) {
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    } else {
      const data = await response.json()
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
  } catch (error) {
    console.error('API 路由错误:', error)
    
    // 在生产环境中不返回详细错误信息
    const isProduction = process.env.NODE_ENV === 'production'
    
    return new Response(
      JSON.stringify({
        error: '服务器内部错误',
        ...(isProduction ? {} : { message: error instanceof Error ? error.message : '未知错误' })
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
