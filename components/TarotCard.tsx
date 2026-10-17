'use client';

import { useEffect, useRef, useState, type ReactElement } from 'react';
import Image from 'next/image';
import { TarotCard } from '@/lib/tarot/types';

interface TarotCardProps {
  card: TarotCard;
  isReversed?: boolean;
  isRevealed?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  /** 是否启用鼠标视差与翻牌 shimmer */
  enableInteractions?: boolean;
  /** 自定义尺寸类 · 提供时覆盖内置 size 的固定宽高 */
  className?: string;
}

const PARALLAX_MAX = 7;

export function TarotCardComponent({
  card,
  isReversed = false,
  isRevealed = false,
  onClick,
  size = 'md',
  enableInteractions = true,
  className,
}: TarotCardProps): ReactElement {
  const [imageError, setImageError] = useState(false);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const shimmerRef = useRef<HTMLDivElement>(null);
  const trackingRaf = useRef<number>(0);
  const wasRevealed = useRef<boolean>(isRevealed);

  const sizeClasses = {
    sm: 'w-24 h-40',
    md: 'w-44 h-[293px]',
    lg: 'w-60 h-[400px]',
  };

  // 逆位：先翻到正面，再把牌面本身倒转
  const cardFaceTransform =
    isReversed && isRevealed ? 'rotateY(180deg) rotate(180deg)' : 'rotateY(180deg)';

  /* 翻牌瞬间的金箔反光 */
  useEffect(() => {
    const justRevealed = !wasRevealed.current && isRevealed;
    wasRevealed.current = isRevealed;
    if (!justRevealed) return;

    const el = shimmerRef.current;
    if (!el) return;
    const startTimer = window.setTimeout(() => el.classList.add('is-active'), 380);
    const onEnd = (): void => el.classList.remove('is-active');
    el.addEventListener('animationend', onEnd, { once: true });

    return () => {
      window.clearTimeout(startTimer);
      el.removeEventListener('animationend', onEnd);
      el.classList.remove('is-active');
    };
  }, [isRevealed]);

  const enableParallax = enableInteractions && size !== 'sm';

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (!enableParallax) return;
    const el = parallaxRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const direction = isRevealed ? 1 : -1;
    const ry = (px - 0.5) * 2 * PARALLAX_MAX * direction;
    const rx = -(py - 0.5) * 2 * PARALLAX_MAX;

    if (trackingRaf.current) cancelAnimationFrame(trackingRaf.current);
    trackingRaf.current = requestAnimationFrame(() => {
      el.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
      el.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
      el.classList.add('is-tracking');
    });
  };

  const handlePointerLeave = (): void => {
    if (!enableParallax) return;
    const el = parallaxRef.current;
    if (!el) return;
    if (trackingRaf.current) cancelAnimationFrame(trackingRaf.current);
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--rx', '0deg');
    el.classList.remove('is-tracking');
  };

  useEffect(() => () => {
    if (trackingRaf.current) cancelAnimationFrame(trackingRaf.current);
  }, []);

  return (
    <div
      className={`group relative shrink-0 ${className ?? sizeClasses[size]} ${
        onClick ? 'cursor-pointer' : ''
      } perspective-1000`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${card.nameCn} (${card.name})${isReversed && isRevealed ? ' · 逆位' : ''}${
        !isRevealed ? ' · 未翻开' : ''
      }`}
    >
      <div ref={parallaxRef} className={`relative h-full w-full ${enableParallax ? 'card-parallax' : ''}`}>
        <div
          className={`card-flip transform-style-3d relative h-full w-full ${
            isRevealed ? 'rotate-y-180' : ''
          }`}
        >
          {/* ─── 背面 ─── */}
          <div
            className={`backface-hidden absolute h-full w-full overflow-hidden rounded-lg border bg-[var(--ink-veil)] ${
              isRevealed
                ? 'border-[var(--ink-line)]'
                : 'border-[var(--gold-faint)] shadow-[0_16px_36px_-22px_rgba(0,0,0,0.9)] group-hover:shadow-[0_20px_44px_-20px_rgba(0,0,0,0.95),0_0_28px_-12px_var(--gold-glow)]'
            }`}
            style={{ transition: 'box-shadow 350ms var(--ease-ritual)' }}
          >
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 78% 55% at 50% 44%, rgba(210,178,116,0.14) 0%, rgba(210,178,116,0.04) 45%, transparent 76%)',
              }}
            />
            {/* 内框 */}
            <div aria-hidden className="absolute inset-2 rounded border border-[var(--gold-faint)]/60" />
            <div aria-hidden className="absolute inset-3.5 rounded-sm border border-[var(--ink-line-strong)]" />

            {/* 中央徽记 */}
            <div className="relative flex h-full w-full flex-col items-center justify-center gap-2.5">
              <div className="relative flex items-center justify-center">
                <span
                  aria-hidden
                  className="absolute h-11 w-11 rounded-full border border-dashed border-[var(--gold-faint)] anim-lunar"
                >
                  <span className="absolute -top-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--gold-dim)]" />
                </span>
                <span className="text-xl text-gold">✦</span>
              </div>
              <span aria-hidden className="h-px w-8 bg-[var(--gold-faint)]" />
              <span className="font-heading text-[9px] uppercase tracking-[0.3em] text-gold-dim">
                Tarot
              </span>
            </div>

            {/* 四角刻痕 */}
            {[
              'left-3 top-3 border-l border-t',
              'right-3 top-3 border-r border-t',
              'bottom-3 left-3 border-b border-l',
              'bottom-3 right-3 border-b border-r',
            ].map((pos) => (
              <span
                key={pos}
                aria-hidden
                className={`absolute h-2 w-2 border-[var(--gold-dim)]/60 ${pos}`}
              />
            ))}
          </div>

          {/* ─── 正面 ─── */}
          <div
            className={`backface-hidden absolute h-full w-full overflow-hidden rounded-lg bg-[var(--ink-void)] ${
              isRevealed ? 'card-revealed-halo' : 'border border-[var(--ink-line)]'
            }`}
            style={{ transform: cardFaceTransform }}
          >
            {!imageError ? (
              <Image
                src={card.image}
                alt={card.name}
                fill
                sizes={
                  className
                    ? '(min-width: 1024px) 384px, (min-width: 768px) 320px, 256px'
                    : size === 'lg'
                      ? '240px'
                      : size === 'md'
                        ? '176px'
                        : '96px'
                }
                className="object-cover"
                onError={() => setImageError(true)}
                priority={size === 'lg' || !!className}
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center">
                <span className="text-xl text-gold-dim" aria-hidden>✦</span>
                <span aria-hidden className="h-px w-10 bg-[var(--gold-faint)]" />
                <span className="font-heading text-sm tracking-[0.1em] text-bone">{card.nameCn}</span>
                <span className="text-[9px] uppercase tracking-[0.16em] text-bone-faint">{card.name}</span>
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-white/10" />
            <div ref={shimmerRef} className="card-shimmer rounded-lg" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );
}
