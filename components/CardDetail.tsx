'use client';

import { useEffect, useEffectEvent, useRef, type ReactElement } from 'react';

import { CardPlate } from '@/components/CardPlate';
import { Dialog, DialogCloseButton } from '@/components/Dialog';
import { ARCANA, arcanaOf, catalogNumber } from '@/lib/tarot/arcana';
import type { TarotCard } from '@/lib/tarot/types';

interface CardDetailProps {
  card: TarotCard | null;
  onClose: () => void;
  /** 在当前列表里前后翻；键盘左右方向键同样可用 */
  onPrev?: () => void;
  onNext?: () => void;
  /** 如「12 / 78」 */
  position?: { index: number; total: number };
}

export function CardDetail({ card, onClose, onPrev, onNext, position }: CardDetailProps): ReactElement {
  const closeRef = useRef<HTMLButtonElement>(null);
  const isOpen = card !== null;

  const handleArrow = useEffectEvent((key: string) => {
    if (key === 'ArrowLeft') onPrev?.();
    else if (key === 'ArrowRight') onNext?.();
  });

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent): void => handleArrow(e.key);
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const meta = card ? ARCANA[arcanaOf(card)] : null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} labelledBy="card-detail-title" size="lg" initialFocusRef={closeRef}>
      {card && meta && (
        <>
          <div className="flex items-center justify-between gap-3 border-b border-line py-2 pl-5 pr-2 md:pl-7 md:pr-3">
            <p className="flex min-w-0 items-center gap-2 text-[13px] text-ink-muted">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-[2px] ${meta.bgClass}`} aria-hidden />
              <span className={meta.textClass}>{meta.nameCn}</span>
              {meta.element && <span>· {meta.element}元素</span>}
              {position && (
                <span className="tabular-nums">
                  · {position.index + 1} / {position.total}
                </span>
              )}
            </p>
            <div className="flex items-center">
              {onPrev && (
                <button type="button" onClick={onPrev} aria-label="上一张" className="btn btn-ghost h-9 w-9 px-0">
                  <Arrow direction="left" />
                </button>
              )}
              {onNext && (
                <button type="button" onClick={onNext} aria-label="下一张" className="btn btn-ghost h-9 w-9 px-0">
                  <Arrow direction="right" />
                </button>
              )}
              <DialogCloseButton onClick={onClose} buttonRef={closeRef} />
            </div>
          </div>

          <div
            key={card.id}
            className="anim-fade grid gap-7 px-5 pb-8 pt-6 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-10 md:px-8 md:pt-8"
          >
            <CardPlate
              card={card}
              sizes="(min-width: 768px) 208px, 176px"
              priority
              className="mx-auto w-44 md:w-full"
            />

            <div className="min-w-0">
              <p className={`font-latin text-xl ${meta.textClass}`}>{catalogNumber(card)}</p>
              <h2 id="card-detail-title" className="mt-1 text-3xl font-bold tracking-[0.04em] text-ink">
                {card.nameCn}
              </h2>
              <p className="mt-1 font-latin text-lg italic text-ink-muted">{card.name}</p>

              <Meaning label="正位" keywords={card.keywords.upright} meaning={card.meaning.upright} />
              <Meaning label="逆位" keywords={card.keywords.reversed} meaning={card.meaning.reversed} reversed />
            </div>
          </div>
        </>
      )}
    </Dialog>
  );
}

interface MeaningProps {
  label: string;
  keywords: string[];
  meaning: string;
  reversed?: boolean;
}

function Meaning({ label, keywords, meaning, reversed = false }: MeaningProps): ReactElement {
  return (
    <section className="mt-6 border-t border-dashed border-line pt-5">
      <h3 className={`text-sm font-semibold tracking-[0.16em] ${reversed ? 'text-accent' : 'text-ink'}`}>{label}</h3>
      <p className="mt-2 break-keep text-[15px] text-ink">{keywords.join(' · ')}</p>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{meaning}</p>
    </section>
  );
}

function Arrow({ direction }: { direction: 'left' | 'right' }): ReactElement {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d={direction === 'left' ? 'm10 3-5 5 5 5' : 'm6 3 5 5-5 5'} />
    </svg>
  );
}
