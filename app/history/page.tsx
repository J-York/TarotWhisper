'use client';

import { useEffect, useMemo, useState, type ReactElement } from 'react';
import Link from 'next/link';

import { CardPlate } from '@/components/CardPlate';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { HistoryListSkeleton } from '@/components/Skeletons';
import { useConfirm } from '@/hooks/useConfirm';
import { formatClock, formatYearMonth, weekdayShort } from '@/lib/dates';
import { clearAll, deleteReadings, getReadings } from '@/lib/readingStorage';
import type { Reading } from '@/lib/tarot/types';

/** 摘要只取正文：跳过模型的思考段和小标题，再去掉 Markdown 记号 */
function excerptOf(text: string | undefined): string {
  if (!text) return '';
  return text
    .replace(/<(think|thinking)>[\s\S]*?(<\/\1>|$)/gi, '')
    .replace(/^\s*#.*$/gm, '')
    .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, '')
    .replace(/[#*_`>~|]+/g, '')
    .replace(/\s+/g, ' ')
    .replace(/([。！？；：，、）」』”])\s+/g, '$1')
    .trim()
    .slice(0, 160);
}

export default function HistoryPage(): ReactElement {
  const [readings, setReadings] = useState<Reading[] | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());
  const { dialog, confirm, handleConfirm, handleCancel } = useConfirm();

  useEffect(() => {
    queueMicrotask(() => setReadings(getReadings()));
  }, []);

  const groups = useMemo(() => {
    const byMonth = new Map<string, Reading[]>();
    for (const reading of readings ?? []) {
      const month = formatYearMonth(reading.createdAt);
      byMonth.set(month, [...(byMonth.get(month) ?? []), reading]);
    }
    return [...byMonth];
  }, [readings]);

  const exitSelection = (): void => {
    setIsSelecting(false);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = async (): Promise<void> => {
    if (selectedIds.size === 0) return;
    const ok = await confirm({
      title: `删除 ${selectedIds.size} 篇手札`,
      message: '删除后无法恢复。',
      confirmLabel: '删除',
      cancelLabel: '保留',
      tone: 'danger',
    });
    if (!ok) return;
    deleteReadings([...selectedIds]);
    setReadings(getReadings());
    exitSelection();
  };

  const handleClearAll = async (): Promise<void> => {
    const ok = await confirm({
      title: '清空全部手札',
      message: '所有占卜记录都会被删除，无法恢复。',
      confirmLabel: '全部清空',
      cancelLabel: '取消',
      tone: 'danger',
    });
    if (!ok) return;
    clearAll();
    setReadings([]);
    exitSelection();
  };

  if (readings === null) return <HistoryListSkeleton />;

  return (
    <main id="main-content" className="page-container page-main">
      <div className="mx-auto max-w-3xl">
        <header>
          <p className="kicker">手札</p>
          <h1 className="page-title mt-3">占卜手札</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-ink-soft">
            每次解读和追问都会自动记在这里。只保存在这台设备的浏览器中，最多 50 篇。
          </p>
        </header>

        {readings.length === 0 ? (
          <section className="panel mt-10 px-6 py-14 text-center">
            <p className="text-lg font-semibold text-ink">还没有记录</p>
            <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-ink-soft">
              写下一个问题，等神谕回信。问题、牌面和解读会自动出现在这里。
            </p>
            <Link href="/" className="btn btn-primary mt-6 h-10 px-5">
              去问第一个问题
            </Link>
          </section>
        ) : (
          <>
            <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-line py-2">
              <span className="text-[13px] text-ink-muted" aria-live="polite">
                {isSelecting ? `已选 ${selectedIds.size} 篇` : `共 ${readings.length} 篇`}
              </span>
              <div className="ml-auto flex items-center gap-1">
                {isSelecting ? (
                  <>
                    <button type="button" onClick={exitSelection} className="btn btn-ghost h-9 text-sm">
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteSelected()}
                      disabled={selectedIds.size === 0}
                      className="btn btn-secondary h-9 px-4 text-sm text-accent-strong"
                    >
                      删除所选
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => setIsSelecting(true)} className="btn btn-ghost h-9 text-sm">
                      选择
                    </button>
                    <button type="button" onClick={() => void handleClearAll()} className="btn btn-ghost h-9 text-sm">
                      清空全部
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4">
              {groups.map(([month, items]) => (
                <section key={month} aria-labelledby={`month-${month}`} className="mt-6 first:mt-0">
                  <h2
                    id={`month-${month}`}
                    className="sticky top-[4.25rem] z-10 bg-canvas/95 py-2 text-sm font-semibold tracking-[0.12em] text-ink-soft backdrop-blur-sm"
                  >
                    {month}
                  </h2>
                  <ol className="divide-y divide-line border-b border-line">
                    {items.map((reading) => (
                      <EntryRow
                        key={reading.id}
                        reading={reading}
                        isSelecting={isSelecting}
                        isSelected={selectedIds.has(reading.id)}
                        onToggle={toggleSelect}
                      />
                    ))}
                  </ol>
                </section>
              ))}
            </div>
          </>
        )}
      </div>

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

interface EntryRowProps {
  reading: Reading;
  isSelecting: boolean;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

function EntryRow({ reading, isSelecting, isSelected, onToggle }: EntryRowProps): ReactElement {
  const { createdAt, drawnCards } = reading;
  const followUps = reading.followUps?.length ?? 0;
  const excerpt = excerptOf(reading.interpretation);
  const fan = drawnCards.slice(0, 3);
  const tilt = fan.length === 1 ? ['rotate-0'] : fan.length === 2 ? ['-rotate-3', 'rotate-3'] : ['-rotate-6', 'rotate-0', 'rotate-6'];

  const body = (
    <>
      {isSelecting && (
        <span
          aria-hidden
          className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-[3px] border transition-colors ${
            isSelected ? 'border-accent bg-accent text-surface' : 'border-line-strong bg-surface text-transparent'
          }`}
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m3.5 8.5 3 3 6-7" />
          </svg>
        </span>
      )}

      <span className="w-10 shrink-0 text-center">
        <span className="block font-latin text-[1.75rem] leading-none text-ink tabular-nums">{createdAt.getDate()}</span>
        <span className="mt-1.5 block text-xs text-ink-muted">{weekdayShort(createdAt)}</span>
      </span>

      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 font-hand text-lg leading-snug text-voice transition-colors group-hover:text-accent">
          {reading.question || '（没有写下问题）'}
        </span>
        <span className="mt-1.5 block text-[13px] text-ink-muted">
          {reading.spread.nameCn} · {drawnCards.length} 张 · {formatClock(createdAt)}
          {followUps > 0 && ` · 追问 ${followUps} 次`}
        </span>
        {excerpt && (
          <span className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">{excerpt}</span>
        )}
      </span>

      {fan.length > 0 && (
        <span className="hidden shrink-0 items-center pr-1 pt-1 sm:flex" aria-hidden>
          {fan.map((drawn, i) => (
            <CardPlate
              key={drawn.position.id}
              card={drawn.card}
              isReversed={drawn.isReversed}
              sizes="40px"
              decorative
              className={`w-10 ${i > 0 ? '-ml-5' : ''} ${tilt[i]}`}
            />
          ))}
        </span>
      )}
    </>
  );

  const rowClass = `group -mx-3 flex w-[calc(100%+1.5rem)] items-start gap-4 rounded-md px-3 py-5 text-left transition-colors sm:gap-5 ${
    isSelected ? 'bg-accent-soft/60' : 'hover:bg-surface/80'
  }`;

  return (
    <li>
      {isSelecting ? (
        <button type="button" onClick={() => onToggle(reading.id)} aria-pressed={isSelected} className={rowClass}>
          {body}
        </button>
      ) : (
        <Link href={`/history/${reading.id}`} className={rowClass}>
          {body}
        </Link>
      )}
    </li>
  );
}
