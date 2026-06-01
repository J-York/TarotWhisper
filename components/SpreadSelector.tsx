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
      {/* ─── 标题 ─── */}
      <div className="text-center mb-14">
        <span className="text-gold text-lg" aria-hidden>✦</span>
        <h3 className="font-display text-2xl text-bone mt-5 mb-3 tracking-[0.22em] uppercase">
          选 择 牌 阵
        </h3>
        <div className="rule-h-gold w-20 mx-auto mt-4" />
        <p className="font-body italic-soft text-bone-faint text-sm mt-5">
          每一种排布，都是宇宙不同侧面的回声
        </p>
      </div>

      {/* ─── 牌阵卡片 · 极细分隔 ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3">
        {spreads.map((spread, index) => {
          const isSelected = selectedSpread.id === spread.id;
          // 每行中间列需要左右边线（3 列布局中 col % 3 === 1）
          const col = index % 3;
          const needBorderX = col === 1;
          // 第二行起需要顶部边线
          const needBorderT = index >= 3;

          return (
            <button
              key={spread.id}
              onClick={() => onSelect(spread)}
              className={`
                relative group flex flex-col items-start text-left p-10
                transition-all duration-700
                ${isSelected
                  ? 'bg-[var(--ink-veil)]'
                  : 'bg-transparent hover:bg-[var(--ink-veil)]'
                }
                ${needBorderX ? 'md:border-l md:border-r md:border-[var(--ink-line)]' : ''}
                ${needBorderT ? 'md:border-t md:border-[var(--ink-line)]' : ''}
              `}
              style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
            >
              {/* 选中态 · 顶部金线 */}
              <span
                className={`absolute top-0 left-0 right-0 h-px transition-all duration-700 ${
                  isSelected ? 'bg-[var(--gold)]' : 'bg-transparent'
                }`}
                style={{ transitionTimingFunction: 'var(--ease-veil)' }}
              />

              {/* 符号 + 英文名 */}
              <div className="flex items-center gap-4 mb-8">
                <span
                  className={`text-lg transition-colors duration-700 ${
                    isSelected ? 'text-gold' : 'text-gold-dim'
                  }`}
                >
                  {isSelected ? '✦' : '◇'}
                </span>
                <span
                  className={`font-display text-[11px] tracking-veil uppercase transition-colors duration-700 ${
                    isSelected ? 'text-gold' : 'text-bone-dim'
                  }`}
                >
                  {spread.name}
                </span>
              </div>

              {/* 中文名 · 主标题 */}
              <h4
                className={`font-display text-xl mb-4 tracking-[0.18em] transition-colors duration-700 ${
                  isSelected
                    ? 'text-bone'
                    : 'text-bone-dim group-hover:text-bone'
                }`}
              >
                {spread.nameCn}
              </h4>

              {/* 描述 · Cormorant 衬线 */}
              <p className="font-body text-bone-faint text-base leading-relaxed mb-10 italic-soft">
                {spread.description}
              </p>

              {/* 底部 · 张数 */}
              <div className="mt-auto flex items-center gap-3 cn-label text-bone-faint">
                <span>{spread.positions.length}</span>
                <span className="w-6 h-px bg-[var(--ink-line)]" />
                <span>张 牌</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
