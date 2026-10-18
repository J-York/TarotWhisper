'use client';

import type { ReactElement } from 'react';

import { TarotCardComponent, type CardSize } from '@/components/TarotCard';
import type { DrawnCard } from '@/lib/tarot/types';

interface SpreadBoardProps {
  spreadId: string;
  drawnCards: DrawnCard[];
  /** 前 N 张已翻开 */
  revealedCount: number;
  /** 传入后可以亲手翻牌：按阵位顺序，只有下一张能点 */
  onRevealNext?: () => void;
  /** 不传则按张数自动选择 */
  size?: CardSize;
}

function autoSize(spreadId: string, count: number): CardSize {
  if (spreadId === 'celtic-cross' || count > 3) return 'sm';
  if (count === 1) return 'lg';
  return 'md';
}

/** 按牌阵摆放牌面：凯尔特十字与二择一有专门的排法，其余横排 */
export function SpreadBoard({
  spreadId,
  drawnCards,
  revealedCount,
  onRevealNext,
  size,
}: SpreadBoardProps): ReactElement {
  const cardSize = size ?? autoSize(spreadId, drawnCards.length);

  const cell = (index: number, extraClass = ''): ReactElement => {
    const drawn = drawnCards[index];
    const isRevealed = index < revealedCount;
    const isNext = Boolean(onRevealNext) && index === revealedCount;
    return (
      <SpreadCell
        key={drawn.position.id}
        drawn={drawn}
        size={cardSize}
        isRevealed={isRevealed}
        isNext={isNext}
        onReveal={isNext ? onRevealNext : undefined}
        className={extraClass}
      />
    );
  };

  if (spreadId === 'celtic-cross' && drawnCards.length === 10) {
    return (
      <div className="celtic-cross-grid mx-auto w-full max-w-3xl">
        {drawnCards.map((drawn, index) => {
          const isChallenge = index === 1;
          const isRevealed = index < revealedCount;
          const isNext = Boolean(onRevealNext) && index === revealedCount;
          return (
            <SpreadCell
              key={drawn.position.id}
              drawn={drawn}
              // 窄屏缩一级，横放的挑战牌才不会压住左右两张
              size="xs"
              isRevealed={isRevealed}
              isNext={isNext}
              onReveal={isNext ? onRevealNext : undefined}
              // 挑战牌横压在现状牌上：标签占位但隐藏，说明下移一行避免重叠
              crossing={isChallenge}
              className={`celtic-pos-${index} ${isChallenge ? 'z-[2]' : 'z-[1]'}`}
            />
          );
        })}
      </div>
    );
  }

  if (spreadId === 'two-options' && drawnCards.length === 5) {
    return (
      <div className="flex flex-col items-center gap-6">
        {cell(0)}
        <div className="flex flex-wrap justify-center gap-x-12 gap-y-6">
          <div className="flex gap-4">
            {cell(1)}
            {cell(2)}
          </div>
          <div className="flex gap-4">
            {cell(3)}
            {cell(4)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-x-2 gap-y-6 sm:gap-x-5">
      {drawnCards.map((_, index) => cell(index))}
    </div>
  );
}

interface SpreadCellProps {
  drawn: DrawnCard;
  size: CardSize;
  isRevealed: boolean;
  isNext: boolean;
  onReveal?: () => void;
  crossing?: boolean;
  className?: string;
}

function SpreadCell({
  drawn,
  size,
  isRevealed,
  isNext,
  onReveal,
  crossing = false,
  className = '',
}: SpreadCellProps): ReactElement {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <span
        className={`max-w-[8rem] truncate text-[13px] text-ink-muted ${crossing ? 'invisible' : ''}`}
      >
        {drawn.position.nameCn}
      </span>

      <div className={crossing ? 'rotate-90' : undefined}>
        <TarotCardComponent
          card={drawn.card}
          isReversed={drawn.isReversed}
          isRevealed={isRevealed}
          isNext={isNext}
          onClick={onReveal}
          size={size}
          tilt
        />
      </div>

      <span
        className={`min-h-[2.75rem] max-w-[8rem] text-center leading-snug ${crossing ? 'pt-11' : ''}`}
        aria-live="polite"
      >
        {isRevealed ? (
          <span className="anim-fade block">
            <span className="block truncate text-sm font-semibold text-ink">
              {crossing ? `${drawn.position.nameCn} · ` : ''}
              {drawn.card.nameCn}
            </span>
            <span className={`text-xs ${drawn.isReversed ? 'text-accent' : 'text-ink-muted'}`}>
              {drawn.isReversed ? '逆位' : '正位'}
            </span>
          </span>
        ) : isNext ? (
          <span className="text-xs text-accent">点按翻开</span>
        ) : crossing ? (
          <span className="text-xs text-ink-muted">{drawn.position.nameCn}</span>
        ) : null}
      </span>
    </div>
  );
}
