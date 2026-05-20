'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Reading } from '@/lib/tarot/types';
import { getReadings, deleteReadings, clearAll } from '@/lib/readingStorage';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useConfirm } from '@/hooks/useConfirm';
import { HistoryListSkeleton } from '@/components/Skeletons';

export default function HistoryPage() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);
  const { dialog, confirm, handleConfirm, handleCancel } = useConfirm();

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

  const handleDeleteSelected = async (): Promise<void> => {
    if (selectedIds.size === 0) return;

    const ok = await confirm({
      title: '删 除 选 中',
      message: `将 删 除 选 中 的 ${selectedIds.size} 条 记 录 ， 此 举 不 可 撤 回 。`,
      confirmLabel: '删 除',
      cancelLabel: '保 留',
      tone: 'danger',
    });
    if (!ok) return;

    deleteReadings(Array.from(selectedIds));
    setReadings(getReadings());
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  const handleClearAll = async (): Promise<void> => {
    const ok = await confirm({
      title: '清 空 所 有',
      message: '所 有 占 卜 轨 迹 都 将 散 入 虚 空 ， 此 举 不 可 撤 回 。',
      confirmLabel: '清 空',
      cancelLabel: '取 消',
      tone: 'danger',
    });
    if (!ok) return;

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
    return <HistoryListSkeleton />;
  }

  return (
    <div className="relative min-h-screen flex flex-col px-10 py-12">
      {/* ─── Header ─── */}
      <header className="relative z-20 max-w-7xl w-full mx-auto mb-16">
        <div className="flex items-center justify-between">
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

          {readings.length > 0 && (
            <div className="flex gap-8 items-center">
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
                      className="btn-ink px-7 py-2.5"
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
                  <button onClick={handleClearAll} className="btn-ink-ghost">
                    清 空
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ─── Main ─── */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto">
        {/* 标题 */}
        <div className="text-center mb-20 anim-veil-rise">
          <span className="text-gold text-xl anim-drift">✦</span>
          <h1 className="font-display text-4xl md:text-5xl text-bone mt-6 mb-3 tracking-[0.22em]">
            占 卜 轨 迹
          </h1>
          <p className="font-display text-[11px] tracking-veil text-bone-faint uppercase mt-3">
            Trace of Divination
          </p>
          <div className="rule-h-gold w-20 mx-auto mt-6" />
          <p className="font-body italic-soft text-bone-whisper text-sm mt-6">
            那些已被星辰回应的低语
          </p>
        </div>

        {readings.length === 0 ? (
          <div className="ink-panel-quiet p-24 text-center max-w-xl mx-auto anim-veil-rise">
            <div className="text-bone-whisper text-3xl mb-10">◇</div>
            <h3 className="font-display text-xl text-bone-dim mb-5 tracking-[0.2em] uppercase">
              虚 空 空 寂
            </h3>
            <div className="rule-h-fade w-12 mx-auto mb-6" />
            <p className="font-body italic-soft text-bone-faint text-base mb-12">
              尚无占卜记录
            </p>
            <Link
              href="/reading"
              className="btn-ink-primary inline-flex items-center gap-3 px-12 py-3.5"
            >
              <span>开 始 占 卜</span>
              <span className="text-xs">✦</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 anim-stagger">
            {readings.map((reading, idx) => {
              const isSelected = selectedIds.has(reading.id);

              // 仅左/上添加分隔线，避免双线
              const colMod = idx % 3;
              const borderClasses = [
                idx >= 3 ? 'md:border-t md:border-[var(--ink-line)]' : '',
                colMod !== 0 ? 'md:border-l md:border-[var(--ink-line)]' : '',
                idx % 2 === 1 ? 'border-t border-[var(--ink-line)] md:border-t-0' : '',
              ].join(' ');

              return (
                <div
                  key={reading.id}
                  className={`
                    relative group transition-all duration-700
                    ${isSelectionMode ? 'cursor-pointer' : ''}
                    ${isSelected
                      ? 'bg-[var(--ink-veil)]'
                      : 'bg-transparent hover:bg-[var(--ink-veil)]'}
                    ${borderClasses}
                  `}
                  style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
                  onClick={isSelectionMode ? () => toggleSelect(reading.id) : undefined}
                >
                  {isSelected && (
                    <span className="absolute top-0 left-0 right-0 h-px bg-[var(--gold)]" />
                  )}

                  {isSelectionMode && (
                    <div className="absolute top-6 right-6 z-20">
                      <div
                        className={`
                          w-4 h-4 flex items-center justify-center transition-all duration-500
                          ${isSelected
                            ? 'bg-[var(--gold)]'
                            : 'hairline-strong'}
                        `}
                        style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
                      >
                        {isSelected && (
                          <span className="text-[var(--ink-deep)] text-xs leading-none">✓</span>
                        )}
                      </div>
                    </div>
                  )}

                  <Link
                    href={`/history/${reading.id}`}
                    className={`block p-9 ${isSelectionMode ? 'pointer-events-none' : ''}`}
                  >
                    {/* 日期 */}
                    <div className="font-display text-[11px] text-bone-faint mb-6 tracking-veil uppercase">
                      {formatDate(reading.createdAt)}
                    </div>

                    {/* 问题 · Cormorant 衬线 */}
                    <h3
                      className={`font-body text-xl mb-6 transition-colors duration-700 line-clamp-2 leading-relaxed ${
                        isSelected
                          ? 'text-gold'
                          : 'text-bone group-hover:text-gold-warm'
                      }`}
                      style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
                    >
                      {reading.question || '未 记 录 问 题'}
                    </h3>

                    {/* 牌阵信息 */}
                    <div className="flex items-center gap-3 mb-7 cn-label text-bone-dim">
                      <span className="text-gold-dim">◇</span>
                      <span>{reading.spread.nameCn}</span>
                      <span className="w-2 h-px bg-[var(--ink-line)]" />
                      <span>{reading.drawnCards.length} 张</span>
                    </div>

                    {/* 牌堆缩略 · 极简刻度 */}
                    <div className="flex gap-1.5 mb-6 items-end">
                      {reading.drawnCards.slice(0, 8).map((_, idx) => (
                        <div
                          key={idx}
                          className="w-1 bg-[var(--bone-whisper)] group-hover:bg-[var(--gold-dim)] transition-colors duration-700"
                          style={{
                            height: `${16 + (idx % 3) * 4}px`,
                            transitionTimingFunction: 'var(--ease-veil)',
                          }}
                        />
                      ))}
                      {reading.drawnCards.length > 8 && (
                        <div className="font-display text-bone-faint text-[11px] self-end ml-1">
                          +{reading.drawnCards.length - 8}
                        </div>
                      )}
                    </div>

                    {/* 解读预览 */}
                    {reading.interpretation && (
                      <p className="font-body italic-soft text-sm text-bone-faint line-clamp-2 leading-relaxed">
                        {reading.interpretation.substring(0, 100).replace(/[#*_`>\-]/g, '')}…
                      </p>
                    )}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <ConfirmDialog
        isOpen={dialog.isOpen}
        title={dialog.title}
        message={dialog.message}
        confirmLabel={dialog.confirmLabel}
        cancelLabel={dialog.cancelLabel}
        tone={dialog.tone}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}
