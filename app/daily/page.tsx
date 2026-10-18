'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import Link from 'next/link';

import { useSettingsDialog } from '@/components/AppShell';
import { Interpretation } from '@/components/Interpretation';
import { Seal } from '@/components/Seal';
import { DailyCardSkeleton } from '@/components/Skeletons';
import { TarotCardComponent } from '@/components/TarotCard';
import { useApiConfig } from '@/hooks/useApiConfig';
import { LLMError } from '@/lib/api/errors';
import { streamInterpret, type RetryState } from '@/lib/api/stream-client';
import { getAllDailyNotes, getDailyNote, saveDailyNote } from '@/lib/dailyStorage';
import { formatClock, formatMonthDay, formatYearMonth, weekdayName } from '@/lib/dates';
import { formatLunarDate, getLunarDate } from '@/lib/lunar';
import { ARCANA, ARCANA_ORDER, arcanaOf } from '@/lib/tarot/arcana';
import { formatDateKey, getDailyDraw, parseDateKey, type DailyDraw } from '@/lib/tarot/daily';
import type { DrawnCard, SpreadPosition } from '@/lib/tarot/types';

/** 阵位名留空：否则解读里的「今日」之类常用词都会被当成阵位加上点线 */
const DAILY_POSITION: SpreadPosition = { id: 'daily', name: 'Daily', nameCn: '', description: '' };

interface DailyReading {
  dateKey: string;
  content: string;
  error: string | null;
  notice: string | null;
  retry: RetryState | null;
  isLoading: boolean;
}

function readNotedKeys(): ReadonlySet<string> {
  return new Set(getAllDailyNotes().map((entry) => entry.dateKey));
}

function formatSavedAt(iso: string, todayKey: string): string {
  const date = new Date(iso);
  return formatDateKey(date) === todayKey ? formatClock(date) : `${formatMonthDay(date)} ${formatClock(date)}`;
}

function isWeekend(date: Date): boolean {
  return date.getDay() === 0 || date.getDay() === 6;
}

export default function DailyPage(): ReactElement {
  const { openSettings } = useSettingsDialog();
  const { config, isLoaded, canUseApi } = useApiConfig();

  const [todayKey, setTodayKey] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    // 日期只在客户端取，避免服务端与浏览器跨零点时渲染不一致
    const key = formatDateKey(new Date());
    queueMicrotask(() => {
      setTodayKey(key);
      setActiveKey(key);
    });
  }, []);

  const draw = useMemo(() => {
    const date = activeKey ? parseDateKey(activeKey) : null;
    return date ? getDailyDraw(date) : null;
  }, [activeKey]);

  const drawnCards = useMemo<DrawnCard[]>(
    () => (draw ? [{ card: draw.card, isReversed: draw.isReversed, position: DAILY_POSITION }] : []),
    [draw],
  );

  /* ─── 翻牌：每换一天，牌先背面朝上，稍后自动翻开 ─── */

  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const revealed = activeKey !== null && revealedKey === activeKey;

  useEffect(() => {
    if (!activeKey) return;
    const timer = window.setTimeout(() => setRevealedKey(activeKey), 450);
    return () => window.clearTimeout(timer);
  }, [activeKey]);

  /* ─── 札记：停笔片刻后自动保存 ─── */

  const [noteKey, setNoteKey] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notedKeys, setNotedKeys] = useState<ReadonlySet<string>>(() => new Set());
  const pendingNote = useRef<{ dateKey: string; value: string } | null>(null);
  const saveTimer = useRef(0);

  // 换到另一天时在渲染中直接换上那天的札记，不让上一天的字闪一下
  if (activeKey && noteKey !== activeKey) {
    const existing = getDailyNote(activeKey);
    setNoteKey(activeKey);
    setNote(existing?.note ?? '');
    setSavedAt(existing?.updatedAt ?? null);
    setIsSaving(false);
    setNotedKeys(readNotedKeys());
  }

  const flushNote = useCallback((): void => {
    window.clearTimeout(saveTimer.current);
    const pending = pendingNote.current;
    if (!pending) return;
    pendingNote.current = null;
    saveDailyNote(pending.dateKey, pending.value);
    setNotedKeys(readNotedKeys());
  }, []);

  // 换日期或离开页面前，把还没写进存储的札记写进去
  useEffect(() => flushNote, [activeKey, flushNote]);

  const handleNoteChange = (value: string): void => {
    if (!activeKey) return;
    setNote(value);
    setIsSaving(true);
    pendingNote.current = { dateKey: activeKey, value };
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      flushNote();
      setIsSaving(false);
      setSavedAt(value.trim() ? new Date().toISOString() : null);
    }, 600);
  };

  /* ─── 神谕解读 ─── */

  const [reading, setReading] = useState<DailyReading | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const current = reading?.dateKey === activeKey ? reading : null;

  const stopReading = useCallback((): void => abortRef.current?.abort(), []);

  // 换日期或离开页面时停下正在写的解读
  useEffect(() => stopReading, [activeKey, stopReading]);

  const requestReading = async (): Promise<void> => {
    if (!activeKey || !draw) return;
    if (!canUseApi) {
      openSettings();
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const dateKey = activeKey;
    const patch = (update: (prev: DailyReading) => Partial<DailyReading>): void =>
      setReading((prev) => (prev?.dateKey === dateKey ? { ...prev, ...update(prev) } : prev));

    setReading({ dateKey, content: '', error: null, notice: null, retry: null, isLoading: true });
    const { card, isReversed } = draw;

    try {
      const result = await streamInterpret(
        {
          question: '',
          spread: { id: 'daily', name: 'Daily Card', nameCn: '今日一牌', description: '', positions: [] },
          drawnCards: [],
          apiConfig: config,
          daily: {
            cardName: card.name,
            cardNameCn: card.nameCn,
            isReversed,
            keywords: isReversed ? card.keywords.reversed : card.keywords.upright,
            meaning: isReversed ? card.meaning.reversed : card.meaning.upright,
            dateStr: dateKey.replaceAll('-', '.'),
          },
        },
        {
          onContent: (chunk) => patch((p) => ({ content: p.content + chunk })),
          onThinking: (chunk) => patch((p) => ({ content: p.content + chunk })),
          onStreamError: (msg) => patch((p) => ({ error: p.error ?? msg })),
          onRetry: (attempt, max) => patch(() => ({ retry: { attempt, max } })),
        },
        { signal: controller.signal },
      );
      patch(() => ({
        notice: result.truncated ? '解读因模型输出长度限制被截断，只显示了一部分。' : null,
      }));
    } catch (err) {
      if (err instanceof LLMError && err.info.code === 'ABORTED') {
        // 还没写出字就停下，回到初始状态；写了一半的留着
        setReading((prev) => {
          if (prev?.dateKey !== dateKey) return prev;
          return prev.content ? { ...prev, error: '已停止生成' } : null;
        });
        return;
      }
      const message =
        err instanceof LLMError ? err.info.message : err instanceof Error ? err.message : '解读失败，请稍后再试';
      patch((p) => ({ error: p.error ?? message }));
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      patch(() => ({ isLoading: false, retry: null }));
    }
  };

  /* ─── 日期切换 ─── */

  const goToday = (): void => {
    if (!todayKey) return;
    setActiveKey(todayKey);
    setMonthOffset(0);
  };

  const selectDay = (key: string): void => {
    setActiveKey(key);
    const sheet = document.getElementById('daily-sheet');
    // 月历在页面下方；选中某天后把那天的牌带回视野
    if (sheet && sheet.getBoundingClientRect().top < 0) {
      sheet.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!todayKey || !activeKey || !draw) return <DailyCardSkeleton />;

  const activeDate = parseDateKey(activeKey) ?? new Date();
  const isToday = activeKey === todayKey;
  const { card, isReversed } = draw;
  const arcana = ARCANA[arcanaOf(card)];
  const lunar = formatLunarDate(activeDate);
  const keywords = isReversed ? card.keywords.reversed : card.keywords.upright;
  const meaning = isReversed ? card.meaning.reversed : card.meaning.upright;
  const needsSetup = isLoaded && !canUseApi;

  return (
    <main id="main-content" className="page-container page-main">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">今日一牌</p>
          <h1 className="page-title mt-3">{isToday ? '今天的牌' : `${formatMonthDay(activeDate)}的牌`}</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-ink-soft">
            每天一张。同一天里，所有人翻开的都是同一张牌，日期以你所在的时区为准。
          </p>
        </div>
        {!isToday && (
          <button type="button" onClick={goToday} className="btn btn-secondary h-10 px-4 text-sm">
            回到今天
          </button>
        )}
      </header>

      <div className="mt-10 grid items-start gap-10 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-14">
        {/* ─── 日历撕页 ─── */}
        <article
          key={activeKey}
          id="daily-sheet"
          aria-label={`${formatMonthDay(activeDate)}的牌`}
          className="panel anim-rise scroll-mt-24 overflow-hidden"
        >
          <div className="perforation" aria-hidden />
          <div className="px-6 pb-8 pt-4">
            <div className="flex items-baseline justify-between text-[13px] text-ink-muted">
              <span>{formatYearMonth(activeDate)}</span>
              <span className={isWeekend(activeDate) ? 'text-accent' : undefined}>{weekdayName(activeDate)}</span>
            </div>

            <div className="relative mt-3 text-center">
              <p
                className={`font-latin text-[5.5rem] font-semibold leading-none tabular-nums ${
                  isWeekend(activeDate) ? 'text-accent' : 'text-ink'
                }`}
              >
                {activeDate.getDate()}
              </p>
              {lunar && <p className="mt-3 text-sm tracking-[0.18em] text-ink-soft">{lunar}</p>}
              {isToday && <Seal text="今日" stamp className="absolute right-0 top-1" />}
            </div>

            <div className="rule-double mt-6" aria-hidden />

            <div className="mt-8 flex justify-center">
              <TarotCardComponent
                card={card}
                isReversed={isReversed}
                isRevealed={revealed}
                onClick={() => setRevealedKey(activeKey)}
                size="xl"
                tilt
              />
            </div>

            {/* 翻开前占住位置，翻开时不顶动下方内容 */}
            <div className={`mt-7 text-center ${revealed ? 'anim-fade' : 'invisible'}`}>
              <h2 className="text-2xl font-bold tracking-[0.04em] text-ink">{card.nameCn}</h2>
              <p className="mt-0.5 font-latin text-base italic text-ink-muted">{card.name}</p>
              <p className="mt-3 text-sm">
                <span className={isReversed ? 'font-semibold text-accent' : 'text-ink-soft'}>
                  {isReversed ? '逆位' : '正位'}
                </span>
                <span className="mx-2 text-line-strong" aria-hidden>
                  ·
                </span>
                <span className={arcana.textClass}>{arcana.nameCn}</span>
              </p>
              <p className="mt-4 break-keep text-[15px] leading-relaxed text-ink">{keywords.join(' · ')}</p>
              <p className="mt-4 text-left text-[15px] leading-relaxed text-ink-soft">{meaning}</p>
              <Link href={`/library?card=${card.id}`} className="link mt-5 inline-block text-sm">
                在牌典中查看这张牌
              </Link>
            </div>
          </div>
        </article>

        <div className="flex min-w-0 flex-col gap-10">
          {/* ─── 神谕的话 ─── */}
          <section aria-labelledby="daily-oracle-title" className="panel px-5 py-6 md:px-8 md:py-7">
            <div className="flex items-center justify-between gap-3">
              <h2 id="daily-oracle-title" className="section-title">
                神谕的话
              </h2>
              {current?.isLoading && (
                <button type="button" onClick={stopReading} className="btn btn-ghost h-8 text-sm">
                  停止
                </button>
              )}
            </div>

            {current ? (
              <div className="mt-5">
                <Interpretation
                  content={current.content}
                  isLoading={current.isLoading}
                  error={current.error}
                  notice={current.notice}
                  retry={current.retry}
                  drawnCards={drawnCards}
                  onOpenSettings={needsSetup ? openSettings : undefined}
                />
                {!current.isLoading && canUseApi && (
                  <div className="mt-6 flex justify-end">
                    <button type="button" onClick={() => void requestReading()} className="btn btn-ghost h-9 text-sm">
                      {current.content ? '重新生成' : '重试'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
                  请神谕结合这张牌，为{isToday ? '今天' : '那一天'}写几句具体的提醒。
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                  {needsSetup ? (
                    <>
                      <button type="button" onClick={openSettings} className="btn btn-primary h-10 px-5">
                        先配置 API
                      </button>
                      <span className="text-[13px] text-ink-muted">解读需要连接模型。</span>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void requestReading()}
                      disabled={!isLoaded}
                      className="btn btn-primary h-10 px-5"
                    >
                      请神谕解读
                    </button>
                  )}
                </div>
              </>
            )}
          </section>

          {/* ─── 札记 ─── */}
          <section aria-labelledby="daily-note-title" className="panel px-5 py-6 md:px-8 md:py-7">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h2 id="daily-note-title" className="section-title">
                札记
              </h2>
              <span className="text-[13px] text-ink-muted" aria-live="polite">
                {isSaving
                  ? '正在保存…'
                  : savedAt
                    ? `已保存 · ${formatSavedAt(savedAt, todayKey)}`
                    : '只保存在这台设备上'}
              </span>
            </div>
            <textarea
              value={note}
              onChange={(e) => handleNoteChange(e.target.value)}
              aria-labelledby="daily-note-title"
              placeholder={isToday ? '今天发生了什么？这张牌让你想到了什么？' : '补记那一天的事。'}
              spellCheck={false}
              className="ruled field-bare mt-3 block h-[13.5rem] w-full resize-y font-hand text-lg text-voice"
            />
          </section>

          <MonthCalendar
            todayKey={todayKey}
            activeKey={activeKey}
            offset={monthOffset}
            onOffsetChange={setMonthOffset}
            notedKeys={notedKeys}
            onSelect={selectDay}
          />
        </div>
      </div>
    </main>
  );
}

/* ─── 月历 ─── */

const WEEK_HEAD = ['一', '二', '三', '四', '五', '六', '日'];

interface DayCell {
  key: string;
  day: number;
  /** 农历日；逢初一写月份，和纸质日历一样 */
  lunar: string;
  /** 还没到的日子为 null */
  draw: DailyDraw | null;
}

function buildMonth(todayKey: string, offset: number): { title: string; lead: number; cells: DayCell[] } {
  const today = parseDateKey(todayKey) ?? new Date();
  const first = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const total = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();

  const cells: DayCell[] = [];
  for (let day = 1; day <= total; day++) {
    const date = new Date(first.getFullYear(), first.getMonth(), day);
    const key = formatDateKey(date);
    const lunar = getLunarDate(date);
    cells.push({
      key,
      day,
      lunar: lunar ? (lunar.day === '初一' ? lunar.month : lunar.day) : '',
      draw: key <= todayKey ? getDailyDraw(date) : null,
    });
  }

  // 周一排在第一列
  return { title: formatYearMonth(first), lead: (first.getDay() + 6) % 7, cells };
}

interface MonthCalendarProps {
  todayKey: string;
  activeKey: string;
  offset: number;
  onOffsetChange: (offset: number) => void;
  notedKeys: ReadonlySet<string>;
  onSelect: (dateKey: string) => void;
}

function MonthCalendar({
  todayKey,
  activeKey,
  offset,
  onOffsetChange,
  notedKeys,
  onSelect,
}: MonthCalendarProps): ReactElement {
  const { title, lead, cells } = useMemo(() => buildMonth(todayKey, offset), [todayKey, offset]);
  const trail = (7 - ((lead + cells.length) % 7)) % 7;

  return (
    <section aria-labelledby="daily-month-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="daily-month-title" className="section-title">
          {title}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onOffsetChange(offset - 1)}
            aria-label="上个月"
            className="btn btn-ghost h-9 w-9 px-0"
          >
            <Chevron direction="left" />
          </button>
          <button
            type="button"
            onClick={() => onOffsetChange(offset + 1)}
            disabled={offset >= 0}
            aria-label="下个月"
            className="btn btn-ghost h-9 w-9 px-0"
          >
            <Chevron direction="right" />
          </button>
        </div>
      </div>

      {/* 格子之间留 1px 缝，透出底色作为格线 */}
      <div className="mt-4 overflow-hidden rounded-md border border-line">
        <div className="grid grid-cols-7 gap-px bg-line">
          {WEEK_HEAD.map((label, i) => (
            <span
              key={label}
              aria-hidden
              className={`bg-sunken py-1.5 text-center text-xs ${i >= 5 ? 'text-accent' : 'text-ink-muted'}`}
            >
              {label}
            </span>
          ))}
          {Array.from({ length: lead }, (_, i) => (
            <span key={`lead-${i}`} className="bg-canvas" aria-hidden />
          ))}
          {cells.map((cell) => (
            <DayCellView
              key={cell.key}
              cell={cell}
              isToday={cell.key === todayKey}
              isActive={cell.key === activeKey}
              hasNote={notedKeys.has(cell.key)}
              onSelect={onSelect}
            />
          ))}
          {Array.from({ length: trail }, (_, i) => (
            <span key={`trail-${i}`} className="bg-canvas" aria-hidden />
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-muted">
        {ARCANA_ORDER.map((key) => (
          <span key={key} className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${ARCANA[key].bgClass}`} aria-hidden />
            {ARCANA[key].nameCn}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rotate-45 bg-voice" aria-hidden />
          写了札记
        </span>
        <span className="sm:hidden">空心圆点为逆位</span>
      </div>
    </section>
  );
}

interface DayCellViewProps {
  cell: DayCell;
  isToday: boolean;
  isActive: boolean;
  hasNote: boolean;
  onSelect: (dateKey: string) => void;
}

function DayCellView({ cell, isToday, isActive, hasNote, onSelect }: DayCellViewProps): ReactElement {
  const frame = 'relative flex min-h-[4.5rem] flex-col items-center gap-1 px-0.5 pb-2 pt-1.5 sm:min-h-20';

  if (!cell.draw) {
    return (
      <span aria-hidden className={`${frame} bg-surface text-ink-muted/50`}>
        <span className="grid h-8 w-8 place-items-center font-latin text-xl leading-none">{cell.day}</span>
        <span className="text-[10px] leading-none">{cell.lunar}</span>
      </span>
    );
  }

  const { card, isReversed } = cell.draw;
  const arcana = ARCANA[arcanaOf(card)];
  const month = Number(cell.key.slice(5, 7));

  return (
    <button
      type="button"
      onClick={() => onSelect(cell.key)}
      aria-current={isActive ? 'date' : undefined}
      aria-label={`${month}月${cell.day}日${isToday ? '（今天）' : ''}，${card.nameCn}，${isReversed ? '逆位' : '正位'}${
        hasNote ? '，写了札记' : ''
      }`}
      className={`${frame} bg-surface transition-colors duration-150 hover:bg-canvas`}
    >
      {/* 选中的那天像是用红笔圈了出来 */}
      <span
        className={`grid h-8 w-8 place-items-center rounded-full font-latin text-xl leading-none tabular-nums ${
          isActive ? 'ring-[1.5px] ring-accent' : ''
        } ${isToday ? 'font-bold text-accent' : 'text-ink'}`}
      >
        {cell.day}
      </span>
      <span className="text-[10px] leading-none text-ink-muted">{cell.lunar}</span>
      <span className={`hidden max-w-full truncate text-[11px] leading-tight sm:block ${arcana.textClass}`}>
        {card.nameCn}
        {isReversed && <span className="text-ink-muted"> 逆</span>}
      </span>
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full border border-current sm:hidden ${arcana.textClass} ${
          isReversed ? '' : 'bg-current'
        }`}
      />
      {hasNote && <span aria-hidden className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rotate-45 bg-voice" />}
    </button>
  );
}

function Chevron({ direction }: { direction: 'left' | 'right' }): ReactElement {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d={direction === 'left' ? 'm10 3-5 5 5 5' : 'm6 3 5 5-5 5'} />
    </svg>
  );
}
