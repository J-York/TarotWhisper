'use client';

import { useState, type ReactElement } from 'react';

interface CardDeckProps {
  onShuffle: () => void;
  isShuffling?: boolean;
}

export function CardDeck({ onShuffle, isShuffling = false }: CardDeckProps): ReactElement {
  const [shuffleAnimation, setShuffleAnimation] = useState(false);

  const handleShuffle = (): void => {
    setShuffleAnimation(true);
    window.setTimeout(() => {
      setShuffleAnimation(false);
      onShuffle();
    }, 1400);
  };

  return (
    <div className="flex flex-col items-center gap-9">
      {/* 牌堆 · 5 层错落 */}
      <div className="relative h-52 w-36">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className={`absolute h-48 w-32 rounded-lg border border-[var(--gold-faint)] bg-[var(--ink-veil)] ${
              shuffleAnimation ? 'animate-shuffle' : ''
            }`}
            style={{
              top: `${i * 3}px`,
              left: `${i * 3}px`,
              zIndex: 5 - i,
              animationDelay: shuffleAnimation ? `${i * 0.08}s` : '0s',
              boxShadow: '0 14px 30px -20px rgba(0,0,0,0.9)',
            }}
          >
            <div className="absolute inset-1.5 rounded border border-[var(--gold-faint)]/50" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg text-gold-dim">✦</span>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleShuffle}
        disabled={isShuffling || shuffleAnimation}
        className="btn-ink-primary h-12 px-8"
      >
        {shuffleAnimation ? '洗牌中…' : '洗牌并抽牌'}
      </button>

      <p className="text-xs text-bone-faint">洗牌时在默念你的问题</p>

      <style jsx>{`
        @keyframes shuffle {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25%      { transform: translateX(-20px) rotate(-3deg); }
          50%      { transform: translateX(20px) rotate(3deg); }
          75%      { transform: translateX(-9px) rotate(-2deg); }
        }
        .animate-shuffle {
          animation: shuffle 0.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
