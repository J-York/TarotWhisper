'use client';

import { useState, useEffect, type ReactElement } from 'react';
import Link from 'next/link';

import { Reading } from '@/lib/tarot/types';
import { getReadings, deleteReadings, clearAll } from '@/lib/readingStorage';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useConfirm } from '@/hooks/useConfirm';
import { HistoryListSkeleton } from '@/components/Skeletons';

interface DateStamp {
  date: string;
  time: string;
}

function formatStamp(date: Date): DateStamp {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return { date: `${year}.${month}.${day}`, time: `${hour}:${minute}` };
}

export default function HistoryPage(): ReactElement {
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
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDeleteSelected = async (): Promise<void> => {
    if (selectedIds.size === 0) return;
    const ok = await confirm({
      title: '删除选中记录',
      message: `将删除选中的 ${selectedIds.size} 条占卜记录，此操作不可撤销。`,
      confirmLabel: '删除',
      cancelLabel: '保留',
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
      title: '清空所有记录',
      message: '所有占卜记录都将被删除，此操作不可撤销。',
      confirmLabel: '清空',
      cancelLabel: '取消',
      tone: 'danger',
    });
    if (!ok) return;

    clearAll();
    setReadings([]);
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  if (!isLoaded) {
    return <HistoryListSkeleton />;
  }

  return (
    <main id="main-content" className="page-container page-main">
      {/* ─── 页头 ─── */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Reading Archive · 占卜轨迹</p>
          <h1 className="page-title mt-3">占卜轨迹</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-bone-faint">
            每一次占卜、解读与追问都保存在本地浏览器，最多 50 条。点击任意一条可重新阅读。
          </p>
        </div>
        <Link href="/reading" className="btn-ink-primary h-10 px-5 text-sm">
          开始新的占卜
        </Link>
      </header>

      {/* ─── 工具栏 ─── */}
      {readings.length > 0 && (
        <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-3 border-y border-[var(--ink-line)] py-3">
          <span className="text-xs text-bone-faint">
            共 <span className="font-heading text-sm text-bone">{readings.length}</span> 次占卜
          </span>
          {isSelectionMode && (
            <span className="text-xs text-celestial">点选记录以勾选 · 再点一次取消</span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {isSelectionMode ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsSelectionMode(false);
                    setSelectedIds(new Set());
                  }}
                  className="btn-ink-ghost text-sm"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  disabled={selectedIds.size === 0}
                  className="btn-ink h-9 px-4 text-sm"
                >
                  删除选中{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setIsSelectionMode(true)} className="btn-ink h-9 px-4 text-sm">
                  选择
                </button>
                <button type="button" onClick={handleClearAll} className="btn-ink-ghost text-sm">
                  清空全部
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── 列表 / 空态 ─── */}
      {readings.length === 0 ? (
        <section className="surface mt-8 flex flex-col items-center gap-4 px-6 py-16 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full border border-[var(--ink-line-strong)] text-xl text-gold-dim" aria-hidden>
            ✦
          </span>
          <div>
            <p className="font-heading text-lg text-bone">还没有任何占卜记录</p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-bone-faint">
              完成一次占卜后，问题、牌面与解读会自动出现在这里。
            </p>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Link href="/reading" className="btn-ink-primary h-10 px-5 text-sm">
              开始占卜
            </Link>
            <Link href="/agent" className="btn-ink h-10 px-4 text-sm">
              与神谕对话
            </Link>
          </div>
        </section>
      ) : (
        <ol className="mt-8 space-y-3">
          {readings.map((reading) => (
            <HistoryRow
              key={reading.id}
              reading={reading}
              isSelectionMode={isSelectionMode}
              isSelected={selectedIds.has(reading.id)}
              onToggle={toggleSelect}
            />
          ))}
        </ol>
      )}

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
    </main>
  );
}

interface HistoryRowProps {
  reading: Reading;
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

function HistoryRow({ reading, isSelectionMode, isSelected, onToggle }: HistoryRowProps): ReactElement {
  const stamp = formatStamp(reading.createdAt);
  const followUpCount = reading.followUps?.length ?? 0;

  const content = (
    <>
      {/* 勾选框 */}
      {isSelectionMode && (
        <span
          className={`grid h-5 w-5 shrink-0 place-items-center rounded border text-[11px] transition-colors ${
            isSelected
              ? 'border-[var(--gold)] bg-[var(--gold)] text-[var(--ink-void)]'
              : 'border-[var(--ink-line-strong)] text-transparent'
          }`}
          aria-hidden
        >
          ✓
        </span>
      )}

      {/* 日期 */}
      <div className="hidden w-24 shrink-0 flex-col md:flex">
        <span className="font-heading text-xs tracking-[0.06em] text-bone-dim">{stamp.date}</span>
        <span className="mt-0.5 text-[11px] text-bone-whisper">{stamp.time}</span>
      </div>

      {/* 正文 */}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 font-body text-base leading-snug text-bone transition-colors group-hover:text-gold-warm">
          {reading.question || '未记录问题'}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-bone-faint">
          <span className="md:hidden">{stamp.date} {stamp.time}</span>
          <span className="inline-flex items-center gap-1">
            <span className="text-gold-dim" aria-hidden>◇</span>
            {reading.spread.nameCn}
          </span>
          <span className="text-bone-whisper">·</span>
          <span>{reading.drawnCards.length} 张牌</span>
          {followUpCount > 0 && (
            <>
              <span className="text-bone-whisper">·</span>
              <span className="text-celestial">{followUpCount} 次追问</span>
            </>
          )}
        </div>
        {reading.interpretation && (
          <p className="mt-1.5 line-clamp-1 hidden text-xs leading-relaxed text-bone-whisper sm:block">
            {reading.interpretation.substring(0, 100).replace(/[#*_`>\-]/g, '')}…
          </p>
        )}
      </div>

      {/* 牌数刻度 */}
      <div className="hidden shrink-0 items-end gap-1 sm:flex" aria-hidden>
        {reading.drawnCards.slice(0, 8).map((_, i) => (
          <span
            key={i}
            className="w-0.5 rounded-full bg-[var(--bone-whisper)] transition-colors group-hover:bg-[var(--gold-dim)]"
            style={{ height: `${12 + ((i * 5) % 3) * 5}px` }}
          />
        ))}
        {reading.drawnCards.length > 8 && (
          <span className="ml-0.5 text-[10px] text-bone-faint">+{reading.drawnCards.length - 8}</span>
        )}
      </div>

      {!isSelectionMode && (
        <span className="shrink-0 text-bone-faint transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-gold-warm" aria-hidden>
          →
        </span>
      )}
    </>
  );

  const shellClass = `group flex items-center gap-4 rounded-xl border px-4 py-3.5 transition-all duration-200 ${
    isSelected
      ? 'border-[var(--celestial-dim)] bg-[rgba(139,159,212,0.08)]'
      : 'border-[var(--ink-line)] bg-[rgba(20,16,34,0.4)] hover:border-[var(--gold-faint)] hover:bg-[rgba(24,20,40,0.65)]'
  }`;

  if (isSelectionMode) {
    return (
      <li>
        <button
          type="button"
          onClick={() => onToggle(reading.id)}
          aria-pressed={isSelected}
          className={`${shellClass} w-full text-left`}
        >
          {content}
        </button>
      </li>
    );
  }

  return (
    <li>
      <Link href={`/history/${reading.id}`} className={shellClass}>
        {content}
      </Link>
    </li>
  );
}
