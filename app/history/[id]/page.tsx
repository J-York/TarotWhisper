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
    return `${year}年${month}月${day}日 ${hour}:${minute}`;
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-purple-200 animate-pulse">加载中...</div>
      </div>
    );
  }

  if (!reading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="glass-panel rounded-2xl p-12 text-center max-w-md">
          <div className="text-6xl mb-6 opacity-30">🌑</div>
          <h3 className="text-2xl font-serif text-purple-200/70 mb-3">记录不存在</h3>
          <p className="text-purple-300/50 mb-8">该占卜记录已消失在虚空中</p>
          <Link 
            href="/history"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium transition-all shadow-lg"
          >
            返回历史
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col p-8">
      {/* 装饰光效 */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[128px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-20 max-w-7xl w-full mx-auto mb-8">
        <div className="flex items-center justify-between">
          <Link 
            href="/history"
            className="text-purple-300/60 hover:text-amber-400 transition-colors flex items-center gap-2 group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回历史
          </Link>

          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            删除记录
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto">
        {/* Title & Date */}
        <div className="text-center mb-12">
          <div className="text-sm text-purple-300/50 mb-3 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatDate(reading.createdAt)}
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-gold-gradient mb-3 tracking-wide">
            {reading.question || '未记录问题'}
          </h1>
          <div className="flex items-center justify-center gap-3 text-purple-200/70">
            <span className="text-amber-400/70">⊹</span>
            <span className="font-serif">{reading.spread.nameCn}</span>
            <span className="text-purple-400/40">·</span>
            <span>{reading.drawnCards.length} 张牌</span>
          </div>
          <div className="h-px w-32 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto mt-6" />
        </div>

        {/* Spread Info */}
        <div className="glass-panel rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-serif text-amber-200 mb-4 flex items-center gap-3">
            <span className="text-amber-400">✧</span>
            牌阵信息
          </h2>
          <div className="space-y-2 text-purple-100">
            <p><span className="text-purple-300/70">牌阵名称：</span>{reading.spread.nameCn} ({reading.spread.name})</p>
            <p className="text-purple-200/70">{reading.spread.description}</p>
          </div>
        </div>

        {/* Drawn Cards */}
        <div className="mb-12">
          <h2 className="text-3xl font-serif text-amber-200 mb-8 text-center flex items-center justify-center gap-3">
            <span className="text-amber-400">✧</span>
            抽取的牌
            <span className="text-amber-400">✧</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reading.drawnCards.map((drawn, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="mb-4">
                  <TarotCardComponent
                    card={drawn.card}
                    isReversed={drawn.isReversed}
                    isRevealed={true}
                    size="md"
                  />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-serif text-amber-200 mb-2">
                    {drawn.position.nameCn}
                  </h3>
                  <p className="text-sm text-purple-200/70 mb-3">
                    {drawn.position.description}
                  </p>
                  <p className="text-purple-100 font-medium">
                    {drawn.card.nameCn}
                  </p>
                  <p className="text-sm text-purple-300/60">
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
