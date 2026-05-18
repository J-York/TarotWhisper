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
      <div className="text-center mb-12">
        <h3 className="text-2xl font-serif text-bone mb-2 tracking-quiet uppercase">
          选 择 牌 阵
        </h3>
        <div className="rule-h-fade w-16 mx-auto" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--ink-line)] border border-[var(--ink-line)]">
        {spreads.map((spread) => {
          const isSelected = selectedSpread.id === spread.id;

          return (
            <button
              key={spread.id}
              onClick={() => onSelect(spread)}
              className={`
                relative group flex flex-col items-start text-left p-8 transition-colors duration-300
                ${isSelected
                  ? 'bg-[var(--ink-veil)]'
                  : 'bg-[var(--ink-deep)] hover:bg-[var(--ink-veil)]'
                }
              `}
            >
              {isSelected && (
                <span className="absolute top-0 left-0 right-0 h-px bg-[var(--gold-dim)]" />
              )}

              <div className="flex items-center gap-3 mb-6">
                <span className={`text-lg transition-colors ${isSelected ? 'text-gold' : 'text-gold-dim'}`}>
                  {isSelected ? '✦' : '◇'}
                </span>
                <span className={`text-xs tracking-mystic uppercase transition-colors ${isSelected ? 'text-gold' : 'text-bone-faint'}`}>
                  {spread.name}
                </span>
              </div>

              <h4 className={`font-serif text-xl mb-3 tracking-wider transition-colors ${isSelected ? 'text-bone' : 'text-bone-dim group-hover:text-bone'}`}>
                {spread.nameCn}
              </h4>

              <p className="text-bone-faint text-sm font-light leading-relaxed mb-8">
                {spread.description}
              </p>

              <div className="mt-auto flex items-center gap-2 text-xs tracking-quiet uppercase text-bone-whisper">
                <span>{spread.positions.length}</span>
                <span className="w-4 h-px bg-[var(--ink-line)]" />
                <span>张 牌</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
