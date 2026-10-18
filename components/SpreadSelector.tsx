'use client';

import type { ReactElement } from 'react';

import { spreads } from '@/lib/tarot/spreads';
import type { Spread } from '@/lib/tarot/types';

interface SpreadSelectorProps {
  selectedId?: string | null;
  onSelect: (spread: Spread) => void;
  disabled?: boolean;
}

/* 牌阵缩略：每行是若干组，组内牌紧挨，组间留空 */
const MINI_ROWS: Record<string, number[][]> = {
  single: [[1]],
  'three-card': [[3]],
  'two-options': [[1], [2, 2]],
  relationship: [[1, 1, 1], [2]],
  timeline: [[5]],
};

function MiniLayout({ id }: { id: string }): ReactElement {
  if (id === 'celtic-cross') {
    return (
      <div className="spread-mini" aria-hidden>
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-3 place-items-center gap-0.5">
            <span />
            <span className="spread-mini-card" />
            <span />
            <span className="spread-mini-card" />
            <span className="flex items-center">
              <span className="spread-mini-card" />
              <span className="spread-mini-card spread-mini-card--cross" />
            </span>
            <span className="spread-mini-card" />
            <span />
            <span className="spread-mini-card" />
            <span />
          </div>
          <div className="flex flex-col gap-0.5">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="spread-mini-card" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const rows = MINI_ROWS[id] ?? [[3]];
  return (
    <div className="spread-mini" aria-hidden>
      <div className="flex flex-col items-center gap-1">
        {rows.map((groups, ri) => (
          <div key={ri} className="flex items-center gap-3">
            {groups.map((count, gi) => (
              <div key={gi} className="flex gap-1">
                {Array.from({ length: count }, (_, i) => (
                  <span key={i} className="spread-mini-card" />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SpreadSelector({ selectedId, onSelect, disabled = false }: SpreadSelectorProps): ReactElement {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {spreads.map((spread) => {
        const isSelected = selectedId === spread.id;
        return (
          <button
            key={spread.id}
            type="button"
            onClick={() => onSelect(spread)}
            disabled={disabled}
            aria-pressed={isSelected}
            className={`flex flex-col rounded-md border p-2.5 text-left transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${
              isSelected
                ? 'border-accent bg-accent-soft/60'
                : 'border-line bg-surface hover:border-ink-muted'
            }`}
          >
            <MiniLayout id={spread.id} />
            <span className="mt-2.5 flex items-baseline justify-between gap-2 px-0.5">
              <span className={`text-[15px] font-semibold ${isSelected ? 'text-accent-strong' : 'text-ink'}`}>
                {spread.nameCn}
              </span>
              <span className="shrink-0 text-xs text-ink-muted">{spread.positions.length} 张</span>
            </span>
            <span className="mt-1 line-clamp-2 px-0.5 text-[13px] leading-snug text-ink-muted">
              {spread.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
