/**
 * SSE (Server-Sent Events) 流解析器
 * 
 * 解决跨 chunk 数据块导致 JSON 解析失败的问题
 * 使用缓冲区机制确保完整的行被正确解析
 */

/**
 * SSE 数据块的类型定义
 */
export interface SSEChunk {
  choices?: Array<{
    delta?: {
      content?: string
      role?: string
    }
    finish_reason?: string | null
  }>
  id?: string
  object?: string
  created?: number
  model?: string
}

/**
 * 解析 SSE 流的异步生成器
 * 
 * @param reader - ReadableStreamDefaultReader 实例
 * @yields 解析后的 SSE 数据对象
 * 
 * @example
 * ```typescript
 * const reader = response.body?.getReader()
 * if (reader) {
 *   for await (const chunk of parseSSEStream(reader)) {
 *     const content = chunk.choices?.[0]?.delta?.content
 *     if (content) {
 *       console.log(content)
 *     }
 *   }
 * }
 * ```
 */
export async function* parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncGenerator<SSEChunk, void, unknown> {
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      // 使用 stream: true 确保多字节字符正确解码
      buffer += decoder.decode(value, { stream: true })
      
      // 按换行符分割，保留可能不完整的最后一行
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // 保留不完整的行到缓冲区

      for (const line of lines) {
        const trimmedLine = line.trim()
        
        // 跳过空行和注释
        if (!trimmedLine || trimmedLine.startsWith(':')) {
          continue
        }

        // 处理 data: 前缀的行
        if (trimmedLine.startsWith('data: ')) {
          const data = trimmedLine.slice(6) // 移除 'data: ' 前缀
          
          // 跳过 [DONE] 标记
          if (data === '[DONE]') {
            continue
          }

          try {
            const parsed = JSON.parse(data) as SSEChunk
            yield parsed
          } catch (parseError) {
            // JSON 解析失败，记录错误但继续处理
            console.error('SSE JSON parse error:', parseError, 'Data:', data)
          }
        }
      }
    }

    // 处理缓冲区中剩余的数据
    if (buffer.trim()) {
      const trimmedBuffer = buffer.trim()
      if (trimmedBuffer.startsWith('data: ')) {
        const data = trimmedBuffer.slice(6)
        if (data !== '[DONE]') {
          try {
            const parsed = JSON.parse(data) as SSEChunk
            yield parsed
          } catch (parseError) {
            console.error('SSE JSON parse error (final buffer):', parseError, 'Data:', data)
          }
        }
      }
    }
  } finally {
    // 确保 reader 被正确释放
    reader.releaseLock()
  }
}

/**
 * 从 SSE 流中提取文本内容的辅助函数
 * 
 * @param reader - ReadableStreamDefaultReader 实例
 * @param onContent - 每次收到内容时的回调函数
 * @returns 完整的文本内容
 * 
 * @example
 * ```typescript
 * const reader = response.body?.getReader()
 * if (reader) {
 *   const fullText = await extractSSEContent(reader, (content) => {
 *     setStreamingText(prev => prev + content)
 *   })
 *   console.log('Complete:', fullText)
 * }
 * ```
 */
export async function extractSSEContent(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onContent?: (content: string) => void
): Promise<string> {
  let fullContent = ''

  for await (const chunk of parseSSEStream(reader)) {
    const content = chunk.choices?.[0]?.delta?.content
    if (content) {
      fullContent += content
      onContent?.(content)
    }
  }

  return fullContent
}