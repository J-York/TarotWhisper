'use client';

import { useState, useEffect } from 'react';

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
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-32 h-48">
        {/* 牌堆效果 */}
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-28 h-44 rounded-lg bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 border-2 border-amber-500/50 shadow-lg transition-all duration-300 ${
              shuffleAnimation ? 'animate-shuffle' : ''
            }`}
            style={{
              top: `${i * 2}px`,
              left: `${i * 2}px`,
              zIndex: 5 - i,
              animationDelay: shuffleAnimation ? `${i * 0.1}s` : '0s',
            }}
          >
            <div className="absolute inset-2 border border-amber-500/30 rounded-md" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-amber-500/60 text-3xl">✦</span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleShuffle}
        disabled={isShuffling || shuffleAnimation}
        className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium rounded-full shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-purple-500/40 disabled:shadow-none"
      >
        {shuffleAnimation ? '洗牌中...' : '洗牌并抽牌'}
      </button>

      <style jsx>{`
        @keyframes shuffle {
          0%, 100% {
            transform: translateX(0) rotate(0deg);
          }
          25% {
            transform: translateX(-30px) rotate(-5deg);
          }
          50% {
            transform: translateX(30px) rotate(5deg);
          }
          75% {
            transform: translateX(-15px) rotate(-3deg);
          }
        }
        .animate-shuffle {
          animation: shuffle 0.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
