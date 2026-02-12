import { NextRequest } from 'next/server';
import { DrawnCard, Spread, ApiConfig } from '@/lib/tarot/types';
import { buildInterpretationPrompt } from '@/lib/api/prompts';

interface InterpretRequest {
  question: string;
  spread: Spread;
  drawnCards: DrawnCard[];
  apiConfig: ApiConfig;
}

// 从环境变量获取后备配置
const FALLBACK_CONFIG = {
  endpoint: process.env.FALLBACK_LLM_ENDPOINT || '',
  apiKey: process.env.FALLBACK_LLM_KEY || '',
  model: process.env.FALLBACK_LLM_MODEL || 'gpt-4o-mini',
  enabled: process.env.ENABLE_FALLBACK_LLM === 'true',
};

// 简单的内存速率限制（生产环境建议使用 Redis）
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_PER_HOUR = parseInt(process.env.RATE_LIMIT_PER_HOUR || '10', 10);

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 3600000 }); // 1 hour
    return true;
  }

  if (record.count >= RATE_LIMIT_PER_HOUR) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body: InterpretRequest = await request.json();
    const { question, spread, drawnCards, apiConfig } = body;

    // 决定使用用户配置还是后备配置
    let effectiveConfig = apiConfig;
    let usingFallback = false;

    if (!apiConfig.apiKey && FALLBACK_CONFIG.enabled && FALLBACK_CONFIG.apiKey) {
      // 使用后备配置时进行速率限制
      const ip = request.headers.get('x-forwarded-for') ||
                 request.headers.get('x-real-ip') ||
                 'unknown';

      if (!checkRateLimit(ip)) {
        return new Response(
          JSON.stringify({
            error: `请求过于频繁，每小时最多 ${RATE_LIMIT_PER_HOUR} 次请求。建议配置自己的 API Key 以解除限制。`
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }

      effectiveConfig = FALLBACK_CONFIG;
      usingFallback = true;
    } else if (!apiConfig.apiKey) {
      return new Response(
        JSON.stringify({ error: '请先配置 API Key' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const prompt = buildInterpretationPrompt(question, spread, drawnCards);

    const endpoint = effectiveConfig.endpoint.trim();
    const hasChatCompletions = endpoint.includes('/chat/completions');
    const baseEndpoint = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
    const requestUrl = hasChatCompletions ? baseEndpoint : `${baseEndpoint}/chat/completions`;

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${effectiveConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: effectiveConfig.model,
        messages: [
          { role: 'user', content: prompt }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: `API 请求失败: ${response.status} - ${errorText}` }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!response.body) {
      return new Response(
        JSON.stringify({ error: '上游未返回响应流' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...(usingFallback && { 'X-Using-Fallback': 'true' }),
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: '服务器错误' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
