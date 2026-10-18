'use client';

import { useEffect, useMemo, useState, type ReactElement } from 'react';

import { CardDetail } from '@/components/CardDetail';
import { CardPlate } from '@/components/CardPlate';
import { ARCANA, ARCANA_ORDER, arcanaOf, catalogNumber, type Arcana } from '@/lib/tarot/arcana';
import { allCards } from '@/lib/tarot/cards';
import type { TarotCard } from '@/lib/tarot/types';

type Filter = 'all' | Arcana;

const SECTIONS = ARCANA_ORDER.map((key) => ({
  key,
  cards: allCards.filter((card) => arcanaOf(card) === key),
}));

const FILTERS: { key: Filter; label: string; count: number }[] = [
  { key: 'all', label: '全部', count: allCards.length },
  ...SECTIONS.map((s) => ({ key: s.key, label: ARCANA[s.key].nameCn, count: s.cards.length })),
];

function matches(card: TarotCard, keyword: string): boolean {
  return (
    card.nameCn.toLowerCase().includes(keyword) ||
    card.name.toLowerCase().includes(keyword) ||
    card.keywords.upright.some((k) => k.toLowerCase().includes(keyword)) ||
    card.keywords.reversed.some((k) => k.toLowerCase().includes(keyword))
  );
}

export default function LibraryPage(): ReactElement {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    // 今日一牌等处会带 ?card=<id> 直接打开某张牌
    const id = new URLSearchParams(window.location.search).get('card');
    if (id && allCards.some((card) => card.id === id)) queueMicrotask(() => setActiveId(id));
  }, []);

  const keyword = query.trim().toLowerCase();

  const sections = useMemo(
    () =>
      SECTIONS.filter((s) => filter === 'all' || s.key === filter)
        .map((s) => ({ ...s, cards: keyword ? s.cards.filter((card) => matches(card, keyword)) : s.cards }))
        .filter((s) => s.cards.length > 0),
    [filter, keyword],
  );

  const visible = useMemo(() => sections.flatMap((s) => s.cards), [sections]);
  const shown = visible.length;

  // 详情里前后翻页沿用当前筛选结果；从链接直接打开、又不在结果里时退回整副牌
  const browseList = visible.some((card) => card.id === activeId) ? visible : allCards;
  const activeIndex = browseList.findIndex((card) => card.id === activeId);
  const activeCard = activeIndex >= 0 ? browseList[activeIndex] : null;

  const closeDetail = (): void => {
    setActiveId(null);
    if (window.location.search) window.history.replaceState(null, '', window.location.pathname);
  };

  const step = (delta: number): void => {
    if (activeIndex < 0) return;
    const next = (activeIndex + delta + browseList.length) % browseList.length;
    setActiveId(browseList[next].id);
  };

  return (
    <main id="main-content" className="page-container page-main">
      <header>
        <p className="kicker">牌典</p>
        <h1 className="page-title mt-3">七十八张牌</h1>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-ink-soft">
          整副韦特塔罗。点开任意一张，查看它的正位与逆位。
        </p>
      </header>

      {/* ─── 筛选 ─── */}
      <div className="-mx-5 mt-8 border-b border-line bg-canvas/95 px-5 py-3 backdrop-blur-md md:sticky md:top-[4.25rem] md:z-20 md:-mx-10 md:px-10">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div
            className="-mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label="按牌组筛选"
          >
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                className="chip shrink-0"
              >
                {f.key !== 'all' && <span className={`h-2 w-2 rounded-full ${ARCANA[f.key].bgClass}`} aria-hidden />}
                {f.label}
                <span className="tabular-nums text-ink-muted">{f.count}</span>
              </button>
            ))}
          </div>

          <label className="relative block w-full sm:w-60">
            <span className="sr-only">搜索牌名或关键词</span>
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
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
              className="field h-9 py-0 pl-9 text-sm"
            />
          </label>
        </div>
        {keyword && (
          <p className="mt-2 text-[13px] text-ink-muted" aria-live="polite">
            找到 {shown} 张
          </p>
        )}
      </div>

      {/* ─── 分组陈列 ─── */}
      {sections.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-[15px] text-ink-soft">没有找到与「{query.trim()}」相关的牌。</p>
          <button type="button" onClick={() => setQuery('')} className="btn btn-secondary mt-5 h-9 px-4 text-sm">
            清除搜索
          </button>
        </div>
      ) : (
        <div className="mt-10 space-y-14">
          {sections.map((section) => {
            const meta = ARCANA[section.key];
            return (
              <section key={section.key} aria-labelledby={`arcana-${section.key}`}>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line pb-3">
                  <span className={`h-3 w-3 shrink-0 self-center rounded-[2px] ${meta.bgClass}`} aria-hidden />
                  <h2 id={`arcana-${section.key}`} className="text-xl font-semibold tracking-[0.06em] text-ink">
                    {meta.nameCn}
                  </h2>
                  <span className="font-latin text-base italic text-ink-muted">{meta.nameEn}</span>
                  <span className="text-[13px] text-ink-muted">
                    {meta.element ? `${meta.element}元素 · ${meta.theme}` : meta.theme}
                  </span>
                  <span className="ml-auto text-[13px] tabular-nums text-ink-muted">{section.cards.length} 张</span>
                </div>

                <ul className="mt-6 grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
                  {section.cards.map((card) => (
                    <li key={card.id}>
                      <CardEntry card={card} onOpen={() => setActiveId(card.id)} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <CardDetail
        card={activeCard}
        onClose={closeDetail}
        onPrev={() => step(-1)}
        onNext={() => step(1)}
        position={activeIndex >= 0 ? { index: activeIndex, total: browseList.length } : undefined}
      />
    </main>
  );
}

function CardEntry({ card, onOpen }: { card: TarotCard; onOpen: () => void }): ReactElement {
  const meta = ARCANA[arcanaOf(card)];

  return (
    <button type="button" onClick={onOpen} className="group block w-full text-left">
      <CardPlate
        card={card}
        sizes="(min-width: 1024px) 140px, (min-width: 640px) 22vw, 30vw"
        decorative
        className="transition-transform duration-300 ease-out group-hover:-translate-y-1"
      />
      <span className="mt-3 flex items-baseline gap-2">
        <span className={`shrink-0 font-latin text-sm ${meta.textClass}`}>{catalogNumber(card)}</span>
        <span className="truncate text-[15px] font-semibold text-ink transition-colors group-hover:text-accent">
          {card.nameCn}
        </span>
      </span>
      <span className="mt-0.5 block truncate font-latin text-[13px] italic text-ink-muted">{card.name}</span>
    </button>
  );
}
