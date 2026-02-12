'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Reading } from '@/lib/tarot/types';
import { getReadings, deleteReadings, clearAll } from '@/lib/storage';

export default function HistoryPage() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadedReadings = getReadings();
    queueMicrotask(() => {
      setReadings(loadedReadings);
      setIsLoaded(true);
    });
  }, []);

  const toggleSelect = (id: string): void => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDeleteSelected = (): void => {
    if (selectedIds.size === 0) return;
    
    const confirmed = window.confirm(`确定要删除选中的 ${selectedIds.size} 条记录吗？`);
    if (!confirmed) return;

    deleteReadings(Array.from(selectedIds));
    setReadings(getReadings());
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  const handleClearAll = (): void => {
    const confirmed = window.confirm('确定要清空所有历史记录吗？此操作不可撤销！');
    if (!confirmed) return;

    clearAll();
    setReadings([]);
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hour}:${minute}`;
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-purple-200 animate-pulse">加载中...</div>
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
            href="/"
            className="text-purple-300/60 hover:text-amber-400 transition-colors flex items-center gap-2 group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回圣殿
          </Link>

          {readings.length > 0 && (
            <div className="flex gap-3">
              {isSelectionMode ? (
                <>
                  <button
                    onClick={() => {
                      setIsSelectionMode(false);
                      setSelectedIds(new Set());
                    }}
                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-purple-200 transition-all"
                  >
                    取消
                  </button>
                  {selectedIds.size > 0 && (
                    <button
                      onClick={handleDeleteSelected}
                      className="px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 transition-all"
                    >
                      删除选中 ({selectedIds.size})
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsSelectionMode(true)}
                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-purple-200 transition-all"
                  >
                    选择
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-red-600/20 border border-white/10 hover:border-red-500/30 text-purple-200 hover:text-red-300 transition-all"
                  >
                    清空全部
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-serif text-gold-gradient mb-2 tracking-wide">
            占卜历史
          </h1>
          <p className="text-purple-200/60 tracking-[0.2em]">History of Divination</p>
          <div className="h-px w-32 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto mt-6" />
        </div>

        {readings.length === 0 ? (
          <div className="glass-panel rounded-2xl p-16 text-center">
            <div className="text-6xl mb-6 opacity-30">🌌</div>
            <h3 className="text-2xl font-serif text-purple-200/70 mb-3">虚空空寂</h3>
            <p className="text-purple-300/50 mb-8">尚无占卜记录</p>
            <Link 
              href="/reading"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium transition-all shadow-lg"
            >
              <span>开始占卜</span>
              <span className="text-amber-300">✦</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {readings.map((reading) => {
              const isSelected = selectedIds.has(reading.id);

              return (
                <div
                  key={reading.id}
                  className={`
                    relative group glass-panel rounded-xl overflow-hidden transition-all duration-300
                    ${isSelectionMode 
                      ? 'cursor-pointer' 
                      : 'hover:bg-white/5 hover:-translate-y-1 hover:shadow-lg'
                    }
                    ${isSelected 
                      ? 'border-amber-500 bg-amber-900/10 shadow-[0_0_20px_rgba(245,158,11,0.2)]' 
                      : 'border-white/5 hover:border-purple-400/30'
                    }
                  `}
                  onClick={isSelectionMode ? () => toggleSelect(reading.id) : undefined}
                >
                  {isSelected && (
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none" />
                  )}

                  {/* Selection Checkbox */}
                  {isSelectionMode && (
                    <div className="absolute top-4 right-4 z-20">
                      <div className={`
                        w-6 h-6 rounded-full border flex items-center justify-center transition-all
                        ${isSelected 
                          ? 'border-amber-500 bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]' 
                          : 'border-white/20 bg-transparent'
                        }
                      `}>
                        {isSelected && (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  )}

                  <Link href={`/history/${reading.id}`} className={`block p-6 ${isSelectionMode ? 'pointer-events-none' : ''}`}>
                    {/* Date */}
                    <div className="text-sm text-purple-300/50 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDate(reading.createdAt)}
                    </div>

                    {/* Question */}
                    <h3 className={`font-serif text-lg mb-3 transition-colors line-clamp-2 ${isSelected ? 'text-amber-400' : 'text-purple-100 group-hover:text-amber-200'}`}>
                      {reading.question || '未记录问题'}
                    </h3>

                    {/* Spread Info */}
                    <div className="flex items-center gap-2 mb-4 text-sm text-purple-200/70">
                      <span className="text-amber-400/70">⊹</span>
                      <span>{reading.spread.nameCn}</span>
                      <span className="text-purple-400/40">·</span>
                      <span>{reading.drawnCards.length} 张牌</span>
                    </div>

                    {/* Cards Preview */}
                    <div className="flex gap-1 mb-4">
                      {reading.drawnCards.slice(0, 5).map((drawn, idx) => (
                        <div
                          key={idx}
                          className="w-2 h-8 rounded-sm bg-gradient-to-b from-amber-500/30 to-purple-500/30"
                        />
                      ))}
                      {reading.drawnCards.length > 5 && (
                        <div className="text-purple-400/50 text-xs self-end">+{reading.drawnCards.length - 5}</div>
                      )}
                    </div>

                    {/* Interpretation Preview */}
                    {reading.interpretation && (
                      <p className="text-sm text-purple-200/50 line-clamp-2 font-light">
                        {reading.interpretation.substring(0, 80)}...
                      </p>
                    )}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
