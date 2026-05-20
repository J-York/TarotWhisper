'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TarotCard } from '@/lib/tarot/types';
import { majorArcanaCards, getCardsBySuit } from '@/lib/tarot/cards';
import { CardDetail } from '@/components/CardDetail';

type FilterKey = 'all' | 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';

interface FilterTab {
  key: FilterKey;
  symbol: string;
  labelCn: string;
  labelEn: string;
}

const FILTER_TABS: FilterTab[] = [
  { key: 'all',       symbol: '⊹', labelCn: '全 部',     labelEn: 'All' },
  { key: 'major',     symbol: '✦', labelCn: '大 阿 卡 纳', labelEn: 'Major' },
  { key: 'wands',     symbol: '✦', labelCn: '权 杖',     labelEn: 'Wands' },
  { key: 'cups',      symbol: '◇', labelCn: '圣 杯',     labelEn: 'Cups' },
  { key: 'swords',    symbol: '✧', labelCn: '宝 剑',     labelEn: 'Swords' },
  { key: 'pentacles', symbol: '⊹', labelCn: '星 币',     labelEn: 'Pentacles' },
];

interface CardSection {
  key: FilterKey;
  titleCn: string;
  titleEn: string;
  subtitle: string;
  cards: TarotCard[];
}

export default function LibraryPage() {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [activeCard, setActiveCard] = useState<TarotCard | null>(null);

  const sections = useMemo<CardSection[]>(() => {
    const all: CardSection[] = [
      {
        key: 'major',
        titleCn: '大 阿 卡 纳',
        titleEn: 'Major Arcana',
        subtitle: '二十二道命运的轮转',
        cards: majorArcanaCards,
      },
      {
        key: 'wands',
        titleCn: '权 杖',
        titleEn: 'Wands · 火',
        subtitle: '行 动 ╱ 创 造 ╱ 激 情',
        cards: getCardsBySuit('wands'),
      },
      {
        key: 'cups',
        titleCn: '圣 杯',
        titleEn: 'Cups · 水',
        subtitle: '情 感 ╱ 关 系 ╱ 直 觉',
        cards: getCardsBySuit('cups'),
      },
      {
        key: 'swords',
        titleCn: '宝 剑',
        titleEn: 'Swords · 风',
        subtitle: '思 想 ╱ 冲 突 ╱ 真 相',
        cards: getCardsBySuit('swords'),
      },
      {
        key: 'pentacles',
        titleCn: '星 币',
        titleEn: 'Pentacles · 土',
        subtitle: '物 质 ╱ 工 作 ╱ 实 际',
        cards: getCardsBySuit('pentacles'),
      },
    ];

    return filter === 'all' ? all : all.filter((s) => s.key === filter);
  }, [filter]);

  const totalCount = sections.reduce((sum, s) => sum + s.cards.length, 0);

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* ─── 顶部 utility bar ─── */}
      <nav className="absolute top-0 left-0 right-0 flex justify-between items-center px-10 py-7 z-30">
        <Link
          href="/"
          className="text-bone-dim hover:text-bone transition-colors duration-500 flex items-center gap-4 group"
          style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
        >
          <span className="text-base group-hover:-translate-x-1 transition-transform duration-700"
                style={{ transitionTimingFunction: 'var(--ease-veil)' }}>
            ←
          </span>
          <span className="cn-nav">返 回</span>
        </Link>

        <div className="flex items-center gap-9">
          <Link
            href="/reading"
            className="cn-nav text-bone-dim hover:text-bone transition-colors duration-500"
            style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
          >
            占 卜
          </Link>
          <Link
            href="/history"
            className="cn-nav text-bone-dim hover:text-bone transition-colors duration-500"
            style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
          >
            轨 迹
          </Link>
        </div>
      </nav>

      <main className="flex-1 px-6 md:px-10 pt-32 pb-20 max-w-7xl w-full mx-auto">
        {/* ─── 标题 ─── */}
        <header className="text-center mb-16 anim-veil-rise">
          <span className="text-gold text-xl anim-drift">✦</span>
          <h1 className="font-display text-4xl md:text-5xl text-bone mt-6 mb-3 tracking-[0.22em]">
            七 十 八 卷
          </h1>
          <p className="font-display text-[11px] tracking-veil text-bone-faint uppercase mt-3">
            Seventy-Eight Volumes
          </p>
          <div className="rule-h-gold w-20 mx-auto mt-6" />
          <p className="font-body italic-soft text-bone-whisper text-sm mt-6 max-w-md mx-auto leading-relaxed">
            完 整 的 塔 罗 卷 宗 · 大 阿 卡 纳 与 四 重 花 色
          </p>
        </header>

        {/* ─── 筛选 tabs · 极细分隔 ─── */}
        <div className="mb-16 flex flex-wrap justify-center items-stretch border-y border-[var(--ink-line)]">
          {FILTER_TABS.map((tab, index) => {
            const isActive = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`
                  group relative flex items-center gap-3 px-6 py-5 transition-all duration-500
                  ${index > 0 ? 'border-l border-[var(--ink-line)]' : ''}
                  ${isActive
                    ? 'text-gold bg-[var(--ink-veil)]'
                    : 'text-bone-dim hover:text-bone hover:bg-[var(--ink-veil)]'}
                `}
                style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
              >
                {/* 选中态 · 顶部金线 */}
                <span
                  className={`absolute top-0 left-0 right-0 h-px transition-all duration-700 ${
                    isActive ? 'bg-[var(--gold)]' : 'bg-transparent'
                  }`}
                  style={{ transitionTimingFunction: 'var(--ease-veil)' }}
                />
                <span className={isActive ? 'text-gold' : 'text-gold-dim'}>
                  {tab.symbol}
                </span>
                <span className="cn-nav">{tab.labelCn}</span>
                <span className="font-display text-[10px] tracking-veil uppercase text-bone-whisper hidden md:inline">
                  {tab.labelEn}
                </span>
              </button>
            );
          })}
        </div>

        {/* ─── 统计 ─── */}
        <div className="text-center mb-12">
          <span className="cn-hint text-bone-faint">
            共 {totalCount} 卷
          </span>
        </div>

        {/* ─── Sections ─── */}
        <div className="space-y-24">
          {sections.map((section) => (
            <section key={section.key}>
              {/* 章节标题 */}
              <div className="text-center mb-12">
                <h2 className="font-display text-2xl md:text-3xl text-bone tracking-[0.22em] mb-3">
                  {section.titleCn}
                </h2>
                <p className="font-display text-[11px] tracking-veil text-gold-dim uppercase">
                  {section.titleEn}
                </p>
                <div className="rule-h-fade w-16 mx-auto mt-5" />
                <p className="cn-hint text-bone-whisper mt-5">
                  {section.subtitle}
                </p>
              </div>

              {/* 卡牌网格 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-12">
                {section.cards.map((card) => (
                  <CardThumb
                    key={card.id}
                    card={card}
                    onClick={() => setActiveCard(card)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <CardDetail card={activeCard} onClose={() => setActiveCard(null)} />
    </div>
  );
}

interface CardThumbProps {
  card: TarotCard;
  onClick: () => void;
}

function CardThumb({ card, onClick }: CardThumbProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center text-center transition-all duration-500"
      style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
    >
      <div className="relative w-full aspect-[3/5] bg-[var(--ink-void)] hairline overflow-hidden transition-all duration-700 group-hover:shadow-[0_0_24px_-12px_var(--gold-glow)]"
           style={{ transitionTimingFunction: 'var(--ease-veil)' }}>
        {!imageError ? (
          <>
            <Image
              src={card.image}
              alt={card.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
              style={{ transitionTimingFunction: 'var(--ease-veil)' }}
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink-void)]/60 via-transparent to-transparent pointer-events-none" />
            {/* 内框 · hover 时显金 */}
            <div className="absolute inset-1.5 hairline transition-all duration-700 group-hover:[box-shadow:inset_0_0_0_0.5px_var(--gold-dim)]"
                 style={{ transitionTimingFunction: 'var(--ease-veil)' }} />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
            <span className="text-gold-dim text-xl mb-2">✦</span>
            <div className="rule-h-gold w-6 mb-2" />
            <span className="font-display text-bone text-xs tracking-[0.18em]">
              {card.nameCn}
            </span>
          </div>
        )}
      </div>

      {/* 牌名 */}
      <div className="mt-4 px-1">
        <p className="font-display text-bone group-hover:text-gold text-sm tracking-[0.18em] transition-colors duration-500"
           style={{ transitionTimingFunction: 'var(--ease-ritual)' }}>
          {card.nameCn}
        </p>
        <p className="font-display text-[10px] text-bone-whisper tracking-veil uppercase mt-1.5">
          {card.name}
        </p>
      </div>
    </button>
  );
}
