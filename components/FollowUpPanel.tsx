'use client';

import { useMemo } from 'react';
import { FollowUp, ApiConfig } from '@/lib/tarot/types';
import { TarotCardComponent } from '@/components/TarotCard';
import { InterpretationBody } from '@/components/Interpretation';
import type { RetryState } from '@/lib/api/stream-client';

interface FollowUpPanelProps {
  followUp: FollowUp;
  apiConfig: ApiConfig;
  /** 主占卜已抽牌的名称，供金色关键词高亮 */
  baseCardTerms?: string[];
  /** 主占卜阵位名称，供月雾色关键词高亮 */
  basePositionTerms?: string[];
  /** 自动重试的瞬时状态。非空时在等待态显示「正在重试 N/M」 */
  retry?: RetryState | null;
  onRevealNext: (id: string, config: ApiConfig) => void;
  onRevealAll: (id: string, config: ApiConfig) => void;
  onRetry: (id: string, config: ApiConfig) => void;
}

export function FollowUpPanel({
  followUp,
  apiConfig,
  baseCardTerms,
  basePositionTerms,
  retry,
  onRevealNext,
  onRevealAll,
  onRetry,
}: FollowUpPanelProps) {
  const { status, decision, reason, additionalCards, revealedCount, interpretation, error } = followUp;

  // 合并主占卜与追问补充牌的名称
  const cardTerms = useMemo<string[]>(
    () => [
      ...(baseCardTerms ?? []),
      ...additionalCards.flatMap((d) => [d.card.nameCn, d.card.name]),
    ],
    [baseCardTerms, additionalCards]
  );
  const positionTerms = useMemo<string[]>(
    () => [
      ...(basePositionTerms ?? []),
      ...additionalCards.map((d) => d.position.nameCn),
    ],
    [basePositionTerms, additionalCards]
  );

  return (
    <section className="anim-veil-rise rounded-xl border border-[var(--celestial-faint)] bg-[rgba(139,159,212,0.045)] p-4 md:p-5">
      {/* ─── 追问标头 ─── */}
      <div className="mb-3 flex items-start gap-2.5">
        <span className="mt-0.5 text-xs text-celestial" aria-hidden>◆</span>
        <div className="min-w-0">
          <span className="text-[10px] tracking-[0.16em] text-celestial">追问</span>
          <p className="mt-1 font-body text-[15px] leading-relaxed text-bone">{followUp.question}</p>
        </div>
      </div>

      {/* ─── 决策态 · 思索中 ─── */}
      {status === 'deciding' && (
        <div className="mb-2 flex items-center gap-2.5 rounded-lg bg-[rgba(255,255,255,0.03)] px-3.5 py-2.5">
          <span className="text-[11px] text-gold-dim anim-whisper" aria-hidden>✦</span>
          <span className="text-xs text-bone-dim">神谕正在决定是否需要补牌</span>
          <span className="ml-auto flex items-center gap-1" aria-hidden>
            <span className="h-1 w-1 rounded-full bg-[var(--gold-dim)] anim-whisper" style={{ animationDelay: '0ms' }} />
            <span className="h-1 w-1 rounded-full bg-[var(--gold-dim)] anim-whisper" style={{ animationDelay: '400ms' }} />
            <span className="h-1 w-1 rounded-full bg-[var(--gold-dim)] anim-whisper" style={{ animationDelay: '800ms' }} />
          </span>
        </div>
      )}

      {/* ─── 索要补充牌 ─── */}
      {decision === 'draw' && (
        <div className="mb-3 rounded-lg border border-[var(--ink-line)] bg-[rgba(20,16,34,0.45)] p-4 anim-fade-in">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-[11px] text-gold-dim" aria-hidden>◇</span>
            <span className="text-xs tracking-[0.08em] text-bone">
              补抽 {additionalCards.length} 张牌
            </span>
          </div>
          {reason && (
            <p className="mb-4 text-xs leading-relaxed text-bone-faint">{reason}</p>
          )}

          <div className="flex flex-wrap gap-x-5 gap-y-6">
            {additionalCards.map((drawn, idx) => (
              <div key={drawn.position.id} className="flex w-24 flex-col items-center gap-2">
                <span className="text-[11px] text-bone-faint">{drawn.position.nameCn}</span>
                <TarotCardComponent
                  card={drawn.card}
                  isReversed={drawn.isReversed}
                  isRevealed={idx < revealedCount}
                  onClick={() => {
                    if (status === 'awaiting-reveal' && idx === revealedCount) {
                      onRevealNext(followUp.id, apiConfig);
                    }
                  }}
                  size="sm"
                />
                <span
                  className={`text-center font-heading text-[11px] text-gold-warm transition-opacity duration-500 ${
                    idx < revealedCount ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {drawn.card.nameCn}
                </span>
              </div>
            ))}
          </div>

          {status === 'awaiting-reveal' && revealedCount < additionalCards.length && (
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--ink-line)] pt-3">
              <span className="text-[11px] text-bone-faint">
                已翻开 {revealedCount} / {additionalCards.length} 张
              </span>
              <button
                onClick={() => onRevealAll(followUp.id, apiConfig)}
                className="btn-ink h-8 px-3.5 text-xs"
              >
                全部翻开
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── 解读流式区 ─── */}
      {(status === 'interpreting' || status === 'done') && interpretation && (
        <div className="rounded-lg border border-[var(--ink-line)] bg-[rgba(20,16,34,0.35)] p-4 md:p-5">
          <InterpretationBody
            content={interpretation}
            streaming={status === 'interpreting'}
            cardTerms={cardTerms}
            positionTerms={positionTerms}
            showSigil={status === 'done'}
          />
          {/* 非致命警示（如截断）· 完成态但 error 非空时显示 */}
          {status === 'done' && error && (
            <div className="mt-5 rounded-md border-l-2 border-[var(--gold-dim)] bg-[rgba(210,178,116,0.05)] px-3 py-2 anim-fade-in">
              <p className="text-xs leading-relaxed text-bone-faint">
                <span className="mr-1.5 text-gold-dim" aria-hidden>◇</span>
                {error}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── 解读等待态 ─── */}
      {status === 'interpreting' && !interpretation && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-[var(--ink-line)] bg-[rgba(20,16,34,0.35)] px-4 py-8">
          <span className="text-sm text-gold-dim anim-whisper" aria-hidden>✦</span>
          <span className="text-xs tracking-[0.12em] text-bone-dim">
            {retry ? '连接中断 · 正在重试' : '正在解读'}
          </span>
          {retry && (
            <span className="text-[11px] text-bone-faint">
              {retry.attempt} / {retry.max}
            </span>
          )}
        </div>
      )}

      {/* ─── 错误态 ─── */}
      {status === 'error' && (
        <div className="rounded-lg border border-[rgba(210,178,116,0.28)] bg-[rgba(210,178,116,0.05)] p-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gold-dim" aria-hidden>◇</span>
            <span className="text-xs tracking-[0.08em] text-bone">追问失败</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-bone-dim">{error ?? '请稍后重试'}</p>
          {decision && (
            <button
              onClick={() => onRetry(followUp.id, apiConfig)}
              className="btn-ink mt-3 h-8 px-3.5 text-xs"
            >
              重试
            </button>
          )}
        </div>
      )}
    </section>
  );
}
