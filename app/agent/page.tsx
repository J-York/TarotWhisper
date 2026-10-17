'use client';

import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';

import { TarotCardComponent } from '@/components/TarotCard';
import { Interpretation } from '@/components/Interpretation';
import { useSettingsDialog } from '@/components/AppShell';
import { useAgentChat } from '@/hooks/useAgentChat';
import { useApiConfig } from '@/hooks/useApiConfig';
import type {
  AgentMessage,
  ChatMessage,
  FollowUpMessage,
} from '@/hooks/useAgentChat';
import type { DrawnCard, Spread } from '@/lib/tarot/types';

const SUGGESTIONS = [
  { glyph: '☾', label: '事业', question: '我最近的事业发展会顺利吗？' },
  { glyph: '✦', label: '关系', question: '我和 Ta 的关系未来会怎样？' },
  { glyph: '◇', label: '选择', question: '面对眼前的选择，我该如何决定？' },
  { glyph: '⊹', label: '当下', question: '请给我一个关于当下的指引。' },
];

export default function AgentPage(): ReactElement {
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
  const { config, isLoaded, canUseApi } = useApiConfig();
  const { openSettings } = useSettingsDialog();
  const [draft, setDraft] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // 空会话时不滚动，否则首次进入会把页头推出视口
    if (messages.length === 0) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const hasConversation = messages.length > 0;

  const handleSend = (): void => {
    const text = draft.trim();
    if (!text || isRunning || !canUseApi) return;
    const lastAgent = [...messages].reverse().find((m) => m.role === 'agent');
    if (lastAgent && lastAgent.role === 'agent' && lastAgent.status === 'done') {
      askFollowUp(text, config);
    } else {
      sendQuestion(text, config);
    }
    setDraft('');
  };

  const handleSuggestion = (question: string): void => {
    if (isRunning || !canUseApi) return;
    sendQuestion(question, config);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <main id="main-content" className="page-container page-main pb-40">
      {/* ─── 页头 ─── */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Oracle Chat</p>
          <h1 className="page-title mt-3">神谕对话</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-bone-faint">
            提出问题，神谕会自行选择牌阵、抽牌，并把牌面与解读一起交给你。
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasConversation && (
            <button
              type="button"
              onClick={reset}
              disabled={isRunning}
              className="btn-ink h-10 px-4 text-sm"
            >
              新的对话
            </button>
          )}
        </div>
      </header>

      {isLoaded && !canUseApi && (
        <div className="surface mt-6 flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <p className="text-sm text-bone-dim">
            <span className="mr-2 text-gold-dim" aria-hidden>◇</span>
            尚未配置 API 密钥，神谕暂时无法开口。
          </p>
          <button type="button" onClick={openSettings} className="btn-ink-primary h-9 px-4 text-sm">
            去配置
          </button>
        </div>
      )}

      <div className="mx-auto mt-8 w-full max-w-3xl">
        {!hasConversation && (
          <section className="anim-veil-rise">
            <div className="surface p-6 md:p-8">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full border border-[var(--gold-faint)] bg-[rgba(210,178,116,0.08)] text-gold">
                  ✦
                </span>
                <div>
                  <p className="font-heading text-lg text-bone">直接说出你的问题</p>
                  <p className="mt-0.5 text-xs text-bone-faint">
                    无需选牌与洗牌 · 神谕会自动完成全部步骤
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.question}
                    type="button"
                    onClick={() => handleSuggestion(s.question)}
                    disabled={isRunning || !canUseApi}
                    className="group flex items-center gap-3 rounded-lg border border-[var(--ink-line)] bg-[rgba(20,16,34,0.4)] px-4 py-3 text-left transition-colors hover:border-[var(--gold-faint)] hover:bg-[rgba(210,178,116,0.06)] disabled:opacity-50"
                  >
                    <span className="text-gold-dim transition-colors group-hover:text-gold" aria-hidden>
                      {s.glyph}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[10px] tracking-[0.16em] text-bone-faint">{s.label}</span>
                      <span className="block truncate text-sm text-bone">{s.question}</span>
                    </span>
                    <span className="text-bone-faint transition-transform group-hover:translate-x-0.5" aria-hidden>
                      →
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { t: '自动选阵', d: '依据问题性质挑选最合适的牌阵' },
                { t: '连续追问', d: '需要时会补抽牌，再给出新的解读' },
                { t: '随时停止', d: '生成中可以停止，已完成的内容会保留' },
              ].map((f) => (
                <div key={f.t} className="surface-soft px-4 py-3.5">
                  <p className="text-sm text-bone">{f.t}</p>
                  <p className="mt-1 text-xs leading-relaxed text-bone-faint">{f.d}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-col gap-10">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isRunning={isRunning}
              canUseApi={canUseApi}
              onRegenerateAgent={(agentId) => regenerateAgentMessage(agentId, config)}
              onRegenerateFollowUp={(agentId, followUpId) =>
                regenerateFollowUp(agentId, followUpId, config)
              }
            />
          ))}
        </div>

        <div ref={bottomRef} />
      </div>

      {/* ─── 输入区 ─── */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-[var(--ink-line)] bg-[var(--ink-deep)]/92 backdrop-blur-xl md:bottom-0">
        <div className="page-container py-3.5">
          <div className="mx-auto w-full max-w-3xl">
            <div className="field-shell flex items-end gap-2 p-2 pl-4">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  hasConversation
                    ? '继续追问，或换个角度再问…'
                    : '说出你的疑问，神谕为你解牌…'
                }
                disabled={isRunning}
                rows={1}
                className="input-ink-bare max-h-32 flex-1 resize-none py-2 text-[15px] leading-relaxed disabled:opacity-50"
                style={{ minHeight: '2.25rem' }}
                spellCheck={false}
              />              {isRunning ? (
                <button type="button" onClick={cancel} className="btn-ink h-9 px-4 text-sm">
                  停止
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!draft.trim() || !canUseApi}
                  aria-label="发送"
                  className="btn-ink-primary h-9 w-9 shrink-0 !px-0"
                >
                  <span aria-hidden className="text-base">↑</span>
                </button>
              )}
            </div>
            <div className="mt-1.5 flex items-center justify-between px-1">
              <span className="text-[11px] text-bone-whisper">Enter 发送 · Shift + Enter 换行</span>
              {isLoaded && !canUseApi && (
                <button
                  type="button"
                  onClick={openSettings}
                  className="text-[11px] text-gold-warm hover:underline"
                >
                  配置 API
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ─── 消息 ─── */

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
}: MessageBubbleProps): ReactElement {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end anim-veil-rise">
        <div className="max-w-[85%] md:max-w-[75%]">
          <p className="mb-1.5 mr-1 text-right text-[11px] tracking-[0.12em] text-celestial">你</p>
          <div className="chat-bubble-user px-4 py-3">
            <p className="whitespace-pre-wrap font-body text-[15px] leading-relaxed text-bone md:text-base">
              {message.content}
            </p>
          </div>
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
}: AgentBubbleProps): ReactElement {
  const cardTerms = useCardTerms(message.drawnCards);
  const positionTerms = usePositionTerms(message.spread);
  const canRegenerate =
    !isRunning && canUseApi && (message.status === 'done' || message.status === 'error');

  return (
    <article className="anim-veil-rise">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="grid h-7 w-7 place-items-center rounded-full border border-[var(--gold-faint)] text-[11px] text-gold">
          ✦
        </span>
        <span className="text-xs tracking-[0.14em] text-gold-dim">神谕</span>
        <span className="h-px flex-1 bg-[var(--ink-line)]" />
      </div>

      <div className="surface-soft overflow-hidden">
        {message.spread && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-[var(--ink-line)] bg-[rgba(210,178,116,0.05)] px-5 py-3.5">
            <span className="text-[10px] tracking-[0.16em] text-gold-dim">选定牌阵</span>
            <span className="font-heading text-sm text-bone">
              {message.spread.nameCn}
              <span className="ml-2 text-[10px] text-bone-faint">{message.spread.name}</span>
            </span>
            {message.spreadReason && (
              <span className="w-full text-xs leading-relaxed text-bone-faint">
                {message.spreadReason}
              </span>
            )}
          </div>
        )}

        {message.drawnCards.length > 0 && (
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-7 border-b border-[var(--ink-line)] px-4 py-7">
            {message.drawnCards.map((drawn, index) => (
              <CardAutoReveal key={drawn.position.id} drawn={drawn} delay={index * 160} />
            ))}
          </div>
        )}

        <div className="px-5 py-6 md:px-7">
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
            <div className="mt-5 flex justify-end border-t border-[var(--ink-line)] pt-4">
              <button
                type="button"
                onClick={() => onRegenerate(message.id)}
                className="btn-ink-ghost text-xs"
              >
                重新生成
              </button>
            </div>
          )}
        </div>

        {message.followUps.length > 0 && (
          <div className="flex flex-col gap-8 border-t border-[var(--ink-line)] bg-[rgba(10,8,18,0.35)] px-5 py-6 md:px-7">
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
        )}
      </div>
    </article>
  );
}

function CardAutoReveal({ drawn, delay }: { drawn: DrawnCard; delay: number }): ReactElement {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), delay + 120);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className="flex w-24 flex-col items-center gap-2">
      <span className="truncate text-[11px] tracking-[0.06em] text-bone-faint">
        {drawn.position.nameCn}
      </span>
      <TarotCardComponent
        card={drawn.card}
        isReversed={drawn.isReversed}
        isRevealed={revealed}
        size="sm"
        enableInteractions={false}
      />
      <div
        className={`text-center transition-all duration-500 ${
          revealed ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
        }`}
      >
        <p className="font-heading text-xs text-gold-warm">{drawn.card.nameCn}</p>
        {drawn.isReversed && <p className="mt-0.5 text-[10px] text-bone-faint">逆位</p>}
      </div>
    </div>
  );
}

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
}: FollowUpBlockProps): ReactElement {
  const canRegenerate =
    !isRunning && canUseApi && (fu.status === 'done' || fu.status === 'error');

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-[var(--celestial-faint)] bg-[rgba(139,159,212,0.04)] p-4">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 text-xs text-celestial" aria-hidden>
          ◆
        </span>
        <div className="min-w-0">
          <span className="text-[10px] tracking-[0.16em] text-celestial">追问</span>
          <p className="mt-1 font-body text-sm leading-relaxed text-bone">{fu.question}</p>
        </div>
      </div>

      {fu.additionalCards.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {fu.additionalCards.map((drawn, index) => (
            <CardAutoReveal key={drawn.position.id} drawn={drawn} delay={index * 160} />
          ))}
        </div>
      )}

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
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onRegenerate(agentId, fu.id)}
            className="btn-ink-ghost text-xs"
          >
            重新生成
          </button>
        </div>
      )}
    </section>
  );
}

function useCardTerms(drawnCards: DrawnCard[]): string[] {
  return useMemo(() => drawnCards.flatMap((d) => [d.card.nameCn, d.card.name]), [drawnCards]);
}

function usePositionTerms(spread: Spread | null): string[] {
  return useMemo(() => (spread ? spread.positions.map((p) => p.nameCn) : []), [spread]);
}
