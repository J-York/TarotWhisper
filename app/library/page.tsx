'use client';

import { useMemo, useState, type JSX } from 'react';
import Image from 'next/image';

import { TarotCard } from '@/lib/tarot/types';
import { allCards, majorArcanaCards, getCardsBySuit } from '@/lib/tarot/cards';
import { CardDetail } from '@/components/CardDetail';

type FilterKey = 'all' | 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';

interface FilterTab {
  key: FilterKey;
  label: string;
  count: number;
}

const FILTER_TABS: FilterTab[] = [
  { key: 'all', label: '全部', count: allCards.length },
  { key: 'major', label: '大阿卡纳', count: majorArcanaCards.length },
  { key: 'wands', label: '权杖', count: getCardsBySuit('wands').length },
  { key: 'cups', label: '圣杯', count: getCardsBySuit('cups').length },
  { key: 'swords', label: '宝剑', count: getCardsBySuit('swords').length },
  { key: 'pentacles', label: '星币', count: getCardsBySuit('pentacles').length },
];

interface CardSection {
  no: string;
  key: FilterKey;
  title: string;
  en: string;
  element: string;
  cards: TarotCard[];
}

const SECTIONS: CardSection[] = [
  { no: '01', key: 'major', title: '大阿卡纳', en: 'Major Arcana', element: '愚者 → 世界', cards: majorArcanaCards },
  { no: '02', key: 'wands', title: '权杖', en: 'Wands', element: '火 · 行动与创造', cards: getCardsBySuit('wands') },
  { no: '03', key: 'cups', title: '圣杯', en: 'Cups', element: '水 · 情感与关系', cards: getCardsBySuit('cups') },
  { no: '04', key: 'swords', title: '宝剑', en: 'Swords', element: '风 · 思想与真相', cards: getCardsBySuit('swords') },
  { no: '05', key: 'pentacles', title: '星币', en: 'Pentacles', element: '土 · 物质与工作', cards: getCardsBySuit('pentacles') },
];

const ROMAN: ReadonlyArray<readonly [number, string]> = [
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

function toRoman(value: number): string {
  let remaining = value;
  let result = '';
  for (const [numeral, glyph] of ROMAN) {
    while (remaining >= numeral) {
      result += glyph;
      remaining -= numeral;
    }
  }
  return result;
}

function catalogNumber(card: TarotCard): string {
  if (card.type === 'major') return card.number === 0 ? '0' : toRoman(card.number);
  return String(card.number).padStart(2, '0');
}

export default function LibraryPage(): JSX.Element {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');
  const [activeCard, setActiveCard] = useState<TarotCard | null>(null);

  const keyword = query.trim().toLowerCase();

  const sections = useMemo(() => {
    const base = filter === 'all' ? SECTIONS : SECTIONS.filter((s) => s.key === filter);
    if (!keyword) return base;
    return base
      .map((section) => ({
        ...section,
        cards: section.cards.filter(
          (card) =>
            card.nameCn.toLowerCase().includes(keyword) ||
            card.name.toLowerCase().includes(keyword) ||
            card.keywords.upright.some((k) => k.toLowerCase().includes(keyword)) ||
            card.keywords.reversed.some((k) => k.toLowerCase().includes(keyword))
        ),
      }))
      .filter((section) => section.cards.length > 0);
  }, [filter, keyword]);

  const totalCount = sections.reduce((sum, s) => sum + s.cards.length, 0);

  return (
    <main id="main-content" className="page-container page-main">
      <header>
        <p className="eyebrow">Card Library · 牌典</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="page-title">七十八张牌</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-bone-faint">
              翻阅整副韦特塔罗。点击任意牌面，查看正位与逆位的含义、关键词与图像。
            </p>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-2xl text-gold">{totalCount}</span>
            <span className="text-xs text-bone-faint">张展示中</span>
          </div>
        </div>
      </header>

      {/* ─── 筛选条 ─── */}
      <div className="sticky top-16 z-20 -mx-5 mt-6 border-b border-[var(--ink-line)] bg-[var(--ink-deep)]/92 px-5 pb-3 pt-3 backdrop-blur-xl md:-mx-8 md:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTER_TABS.map((tab) => {
              const active = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  aria-pressed={active}
                  className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm transition-colors ${
                    active
                      ? 'bg-[rgba(210,178,116,0.14)] text-gold-warm'
                      : 'text-bone-faint hover:bg-white/5 hover:text-bone'
                  }`}
                >
                  {tab.label}
                  <span className={`text-[10px] ${active ? 'text-gold-dim' : 'text-bone-whisper'}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <label className="relative flex h-8 w-full items-center sm:w-52">
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-2.5 h-4 w-4 text-bone-faint"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden
            >
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索牌名或关键词"
              aria-label="搜索牌名或关键词"
              className="h-8 w-full rounded-full border border-[var(--ink-line-strong)] bg-[rgba(10,8,18,0.6)] pl-8 pr-3 text-xs text-bone outline-none transition-colors placeholder:text-bone-whisper focus:border-[var(--gold-dim)]"
            />
          </label>
        </div>
      </div>

      {/* ─── 分组陈列 ─── */}
      {sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <span className="text-xl text-bone-whisper" aria-hidden>◇</span>
          <p className="text-sm text-bone-faint">没有匹配「{query}」的牌</p>
          <button type="button" onClick={() => setQuery('')} className="btn-ink h-9 px-4 text-sm">
            清除搜索
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-12">
          {sections.map((section) => (
            <section key={section.key} aria-labelledby={`section-${section.key}`}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-heading text-xs text-gold">{section.no}</span>
                <h2 id={`section-${section.key}`} className="font-heading text-xl tracking-[0.04em] text-bone">
                  {section.title}
                </h2>
                <span className="text-[10px] uppercase tracking-[0.16em] text-bone-faint">{section.en}</span>
                <span className="text-xs text-bone-faint">{section.element}</span>
                <span className="ml-auto text-[11px] text-bone-faint">{section.cards.length} 张</span>
              </div>
              <div className="mt-2 h-px w-full bg-[var(--ink-line)]" aria-hidden />

              <div className="gallery-grid mt-5">
                {section.cards.map((card) => (
                  <CardThumb
                    key={card.id}
                    card={card}
                    catalogNo={catalogNumber(card)}
                    onClick={() => setActiveCard(card)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <CardDetail card={activeCard} onClose={() => setActiveCard(null)} />
    </main>
  );
}

interface CardThumbProps {
  card: TarotCard;
  catalogNo: string;
  onClick: () => void;
}

function CardThumb({ card, catalogNo, onClick }: CardThumbProps): JSX.Element {
  const [imageError, setImageError] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col text-left"
      aria-label={`${card.nameCn} ${card.name}`}
    >
      <div className="relative aspect-[3/5] w-full overflow-hidden rounded-lg border border-[var(--ink-line)] bg-[var(--ink-void)] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[var(--gold-dim)] group-hover:shadow-[0_20px_40px_-24px_rgba(0,0,0,0.95),0_0_36px_-16px_var(--gold-glow)]">
        {!imageError ? (
          <>
            <Image
              src={card.image}
              alt={`${card.nameCn} ${card.name}`}
              fill
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 176px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              onError={() => setImageError(true)}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--ink-void)]/55 via-transparent to-transparent" />
            <span className="absolute left-2 top-2 rounded bg-[var(--ink-void)]/70 px-1.5 py-0.5 text-[9px] tracking-wider text-gold-dim">
              {catalogNo}
            </span>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-2 text-center">
            <span className="text-base text-gold-dim" aria-hidden>✦</span>
            <span className="font-heading text-[11px] tracking-[0.08em] text-bone">{card.nameCn}</span>
          </div>
        )}
      </div>

      <div className="mt-2.5">
        <p className="truncate font-heading text-sm tracking-[0.02em] text-bone transition-colors group-hover:text-gold-warm">
          {card.nameCn}
        </p>
        <p className="mt-0.5 truncate text-[10px] uppercase tracking-[0.1em] text-bone-faint">{card.name}</p>
      </div>
    </button>
  );
}
