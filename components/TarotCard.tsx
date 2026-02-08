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

  // Increased sizes for a more substantial feel
  const sizeClasses = {
    sm: 'w-24 h-40',   // Previously w-20 h-32
    md: 'w-48 h-80',   // Previously w-28 h-44
    lg: 'w-64 h-96',   // Previously w-36 h-56
  };

  // Card face needs rotateY(180deg) for 3D flip, plus rotate(180deg) for reversed cards
  const cardFaceTransform = isReversed && isRevealed
    ? 'rotateY(180deg) rotate(180deg)'
    : 'rotateY(180deg)';

  return (
    <div
      className={`relative ${sizeClasses[size]} cursor-pointer perspective-1000 group`}
      onClick={onClick}
    >
      <div
        className={`relative w-full h-full transition-transform duration-700 transform-style-3d shadow-2xl ${
          isRevealed ? 'rotate-y-180' : ''
        } group-hover:scale-105 transition-all ease-out`}
      >
        {/* Card Back - Mystical Design */}
        <div className="absolute w-full h-full backface-hidden rounded-xl overflow-hidden border-2 border-amber-900/50">
          <div className="w-full h-full bg-[#1a0b2e] relative overflow-hidden flex items-center justify-center">
             {/* Intricate Border Pattern */}
            <div className="absolute inset-2 border border-amber-500/40 rounded-lg opacity-80" />
            <div className="absolute inset-3 border border-amber-500/20 rounded-lg" />
            
            {/* Geometric Background Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay" />
            
            {/* Central Symbol */}
            <div className="relative z-10 flex flex-col items-center justify-center transform group-hover:scale-110 transition-transform duration-500">
              <div className="text-5xl text-amber-500/80 filter drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                ✦
              </div>
              <div className="mt-2 w-16 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
            </div>

            {/* Corner Accents */}
            <div className="absolute top-4 left-4 text-amber-500/30 text-xl">✨</div>
            <div className="absolute bottom-4 right-4 text-amber-500/30 text-xl">✨</div>
          </div>
        </div>

        {/* Card Face */}
        <div
          className="absolute w-full h-full backface-hidden rounded-xl overflow-hidden border-2 border-amber-500/30 bg-[#0f0518]"
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
              {/* Overlay for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-0 w-full p-4 text-center">
                 <h3 className="text-amber-100 font-serif text-lg tracking-wider drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                   {card.nameCn}
                 </h3>
              </div>
            </div>
          ) : (
            // Fallback Design
            <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#2D1B4E] to-[#0F0518] text-center border-4 border-double border-amber-500/20">
              <div className="text-4xl mb-4 text-amber-400 drop-shadow-lg">
                {card.type === 'major' ? '★' : getSuitSymbol(card.suit)}
              </div>
              <div className="font-serif text-xl font-bold text-amber-100 mb-1 tracking-widest uppercase border-b border-amber-500/30 pb-2">
                {card.nameCn}
              </div>
              <div className="text-sm text-amber-300/60 font-light tracking-widest uppercase mt-2">
                {card.name}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reversed Label - Floating */}
      {isRevealed && isReversed && (
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-red-500/30 shadow-lg animate-in fade-in zoom-in duration-300">
           <span className="text-sm text-red-400 font-medium tracking-wide flex items-center gap-1">
             <span className="inline-block transform rotate-180">⇧</span> 逆位
           </span>
        </div>
      )}

       {/* Upright Label - Floating (Optional, for symmetry if desired, currently only reversed shown per request logic usually) */}
       {isRevealed && !isReversed && (
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/30 shadow-lg animate-in fade-in zoom-in duration-300 opacity-0 group-hover:opacity-100 transition-opacity">
           <span className="text-sm text-emerald-400 font-medium tracking-wide flex items-center gap-1">
             <span>⇧</span> 正位
           </span>
        </div>
      )}
    </div>
  );
}

function getSuitSymbol(suit?: string): string {
  switch (suit) {
    case 'wands': return '🪄';
    case 'cups': return '🏆';
    case 'swords': return '⚔️';
    case 'pentacles': return '⭐';
    default: return '✦';
  }
}
