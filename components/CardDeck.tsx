'use client';

import { useState } from 'react';

interface CardDeckProps {
  onShuffle: () => void;
  isShuffling?: boolean;
}

export function CardDeck({ onShuffle, isShuffling = false }: CardDeckProps) {
  const [shuffleAnimation, setShuffleAnimation] = useState(false);

  const handleShuffle = () => {
    setShuffleAnimation(true);
    setTimeout(() => {
      setShuffleAnimation(false);
      onShuffle();
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="relative w-32 h-48">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-28 h-44 bg-[var(--ink-void)] border border-[var(--ink-line)] transition-all duration-300 ${
              shuffleAnimation ? 'animate-shuffle' : ''
            }`}
            style={{
              top: `${i * 2}px`,
              left: `${i * 2}px`,
              zIndex: 5 - i,
              animationDelay: shuffleAnimation ? `${i * 0.1}s` : '0s',
            }}
          >
            <div className="absolute inset-1.5 border border-[var(--bone-whisper)]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-gold-dim text-xl">✦</span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleShuffle}
        disabled={isShuffling || shuffleAnimation}
        className="btn-ink-primary px-10 py-3"
      >
        {shuffleAnimation ? '洗 牌 中' : '洗 牌 并 抽 取'}
      </button>

      <style jsx>{`
        @keyframes shuffle {
          0%, 100% {
            transform: translateX(0) rotate(0deg);
          }
          25% {
            transform: translateX(-22px) rotate(-3deg);
          }
          50% {
            transform: translateX(22px) rotate(3deg);
          }
          75% {
            transform: translateX(-10px) rotate(-2deg);
          }
        }
        .animate-shuffle {
          animation: shuffle 0.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
