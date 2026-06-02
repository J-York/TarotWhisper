/**
 * LLM 调用错误分类 — 统一的错误类型与用户友好消息
 *
 * 目标：
 * 1. 区分「可重试」与「不可重试」错误
 * 2. 向用户展示有指导性的中文消息
 * 3. 保留原始错误信息用于 debug
 */

export type LLMErrorCode =
  | 'AUTH_FAILED'       // 401/403 — API Key 无效或无权限
  | 'RATE_LIMITED'      // 429    — 请求频率受限
  | 'MODEL_NOT_FOUND'   // 404    — 模型不存在
  | 'BAD_REQUEST'       // 400    — 请求体格式错误
  | 'SERVER_ERROR'      // 500+   — 上游服务异常
  | 'GATEWAY_ERROR'     // 502/503/504 — 网关超时或不可用
  | 'TIMEOUT'           // 请求或流超时
  | 'NETWORK_ERROR'     // DNS/连接失败
  | 'STREAM_INTERRUPTED'// 流中途断开
  | 'ABORTED'           // 用户主动取消
  | 'UNKNOWN';          // 兜底

export interface LLMErrorInfo {
  code: LLMErrorCode;
  message: string;       // 面向用户的中文消息
  detail?: string;       // 面向开发者的原始信息
  retryable: boolean;    // 是否值得自动重试
  httpStatus?: number;   // 原始 HTTP 状态码
}

/** 用户友好的错误消息映射 */
const USER_MESSAGES: Record<LLMErrorCode, string> = {
  AUTH_FAILED:        '认证失败，请检查 API Key 是否正确',
  RATE_LIMITED:       '请求过于频繁，请稍后再试',
  MODEL_NOT_FOUND:    '所选模型不存在，请在配置中更换模型',
  BAD_REQUEST:        '请求格式错误，请检查 API 配置',
  SERVER_ERROR:       '上游服务暂时异常，请稍后重试',
  GATEWAY_ERROR:      '网关超时或不可用，请稍后重试',
  TIMEOUT:            '请求超时，请检查网络或稍后重试',
  NETWORK_ERROR:      '网络连接失败，请检查网络设置',
  STREAM_INTERRUPTED: '解读传输中断，请重试',
  ABORTED:            '已取消请求',
  UNKNOWN:            '发生未知错误，请稍后重试',
};

/** 根据 HTTP 状态码分类错误 */
export function classifyHttpError(status: number, body?: string): LLMErrorInfo {
  let code: LLMErrorCode;
  let retryable: boolean;

  switch (true) {
    case status === 400:
      code = 'BAD_REQUEST';
      retryable = false;
      break;
    case status === 401 || status === 403:
      code = 'AUTH_FAILED';
      retryable = false;
      break;
    case status === 404:
      code = 'MODEL_NOT_FOUND';
      retryable = false;
      break;
    case status === 429:
      code = 'RATE_LIMITED';
      retryable = true;
      break;
    case status >= 500 && status < 502:
      code = 'SERVER_ERROR';
      retryable = true;
      break;
    case status >= 502 && status <= 504:
      code = 'GATEWAY_ERROR';
      retryable = true;
      break;
    default:
      code = 'UNKNOWN';
      retryable = status >= 500;
  }

  return {
    code,
    message: USER_MESSAGES[code],
    detail: body ? sanitizeErrorDetail(body) : undefined,
    retryable,
    httpStatus: status,
  };
}

/** 根据 JS 错误对象分类 */
export function classifyError(error: unknown): LLMErrorInfo {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return {
      code: 'ABORTED',
      message: USER_MESSAGES.ABORTED,
      retryable: false,
    };
  }

  if (error instanceof TypeError) {
    // fetch 在网络不可达时抛 TypeError
    return {
      code: 'NETWORK_ERROR',
      message: USER_MESSAGES.NETWORK_ERROR,
      detail: error.message,
      retryable: true,
    };
  }

  if (error instanceof LLMError) {
    return error.info;
  }

  const msg = error instanceof Error ? error.message : String(error);

  if (msg.includes('timeout') || msg.includes('Timeout') || msg.includes('超时')) {
    return {
      code: 'TIMEOUT',
      message: USER_MESSAGES.TIMEOUT,
      detail: msg,
      retryable: true,
    };
  }

  return {
    code: 'UNKNOWN',
    message: USER_MESSAGES.UNKNOWN,
    detail: msg,
    retryable: false,
  };
}

/** 自定义 LLM 错误类，携带结构化信息 */
export class LLMError extends Error {
  readonly info: LLMErrorInfo;

  constructor(info: LLMErrorInfo) {
    super(info.message);
    this.name = 'LLMError';
    this.info = info;
  }
}

/** 清理错误详情中的敏感信息 */
function sanitizeErrorDetail(raw: string): string {
  return raw
    .replace(/Bearer\s+[^\s"]+/gi, 'Bearer [REDACTED]')
    .replace(/sk-[a-zA-Z0-9]+/gi, '[REDACTED]')
    .slice(0, 500); // 截断过长内容
}
