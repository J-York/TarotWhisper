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
    return `${year}.${month}.${day} ${hour}:${minute}`;
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-bone-faint text-xs tracking-mystic uppercase anim-whisper">载 入 中</span>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col px-8 py-10">
      {/* Header */}
      <header className="relative z-20 max-w-7xl w-full mx-auto mb-14">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-bone-faint hover:text-bone transition-colors flex items-center gap-3 group"
          >
            <span className="text-sm group-hover:-translate-x-1 transition-transform">←</span>
            <span className="text-xs tracking-mystic uppercase">返 回</span>
          </Link>

          {readings.length > 0 && (
            <div className="flex gap-6 items-center">
              {isSelectionMode ? (
                <>
                  <button
                    onClick={() => {
                      setIsSelectionMode(false);
                      setSelectedIds(new Set());
                    }}
                    className="btn-ink-ghost"
                  >
                    取 消
                  </button>
                  {selectedIds.size > 0 && (
                    <button
                      onClick={handleDeleteSelected}
                      className="btn-ink px-6 py-2"
                    >
                      删 除 ({selectedIds.size})
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsSelectionMode(true)}
                    className="btn-ink-ghost"
                  >
                    选 择
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="btn-ink-ghost"
                  >
                    清 空
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto">
        <div className="text-center mb-16">
          <span className="text-gold text-xl">✦</span>
          <h1 className="text-4xl md:text-5xl font-serif text-bone mt-5 mb-3 tracking-wider">
            占 卜 轨 迹
          </h1>
          <p className="text-bone-faint text-xs tracking-mystic uppercase">Trace of Divination</p>
          <div className="rule-h-fade w-24 mx-auto mt-5" />
        </div>

        {readings.length === 0 ? (
          <div className="ink-panel-quiet p-20 text-center max-w-xl mx-auto">
            <div className="text-bone-whisper text-3xl mb-8">◇</div>
            <h3 className="text-xl font-serif text-bone-dim mb-4 tracking-wider">虚 空 空 寂</h3>
            <p className="text-bone-faint text-sm font-light mb-10">尚无占卜记录</p>
            <Link
              href="/reading"
              className="btn-ink-primary inline-flex items-center gap-3 px-10 py-3"
            >
              <span>开 始 占 卜</span>
              <span className="text-xs">✦</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--ink-line)] border border-[var(--ink-line)]">
            {readings.map((reading) => {
              const isSelected = selectedIds.has(reading.id);

              return (
                <div
                  key={reading.id}
                  className={`
                    relative group transition-colors duration-300
                    ${isSelectionMode ? 'cursor-pointer' : ''}
                    ${isSelected ? 'bg-[var(--ink-veil)]' : 'bg-[var(--ink-deep)] hover:bg-[var(--ink-veil)]'}
                  `}
                  onClick={isSelectionMode ? () => toggleSelect(reading.id) : undefined}
                >
                  {isSelected && (
                    <span className="absolute top-0 left-0 right-0 h-px bg-[var(--gold-dim)]" />
                  )}

                  {isSelectionMode && (
                    <div className="absolute top-5 right-5 z-20">
                      <div className={`
                        w-4 h-4 border flex items-center justify-center transition-all
                        ${isSelected
                          ? 'border-[var(--gold)] bg-[var(--gold)]'
                          : 'border-[var(--bone-whisper)]'
                        }
                      `}>
                        {isSelected && (
                          <span className="text-[var(--ink-deep)] text-xs leading-none">✓</span>
                        )}
                      </div>
                    </div>
                  )}

                  <Link href={`/history/${reading.id}`} className={`block p-7 ${isSelectionMode ? 'pointer-events-none' : ''}`}>
                    {/* Date */}
                    <div className="text-[10px] text-bone-whisper mb-5 tracking-quiet uppercase">
                      {formatDate(reading.createdAt)}
                    </div>

                    {/* Question */}
                    <h3 className={`font-serif text-lg mb-5 transition-colors line-clamp-2 tracking-wide ${isSelected ? 'text-gold' : 'text-bone group-hover:text-gold-dim'}`}>
                      {reading.question || '未 记 录 问 题'}
                    </h3>

                    {/* Spread */}
                    <div className="flex items-center gap-3 mb-6 text-xs text-bone-faint tracking-quiet">
                      <span className="text-gold-dim">◇</span>
                      <span>{reading.spread.nameCn}</span>
                      <span className="w-2 h-px bg-[var(--ink-line)]" />
                      <span>{reading.drawnCards.length} 张</span>
                    </div>

                    {/* Cards preview */}
                    <div className="flex gap-1.5 mb-5">
                      {reading.drawnCards.slice(0, 8).map((_, idx) => (
                        <div
                          key={idx}
                          className="w-1 h-6 bg-[var(--bone-whisper)]"
                        />
                      ))}
                      {reading.drawnCards.length > 8 && (
                        <div className="text-bone-whisper text-[10px] self-end ml-1">+{reading.drawnCards.length - 8}</div>
                      )}
                    </div>

                    {/* Interpretation preview */}
                    {reading.interpretation && (
                      <p className="text-xs text-bone-faint line-clamp-2 font-light leading-relaxed">
                        {reading.interpretation.substring(0, 100).replace(/[#*_`>\-]/g, '')}...
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
