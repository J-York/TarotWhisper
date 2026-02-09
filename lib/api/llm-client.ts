import { ApiConfig } from '../tarot/types';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ModelInfo {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface ModelsListResponse {
  object: string;
  data: ModelInfo[];
}

export interface LLMStreamResponse {
  choices: Array<{
    delta: {
      content?: string;
    };
  }>;
}

export async function* streamLLMResponse(
  config: ApiConfig,
  messages: LLMMessage[]
): AsyncGenerator<string, void, unknown> {
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API 请求失败: ${response.status} - ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('无法读取响应流');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data: ')) continue;

        try {
          const json = JSON.parse(trimmed.slice(6)) as LLMStreamResponse;
          // 安全访问choices数组，确保数组不为空
          const choice = json.choices && json.choices.length > 0 ? json.choices[0] : null;
          const content = choice?.delta?.content;
          if (content) {
            yield content;
          }
        } catch {
          // 忽略解析错误，继续处理下一行
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function callLLM(
  config: ApiConfig,
  messages: LLMMessage[]
): Promise<string> {
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API 请求失败: ${response.status} - ${error}`);
  }

  const data = await response.json();
  // 安全访问choices数组，确保数组不为空
  const choice = data.choices && data.choices.length > 0 ? data.choices[0] : null;
  return choice?.message?.content || '';
}

/**
 * 从 endpoint URL 提取 base URL
 * 例如: https://api.openai.com/v1/chat/completions -> https://api.openai.com/v1
 */
function extractBaseUrl(endpoint: string): string {
  try {
    const url = new URL(endpoint);
    // 移除路径中的 /chat/completions 部分
    const pathParts = url.pathname.split('/').filter(Boolean);
    // 保留到 /v1 或类似的版本路径
    const basePathIndex = pathParts.findIndex(part => part.match(/^v\d+$/));
    if (basePathIndex !== -1) {
      url.pathname = '/' + pathParts.slice(0, basePathIndex + 1).join('/');
    } else {
      // 如果没有版本路径，使用第一个路径段
      url.pathname = pathParts.length > 0 ? '/' + pathParts[0] : '';
    }
    return url.toString().replace(/\/$/, ''); // 移除末尾斜杠
  } catch {
    // 如果解析失败，返回原始 endpoint
    return endpoint;
  }
}

/**
 * 获取可用的模型列表
 * @param endpoint - API endpoint URL (会自动提取 base URL)
 * @param apiKey - API 密钥
 * @returns 模型列表
 */
export async function fetchAvailableModels(
  endpoint: string,
  apiKey: string
): Promise<ModelInfo[]> {
  const baseUrl = extractBaseUrl(endpoint);
  const modelsUrl = `${baseUrl}/models`;

  const response = await fetch(modelsUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`获取模型列表失败: ${response.status} - ${error}`);
  }

  const data = await response.json() as ModelsListResponse;
  return data.data || [];
}
