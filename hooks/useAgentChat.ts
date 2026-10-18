'use client';

/**
 * Agent 对话状态管理 · 取代 useReading 的线性状态机
 *
 * 以「消息列表」为核心：用户消息 + Agent 消息（内嵌牌阵/牌面/解读）。
 * 一个 Agent 消息即一个完整回合：选牌阵 → 抽牌 → 流式解读。
 * 追问作为后续 Agent 消息追加，复用 decide/draw 协议。
 */

import { useState, useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { ApiConfig, DrawnCard, FollowUp, Reading, Spread } from '@/lib/tarot/types';
import { loadChat, saveChat, clearChat } from '@/lib/agentChatStorage';
import {
  saveReading,
  updateReadingFollowUps,
  updateReadingInterpretation,
} from '@/lib/readingStorage';
import {
  rerunAgentInterpretation,
  rerunFollowUpInterpretation,
  runAgentTurn,
  runFollowUpTurn,
} from '@/lib/agent/agentTurn';
import { LLMError, classifyError } from '@/lib/api/errors';
import type { RetryState } from '@/lib/api/stream-client';
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
  /** 自动重试的瞬时状态（连接中断重试时非空） */
  retry: RetryState | null;
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
  /** 自动重试的瞬时状态 */
  retry: RetryState | null;
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
    retry: null,
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
    retry: null,
  };
}

// ─── 错误消息提取 ────────────────────────────────────────────

function getErrorMessage(err: unknown): string {
  if (err instanceof LLMError) return err.info.message;
  return classifyError(err).message;
}

function toStoredFollowUps(agent: AgentMessage): FollowUp[] {
  return agent.followUps
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
}

// ─── 消息 store ─────────────────────────────────────────────
/** 与 useApiConfig 同样的模块级 store：对外是同一份消息，
 *  异步流程随时能读到最新值，无需再维护一份 ref 镜像。 */

interface MessageSnapshot {
  messages: ChatMessage[];
  /** 是否已尝试从 localStorage 恢复 */
  hydrated: boolean;
}

let snapshot: MessageSnapshot = { messages: [], hydrated: false };
const listeners = new Set<() => void>();
let storageRead = false;

function publish(next: MessageSnapshot): void {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

/** 首次订阅时读取本地记录；同一页面生命周期只读一次 */
function hydrate(): void {
  if (storageRead || typeof window === 'undefined') return;
  storageRead = true;
  publish({ messages: loadChat(), hydrated: true });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  hydrate();
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = (): MessageSnapshot => snapshot;
const SERVER_SNAPSHOT: MessageSnapshot = { messages: [], hydrated: false };
const getServerSnapshot = (): MessageSnapshot => SERVER_SNAPSHOT;

/** 写入新消息列表并广播 */
function updateMessages(updater: (prev: ChatMessage[]) => ChatMessage[]): void {
  publish({ messages: updater(snapshot.messages), hydrated: true });
}

// ─── Hook ───────────────────────────────────────────────────

export function useAgentChat() {
  const { messages, hydrated: isHydrated } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [isRunning, setIsRunning] = useState(false);

  /** 统一的 messages 提交函数 */
  const commit = useCallback(
    (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
      updateMessages(updater);
    },
    [],
  );

  // 消息变化后落盘。流式输出期间 messages 每个 token 都变，
  // 直接写 localStorage 会成为热点，因此做 400ms 防抖；
  // 页面中途关闭时最多丢失最后 400ms 的内容。
  useEffect(() => {
    if (!isHydrated) return;
    const timer = window.setTimeout(() => saveChat(messages), 400);
    return () => window.clearTimeout(timer);
  }, [messages, isHydrated]);

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

  const patchAgent = useCallback(
    (
      agentId: string,
      patch: Partial<AgentMessage> | ((prev: AgentMessage) => Partial<AgentMessage>),
    ) => {
      commit((prev) => {
        let changed = false;
        const next = prev.map((message) => {
          if (message.role !== 'agent' || message.id !== agentId) return message;
          changed = true;
          const p = typeof patch === 'function' ? patch(message) : patch;
          return { ...message, ...p };
        });

        return changed ? next : prev;
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
    const current = snapshot.messages;
    const agentIndex = current.findIndex(
      (message) => message.role === 'agent' && message.id === agentId,
    );

    for (let i = agentIndex - 1; i >= 0; i--) {
      const message = current[i];
      if (message.role === 'user') return message.content;
    }

    return '';
  }, []);

  const persistFollowUpsForAgent = useCallback((agentId: string): void => {
    queueMicrotask(() => {
      const agent = snapshot.messages.find(
        (message) => message.role === 'agent' && message.id === agentId,
      );
      if (!agent || agent.role !== 'agent' || !agent.readingId) return;
      updateReadingFollowUps(agent.readingId, toStoredFollowUps(agent));
    });
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
            onRetry: (attempt, max) =>
              patchLastAgent({ retry: { attempt, max } }),
          },
        });

        // 持久化
        const readingId = genId();
        patchLastAgent({
          status: 'done',
          readingId,
          retry: null,
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
          patchLastAgent({ status: 'error', error: '已停止生成', retry: null });
          return;
        }
        patchLastAgent({ status: 'error', error: getErrorMessage(err), retry: null });
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
      const lastAgent = [...snapshot.messages].reverse().find((m) => m.role === 'agent');
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
              patchFollowUp(followUp.id, (prev) => ({ error: prev.error ?? msg })),
            onRetry: (attempt, max) =>
              patchFollowUp(followUp.id, { retry: { attempt, max } }),
          },
        });

        patchFollowUp(followUp.id, {
          status: 'done',
          retry: null,
          notice: result.truncated ? '回复因输出长度限制被截断。' : null,
        });

        // 持久化追问
        if (lastAgent.readingId) {
          persistFollowUpsForAgent(targetAgentId);
        }
      } catch (err) {
        if (err instanceof LLMError && err.info.code === 'ABORTED') {
          patchFollowUp(followUp.id, { status: 'error', error: '已停止生成', retry: null });
          return;
        }
        patchFollowUp(followUp.id, { status: 'error', error: getErrorMessage(err), retry: null });
      } finally {
        setIsRunning(false);
        if (activeAbortRef.current === controller) {
          activeAbortRef.current = null;
        }
      }
    },
    [
      isRunning,
      createController,
      patchFollowUp,
      commit,
      findOriginalQuestion,
      persistFollowUpsForAgent,
    ],
  );

  // ── 重新生成首轮回复 ─────────────────────────────────────

  const regenerateAgentMessage = useCallback(
    async (agentId: string, apiConfig: ApiConfig): Promise<void> => {
      if (isRunning) return;

      const target = snapshot.messages.find(
        (message) => message.role === 'agent' && message.id === agentId,
      );
      if (!target || target.role !== 'agent') return;

      const originalQuestion = findOriginalQuestion(agentId);
      if (!originalQuestion) return;

      const previousContent = target.content;
      const existingReadingId = target.readingId;
      const canReuseReading = Boolean(target.spread && target.drawnCards.length > 0);

      patchAgent(agentId, {
        content: '',
        status: 'running',
        error: null,
        notice: null,
        retry: null,
        ...(canReuseReading ? {} : {
          spread: null,
          spreadReason: '',
          drawnCards: [],
          readingId: null,
        }),
      });
      setIsRunning(true);

      const controller = createController();

      try {
        if (target.spread && target.drawnCards.length > 0) {
          const result = await rerunAgentInterpretation({
            question: originalQuestion,
            spread: target.spread,
            drawnCards: target.drawnCards,
            previousInterpretation: previousContent,
            apiConfig,
            signal: controller.signal,
            callbacks: {
              onContent: (chunk) =>
                patchAgent(agentId, (prev) => ({ content: prev.content + chunk })),
              onThinking: (chunk) =>
                patchAgent(agentId, (prev) => ({ content: prev.content + chunk })),
              onStreamError: (msg) =>
                patchAgent(agentId, (prev) => ({ error: prev.error ?? msg })),
              onRetry: (attempt, max) =>
                patchAgent(agentId, { retry: { attempt, max } }),
            },
          });

          if (existingReadingId) {
            updateReadingInterpretation(existingReadingId, result.interpretation);
            patchAgent(agentId, {
              status: 'done',
              notice: result.truncated ? '回复因输出长度限制被截断。' : null,
            });
          } else {
            const readingId = genId();
            const reading: Reading = {
              id: readingId,
              question: originalQuestion,
              spread: target.spread,
              drawnCards: target.drawnCards,
              interpretation: result.interpretation,
              createdAt: new Date(),
            };
            saveReading(reading);
            patchAgent(agentId, {
              status: 'done',
              readingId,
              notice: result.truncated ? '回复因输出长度限制被截断。' : null,
            });
          }
          return;
        }

        const result = await runAgentTurn({
          question: originalQuestion,
          apiConfig,
          signal: controller.signal,
          callbacks: {
            onSpreadChosen: ({ spread, reason }) =>
              patchAgent(agentId, { spread, spreadReason: reason }),
            onCardsDrawn: ({ drawnCards }) => patchAgent(agentId, { drawnCards }),
            onContent: (chunk) =>
              patchAgent(agentId, (prev) => ({ content: prev.content + chunk })),
            onThinking: (chunk) =>
              patchAgent(agentId, (prev) => ({ content: prev.content + chunk })),
            onStreamError: (msg) =>
              patchAgent(agentId, (prev) => ({ error: prev.error ?? msg })),
            onRetry: (attempt, max) =>
              patchAgent(agentId, { retry: { attempt, max } }),
          },
        });

        const readingId = genId();
        const reading: Reading = {
          id: readingId,
          question: originalQuestion,
          spread: result.spread,
          drawnCards: result.drawnCards,
          interpretation: result.interpretation,
          createdAt: new Date(),
        };
        saveReading(reading);
        patchAgent(agentId, {
          status: 'done',
          readingId,
          notice: result.truncated
            ? '解读内容因模型输出长度限制被截断，已显示部分内容。'
            : null,
        });
      } catch (err) {
        if (err instanceof LLMError && err.info.code === 'ABORTED') {
          patchAgent(agentId, { status: 'error', error: '已停止生成' });
          return;
        }
        patchAgent(agentId, { status: 'error', error: getErrorMessage(err) });
      } finally {
        patchAgent(agentId, { retry: null });
        setIsRunning(false);
        if (activeAbortRef.current === controller) {
          activeAbortRef.current = null;
        }
      }
    },
    [isRunning, createController, findOriginalQuestion, patchAgent],
  );

  // ── 重新生成追问回复 ─────────────────────────────────────

  const regenerateFollowUp = useCallback(
    async (agentId: string, followUpId: string, apiConfig: ApiConfig): Promise<void> => {
      if (isRunning) return;

      const agent = snapshot.messages.find(
        (message) => message.role === 'agent' && message.id === agentId,
      );
      if (
        !agent ||
        agent.role !== 'agent' ||
        !agent.spread ||
        !agent.content
      ) {
        return;
      }

      const followUp = agent.followUps.find((fu) => fu.id === followUpId);
      const originalQuestion = findOriginalQuestion(agentId);
      if (!followUp || !originalQuestion) return;

      const previousFollowUpInterpretation = followUp.interpretation;
      const canReuseDecision =
        followUp.decision !== null &&
        (followUp.decision === 'direct' || followUp.additionalCards.length > 0);

      patchFollowUp(followUpId, {
        status: 'running',
        error: null,
        notice: null,
        retry: null,
        interpretation: '',
        ...(canReuseDecision ? {} : {
          decision: null,
          drawCount: 0,
          reason: '',
          additionalCards: [],
        }),
      });
      setIsRunning(true);

      const controller = createController();

      try {
        if (canReuseDecision && followUp.decision) {
          const result = await rerunFollowUpInterpretation({
            originalQuestion,
            spread: agent.spread,
            drawnCards: agent.drawnCards,
            previousInterpretation: agent.content,
            followUpQuestion: followUp.question,
            decision: followUp.decision,
            additionalCards: followUp.additionalCards,
            previousFollowUpInterpretation,
            apiConfig,
            signal: controller.signal,
            callbacks: {
              onContent: (chunk) =>
                patchFollowUp(followUpId, (prev) => ({
                  interpretation: prev.interpretation + chunk,
                })),
              onThinking: (chunk) =>
                patchFollowUp(followUpId, (prev) => ({
                  interpretation: prev.interpretation + chunk,
                })),
              onStreamError: (msg) =>
                patchFollowUp(followUpId, (prev) => ({ error: prev.error ?? msg })),
              onRetry: (attempt, max) =>
                patchFollowUp(followUpId, { retry: { attempt, max } }),
            },
          });

          patchFollowUp(followUpId, {
            status: 'done',
            notice: result.truncated ? '回复因输出长度限制被截断。' : null,
          });
          persistFollowUpsForAgent(agentId);
          return;
        }

        const result = await runFollowUpTurn({
          originalQuestion,
          spread: agent.spread,
          drawnCards: agent.drawnCards,
          previousInterpretation: agent.content,
          followUpQuestion: followUp.question,
          apiConfig,
          signal: controller.signal,
          callbacks: {
            onDecided: (decision, drawCount, reason) =>
              patchFollowUp(followUpId, { decision, drawCount, reason }),
            onSupplementaryCards: (cards) =>
              patchFollowUp(followUpId, { additionalCards: cards }),
            onContent: (chunk) =>
              patchFollowUp(followUpId, (prev) => ({
                interpretation: prev.interpretation + chunk,
              })),
            onThinking: (chunk) =>
              patchFollowUp(followUpId, (prev) => ({
                interpretation: prev.interpretation + chunk,
              })),
            onStreamError: (msg) =>
              patchFollowUp(followUpId, (prev) => ({ error: prev.error ?? msg })),
            onRetry: (attempt, max) =>
              patchFollowUp(followUpId, { retry: { attempt, max } }),
          },
        });

        patchFollowUp(followUpId, {
          status: 'done',
          notice: result.truncated ? '回复因输出长度限制被截断。' : null,
        });
        persistFollowUpsForAgent(agentId);
      } catch (err) {
        if (err instanceof LLMError && err.info.code === 'ABORTED') {
          patchFollowUp(followUpId, { status: 'error', error: '已停止生成' });
          return;
        }
        patchFollowUp(followUpId, { status: 'error', error: getErrorMessage(err) });
      } finally {
        patchFollowUp(followUpId, { retry: null });
        setIsRunning(false);
        if (activeAbortRef.current === controller) {
          activeAbortRef.current = null;
        }
      }
    },
    [
      isRunning,
      createController,
      findOriginalQuestion,
      patchFollowUp,
      persistFollowUpsForAgent,
    ],
  );

  // ── 重置 ───────────────────────────────────────────────

  const reset = useCallback(() => {
    cancel();
    commit(() => []);
    setIsRunning(false);
    clearChat();
  }, [cancel, commit]);

  return {
    messages,
    isHydrated,
    isRunning,
    sendQuestion,
    askFollowUp,
    regenerateAgentMessage,
    regenerateFollowUp,
    cancel,
    reset,
  };
}
