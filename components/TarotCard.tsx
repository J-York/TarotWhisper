'use client';

import { useEffect, useRef, useState, type ReactElement } from 'react';
import Image from 'next/image';

import type { TarotCard } from '@/lib/tarot/types';

export type CardSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface TarotCardProps {
  card: TarotCard;
  isReversed?: boolean;
  isRevealed?: boolean;
  onClick?: () => void;
  size?: CardSize;
  /** 鼠标移动时轻微倾斜（只对 lg / xl 生效） */
  tilt?: boolean;
  /** 标记为下一张该翻的牌 */
  isNext?: boolean;
}

/** 宽高比统一 3:5；除 sm 外，各档在窄屏都会缩小。md 在 360px 宽的屏上也要能三张排成一行 */
const SIZE_CLASSES: Record<CardSize, string> = {
  xs: 'h-32 w-[4.8rem] sm:h-40 sm:w-24',
  sm: 'h-40 w-24',
  md: 'h-[8.75rem] w-[5.25rem] sm:h-60 sm:w-36',
  lg: 'h-60 w-36 sm:h-[293px] sm:w-44',
  xl: 'h-[347px] w-52 sm:h-[400px] sm:w-60',
};

const IMAGE_SIZES: Record<CardSize, string> = {
  xs: '(min-width: 640px) 96px, 77px',
  sm: '96px',
  md: '(min-width: 640px) 144px, 84px',
  lg: '(min-width: 640px) 176px, 144px',
  xl: '(min-width: 640px) 240px, 208px',
};

const TILT_MAX = 5;

/** 牌背中央的八角星徽记，牌堆也会用到 */
export function CardMedallion(): ReactElement {
  return (
    <span className="card-medallion grid place-items-center" aria-hidden>
      <svg viewBox="0 0 40 40" className="h-[64%] w-[64%]" fill="none" stroke="currentColor" strokeWidth="1.3">
        <rect x="9" y="9" width="22" height="22" />
        <rect x="9" y="9" width="22" height="22" transform="rotate(45 20 20)" />
        <circle cx="20" cy="20" r="4" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}

export function TarotCardComponent({
  card,
  isReversed = false,
  isRevealed = false,
  onClick,
  size = 'md',
  tilt = false,
  isNext = false,
}: TarotCardProps): ReactElement {
  const [imageError, setImageError] = useState(false);
  const tiltRef = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<HTMLDivElement>(null);
  const tiltRaf = useRef(0);
  const wasRevealed = useRef(isRevealed);

  const canTilt = tilt && (size === 'lg' || size === 'xl');
  const isClickable = Boolean(onClick) && !isRevealed;

  // 只在「刚被翻开」时扫一次反光；已翻开的牌重新挂载时不播放
  useEffect(() => {
    const justRevealed = !wasRevealed.current && isRevealed;
    wasRevealed.current = isRevealed;
    const el = sheenRef.current;
    if (!justRevealed || !el) return;

    el.classList.add('is-active');
    const timer = window.setTimeout(() => el.classList.remove('is-active'), 1400);
    return () => {
      window.clearTimeout(timer);
      el.classList.remove('is-active');
    };
  }, [isRevealed]);

  useEffect(() => () => cancelAnimationFrame(tiltRaf.current), []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>): void => {
    const el = tiltRef.current;
    if (!canTilt || !el || e.pointerType !== 'mouse') return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    // 背面朝上时 Y 轴方向相反，否则倾斜会显得“往外躲”
    const ry = px * 2 * TILT_MAX * (isRevealed ? 1 : -1);
    const rx = -py * 2 * TILT_MAX;

    cancelAnimationFrame(tiltRaf.current);
    tiltRaf.current = requestAnimationFrame(() => {
      el.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
      el.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
      el.classList.add('is-tracking');
    });
  };

  const handlePointerLeave = (): void => {
    const el = tiltRef.current;
    if (!canTilt || !el) return;
    cancelAnimationFrame(tiltRaf.current);
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    el.classList.remove('is-tracking');
  };

  const label = isRevealed
    ? `${card.nameCn}（${card.name}）${isReversed ? '，逆位' : '，正位'}`
    : isNext
      ? '未翻开的牌，点按翻开'
      : '未翻开的牌';

  return (
    <div
      className={`card-scene relative shrink-0 ${SIZE_CLASSES[size]} ${
        isClickable ? 'card-clickable' : ''
      } ${isNext && !isRevealed ? 'card-next' : ''}`}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      role={isClickable ? 'button' : 'img'}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={label}
    >
      <div ref={tiltRef} className={canTilt ? 'card-tilt' : 'relative h-full w-full'}>
        <div className={`card-flipper ${isRevealed ? 'is-flipped' : ''}`}>
          {/* 背面 */}
          <div className="card-side card-back">
            <CardMedallion />
          </div>

          {/* 正面 */}
          <div className={`card-side card-front ${isReversed ? 'is-reversed' : ''}`}>
            {imageError ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center">
                <span className="text-sm font-semibold text-ink">{card.nameCn}</span>
                <span className="font-latin text-xs italic text-ink-muted">{card.name}</span>
              </div>
            ) : (
              <Image
                src={card.image}
                alt=""
                fill
                sizes={IMAGE_SIZES[size]}
                className="object-cover"
                onError={() => setImageError(true)}
                priority={size === 'xl'}
              />
            )}
            <div ref={sheenRef} className="card-sheen" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );
}
