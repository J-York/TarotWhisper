'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { TarotCard } from '@/lib/tarot/types';

interface TarotCardProps {
  card: TarotCard;
  isReversed?: boolean;
  isRevealed?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  /**
   * 是否启用鼠标视差与翻牌 shimmer。
   * 解读页底部的「迷你回顾」可关闭以避免过度。
   */
  enableInteractions?: boolean;
}

// 视差最大角度（°）— ±8 是触觉上「轻端在手里」的感觉，不致眩晕
const PARALLAX_MAX = 8;

export function TarotCardComponent({
  card,
  isReversed = false,
  isRevealed = false,
  onClick,
  size = 'md',
  enableInteractions = true,
}: TarotCardProps) {
  const [imageError, setImageError] = useState(false);

  const parallaxRef = useRef<HTMLDivElement>(null);
  const shimmerRef = useRef<HTMLDivElement>(null);
  const trackingRaf = useRef<number>(0);
  const wasRevealed = useRef<boolean>(isRevealed);

  const sizeClasses = {
    sm: 'w-24 h-40',
    md: 'w-48 h-80',
    lg: 'w-64 h-96',
  };

  // 翻牌后若为逆位，再叠加 180° 旋转
  const cardFaceTransform =
    isReversed && isRevealed
      ? 'rotateY(180deg) rotate(180deg)'
      : 'rotateY(180deg)';

  /* ─── 翻牌 shimmer · 直接操作 DOM 避免 effect 中 setState ─── */
  useEffect(() => {
    const justRevealed = !wasRevealed.current && isRevealed;
    wasRevealed.current = isRevealed;
    if (!justRevealed) return;

    const el = shimmerRef.current;
    if (!el) return;

    // 跟随翻牌动画：牌面约在 400ms 后朝前，此时上 shimmer
    const startTimer = window.setTimeout(() => {
      el.classList.add('is-active');
    }, 380);
    const onEnd = (): void => el.classList.remove('is-active');
    el.addEventListener('animationend', onEnd, { once: true });

    return () => {
      window.clearTimeout(startTimer);
      el.removeEventListener('animationend', onEnd);
      el.classList.remove('is-active');
    };
  }, [isRevealed]);

  /* ─── 鼠标视差 · 仅 sm 以上 + 开启 ─── */
  const enableParallax = enableInteractions && size !== 'sm';

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (!enableParallax) return;
    const el = parallaxRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;   // 0..1
    const py = (e.clientY - rect.top) / rect.height;   // 0..1

    // 当卡背朝上时反向（保持「推同一侧上抬」的物理直觉）
    const direction = isRevealed ? 1 : -1;
    const ry = (px - 0.5) * 2 * PARALLAX_MAX * direction;   // 左右
    const rx = -(py - 0.5) * 2 * PARALLAX_MAX;              // 上下

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

  useEffect(() => {
    return () => {
      if (trackingRaf.current) cancelAnimationFrame(trackingRaf.current);
    };
  }, []);

  return (
    <div
      className={`relative ${sizeClasses[size]} cursor-pointer perspective-1000 group`}
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
      aria-label={`${card.nameCn} (${card.name})${isReversed && isRevealed ? ' · 逆位' : ''}${!isRevealed ? ' · 未翻开' : ''}`}
    >
      {/* parallax 容器 · 接收 --rx / --ry */}
      <div
        ref={parallaxRef}
        className={`relative w-full h-full ${enableParallax ? 'card-parallax' : ''}`}
      >
        <div
          className={`relative w-full h-full card-flip transform-style-3d ${
            isRevealed ? 'rotate-y-180' : ''
          }`}
        >
          {/* ─── 背面 · 极简墨色 ─── */}
          <div
            className={`absolute w-full h-full backface-hidden overflow-hidden bg-[var(--ink-void)] hairline ${
              !isRevealed ? 'group-hover:shadow-[0_0_24px_-12px_var(--gold-glow)]' : ''
            }`}
            style={{ transition: 'box-shadow 700ms var(--ease-veil)' }}
          >
            <div className="w-full h-full relative flex items-center justify-center">
              {/* 内框 · 0.5px 双层 */}
              <div className="absolute inset-2 hairline" />
              <div className="absolute inset-3.5 hairline-strong" />

              {/* 中央徽记 */}
              <div className="relative flex flex-col items-center gap-3 transition-transform duration-700 group-hover:scale-105"
                   style={{ transitionTimingFunction: 'var(--ease-veil)' }}>
                <span className="text-gold-dim text-2xl">✦</span>
                <span className="h-px w-10 bg-[var(--gold-faint)]" />
                <span className="font-display text-bone-faint text-[10px] tracking-veil uppercase">
                  Tarot
                </span>
              </div>

              {/* 角部刻痕 */}
              <CornerTicks />
            </div>
          </div>

          {/* ─── 正面 · 仅图像（含跟随翻转的底部渐隐） + shimmer ───
             可读文字（牌名 / fallback 字标）不放在这里，以免逆位时被
             rotate(180deg) 连同上下颠倒 */}
          <div
            className={`absolute w-full h-full backface-hidden overflow-hidden bg-[var(--ink-void)] ${
              isRevealed ? 'card-revealed-halo card-halo-breathe' : 'hairline'
            }`}
            style={{ transform: cardFaceTransform }}
          >
            {!imageError && (
              <div className="w-full h-full relative">
                <Image
                  src={card.image}
                  alt={card.name}
                  fill
                  sizes={size === 'lg' ? '256px' : size === 'md' ? '192px' : '96px'}
                  className="object-cover"
                  onError={() => setImageError(true)}
                  priority={size === 'lg'}
                />
                {/* 底部渐隐 · 跟随牌图翻转，视觉合理 */}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink-void)]/85 via-transparent to-[var(--ink-void)]/30 pointer-events-none" />
              </div>
            )}

            {/* 翻牌瞬间的金箔 shimmer · 仅一次，由 effect 直接操控 class */}
            <div ref={shimmerRef} className="card-shimmer" aria-hidden />
          </div>
        </div>
      </div>

      {/* ─── 文字 / 字标层 · 独立于 3D 翻转，永远视觉正向 ───
         彻底解决了逆位时（cardFaceTransform 含 rotate(180deg)）牌名跟着
         上下颠倒 / 被推到视觉顶部的问题。 */}
      {isRevealed && (imageError ? (
        // 图片缺失时的纪念碑式版面 · 常显
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center pointer-events-none">
          <span className="text-gold-dim text-2xl mb-4">
            {card.type === 'major' ? '✦' : getSuitSymbol(card.suit)}
          </span>
          <div className="rule-h-gold w-12 mb-4" />
          <div className="font-display text-lg text-bone mb-2 tracking-[0.18em]">
            {card.nameCn}
          </div>
          <div className="font-display text-[11px] tracking-veil text-bone-dim uppercase">
            {card.name}
          </div>
        </div>
      ) : (
        // 图片正常时的 hover 牌名 · 自带底部渐变以保证可读性
        // card-name-overlay：触屏设备（无 hover）上常驻显示，见 globals.css
        <div
          className="card-name-overlay absolute bottom-0 inset-x-0 p-4 pt-10 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{
            transitionTimingFunction: 'var(--ease-veil)',
            background:
              'linear-gradient(to top, rgba(6,6,10,0.92), rgba(6,6,10,0.7) 40%, transparent)',
          }}
        >
          <div className="rule-h-gold w-8 mx-auto mb-2" />
          <h3 className="font-display text-bone text-base tracking-[0.2em]">
            {card.nameCn}
          </h3>
          <p className="font-display text-[10px] tracking-veil text-gold-dim uppercase mt-1">
            {card.name}
          </p>
        </div>
      ))}

      {/* 逆位标识 */}
      {isRevealed && isReversed && (
        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 anim-fade-in">
          <span className="cn-label text-gold-dim">
            逆 位
          </span>
        </div>
      )}
    </div>
  );
}

function CornerTicks() {
  return (
    <>
      <span className="absolute top-3 left-3 w-2 h-px bg-[var(--bone-whisper)]" />
      <span className="absolute top-3 left-3 h-2 w-px bg-[var(--bone-whisper)]" />
      <span className="absolute top-3 right-3 w-2 h-px bg-[var(--bone-whisper)]" />
      <span className="absolute top-3 right-3 h-2 w-px bg-[var(--bone-whisper)]" />
      <span className="absolute bottom-3 left-3 w-2 h-px bg-[var(--bone-whisper)]" />
      <span className="absolute bottom-3 left-3 h-2 w-px bg-[var(--bone-whisper)]" />
      <span className="absolute bottom-3 right-3 w-2 h-px bg-[var(--bone-whisper)]" />
      <span className="absolute bottom-3 right-3 h-2 w-px bg-[var(--bone-whisper)]" />
    </>
  );
}

function getSuitSymbol(suit?: string): string {
  switch (suit) {
    case 'wands':     return '✦';
    case 'cups':      return '◇';
    case 'swords':    return '✧';
    case 'pentacles': return '⊹';
    default:          return '✦';
  }
}
