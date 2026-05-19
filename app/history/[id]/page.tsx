'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Reading } from '@/lib/tarot/types';
import { getReadingById, deleteReadings } from '@/lib/storage';
import { Interpretation } from '@/components/Interpretation';
import { TarotCardComponent } from '@/components/TarotCard';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ReadingDetailPage({ params }: PageProps) {
  const [reading, setReading] = useState<Reading | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    params.then((resolvedParams) => {
      const loadedReading = getReadingById(resolvedParams.id);
      setReading(loadedReading || null);
      setIsLoaded(true);
    });
  }, [params]);

  const handleDelete = (): void => {
    if (!reading) return;

    const confirmed = window.confirm('确定要删除这条占卜记录吗？');
    if (!confirmed) return;

    deleteReadings([reading.id]);
    router.push('/history');
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hour}:${minute}`;
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="cn-label text-bone-faint anim-whisper">
          载 入 中
        </span>
      </div>
    );
  }

  if (!reading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="ink-panel-quiet p-20 text-center max-w-md anim-veil-rise">
          <div className="text-bone-whisper text-3xl mb-10">◇</div>
          <h3 className="font-display text-xl text-bone-dim mb-5 tracking-[0.2em] uppercase">
            记 录 不 存 在
          </h3>
          <div className="rule-h-fade w-12 mx-auto mb-6" />
          <p className="font-body italic-soft text-bone-faint text-base mb-12">
            该占卜已消失在虚空中
          </p>
          <Link href="/history" className="btn-ink-primary inline-block px-12 py-3.5">
            返 回 轨 迹
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col px-10 py-12">
      {/* ─── Header ─── */}
      <header className="relative z-20 max-w-7xl w-full mx-auto mb-16">
        <div className="flex items-center justify-between">
          <Link
            href="/history"
            className="text-bone-dim hover:text-bone transition-colors duration-500 flex items-center gap-4 group"
            style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
          >
            <span className="text-base group-hover:-translate-x-1 transition-transform duration-700"
                  style={{ transitionTimingFunction: 'var(--ease-veil)' }}>
              ←
            </span>
            <span className="cn-nav">
              返 回 轨 迹
            </span>
          </Link>

          <button onClick={handleDelete} className="btn-ink-ghost">
            删 除 记 录
          </button>
        </div>
      </header>

      {/* ─── Main ─── */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto">
        {/* 标题 + 日期 + 问题 */}
        <div className="text-center mb-20 anim-veil-rise">
          <div className="font-display text-[11px] text-bone-faint mb-7 tracking-veil uppercase">
            {formatDate(reading.createdAt)}
          </div>
          <span className="text-gold text-xl anim-drift">✦</span>
          <h1 className="font-body text-3xl md:text-4xl text-bone mt-7 mb-6 leading-snug max-w-3xl mx-auto italic-soft">
            {reading.question || '未 记 录 问 题'}
          </h1>
          <div className="rule-h-gold w-20 mx-auto mb-6" />
          <div className="flex items-center justify-center gap-3 cn-label text-bone-dim">
            <span className="text-gold-dim">◇</span>
            <span>{reading.spread.nameCn}</span>
            <span className="w-2 h-px bg-[var(--ink-line)]" />
            <span>{reading.drawnCards.length} 张</span>
          </div>
        </div>

        {/* 牌阵信息 */}
        <div className="ink-panel-quiet p-12 mb-20 anim-veil-rise">
          <div className="flex items-center gap-4 mb-5">
            <span className="text-gold-dim">◇</span>
            <h2 className="cn-nav text-bone">
              牌 阵 信 息
            </h2>
          </div>
          <div className="rule-h-gold w-12 mb-6" />
          <div className="space-y-4">
            <p className="font-body text-bone-dim text-base">
              <span className="cn-hint text-bone-faint mr-4 inline-block">
                名 称
              </span>
              {reading.spread.nameCn}
              <span className="text-bone-whisper ml-2">/ {reading.spread.name}</span>
            </p>
            <p className="font-body italic-soft text-bone-faint text-base leading-relaxed">
              {reading.spread.description}
            </p>
          </div>
        </div>

        {/* 抽取的牌 */}
        <div className="mb-20">
          <div className="text-center mb-14">
            <span className="text-gold text-lg anim-drift">✦</span>
            <h2 className="font-display text-2xl text-bone mt-5 mb-3 tracking-[0.32em] uppercase">
              抽 取 的 牌
            </h2>
            <div className="rule-h-gold w-20 mx-auto mt-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-14 anim-stagger">
            {reading.drawnCards.map((drawn, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="mb-7">
                  <TarotCardComponent
                    card={drawn.card}
                    isReversed={drawn.isReversed}
                    isRevealed={true}
                    size="md"
                  />
                </div>
                <div className="text-center">
                  <p className="cn-label text-gold-dim mb-3">
                    {drawn.position.nameCn}
                  </p>
                  <p className="font-body italic-soft text-sm text-bone-faint mb-6 leading-relaxed max-w-xs">
                    {drawn.position.description}
                  </p>
                  <div className="rule-h-fade w-10 mx-auto mb-5" />
                  <p className="font-display text-bone tracking-[0.18em] text-lg">
                    {drawn.card.nameCn}
                  </p>
                  <p className="font-display text-[11px] text-bone-faint tracking-veil uppercase mt-2">
                    {drawn.card.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 解读 */}
        <div className="flex flex-col items-center pb-12">
          <ReadingInterpretation reading={reading} />
        </div>
      </main>
    </div>
  );
}

function ReadingInterpretation({ reading }: { reading: Reading }) {
  const cardTerms = useMemo<string[]>(
    () => reading.drawnCards.flatMap((d) => [d.card.nameCn, d.card.name]),
    [reading]
  );
  const positionTerms = useMemo<string[]>(
    () => reading.spread.positions.map((p) => p.nameCn),
    [reading]
  );
  return (
    <Interpretation
      content={reading.interpretation || ''}
      isLoading={false}
      error={null}
      staggerOnMount
      cardTerms={cardTerms}
      positionTerms={positionTerms}
    />
  );
}
