'use client';

import { DrawnCard } from '@/lib/tarot/types';
import { TarotCardComponent } from '@/components/TarotCard';

/**
 * 凯尔特十字牙阵空间布局。
 *
 * 经典布局：
 *   - 左侧十字部分：中央纵牌① + 横置挑战牌② + 上⑤ + 下⑥ + 左③ + 右④
 *   - 右侧柱状部分：从下到上 ⑦⑧⑨⑩
 *
 * 使用 CSS Grid 实现精确定位。
 */

interface CelticCrossLayoutProps {
  drawnCards: DrawnCard[];
  revealedCount: number;
  onReveal: (index: number) => void;
}

// 凯尔特十字的 10 个位置在 grid 中的坐标。
// Grid: 7 列 x 5 行
// 左侧十字占 5 列 x 5 行，右侧柱占最后 2 列
const POSITIONS: Array<{ col: string; row: string; rotate?: boolean }> = [
  // 0: 现状 (Present) — 中央
  { col: '3', row: '3' },
  // 1: 挑战 (Challenge) — 横置覆盖中央
  { col: '3', row: '3', rotate: true },
  // 2: 过去 (Past) — 左
  { col: '1', row: '3' },
  // 3: 近期未来 (Future) — 右
  { col: '5', row: '3' },
  // 4: 目标 (Above) — 上
  { col: '3', row: '1' },
  // 5: 潜意识 (Below) — 下
  { col: '3', row: '5' },
  // 6: 建议 (Advice) — 右侧柱底部
  { col: '7', row: '5' },
  // 7: 外部影响 (External) — 右侧柱第二
  { col: '7', row: '4' },
  // 8: 希望与恐惧 (Hopes/Fears) — 右侧柱第三
  { col: '7', row: '2' },
  // 9: 最终结果 (Outcome) — 右侧柱顶部
  { col: '7', row: '1' },
];

export function CelticCrossLayout({
  drawnCards,
  revealedCount,
  onReveal,
}: CelticCrossLayoutProps) {
  return (
    <div className="celtic-cross-grid w-full max-w-4xl mx-auto">
      {drawnCards.map((drawn, index) => {
        const pos = POSITIONS[index];
        if (!pos) return null;

        return (
          <div
            key={drawn.position.id}
            className="celtic-cross-cell flex flex-col items-center gap-3 group relative"
            style={{
              gridColumn: pos.col,
              gridRow: pos.row,
              zIndex: pos.rotate ? 2 : 1,
            }}
          >
            <span
              className="absolute -top-7 cn-label text-bone-faint opacity-0 group-hover:opacity-100 transition-opacity duration-700 whitespace-nowrap"
              style={{ transitionTimingFunction: 'var(--ease-veil)' }}
            >
              {drawn.position.nameCn}
            </span>
            <div className={pos.rotate ? 'rotate-90 origin-center' : ''}>
              <TarotCardComponent
                card={drawn.card}
                isReversed={drawn.isReversed}
                isRevealed={index < revealedCount}
                onClick={() => onReveal(index)}
                size="sm"
              />
            </div>
            {/* 翻开后显示牌名 */}
            {index < revealedCount && (
              <span className="cn-hint text-bone-whisper text-center mt-1 max-w-[80px] truncate">
                {drawn.card.nameCn}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
