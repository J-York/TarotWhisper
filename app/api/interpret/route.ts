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
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: '服务器错误' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
