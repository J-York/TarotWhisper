/**
 * LLM API 工具 — 模型列表查询等
 *
 * 注意：流式调用已迁移至 stream-client.ts
 * 此文件仅保留 fetchAvailableModels（ApiSettings 组件使用）
 */

export interface ModelInfo {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

interface ModelsListResponse {
  object: string;
  data: ModelInfo[];
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
