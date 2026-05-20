'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { TarotCardComponent } from '@/components/TarotCard';
import { DailyCardSkeleton } from '@/components/Skeletons';
import {
  formatDateKey,
  getDailyDraw,
  getRecentDailyDraws,
  parseDateKey,
  type DailyDraw,
} from '@/lib/tarot/daily';
import { getDailyNote, saveDailyNote, type DailyNoteEntry } from '@/lib/dailyStorage';

/* ─── 中文星期 ─── */
const WEEKDAYS_CN = ['日', '一', '二', '三', '四', '五', '六'];

function formatHumanDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

function formatHumanWeekday(date: Date): string {
  return `星 期 ${WEEKDAYS_CN[date.getDay()]}`;
}

export default function DailyCardPage() {
  /* ─── 当前查看的日期（默认今天）
     初创为 null 避免 SSR/CSR 时区不一致造成的 hydration mismatch ─── */
  const [activeDateKey, setActiveDateKey] = useState<string | null>(null);
  const [activeDate, setActiveDate] = useState<Date | null>(null);

  // 挂载后才取本地日期
  useEffect(() => {
    const now = new Date();
    queueMicrotask(() => {
      setActiveDate(now);
      setActiveDateKey(formatDateKey(now));
    });
  }, []);

  /* ─── 当日牌（挂载后计算） ─── */
  const dailyDraw = useMemo<DailyDraw | null>(() => {
    if (!activeDateKey) return null;
    const d = parseDateKey(activeDateKey) ?? new Date();
    return getDailyDraw(d);
  }, [activeDateKey]);

  /* ─── 翻牌动画：进入页面 / 切换日期时延迟翻开 ─── */
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (!activeDateKey) return;
    queueMicrotask(() => setRevealed(false));
    const t = window.setTimeout(() => setRevealed(true), 280);
    return () => window.clearTimeout(t);
  }, [activeDateKey]);

  /* ─── 笔记 ─── */
  const [note, setNote] = useState('');
  const [savedNote, setSavedNote] = useState<DailyNoteEntry | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimer = useRef<number>(0);

  useEffect(() => {
    if (!activeDateKey) return;
    const existing = getDailyNote(activeDateKey);
    queueMicrotask(() => {
      setSavedNote(existing);
      setNote(existing?.note ?? '');
      setSaveState('idle');
    });
  }, [activeDateKey]);

  // 自动保存（防抖 800ms）
  const scheduleSave = useCallback(
    (value: string) => {
      if (!activeDateKey) return;
      window.clearTimeout(saveTimer.current);
      setSaveState('saving');
      saveTimer.current = window.setTimeout(() => {
        saveDailyNote(activeDateKey, value);
        setSavedNote(value.trim() ? { dateKey: activeDateKey, note: value, updatedAt: new Date().toISOString() } : null);
        setSaveState('saved');
        // "已 录" 提示 1.6s 后回归 idle
        window.setTimeout(() => setSaveState('idle'), 1600);
      }, 800);
    },
    [activeDateKey]
  );

  useEffect(() => {
    return () => window.clearTimeout(saveTimer.current);
  }, []);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setNote(e.target.value);
    scheduleSave(e.target.value);
  };

  /* ─── 最近 14 天的轨迹 · 取决于本地今日 ─── */
  const recent = useMemo(
    () => (activeDate ? getRecentDailyDraws(14, activeDate) : []),
    [activeDate]
  );

  /* ─── 计算"今天"与"是否在看过去" ─── */
  const todayKey = useMemo(
    () => (activeDate ? formatDateKey(activeDate) : null),
    [activeDate]
  );
  const isToday = activeDateKey === todayKey;

  const handleSelectDate = (draw: DailyDraw): void => {
    const d = parseDateKey(draw.dateKey);
    if (!d) return;
    setActiveDate(d);
    setActiveDateKey(draw.dateKey);
  };

  const handleBackToToday = (): void => {
    const today = new Date();
    setActiveDate(today);
    setActiveDateKey(formatDateKey(today));
  };

  // 未挂载完成（未拿到本地今日）之前呈现骨架屏，避免 hydration mismatch
  if (!activeDateKey || !activeDate || !dailyDraw) {
    return <DailyCardSkeleton />;
  }

  return (
    <div className="relative min-h-screen flex flex-col px-6 md:px-10 py-10 md:py-12">
      {/* ─── Header ─── */}
      <header className="relative z-20 max-w-5xl w-full mx-auto mb-12">
        <div className="flex items-center justify-between">
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

          {!isToday && (
            <button onClick={handleBackToToday} className="btn-ink-ghost">
              回 到 今 日
            </button>
          )}
        </div>
      </header>

      {/* ─── Main ─── */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto">
        {/* 标题 / 日期 */}
        <div className="text-center mb-14 anim-veil-rise">
          <span className="text-gold text-xl anim-drift">✦</span>
          <h1 className="font-display text-4xl md:text-5xl text-bone mt-6 mb-3 tracking-[0.22em]">
            {isToday ? '今 日 一 牌' : '昔 日 之 牌'}
          </h1>
          <p className="font-display text-[11px] tracking-veil text-bone-faint uppercase mt-3">
            Card of the Day
          </p>
          <div className="rule-h-gold w-20 mx-auto mt-6" />
          <div className="mt-6 flex items-center justify-center gap-4 cn-label text-bone-dim">
            <span className="text-gold-dim">◇</span>
            <span>{formatHumanDate(activeDate)}</span>
            <span className="w-3 h-px bg-[var(--ink-line)]" />
            <span>{formatHumanWeekday(activeDate)}</span>
          </div>
          {isToday && (
            <p className="font-body italic-soft text-bone-whisper text-sm mt-5">
              星辰为今日揭下的那一张
            </p>
          )}
        </div>

        {/* ─── 当日牌 ─── */}
        <div className="flex flex-col items-center mb-20 anim-veil-rise" key={activeDateKey}>
          <div className="mb-10">
            <TarotCardComponent
              card={dailyDraw.card}
              isReversed={dailyDraw.isReversed}
              isRevealed={revealed}
              onClick={() => setRevealed(true)}
              size="md"
            />
          </div>

          {/* 牌名 */}
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl md:text-3xl text-bone tracking-[0.2em] mb-2">
              {dailyDraw.card.nameCn}
            </h2>
            <p className="font-display text-[11px] tracking-veil text-gold-dim uppercase">
              {dailyDraw.card.name}
            </p>
          </div>

          {/* 正/逆位 关键词 + 释义 */}
          <DailyMeaning draw={dailyDraw} />
        </div>

        {/* ─── 笔记区 ─── */}
        <section className="max-w-2xl mx-auto mb-20 anim-veil-rise">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-gold-dim text-base">◆</span>
            <span className="cn-label text-gold-dim">心 之 札 记</span>
            <div className="rule-h-fade flex-1" />
            <span
              className={`cn-hint transition-opacity duration-700 ${
                saveState === 'idle' ? 'opacity-0' : 'opacity-100'
              }`}
              style={{ transitionTimingFunction: 'var(--ease-veil)' }}
              aria-live="polite"
            >
              {saveState === 'saving' ? (
                <span className="text-bone-faint">书 写 中</span>
              ) : saveState === 'saved' ? (
                <span className="text-gold-dim">✦ 已 录</span>
              ) : null}
            </span>
          </div>
          <div className="ink-panel-quiet">
            <textarea
              value={note}
              onChange={handleNoteChange}
              placeholder={
                isToday
                  ? '今日所感、所思、所应。所写仅留于此处。'
                  : '可补记当日所感。'
              }
              className="input-ink-bare w-full h-40 px-7 py-5 text-base text-bone resize-none font-body leading-loose"
              spellCheck={false}
            />
          </div>
          {savedNote && (
            <p className="cn-hint text-bone-whisper mt-3 text-right">
              最 后 一 笔 · {new Date(savedNote.updatedAt).toLocaleString('zh-CN', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </section>

        {/* ─── 近期轨迹 · 14 天小卡墙 ─── */}
        <section className="max-w-5xl mx-auto pb-16 anim-veil-rise">
          <div className="text-center mb-10">
            <span className="text-gold text-lg anim-drift">✦</span>
            <h3 className="font-display text-xl md:text-2xl text-bone mt-5 mb-3 tracking-[0.22em] uppercase">
              近 期 轨 迹
            </h3>
            <div className="rule-h-gold w-16 mx-auto mt-3" />
            <p className="font-body italic-soft text-bone-whisper text-sm mt-5">
              过去 {recent.length} 日，星辰为你揭下的每一张
            </p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-3 md:gap-4">
            {recent.map((draw) => {
              const date = parseDateKey(draw.dateKey);
              if (!date) return null;
              const isActive = draw.dateKey === activeDateKey;
              const isThisToday = draw.dateKey === todayKey;
              const noted = !!getDailyNote(draw.dateKey);
              return (
                <button
                  key={draw.dateKey}
                  onClick={() => handleSelectDate(draw)}
                  className={`group flex flex-col items-center p-3 transition-all duration-500 ${
                    isActive
                      ? 'bg-[var(--ink-veil)] hairline-gold'
                      : 'hairline hover:bg-[var(--ink-veil)]'
                  }`}
                  style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
                >
                  <div className="font-display text-[10px] tracking-veil text-bone-whisper uppercase mb-2">
                    {String(date.getMonth() + 1).padStart(2, '0')}.
                    {String(date.getDate()).padStart(2, '0')}
                  </div>
                  <div
                    className={`cn-hint mb-3 transition-colors duration-500 ${
                      isActive ? 'text-gold' : isThisToday ? 'text-bone' : 'text-bone-dim group-hover:text-bone'
                    }`}
                  >
                    {draw.card.nameCn}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {draw.isReversed && (
                      <span className="cn-hint text-bone-whisper">逆</span>
                    )}
                    {noted && <span className="text-gold-dim text-xs">◆</span>}
                    {isThisToday && <span className="text-gold text-xs">✦</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
   含义展示 · 突出当日的方向（正/逆）
   ─────────────────────────────────────────────────────────────── */

function DailyMeaning({ draw }: { draw: DailyDraw }) {
  const { card, isReversed } = draw;
  const keywords = isReversed ? card.keywords.reversed : card.keywords.upright;
  const meaning = isReversed ? card.meaning.reversed : card.meaning.upright;
  const directionCn = isReversed ? '逆 位' : '正 位';
  const directionEn = isReversed ? 'Reversed' : 'Upright';
  const accent = isReversed ? 'text-mist' : 'text-gold-dim';
  const accentSymbol = isReversed ? '◇' : '✦';

  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-center justify-center gap-3 mb-6">
        <span className={`${accent} text-base`}>{accentSymbol}</span>
        <span className="cn-nav text-bone">{directionCn}</span>
        <span className="font-display text-[10px] tracking-veil text-bone-whisper uppercase">
          ╱ {directionEn}
        </span>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-7">
        {keywords.map((kw) => (
          <span key={kw} className="cn-hint text-bone-dim px-3 py-1.5 hairline">
            {kw}
          </span>
        ))}
      </div>

      <p className="font-body text-bone-dim text-base md:text-lg leading-loose text-center italic-soft px-2">
        {meaning}
      </p>
    </div>
  );
}
