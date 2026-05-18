'use client';

import { useState } from 'react';

interface CardDeckProps {
  onShuffle: () => void;
  isShuffling?: boolean;
}

export function CardDeck({ onShuffle, isShuffling = false }: CardDeckProps) {
  const [shuffleAnimation, setShuffleAnimation] = useState(false);

  const handleShuffle = (): void => {
    setShuffleAnimation(true);
    // 仪式感更强的洗牌时长 — 1.6s
    setTimeout(() => {
      setShuffleAnimation(false);
      onShuffle();
    }, 1600);
  };

  return (
    <div className="flex flex-col items-center gap-12">
      {/* 牌堆 · 5 层错落 */}
      <div className="relative w-32 h-48">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-28 h-44 bg-[var(--ink-void)] hairline transition-all ${
              shuffleAnimation ? 'animate-shuffle' : ''
            }`}
            style={{
              top: `${i * 2}px`,
              left: `${i * 2}px`,
              zIndex: 5 - i,
              transitionDuration: '700ms',
              transitionTimingFunction: 'var(--ease-veil)',
              animationDelay: shuffleAnimation ? `${i * 0.08}s` : '0s',
            }}
          >
            <div className="absolute inset-1.5 hairline" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-gold-dim text-xl">✦</span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleShuffle}
        disabled={isShuffling || shuffleAnimation}
        className="btn-ink-primary px-12 py-3.5"
      >
        {shuffleAnimation ? '洗 牌 中' : '洗 牌 并 抽 取'}
      </button>

      <style jsx>{`
        @keyframes shuffle {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25%      { transform: translateX(-22px) rotate(-3deg); }
          50%      { transform: translateX(22px) rotate(3deg); }
          75%      { transform: translateX(-10px) rotate(-2deg); }
        }
        .animate-shuffle {
          animation: shuffle 0.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
