'use client';

import { useState, useCallback, useRef } from 'react';
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
import { extractDecisionJson as extractDecisionJsonUtil } from '@/lib/tarot/sseUtils';
import { streamInterpret } from '@/lib/api/stream-client';
import { LLMError, classifyError } from '@/lib/api/errors';

export type ReadingPhase = 'question' | 'spread' | 'shuffle' | 'draw' | 'reveal' | 'interpret';

// ─── 补充牌工具 ─────────────────────────────────────────────

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

const extractDecisionJson = extractDecisionJsonUtil;

// ─── 错误消息提取 ────────────────────────────────────────────

function getErrorMessage(err: unknown): string {
  if (err instanceof LLMError) return err.info.message;
  const info = classifyError(err);
  return info.message;
}

// ─── Hook ────────────────────────────────────────────────────

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

  // ── AbortController 管理 ─────────────────────────────────
  // 保存当前活跃请求的 AbortController，用于取消
  const activeAbortRef = useRef<AbortController | null>(null);

  /** 取消当前正在进行的 LLM 请求 */
  const cancelRequest = useCallback(() => {
    if (activeAbortRef.current) {
      activeAbortRef.current.abort();
      activeAbortRef.current = null;
    }
  }, []);

  /** 创建新的 AbortController 并取消旧的 */
  const createAbortController = useCallback((): AbortController => {
    cancelRequest(); // 取消旧的
    const controller = new AbortController();
    activeAbortRef.current = controller;
    return controller;
  }, [cancelRequest]);

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

  // ── 主解读 ───────────────────────────────────────────────

  const startInterpretation = useCallback(async (apiConfig: ApiConfig) => {
    setIsInterpreting(true);
    setInterpretation('');
    setError(null);
    setFollowUps([]);
    setPhase('interpret');

    const controller = createAbortController();

    try {
      const result = await streamInterpret(
        { question, spread, drawnCards, apiConfig },
        {
          onContent: (chunk) => setInterpretation((prev) => prev + chunk),
          onThinking: (chunk) => setInterpretation((prev) => prev + chunk),
          onStreamError: (msg) => setError(msg),
          onRetry: (attempt, max) => {
            console.info(`LLM 请求重试 ${attempt}/${max}`);
          },
        },
        { signal: controller.signal },
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

        if (result.truncated) {
          setError('解读内容因模型输出长度限制被截断，已显示部分内容。建议在设置中切换更高输出限制的模型，或使用追问功能获取剩余内容。');
        }
      } else if (!result.receivedError) {
        setError('未收到有效解读内容，连接可能被网关提前中断');
      }
    } catch (err) {
      // ABORTED 不算错误（用户主动取消）
      if (err instanceof LLMError && err.info.code === 'ABORTED') {
        // 用户取消，静默处理
        return;
      }
      setError(getErrorMessage(err));
    } finally {
      setIsInterpreting(false);
      if (activeAbortRef.current === controller) {
        activeAbortRef.current = null;
      }
    }
  }, [question, spread, drawnCards, createAbortController]);

  // ── 追问解读 ─────────────────────────────────────────────

  const runFollowUpInterpretation = useCallback(async (
    followUpId: string,
    apiConfig: ApiConfig,
  ): Promise<void> => {
    const target = followUps.find((fu) => fu.id === followUpId);
    if (!target) return;

    const mode = target.decision === 'draw' ? 'with-extras' : 'direct';
    patchFollowUp(followUpId, { status: 'interpreting', interpretation: '', error: null });

    const controller = createAbortController();

    try {
      const result = await streamInterpret(
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
        {
          onContent: (chunk) =>
            patchFollowUp(followUpId, (prev) => ({
              interpretation: prev.interpretation + chunk,
            })),
          onThinking: (chunk) =>
            patchFollowUp(followUpId, (prev) => ({
              interpretation: prev.interpretation + chunk,
            })),
          onStreamError: (msg) =>
            patchFollowUp(followUpId, { error: msg }),
          onRetry: (attempt, max) => {
            console.info(`追问解读重试 ${attempt}/${max}`);
          },
        },
        { signal: controller.signal },
      );

      if (!result.fullText && !result.receivedError) {
        patchFollowUp(followUpId, {
          status: 'error',
          error: '未收到有效解读内容，连接可能被网关提前中断',
        });
      } else if (result.receivedError) {
        patchFollowUp(followUpId, { status: 'error' });
      } else {
        const patch: Partial<FollowUp> = { status: 'done' };
        if (result.truncated) {
          patch.error = '回复因模型输出长度限制被截断，已显示部分内容。';
        }
        patchFollowUp(followUpId, patch);
        if (readingId) {
          queueMicrotask(() => {
            setFollowUps((current) => {
              updateReadingFollowUps(readingId, current);
              return current;
            });
          });
        }
      }
    } catch (err) {
      if (err instanceof LLMError && err.info.code === 'ABORTED') return;
      patchFollowUp(followUpId, {
        status: 'error',
        error: getErrorMessage(err),
      });
    } finally {
      if (activeAbortRef.current === controller) {
        activeAbortRef.current = null;
      }
    }
  }, [followUps, question, spread, drawnCards, interpretation, patchFollowUp, readingId, createAbortController]);

  // ── 追问入口 ─────────────────────────────────────────────

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

    const controller = createAbortController();

    // ── 决策步 ──
    let decideBuffer = '';
    try {
      const result = await streamInterpret(
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
        {
          onContent: (chunk) => { decideBuffer += chunk; },
          onThinking: (chunk) => { decideBuffer += chunk; },
        },
        {
          signal: controller.signal,
          maxRetries: 1, // 决策步不需要太多重试
        },
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
        await runFollowUpInterpretation(id, apiConfig);
      } else {
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
      if (err instanceof LLMError && err.info.code === 'ABORTED') return;
      patchFollowUp(id, {
        status: 'error',
        error: getErrorMessage(err),
      });
    } finally {
      if (activeAbortRef.current === controller) {
        activeAbortRef.current = null;
      }
    }
  }, [interpretation, question, spread, drawnCards, patchFollowUp, runFollowUpInterpretation, createAbortController]);

  // ── 翻牌 & 重试 ─────────────────────────────────────────

  const revealNextFollowUpCard = useCallback((followUpId: string, apiConfig: ApiConfig) => {
    setFollowUps((prev) =>
      prev.map((fu) => {
        if (fu.id !== followUpId) return fu;
        if (fu.status !== 'awaiting-reveal') return fu;
        if (fu.revealedCount >= fu.additionalCards.length) return fu;

        const nextRevealedCount = fu.revealedCount + 1;
        const allRevealed = nextRevealedCount >= fu.additionalCards.length;

        if (allRevealed) {
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
    if (target.decision) {
      await runFollowUpInterpretation(followUpId, apiConfig);
    }
  }, [followUps, runFollowUpInterpretation]);

  const hasInFlightFollowUp = followUps.some((fu) =>
    fu.status === 'deciding' || fu.status === 'awaiting-reveal' || fu.status === 'interpreting',
  );

  // ── 重置 & 导航 ─────────────────────────────────────────

  const reset = useCallback(() => {
    cancelRequest(); // 取消任何进行中的请求
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
  }, [cancelRequest]);

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
    cancelRequest,
    reset,
    goToPhase,
  };
}
