/**
 * Agent 化 · 回合编排
 *
 * 一个完整的 Agent 回合 = 选牌阵(LLM决策) → 洗牌抽牌(纯函数) → 流式解读(复用现有 prompt)。
 * 追问回合 = decide(LLM) →（可选补牌）→ interpret(LLM)。
 * 通过事件回调驱动 UI 逐步渲染每个阶段，支持取消与错误中断。
 *
 * 复用资产：
 * - streamInterpret (流式传输 + 重试 + 超时)
 * - buildSpreadChoicePrompt / extractSpreadChoiceJson (牌阵决策)
 * - buildFollowUpDecidePrompt / extractDecisionJson (追问决策)
 * - drawCardsForSpread / drawSupplementaryCards (纯函数抽牌)
 * - buildInterpretationPrompt 等 (解读 prompt)
 */

import { ApiConfig, DrawnCard, Spread } from '@/lib/tarot/types';
import { getSpreadById } from '@/lib/tarot/spreads';
import { drawCardsForSpread, drawSupplementaryCards } from '@/lib/tarot/draw';
import {
  buildInterpretationPrompt,
  buildFollowUpDecidePrompt,
  buildFollowUpDirectPrompt,
  buildFollowUpWithExtrasPrompt,
} from '@/lib/api/prompts';
import { streamInterpret, StreamResult } from '@/lib/api/stream-client';
import { LLMError } from '@/lib/api/errors';
import { extractDecisionJson } from '@/lib/tarot/sseUtils';
import {
  buildSpreadChoicePrompt,
  extractSpreadChoiceJson,
  defaultSpreadChoice,
} from '@/lib/agent/spreadChoice';

// ─── 回合事件 ───────────────────────────────────────────────

/** 选定牌阵事件 */
export interface SpreadChosenEvent {
  spread: Spread;
  reason: string;
}

/** 抽牌完成事件 */
export interface CardsDrawnEvent {
  drawnCards: DrawnCard[];
}

/** Agent 回合的阶段性事件回调 */
export interface AgentTurnCallbacks {
  /** 牌阵已选定（含理由，用于 UI 说明 Agent 为何选此牌阵） */
  onSpreadChosen?: (event: SpreadChosenEvent) => void;
  /** 抽牌完成（牌面已确定，UI 可播放翻牌动画） */
  onCardsDrawn?: (event: CardsDrawnEvent) => void;
  /** 解读流式正文 chunk */
  onContent?: (chunk: string) => void;
  /** 解读思考过程 chunk（推理模型） */
  onThinking?: (chunk: string) => void;
  /** 流级别错误（已收到部分内容后中断） */
  onStreamError?: (msg: string) => void;
  /** 重试通知 */
  onRetry?: (attempt: number, maxRetries: number) => void;
}

// ─── 回合结果 ───────────────────────────────────────────────

export interface AgentTurnResult {
  spread: Spread;
  reason: string;
  drawnCards: DrawnCard[];
  interpretation: string;
  truncated: boolean;
  usingFallback: boolean;
}

export interface InterpretationRerunResult {
  interpretation: string;
  truncated: boolean;
}

// ─── 编排主函数 ─────────────────────────────────────────────

export interface RunAgentTurnParams {
  question: string;
  apiConfig: ApiConfig;
  signal: AbortSignal;
  callbacks: AgentTurnCallbacks;
}

/**
 * 执行一个完整的 Agent 回合。
 *
 * 流程：
 * 1. 选牌阵决策（LLM，短输出，maxRetries=1）
 *    - 失败/无法解析时用兜底牌阵，不中断回合
 * 2. 洗牌抽牌（纯函数，即时）
 * 3. 流式解读（LLM，复用 buildInterpretationPrompt）
 *
 * @throws {LLMError} 解读阶段被取消（ABORTED）或发生不可恢复错误时抛出
 */
export async function runAgentTurn(
  params: RunAgentTurnParams,
): Promise<AgentTurnResult> {
  const { question, apiConfig, signal, callbacks } = params;

  // ── 阶段 1：选牌阵决策 ──
  const choice = await chooseSpread(question, apiConfig, signal);
  const spread = getSpreadById(choice.spreadId)!;
  callbacks.onSpreadChosen?.({ spread, reason: choice.reason });

  if (signal.aborted) {
    throw new LLMError({ code: 'ABORTED', message: '已取消请求', retryable: false });
  }

  // ── 阶段 2：洗牌抽牌（纯函数）──
  const drawnCards = drawCardsForSpread(spread);
  callbacks.onCardsDrawn?.({ drawnCards });

  if (signal.aborted) {
    throw new LLMError({ code: 'ABORTED', message: '已取消请求', retryable: false });
  }

  // ── 阶段 3：流式解读 ──
  const prompt = buildInterpretationPrompt(question, spread, drawnCards);

  const result = await streamRaw(prompt, apiConfig, signal, {
    onContent: callbacks.onContent,
    onThinking: callbacks.onThinking,
    onStreamError: callbacks.onStreamError,
    onRetry: callbacks.onRetry,
  });

  return {
    spread,
    reason: choice.reason,
    drawnCards,
    interpretation: result.fullText,
    truncated: result.truncated,
    usingFallback: result.usingFallback,
  };
}

export interface RerunAgentInterpretationParams {
  question: string;
  spread: Spread;
  drawnCards: DrawnCard[];
  previousInterpretation?: string;
  apiConfig: ApiConfig;
  signal: AbortSignal;
  callbacks: AgentTurnCallbacks;
}

/** 复用既定牌阵与牌面，只重新生成首轮解读。 */
export async function rerunAgentInterpretation(
  params: RerunAgentInterpretationParams,
): Promise<InterpretationRerunResult> {
  const {
    question,
    spread,
    drawnCards,
    previousInterpretation,
    apiConfig,
    signal,
    callbacks,
  } = params;
  const prompt = appendRegenerationInstruction(
    buildInterpretationPrompt(question, spread, drawnCards),
    previousInterpretation,
  );

  const result = await streamRaw(prompt, apiConfig, signal, {
    onContent: callbacks.onContent,
    onThinking: callbacks.onThinking,
    onStreamError: callbacks.onStreamError,
    onRetry: callbacks.onRetry,
  });

  return {
    interpretation: result.fullText,
    truncated: result.truncated,
  };
}

// ─── 选牌阵决策（内部） ─────────────────────────────────────

async function chooseSpread(
  question: string,
  apiConfig: ApiConfig,
  signal: AbortSignal,
): Promise<{ spreadId: string; reason: string }> {
  const prompt = buildSpreadChoicePrompt(question);

  try {
    const result = await streamRaw(prompt, apiConfig, signal, { maxRetries: 1 });
    const parsed = extractSpreadChoiceJson(result.fullText);
    if (parsed) return parsed;
    return defaultSpreadChoice(question);
  } catch (err) {
    // 被取消时不兜底，向上抛出
    if (err instanceof LLMError && err.info.code === 'ABORTED') throw err;
    // 其它错误（网络/超时等）→ 兜底牌阵，不中断回合
    return defaultSpreadChoice(question);
  }
}

// ─── 追问回合编排 ───────────────────────────────────────────

export interface FollowUpTurnCallbacks {
  /** decide 步完成，告知是直接回答还是补牌，及理由 */
  onDecided?: (decision: 'direct' | 'draw', drawCount: number, reason: string) => void;
  /** 若需补牌，抽出的补充牌 */
  onSupplementaryCards?: (additionalCards: DrawnCard[]) => void;
  /** 解读流式正文 chunk */
  onContent?: (chunk: string) => void;
  /** 思考过程 chunk */
  onThinking?: (chunk: string) => void;
  /** 流级错误 */
  onStreamError?: (msg: string) => void;
  onRetry?: (attempt: number, maxRetries: number) => void;
}

export interface FollowUpTurnResult {
  decision: 'direct' | 'draw';
  drawCount: number;
  reason: string;
  additionalCards: DrawnCard[];
  interpretation: string;
  truncated: boolean;
}

export interface RunFollowUpTurnParams {
  originalQuestion: string;
  spread: Spread;
  drawnCards: DrawnCard[];
  previousInterpretation: string;
  followUpQuestion: string;
  apiConfig: ApiConfig;
  signal: AbortSignal;
  callbacks: FollowUpTurnCallbacks;
}

/** 执行一个追问回合：decide →（可选补牌）→ interpret */
export async function runFollowUpTurn(
  params: RunFollowUpTurnParams,
): Promise<FollowUpTurnResult> {
  const {
    originalQuestion,
    spread,
    drawnCards,
    previousInterpretation,
    followUpQuestion,
    apiConfig,
    signal,
    callbacks,
  } = params;

  // ── decide 步 ──
  const decidePrompt = buildFollowUpDecidePrompt(
    originalQuestion,
    spread,
    drawnCards,
    previousInterpretation,
    followUpQuestion,
  );

  const decideResult = await streamRaw(decidePrompt, apiConfig, signal, { maxRetries: 1 });
  const decision = extractDecisionJson(decideResult.fullText);

  // 解析失败时默认直接回答，不中断
  const decisionMode: 'direct' | 'draw' = decision?.decision ?? 'direct';
  const drawCount = decision?.drawCount ?? 0;
  const reason = decision?.reason ?? '';

  callbacks.onDecided?.(decisionMode, drawCount, reason);

  if (signal.aborted) {
    throw new LLMError({ code: 'ABORTED', message: '已取消请求', retryable: false });
  }

  // ── 补牌（若需）──
  let additionalCards: DrawnCard[] = [];
  if (decisionMode === 'draw' && drawCount > 0) {
    additionalCards = drawSupplementaryCards(drawCount);
    callbacks.onSupplementaryCards?.(additionalCards);
  }

  if (signal.aborted) {
    throw new LLMError({ code: 'ABORTED', message: '已取消请求', retryable: false });
  }

  // ── interpret 步 ──
  const interpretPrompt =
    decisionMode === 'draw'
      ? buildFollowUpWithExtrasPrompt(
          originalQuestion,
          spread,
          drawnCards,
          previousInterpretation,
          followUpQuestion,
          additionalCards,
        )
      : buildFollowUpDirectPrompt(
          originalQuestion,
          spread,
          drawnCards,
          previousInterpretation,
          followUpQuestion,
        );

  const result = await streamRaw(interpretPrompt, apiConfig, signal, {
    onContent: callbacks.onContent,
    onThinking: callbacks.onThinking,
    onStreamError: callbacks.onStreamError,
    onRetry: callbacks.onRetry,
  });

  return {
    decision: decisionMode,
    drawCount,
    reason,
    additionalCards,
    interpretation: result.fullText,
    truncated: result.truncated,
  };
}

export interface RerunFollowUpInterpretationParams {
  originalQuestion: string;
  spread: Spread;
  drawnCards: DrawnCard[];
  previousInterpretation: string;
  followUpQuestion: string;
  decision: 'direct' | 'draw';
  additionalCards: DrawnCard[];
  previousFollowUpInterpretation?: string;
  apiConfig: ApiConfig;
  signal: AbortSignal;
  callbacks: FollowUpTurnCallbacks;
}

/** 复用追问的决策与补充牌，只重新生成追问解读。 */
export async function rerunFollowUpInterpretation(
  params: RerunFollowUpInterpretationParams,
): Promise<InterpretationRerunResult> {
  const {
    originalQuestion,
    spread,
    drawnCards,
    previousInterpretation,
    followUpQuestion,
    decision,
    additionalCards,
    previousFollowUpInterpretation,
    apiConfig,
    signal,
    callbacks,
  } = params;

  const basePrompt =
    decision === 'draw'
      ? buildFollowUpWithExtrasPrompt(
          originalQuestion,
          spread,
          drawnCards,
          previousInterpretation,
          followUpQuestion,
          additionalCards,
        )
      : buildFollowUpDirectPrompt(
          originalQuestion,
          spread,
          drawnCards,
          previousInterpretation,
          followUpQuestion,
        );

  const result = await streamRaw(
    appendRegenerationInstruction(basePrompt, previousFollowUpInterpretation),
    apiConfig,
    signal,
    {
      onContent: callbacks.onContent,
      onThinking: callbacks.onThinking,
      onStreamError: callbacks.onStreamError,
      onRetry: callbacks.onRetry,
    },
  );

  return {
    interpretation: result.fullText,
    truncated: result.truncated,
  };
}

// ─── 通用 prompt 透传调用（内部） ──────────────────────────

interface StreamRawCallbacks {
  onContent?: (chunk: string) => void;
  onThinking?: (chunk: string) => void;
  onStreamError?: (msg: string) => void;
  onRetry?: (attempt: number, maxRetries: number) => void;
}

function appendRegenerationInstruction(prompt: string, previousResponse?: string): string {
  const trimmedPrevious = previousResponse?.trim();
  if (!trimmedPrevious) return prompt;

  return `${prompt}

## 上一版回复
${trimmedPrevious}

## 重新生成要求
请重新生成一版回复。保持问题、牌阵、牌面事实不变，但避免复用上一版表达；给出更清晰、更具体、更有行动感的解读。`;
}

/** 以 agent 模式透传任意 prompt 调用 /api/interpret */
async function streamRaw(
  prompt: string,
  apiConfig: ApiConfig,
  signal: AbortSignal,
  callbacks: StreamRawCallbacks & { maxRetries?: number } = {},
): Promise<StreamResult> {
  const { maxRetries, ...streamCallbacks } = callbacks;
  return streamInterpret(
    { agent: { prompt }, apiConfig } as unknown as Parameters<typeof streamInterpret>[0],
    streamCallbacks,
    { signal, maxRetries },
  );
}
