'use client';

import { useEffect, useRef, useState, type ReactElement } from 'react';

import { CardMedallion } from '@/components/TarotCard';

interface CardDeckProps {
  /** 洗牌动画结束后调用 */
  onShuffle: () => void;
  disabled?: boolean;
}

const DECK_SIZE = 5;
// 两轮 riffle（700ms × 2）加上最后一张的起步延迟
const SHUFFLE_MS = 1650;

export function CardDeck({ onShuffle, disabled = false }: CardDeckProps): ReactElement {
  const [shuffling, setShuffling] = useState(false);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleShuffle = (): void => {
    setShuffling(true);
    timer.current = window.setTimeout(() => {
      setShuffling(false);
      onShuffle();
    }, SHUFFLE_MS);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className={`relative h-40 w-24 ${shuffling ? 'is-shuffling' : ''}`} aria-hidden>
        {Array.from({ length: DECK_SIZE }, (_, i) => (
          <div
            key={i}
            className="deck-card card-back"
            style={{ translate: `${i * 2}px ${-i * 2}px` }}
          >
            {i === DECK_SIZE - 1 && <CardMedallion />}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleShuffle}
        disabled={disabled || shuffling}
        className="btn btn-primary h-11 px-7"
      >
        {shuffling ? '正在洗牌…' : '洗牌并抽牌'}
      </button>
      <p className="text-[13px] text-ink-muted" role="status">
        {shuffling ? '在心里默念你的问题' : '准备好了就开始洗牌'}
      </p>
    </div>
  );
}
