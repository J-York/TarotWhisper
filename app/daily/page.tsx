'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactElement } from 'react';

import { TarotCardComponent } from '@/components/TarotCard';
import { InterpretationBody } from '@/components/Interpretation';
import { DailyCardSkeleton } from '@/components/Skeletons';
import { useSettingsDialog } from '@/components/AppShell';
import { useApiConfig } from '@/hooks/useApiConfig';
import { streamInterpret } from '@/lib/api/stream-client';
import { LLMError } from '@/lib/api/errors';
import {
  formatDateKey,
  getDailyDraw,
  getRecentDailyDraws,
  parseDateKey,
  type DailyDraw,
} from '@/lib/tarot/daily';
import { getDailyNote, saveDailyNote, type DailyNoteEntry } from '@/lib/dailyStorage';

const WEEKDAYS_CN = ['日', '一', '二', '三', '四', '五', '六'];

function formatHumanDate(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function formatHumanWeekday(date: Date): string {
  return `星期${WEEKDAYS_CN[date.getDay()]}`;
}

function formatShortDate(date: Date): string {
  return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

export default function DailyCardPage(): ReactElement {
  const { openSettings } = useSettingsDialog();

  /* ─── 当前查看的日期（默认今天） ─── */
  const [activeDateKey, setActiveDateKey] = useState<string | null>(null);
  const [activeDate, setActiveDate] = useState<Date | null>(null);
  const [todayKey, setTodayKey] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    queueMicrotask(() => {
      setActiveDate(now);
      setActiveDateKey(formatDateKey(now));
      setTodayKey(formatDateKey(now));
    });
  }, []);

  const dailyDraw = useMemo<DailyDraw | null>(() => {
    if (!activeDateKey) return null;
    const d = parseDateKey(activeDateKey) ?? new Date();
    return getDailyDraw(d);
  }, [activeDateKey]);

  /* ─── 翻牌动画 ─── */
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (!activeDateKey) return;
    queueMicrotask(() => setRevealed(false));
    const t = window.setTimeout(() => setRevealed(true), 260);
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

  const scheduleSave = useCallback(
    (value: string) => {
      if (!activeDateKey) return;
      window.clearTimeout(saveTimer.current);
      setSaveState('saving');
      saveTimer.current = window.setTimeout(() => {
        saveDailyNote(activeDateKey, value);
        setSavedNote(
          value.trim()
            ? { dateKey: activeDateKey, note: value, updatedAt: new Date().toISOString() }
            : null
        );
        setSaveState('saved');
        window.setTimeout(() => setSaveState('idle'), 1600);
      }, 800);
    },
    [activeDateKey]
  );

  useEffect(() => () => window.clearTimeout(saveTimer.current), []);

  const handleNoteChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setNote(e.target.value);
    scheduleSave(e.target.value);
  };

  /* ─── AI 解读 ─── */
  const { config: apiConfig, isLoaded: configLoaded, canUseApi } = useApiConfig();
  const [aiInterpretation, setAiInterpretation] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const dailyAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (dailyAbortRef.current) {
      dailyAbortRef.current.abort();
      dailyAbortRef.current = null;
    }
    queueMicrotask(() => {
      setAiInterpretation('');
      setAiError(null);
      setAiLoading(false);
    });
  }, [activeDateKey]);

  const requestAiInterpretation = useCallback(async () => {
    if (!dailyDraw || !activeDate || aiLoading) return;
    if (configLoaded && !canUseApi) {
      openSettings();
      return;
    }

    if (dailyAbortRef.current) dailyAbortRef.current.abort();
    const controller = new AbortController();
    dailyAbortRef.current = controller;

    setAiLoading(true);
    setAiInterpretation('');
    setAiError(null);

    try {
      const keywords = dailyDraw.isReversed
        ? dailyDraw.card.keywords.reversed
        : dailyDraw.card.keywords.upright;
      const meaning = dailyDraw.isReversed
        ? dailyDraw.card.meaning.reversed
        : dailyDraw.card.meaning.upright;

      await streamInterpret(
        {
          question: '',
          spread: { id: 'daily', name: 'Daily Card', nameCn: '今日一牌', description: '', positions: [] },
          drawnCards: [],
          apiConfig,
          daily: {
            cardName: dailyDraw.card.name,
            cardNameCn: dailyDraw.card.nameCn,
            isReversed: dailyDraw.isReversed,
            keywords,
            meaning,
            dateStr: formatHumanDate(activeDate),
          },
        },
        {
          onContent: (chunk) => setAiInterpretation((prev) => prev + chunk),
          onThinking: (chunk) => setAiInterpretation((prev) => prev + chunk),
          onStreamError: (msg) => setAiError(msg),
        },
        { signal: controller.signal }
      );
    } catch (err) {
      if (err instanceof LLMError && err.info.code === 'ABORTED') return;
      setAiError(
        err instanceof LLMError
          ? err.info.message
          : err instanceof Error
            ? err.message
            : 'AI 解读失败'
      );
    } finally {
      setAiLoading(false);
      if (dailyAbortRef.current === controller) {
        dailyAbortRef.current = null;
      }
    }
  }, [dailyDraw, activeDate, aiLoading, apiConfig, configLoaded, canUseApi, openSettings]);

  const recent = useMemo(
    () => (activeDate ? getRecentDailyDraws(14, activeDate) : []),
    [activeDate]
  );
  const timeline = useMemo(() => [...recent].reverse(), [recent]);
  const isToday = activeDateKey !== null && activeDateKey === todayKey;

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

  if (!activeDateKey || !activeDate || !dailyDraw) {
    return <DailyCardSkeleton />;
  }

  const keywords = dailyDraw.isReversed
    ? dailyDraw.card.keywords.reversed
    : dailyDraw.card.keywords.upright;
  const meaning = dailyDraw.isReversed
    ? dailyDraw.card.meaning.reversed
    : dailyDraw.card.meaning.upright;

  return (
    <main id="main-content" className="page-container page-main">
      {/* ─── 页头 ─── */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Daily Card · 今日一牌</p>
          <h1 className="page-title mt-3">{isToday ? '今日一牌' : '昔日之牌'}</h1>
          <p className="mt-2 text-sm text-bone-faint">
            {formatHumanDate(activeDate)} · {formatHumanWeekday(activeDate)}
            <span className="ml-2 text-bone-whisper">同日同牌 · 以本地日期为准</span>
          </p>
        </div>
        {!isToday && (
          <button type="button" onClick={handleBackToToday} className="btn-ink h-10 px-4 text-sm">
            回到今日
          </button>
        )}
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-start">
        {/* ─── 牌面 ─── */}
        <div key={activeDateKey} className="surface anim-veil-rise p-5 lg:sticky lg:top-24">
          <div className="flex items-center justify-between pb-4">
            <span className="text-[10px] tracking-[0.18em] text-gold-dim">
              {dailyDraw.isReversed ? '逆位 · REVERSED' : '正位 · UPRIGHT'}
            </span>
            <span className="text-[10px] text-bone-faint">№ {String(dailyDraw.card.number).padStart(2, '0')}</span>
          </div>

          <div className="relative mx-auto flex justify-center">
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2"
              style={{
                background:
                  'radial-gradient(circle, rgba(210,178,116,0.14) 0%, rgba(210,178,116,0.04) 42%, transparent 70%)',
              }}
            />
            <div className="relative w-[220px] md:w-[248px]">
              <TarotCardComponent
                card={dailyDraw.card}
                isReversed={dailyDraw.isReversed}
                isRevealed={revealed}
                onClick={() => setRevealed(true)}
                className="aspect-[3/5] w-full"
              />
            </div>
          </div>

          <div className="mt-5 text-center">
            {revealed ? (
              <div className="anim-fade-in">
                <h2 className="font-heading text-2xl tracking-[0.04em] text-bone">
                  {dailyDraw.card.nameCn}
                </h2>
                <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-gold-dim">
                  {dailyDraw.card.name}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                  {keywords.map((kw) => (
                    <span
                      key={kw}
                      className="rounded-full border border-[var(--ink-line)] px-2.5 py-1 text-[11px] text-bone-faint"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
                <p className="mt-4 font-body text-sm leading-relaxed text-bone-dim">{meaning}</p>
              </div>
            ) : (
              <p className="py-6 text-xs tracking-[0.14em] text-bone-faint anim-whisper">
                轻触牌面 · 揭示今日之牌
              </p>
            )}
          </div>
        </div>

        {/* ─── 右列 ─── */}
        <div className="flex flex-col gap-6">
          {/* AI 神谕解读 */}
          <section className="surface p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-gold" aria-hidden>✦</span>
                <h2 className="section-title">神谕解读</h2>
              </div>
              {!aiInterpretation && !aiLoading && (
                <button
                  type="button"
                  onClick={requestAiInterpretation}
                  className="btn-ink-primary h-9 px-4 text-sm"
                >
                  生成解读
                </button>
              )}
            </div>

            <div className="mt-4">
              {aiError && (
                <div className="rounded-lg border-l-2 border-[var(--gold-dim)] bg-[rgba(210,178,116,0.05)] px-4 py-3">
                  <p className="text-sm leading-relaxed text-bone-dim">{aiError}</p>
                  <button
                    type="button"
                    onClick={requestAiInterpretation}
                    className="btn-ink mt-3 h-8 px-3.5 text-xs"
                  >
                    重试
                  </button>
                </div>
              )}

              {(aiLoading || aiInterpretation) && (
                <div>
                  {aiInterpretation ? (
                    <InterpretationBody
                      content={aiInterpretation}
                      streaming={aiLoading}
                      cardTerms={[dailyDraw.card.nameCn, dailyDraw.card.name]}
                      showSigil={!aiLoading}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-10">
                      <span className="text-gold anim-whisper" aria-hidden>✦</span>
                      <span className="text-xs tracking-[0.14em] text-bone-dim">正在通灵</span>
                      <span className="flex gap-1.5" aria-hidden>
                        <span className="h-1 w-1 rounded-full bg-[var(--gold-dim)] anim-whisper" style={{ animationDelay: '0ms' }} />
                        <span className="h-1 w-1 rounded-full bg-[var(--gold-dim)] anim-whisper" style={{ animationDelay: '400ms' }} />
                        <span className="h-1 w-1 rounded-full bg-[var(--gold-dim)] anim-whisper" style={{ animationDelay: '800ms' }} />
                      </span>
                    </div>
                  )}
                  {aiLoading && (
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => dailyAbortRef.current?.abort()}
                        className="btn-ink-ghost text-xs"
                      >
                        停止生成
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!aiInterpretation && !aiLoading && !aiError && (
                <p className="text-sm leading-relaxed text-bone-faint">
                  让 AI 结合今日之牌与你的处境，给出一段更具体的指引。
                  {configLoaded && !canUseApi && (
                    <button
                      type="button"
                      onClick={openSettings}
                      className="ml-1 text-gold-warm underline decoration-[var(--gold-faint)] underline-offset-4"
                    >
                      需要先配置 API
                    </button>
                  )}
                </p>
              )}
            </div>
          </section>

          {/* 札记 */}
          <section className="surface p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-gold-dim" aria-hidden>◇</span>
                <h2 className="section-title">心之札记</h2>
              </div>
              <span
                className={`text-[11px] transition-opacity duration-300 ${
                  saveState === 'idle' ? 'opacity-0' : 'opacity-100'
                }`}
                aria-live="polite"
              >
                {saveState === 'saving' ? (
                  <span className="text-bone-faint">保存中…</span>
                ) : saveState === 'saved' ? (
                  <span className="text-gold-warm">✓ 已保存</span>
                ) : null}
              </span>
            </div>
            <div className="field-shell mt-4">
              <textarea
                value={note}
                onChange={handleNoteChange}
                placeholder={isToday ? '今日所感、所思、所应。仅保存在本地。' : '可补记当日所感。'}
                className="input-ink-bare h-36 w-full resize-none px-4 py-3 font-body text-[15px] leading-relaxed"
                spellCheck={false}
              />
            </div>
            {savedNote && (
              <p className="mt-2 text-right text-[11px] text-bone-whisper">
                最后保存 ·{' '}
                {new Date(savedNote.updatedAt).toLocaleString('zh-CN', {
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </section>
        </div>
      </div>

      {/* ─── 近 14 日轨迹 ─── */}
      <section className="mt-10" aria-labelledby="trail-title">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Last 14 Days</p>
            <h2 id="trail-title" className="section-title mt-2">近期轨迹</h2>
          </div>
          <span className="text-[11px] text-bone-faint">点击任意一天查看当日之牌</span>
        </div>

        <div className="surface mt-4 px-4 py-7 md:px-6">
          <div className="relative">
            <div
              aria-hidden
              className="absolute inset-x-2 top-[9px] h-px bg-gradient-to-r from-transparent via-[var(--gold-faint)] to-transparent"
            />
            <ol className="relative flex items-start justify-between gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {timeline.map((draw) => {
                const date = parseDateKey(draw.dateKey);
                if (!date) return null;
                const isActive = draw.dateKey === activeDateKey;
                const isThisToday = draw.dateKey === todayKey;
                const noted = !!getDailyNote(draw.dateKey);

                return (
                  <li key={draw.dateKey} className="flex shrink-0 justify-center">
                    <button
                      type="button"
                      onClick={() => handleSelectDate(draw)}
                      aria-current={isActive ? 'date' : undefined}
                      aria-label={`${formatShortDate(date)} · ${draw.card.nameCn}${draw.isReversed ? ' · 逆位' : ''}${noted ? ' · 有札记' : ''}`}
                      className="group flex w-11 flex-col items-center gap-2 pt-0.5 md:w-14"
                    >
                      <span
                        className={`block rounded-full transition-all duration-300 ${
                          isActive
                            ? 'h-3.5 w-3.5 border-2 border-[var(--gold)] bg-[rgba(210,178,116,0.3)] shadow-[0_0_14px_var(--gold-glow)]'
                            : draw.isReversed
                              ? 'h-2.5 w-2.5 border border-[var(--mist-faint)] bg-[var(--ink-deep)] group-hover:border-[var(--mist)]'
                              : 'h-2.5 w-2.5 bg-[var(--bone-whisper)] group-hover:bg-[var(--bone-dim)]'
                        }`}
                      />
                      <span
                        className={`truncate text-[10px] tracking-wide transition-colors ${
                          isActive ? 'text-gold-warm' : 'text-bone-faint group-hover:text-bone'
                        }`}
                      >
                        {draw.card.nameCn}
                      </span>
                      <span className="flex items-center gap-1 text-[9px] text-bone-whisper">
                        {formatShortDate(date)}
                        {isThisToday && <span className="text-gold">●</span>}
                        {noted && <span className="text-gold-dim">◆</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-[var(--ink-line)] pt-4 text-[10px] text-bone-faint">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" /> 正位
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full border border-[var(--mist)]" /> 逆位
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-gold-dim">◆</span> 有札记
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
