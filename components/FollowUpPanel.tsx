'use client';

import { useMemo } from 'react';
import { FollowUp, ApiConfig } from '@/lib/tarot/types';
import { TarotCardComponent } from '@/components/TarotCard';
import { InterpretationBody } from '@/components/Interpretation';

interface FollowUpPanelProps {
  followUp: FollowUp;
  apiConfig: ApiConfig;
  /** 主占卜已抽牌的名称，供金色关键词高亮 */
  baseCardTerms?: string[];
  /** 主占卜阵位名称，供月雾色关键词高亮 */
  basePositionTerms?: string[];
  onRevealNext: (id: string, config: ApiConfig) => void;
  onRevealAll: (id: string, config: ApiConfig) => void;
  onRetry: (id: string, config: ApiConfig) => void;
}

export function FollowUpPanel({
  followUp,
  apiConfig,
  baseCardTerms,
  basePositionTerms,
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
    <section className="w-full max-w-4xl anim-veil-rise">
      {/* ─── 追问标头 ─── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-gold-dim text-base">◆</span>
          <span className="cn-label text-gold-dim">追 问</span>
          <div className="rule-h-fade flex-1" />
        </div>
        <p className="font-body italic-soft text-bone text-lg leading-relaxed pl-7">
          {followUp.question}
        </p>
      </div>

      {/* ─── 决策态 · 思索中 ─── */}
      {status === 'deciding' && (
        <div className="flex items-center gap-4 pl-7 mb-4">
          <span className="text-gold-dim text-sm anim-whisper">✦</span>
          <span className="cn-label text-bone-dim">神 谕 沉 吟</span>
          <span className="flex gap-1.5 items-center">
            <span className="w-1 h-1 bg-[var(--gold-dim)] rounded-full anim-whisper" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 bg-[var(--gold-dim)] rounded-full anim-whisper" style={{ animationDelay: '400ms' }} />
            <span className="w-1 h-1 bg-[var(--gold-dim)] rounded-full anim-whisper" style={{ animationDelay: '800ms' }} />
          </span>
        </div>
      )}

      {/* ─── 索要补充牌 ─── */}
      {decision === 'draw' && (
        <div className="ink-panel-quiet p-7 mb-8 anim-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-gold-dim">◇</span>
            <span className="cn-label text-bone">神 谕 索 要 {additionalCards.length} 张 补 充 指 引</span>
          </div>
          {reason && (
            <p className="font-body italic-soft text-bone-dim text-base leading-relaxed mb-6">
              {reason}
            </p>
          )}

          {/* 补充牌网格 */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-10">
            {additionalCards.map((drawn, idx) => (
              <div key={drawn.position.id} className="flex flex-col items-center gap-3 group relative">
                <span
                  className="absolute -top-7 cn-label text-bone-faint opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{ transitionTimingFunction: 'var(--ease-veil)' }}
                >
                  {drawn.position.nameCn}
                </span>
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
              </div>
            ))}
          </div>

          {/* 全部翻开按钮 */}
          {status === 'awaiting-reveal' && revealedCount < additionalCards.length && (
            <div className="mt-7 flex justify-center">
              <button
                onClick={() => onRevealAll(followUp.id, apiConfig)}
                className="btn-ink px-8 py-2.5"
              >
                全 部 翻 开
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── 解读流式区 ─── */}
      {(status === 'interpreting' || status === 'done') && interpretation && (
        <div className="ink-panel-quiet p-8 md:p-12 mb-4">
          <InterpretationBody
            content={interpretation}
            streaming={status === 'interpreting'}
            cardTerms={cardTerms}
            positionTerms={positionTerms}
            showSigil={status === 'done'}
          />
        </div>
      )}

      {/* ─── 解读等待态 ─── */}
      {status === 'interpreting' && !interpretation && (
        <div className="ink-panel-quiet p-12 flex items-center justify-center gap-4 mb-4">
          <span className="text-gold-dim anim-whisper">✦</span>
          <span className="cn-label text-bone-dim">正 在 通 灵</span>
        </div>
      )}

      {/* ─── 错误态 ─── */}
      {status === 'error' && (
        <div className="ink-panel-quiet p-8 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-gold-dim">◇</span>
            <span className="cn-label text-bone">连 接 已 断</span>
          </div>
          <p className="font-body italic-soft text-bone-dim text-base mb-6">
            {error ?? '追问失败'}
          </p>
          {decision && (
            <button
              onClick={() => onRetry(followUp.id, apiConfig)}
              className="btn-ink-ghost"
            >
              重 试
            </button>
          )}
        </div>
      )}
    </section>
  );
}
