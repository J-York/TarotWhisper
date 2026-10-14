import { NextRequest } from 'next/server';

import { extractBaseUrl } from '@/lib/api/llm-client';

const UPSTREAM_TIMEOUT_MS = 15_000;

interface ModelsRequest {
  endpoint?: unknown;
  apiKey?: unknown;
}

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

export async function POST(request: NextRequest): Promise<Response> {
  let body: ModelsRequest;
  try {
    body = await request.json() as ModelsRequest;
  } catch {
    return jsonError('请求体 JSON 解析失败', 400);
  }

  const { endpoint, apiKey } = body;
  if (typeof endpoint !== 'string' || !endpoint.trim() || typeof apiKey !== 'string' || !apiKey) {
    return jsonError('请先填写 API 端点和密钥', 400);
  }

  let modelsUrl: URL;
  try {
    modelsUrl = new URL(`${extractBaseUrl(endpoint.trim())}/models`);
  } catch {
    return jsonError('API 端点不是有效的网址', 400);
  }
  if (modelsUrl.protocol !== 'https:' && modelsUrl.protocol !== 'http:') {
    return jsonError('API 端点必须以 http:// 或 https:// 开头', 400);
  }

  let response: globalThis.Response;
  try {
    response = await fetch(modelsUrl, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      cache: 'no-store',
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      return jsonError('获取模型列表超时，请检查 API 端点', 504);
    }
    return jsonError(`无法连接 API 端点: ${err instanceof Error ? err.message : String(err)}`, 502);
  }

  const text = await response.text().catch(() => '');
  if (!response.ok) {
    const detail = text.split(apiKey).join('[REDACTED]').replace(/\s+/g, ' ').slice(0, 200);
    return jsonError(`获取模型列表失败 (${response.status})${detail ? `: ${detail}` : ''}`, response.status >= 500 ? 502 : response.status);
  }

  try {
    const data = JSON.parse(text) as { data?: unknown };
    return Response.json({ data: Array.isArray(data.data) ? data.data : [] });
  } catch {
    return jsonError('API 端点返回的不是模型列表，请检查端点地址', 502);
  }
}
