'use client';

import { DrawnCard } from '@/lib/tarot/types';
import { TarotCardComponent } from '@/components/TarotCard';

/**
 * 凯尔特十字牌阵空间布局。
 *
 * 桌面（≥768px）经典布局：
 *   - 左侧十字部分：中央纵牌① + 横置挑战牌② + 上⑤ + 下⑥ + 左③ + 右④
 *   - 右侧柱状部分：从下到上 ⑦⑧⑨⑩
 *
 * 移动端（<768px）紧凑布局：
 *   - 上方 3×3 十字，下方 2×2 牌柱
 *
 * 各牌的 grid 坐标由 globals.css 中的 .celtic-pos-N 按断点定义。
 */

interface CelticCrossLayoutProps {
  drawnCards: DrawnCard[];
  revealedCount: number;
  onReveal: (index: number) => void;
}

// index 1 = 挑战牌，横置覆盖在中央牌之上
const CHALLENGE_INDEX = 1;

export function CelticCrossLayout({
  drawnCards,
  revealedCount,
  onReveal,
}: CelticCrossLayoutProps) {
  return (
    <div className="celtic-cross-grid w-full max-w-4xl mx-auto">
      {drawnCards.map((drawn, index) => {
        const isChallenge = index === CHALLENGE_INDEX;
        const isRevealed = index < revealedCount;

        return (
          <div
            key={drawn.position.id}
            className={`celtic-cross-cell celtic-pos-${index} flex flex-col items-center gap-2`}
            style={{ zIndex: isChallenge ? 2 : 1 }}
          >
            {/* 阵位名 · 常驻显示（触屏无 hover）
               挑战牌的标签设为 invisible 占位，保证与同格的中央牌垂直对齐 */}
            <span
              className={`cn-hint text-bone-faint whitespace-nowrap max-w-[110px] truncate ${
                isChallenge ? 'invisible' : ''
              }`}
            >
              {drawn.position.nameCn}
            </span>

            <div className={isChallenge ? 'rotate-90 origin-center' : ''}>
              <TarotCardComponent
                card={drawn.card}
                isReversed={drawn.isReversed}
                isRevealed={isRevealed}
                onClick={() => onReveal(index)}
                size="sm"
              />
            </div>

            {/* 下方说明 · 挑战牌下移一行，避开中央牌的说明 */}
            <span
              className={`cn-hint text-center whitespace-nowrap max-w-[110px] truncate min-h-4 ${
                isChallenge ? 'translate-y-5 text-bone-faint' : 'text-bone-whisper'
              }`}
            >
              {isChallenge
                ? isRevealed
                  ? `${drawn.position.nameCn} · ${drawn.card.nameCn}`
                  : drawn.position.nameCn
                : isRevealed
                ? drawn.card.nameCn
                : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}
