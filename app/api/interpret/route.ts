import { NextRequest } from 'next/server';
import { DrawnCard, Spread, ApiConfig } from '@/lib/tarot/types';
import { buildInterpretationPrompt } from '@/lib/api/prompts';

interface InterpretRequest {
  question: string;
  spread: Spread;
  drawnCards: DrawnCard[];
  apiConfig: ApiConfig;
}

export async function POST(request: NextRequest) {
  try {
    const body: InterpretRequest = await request.json();
    const { question, spread, drawnCards, apiConfig } = body;

    if (!apiConfig.apiKey) {
      return new Response(
        JSON.stringify({ error: '请先配置 API Key' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const prompt = buildInterpretationPrompt(question, spread, drawnCards);

    const endpoint = apiConfig.endpoint.trim();
    const hasChatCompletions = endpoint.includes('/chat/completions');
    const baseEndpoint = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
    const requestUrl = hasChatCompletions ? baseEndpoint : `${baseEndpoint}/chat/completions`;

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: apiConfig.model,
        messages: [
          { role: 'user', content: prompt }
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: `API 请求失败: ${response.status} - ${errorText}` }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const contentType = response.headers.get('content-type') || '';

    // 如果是非流式 JSON 响应，直接解析并返回
    if (contentType.includes('application/json')) {
      const json = await response.json();
      // 安全访问choices数组，确保数组不为空
      const choice = json.choices && json.choices.length > 0 ? json.choices[0] : null;
      const content = choice?.message?.content || choice?.delta?.content || '';
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          if (content) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    }

    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: '无法读取响应' })}\n\n`));
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let fullResponseBody = '';
        let hasEmittedContent = false;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            fullResponseBody += chunk;
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed === 'data: [DONE]') continue;
              if (!trimmed.startsWith('data: ')) continue;

              try {
                const json = JSON.parse(trimmed.slice(6));
                // 支持流式格式 (delta.content) 和非流式格式 (message.content)
                // 安全访问choices数组，确保数组不为空
                const choice = json.choices && json.choices.length > 0 ? json.choices[0] : null;
                const content = choice?.delta?.content || choice?.message?.content;
                if (content) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                  hasEmittedContent = true;
                }
              } catch {
                // 忽略解析错误
              }
            }
          }

          // 处理 buffer 中剩余的内容
          if (buffer.trim()) {
            const trimmed = buffer.trim();
            if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
              try {
                const json = JSON.parse(trimmed.slice(6));
                // 安全访问choices数组，确保数组不为空
                const choice = json.choices && json.choices.length > 0 ? json.choices[0] : null;
                const content = choice?.delta?.content || choice?.message?.content;
                if (content) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                  hasEmittedContent = true;
                }
              } catch {
                // 忽略解析错误
              }
            }
          }

          // 如果没有发送任何内容，尝试将整个响应体作为 JSON 解析
          // 这处理了网关返回完整 JSON 但使用了 text/event-stream content-type 的情况
          if (!hasEmittedContent && fullResponseBody.trim()) {
            try {
              const json = JSON.parse(fullResponseBody.trim());
              const content = json.choices?.[0]?.message?.content || json.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                hasEmittedContent = true;
              }
            } catch {
              // 如果也解析失败，保持静默
            }
          }
        } catch {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: '流读取错误' })}\n\n`));
        } finally {
          reader.releaseLock();
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: '服务器错误' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
