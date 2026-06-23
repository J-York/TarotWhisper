import { NextRequest } from 'next/server';
import { DrawnCard, Spread, ApiConfig } from '@/lib/tarot/types';
import {
  buildInterpretationPrompt,
  buildFollowUpDecidePrompt,
  buildFollowUpDirectPrompt,
  buildFollowUpWithExtrasPrompt,
  buildDailyInterpretationPrompt,
} from '@/lib/api/prompts';

// ─── 类型定义 ────────────────────────────────────────────────

type FollowUpMode = 'decide' | 'direct' | 'with-extras';

interface DailyPayload {
  cardName: string;
  cardNameCn: string;
  isReversed: boolean;
  keywords: string[];
  meaning: string;
  dateStr: string;
}

interface FollowUpPayload {
  mode: FollowUpMode;
  previousInterpretation: string;
  followUpQuestion: string;
  additionalCards?: DrawnCard[];
}

interface AgentPayload {
  prompt: string;
}

interface InterpretRequest {
  question: string;
  spread: Spread;
  drawnCards: DrawnCard[];
  apiConfig: ApiConfig;
  followUp?: FollowUpPayload;
  daily?: DailyPayload;
  /** Agent 决策模式：直接携带 prompt，路由透传给 LLM。
   *  供 Agent 的非解读决策步（如选牌阵）复用本路由的全部基建
   *  （认证 / 后备 / 限流 / 流式 / 超时），不参与 buildPrompt 分发。 */
  agent?: AgentPayload;
}

// ─── 常量配置 ────────────────────────────────────────────────

/** 上游 LLM 请求的超时时间（毫秒） */
const UPSTREAM_TIMEOUT_MS = 120_000;

/** LLM 输出的最大 token 数 */
const MAX_OUTPUT_TOKENS = 8192;

/** 从环境变量获取后备配置 */
const FALLBACK_CONFIG = {
  endpoint: process.env.FALLBACK_LLM_ENDPOINT || '',
  apiKey: process.env.FALLBACK_LLM_KEY || '',
  model: process.env.FALLBACK_LLM_MODEL || 'gpt-4o-mini',
  enabled: process.env.ENABLE_FALLBACK_LLM === 'true',
};

// ─── 速率限制 ────────────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_PER_HOUR = parseInt(process.env.RATE_LIMIT_PER_HOUR || '10', 10);

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 3600000 });
    return true;
  }

  if (record.count >= RATE_LIMIT_PER_HOUR) {
    return false;
  }

  record.count++;
  return true;
}

// ─── 请求体校验 ──────────────────────────────────────────────

interface ValidationResult {
  valid: boolean;
  error?: string;
}

function validateRequest(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: '请求体不能为空' };
  }

  const req = body as Record<string, unknown>;

  // apiConfig 是必须的
  if (!req.apiConfig || typeof req.apiConfig !== 'object') {
    return { valid: false, error: '缺少 apiConfig 配置' };
  }

  const apiConfig = req.apiConfig as Record<string, unknown>;
  if (typeof apiConfig.endpoint !== 'string' || !apiConfig.endpoint.trim()) {
    return { valid: false, error: 'apiConfig.endpoint 不能为空' };
  }
  if (typeof apiConfig.model !== 'string' || !apiConfig.model.trim()) {
    return { valid: false, error: 'apiConfig.model 不能为空' };
  }

  // daily 模式只需 daily payload
  if (req.daily) {
    const daily = req.daily as Record<string, unknown>;
    if (typeof daily.cardName !== 'string' || typeof daily.cardNameCn !== 'string') {
      return { valid: false, error: 'daily payload 格式不正确' };
    }
    return { valid: true };
  }

  // agent 模式只需 agent.prompt（直接 prompt 透传）
  if (req.agent) {
    const agent = req.agent as Record<string, unknown>;
    if (typeof agent.prompt !== 'string' || !agent.prompt.trim()) {
      return { valid: false, error: 'agent.prompt 不能为空' };
    }
    return { valid: true };
  }

  // 常规模式需要 question, spread, drawnCards
  if (typeof req.question !== 'string') {
    return { valid: false, error: '缺少 question 字段' };
  }
  if (!req.spread || typeof req.spread !== 'object') {
    return { valid: false, error: '缺少 spread 配置' };
  }
  if (!Array.isArray(req.drawnCards)) {
    return { valid: false, error: '缺少 drawnCards 数组' };
  }

  return { valid: true };
}

// ─── Prompt 构建 ─────────────────────────────────────────────

function buildPrompt(req: InterpretRequest): string {
  const { question, spread, drawnCards, followUp, daily, agent } = req;

  // agent 模式：直接透传 prompt，不参与牌阵解读分发
  if (agent) {
    return agent.prompt;
  }

  if (daily) {
    return buildDailyInterpretationPrompt(
      daily.cardName,
      daily.cardNameCn,
      daily.isReversed,
      daily.keywords,
      daily.meaning,
      daily.dateStr,
    );
  }

  if (!followUp) {
    return buildInterpretationPrompt(question, spread, drawnCards);
  }

  switch (followUp.mode) {
    case 'decide':
      return buildFollowUpDecidePrompt(
        question,
        spread,
        drawnCards,
        followUp.previousInterpretation,
        followUp.followUpQuestion,
      );
    case 'direct':
      return buildFollowUpDirectPrompt(
        question,
        spread,
        drawnCards,
        followUp.previousInterpretation,
        followUp.followUpQuestion,
      );
    case 'with-extras':
      return buildFollowUpWithExtrasPrompt(
        question,
        spread,
        drawnCards,
        followUp.previousInterpretation,
        followUp.followUpQuestion,
        followUp.additionalCards ?? [],
      );
  }
}

// ─── 错误响应工厂 ────────────────────────────────────────────

function jsonError(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { 'Content-Type': 'application/json' } },
  );
}

// ─── 敏感信息清理 ────────────────────────────────────────────

function sanitizeError(text: string, apiKey: string): string {
  return text
    .replace(/Bearer\s+[^\s"]+/gi, 'Bearer [REDACTED]')
    .replace(/sk-[a-zA-Z0-9]+/gi, '[REDACTED]')
    .replace(new RegExp(apiKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '[REDACTED]')
    .slice(0, 800);
}

// ─── 主处理函数 ──────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<Response> {
  // 1. 解析请求体
  let body: InterpretRequest;
  try {
    body = await request.json() as InterpretRequest;
  } catch {
    return jsonError('请求体 JSON 解析失败', 400);
  }

  // 2. 校验请求体
  const validation = validateRequest(body);
  if (!validation.valid) {
    return jsonError(validation.error ?? '请求格式错误', 400);
  }

  const { apiConfig } = body;

  // 3. 安全检查：拒绝直接使用内置配置
  if (
    FALLBACK_CONFIG.enabled &&
    apiConfig.apiKey === FALLBACK_CONFIG.apiKey &&
    apiConfig.endpoint === FALLBACK_CONFIG.endpoint
  ) {
    return jsonError('无效的配置', 403);
  }

  if (body.agent && !apiConfig.apiKey) {
    return jsonError('Agent 模式需要配置 API Key', 401);
  }

  // 4. 决定使用用户配置还是后备配置
  let effectiveConfig = apiConfig;
  let usingFallback = false;

  if (!apiConfig.apiKey && FALLBACK_CONFIG.enabled && FALLBACK_CONFIG.apiKey) {
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';

    if (!checkRateLimit(ip)) {
      return jsonError(
        `请求过于频繁，每小时最多 ${RATE_LIMIT_PER_HOUR} 次请求。建议配置自己的 API Key 以解除限制。`,
        429,
      );
    }

    effectiveConfig = FALLBACK_CONFIG;
    usingFallback = true;
  } else if (!apiConfig.apiKey) {
    return jsonError('请先配置 API Key', 401);
  }

  // 5. 构建 Prompt
  const prompt = buildPrompt(body);

  // 6. 构建上游请求 URL
  const endpoint = effectiveConfig.endpoint.trim();
  const hasChatCompletions = endpoint.includes('/chat/completions');
  const baseEndpoint = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
  const requestUrl = hasChatCompletions ? baseEndpoint : `${baseEndpoint}/chat/completions`;

  // 7. 发起上游请求（带超时）
  const upstreamController = new AbortController();
  const timeoutId = setTimeout(() => upstreamController.abort(), UPSTREAM_TIMEOUT_MS);

  let response: globalThis.Response;
  try {
    response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${effectiveConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: effectiveConfig.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: MAX_OUTPUT_TOKENS,
        stream: true,
      }),
      signal: upstreamController.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof DOMException && err.name === 'AbortError') {
      return jsonError('上游 LLM 连接超时，请稍后重试', 504);
    }

    // 网络错误
    const msg = err instanceof Error ? err.message : '未知错误';
    return jsonError(`无法连接上游服务: ${msg}`, 502);
  }

  clearTimeout(timeoutId);

  // 8. 处理上游 HTTP 错误
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    const sanitized = sanitizeError(errorText, effectiveConfig.apiKey);

    // 透传有意义的状态码给前端
    const clientStatus = mapUpstreamStatus(response.status);
    return jsonError(
      `API 请求失败 (${response.status}): ${sanitized}`,
      clientStatus,
    );
  }

  // 9. 检查响应体
  if (!response.body) {
    return jsonError('上游未返回响应流', 502);
  }

  // 10. 透传 SSE 流，并加入流级超时保护
  const transformedStream = createGuardedStream(response.body, upstreamController);

  return new Response(transformedStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...(usingFallback && { 'X-Using-Fallback': 'true' }),
    },
  });
}

// ─── 将上游状态码映射为对前端有意义的状态码 ──────────────────

function mapUpstreamStatus(upstreamStatus: number): number {
  switch (true) {
    case upstreamStatus === 401 || upstreamStatus === 403:
      return upstreamStatus; // 透传认证错误
    case upstreamStatus === 404:
      return 404; // 模型不存在
    case upstreamStatus === 429:
      return 429; // 速率限制
    case upstreamStatus >= 500:
      return 502; // 上游服务器错误 → 网关错误
    default:
      return upstreamStatus;
  }
}

// ─── 带超时保护的流透传 ─────────────────────────────────────

const STREAM_CHUNK_TIMEOUT_MS = 60_000; // 单 chunk 间最大间隔（思考模型可能较长时间不产出内容）

function createGuardedStream(
  upstream: ReadableStream<Uint8Array>,
  controller: AbortController,
): ReadableStream<Uint8Array> {
  const reader = upstream.getReader();
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  const resetTimer = (ctrl: ReadableStreamDefaultController<Uint8Array>): void => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      // 流空闲超时 → 发送错误事件并关闭
      const errorEvent = new TextEncoder().encode(
        'data: {"error":{"message":"流传输超时，连接已中断"}}\n\ndata: [DONE]\n\n'
      );
      try {
        ctrl.enqueue(errorEvent);
      } catch {
        // controller 可能已关闭
      }
      try { ctrl.close(); } catch { /* 可能已被 pull 关闭 */ }
      controller.abort();
      try { reader.releaseLock(); } catch { /* 可能已释放 */ }
    }, STREAM_CHUNK_TIMEOUT_MS);
  };

  return new ReadableStream({
    start(ctrl) {
      resetTimer(ctrl);
    },
    async pull(ctrl) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          if (idleTimer) clearTimeout(idleTimer);
          try { ctrl.close(); } catch { /* 可能已被超时回调关闭 */ }
          return;
        }
        resetTimer(ctrl);
        ctrl.enqueue(value);
      } catch {
        if (idleTimer) clearTimeout(idleTimer);
        try { ctrl.close(); } catch { /* 可能已被超时回调关闭 */ }
      }
    },
    cancel() {
      if (idleTimer) clearTimeout(idleTimer);
      reader.releaseLock();
      controller.abort();
    },
  });
}
