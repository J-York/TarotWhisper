'use client';

import { useState, useCallback } from 'react';
import {
  DrawnCard,
  Spread,
  SpreadPosition,
  Reading,
  ApiConfig,
  FollowUp,
} from '@/lib/tarot/types';
import { allCards } from '@/lib/tarot/cards';
import { getDefaultSpread } from '@/lib/tarot/spreads';
import { saveReading, updateReadingFollowUps } from '@/lib/readingStorage';
import {
  parseSseChunk as parseSseChunkUtil,
  extractDecisionJson as extractDecisionJsonUtil,
} from '@/lib/tarot/sseUtils';

export type ReadingPhase = 'question' | 'spread' | 'shuffle' | 'draw' | 'reveal' | 'interpret';

const SUPPLEMENTARY_CN_NAMES = ['补 一', '补 二', '补 三', '补 四', '补 五'];

function makeSupplementaryPositions(count: number, startIndex: number): SpreadPosition[] {
  return Array.from({ length: count }, (_, i) => {
    const idx = startIndex + i;
    return {
      id: `supp-${idx + 1}`,
      name: `Supplementary ${idx + 1}`,
      nameCn: SUPPLEMENTARY_CN_NAMES[i] ?? `补 ${idx + 1}`,
      description: '为回应追问而抽取的补充指引',
    };
  });
}

function drawSupplementaryCards(count: number, startIndex: number): DrawnCard[] {
  const positions = makeSupplementaryPositions(count, startIndex);
  const shuffled = [...allCards].sort(() => Math.random() - 0.5);
  return positions.map((position, idx) => ({
    card: shuffled[idx],
    isReversed: Math.random() > 0.5,
    position,
  }));
}

// DecisionResult & extractDecisionJson -> @/lib/tarot/sseUtils
const extractDecisionJson = extractDecisionJsonUtil;

// ParsedSseChunk & SSE parsing helpers -> @/lib/tarot/sseUtils

interface StreamResult {
  fullText: string;
  usingFallback: boolean;
  receivedError: boolean;
}

/**
 * 通用 SSE 流消费：调用 /api/interpret，将 thinking 段自动包裹为 <think>...</think> 后
 * 混入 content，按追加顺序回调 onAppend。供初次解读与追问解读复用。
 */
async function streamFromInterpret(
  body: unknown,
  onAppend: (chunk: string) => void,
  onError?: (msg: string) => void,
): Promise<StreamResult> {
  const response = await fetch('/api/interpret', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`请求失败: ${response.status} - ${errorText}`);
  }

  const usingFallback = response.headers.get('X-Using-Fallback') === 'true';

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('无法读取响应');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let streamComplete = false;
  let receivedAnyContent = false;
  let receivedError = false;
  let lastChunkAt = Date.now();
  let thinkingBlockOpen = false;
  const streamIdleTimeoutMs = 8000;

  const append = (chunk: string): void => {
    if (!chunk) return;
    fullText += chunk;
    onAppend(chunk);
    receivedAnyContent = true;
    lastChunkAt = Date.now();
  };

  const openThinking = (): void => {
    if (thinkingBlockOpen) return;
    const prefix = fullText ? '\n\n<think>\n' : '<think>\n';
    append(prefix);
    thinkingBlockOpen = true;
  };

  const closeThinking = (): void => {
    if (!thinkingBlockOpen) return;
    append('\n</think>\n\n');
    thinkingBlockOpen = false;
  };

  const processLine = (data: string): void => {
    const parsed = parseSseChunk(data);
    if (parsed.isDone) {
      streamComplete = true;
      closeThinking();
      return;
    }
    if (parsed.thinking) {
      openThinking();
      append(parsed.thinking);
    }
    if (parsed.content) {
      closeThinking();
      append(parsed.content);
    }
    if (parsed.error) {
      receivedError = true;
      onError?.(parsed.error);
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (Date.now() - lastChunkAt > streamIdleTimeoutMs && receivedAnyContent) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith('data: ')) continue;
        processLine(line.slice(6));
        if (streamComplete) break;
      }

      if (streamComplete) break;
    }

    const trailingLines = buffer.split('\n');
    for (const rawLine of trailingLines) {
      const line = rawLine.trim();
      if (!line.startsWith('data: ')) continue;
      processLine(line.slice(6));
      if (streamComplete) break;
    }

    closeThinking();
  } finally {
    reader.releaseLock();
  }

  return { fullText, usingFallback, receivedError };
}

// parseSseChunk -> @/lib/tarot/sseUtils
const parseSseChunk = parseSseChunkUtil;

export function useReading() {
  const [phase, setPhase] = useState<ReadingPhase>('question');
  const [question, setQuestion] = useState('');
  const [spread, setSpread] = useState<Spread>(getDefaultSpread());
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [interpretation, setInterpretation] = useState('');
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── 追问状态 ─────────────────────────────────────────────
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [readingId, setReadingId] = useState<string | null>(null);

  const patchFollowUp = useCallback((id: string, patch: Partial<FollowUp> | ((prev: FollowUp) => Partial<FollowUp>)) => {
    setFollowUps((prev) =>
      prev.map((fu) => {
        if (fu.id !== id) return fu;
        const p = typeof patch === 'function' ? patch(fu) : patch;
        return { ...fu, ...p };
      }),
    );
  }, []);

  const shuffleAndDraw = useCallback(() => {
    const shuffled = [...allCards].sort(() => Math.random() - 0.5);
    const drawn: DrawnCard[] = spread.positions.map((position, index) => ({
      card: shuffled[index],
      isReversed: Math.random() > 0.5,
      position,
    }));
    setDrawnCards(drawn);
    setRevealedCount(0);
    setPhase('draw');
  }, [spread]);

  const revealNextCard = useCallback(() => {
    if (revealedCount < drawnCards.length) {
      setRevealedCount(prev => prev + 1);
      if (revealedCount + 1 >= drawnCards.length) {
        setPhase('reveal');
      }
    }
  }, [revealedCount, drawnCards.length]);

  const revealAllCards = useCallback(() => {
    setRevealedCount(drawnCards.length);
    setPhase('reveal');
  }, [drawnCards.length]);

  const startInterpretation = useCallback(async (apiConfig: ApiConfig) => {
    setIsInterpreting(true);
    setInterpretation('');
    setError(null);
    setFollowUps([]);
    setPhase('interpret');

    let receivedError = false;

    try {
      const result = await streamFromInterpret(
        { question, spread, drawnCards, apiConfig },
        (chunk) => setInterpretation((prev) => prev + chunk),
        (msg) => {
          receivedError = true;
          setError(msg);
        },
      );

      if (result.usingFallback) {
        console.info('使用内置 LLM 配置（有速率限制）。配置自己的 API Key 可解除限制。');
      }

      if (result.fullText) {
        const id = crypto.randomUUID();
        setReadingId(id);
        const reading: Reading = {
          id,
          question,
          spread,
          drawnCards,
          interpretation: result.fullText,
          createdAt: new Date(),
        };
        saveReading(reading);
      } else if (!receivedError && !result.receivedError) {
        setError('未收到有效解读内容，连接可能被网关提前中断');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '解读失败');
    } finally {
      setIsInterpreting(false);
    }
  }, [question, spread, drawnCards]);

  /**
   * 启动一次「补充牌已揭示完毕 → 进入解读」的流式解读。
   * 仅供 askFollowUp 与 revealNextFollowUpCard 内部调用。
   */
  const runFollowUpInterpretation = useCallback(async (
    followUpId: string,
    apiConfig: ApiConfig,
  ): Promise<void> => {
    const target = followUps.find((fu) => fu.id === followUpId);
    if (!target) return;

    const mode = target.decision === 'draw' ? 'with-extras' : 'direct';
    patchFollowUp(followUpId, { status: 'interpreting', interpretation: '', error: null });

    let receivedError = false;
    try {
      const result = await streamFromInterpret(
        {
          question,
          spread,
          drawnCards,
          apiConfig,
          followUp: {
            mode,
            previousInterpretation: interpretation,
            followUpQuestion: target.question,
            additionalCards: mode === 'with-extras' ? target.additionalCards : undefined,
          },
        },
        (chunk) =>
          patchFollowUp(followUpId, (prev) => ({
            interpretation: prev.interpretation + chunk,
          })),
        (msg) => {
          receivedError = true;
          patchFollowUp(followUpId, { error: msg });
        },
      );

      if (!result.fullText && !receivedError && !result.receivedError) {
        patchFollowUp(followUpId, {
          status: 'error',
          error: '未收到有效解读内容，连接可能被网关提前中断',
        });
      } else if (receivedError || result.receivedError) {
        patchFollowUp(followUpId, { status: 'error' });
      } else {
        patchFollowUp(followUpId, { status: 'done' });
        // 持久化追问到 localStorage
        if (readingId) {
          // 需要拿最新的 followUps 状态，但 patchFollowUp 是异步更新，
          // 在下一个微任务中读取以确保状态已更新
          queueMicrotask(() => {
            setFollowUps((current) => {
              updateReadingFollowUps(readingId, current);
              return current;
            });
          });
        }
      }
    } catch (err) {
      patchFollowUp(followUpId, {
        status: 'error',
        error: err instanceof Error ? err.message : '追问解读失败',
      });
    }
  }, [followUps, question, spread, drawnCards, interpretation, patchFollowUp, readingId]);

  const askFollowUp = useCallback(async (
    followUpQuestion: string,
    apiConfig: ApiConfig,
  ): Promise<void> => {
    const trimmed = followUpQuestion.trim();
    if (!trimmed || !interpretation) return;

    const id = crypto.randomUUID();
    const draft: FollowUp = {
      id,
      question: trimmed,
      status: 'deciding',
      drawCount: 0,
      additionalCards: [],
      revealedCount: 0,
      interpretation: '',
      error: null,
    };

    setFollowUps((prev) => [...prev, draft]);

    // ── 决策步：收集完整文本后解析 JSON ──
    let decideBuffer = '';
    try {
      const result = await streamFromInterpret(
        {
          question,
          spread,
          drawnCards,
          apiConfig,
          followUp: {
            mode: 'decide',
            previousInterpretation: interpretation,
            followUpQuestion: trimmed,
          },
        },
        (chunk) => { decideBuffer += chunk; },
      );

      const decision = extractDecisionJson(result.fullText || decideBuffer);
      if (!decision) {
        patchFollowUp(id, {
          status: 'error',
          error: '神谕的回应难以辨识，请稍后再问',
        });
        return;
      }

      if (decision.decision === 'direct') {
        patchFollowUp(id, {
          decision: 'direct',
          drawCount: 0,
          reason: decision.reason,
        });
        // 直接进入解读步
        await runFollowUpInterpretation(id, apiConfig);
      } else {
        // 立即抽好补充牌，进入 awaiting-reveal
        const additionalCards = drawSupplementaryCards(decision.drawCount, 0);
        patchFollowUp(id, {
          decision: 'draw',
          drawCount: decision.drawCount,
          reason: decision.reason,
          additionalCards,
          revealedCount: 0,
          status: 'awaiting-reveal',
        });
      }
    } catch (err) {
      patchFollowUp(id, {
        status: 'error',
        error: err instanceof Error ? err.message : '追问失败',
      });
    }
  }, [interpretation, question, spread, drawnCards, patchFollowUp, runFollowUpInterpretation]);

  const revealNextFollowUpCard = useCallback((followUpId: string, apiConfig: ApiConfig) => {
    setFollowUps((prev) =>
      prev.map((fu) => {
        if (fu.id !== followUpId) return fu;
        if (fu.status !== 'awaiting-reveal') return fu;
        if (fu.revealedCount >= fu.additionalCards.length) return fu;

        const nextRevealedCount = fu.revealedCount + 1;
        const allRevealed = nextRevealedCount >= fu.additionalCards.length;

        if (allRevealed) {
          // 全部揭示完，触发解读（async，在下一 tick 调用）
          queueMicrotask(() => {
            runFollowUpInterpretation(followUpId, apiConfig);
          });
        }

        return { ...fu, revealedCount: nextRevealedCount };
      }),
    );
  }, [runFollowUpInterpretation]);

  const revealAllFollowUpCards = useCallback((followUpId: string, apiConfig: ApiConfig) => {
    setFollowUps((prev) =>
      prev.map((fu) => {
        if (fu.id !== followUpId) return fu;
        if (fu.status !== 'awaiting-reveal') return fu;
        if (fu.revealedCount >= fu.additionalCards.length) return fu;
        return { ...fu, revealedCount: fu.additionalCards.length };
      }),
    );
    queueMicrotask(() => {
      runFollowUpInterpretation(followUpId, apiConfig);
    });
  }, [runFollowUpInterpretation]);

  const retryFollowUp = useCallback(async (followUpId: string, apiConfig: ApiConfig) => {
    const target = followUps.find((fu) => fu.id === followUpId);
    if (!target) return;
    // 重新走解读步（用现有 decision/additionalCards）
    if (target.decision) {
      await runFollowUpInterpretation(followUpId, apiConfig);
    }
  }, [followUps, runFollowUpInterpretation]);

  const hasInFlightFollowUp = followUps.some((fu) =>
    fu.status === 'deciding' || fu.status === 'awaiting-reveal' || fu.status === 'interpreting',
  );

  const reset = useCallback(() => {
    setPhase('question');
    setQuestion('');
    setSpread(getDefaultSpread());
    setDrawnCards([]);
    setRevealedCount(0);
    setInterpretation('');
    setIsInterpreting(false);
    setError(null);
    setFollowUps([]);
    setReadingId(null);
  }, []);

  const goToPhase = useCallback((newPhase: ReadingPhase) => {
    setPhase(newPhase);
  }, []);

  return {
    phase,
    question,
    spread,
    drawnCards,
    revealedCount,
    interpretation,
    isInterpreting,
    error,
    followUps,
    hasInFlightFollowUp,
    setQuestion,
    setSpread,
    shuffleAndDraw,
    revealNextCard,
    revealAllCards,
    startInterpretation,
    askFollowUp,
    revealNextFollowUpCard,
    revealAllFollowUpCards,
    retryFollowUp,
    reset,
    goToPhase,
  };
}
