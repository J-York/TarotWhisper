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

  // 欢迎区建议签 · 点选即直接发问
  const handleSuggestion = (question: string): void => {
    if (isRunning || !canUseApi) return;
    sendQuestion(question, config);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    // Enter 发送，Shift+Enter 换行
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* ─── 漂浮符印 · 全局氛围层 ─── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden>
        <span className="scatter-symbol text-2xl top-[16%] left-[5%] anim-drift" style={{ animationDelay: '2s' }}>✧</span>
        <span className="scatter-symbol text-3xl top-[62%] right-[4%] anim-drift" style={{ animationDelay: '5s' }}>☾</span>
        <span className="scatter-symbol text-lg top-[38%] right-[14%] anim-twinkle" style={{ animationDelay: '1s' }}>⋆</span>
        <span className="scatter-symbol text-xl bottom-[16%] left-[20%] anim-whisper">⊹</span>
        <span className="scatter-symbol text-sm top-[8%] right-[38%] anim-twinkle" style={{ animationDelay: '2.6s' }}>✦</span>
      </div>

      {/* ─── Header · 离开 / 轨迹 / 配置 ─── */}
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-5 md:px-10 md:pl-16 py-7 bg-gradient-to-b from-[var(--ink-deep)] via-[var(--ink-deep)]/85 to-transparent pointer-events-none">
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
        className="relative z-10 flex-1 flex flex-col px-5 md:px-10 md:pl-16 pt-32 pb-48"
      >
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-16 md:gap-24">
          {!hasConversation && (
            <WelcomeBlock
              isLoaded={isLoaded}
              canUseApi={canUseApi}
              onPick={handleSuggestion}
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

      {/* ─── 输入区 · 一道线 + 一枚发送符印 ─── */}
      <div className="fixed bottom-0 inset-x-0 z-40 px-5 md:px-10 md:pl-16 pt-12 pb-6 bg-gradient-to-t from-[var(--ink-deep)] via-[var(--ink-deep)]/92 to-transparent">
        <div className="w-full max-w-4xl mx-auto">
          {isLoaded && !canUseApi && (
            <p className="cn-hint text-gold-dim mb-4">
              <span className="mr-2">◇</span>
              请先于「配置」中设置 API 密钥
            </p>
          )}
          <div
            className="flex items-end gap-5 border-b border-[var(--ink-line-strong)] pb-3 transition-colors duration-700 focus-within:border-[var(--gold-dim)]"
            style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
          >
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
              className="input-ink-bare flex-1 max-h-32 py-2 text-base md:text-lg text-bone resize-none font-body leading-relaxed disabled:opacity-40"
              style={{ minHeight: '2.5rem' }}
              spellCheck={false}
            />
            {isRunning ? (
              <button
                onClick={cancel}
                className="cn-nav text-bone-dim hover:text-gold transition-colors duration-500 pb-1"
                style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
              >
                停 止
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!draft.trim() || !canUseApi}
                aria-label="发送"
                className="group pb-0.5 disabled:opacity-25 disabled:cursor-not-allowed transition-opacity duration-500"
              >
                <span
                  className="block text-gold text-2xl leading-none transition-all duration-700 group-hover:text-gold-warm group-hover:rotate-90 group-hover:scale-110 group-active:scale-95"
                  style={{ transitionTimingFunction: 'var(--ease-veil)' }}
                >
                  ✦
                </span>
              </button>
            )}
          </div>
          <div className="flex justify-between items-center mt-3 px-1">
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

// ─── 欢迎区 · 非对称神谕前厅 ──────────────────────────────

interface WelcomeBlockProps {
  isLoaded: boolean;
  canUseApi: boolean;
  onPick: (question: string) => void;
}

/** 四支建议签 · 错落排布（移动端纵向 cascading，桌面端高低参差） */
const SUGGESTIONS: { glyph: string; num: string; question: string }[] = [
  { glyph: '☾', num: '壹', question: '我最近的事业发展会顺利吗？' },
  { glyph: '✦', num: '贰', question: '我和 Ta 的关系未来会怎样？' },
  { glyph: '◇', num: '叁', question: '面对眼前的选择，我该如何决定？' },
  { glyph: '⊹', num: '肆', question: '请给我一个关于当下的指引。' },
];

const CHIP_DROPS = ['md:mt-0', 'md:mt-14', 'md:mt-5', 'md:mt-20'];
const CHIP_SHIFTS = ['ml-0', 'ml-8', 'ml-3', 'ml-12'];

function WelcomeBlock({ isLoaded, canUseApi, onPick }: WelcomeBlockProps) {
  return (
    <section className="relative min-h-[82dvh] flex flex-col justify-center py-16 anim-veil-rise">
      {/* 散落的星象符印 */}
      <span className="scatter-symbol text-4xl top-[2%] right-[6%] anim-drift" aria-hidden>☾</span>
      <span className="scatter-symbol text-2xl top-[26%] right-[30%] anim-twinkle" style={{ animationDelay: '1.2s' }} aria-hidden>✧</span>
      <span className="scatter-symbol text-xl top-[55%] right-[10%] anim-whisper" aria-hidden>⊹</span>
      <span className="scatter-symbol text-3xl bottom-[10%] right-[36%] anim-drift" style={{ animationDelay: '3s' }} aria-hidden>✦</span>
      <span className="scatter-symbol text-lg top-[12%] left-[48%] anim-twinkle" style={{ animationDelay: '2s' }} aria-hidden>⋆</span>
      <span className="scatter-symbol text-base bottom-[28%] left-[8%] anim-whisper" style={{ animationDelay: '1.6s' }} aria-hidden>✶</span>

      {/* 竖金线 + 巨型标题 · 左对齐 */}
      <div className="flex items-stretch gap-6 md:gap-10">
        <div
          className="w-px self-stretch shrink-0"
          style={{
            background:
              'linear-gradient(to bottom, transparent, var(--gold-dim) 30%, var(--gold) 55%, transparent)',
          }}
          aria-hidden
        />
        <div className="flex flex-col">
          <span className="cn-label text-gold-dim mb-6 md:mb-8">
            ORACLE CHAMBER · 神 谕 之 殿
          </span>
          <h1 className="text-massive font-heading text-bone">
            神谕<span className="text-gold-dim"> · </span>对话
          </h1>
          <p className="font-heading text-tiny text-bone-faint mt-7">
            Ask, and the cards shall answer
          </p>
        </div>
      </div>

      {/* 描述 · 右移错位 */}
      <div className="mt-14 md:mt-16 md:ml-32 lg:ml-48 max-w-xl">
        <p className="font-body italic-soft text-bone-faint text-lg leading-loose">
          无需选牌、无需洗牌。
          <br />
          只管提出疑问，神谕自会为你选阵、抽牌、解读。
        </p>
      </div>

      {/* 建议签 · 高低错落 */}
      {isLoaded && !canUseApi ? null : (
        <div className="mt-16 md:mt-24 flex flex-col md:flex-row md:flex-wrap md:items-start gap-4 md:gap-6">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={s.question}
              onClick={() => onPick(s.question)}
              className={`group text-left hairline max-w-sm bg-transparent hover:bg-[var(--ink-veil)] hover:border-[var(--gold-faint)] px-6 py-5 transition-all duration-500 hover:-translate-y-1 ${CHIP_SHIFTS[i]} ${CHIP_DROPS[i]}`}
              style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
            >
              <span className="flex items-center gap-3 mb-3">
                <span className="text-gold-dim text-sm group-hover:text-gold transition-colors duration-500">
                  {s.glyph}
                </span>
                <span className="text-tiny font-heading text-bone-whisper">
                  签 · {s.num}
                </span>
              </span>
              <span className="block font-body text-sm text-bone-dim leading-relaxed group-hover:text-bone transition-colors duration-500">
                {s.question}
              </span>
              <span
                className="block mt-3 text-gold-dim text-xs opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500"
                style={{ transitionTimingFunction: 'var(--ease-veil)' }}
                aria-hidden
              >
                ⟶ 以此发问
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 底部低语提示 */}
      <p className="cn-hint text-bone-whisper mt-16 md:mt-24 md:ml-32 lg:ml-48">
        或 ， 直 接 在 下 方 写 下 你 的 疑 问
      </p>
    </section>
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
      <div className="flex flex-col items-end anim-veil-rise">
        <span className="text-tiny font-heading text-celestial mb-3 mr-1">
          你 · 问
        </span>
        <div className="chat-bubble-user max-w-[88%] md:max-w-[70%] px-7 py-5">
          <p className="font-body text-bone text-base md:text-lg leading-relaxed whitespace-pre-wrap">
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

// ─── Agent 气泡 · 神谕回应 ────────────────────────────────

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
    <div className="anim-veil-rise">
      {/* 称谓行 · 神谕开口 */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-gold text-sm anim-whisper" aria-hidden>
          ✦
        </span>
        <span className="text-tiny font-heading text-gold-dim">神 谕 · 回 应</span>
        <div className="flex-1 rule-h-fade" aria-hidden />
      </div>

      <div className="chat-bubble-oracle px-6 md:px-10 py-8 md:py-10 flex flex-col gap-10">
        {/* 牌阵选择说明 */}
        {message.spread && (
          <div className="ink-panel-ritual px-6 py-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-gold text-sm">✦</span>
              <span className="cn-label text-gold-dim">为 你 选 定 牌 阵</span>
            </div>
            <div className="font-heading text-bone text-lg tracking-[0.16em] mb-2">
              {message.spread.nameCn}
            </div>
            {message.spreadReason && (
              <p className="font-body italic-soft text-bone-faint text-sm leading-relaxed">
                {message.spreadReason}
              </p>
            )}
          </div>
        )}

        {/* 牌面展示 · 悬浮全自动翻开 */}
        {message.drawnCards.length > 0 && (
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-10 md:gap-x-12 py-2">
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
          <div className="flex justify-end -mt-4">
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
    </div>
  );
}

// ─── 自动翻牌（挂载后延时揭示 · 悬浮牌） ──────────────────

function CardAutoReveal({ drawn, delay }: { drawn: DrawnCard; delay: number }) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), delay + 150);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className="flex flex-col items-center gap-4">
      <span className="cn-label text-bone-faint">{drawn.position.nameCn}</span>
      <div className="float-card">
        <TarotCardComponent
          card={drawn.card}
          isReversed={drawn.isReversed}
          isRevealed={revealed}
          size="sm"
          enableInteractions={false}
        />
      </div>
      {/* 牌名 · 揭示后浮现 */}
      <div
        className={`text-center transition-all duration-1000 ${
          revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
        style={{ transitionTimingFunction: 'var(--ease-veil)' }}
      >
        <span className="font-display text-sm text-gold tracking-[0.18em]">
          {drawn.card.nameCn}
        </span>
        {drawn.isReversed && (
          <span className="text-tiny font-heading text-bone-faint block mt-1.5">
            逆 位
          </span>
        )}
      </div>
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
    <div className="flex flex-col gap-6 hairline-top pt-10 mt-2">
      {/* 追问问题 · 你的声音 */}
      <div className="flex items-start gap-4">
        <span className="text-celestial text-sm mt-1" aria-hidden>
          ◆
        </span>
        <div>
          <span className="text-tiny font-heading text-celestial block mb-2">
            追 问
          </span>
          <p className="font-body text-bone text-base leading-relaxed">
            {fu.question}
          </p>
        </div>
      </div>

      {/* 补充牌 */}
      {fu.additionalCards.length > 0 && (
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-8">
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
