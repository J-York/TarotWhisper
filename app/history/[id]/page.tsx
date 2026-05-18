'use client';

import { useState, useEffect } from 'react';
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
        <span className="text-bone-faint text-xs tracking-mystic uppercase anim-whisper">载 入 中</span>
      </div>
    );
  }

  if (!reading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="ink-panel-quiet p-16 text-center max-w-md">
          <div className="text-bone-whisper text-3xl mb-8">◇</div>
          <h3 className="text-xl font-serif text-bone-dim mb-4 tracking-wider">记 录 不 存 在</h3>
          <p className="text-bone-faint text-sm font-light mb-10">该占卜已消失在虚空中</p>
          <Link
            href="/history"
            className="btn-ink-primary inline-block px-10 py-3"
          >
            返 回 轨 迹
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col px-8 py-10">
      {/* Header */}
      <header className="relative z-20 max-w-7xl w-full mx-auto mb-14">
        <div className="flex items-center justify-between">
          <Link
            href="/history"
            className="text-bone-faint hover:text-bone transition-colors flex items-center gap-3 group"
          >
            <span className="text-sm group-hover:-translate-x-1 transition-transform">←</span>
            <span className="text-xs tracking-mystic uppercase">返 回 轨 迹</span>
          </Link>

          <button
            onClick={handleDelete}
            className="btn-ink-ghost"
          >
            删 除 记 录
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto">
        {/* Title & Date */}
        <div className="text-center mb-16 anim-fade-in">
          <div className="text-[10px] text-bone-whisper mb-6 tracking-mystic uppercase">
            {formatDate(reading.createdAt)}
          </div>
          <span className="text-gold text-xl">✦</span>
          <h1 className="text-3xl md:text-4xl font-serif text-bone mt-5 mb-5 tracking-wider leading-snug max-w-3xl mx-auto">
            {reading.question || '未 记 录 问 题'}
          </h1>
          <div className="rule-h-fade w-24 mx-auto mb-5" />
          <div className="flex items-center justify-center gap-3 text-bone-faint text-xs tracking-quiet uppercase">
            <span className="text-gold-dim">◇</span>
            <span>{reading.spread.nameCn}</span>
            <span className="w-2 h-px bg-[var(--ink-line)]" />
            <span>{reading.drawnCards.length} 张</span>
          </div>
        </div>

        {/* Spread Info */}
        <div className="ink-panel-quiet p-10 mb-16">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-gold-dim">◇</span>
            <h2 className="text-xs font-serif text-bone tracking-mystic uppercase">牌 阵 信 息</h2>
          </div>
          <div className="rule-h-fade w-16 mb-5" />
          <div className="space-y-3 font-light">
            <p className="text-bone-dim text-sm">
              <span className="text-bone-faint mr-3 tracking-quiet uppercase text-xs">名称</span>
              {reading.spread.nameCn} <span className="text-bone-whisper">/ {reading.spread.name}</span>
            </p>
            <p className="text-bone-faint text-sm leading-relaxed">{reading.spread.description}</p>
          </div>
        </div>

        {/* Drawn Cards */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <span className="text-gold text-lg">✦</span>
            <h2 className="text-2xl font-serif text-bone mt-4 mb-3 tracking-mystic uppercase">
              抽 取 的 牌
            </h2>
            <div className="rule-h-fade w-24 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {reading.drawnCards.map((drawn, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="mb-6">
                  <TarotCardComponent
                    card={drawn.card}
                    isReversed={drawn.isReversed}
                    isRevealed={true}
                    size="md"
                  />
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-gold-dim tracking-mystic uppercase mb-3">
                    {drawn.position.nameCn}
                  </p>
                  <p className="text-xs text-bone-faint font-light mb-5 leading-relaxed max-w-xs">
                    {drawn.position.description}
                  </p>
                  <div className="rule-h-fade w-12 mx-auto mb-4" />
                  <p className="text-bone font-serif tracking-wider">
                    {drawn.card.nameCn}
                  </p>
                  <p className="text-xs text-bone-whisper tracking-quiet uppercase mt-1">
                    {drawn.card.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interpretation */}
        <div className="flex flex-col items-center">
          <Interpretation
            content={reading.interpretation || ''}
            isLoading={false}
            error={null}
          />
        </div>
      </main>
    </div>
  );
}
