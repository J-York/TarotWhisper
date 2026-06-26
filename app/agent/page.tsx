'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { TarotCardComponent } from '@/components/TarotCard';
import { Interpretation } from '@/components/Interpretation';
import { ApiSettings } from '@/components/ApiSettings';
import { useAgentChat } from '@/hooks/useAgentChat';
import { useApiConfig } from '@/hooks/useApiConfig';
import type {
  AgentMessage,
  ChatMessage,
  FollowUpMessage,
} from '@/hooks/useAgentChat';
import type { DrawnCard, Spread } from '@/lib/tarot/types';

export default function AgentPage() {
  const {
    messages,
    isRunning,
    sendQuestion,
    askFollowUp,
    regenerateAgentMessage,
    regenerateFollowUp,
    cancel,
    reset,
  } = useAgentChat();
  const { config, isLoaded, canUseApi, saveConfig } = useApiConfig();
  const [showSettings, setShowSettings] = useState(false);
  const [draft, setDraft] = useState('');

  // 消息列表底部锚定 · 新消息或流式更新时自动滚动到底部
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const hasConversation = messages.length > 0;

  const handleSend = (): void => {
    const text = draft.trim();
    if (!text || isRunning || !canUseApi) return;
    // 有首轮解读后，输入视为追问；否则视为首轮提问
    const lastAgent = [...messages].reverse().find((m) => m.role === 'agent');
    if (lastAgent && lastAgent.role === 'agent' && lastAgent.status === 'done') {
      askFollowUp(text, config);
    } else {
      sendQuestion(text, config);
    }
    setDraft('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    // Enter 发送，Shift+Enter 换行
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── Header ─── */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-5 md:px-10 py-7 bg-gradient-to-b from-[var(--ink-deep)] via-[var(--ink-deep)]/85 to-transparent pointer-events-none">
        <Link
          href="/"
          className="pointer-events-auto flex items-center gap-4 text-bone-dim hover:text-bone transition-colors duration-500 group"
          style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
        >
          <span
            className="text-base group-hover:-translate-x-1 transition-transform duration-700"
            style={{ transitionTimingFunction: 'var(--ease-veil)' }}
          >
            ←
          </span>
          <span className="cn-nav">离 开</span>
        </Link>
        <span className="cn-nav text-gold-dim hidden md:block pointer-events-auto">
          神 谕 · 对 话
        </span>
        <div className="flex items-center gap-5 md:gap-9 pointer-events-auto">
          <Link
            href="/history"
            className="cn-nav text-bone-dim hover:text-bone transition-colors duration-500"
            style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
          >
            轨 迹
          </Link>
          <button
            onClick={() => setShowSettings(true)}
            className="cn-nav text-bone-dim hover:text-bone transition-colors duration-500"
            style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
          >
            配 置
          </button>
        </div>
      </header>

      {/* ─── 对话区 ─── */}
      <main
        id="main-content"
        ref={scrollContainerRef}
        className="flex-1 flex flex-col px-4 md:px-8 pt-28 pb-44"
      >
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-10">
          {!hasConversation && (
            <WelcomeBlock
              isLoaded={isLoaded}
              canUseApi={canUseApi}
              onPick={(q) => {
                setDraft(q);
              }}
            />
          )}

          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isRunning={isRunning}
              canUseApi={canUseApi}
              onRegenerateAgent={(agentId) => {
                regenerateAgentMessage(agentId, config);
              }}
              onRegenerateFollowUp={(agentId, followUpId) => {
                regenerateFollowUp(agentId, followUpId, config);
              }}
            />
          ))}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* ─── 输入区 ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-[var(--ink-deep)] via-[var(--ink-deep)]/95 to-transparent pt-10 pb-6 px-4 md:px-8">
        <div className="w-full max-w-3xl mx-auto">
          {isLoaded && !canUseApi && (
            <p className="text-center cn-hint text-gold-dim mb-3">
              <span className="mr-2">◇</span>
              请先于「配置」中设置 API 密钥
            </p>
          )}
          <div className="ink-panel-quiet flex items-end gap-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                hasConversation
                  ? '继续追问，或换个角度再问…'
                  : '说出你心中的疑问，让神谕为你选牌解读…'
              }
              disabled={isRunning}
              rows={1}
              className="input-ink-bare flex-1 max-h-32 px-7 py-5 text-base text-bone resize-none font-body leading-relaxed"
              style={{ minHeight: '3.5rem' }}
              spellCheck={false}
            />
            <div className="flex items-center gap-3 pr-4 pb-3">
              {isRunning ? (
                <button onClick={cancel} className="btn-ink-ghost px-6 py-3">
                  停 止
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!draft.trim() || !canUseApi}
                  className="btn-ink-primary px-8 py-3 inline-flex items-center gap-3"
                >
                  <span>问</span>
                  <span className="text-xs">✦</span>
                </button>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center mt-3 px-2">
            <span className="cn-hint text-bone-whisper">
              Enter 发送 · Shift+Enter 换行
            </span>
            {hasConversation && !isRunning && (
              <button
                onClick={reset}
                className="cn-hint text-bone-whisper hover:text-gold-dim transition-colors duration-500"
                style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
              >
                新 的 对 话
              </button>
            )}
          </div>
        </div>
      </div>

      <ApiSettings
        config={config}
        onSave={saveConfig}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

// ─── 欢迎区 ───────────────────────────────────────────────

interface WelcomeBlockProps {
  isLoaded: boolean;
  canUseApi: boolean;
  onPick: (question: string) => void;
}

function WelcomeBlock({ isLoaded, canUseApi, onPick }: WelcomeBlockProps) {
  const suggestions = [
    '我最近的事业发展会顺利吗？',
    '我和 Ta 的关系未来会怎样？',
    '面对眼前的选择，我该如何决定？',
    '请给我一个关于当下的指引。',
  ];

  return (
    <div className="flex flex-col items-center text-center anim-veil-rise pt-8">
      <div className="anim-drift text-gold text-2xl mb-10 select-none" aria-hidden>
        ✦
      </div>
      <h1 className="font-display text-3xl md:text-4xl text-bone mb-3 tracking-[0.2em]">
        神 谕 · 对 话
      </h1>
      <div className="rule-h-gold w-20 my-6" />
      <p className="font-body italic-soft text-bone-faint text-base leading-relaxed mb-14 max-w-md">
        无需选牌、无需洗牌。只管提出疑问，神谕自会为你选阵、抽牌、解读。
      </p>

      {isLoaded && !canUseApi ? null : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
          {suggestions.map((q) => (
            <button
              key={q}
              onClick={() => onPick(q)}
              className="ink-panel-quiet px-5 py-4 text-left font-body text-sm text-bone-dim hover:text-gold transition-colors duration-500"
              style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
            >
              <span className="text-gold-dim mr-2">◇</span>
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 消息气泡 ─────────────────────────────────────────────

interface MessageBubbleProps {
  message: ChatMessage;
  isRunning: boolean;
  canUseApi: boolean;
  onRegenerateAgent: (agentId: string) => void;
  onRegenerateFollowUp: (agentId: string, followUpId: string) => void;
}

function MessageBubble({
  message,
  isRunning,
  canUseApi,
  onRegenerateAgent,
  onRegenerateFollowUp,
}: MessageBubbleProps) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end anim-veil-rise">
        <div className="max-w-[85%] px-6 py-4 bg-[var(--ink-veil)] hairline rounded-sm">
          <p className="font-body text-bone text-base leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <AgentBubble
      message={message}
      isRunning={isRunning}
      canUseApi={canUseApi}
      onRegenerate={onRegenerateAgent}
      onRegenerateFollowUp={onRegenerateFollowUp}
    />
  );
}

// ─── Agent 气泡 ───────────────────────────────────────────

interface AgentBubbleProps {
  message: AgentMessage;
  isRunning: boolean;
  canUseApi: boolean;
  onRegenerate: (agentId: string) => void;
  onRegenerateFollowUp: (agentId: string, followUpId: string) => void;
}

function AgentBubble({
  message,
  isRunning,
  canUseApi,
  onRegenerate,
  onRegenerateFollowUp,
}: AgentBubbleProps) {
  // 术语提取必须在组件顶层无条件调用（rules-of-hooks）
  const cardTerms = useCardTerms(message.drawnCards);
  const positionTerms = usePositionTerms(message.spread);
  const canRegenerate =
    !isRunning &&
    canUseApi &&
    (message.status === 'done' || message.status === 'error');

  return (
    <div className="flex flex-col gap-6 anim-veil-rise">
      {/* 牌阵选择说明 */}
      {message.spread && (
        <div className="ink-panel-quiet px-6 py-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-gold text-sm">✦</span>
            <span className="cn-label text-gold-dim">为 你 选 定 牌 阵</span>
          </div>
          <div className="font-display text-bone text-lg tracking-[0.16em] mb-2">
            {message.spread.nameCn}
          </div>
          {message.spreadReason && (
            <p className="font-body italic-soft text-bone-faint text-sm leading-relaxed">
              {message.spreadReason}
            </p>
          )}
        </div>
      )}

      {/* 牌面展示 · 全自动翻开 */}
      {message.drawnCards.length > 0 && (
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-8 md:gap-x-8">
          {message.drawnCards.map((drawn, index) => (
            <CardAutoReveal
              key={drawn.position.id}
              drawn={drawn}
              delay={index * 220}
            />
          ))}
        </div>
      )}

      {/* 解读 */}
      {(message.content || message.status === 'running' || message.error) && (
        <Interpretation
          content={message.content}
          isLoading={message.status === 'running' && !message.content}
          error={message.error}
          notice={message.notice}
          retry={message.retry}
          staggerOnMount={false}
          cardTerms={cardTerms}
          positionTerms={positionTerms}
        />
      )}

      {canRegenerate && (
        <div className="flex justify-end -mt-3">
          <button
            type="button"
            onClick={() => onRegenerate(message.id)}
            className="cn-hint text-bone-whisper hover:text-gold-dim transition-colors duration-500"
            style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
          >
            重 新 生 成
          </button>
        </div>
      )}

      {/* 追问列表 */}
      {message.followUps.map((fu) => (
        <FollowUpBlock
          key={fu.id}
          agentId={message.id}
          followUp={fu}
          isRunning={isRunning}
          canUseApi={canUseApi}
          onRegenerate={onRegenerateFollowUp}
        />
      ))}
    </div>
  );
}

// ─── 自动翻牌（挂载后延时揭示） ───────────────────────────

function CardAutoReveal({ drawn, delay }: { drawn: DrawnCard; delay: number }) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), delay + 150);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="cn-label text-bone-faint">{drawn.position.nameCn}</span>
      <TarotCardComponent
        card={drawn.card}
        isReversed={drawn.isReversed}
        isRevealed={revealed}
        size="sm"
        enableInteractions={false}
      />
    </div>
  );
}

// ─── 追问块 ───────────────────────────────────────────────

interface FollowUpBlockProps {
  agentId: string;
  followUp: FollowUpMessage;
  isRunning: boolean;
  canUseApi: boolean;
  onRegenerate: (agentId: string, followUpId: string) => void;
}

function FollowUpBlock({
  agentId,
  followUp: fu,
  isRunning,
  canUseApi,
  onRegenerate,
}: FollowUpBlockProps) {
  const canRegenerate =
    !isRunning &&
    canUseApi &&
    (fu.status === 'done' || fu.status === 'error');

  return (
    <div className="flex flex-col gap-4 hairline-top pt-8 mt-2">
      {/* 追问问题 */}
      <div className="flex items-start gap-3">
        <span className="text-gold-dim text-sm mt-1">◆</span>
        <div>
          <span className="cn-label text-gold-dim block mb-1">追 问</span>
          <p className="font-body text-bone text-sm leading-relaxed">
            {fu.question}
          </p>
        </div>
      </div>

      {/* 补充牌 */}
      {fu.additionalCards.length > 0 && (
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-6">
          {fu.additionalCards.map((drawn, index) => (
            <CardAutoReveal
              key={drawn.position.id}
              drawn={drawn}
              delay={index * 220}
            />
          ))}
        </div>
      )}

      {/* 追问解读 */}
      {(fu.interpretation || fu.status === 'running' || fu.error) && (
        <Interpretation
          content={fu.interpretation}
          isLoading={fu.status === 'running' && !fu.interpretation}
          error={fu.error}
          notice={fu.notice}
          retry={fu.retry}
          staggerOnMount={false}
        />
      )}

      {canRegenerate && (
        <div className="flex justify-end -mt-1">
          <button
            type="button"
            onClick={() => onRegenerate(agentId, fu.id)}
            className="cn-hint text-bone-whisper hover:text-gold-dim transition-colors duration-500"
            style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
          >
            重 新 生 成
          </button>
        </div>
      )}
    </div>
  );
}

// ─── 术语提取（小型 memo hooks） ──────────────────────────

function useCardTerms(drawnCards: DrawnCard[]): string[] {
  return useMemo(
    () => drawnCards.flatMap((d) => [d.card.nameCn, d.card.name]),
    [drawnCards],
  );
}

function usePositionTerms(spread: Spread | null): string[] {
  return useMemo(
    () => (spread ? spread.positions.map((p) => p.nameCn) : []),
    [spread],
  );
}
