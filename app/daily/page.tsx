'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import Link from 'next/link';

import { TarotCardComponent } from '@/components/TarotCard';
import { InterpretationBody } from '@/components/Interpretation';
import { DailyCardSkeleton } from '@/components/Skeletons';
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

/** MM.DD · 时间线上的短日期 */
function formatShortDate(date: Date): string {
  return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

/* ─── 关键词散落位 · 环绕主卡漂浮 ─── */
interface KeywordSpot {
  pos: string;
  driftDelay: string;
  twinkleDelay: string;
  symbol: string;
}

const KEYWORD_SPOTS: ReadonlyArray<KeywordSpot> = [
  { pos: 'left-[4%] top-[21%] sm:left-[12%] lg:left-[19%]', driftDelay: '0ms', twinkleDelay: '-0.6s', symbol: '✦' },
  { pos: 'right-[3%] top-[27%] sm:right-[10%] lg:right-[17%]', driftDelay: '-3.8s', twinkleDelay: '-1.9s', symbol: '◇' },
  { pos: 'left-[7%] bottom-[27%] sm:left-[15%] lg:left-[22%]', driftDelay: '-7.2s', twinkleDelay: '-2.7s', symbol: '✧' },
  { pos: 'right-[6%] bottom-[21%] sm:right-[13%] lg:right-[21%]', driftDelay: '-1.6s', twinkleDelay: '-0.2s', symbol: '⊹' },
  { pos: 'left-[24%] top-[10%] hidden md:flex lg:left-[30%]', driftDelay: '-5.4s', twinkleDelay: '-1.2s', symbol: '✦' },
  { pos: 'right-[22%] bottom-[9%] hidden md:flex lg:right-[28%]', driftDelay: '-9.1s', twinkleDelay: '-2.2s', symbol: '◇' },
];

export default function DailyCardPage() {
  /* ─── 当前查看的日期（默认今天）
     初创为 null 避免 SSR/CSR 时区不一致造成的 hydration mismatch ─── */
  const [activeDateKey, setActiveDateKey] = useState<string | null>(null);
  const [activeDate, setActiveDate] = useState<Date | null>(null);
  const [todayKey, setTodayKey] = useState<string | null>(null);

  // 挂载后才取本地日期
  useEffect(() => {
    const now = new Date();
    queueMicrotask(() => {
      setActiveDate(now);
      setActiveDateKey(formatDateKey(now));
      setTodayKey(formatDateKey(now));
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

  const handleNoteChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setNote(e.target.value);
    scheduleSave(e.target.value);
  };

  /* ─── AI 解读 ─── */
  const { config: apiConfig } = useApiConfig();
  const [aiInterpretation, setAiInterpretation] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const dailyAbortRef = useRef<AbortController | null>(null);

  // 切换日期时清空 AI 解读并取消进行中的请求
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

    // 取消旧请求
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
        { signal: controller.signal },
      );
    } catch (err) {
      // 用户取消静默处理
      if (err instanceof LLMError && err.info.code === 'ABORTED') return;
      setAiError(err instanceof LLMError ? err.info.message : (err instanceof Error ? err.message : 'AI 解读失败'));
    } finally {
      setAiLoading(false);
      if (dailyAbortRef.current === controller) {
        dailyAbortRef.current = null;
      }
    }
  }, [dailyDraw, activeDate, aiLoading, apiConfig]);

  /* ─── 最近 14 天的轨迹 · 取决于本地今日 ─── */
  const recent = useMemo(
    () => (activeDate ? getRecentDailyDraws(14, activeDate) : []),
    [activeDate]
  );

  // 时间线从左到右按时间正序排列（最右为结束日）
  const timeline = useMemo(() => [...recent].reverse(), [recent]);

  /* ─── 是否在看今天 ─── */
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

  // 未挂载完成（未拿到本地今日）之前呈现骨架屏，避免 hydration mismatch
  if (!activeDateKey || !activeDate || !dailyDraw) {
    return <DailyCardSkeleton />;
  }

  const keywords = dailyDraw.isReversed
    ? dailyDraw.card.keywords.reversed
    : dailyDraw.card.keywords.upright;
  const meaning = dailyDraw.isReversed
    ? dailyDraw.card.meaning.reversed
    : dailyDraw.card.meaning.upright;
  const directionCn = dailyDraw.isReversed ? '逆 位' : '正 位';
  const directionEn = dailyDraw.isReversed ? 'Reversed' : 'Upright';

  return (
    <div className="relative">
      <main id="main-content">
        {/* ═══ 第一幕 · 揭示之厅 ─── 牌是绝对主角 ─══ */}
        <section
          className="act-fullscreen overflow-hidden"
          aria-label={isToday ? '今日一牌' : '昔日之牌'}
        >
          {/* ─── 导航 · 仅一枚返回链接，栖于左上 ─── */}
          <header className="absolute inset-x-0 top-0 z-30 p-6 md:p-10">
            <div className="flex items-start justify-between">
              <div className="anim-fade-in">
                <Link
                  href="/"
                  className="group inline-flex items-center gap-3 text-bone-dim transition-colors duration-500 hover:text-gold-dim"
                  style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
                >
                  <span
                    className="text-base transition-transform duration-700 group-hover:-translate-x-1"
                    style={{ transitionTimingFunction: 'var(--ease-veil)' }}
                  >
                    ←
                  </span>
                  <span className="cn-nav">返 回</span>
                </Link>

                {/* 标题 · 小而克制，让位给牌 */}
                <h1 className="mt-8 font-heading text-sm tracking-[0.32em] text-bone md:text-base">
                  {isToday ? '今 日 一 牌' : '昔 日 之 牌'}
                </h1>
                <p className="mt-3 font-heading text-tiny text-bone-whisper">
                  {formatHumanDate(activeDate)} · {formatHumanWeekday(activeDate)}
                </p>
              </div>

              {!isToday && (
                <button type="button" onClick={handleBackToToday} className="btn-ink-ghost anim-fade-in">
                  回 到 今 日
                </button>
              )}
            </div>
          </header>

          {/* ─── 右缘竖排侧标 · 仪式场记 ─── */}
          <div
            aria-hidden
            className="absolute right-8 top-1/2 z-20 hidden -translate-y-1/2 lg:block"
          >
            <span className="text-vertical font-heading text-tiny text-bone-whisper">
              {isToday ? 'CARD OF THE DAY' : 'CARD OF THE PAST'} — {formatHumanDate(activeDate)}
            </span>
          </div>

          {/* ─── 星尘散点 ─── */}
          <span aria-hidden className="scatter-symbol left-[11%] top-[16%] text-base anim-twinkle" style={{ animationDelay: '-0.8s' }}>✦</span>
          <span aria-hidden className="scatter-symbol right-[13%] top-[13%] text-sm anim-twinkle" style={{ animationDelay: '-2.1s' }}>✧</span>
          <span aria-hidden className="scatter-symbol left-[6%] top-[56%] text-lg anim-twinkle" style={{ animationDelay: '-1.4s' }}>◇</span>
          <span aria-hidden className="scatter-symbol right-[7%] top-[62%] text-base anim-twinkle" style={{ animationDelay: '-2.9s' }}>⊹</span>
          <span aria-hidden className="scatter-symbol left-[21%] bottom-[10%] text-sm anim-twinkle" style={{ animationDelay: '-0.3s' }}>✧</span>
          <span aria-hidden className="scatter-symbol right-[19%] bottom-[8%] text-base anim-twinkle" style={{ animationDelay: '-1.8s' }}>✦</span>

          {/* ─── 关键词 · 散落漂浮于牌的四周 ─── */}
          {revealed && <ScatteredKeywords keywords={keywords} />}

          {/* ─── 中央：光晕 + 轨道环 + 主卡 ─── */}
          <div key={activeDateKey} className="anim-veil-rise relative z-10 flex flex-col items-center">
            <div className="relative">
              {/* 径向金辉 · 由中心向外熄灭 */}
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 md:h-[48rem] md:w-[48rem]"
                style={{
                  background:
                    'radial-gradient(circle, rgba(212,184,115,0.16) 0%, rgba(201,169,97,0.07) 30%, rgba(201,169,97,0.025) 52%, transparent 72%)',
                }}
              />
              {/* 内层烛芯 · 缓慢呼吸 */}
              <div
                aria-hidden
                className="anim-whisper pointer-events-none absolute left-1/2 top-1/2 h-[16rem] w-[16rem] -translate-x-1/2 -translate-y-1/2 md:h-[24rem] md:w-[24rem]"
                style={{
                  background:
                    'radial-gradient(circle, rgba(232,213,163,0.12) 0%, rgba(212,184,115,0.05) 45%, transparent 70%)',
                  animationDuration: '7s',
                }}
              />
              {/* 轨道环 · 内环缓转 */}
              <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="relative h-[22rem] w-[22rem] md:h-[34rem] md:w-[34rem]">
                  <span className="arc-glow inset-0" />
                </div>
              </div>
              {/* 轨道环 · 外环逆行虚线 */}
              <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="relative h-[27rem] w-[27rem] md:h-[44rem] md:w-[44rem]">
                  <span
                    className="arc-glow inset-0"
                    style={{ borderStyle: 'dashed', animationDuration: '95s', animationDirection: 'reverse' }}
                  />
                </div>
              </div>

              {/* 主卡 · 悬浮于光晕之上 */}
              <div className="float-card relative z-10">
                <TarotCardComponent
                  card={dailyDraw.card}
                  isReversed={dailyDraw.isReversed}
                  isRevealed={revealed}
                  onClick={() => setRevealed(true)}
                  className="w-64 md:w-80 lg:w-96 aspect-[2/3]"
                />
              </div>
            </div>

            {/* ─── 牌名 · 揭示的戏剧时刻 ─── */}
            <div className="mt-12 min-h-[13rem] text-center md:mt-16 md:min-h-[15rem]">
              {revealed ? (
                <div className="anim-veil-rise">
                  <div className="mb-6 flex items-center justify-center gap-3">
                    <span aria-hidden className={`text-sm ${dailyDraw.isReversed ? 'text-mist' : 'text-gold-dim'}`}>
                      {dailyDraw.isReversed ? '◇' : '✦'}
                    </span>
                    <span className="cn-nav text-bone">{directionCn}</span>
                    <span className="font-heading text-tiny text-bone-whisper">{directionEn}</span>
                  </div>
                  <h2 className="font-heading text-massive text-bone">
                    {dailyDraw.card.nameCn}
                  </h2>
                  <p className="font-display text-gold-foil mt-4 text-base uppercase tracking-[0.3em] md:text-xl">
                    {dailyDraw.card.name}
                  </p>
                  <p className="font-body italic-soft mx-auto mt-7 max-w-md px-4 text-sm leading-relaxed text-bone-dim md:text-base">
                    {meaning}
                  </p>
                </div>
              ) : (
                <div className="anim-fade-in pt-10">
                  <p className="cn-hint anim-whisper text-bone-whisper">
                    轻 触 牌 面 · 揭 示 神 谕
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ─── 底部指引 ─── */}
          <a
            href="#oracle"
            aria-hidden
            className="absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2.5 text-bone-whisper transition-colors duration-500 hover:text-gold-dim"
          >
            <span className="cn-hint">神 谕 · 札 记 · 轨 迹</span>
            <span className="anim-whisper text-xs text-gold-dim">↓</span>
          </a>
        </section>

        {/* ═══ 第二幕 · 神谕 ─── 羊皮卷自上方徐徐展开 ═══ */}
        <section id="oracle" className="relative z-10 px-6 pb-24 pt-10 md:px-10 md:pb-32">
          <div className="mx-auto max-w-2xl">
            <div className="ornament-divider mb-12">
              <span className="ornament-gem" />
            </div>

            <div className="mb-9 flex items-center gap-3">
              <span aria-hidden className="text-base text-gold-dim">◆</span>
              <h3 className="cn-label text-gold-dim">神 谕 指 引</h3>
              <div className="rule-h-fade flex-1" />
              <span className="font-heading text-tiny text-bone-whisper">Oracle</span>
            </div>

            {!aiInterpretation && !aiLoading && !aiError && (
              <div className="anim-fade-in flex flex-col items-center gap-6">
                <p className="font-body italic-soft text-sm text-bone-faint">
                  让星辰为你展开这一日的低语
                </p>
                <button
                  type="button"
                  onClick={requestAiInterpretation}
                  className="btn-ink-primary inline-flex items-center gap-3 px-12 py-3.5"
                >
                  <span>请 求 神 谕</span>
                  <span className="text-xs">✦</span>
                </button>
              </div>
            )}

            {aiError && (
              <div className="anim-curtain ink-panel-quiet p-9 text-center">
                <span aria-hidden className="text-lg text-gold-dim">◇</span>
                <p className="font-body italic-soft mt-4 mb-7 text-base text-bone-faint">
                  {aiError}
                </p>
                <button type="button" onClick={requestAiInterpretation} className="btn-ink-ghost">
                  重 试
                </button>
              </div>
            )}

            {(aiLoading || aiInterpretation) && (
              <div className="anim-curtain">
                {/* 卷轴上缘 · 一道金线如轴杆 */}
                <div aria-hidden className="rule-h-gold" />
                <div className="chat-bubble-oracle p-8 md:p-12">
                  {aiInterpretation ? (
                    <InterpretationBody
                      content={aiInterpretation}
                      streaming={aiLoading}
                      cardTerms={[dailyDraw.card.nameCn, dailyDraw.card.name]}
                      showSigil={!aiLoading}
                    />
                  ) : (
                    <div className="flex items-center justify-center gap-4 py-10">
                      <span className="anim-whisper text-gold">✦</span>
                      <span className="cn-label text-bone-dim">正 在 通 灵</span>
                      <span className="flex gap-2">
                        <span className="anim-whisper h-1 w-1 rounded-full bg-[var(--gold-dim)]" style={{ animationDelay: '0ms' }} />
                        <span className="anim-whisper h-1 w-1 rounded-full bg-[var(--gold-dim)]" style={{ animationDelay: '400ms' }} />
                        <span className="anim-whisper h-1 w-1 rounded-full bg-[var(--gold-dim)]" style={{ animationDelay: '800ms' }} />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ═══ 第三幕 · 札记 ─── 金顶仪式面板 ═══ */}
        <section id="journal" className="relative z-10 px-6 pb-24 md:px-10 md:pb-32">
          <div className="mx-auto max-w-2xl">
            <div className="mb-9 flex items-center gap-3">
              <span aria-hidden className="text-base text-gold-dim">◆</span>
              <h3 className="cn-label text-gold-dim">心 之 札 记</h3>
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

            <div className="ink-panel-ritual">
              <textarea
                value={note}
                onChange={handleNoteChange}
                placeholder={
                  isToday
                    ? '今日所感、所思、所应。所写仅留于此处。'
                    : '可补记当日所感。'
                }
                className="input-ink-bare font-body h-44 w-full resize-none px-8 py-6 text-base leading-loose text-bone"
                spellCheck={false}
              />
            </div>
            {savedNote && (
              <p className="cn-hint mt-3.5 text-right text-bone-whisper">
                最 后 一 笔 · {new Date(savedNote.updatedAt).toLocaleString('zh-CN', {
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        </section>

        {/* ═══ 第四幕 · 轨迹 ─── 十四日星轨时间线 ═══ */}
        <section id="trail" className="relative z-10 px-6 pb-20 md:px-10">
          <div className="mx-auto max-w-4xl">
            <div className="mb-4 flex items-center gap-3">
              <span aria-hidden className="text-base text-gold-dim">◆</span>
              <h3 className="cn-label text-gold-dim">近 期 轨 迹</h3>
              <div className="rule-h-fade flex-1" />
              <span className="font-heading text-tiny text-bone-whisper">XIV Days</span>
            </div>
            <p className="font-body italic-soft mb-12 text-sm text-bone-whisper">
              过去 {recent.length} 日 · 星辰为你揭下的每一张
            </p>

            <HistoryTimeline
              draws={timeline}
              activeDateKey={activeDateKey}
              todayKey={todayKey}
              onSelect={handleSelectDate}
            />

            {/* 图例 */}
            <div className="cn-hint mt-10 flex items-center justify-center gap-6 text-bone-whisper">
              <span className="flex items-center gap-2">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                正 位
              </span>
              <span className="flex items-center gap-2">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full border border-[var(--mist)]" />
                逆 位
              </span>
              <span className="flex items-center gap-2">
                <span aria-hidden className="text-[9px] text-gold-dim">◆</span>
                有 札 记
              </span>
            </div>
          </div>
        </section>

        {/* ─── 终章 ─── */}
        <footer className="relative z-10 flex flex-col items-center gap-5 pb-16 pt-4">
          <div className="rule-h-gold w-24" />
          <span aria-hidden className="anim-drift text-sm text-gold-dim">✦</span>
          <p className="font-heading text-tiny text-bone-whisper">Tarot Whisper · Daily Ritual</p>
        </footer>
      </main>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
   关键词星尘 · 散落于主卡四周，各自漂移闪烁
   ─────────────────────────────────────────────────────────────── */

interface ScatteredKeywordsProps {
  keywords: ReadonlyArray<string>;
}

function ScatteredKeywords({ keywords }: ScatteredKeywordsProps) {
  return (
    <div className="anim-stagger pointer-events-none absolute inset-0 z-20">
      {keywords.map((kw, i) => {
        const spot = KEYWORD_SPOTS[i % KEYWORD_SPOTS.length];
        return (
          <span key={`${i}-${kw}`} className={`absolute ${spot.pos}`}>
            <span
              className="anim-drift flex items-center gap-2"
              style={{ animationDelay: spot.driftDelay }}
            >
              <span
                aria-hidden
                className="anim-twinkle text-[10px] text-gold-dim"
                style={{ animationDelay: spot.twinkleDelay }}
              >
                {spot.symbol}
              </span>
              <span className="cn-label text-bone-faint">{kw}</span>
            </span>
          </span>
        );
      })}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
   十四日星轨 · 横向时间线：点即一日，悬停浮现牌名
   ─────────────────────────────────────────────────────────────── */

interface HistoryTimelineProps {
  /** 按时间正序排列的每日牌 */
  draws: DailyDraw[];
  activeDateKey: string;
  todayKey: string | null;
  onSelect: (draw: DailyDraw) => void;
}

function HistoryTimeline({ draws, activeDateKey, todayKey, onSelect }: HistoryTimelineProps) {
  return (
    <div className="relative">
      {/* 贯穿的星轨线 */}
      <div
        aria-hidden
        className="absolute left-1 right-1 top-2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-[var(--gold-faint)] to-transparent"
      />

      <ol className="relative flex items-start justify-between">
        {draws.map((draw) => {
          const date = parseDateKey(draw.dateKey);
          if (!date) return null;
          const isActive = draw.dateKey === activeDateKey;
          const isThisToday = draw.dateKey === todayKey;
          const noted = !!getDailyNote(draw.dateKey);

          const dotTone = isActive
            ? draw.isReversed
              ? 'h-3 w-3 border border-[var(--gold)] bg-[var(--gold-faint)] shadow-[0_0_14px_var(--gold-glow)]'
              : 'h-3 w-3 bg-[var(--gold)] shadow-[0_0_14px_var(--gold-glow)]'
            : draw.isReversed
              ? 'h-2 w-2 border border-[var(--mist-faint)] bg-transparent group-hover:border-[var(--mist)]'
              : 'h-2 w-2 bg-[var(--bone-whisper)] group-hover:bg-[var(--bone-dim)]';

          return (
            <li key={draw.dateKey} className="flex justify-center">
              <button
                type="button"
                onClick={() => onSelect(draw)}
                aria-current={isActive ? 'date' : undefined}
                aria-label={`${formatShortDate(date)} · ${draw.card.nameCn}${draw.isReversed ? ' · 逆位' : ''}${noted ? ' · 有札记' : ''}`}
                className="group relative flex flex-col items-center px-0.5"
              >
                {/* 悬停浮签 */}
                <span
                  className="cn-hint hairline-gold pointer-events-none absolute bottom-full z-30 mb-2.5 translate-y-1 whitespace-nowrap bg-[var(--ink-veil)] px-3 py-1.5 text-bone-dim opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100"
                  style={{ transitionTimingFunction: 'var(--ease-veil)' }}
                >
                  {formatShortDate(date)} · {draw.card.nameCn}
                  {draw.isReversed && <span className="text-mist"> 逆</span>}
                  {noted && <span className="text-gold-dim"> ◆</span>}
                </span>

                {/* 星点 */}
                <span className="relative flex h-4 w-4 items-center justify-center">
                  {isActive && (
                    <span
                      aria-hidden
                      className="anim-glow-pulse absolute inset-0 rounded-full border border-[var(--gold-dim)]"
                    />
                  )}
                  <span
                    className={`rounded-full transition-all duration-500 ${dotTone}`}
                    style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
                  />
                </span>

                {/* 标签 · 固定高度避免跳动 */}
                <span className="mt-2.5 flex h-9 flex-col items-center gap-0.5">
                  {isActive ? (
                    <>
                      <span className="cn-hint text-gold">{draw.card.nameCn}</span>
                      <span className="font-heading text-[9px] tracking-[0.2em] text-bone-whisper">
                        {formatShortDate(date)}
                      </span>
                    </>
                  ) : isThisToday ? (
                    <span aria-hidden className="anim-twinkle text-[10px] text-gold">✦</span>
                  ) : noted ? (
                    <span aria-hidden className="text-[8px] text-gold-dim">◆</span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
