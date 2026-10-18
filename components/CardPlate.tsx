'use client';

import { useState, type ReactElement } from 'react';
import Image from 'next/image';

import type { TarotCard } from '@/lib/tarot/types';

interface CardPlateProps {
  card: TarotCard;
  isReversed?: boolean;
  /** next/image 的 sizes，按实际显示宽度填写 */
  sizes: string;
  priority?: boolean;
  /** 旁边已经写了牌名时设为 true，避免读屏重复朗读 */
  decorative?: boolean;
  className?: string;
}

/** 静态牌面 · 列表、缩略图、今日一牌等不需要翻牌的地方 */
export function CardPlate({
  card,
  isReversed = false,
  sizes,
  priority = false,
  decorative = false,
  className = '',
}: CardPlateProps): ReactElement {
  const [failed, setFailed] = useState(false);

  return (
    <span className={`plate block aspect-[3/5] ${className}`}>
      {failed ? (
        <span className="absolute inset-0 grid place-items-center p-2 text-center text-xs leading-snug text-ink-muted">
          {card.nameCn}
        </span>
      ) : (
        <Image
          src={card.image}
          alt={decorative ? '' : `${card.nameCn}${isReversed ? '（逆位）' : ''}`}
          fill
          sizes={sizes}
          priority={priority}
          className={`object-cover ${isReversed ? 'rotate-180' : ''}`}
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
