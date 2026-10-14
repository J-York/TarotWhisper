import { NextRequest } from 'next/server';
import { DrawnCard, Spread, ApiConfig } from '@/lib/tarot/types';
import {
  buildInterpretationPrompt,
  buildFollowUpDecidePrompt,
  buildFollowUpDirectPrompt,
  buildFollowUpWithExtrasPrompt,
  buildDailyInterpretationPrompt,
} from '@/lib/api/prompts';

// Vercel / 兼容平台：允许长时间流式响应（思考模型 + 长解读可达数分钟）
// Hobby 最高 60s，Pro 最高 300s；超出套餐上限时平台会自动 clamp
export const maxDuration = 300;
export const runtime = 'nodejs';

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

/** 上游 LLM 首字节连接超时（毫秒）——仅覆盖建连 + 首包，不限制整段流时长 */
const UPSTREAM_TIMEOUT_MS = 180_000;

/** LLM 输出的最大 token 数 */
const MAX_OUTPUT_TOKENS = 65_536;

/**
 * 上游因 max_tokens 超出模型上限而拒绝时的错误特征（如 gpt-4o-mini 上限 16384）。
 * 命中后去掉 max_tokens 重试一次，交由服务商使用模型自身的默认上限。
 */
const TOKEN_LIMIT_ERROR_PATTERN =
  /max_tokens|max_completion_tokens|max_output_tokens|maximum.{0,40}tokens|context.?length/i;

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

/**
 * source 区分错误出处，供前端决定展示方式：
 * - route：本路由自身的判断（未配置 Key、限流、校验失败等），error 即面向用户的中文文案
 * - upstream：LLM 服务商返回的错误，upstreamMessage 为服务商原话（已脱敏）
 */
function jsonError(
  message: string,
  status: number,
  extra: { source: 'route' } | { source: 'upstream'; upstreamMessage?: string } = { source: 'route' },
): Response {
  return new Response(
    JSON.stringify({ error: message, ...extra }),
    { status, headers: { 'Content-Type': 'application/json' } },
  );
}

/** 从上游错误响应体中提取服务商给出的原因 */
function extractUpstreamMessage(text: string): string | undefined {
  try {
    const parsed: unknown = JSON.parse(text);
    if (parsed && typeof parsed === 'object') {
      const record = parsed as Record<string, unknown>;
      const err = record.error;
      if (typeof err === 'string' && err) return err;
      if (err && typeof err === 'object') {
        const msg = (err as Record<string, unknown>).message;
        if (typeof msg === 'string' && msg) return msg;
      }
      if (typeof record.message === 'string' && record.message) return record.message;
    }
  } catch {
    // 非 JSON 响应体（如网关 HTML 错误页）
  }
  const plain = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return plain ? plain.slice(0, 200) : undefined;
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

  // 4. 决定使用用户配置还是后备配置
  //    Agent 与常规模式一致：无用户 key 时若有后备配置则走后备，否则下方返回 401
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

  const callUpstream = (maxTokens?: number): Promise<globalThis.Response> =>
    fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${effectiveConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: effectiveConfig.model,
        messages: [{ role: 'user', content: prompt }],
        ...(maxTokens !== undefined && { max_tokens: maxTokens }),
        stream: true,
      }),
      signal: upstreamController.signal,
    });

  let response: globalThis.Response;
  // 400 时已读取的错误体（响应体只能读一次）
  let errorText = '';
  try {
    response = await callUpstream(MAX_OUTPUT_TOKENS);
    if (response.status === 400) {
      errorText = await response.text().catch(() => '');
      if (TOKEN_LIMIT_ERROR_PATTERN.test(errorText)) {
        response = await callUpstream();
        errorText = '';
      }
    }
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
    if (!errorText) errorText = await response.text().catch(() => '');
    const sanitized = sanitizeError(errorText, effectiveConfig.apiKey);
    const upstreamMessage = extractUpstreamMessage(sanitized);

    // 透传有意义的状态码给前端
    const clientStatus = mapUpstreamStatus(response.status);
    return jsonError(
      `API 请求失败 (${response.status}): ${sanitized}`,
      clientStatus,
      { source: 'upstream', upstreamMessage },
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
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      // 禁止 nginx / 网关缓冲 SSE（长思考时尤为关键）
      'X-Accel-Buffering': 'no',
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

// ─── 带超时保护 + 心跳的流透传 ─────────────────────────

/** 上游两次有效字节间最大间隔（深度思考模型可能长时间不产出 token） */
const STREAM_CHUNK_TIMEOUT_MS = 180_000;
/** 向客户端发送 SSE 注释心跳的间隔，防止代理/客户端因思考静默误判断线 */
const STREAM_HEARTBEAT_MS = 15_000;

function createGuardedStream(
  upstream: ReadableStream<Uint8Array>,
  controller: AbortController,
): ReadableStream<Uint8Array> {
  const reader = upstream.getReader();
  const encoder = new TextEncoder();
  const heartbeatBytes = encoder.encode(': keepalive\n\n');
  const timeoutBytes = encoder.encode(
    'data: {"error":{"message":"流传输超时，连接已中断"}}\n\ndata: [DONE]\n\n',
  );
  const interruptedBytes = encoder.encode(
    'data: {"error":{"message":"上游连接中断"}}\n\n',
  );

  // 供 cancel() 与 start() 共享的清理句柄
  let stopTimers: (() => void) | null = null;
  /** 停止向下游写入（cancel / 超时 / 结束时置位） */
  let stopped = false;

  return new ReadableStream({
    async start(ctrl) {
      let lastUpstreamAt = Date.now();
      let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
      let idleTimer: ReturnType<typeof setInterval> | null = null;
      let finished = false;

      const cleanupTimers = (): void => {
        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }
        if (idleTimer) {
          clearInterval(idleTimer);
          idleTimer = null;
        }
      };
      stopTimers = cleanupTimers;

      const safeClose = (): void => {
        if (finished) return;
        finished = true;
        stopped = true;
        cleanupTimers();
        try { ctrl.close(); } catch { /* already closed */ }
        try { reader.releaseLock(); } catch { /* already released / still reading */ }
      };

      const safeEnqueue = (chunk: Uint8Array): boolean => {
        if (stopped || finished) return false;
        try {
          ctrl.enqueue(chunk);
          return true;
        } catch {
          safeClose();
          return false;
        }
      };

      // 心跳：思考阶段上游可能数十秒不发字节，仍要保持下行连接活跃
      heartbeatTimer = setInterval(() => {
        safeEnqueue(heartbeatBytes);
      }, STREAM_HEARTBEAT_MS);

      // 上游空闲监控（与心跳分离：心跳不重置上游活跃时间）
      // 超时后 cancel reader，让下方 while 自然退出，避免在 read 进行中 releaseLock
      idleTimer = setInterval(() => {
        if (Date.now() - lastUpstreamAt < STREAM_CHUNK_TIMEOUT_MS) return;
        cleanupTimers();
        safeEnqueue(timeoutBytes);
        stopped = true;
        controller.abort();
        void reader.cancel().catch(() => { /* ignore */ });
      }, 1_000);

      try {
        while (!stopped) {
          const { done, value } = await reader.read();
          if (done) break;
          lastUpstreamAt = Date.now();
          if (!safeEnqueue(value)) break;
        }
      } catch {
        // 上游读取失败：告知客户端流未正常结束，避免残缺解读被当作完整结果
        // （cancel / 空闲超时路径已置 stopped，safeEnqueue 不会重复写入）
        safeEnqueue(interruptedBytes);
      } finally {
        safeClose();
      }
    },
    cancel() {
      stopped = true;
      stopTimers?.();
      controller.abort();
      void reader.cancel().catch(() => { /* ignore */ });
    },
  });
}
