/**
 * 统一 SSE 流客户端 - 面向前端的 /api/interpret 调用封装
 *
 * 特性:
 * - AbortController 支持(用户取消 + 组件卸载清理)
 * - 可配置的连接超时 & 流空闲超时
 * - 自动重试(仅对可重试错误,最多 N 次,指数退退)
 * - 结构化错误(集成 errors.ts 分类)
 * - 与 sseUtils.ts 解耦:仅负责传输层,解析由调用方传入
 */

import { classifyHttpError, classifyError, LLMError } from './errors';
import type { LLMErrorInfo } from './errors';
import { parseSseChunk, type ParsedSseChunk } from '@/lib/tarot/sseUtils';

// ─── 配置 ───────────────────────────────────────────────────────

export interface StreamClientConfig {
  /** 初始 fetch 的超时(毫秒)。默认 30s */
  connectTimeoutMs?: number;
  /** 流中两次数据之间的最大空闲时间(毫秒)。默认 15s */
  streamIdleTimeoutMs?: number;
  /** 最大自动重试次数(仅对 retryable 错误)。默认 2 */
  maxRetries?: number;
  /** 重试间隔的基数(毫秒),实际间隔 = base * 2^attempt。默认 1000 */
  retryBaseMs?: number;
  /** 外部传入的 AbortSignal,用于取消 */
  signal?: AbortSignal;
}

const DEFAULT_CONFIG: Required<Omit<StreamClientConfig, 'signal'>> = {
  connectTimeoutMs: 30_000,
  streamIdleTimeoutMs: 30_000,
  maxRetries: 2,
  retryBaseMs: 1000,
};

// ─── 重试状态 ─────────────────────────────────────────────────

/** 一次自动重试的瞬时状态 · 供 UI 显示「正在重试 N/M」 */
export interface RetryState {
  /** 当前第几次重试（从 1 开始） */
  attempt: number;
  /** 最大重试次数 */
  max: number;
}

// ─── 回调接口 ─────────────────────────────────────────────────

export interface StreamCallbacks {
  /** 收到正文 content chunk */
  onContent?: (chunk: string) => void;
  /** 收到 thinking/reasoning chunk */
  onThinking?: (chunk: string) => void;
  /** 收到 SSE 级别的 error 字段 */
  onStreamError?: (msg: string) => void;
  /** 重试时通知（可用于 UI 显示“正在重试…”） */
  onRetry?: (attempt: number, maxRetries: number) => void;
  /** 模型因 token 上限截断时通知 */
  onTruncated?: () => void;
}

// ─── 结果 ─────────────────────────────────────────────────────

export interface StreamResult {
  /** 累积的全部文本（content + thinking 交织，含 <think> 标签） */
  fullText: string;
  /** 是否使用了服务端后备配置 */
  usingFallback: boolean;
  /** 是否收到过 SSE error 字段 */
  receivedError: boolean;
  /** 是否因 token 上限被截断 */
  truncated: boolean;
}

// ─── 主函数 ───────────────────────────────────────────────────

/**
 * 向 /api/interpret 发起流式请求,消费 SSE 并通过回调推送。
 * 支持超时、重试、取消。
 *
 * @throws {LLMError} 当所有重试耗尽仍然失败
 */
export async function streamInterpret(
  body: unknown,
  callbacks: StreamCallbacks,
  config?: StreamClientConfig,
): Promise<StreamResult> {
  // 逐字段合并：显式传入的 undefined 不应覆盖默认值
  // （调用方常解构出 { maxRetries } 再透传，缺省时即为 undefined，
  //  若直接展开会把默认的 2 抹成 undefined，导致 `attempt <= undefined` 恒为 false，
  //  重试循环一次都不跑、直接抛 UNKNOWN）
  const cfg: Required<Omit<StreamClientConfig, 'signal'>> = {
    connectTimeoutMs: config?.connectTimeoutMs ?? DEFAULT_CONFIG.connectTimeoutMs,
    streamIdleTimeoutMs: config?.streamIdleTimeoutMs ?? DEFAULT_CONFIG.streamIdleTimeoutMs,
    maxRetries: config?.maxRetries ?? DEFAULT_CONFIG.maxRetries,
    retryBaseMs: config?.retryBaseMs ?? DEFAULT_CONFIG.retryBaseMs,
  };
  const externalSignal = config?.signal;

  let lastError: LLMErrorInfo | null = null;

  for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
    // 如果外部已取消,立即退出
    if (externalSignal?.aborted) {
      throw new LLMError({
        code: 'ABORTED',
        message: '已取消请求',
        retryable: false,
      });
    }

    // 非首次尝试时等待退避
    if (attempt > 0) {
      callbacks.onRetry?.(attempt, cfg.maxRetries);
      const delay = cfg.retryBaseMs * Math.pow(2, attempt - 1);
      await sleep(delay, externalSignal);
    }

    try {
      const result = await doStreamRequest(body, callbacks, cfg, externalSignal);
      return result;
    } catch (err) {
      const info = err instanceof LLMError ? err.info : classifyError(err);

      // 不可重试 or 已用完重试次数 → 直接抛出
      if (!info.retryable || attempt >= cfg.maxRetries) {
        throw err instanceof LLMError ? err : new LLMError(info);
      }

      lastError = info;
      // 继续下一次重试
    }
  }

  // 理论上不会走到这里,但 TS 要求
  throw new LLMError(lastError ?? {
    code: 'UNKNOWN',
    message: '发生未知错误',
    retryable: false,
  });
}

// ─── 内部:单次流请求 ─────────────────────────────────────────

async function doStreamRequest(
  body: unknown,
  callbacks: StreamCallbacks,
  cfg: Required<Omit<StreamClientConfig, 'signal'>>,
  externalSignal?: AbortSignal,
): Promise<StreamResult> {
  // 组合 AbortController:连接超时 + 外部取消
  const controller = new AbortController();
  const { signal } = controller;

  // 联动外部信号
  const onExternalAbort = (): void => controller.abort();
  externalSignal?.addEventListener('abort', onExternalAbort);

  // 连接超时定时器
  const connectTimer = setTimeout(() => controller.abort(), cfg.connectTimeoutMs);

  let response: Response;

  try {
    response = await fetch('/api/interpret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    clearTimeout(connectTimer);
    externalSignal?.removeEventListener('abort', onExternalAbort);

    // AbortError 要区分是超时还是用户取消
    if (err instanceof DOMException && err.name === 'AbortError') {
      if (externalSignal?.aborted) {
        throw new LLMError({ code: 'ABORTED', message: '已取消请求', retryable: false });
      }
      throw new LLMError({ code: 'TIMEOUT', message: '连接超时,请检查网络或稍后重试', retryable: true });
    }
    throw err; // TypeError (network) 等,由上层 classifyError 处理
  }

  clearTimeout(connectTimer);

  // HTTP 错误
  if (!response.ok) {
    externalSignal?.removeEventListener('abort', onExternalAbort);
    const errorBody = await response.text().catch(() => '');
    const info = classifyHttpError(response.status, errorBody);
    throw new LLMError(info);
  }

  const usingFallback = response.headers.get('X-Using-Fallback') === 'true';
  const reader = response.body?.getReader();

  if (!reader) {
    externalSignal?.removeEventListener('abort', onExternalAbort);
    throw new LLMError({
      code: 'STREAM_INTERRUPTED',
      message: '无法读取响应流',
      retryable: true,
    });
  }

  // ─── 流消费 ───
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let streamComplete = false;
  let receivedError = false;
  let truncated = false;
  let thinkingBlockOpen = false;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  const append = (chunk: string): void => {
    if (!chunk) return;
    fullText += chunk;
  };

  const openThinking = (): void => {
    if (thinkingBlockOpen) return;
    const prefix = fullText ? '\n\n<think>\n' : '<think>\n';
    append(prefix);
    callbacks.onThinking?.(prefix);
    thinkingBlockOpen = true;
  };

  const closeThinking = (): void => {
    if (!thinkingBlockOpen) return;
    const suffix = '\n</think>\n\n';
    append(suffix);
    callbacks.onThinking?.(suffix);
    thinkingBlockOpen = false;
  };

  const processChunk = (parsed: ParsedSseChunk): void => {
    if (parsed.isDone) {
      streamComplete = true;
      closeThinking();
      return;
    }
    if (parsed.thinking) {
      openThinking();
      append(parsed.thinking);
      callbacks.onThinking?.(parsed.thinking);
    }
    if (parsed.content) {
      closeThinking();
      append(parsed.content);
      callbacks.onContent?.(parsed.content);
    }
    if (parsed.error) {
      receivedError = true;
      callbacks.onStreamError?.(parsed.error);
    }
    if (parsed.truncated) {
      truncated = true;
      callbacks.onTruncated?.();
    }
  };

  const resetIdleTimer = (): void => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      // 流空闲超时 → 中止
      controller.abort();
    }, cfg.streamIdleTimeoutMs);
  };

  try {
    resetIdleTimer();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      resetIdleTimer();
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        processChunk(parseSseChunk(data));
        if (streamComplete) break;
      }

      if (streamComplete) break;
    }

    // 处理缓冲区残余
    if (!streamComplete && buffer) {
      const trailingLines = buffer.split('\n');
      for (const rawLine of trailingLines) {
        const line = rawLine.trim();
        if (!line.startsWith('data: ')) continue;
        processChunk(parseSseChunk(line.slice(6)));
        if (streamComplete) break;
      }
    }

    closeThinking();
  } catch (err) {
    closeThinking();

    if (err instanceof DOMException && err.name === 'AbortError') {
      if (externalSignal?.aborted) {
        throw new LLMError({ code: 'ABORTED', message: '已取消请求', retryable: false });
      }
      // 空闲超时导致的中止
      if (fullText) {
        // 已收到部分内容,当作流中断(不重试,返回已有内容)
        receivedError = true;
        callbacks.onStreamError?.('解读传输中断,已显示部分内容');
      } else {
        throw new LLMError({
          code: 'TIMEOUT',
          message: '响应超时,未收到任何内容',
          detail: `空闲超时 ${cfg.streamIdleTimeoutMs}ms`,
          retryable: true,
        });
      }
    } else {
      // 流读取出错但已有部分内容
      if (fullText) {
        receivedError = true;
        callbacks.onStreamError?.('解读传输中断');
      } else {
        throw err;
      }
    }
  } finally {
    if (idleTimer) clearTimeout(idleTimer);
    reader.releaseLock();
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }

  return { fullText, usingFallback, receivedError, truncated };
}

// ─── 工具 ────────────────────────────────────────────────────

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new LLMError({ code: 'ABORTED', message: '已取消请求', retryable: false }));
      return;
    }

    const timer = setTimeout(resolve, ms);
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(new LLMError({ code: 'ABORTED', message: '已取消请求', retryable: false }));
    };

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
