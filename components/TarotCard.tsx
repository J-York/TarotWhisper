'use client';

import { useState } from 'react';
import { TarotCard } from '@/lib/tarot/types';

interface TarotCardProps {
  card: TarotCard;
  isReversed?: boolean;
  isRevealed?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function TarotCardComponent({
  card,
  isReversed = false,
  isRevealed = false,
  onClick,
  size = 'md',
}: TarotCardProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-24 h-40',
    md: 'w-48 h-80',
    lg: 'w-64 h-96',
  };

  // 翻牌后若为逆位，再叠加 180° 旋转
  const cardFaceTransform =
    isReversed && isRevealed
      ? 'rotateY(180deg) rotate(180deg)'
      : 'rotateY(180deg)';

  return (
    <div
      className={`relative ${sizeClasses[size]} cursor-pointer perspective-1000 group`}
      onClick={onClick}
    >
      <div
        className={`relative w-full h-full card-flip transform-style-3d ${
          isRevealed ? 'rotate-y-180' : ''
        }`}
      >
        {/* ─── 背面 · 极简墨色 ─── */}
        <div
          className={`absolute w-full h-full backface-hidden overflow-hidden bg-[var(--ink-void)] hairline ${
            !isRevealed ? 'group-hover:shadow-[0_0_24px_-12px_var(--gold-glow)]' : ''
          }`}
          style={{ transition: 'box-shadow 700ms var(--ease-veil)' }}
        >
          <div className="w-full h-full relative flex items-center justify-center">
            {/* 内框 · 0.5px 双层 */}
            <div className="absolute inset-2 hairline" />
            <div className="absolute inset-3.5 hairline-strong" />

            {/* 中央徽记 */}
            <div className="relative flex flex-col items-center gap-3 transition-transform duration-700 group-hover:scale-105"
                 style={{ transitionTimingFunction: 'var(--ease-veil)' }}>
              <span className="text-gold-dim text-2xl">✦</span>
              <span className="h-px w-10 bg-[var(--gold-faint)]" />
              <span className="font-display text-bone-faint text-[10px] tracking-veil uppercase">
                Tarot
              </span>
            </div>

            {/* 角部刻痕 */}
            <CornerTicks />
          </div>
        </div>

        {/* ─── 正面 · 揭示后金色光晕 ─── */}
        <div
          className={`absolute w-full h-full backface-hidden overflow-hidden bg-[var(--ink-void)] ${
            isRevealed ? 'card-revealed-halo' : 'hairline'
          }`}
          style={{ transform: cardFaceTransform }}
        >
          {!imageError ? (
            <div className="w-full h-full relative">
              <img
                src={card.image}
                alt={card.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
              {/* 底部渐隐 */}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink-void)]/85 via-transparent to-[var(--ink-void)]/30 pointer-events-none" />

              {/* 牌名 · 悬停显现 */}
              <div className="absolute bottom-0 w-full p-4 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                   style={{ transitionTimingFunction: 'var(--ease-veil)' }}>
                <div className="rule-h-gold w-8 mx-auto mb-2" />
                <h3 className="font-display text-bone text-base tracking-[0.2em]">
                  {card.nameCn}
                </h3>
                <p className="font-display text-[10px] tracking-veil text-gold-dim uppercase mt-1">
                  {card.name}
                </p>
              </div>
            </div>
          ) : (
            // 图片缺失的回落版面
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
              <div className="text-gold-dim text-2xl mb-4">
                {card.type === 'major' ? '✦' : getSuitSymbol(card.suit)}
              </div>
              <div className="rule-h-gold w-12 mb-4" />
              <div className="font-display text-lg text-bone mb-2 tracking-[0.18em]">
                {card.nameCn}
              </div>
              <div className="font-display text-[11px] tracking-veil text-bone-dim uppercase">
                {card.name}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 逆位标识 */}
      {isRevealed && isReversed && (
        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 anim-fade-in">
          <span className="cn-label text-gold-dim">
            逆 位
          </span>
        </div>
      )}
    </div>
  );
}

function CornerTicks() {
  return (
    <>
      <span className="absolute top-3 left-3 w-2 h-px bg-[var(--bone-whisper)]" />
      <span className="absolute top-3 left-3 h-2 w-px bg-[var(--bone-whisper)]" />
      <span className="absolute top-3 right-3 w-2 h-px bg-[var(--bone-whisper)]" />
      <span className="absolute top-3 right-3 h-2 w-px bg-[var(--bone-whisper)]" />
      <span className="absolute bottom-3 left-3 w-2 h-px bg-[var(--bone-whisper)]" />
      <span className="absolute bottom-3 left-3 h-2 w-px bg-[var(--bone-whisper)]" />
      <span className="absolute bottom-3 right-3 w-2 h-px bg-[var(--bone-whisper)]" />
      <span className="absolute bottom-3 right-3 h-2 w-px bg-[var(--bone-whisper)]" />
    </>
  );
}

function getSuitSymbol(suit?: string): string {
  switch (suit) {
    case 'wands':     return '✦';
    case 'cups':      return '◇';
    case 'swords':    return '✧';
    case 'pentacles': return '⊹';
    default:          return '✦';
  }
}
