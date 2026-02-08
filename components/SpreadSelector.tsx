'use client';

import { Spread } from '@/lib/tarot/types';
import { spreads } from '@/lib/tarot/spreads';

interface SpreadSelectorProps {
  selectedSpread: Spread;
  onSelect: (spread: Spread) => void;
}

export function SpreadSelector({ selectedSpread, onSelect }: SpreadSelectorProps) {
  return (
    <div className="w-full max-w-5xl px-4">
      <h3 className="text-2xl font-serif text-amber-400 mb-8 text-center tracking-widest uppercase">
        选择你的牌阵
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {spreads.map((spread) => {
          const isSelected = selectedSpread.id === spread.id;
          
          return (
            <button
              key={spread.id}
              onClick={() => onSelect(spread)}
              className={`
                relative group flex flex-col items-start text-left p-6 rounded-xl transition-all duration-300
                glass-panel overflow-hidden
                ${isSelected 
                  ? 'border-amber-500 bg-amber-900/10 shadow-[0_0_20px_rgba(245,158,11,0.2)] transform scale-[1.02]' 
                  : 'border-white/5 hover:border-purple-400/30 hover:bg-white/5 hover:-translate-y-1 hover:shadow-lg'
                }
              `}
            >
              {/* Selected Indicator Background */}
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none" />
              )}
              
              {/* Header */}
              <div className="w-full flex justify-between items-start mb-4 relative z-10">
                <div>
                   <h4 className={`font-serif text-lg tracking-wide transition-colors ${isSelected ? 'text-amber-400' : 'text-purple-100 group-hover:text-amber-200'}`}>
                    {spread.nameCn}
                  </h4>
                  <span className="text-sm text-purple-300/50 uppercase tracking-wider font-light">
                    {spread.name}
                  </span>
                </div>
                
                {/* Checkmark Badge */}
                 <div className={`
                    w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300
                    ${isSelected 
                      ? 'border-amber-500 bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]' 
                      : 'border-white/20 bg-transparent group-hover:border-purple-400/50'
                    }
                 `}>
                    {isSelected && (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                 </div>
              </div>

              {/* Description */}
              <p className="text-base text-purple-200/70 mb-6 font-light leading-relaxed relative z-10">
                {spread.description}
              </p>

              {/* Card Count Badge */}
              <div className="mt-auto relative z-10">
                <span className={`
                  inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium tracking-wide border
                  ${isSelected
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-purple-900/30 border-purple-500/20 text-purple-300/80'
                  }
                `}>
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 4h16v16H4V4zm2 2v12h12V6H6z"/>
                  </svg>
                  {spread.positions.length} 张牌
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
