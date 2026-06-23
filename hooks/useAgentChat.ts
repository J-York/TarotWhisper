'use client';

/**
 * Agent 对话状态管理 · 取代 useReading 的线性状态机
 *
 * 以「消息列表」为核心：用户消息 + Agent 消息（内嵌牌阵/牌面/解读）。
 * 一个 Agent 消息即一个完整回合：选牌阵 → 抽牌 → 流式解读。
 * 追问作为后续 Agent 消息追加，复用 decide/draw 协议。
 */

import { useState, useCallback, useRef } from 'react';
import { ApiConfig, DrawnCard, Spread } from '@/lib/tarot/types';
import { Reading } from '@/lib/tarot/types';
import { saveReading, updateReadingFollowUps } from '@/lib/readingStorage';
import { runAgentTurn, runFollowUpTurn } from '@/lib/agent/agentTurn';
import { LLMError, classifyError } from '@/lib/api/errors';
import { genId } from '@/lib/id';

// ─── 消息模型 ───────────────────────────────────────────────

export type AgentMessageStatus = 'running' | 'done' | 'error';

/** 用户消息 */
export interface UserMessage {
  id: string;
  role: 'user';
  content: string;
}

/** 首轮 Agent 回合消息（含牌阵与牌面） */
export interface AgentMessage {
  id: string;
  role: 'agent';
  content: string;
  status: AgentMessageStatus;
  error: string | null;
  /** 选定的牌阵与理由 */
  spread: Spread | null;
  spreadReason: string;
  /** 抽到的牌 */
  drawnCards: DrawnCard[];
  /** 非致命提示（如输出被截断） */
  notice: string | null;
  /** 关联的 Reading id，用于持久化 */
  readingId: string | null;
  /** 追问列表 */
  followUps: FollowUpMessage[];
}

/** 追问消息（嵌套在 Agent 首轮消息的 followUps 中） */
export interface FollowUpMessage {
  id: string;
  question: string;
  status: AgentMessageStatus;
  decision: 'direct' | 'draw' | null;
  drawCount: number;
  reason: string;
  additionalCards: DrawnCard[];
  interpretation: string;
  error: string | null;
  notice: string | null;
}

export type ChatMessage = UserMessage | AgentMessage;

// ─── 工厂 ───────────────────────────────────────────────────

function makeUserMessage(content: string): UserMessage {
  return { id: genId(), role: 'user', content };
}

function makeAgentMessage(): AgentMessage {
  return {
    id: genId(),
    role: 'agent',
    content: '',
    status: 'running',
    error: null,
    spread: null,
    spreadReason: '',
    drawnCards: [],
    notice: null,
    readingId: null,
    followUps: [],
  };
}

function makeFollowUpMessage(question: string): FollowUpMessage {
  return {
    id: genId(),
    question,
    status: 'running',
    decision: null,
    drawCount: 0,
    reason: '',
    additionalCards: [],
    interpretation: '',
    error: null,
    notice: null,
  };
}

// ─── 错误消息提取 ────────────────────────────────────────────

function getErrorMessage(err: unknown): string {
  if (err instanceof LLMError) return err.info.message;
  return classifyError(err).message;
}

// ─── Hook ───────────────────────────────────────────────────

export function useAgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // messages 的 ref 镜像，供异步流程在不依赖 state 闭包的节点读取最新值
  const messagesRef = useRef<ChatMessage[]>([]);

  /** 统一的 messages 提交函数：同步更新 ref 镜像 */
  const commit = useCallback(
    (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
      const next = updater(messagesRef.current);
      messagesRef.current = next;
      setMessages(next);
    },
    [],
  );

  // AbortController 管理
  const activeAbortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    if (activeAbortRef.current) {
      activeAbortRef.current.abort();
      activeAbortRef.current = null;
    }
  }, []);

  const createController = useCallback((): AbortController => {
    cancel();
    const controller = new AbortController();
    activeAbortRef.current = controller;
    return controller;
  }, [cancel]);

  // ── 局部更新工具 ───────────────────────────────────────
  const patchLastAgent = useCallback(
    (patch: Partial<AgentMessage> | ((prev: AgentMessage) => Partial<AgentMessage>)) => {
      commit((prev) => {
        const last = prev[prev.length - 1];
        if (!last || last.role !== 'agent') return prev;
        const p = typeof patch === 'function' ? patch(last) : patch;
        return [...prev.slice(0, -1), { ...last, ...p }];
      });
    },
    [commit],
  );

  const patchFollowUp = useCallback(
    (
      followUpId: string,
      patch: Partial<FollowUpMessage> | ((prev: FollowUpMessage) => Partial<FollowUpMessage>),
    ) => {
      commit((prev) => {
        let changed = false;
        const next = prev.map((message) => {
          if (
            message.role !== 'agent' ||
            !message.followUps.some((fu) => fu.id === followUpId)
          ) {
            return message;
          }

          changed = true;
          return {
            ...message,
            followUps: message.followUps.map((fu) => {
              if (fu.id !== followUpId) return fu;
              const p = typeof patch === 'function' ? patch(fu) : patch;
              return { ...fu, ...p };
            }),
          };
        });

        return changed ? next : prev;
      });
    },
    [commit],
  );

  const findOriginalQuestion = useCallback((agentId: string): string => {
    const current = messagesRef.current;
    const agentIndex = current.findIndex(
      (message) => message.role === 'agent' && message.id === agentId,
    );

    for (let i = agentIndex - 1; i >= 0; i--) {
      const message = current[i];
      if (message.role === 'user') return message.content;
    }

    return '';
  }, []);

  // ── 发起首轮提问 ───────────────────────────────────────

  const sendQuestion = useCallback(
    async (question: string, apiConfig: ApiConfig): Promise<void> => {
      const trimmed = question.trim();
      if (!trimmed || isRunning) return;

      const userMsg = makeUserMessage(trimmed);
      const agentMsg = makeAgentMessage();
      commit((prev) => [...prev, userMsg, agentMsg]);
      setIsRunning(true);

      const controller = createController();

      try {
        const result = await runAgentTurn({
          question: trimmed,
          apiConfig,
          signal: controller.signal,
          callbacks: {
            onSpreadChosen: ({ spread, reason }) =>
              patchLastAgent({ spread, spreadReason: reason }),
            onCardsDrawn: ({ drawnCards }) => patchLastAgent({ drawnCards }),
            onContent: (chunk) =>
              patchLastAgent((prev) => ({ content: prev.content + chunk })),
            onThinking: (chunk) =>
              patchLastAgent((prev) => ({ content: prev.content + chunk })),
            onStreamError: (msg) =>
              patchLastAgent((prev) => ({ error: prev.error ?? msg })),
            onRetry: (attempt, max) => {
              console.info(`Agent 重试 ${attempt}/${max}`);
            },
          },
        });

        // 持久化
        const readingId = genId();
        patchLastAgent({
          status: 'done',
          readingId,
          notice: result.truncated
            ? '解读内容因模型输出长度限制被截断，已显示部分内容。'
            : null,
        });

        const reading: Reading = {
          id: readingId,
          question: trimmed,
          spread: result.spread,
          drawnCards: result.drawnCards,
          interpretation: result.interpretation,
          createdAt: new Date(),
        };
        saveReading(reading);
      } catch (err) {
        if (err instanceof LLMError && err.info.code === 'ABORTED') {
          patchLastAgent({ status: 'error', error: '已停止生成' });
          return;
        }
        patchLastAgent({ status: 'error', error: getErrorMessage(err) });
      } finally {
        setIsRunning(false);
        if (activeAbortRef.current === controller) {
          activeAbortRef.current = null;
        }
      }
    },
    [isRunning, createController, patchLastAgent, commit],
  );

  // ── 发起追问 ───────────────────────────────────────────

  const askFollowUp = useCallback(
    async (question: string, apiConfig: ApiConfig): Promise<void> => {
      const trimmed = question.trim();
      if (!trimmed || isRunning) return;

      // 找到最后一个 agent 消息作为追问的上下文
      const lastAgent = [...messagesRef.current].reverse().find((m) => m.role === 'agent');
      if (
        !lastAgent ||
        lastAgent.role !== 'agent' ||
        lastAgent.status !== 'done' ||
        !lastAgent.spread ||
        !lastAgent.content
      ) {
        return;
      }

      const followUp = makeFollowUpMessage(trimmed);
      const targetAgentId = lastAgent.id;
      const originalQuestion = findOriginalQuestion(targetAgentId);

      commit((prev) => {
        let changed = false;
        const next = prev.map((message) => {
          if (message.role !== 'agent' || message.id !== targetAgentId) {
            return message;
          }

          changed = true;
          return { ...message, followUps: [...message.followUps, followUp] };
        });

        return changed ? next : prev;
      });

      setIsRunning(true);
      const controller = createController();

      try {
        const result = await runFollowUpTurn({
          originalQuestion,
          spread: lastAgent.spread,
          drawnCards: lastAgent.drawnCards,
          previousInterpretation: lastAgent.content,
          followUpQuestion: trimmed,
          apiConfig,
          signal: controller.signal,
          callbacks: {
            onDecided: (decision, drawCount, reason) =>
              patchFollowUp(followUp.id, { decision, drawCount, reason }),
            onSupplementaryCards: (cards) =>
              patchFollowUp(followUp.id, { additionalCards: cards }),
            onContent: (chunk) =>
              patchFollowUp(followUp.id, (prev) => ({
                interpretation: prev.interpretation + chunk,
              })),
            onThinking: (chunk) =>
              patchFollowUp(followUp.id, (prev) => ({
                interpretation: prev.interpretation + chunk,
              })),
            onStreamError: (msg) =>
              patchFollowUp(followUp.id, { error: msg }),
            onRetry: (attempt, max) => {
              console.info(`追问重试 ${attempt}/${max}`);
            },
          },
        });

        patchFollowUp(followUp.id, {
          status: 'done',
          notice: result.truncated ? '回复因输出长度限制被截断。' : null,
        });

        // 持久化追问
        if (lastAgent.readingId) {
          queueMicrotask(() => {
            const current = messagesRef.current;
            const lastAgentNow = [...current].reverse().find((m) => m.role === 'agent');
            if (lastAgentNow && lastAgentNow.role === 'agent' && lastAgentNow.readingId) {
              const completed = lastAgentNow.followUps
                .filter((fu) => fu.status === 'done')
                .map((fu) => ({
                  id: fu.id,
                  question: fu.question,
                  status: 'done' as const,
                  decision: fu.decision ?? undefined,
                  drawCount: fu.drawCount,
                  reason: fu.reason,
                  additionalCards: fu.additionalCards,
                  revealedCount: fu.additionalCards.length,
                  interpretation: fu.interpretation,
                  error: fu.error,
                }));
              updateReadingFollowUps(lastAgentNow.readingId, completed);
            }
          });
        }
      } catch (err) {
        if (err instanceof LLMError && err.info.code === 'ABORTED') {
          patchFollowUp(followUp.id, { status: 'error', error: '已停止生成' });
          return;
        }
        patchFollowUp(followUp.id, { status: 'error', error: getErrorMessage(err) });
      } finally {
        setIsRunning(false);
        if (activeAbortRef.current === controller) {
          activeAbortRef.current = null;
        }
      }
    },
    [isRunning, createController, patchFollowUp, commit, findOriginalQuestion],
  );

  // ── 重置 ───────────────────────────────────────────────

  const reset = useCallback(() => {
    cancel();
    commit(() => []);
    setIsRunning(false);
  }, [cancel, commit]);

  return {
    messages,
    isRunning,
    sendQuestion,
    askFollowUp,
    cancel,
    reset,
  };
}
