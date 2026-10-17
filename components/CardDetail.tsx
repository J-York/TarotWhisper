'use client';

import { useEffect, useState, type ReactElement } from 'react';
import Image from 'next/image';
import { TarotCard } from '@/lib/tarot/types';

interface CardDetailProps {
  card: TarotCard | null;
  onClose: () => void;
}

const SUIT_META: Record<string, { nameCn: string; element: string; symbol: string }> = {
  wands: { nameCn: '权杖', element: '火', symbol: '✦' },
  cups: { nameCn: '圣杯', element: '水', symbol: '◇' },
  swords: { nameCn: '宝剑', element: '风', symbol: '✧' },
  pentacles: { nameCn: '星币', element: '土', symbol: '⊹' },
};

export function CardDetail({ card, onClose }: CardDetailProps): ReactElement | null {
  useEffect(() => {
    if (!card) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [card, onClose]);

  if (!card) return null;

  const suitMeta = card.suit ? SUIT_META[card.suit] : null;
  const typeLabel = card.type === 'major' ? '大阿卡纳' : (suitMeta?.nameCn ?? '小阿卡纳');
  const numberLabel =
    card.type === 'major' ? card.number.toString().padStart(2, '0') : card.number.toString();

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-[var(--ink-void)]/85 p-4 backdrop-blur-md anim-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${card.nameCn} — ${card.name}`}
    >
      <div
        className="surface my-8 w-full max-w-3xl bg-[var(--ink-deep)] anim-veil-rise"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between border-b border-[var(--ink-line)] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="text-gold-dim" aria-hidden>{suitMeta?.symbol ?? '✦'}</span>
            <h2 className="section-title">{typeLabel}</h2>
            <span className="text-[10px] uppercase tracking-[0.16em] text-bone-faint">
              {card.type === 'major' ? 'Major Arcana' : 'Minor Arcana'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="grid h-8 w-8 place-items-center rounded-full text-bone-faint transition-colors hover:bg-white/5 hover:text-bone"
          >
            ×
          </button>
        </div>

        {/* ─── Body ─── */}
        <div className="grid max-h-[74dvh] grid-cols-1 gap-7 overflow-y-auto px-6 py-6 md:grid-cols-[210px_minmax(0,1fr)] md:gap-8">
          {/* 卡面 */}
          <div className="flex flex-col items-center">
            <CardFace key={card.id} card={card} fallbackSymbol={suitMeta?.symbol ?? '◇'} />
            <div className="mt-4 flex items-center gap-3 text-[11px] text-bone-faint">
              <span>编号 {numberLabel}</span>
              {suitMeta && (
                <>
                  <span className="h-3 w-px bg-[var(--ink-line)]" />
                  <span>元素 · {suitMeta.element}</span>
                </>
              )}
            </div>
          </div>

          {/* 含义 */}
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="font-heading text-2xl tracking-[0.04em] text-bone md:text-[28px]">
                {card.nameCn}
              </h3>
              <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-gold-dim">{card.name}</p>
            </div>

            <Section
              symbol="✦"
              title="正位 · Upright"
              keywords={card.keywords.upright}
              meaning={card.meaning.upright}
              accent="gold"
            />
            <Section
              symbol="◇"
              title="逆位 · Reversed"
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
  title: string;
  keywords: string[];
  meaning: string;
  accent: 'gold' | 'mist';
}

function Section({ symbol, title, keywords, meaning, accent }: SectionProps): ReactElement {
  const accentClass = accent === 'gold' ? 'text-gold' : 'text-mist';

  return (
    <section className="rounded-lg border border-[var(--ink-line)] bg-[rgba(20,16,34,0.4)] p-4">
      <div className="flex items-center gap-2">
        <span className={`text-xs ${accentClass}`} aria-hidden>{symbol}</span>
        <h4 className="text-xs tracking-[0.12em] text-bone">{title}</h4>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {keywords.map((kw) => (
          <span
            key={kw}
            className="rounded-full border border-[var(--ink-line)] px-2.5 py-0.5 text-[11px] text-bone-dim"
          >
            {kw}
          </span>
        ))}
      </div>

      <p className="mt-3 font-body text-sm leading-relaxed text-bone-dim">{meaning}</p>
    </section>
  );
}

interface CardFaceProps {
  card: TarotCard;
  fallbackSymbol: string;
}

function CardFace({ card, fallbackSymbol }: CardFaceProps): ReactElement {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="relative aspect-[3/5] w-full max-w-[210px] overflow-hidden rounded-lg border border-[var(--ink-line)] bg-[var(--ink-void)]">
      {!imageError ? (
        <Image
          src={card.image}
          alt={card.name}
          fill
          sizes="210px"
          className="object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-5 text-center">
          <span className="text-2xl text-gold-dim" aria-hidden>
            {card.type === 'major' ? '✦' : fallbackSymbol}
          </span>
          <span aria-hidden className="h-px w-10 bg-[var(--gold-faint)]" />
          <span className="font-heading text-base tracking-[0.1em] text-bone">{card.nameCn}</span>
          <span className="text-[10px] uppercase tracking-[0.16em] text-bone-faint">{card.name}</span>
        </div>
      )}
    </div>
  );
}
