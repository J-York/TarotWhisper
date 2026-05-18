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

  const cardFaceTransform = isReversed && isRevealed
    ? 'rotateY(180deg) rotate(180deg)'
    : 'rotateY(180deg)';

  return (
    <div
      className={`relative ${sizeClasses[size]} cursor-pointer perspective-1000 group`}
      onClick={onClick}
    >
      <div
        className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${
          isRevealed ? 'rotate-y-180' : ''
        }`}
      >
        {/* Card back — minimal ink */}
        <div className="absolute w-full h-full backface-hidden overflow-hidden border border-[var(--ink-line)] bg-[var(--ink-void)]">
          <div className="w-full h-full relative flex items-center justify-center">
            {/* inner frame */}
            <div className="absolute inset-2 border border-[var(--bone-whisper)]" />

            {/* central glyph */}
            <div className="relative flex flex-col items-center gap-3 transition-transform duration-500 group-hover:scale-105">
              <span className="text-gold-dim text-2xl">✦</span>
              <span className="h-px w-10 bg-[var(--ink-line)]" />
              <span className="text-bone-whisper text-xs tracking-mystic uppercase">Tarot</span>
            </div>

            {/* corner ticks */}
            <span className="absolute top-3 left-3 w-2 h-px bg-[var(--bone-whisper)]" />
            <span className="absolute top-3 left-3 h-2 w-px bg-[var(--bone-whisper)]" />
            <span className="absolute top-3 right-3 w-2 h-px bg-[var(--bone-whisper)]" />
            <span className="absolute top-3 right-3 h-2 w-px bg-[var(--bone-whisper)]" />
            <span className="absolute bottom-3 left-3 w-2 h-px bg-[var(--bone-whisper)]" />
            <span className="absolute bottom-3 left-3 h-2 w-px bg-[var(--bone-whisper)]" />
            <span className="absolute bottom-3 right-3 w-2 h-px bg-[var(--bone-whisper)]" />
            <span className="absolute bottom-3 right-3 h-2 w-px bg-[var(--bone-whisper)]" />
          </div>
        </div>

        {/* Card face */}
        <div
          className="absolute w-full h-full backface-hidden overflow-hidden border border-[var(--ink-line)] bg-[var(--ink-void)]"
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
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink-void)]/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-0 w-full p-3 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className="text-bone font-serif text-base tracking-wider">
                  {card.nameCn}
                </h3>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
              <div className="text-gold-dim text-2xl mb-4">
                {card.type === 'major' ? '✦' : getSuitSymbol(card.suit)}
              </div>
              <div className="w-12 h-px bg-[var(--ink-line)] mb-4" />
              <div className="font-serif text-base text-bone mb-2 tracking-widest">
                {card.nameCn}
              </div>
              <div className="text-bone-faint text-xs tracking-quiet uppercase">
                {card.name}
              </div>
            </div>
          )}
        </div>
      </div>

      {isRevealed && isReversed && (
        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 anim-fade-in">
          <span className="text-xs tracking-mystic text-gold-dim uppercase">
            逆 位
          </span>
        </div>
      )}
    </div>
  );
}

function getSuitSymbol(suit?: string): string {
  switch (suit) {
    case 'wands': return '✦';
    case 'cups': return '◇';
    case 'swords': return '✧';
    case 'pentacles': return '⊹';
    default: return '✦';
  }
}
