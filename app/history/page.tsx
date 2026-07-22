'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import { Reading } from '@/lib/tarot/types';
import { getReadings, deleteReadings, clearAll } from '@/lib/readingStorage';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useConfirm } from '@/hooks/useConfirm';
import { HistoryListSkeleton } from '@/components/Skeletons';

/* ─── 星等 · 牌阵越重，面板越大 ─── */
type EntryTier = 'grand' | 'major' | 'minor';

interface TierStyle {
  panel: string;
  question: string;
  width: string;
}

const TIER_STYLES: Record<EntryTier, TierStyle> = {
  grand: {
    panel: 'p-8 md:p-12',
    question: 'text-2xl md:text-[1.9rem]',
    width: 'md:w-[calc(50%-2rem)]',
  },
  major: {
    panel: 'p-7 md:p-10',
    question: 'text-xl md:text-2xl',
    width: 'md:w-[calc(50%-3.25rem)]',
  },
  minor: {
    panel: 'p-6 md:p-8',
    question: 'text-lg md:text-xl',
    width: 'md:w-[calc(50%-4.75rem)]',
  },
};

function tierOf(reading: Reading): EntryTier {
  const count = reading.drawnCards.length;
  if (count >= 7) return 'grand';
  if (count >= 3) return 'major';
  return 'minor';
}

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

  if (!isLoaded) {
    return <HistoryListSkeleton />;
  }

  return (
    <div className="relative min-h-screen flex flex-col px-6 md:px-10 py-10 md:py-12">
      {/* ─── Nav · 返回 / 占卜 ─── */}
      <header className="relative z-20 max-w-7xl w-full mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="text-bone-dim hover:text-bone transition-colors duration-500 flex items-center gap-4 group"
          style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
        >
          <span
            className="text-base group-hover:-translate-x-1 transition-transform duration-700"
            style={{ transitionTimingFunction: 'var(--ease-veil)' }}
          >
            ←
          </span>
          <span className="cn-nav">返 回</span>
        </Link>

        <Link href="/reading" className="btn-ink px-7 py-2.5 inline-flex items-center gap-3">
          <span className="text-gold text-xs anim-twinkle">✦</span>
          <span>占 卜</span>
        </Link>
      </header>

      {/* ─── Title · 左对齐巨型标题 ─── */}
      <section className="relative z-10 max-w-7xl w-full mx-auto mt-16 md:mt-24 mb-16 md:mb-24 anim-veil-rise">
        <span className="scatter-symbol text-2xl -top-8 right-[18%] anim-drift hidden md:block">✧</span>
        <span
          className="scatter-symbol text-lg top-16 right-[6%] anim-twinkle hidden md:block"
          style={{ animationDelay: '1.4s' }}
        >
          ☽
        </span>

        <p className="text-tiny font-heading text-gold-dim mb-7">
          Trace of Divination · 星 轨 之 痕
        </p>
        <h1 className="text-massive font-heading text-bone">占卜轨迹</h1>

        <div className="mt-8 max-w-xl">
          <div className="rule-h-gold w-24 mb-6" />
          <p className="font-body italic-soft text-bone-faint text-base md:text-lg leading-relaxed">
            那些已被星辰回应的低语，沿这条金线依次点亮。
          </p>
        </div>

        {/* 拣选控制 · 仅在有轨迹时浮现 */}
        {readings.length > 0 && (
          <div className="mt-14 pt-6 hairline-top flex flex-wrap items-center gap-x-8 gap-y-4">
            <span className="cn-hint text-bone-faint">共 {readings.length} 次低语</span>
            {isSelectionMode && (
              <span className="cn-hint text-celestial-dim">✧ 点触星轨以拣选 · 再触一次取消</span>
            )}
            <div className="ml-auto flex gap-8 items-center">
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
                    <button onClick={handleDeleteSelected} className="btn-ink px-7 py-2.5">
                      删 除 ({selectedIds.size})
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button onClick={() => setIsSelectionMode(true)} className="btn-ink-ghost">
                    选 择
                  </button>
                  <button onClick={handleClearAll} className="btn-ink-ghost">
                    清 空
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ─── Constellation timeline / 虚空 ─── */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto">
        {readings.length === 0 ? (
          /* 虚空 · 一枚褪色残月 + 斜体低语，左倾构图 */
          <div className="relative pt-10 pb-28 anim-veil-rise">
            <span className="absolute -top-6 left-0 md:left-10 text-[10rem] md:text-[15rem] leading-none font-body text-bone-whisper opacity-40 select-none pointer-events-none anim-drift">
              ☾
            </span>
            <div className="relative pt-28 md:pt-36 pl-2 md:pl-24 max-w-lg">
              <p className="text-tiny font-heading text-bone-faint mb-7">
                The Void · 虚 空 之 页
              </p>
              <p className="font-body italic-soft text-xl md:text-2xl text-bone-dim leading-relaxed mb-12">
                星辰尚未在此留下轨迹——
                <br />
                你的第一次低语，将成为这条金线的起点。
              </p>
              <Link
                href="/reading"
                className="btn-ink-primary inline-flex items-center gap-3 px-12 py-3.5"
              >
                <span>开 始 占 卜</span>
                <span className="text-xs">✦</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="relative pb-8">
            <div className="timeline-line" />

            {/* 散布星尘 */}
            <span className="scatter-symbol right-[5%] top-28 text-lg anim-twinkle hidden lg:block">✧</span>
            <span className="scatter-symbol left-[3%] top-[42%] text-xl anim-drift hidden lg:block">☽</span>
            <span
              className="scatter-symbol right-[9%] top-[68%] text-sm anim-twinkle hidden lg:block"
              style={{ animationDelay: '2s' }}
            >
              ✦
            </span>

            {/* 起点星 */}
            <div className="relative h-12">
              <span className="absolute left-6 md:left-1/2 -translate-x-1/2 top-3 text-gold-dim text-sm anim-whisper">
                ✦
              </span>
            </div>

            <div className="anim-stagger">
              {readings.map((reading, idx) => (
                <TimelineEntry
                  key={reading.id}
                  reading={reading}
                  isLeft={idx % 2 === 0}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedIds.has(reading.id)}
                  onToggle={toggleSelect}
                />
              ))}
            </div>

            {/* 终点符 */}
            <div className="relative h-24">
              <span className="absolute left-6 md:left-1/2 -translate-x-1/2 top-6 w-2 h-2 rotate-45 border border-[var(--gold-dim)] bg-transparent" />
              <span className="absolute left-6 md:left-1/2 -translate-x-1/2 top-14 cn-hint text-bone-whisper tracking-veil whitespace-nowrap">
                轨 迹 至 此
              </span>
            </div>
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

/* ═══════════════════════════════════════════════════════════════
   TimelineEntry · 金线上的一颗星
   ═══════════════════════════════════════════════════════════════ */

interface TimelineEntryProps {
  reading: Reading;
  /** 桌面端是否居于金线左侧（移动端统一挂在线右） */
  isLeft: boolean;
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

function TimelineEntry({
  reading,
  isLeft,
  isSelectionMode,
  isSelected,
  onToggle,
}: TimelineEntryProps) {
  const tier = TIER_STYLES[tierOf(reading)];
  const stamp = formatStamp(reading.createdAt);
  const followUpCount = reading.followUps?.length ?? 0;

  /* 选中 = 月蓝星辉描边；拣选模式下面板整体蒙尘 */
  const stateClasses = isSelected
    ? 'after:shadow-[inset_0_0_0_1px_var(--celestial-dim),0_0_42px_-6px_var(--celestial-glow)]'
    : isSelectionMode
      ? 'opacity-50 hover:opacity-90'
      : 'hover:-translate-y-1 hover:after:shadow-[inset_0_0_0_1px_var(--gold-faint),0_0_46px_-14px_var(--gold-glow)]';

  return (
    <article
      className={`relative pl-16 md:pl-0 pb-12 md:pb-16 last:pb-8 group ${
        isSelectionMode ? 'cursor-pointer' : ''
      }`}
      onClick={isSelectionMode ? () => onToggle(reading.id) : undefined}
      onKeyDown={
        isSelectionMode
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggle(reading.id);
              }
            }
          : undefined
      }
      role={isSelectionMode ? 'button' : undefined}
      tabIndex={isSelectionMode ? 0 : undefined}
      aria-pressed={isSelectionMode ? isSelected : undefined}
    >
      {/* 金线上的星点 */}
      <span
        className={`absolute left-6 md:left-1/2 top-2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 transition-all duration-700 ${
          isSelected
            ? 'bg-[var(--celestial)] border border-[var(--celestial)] shadow-[0_0_18px_0_var(--celestial-glow)]'
            : 'bg-[var(--ink-deep)] border border-[var(--gold-dim)] group-hover:border-[var(--gold)] group-hover:shadow-[0_0_14px_0_var(--gold-glow)]'
        }`}
        style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
      />

      {/* 星点 → 面板 的连线刻度 */}
      <span
        className={`hidden md:block absolute top-[1.35rem] h-px w-9 transition-colors duration-700 ${
          isLeft ? 'right-[calc(50%+9px)]' : 'left-[calc(50%+9px)]'
        } ${isSelected ? 'bg-[var(--celestial-dim)]' : 'bg-[var(--gold-faint)]'}`}
      />

      {/* 日期 · 栖于节点之上的微光标签 */}
      <div
        className={`mb-5 md:absolute md:top-0 md:mb-0 font-heading text-tiny transition-colors duration-700 ${
          isLeft
            ? 'md:left-[calc(50%+2.5rem)]'
            : 'md:right-[calc(50%+2.5rem)] md:text-right'
        } ${isSelected ? 'text-celestial' : 'text-bone-faint'}`}
      >
        <span className="tracking-veil">{stamp.date}</span>
        <span className="ml-3 md:ml-0 md:block md:mt-1.5 tracking-quiet text-bone-whisper">
          {stamp.time}
        </span>
      </div>

      {/* 悬浮面板 · 问题为主角 */}
      <div
        className={`relative transition-all duration-700 after:absolute after:inset-0 after:pointer-events-none after:transition-all after:duration-700 ${
          tier.width
        } ${isLeft ? 'md:mr-auto' : 'md:ml-auto'} ${stateClasses}`}
        style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
      >
        <div className={`ink-panel-quiet relative ${tier.panel}`}>
          {!isSelectionMode && (
            <Link href={`/history/${reading.id}`} className="absolute inset-0 z-[1]">
              <span className="sr-only">翻 阅 此 卷</span>
            </Link>
          )}

          {/* 问题 — 面板中最重的字 */}
          <h3
            className={`font-body leading-snug mb-6 transition-colors duration-700 ${
              tier.question
            } ${isSelected ? 'text-celestial' : 'text-bone group-hover:text-gold-warm'}`}
            style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
          >
            {reading.question || '未 记 录 问 题'}
          </h3>

          {/* 牌阵刻度 */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-6 cn-label text-bone-dim">
            <span className="text-gold-dim">◇</span>
            <span>{reading.spread.nameCn}</span>
            <span className="w-2 h-px bg-[var(--ink-line)]" />
            <span>{reading.drawnCards.length} 张</span>
            {followUpCount > 0 && (
              <>
                <span className="w-2 h-px bg-[var(--ink-line)]" />
                <span className="text-celestial-dim">◆ {followUpCount} 次追问</span>
              </>
            )}
          </div>

          {/* 牌堆缩略 · 极简刻度 */}
          <div className="flex gap-1.5 items-end mb-6">
            {reading.drawnCards.slice(0, 10).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-[var(--bone-whisper)] group-hover:bg-[var(--gold-dim)] transition-colors duration-700"
                style={{
                  height: `${14 + ((i * 7) % 3) * 5}px`,
                  transitionTimingFunction: 'var(--ease-veil)',
                }}
              />
            ))}
            {reading.drawnCards.length > 10 && (
              <span className="font-heading text-bone-faint text-[11px] self-end ml-1">
                +{reading.drawnCards.length - 10}
              </span>
            )}
          </div>

          {/* 解读预览 */}
          {reading.interpretation && (
            <p className="font-body italic-soft text-sm text-bone-faint line-clamp-2 leading-relaxed">
              {reading.interpretation.substring(0, 120).replace(/[#*_`>\-]/g, '')}…
            </p>
          )}

          {/* 翻阅指引 · hover 浮现 */}
          <div className="mt-6 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
            <span className="cn-hint text-gold-dim tracking-veil whitespace-nowrap">
              翻 阅 此 卷
            </span>
            <span className="h-px flex-1 bg-[var(--gold-faint)]" />
            <span className="text-gold-dim text-xs">⟶</span>
          </div>
        </div>
      </div>
    </article>
  );
}
