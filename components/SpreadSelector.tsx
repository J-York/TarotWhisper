'use client';

import { type ReactElement } from 'react';

import { spreads } from '@/lib/tarot/spreads';
import type { Spread } from '@/lib/tarot/types';

interface SpreadSelectorProps {
  selectedSpread: Spread;
  onSelect: (spread: Spread) => void;
}

/* 牌阵最小示意 · 用方点表达排布形状，代替泛泛的列表 */
const SPREAD_LAYOUTS: Record<string, string[]> = {
  single: ['single'],
  'three-card': ['row3'],
  'two-options': ['row3', 'row2'],
  relationship: ['row2', 'row3'],
  timeline: ['row5'],
  'celtic-cross': ['row3', 'row2'],
};

function MiniLayout({ id }: { id: string }): ReactElement {
  const rows = SPREAD_LAYOUTS[id] ?? ['row3'];
  return (
    <div className="spread-mini" aria-hidden>
      <div className="flex flex-col items-center gap-1.5">
        {rows.map((row, ri) => {
          const count = row === 'single' ? 1 : Number(row.replace('row', ''));
          return (
            <div key={`${row}-${ri}`} className="flex items-center gap-1.5">
              {Array.from({ length: count }, (_, i) => (
                <span
                  key={i}
                  className={`spread-mini-card ${
                    id === 'celtic-cross' && ri === 0 && i === 1 ? 'spread-mini-card--major' : ''
                  }`}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SpreadSelector({ selectedSpread, onSelect }: SpreadSelectorProps): ReactElement {
  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="section-title">牌阵</h2>
          <p className="mt-1 text-xs text-bone-faint">共 6 种 · 点击切换</p>
        </div>
        <span className="hidden text-xs text-bone-faint md:inline">张数越多，解读越深入</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {spreads.map((spread) => {
          const isSelected = selectedSpread.id === spread.id;
          return (
            <button
              key={spread.id}
              type="button"
              onClick={() => onSelect(spread)}
              aria-pressed={isSelected}
              className={`group relative flex flex-col rounded-xl border p-4 text-left transition-all duration-200 ${
                isSelected
                  ? 'border-[var(--gold-dim)] bg-[rgba(210,178,116,0.09)]'
                  : 'border-[var(--ink-line)] bg-[rgba(20,16,34,0.35)] hover:border-[var(--ink-line-strong)] hover:bg-[rgba(20,16,34,0.6)]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3
                    className={`font-heading text-[15px] tracking-[0.04em] ${
                      isSelected ? 'text-gold-warm' : 'text-bone'
                    }`}
                  >
                    {spread.nameCn}
                  </h3>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-bone-faint">
                    {spread.name}
                  </p>
                </div>
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] transition-colors ${
                    isSelected
                      ? 'border-[var(--gold)] bg-[var(--gold)] text-[var(--ink-void)]'
                      : 'border-[var(--ink-line-strong)] text-transparent'
                  }`}
                  aria-hidden
                >
                  ✓
                </span>
              </div>

              <div className="my-3">
                <MiniLayout id={spread.id} />
              </div>

              <p className="line-clamp-2 min-h-10 text-xs leading-relaxed text-bone-faint">
                {spread.description}
              </p>

              <div className="mt-3 flex items-center justify-between border-t border-[var(--ink-line)] pt-2.5">
                <span className="text-[11px] text-bone-faint">
                  {spread.positions.length} 张
                </span>
                <span className="text-[10px] text-bone-faint">
                  {spread.positions.map((p) => p.nameCn).slice(0, 3).join(' · ')}
                  {spread.positions.length > 3 ? ' …' : ''}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
