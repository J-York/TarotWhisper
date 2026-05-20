'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { TarotCard } from '@/lib/tarot/types';

interface CardDetailProps {
  card: TarotCard | null;
  onClose: () => void;
}

const SUIT_META: Record<string, { nameCn: string; element: string; symbol: string }> = {
  wands:     { nameCn: '权 杖', element: '火', symbol: '✦' },
  cups:      { nameCn: '圣 杯', element: '水', symbol: '◇' },
  swords:    { nameCn: '宝 剑', element: '风', symbol: '✧' },
  pentacles: { nameCn: '星 币', element: '土', symbol: '⊹' },
};

export function CardDetail({ card, onClose }: CardDetailProps) {
  useEffect(() => {
    if (!card) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [card, onClose]);

  if (!card) return null;

  const suitMeta = card.suit ? SUIT_META[card.suit] : null;
  const typeLabelCn = card.type === 'major' ? '大 阿 卡 纳' : suitMeta?.nameCn ?? '小 阿 卡 纳';
  const typeLabelEn = card.type === 'major' ? 'Major Arcana' : 'Minor Arcana';
  const numberLabel = card.type === 'major'
    ? card.number.toString().padStart(2, '0')
    : card.number.toString();

  return (
    <div
      className="fixed inset-0 bg-[var(--ink-void)]/92 backdrop-blur-md flex items-center justify-center z-50 p-4 anim-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="ink-panel-quiet bg-[var(--ink-deep)] w-full max-w-4xl anim-veil-rise my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between px-10 py-7 hairline-bottom">
          <div className="flex items-center gap-4">
            <span className="text-gold-dim">{suitMeta?.symbol ?? '✦'}</span>
            <h2 className="cn-nav text-bone">
              {typeLabelCn}
            </h2>
            <span className="font-display text-[11px] tracking-veil text-bone-whisper uppercase">
              ╱ {typeLabelEn}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-bone-faint hover:text-bone transition-colors duration-500 text-2xl leading-none"
            style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        {/* ─── Body ─── */}
        <div className="px-10 py-10 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-10 md:gap-12">
          {/* ─── 左：卡面 ─── */}
          <div className="flex flex-col items-center">
            <CardFace key={card.id} card={card} fallbackSymbol={suitMeta?.symbol ?? '◇'} />

            {/* 编号 / 元素徽记 */}
            <div className="mt-7 flex items-center gap-4 cn-label text-bone-dim">
              <span className="text-gold-dim">№</span>
              <span>{numberLabel}</span>
              {suitMeta && (
                <>
                  <span className="w-3 h-px bg-[var(--ink-line)]" />
                  <span>{suitMeta.element}</span>
                </>
              )}
            </div>
          </div>

          {/* ─── 右：含义 ─── */}
          <div className="flex flex-col gap-9">
            {/* 名称 */}
            <div>
              <h3 className="font-display text-3xl md:text-4xl text-bone tracking-[0.2em] mb-3">
                {card.nameCn}
              </h3>
              <p className="font-display text-[11px] tracking-veil text-gold-dim uppercase">
                {card.name}
              </p>
              <div className="rule-h-gold w-20 mt-5" />
            </div>

            {/* 正位 */}
            <Section
              symbol="✦"
              titleCn="正 位"
              titleEn="Upright"
              keywords={card.keywords.upright}
              meaning={card.meaning.upright}
              accent="gold"
            />

            {/* 逆位 */}
            <Section
              symbol="◇"
              titleCn="逆 位"
              titleEn="Reversed"
              keywords={card.keywords.reversed}
              meaning={card.meaning.reversed}
              accent="mist"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface SectionProps {
  symbol: string;
  titleCn: string;
  titleEn: string;
  keywords: string[];
  meaning: string;
  accent: 'gold' | 'mist';
}

function Section({ symbol, titleCn, titleEn, keywords, meaning, accent }: SectionProps) {
  const accentClass = accent === 'gold' ? 'text-gold-dim' : 'text-mist';

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className={`${accentClass} text-base`}>{symbol}</span>
        <span className="cn-nav text-bone">{titleCn}</span>
        <span className="font-display text-[10px] tracking-veil text-bone-whisper uppercase">
          ╱ {titleEn}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {keywords.map((kw) => (
          <span
            key={kw}
            className="cn-hint text-bone-dim px-3 py-1.5 hairline"
          >
            {kw}
          </span>
        ))}
      </div>

      <p className="font-body text-bone-dim text-base leading-relaxed">
        {meaning}
      </p>
    </div>
  );
}

interface CardFaceProps {
  card: TarotCard;
  fallbackSymbol: string;
}

function CardFace({ card, fallbackSymbol }: CardFaceProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="relative w-full max-w-[240px] aspect-[3/5] bg-[var(--ink-void)] hairline overflow-hidden">
      {!imageError ? (
        <>
          <Image
            src={card.image}
            alt={card.name}
            fill
            sizes="(max-width: 768px) 240px, 240px"
            className="object-cover"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink-void)]/55 via-transparent to-transparent pointer-events-none" />
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
          <div className="text-gold-dim text-3xl mb-5">
            {card.type === 'major' ? '✦' : fallbackSymbol}
          </div>
          <div className="rule-h-gold w-12 mb-5" />
          <div className="font-display text-lg text-bone mb-2 tracking-[0.18em]">
            {card.nameCn}
          </div>
          <div className="font-display text-[11px] tracking-veil text-bone-faint uppercase">
            {card.name}
          </div>
        </div>
      )}
    </div>
  );
}
