'use client';

import { useState, type JSX } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { TarotCard } from '@/lib/tarot/types';
import { allCards, majorArcanaCards, getCardsBySuit } from '@/lib/tarot/cards';
import { CardDetail } from '@/components/CardDetail';

type FilterKey = 'all' | 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';

interface FilterTab {
  key: FilterKey;
  labelCn: string;
  labelEn: string;
  count: number;
}

const FILTER_TABS: FilterTab[] = [
  { key: 'all',       labelCn: '全 部',      labelEn: 'All',       count: allCards.length },
  { key: 'major',     labelCn: '大 阿 卡 纳', labelEn: 'Major',     count: majorArcanaCards.length },
  { key: 'wands',     labelCn: '权 杖',      labelEn: 'Wands',     count: getCardsBySuit('wands').length },
  { key: 'cups',      labelCn: '圣 杯',      labelEn: 'Cups',      count: getCardsBySuit('cups').length },
  { key: 'swords',    labelCn: '宝 剑',      labelEn: 'Swords',    count: getCardsBySuit('swords').length },
  { key: 'pentacles', labelCn: '星 币',      labelEn: 'Pentacles', count: getCardsBySuit('pentacles').length },
];

interface CardSection {
  no: string;
  key: FilterKey;
  titleCn: string;
  titleEn: string;
  subtitle: string;
  cards: TarotCard[];
}

/** 展厅编号固定 · 不因筛选而变动 */
const SECTIONS: CardSection[] = [
  {
    no: '01',
    key: 'major',
    titleCn: '大 阿 卡 纳',
    titleEn: 'Major Arcana',
    subtitle: '从愚者到世界 · 二十二道命运的轮转',
    cards: majorArcanaCards,
  },
  {
    no: '02',
    key: 'wands',
    titleCn: '权 杖',
    titleEn: 'Wands · 火',
    subtitle: '行 动 ╱ 创 造 ╱ 激 情',
    cards: getCardsBySuit('wands'),
  },
  {
    no: '03',
    key: 'cups',
    titleCn: '圣 杯',
    titleEn: 'Cups · 水',
    subtitle: '情 感 ╱ 关 系 ╱ 直 觉',
    cards: getCardsBySuit('cups'),
  },
  {
    no: '04',
    key: 'swords',
    titleCn: '宝 剑',
    titleEn: 'Swords · 风',
    subtitle: '思 想 ╱ 冲 突 ╱ 真 相',
    cards: getCardsBySuit('swords'),
  },
  {
    no: '05',
    key: 'pentacles',
    titleCn: '星 币',
    titleEn: 'Pentacles · 土',
    subtitle: '物 质 ╱ 工 作 ╱ 实 际',
    cards: getCardsBySuit('pentacles'),
  },
];

const ROMAN_NUMERALS: ReadonlyArray<readonly [number, string]> = [
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

function toRoman(value: number): string {
  let remaining = value;
  let result = '';
  for (const [numeral, glyph] of ROMAN_NUMERALS) {
    while (remaining >= numeral) {
      result += glyph;
      remaining -= numeral;
    }
  }
  return result;
}

/** 馆藏编号 · 大阿卡纳用罗马数字（愚者保留 0），小阿卡纳用两位序号 */
function catalogNumber(card: TarotCard): string {
  if (card.type === 'major') {
    return card.number === 0 ? '0' : toRoman(card.number);
  }
  return String(card.number).padStart(2, '0');
}

export default function LibraryPage(): JSX.Element {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [activeCard, setActiveCard] = useState<TarotCard | null>(null);

  const sections = filter === 'all' ? SECTIONS : SECTIONS.filter((s) => s.key === filter);
  const totalCount = sections.reduce((sum, s) => sum + s.cards.length, 0);

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* ─── 顶部导航 · 左返回 / 右导航 ─── */}
      <nav className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-6 md:px-10 py-7">
        <Link
          href="/"
          className="group flex items-center gap-3 text-bone-dim hover:text-bone transition-colors duration-500"
          style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
        >
          <span
            aria-hidden
            className="text-base transition-transform duration-700 group-hover:-translate-x-1"
            style={{ transitionTimingFunction: 'var(--ease-veil)' }}
          >
            ←
          </span>
          <span className="cn-nav">返 回</span>
        </Link>

        <div className="flex items-center gap-8 md:gap-10">
          <Link
            href="/reading"
            className="cn-nav text-bone-dim hover:text-gold transition-colors duration-500"
            style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
          >
            占 卜
          </Link>
          <Link
            href="/history"
            className="cn-nav text-bone-dim hover:text-gold transition-colors duration-500"
            style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
          >
            轨 迹
          </Link>
        </div>
      </nav>

      <main
        id="main-content"
        className="relative flex-1 w-full max-w-[1400px] mx-auto px-6 md:px-10 pt-32 md:pt-40 pb-24"
      >
        {/* ─── 标题 · 左对齐巨型字 + 侧翼装饰 ─── */}
        <header className="relative anim-veil-rise">
          {/* 翼厅编号水印 */}
          <span
            aria-hidden
            className="pointer-events-none select-none absolute -top-16 md:-top-24 right-14 xl:right-28 font-heading leading-none text-[9rem] md:text-[13rem] text-bone opacity-[0.04]"
          >
            78
          </span>

          {/* 星符散布 */}
          <span aria-hidden className="scatter-symbol anim-twinkle text-lg top-[8%] right-[32%]">✦</span>
          <span aria-hidden className="scatter-symbol anim-drift text-base top-[68%] right-[14%]">☾</span>
          <span aria-hidden className="scatter-symbol anim-twinkle text-xs -top-[8%] left-[44%] [animation-delay:1.4s]">⊹</span>

          {/* 垂直侧标 · 画廊铭牌 */}
          <span
            aria-hidden
            className="text-vertical hidden xl:block absolute right-0 top-1/2 -translate-y-1/2 text-tiny font-heading text-bone-whisper select-none"
          >
            命 运 画 廊 · GALLERY OF FATE
          </span>

          <div className="relative flex flex-wrap items-end gap-x-8 gap-y-5">
            <h1 className="font-heading text-massive text-bone">七十八卷</h1>
            <div className="flex flex-col gap-2.5 pb-2 md:pb-3">
              <span className="text-tiny font-heading text-gold-dim">Seventy-Eight Volumes</span>
              <span className="text-tiny font-heading text-bone-whisper">The Complete Arcana</span>
            </div>
          </div>

          <p className="relative font-body italic-soft text-bone-faint text-sm md:text-base leading-relaxed max-w-xl mt-8">
            像走过一座深夜的画廊 —— 每一卷牌，都是一帧命运的图景。
          </p>

          {/* 分隔线 · 左端一段金 */}
          <div className="relative mt-12 rule-h" aria-hidden>
            <span className="absolute -top-px left-0 h-px w-28 bg-[var(--gold-dim)]" />
          </div>
        </header>

        {/* ─── 筛选条 · 横向滚动 · 纯文字 + 下划线指示 ─── */}
        <div className="sticky top-0 z-20 mt-14 bleed-left bleed-right bg-ink-deep/80 backdrop-blur-md hairline-bottom">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10">
            <div className="flex items-stretch gap-8 md:gap-10 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {FILTER_TABS.map((tab) => {
                const isActive = filter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFilter(tab.key)}
                    aria-pressed={isActive}
                    className={`group relative flex shrink-0 items-baseline gap-2.5 pt-4 pb-3.5 transition-colors duration-500 ${
                      isActive ? 'text-gold' : 'text-bone-dim hover:text-bone'
                    }`}
                    style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
                  >
                    <span className="cn-nav">{tab.labelCn}</span>
                    <span
                      className={`text-tiny font-heading transition-colors duration-500 ${
                        isActive ? 'text-gold-dim' : 'text-bone-whisper group-hover:text-bone-faint'
                      }`}
                    >
                      {tab.count}
                    </span>
                    {/* 下划线指示 · 从左展开 */}
                    <span
                      aria-hidden
                      className={`absolute inset-x-0 bottom-0 h-px origin-left transition-transform duration-700 ${
                        isActive
                          ? 'scale-x-100 bg-[var(--gold)]'
                          : 'scale-x-0 bg-[var(--bone-whisper)] group-hover:scale-x-100'
                      }`}
                      style={{ transitionTimingFunction: 'var(--ease-veil)' }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── 展厅 · 分组陈列 ─── */}
        <div key={filter} className="anim-stagger mt-20 md:mt-24 space-y-24 md:space-y-32">
          {sections.map((section) => (
            <section key={section.key} aria-labelledby={`section-${section.key}`}>
              {/* 展签 · 编号 — 名称 · 英文 · 藏品数 */}
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <span aria-hidden className="font-heading text-sm md:text-base text-gold-dim tracking-[0.3em]">
                  {section.no}
                </span>
                <span aria-hidden className="font-body text-bone-whisper">—</span>
                <h2
                  id={`section-${section.key}`}
                  className="font-heading text-2xl md:text-3xl text-bone tracking-[0.2em]"
                >
                  {section.titleCn}
                </h2>
                <span className="text-tiny font-heading text-bone-faint ml-1">{section.titleEn}</span>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                <span aria-hidden className="h-px w-10 bg-[var(--gold-faint)] shrink-0" />
                <p className="font-body italic-soft text-bone-faint text-sm">{section.subtitle}</p>
                <span aria-hidden className="rule-h flex-1 hidden sm:block min-w-8" />
                <span className="cn-hint text-bone-whisper shrink-0">{section.cards.length} 件藏品</span>
              </div>

              {/* 藏品网格 · 悬浮陈列 */}
              <div className="gallery-grid mt-10 md:mt-14">
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

        {/* ─── 卷终 ─── */}
        <footer className="mt-28 md:mt-36">
          <div className="ornament-divider" aria-hidden>
            <span className="ornament-gem" />
          </div>
          <p className="cn-hint text-bone-whisper text-center mt-8">卷 终 · 命 运 仍 在 书 写</p>
        </footer>
      </main>

      {/* ─── 浮动计数 · 当前陈列卷数 ─── */}
      <aside
        aria-live="polite"
        className="fixed bottom-6 right-6 z-30 ink-panel-quiet flex items-center gap-3 px-4 py-3 opacity-0 anim-fade-in-up [animation-delay:700ms]"
      >
        <span aria-hidden className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full bg-[var(--gold-glow)] anim-whisper" />
          <span className="relative inline-flex h-1.5 w-1.5 bg-[var(--gold)]" />
        </span>
        <span key={totalCount} className="anim-fade-in font-heading text-lg leading-none text-gold">
          {totalCount}
        </span>
        <span className="text-tiny font-heading text-bone-faint">卷 · 陈列中</span>
      </aside>

      <CardDetail card={activeCard} onClose={() => setActiveCard(null)} />
    </div>
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
      className="group relative flex flex-col text-left transition-transform duration-700 hover:-translate-y-1 focus-visible:-translate-y-1"
      style={{ transitionTimingFunction: 'var(--ease-veil)' }}
    >
      {/* 悬浮画框 · 无边框 · hover 金色辉光 */}
      <div
        className="relative w-full aspect-[3/5] overflow-hidden shadow-[0_18px_36px_-22px_rgba(4,3,8,0.85)] transition-shadow duration-700 group-hover:shadow-[0_30px_60px_-24px_rgba(4,3,8,0.95),0_0_48px_-16px_var(--gold-glow),0_0_0_0.5px_var(--gold-faint)] group-focus-visible:shadow-[0_30px_60px_-24px_rgba(4,3,8,0.95),0_0_48px_-16px_var(--gold-glow),0_0_0_0.5px_var(--gold-faint)]"
        style={{ transitionTimingFunction: 'var(--ease-veil)' }}
      >
        {!imageError ? (
          <>
            <Image
              src={card.image}
              alt={`${card.nameCn} ${card.name}`}
              fill
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 200px"
              className="object-cover transition-transform duration-[1400ms] group-hover:scale-[1.05]"
              style={{ transitionTimingFunction: 'var(--ease-veil)' }}
              onError={() => setImageError(true)}
            />
            {/* 展柜灯光 · 底部微影 */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[var(--ink-void)]/50 via-transparent to-transparent opacity-50 transition-opacity duration-700 group-hover:opacity-80" />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-3 bg-[var(--ink-veil)] hairline">
            <span aria-hidden className="text-gold-dim text-xl">✦</span>
            <div className="rule-h-gold w-8" />
            <span className="font-heading text-bone text-xs tracking-[0.18em] text-center">
              {card.nameCn}
            </span>
          </div>
        )}
      </div>

      {/* 铭牌 · hover 浮现（触屏设备常驻） */}
      <div
        className="card-name-overlay mt-4 flex items-start gap-3 opacity-0 translate-y-2 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0"
        style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
      >
        <span className="font-heading text-tiny text-gold-dim w-8 shrink-0 pt-1 text-left">
          {catalogNo}
        </span>
        <div className="min-w-0">
          <p className="font-heading text-sm text-bone tracking-[0.14em] leading-snug transition-colors duration-500 group-hover:text-gold-warm">
            {card.nameCn}
          </p>
          <p className="font-heading text-tiny text-bone-whisper mt-1.5 truncate">{card.name}</p>
        </div>
      </div>
    </button>
  );
}
