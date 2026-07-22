'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { TarotCardComponent } from '@/components/TarotCard';
import { CardDeck } from '@/components/CardDeck';
import { SpreadSelector } from '@/components/SpreadSelector';
import { ApiSettings } from '@/components/ApiSettings';
import { Interpretation } from '@/components/Interpretation';
import { FollowUpPanel } from '@/components/FollowUpPanel';
import { CelticCrossLayout } from '@/components/CelticCrossLayout';
import { useReading } from '@/hooks/useReading';
import { useApiConfig } from '@/hooks/useApiConfig';
import type { DrawnCard } from '@/lib/tarot/types';

/* ═══════════════════════════════════════════════════════════════
   Ceremonial Acts · 仪式分幕
   每一次占卜是一场五幕剧 — 每一幕占满整个视野，
   幕次以巨型罗马数字水印沉在深渊里，代替一切进度指示。
   ═══════════════════════════════════════════════════════════════ */

interface ActMeta {
  numeral: string;
  ordinal: string;
  name: string;
}

const ACTS: Record<string, ActMeta> = {
  question:  { numeral: 'I',     ordinal: 'ACT Ⅰ',   name: '提 问' },
  spread:    { numeral: 'II',    ordinal: 'ACT Ⅱ',   name: '择 阵' },
  shuffle:   { numeral: 'III',   ordinal: 'ACT Ⅲ',   name: '洗 礼' },
  draw:      { numeral: 'IV',    ordinal: 'ACT Ⅳ',   name: '揭 示' },
  reveal:    { numeral: 'IV',    ordinal: 'ACT Ⅳ',   name: '揭 示' },
  interpret: { numeral: 'V',     ordinal: 'ACT Ⅴ',   name: '神 谕' },
};

/* ─── 洗牌 particle burst · 确定性伪随机（避免客户端水合漂移） ─── */

interface BurstParticle {
  glyph: string;
  dx: number;
  dy: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
}

const BURST_GLYPHS = ['✦', '✧', '⊹', '◇', '·'];

function makeBurst(count: number, seed: number): BurstParticle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + ((seed * 37 + i * 13) % 10) / 18;
    const dist = 130 + ((seed * 53 + i * 97) % 150);
    return {
      glyph: BURST_GLYPHS[i % BURST_GLYPHS.length],
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist * 0.82,
      size: 10 + ((seed * 29 + i * 41) % 15),
      delay: ((seed * 17 + i * 23) % 10) * 26,
      duration: 950 + ((seed * 11 + i * 31) % 10) * 55,
      color: i % 4 === 0 ? 'var(--bone)' : 'var(--gold-warm)',
    };
  });
}

/* ─── 揭示幕 · 聚光单卡 ─── */

interface SpotlightCardProps {
  drawn: DrawnCard;
  index: number;
  isRevealed: boolean;
  isNext: boolean;
  onReveal: () => void;
}

function SpotlightCard({ drawn, index, isRevealed, isNext, onReveal }: SpotlightCardProps) {
  return (
    <div
      className="relative flex flex-col items-center anim-veil-rise"
      style={{ animationDelay: `${Math.min(index * 110, 900)}ms` }}
    >
      {/* 聚光锥 · 自帷幕之上垂落 */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-52 h-[135%] transition-opacity duration-[1400ms]"
        style={{
          opacity: isRevealed ? 1 : 0,
          transitionTimingFunction: 'var(--ease-veil)',
          background:
            'linear-gradient(to bottom, transparent 0%, var(--gold-faint) 32%, rgba(201,169,97,0.05) 72%, transparent 100%)',
          clipPath: 'polygon(41% 0, 59% 0, 100% 100%, 0 100%)',
        }}
      />
      {/* 地面光晕 */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-12 transition-opacity duration-[1400ms]"
        style={{
          opacity: isRevealed ? 1 : 0,
          transitionTimingFunction: 'var(--ease-veil)',
          background:
            'radial-gradient(ellipse 62% 52% at 50% 56%, var(--gold-glow) 0%, rgba(201,169,97,0.06) 46%, transparent 72%)',
        }}
      />

      {/* 阵位名 · 常驻（触屏无 hover，这是唯一的阵位信息来源） */}
      <span className="relative cn-label text-bone-faint mb-5">
        {drawn.position.nameCn}
      </span>

      <div className="relative">
        <TarotCardComponent
          card={drawn.card}
          isReversed={drawn.isReversed}
          isRevealed={isRevealed}
          onClick={onReveal}
          size="md"
        />

        {/* 下一张待翻 · 呼吸金框示意 */}
        {isNext && (
          <div
            aria-hidden
            className="absolute -inset-3 pointer-events-none anim-glow-pulse"
            style={{ boxShadow: '0 0 0 0.5px var(--gold-faint)' }}
          />
        )}

        {/* 幕次序号 · 碑刻体 */}
        <span
          aria-hidden
          className={`absolute -top-7 -left-8 font-display text-2xl select-none transition-colors duration-1000 ${
            isRevealed ? 'text-gold-dim' : 'text-bone-whisper'
          }`}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      {/* 牌名 · 揭示后以碑刻体浮现 */}
      <span
        className={`relative mt-5 font-display text-[11px] tracking-[0.3em] uppercase transition-all duration-1000 ${
          isRevealed
            ? 'text-gold opacity-100 translate-y-0'
            : 'text-bone-whisper opacity-0 translate-y-2'
        }`}
        style={{ transitionTimingFunction: 'var(--ease-veil)' }}
      >
        {drawn.card.name}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Page
   ═══════════════════════════════════════════════════════════════ */

export default function ReadingPage() {
  const {
    phase,
    question,
    spread,
    drawnCards,
    revealedCount,
    interpretation,
    isInterpreting,
    error,
    notice,
    retryInfo,
    followUpRetries,
    followUps,
    hasInFlightFollowUp,
    setQuestion,
    setSpread,
    shuffleAndDraw,
    revealNextCard,
    revealAllCards,
    startInterpretation,
    askFollowUp,
    revealNextFollowUpCard,
    revealAllFollowUpCards,
    retryFollowUp,
    reset,
    goToPhase,
  } = useReading();

  const { config, saveConfig } = useApiConfig();
  const [showSettings, setShowSettings] = useState(false);
  const [followUpDraft, setFollowUpDraft] = useState('');

  const act = ACTS[phase] ?? ACTS.question;

  // ── 提问幕 · 自动聚焦 & 回车推进 ──
  const questionRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (phase !== 'question') return;
    const t = window.setTimeout(() => questionRef.current?.focus({ preventScroll: true }), 450);
    return () => window.clearTimeout(t);
  }, [phase]);

  // ── 洗牌幕 · particle burst ──
  const [burst, setBurst] = useState<{ key: number; particles: BurstParticle[] } | null>(null);
  const burstTimer = useRef<number>(0);

  // 一次洗牌只引爆一次：burst 非空时封锁；洗牌幕结束后整节卸载，天然复位
  const igniteBurst = (): void => {
    if (phase !== 'shuffle' || burst !== null) return;
    const key = Date.now();
    setBurst({ key, particles: makeBurst(28, key % 9973) });
    burstTimer.current = window.setTimeout(() => setBurst(null), 2200);
  };

  useEffect(() => () => window.clearTimeout(burstTimer.current), []);

  // ── 解读区 ref · 进入 interpret 阶段时自动滚动至此 ──
  const interpretSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase !== 'interpret') return;
    const el = interpretSectionRef.current;
    if (!el) return;

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 让揭幕动画先展开，随后再滚，避免跳动感
    const t = window.setTimeout(() => {
      el.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }, 80);
    return () => window.clearTimeout(t);
  }, [phase]);

  // 跨“牌名 / 阵位名”提取，用于解读区金色关键词高亮
  const baseCardTerms = useMemo<string[]>(
    () => drawnCards.flatMap((d) => [d.card.nameCn, d.card.name]),
    [drawnCards]
  );
  const basePositionTerms = useMemo<string[]>(
    () => spread.positions.map((p) => p.nameCn),
    [spread]
  );

  const handleStartInterpretation = (): void => {
    startInterpretation(config);
  };

  const handleAskFollowUp = (): void => {
    const text = followUpDraft.trim();
    if (!text || hasInFlightFollowUp) return;
    askFollowUp(text, config);
    setFollowUpDraft('');
  };

  const advanceFromQuestion = (): void => {
    if (question.trim()) goToPhase('spread');
  };

  const handleQuestionKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && question.trim()) {
      e.preventDefault();
      goToPhase('spread');
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* ═══════════════════════════════════════
          幕次水印 · 巨型罗马数字沉在深渊里
         ═══════════════════════════════════════ */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
        <div
          key={act.numeral}
          className="absolute inset-0 flex items-center justify-center anim-fade-in"
          style={{ animationDuration: '1800ms' }}
        >
          <span
            className="font-display font-bold select-none text-bone translate-x-[6vw] -translate-y-[4vh]"
            style={{
              fontSize: 'clamp(18rem, 48vw, 44rem)',
              lineHeight: 1,
              opacity: 0.045,
            }}
          >
            {act.numeral}
          </span>
          {/* 命运之轮 · 随幕缓转 */}
          <div
            className="arc-glow w-[72vmin] h-[72vmin] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ animationDuration: '140s' }}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════
          离场 · 仅左上一隅
         ═══════════════════════════════════════ */}
      <header className="fixed top-0 left-0 z-50 px-6 py-7 md:px-10">
        <Link
          href="/"
          className="group inline-flex items-center gap-4 text-bone-dim hover:text-bone transition-colors duration-500"
          style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
        >
          <span
            className="text-base group-hover:-translate-x-1.5 transition-transform duration-700"
            style={{ transitionTimingFunction: 'var(--ease-veil)' }}
          >
            ←
          </span>
          <span className="cn-nav">离 开</span>
        </Link>
      </header>

      {/* 幕次字幕 · 左下隅 */}
      <div
        className="fixed bottom-7 left-6 md:left-10 z-40 pointer-events-none select-none hidden sm:flex items-center gap-4"
        aria-hidden
      >
        <span className="font-display text-xs tracking-[0.4em] text-gold-dim">
          {act.ordinal}
        </span>
        <span className="rule-h-gold w-10" />
        <span className="cn-label text-bone-faint">{act.name}</span>
      </div>

      {/* 配置 · 右下隅的一粒耳语（仪式中不设导航，仅此一处） */}
      <button
        onClick={() => setShowSettings(true)}
        className="fixed bottom-7 right-6 md:right-10 z-40 cn-hint text-bone-whisper hover:text-gold-dim transition-colors duration-500"
        style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
        aria-label="API 配置"
      >
        ⚙ 配 置
      </button>

      {/* ═══════════════════════════════════════
          五幕 · 每一幕占满整个视野
         ═══════════════════════════════════════ */}
      <main id="main-content" className="relative z-10">

        {/* ─── 幕 Ⅰ · 提问 ─── */}
        {phase === 'question' && (
          <section className="act-fullscreen overflow-hidden">
            {/* 巨型水印 · 你寻求什么 */}
            <div
              aria-hidden
              className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
            >
              <span
                className="font-heading text-bone whitespace-nowrap anim-drift"
                style={{
                  fontSize: 'clamp(4.5rem, 17vw, 15rem)',
                  letterSpacing: '0.12em',
                  opacity: 0.05,
                }}
              >
                你寻求什么
              </span>
            </div>

            <div className="relative w-full max-w-4xl flex flex-col items-center anim-veil-rise">
              <span className="cn-label text-gold-dim mb-10 anim-whisper">
                第 一 幕 · 凝 视 内 心
              </span>

              {/* 无界之问 · 只有光与文字 */}
              <textarea
                ref={questionRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleQuestionKeyDown}
                placeholder="在此写下你的问题…"
                rows={4}
                spellCheck={false}
                aria-label="你的问题"
                className="input-ink-bare w-full resize-none text-center font-body text-3xl md:text-4xl leading-[1.9] text-bone placeholder:text-bone-whisper/70"
                style={{ caretColor: 'var(--gold)' }}
              />

              {/* 呼吸基线 · 落笔之处 */}
              <div className="relative mt-4 w-64 md:w-96">
                <div className="rule-h-gold w-full" />
                <span
                  aria-hidden
                  className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 bg-[var(--gold)] anim-twinkle"
                  style={{ boxShadow: '0 0 12px var(--gold-glow)' }}
                />
              </div>

              <p className="font-body italic-soft text-bone-faint text-sm mt-10">
                集中精神，让问题在心中浮现 — 写毕按 Enter，或轻触下方
              </p>

              <button
                onClick={advanceFromQuestion}
                disabled={!question.trim()}
                className="btn-ink-ghost mt-8 text-base"
              >
                带 着 问 题 前 行 →
              </button>
            </div>
          </section>
        )}

        {/* ─── 幕 Ⅱ · 择阵 · 悬浮于不同景深的面板 ─── */}
        {phase === 'spread' && (
          <section className="act-fullscreen overflow-hidden">
            {/* 远景层 · 沉在后方 */}
            <div
              aria-hidden
              className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
            >
              <span
                className="font-heading text-bone whitespace-nowrap"
                style={{ fontSize: 'clamp(4rem, 14vw, 12rem)', letterSpacing: '0.2em', opacity: 0.04 }}
              >
                命运的形状
              </span>
            </div>

            {/* 3D 舞台 */}
            <div className="relative w-full perspective-1000">
              <div className="relative w-full max-w-5xl mx-auto transform-style-3d">
                {/* 深处漂浮的仪式残片 · translateZ 负值 */}
                <div
                  aria-hidden
                  className="hidden lg:block absolute -left-24 top-10 w-44 h-64 ink-panel-quiet"
                  style={{ transform: 'translateZ(-140px) rotateY(16deg) rotateX(4deg)', opacity: 0.55 }}
                >
                  <div className="absolute inset-3 hairline flex items-center justify-center">
                    <span className="text-gold-faint text-3xl anim-drift">☾</span>
                  </div>
                </div>
                <div
                  aria-hidden
                  className="hidden lg:block absolute -right-20 bottom-6 w-36 h-52 ink-panel-quiet"
                  style={{ transform: 'translateZ(-90px) rotateY(-14deg) rotateX(3deg)', opacity: 0.45 }}
                >
                  <div className="absolute inset-3 hairline flex items-center justify-center">
                    <span className="text-gold-faint text-2xl anim-drift" style={{ animationDelay: '3s' }}>✧</span>
                  </div>
                </div>
                <span
                  aria-hidden
                  className="scatter-symbol text-3xl -top-10 right-[12%] anim-drift hidden md:block"
                  style={{ transform: 'translateZ(-60px)' }}
                >
                  ◇
                </span>
                <span
                  aria-hidden
                  className="scatter-symbol text-xl bottom-0 left-[8%] anim-whisper hidden md:block"
                  style={{ transform: 'translateZ(-40px)' }}
                >
                  ⊹
                </span>

                {/* 主面板 · 浮在最前 */}
                <div
                  className="relative ink-panel-ritual float-card px-4 py-12 md:p-14 anim-curtain"
                  style={{ transform: 'translateZ(0px)' }}
                >
                  <SpreadSelector selectedSpread={spread} onSelect={setSpread} />

                  <div className="mt-12 flex flex-col sm:flex-row gap-6 sm:gap-12 items-center justify-center">
                    <button onClick={() => goToPhase('question')} className="btn-ink-ghost">
                      ← 返 回 问 题
                    </button>
                    <button
                      onClick={() => goToPhase('shuffle')}
                      className="btn-ink-primary px-12 py-3.5 inline-flex items-center gap-3"
                    >
                      <span>就 此 落 阵</span>
                      <span className="text-xs">✦</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ─── 幕 Ⅲ · 洗礼 · 牌堆居于舞台中央 ─── */}
        {phase === 'shuffle' && (
          <section className="act-fullscreen overflow-hidden">
            {/* 命运之轮 · 双重光弧 */}
            <div
              aria-hidden
              className="arc-glow w-[80vmin] h-[80vmin] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ animationDuration: '90s' }}
            />
            <div
              aria-hidden
              className="arc-glow w-[56vmin] h-[56vmin] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ animationDirection: 'reverse', animationDuration: '60s' }}
            />
            <span aria-hidden className="scatter-symbol text-2xl top-[16%] left-[14%] anim-drift">✧</span>
            <span aria-hidden className="scatter-symbol text-3xl bottom-[18%] right-[12%] anim-drift" style={{ animationDelay: '2.5s' }}>◇</span>
            <span aria-hidden className="scatter-symbol text-lg top-[30%] right-[24%] anim-whisper">⊹</span>

            <div className="relative flex flex-col items-center anim-veil-rise">
              <span className="cn-label text-gold-dim mb-8 anim-whisper">
                第 三 幕 · 汇 聚 能 量
              </span>
              <h2 className="font-heading text-massive text-bone text-center tracking-[0.14em] mb-6">
                洗 礼 之 时
              </h2>
              <div className="rule-h-gold w-24 mb-8" />

              {/* 你的问题 · 此刻悬在牌堆之上 */}
              <p className="font-body italic-soft text-bone-dim text-base md:text-lg text-center max-w-xl leading-relaxed mb-14 line-clamp-2">
                「{question}」
              </p>

              {/* 牌堆 · 点击即引爆星尘 */}
              <div className="relative" onClickCapture={igniteBurst}>
                {burst && (
                  <BurstLayer key={burst.key} particles={burst.particles} />
                )}
                <CardDeck onShuffle={shuffleAndDraw} />
              </div>

              <p className="font-body italic-soft text-bone-faint text-sm mt-12">
                在洗牌时，于心中默念你的问题
              </p>
            </div>
          </section>
        )}

        {/* ─── 幕 Ⅳ · 揭示 · 每张牌独享一束追光 ─── */}
        {(phase === 'draw' || phase === 'reveal') && (
          <section className="act-fullscreen">
            <div className="w-full max-w-6xl flex flex-col items-center anim-veil-rise">
              <span className="cn-label text-gold-dim mb-6 anim-whisper">
                {phase === 'draw' ? '第 四 幕 · 逐 张 显 形' : '第 四 幕 · 全 牌 已 现'}
              </span>
              <h2 className="font-heading text-massive text-bone text-center tracking-[0.14em] mb-5">
                {phase === 'draw' ? '命 运 显 形' : '牌 面 皆 现'}
              </h2>
              <div className="rule-h-gold w-24 mb-6" />
              <div className="cn-label text-bone-dim">{spread.nameCn}</div>
              {phase === 'draw' && revealedCount < drawnCards.length && (
                <p className="font-body italic-soft text-bone-whisper text-sm mt-5">
                  逐张轻触，让命运缓缓显形
                </p>
              )}

              {/* 牌桌 */}
              <div className="relative w-full mt-12 px-2 py-10 md:p-12">
                {spread.id === 'celtic-cross' ? (
                  <CelticCrossLayout
                    drawnCards={drawnCards}
                    revealedCount={revealedCount}
                    onReveal={(index) => {
                      if (index === revealedCount) revealNextCard();
                    }}
                  />
                ) : (
                  <div
                    className="flex flex-wrap justify-center items-start gap-x-14 gap-y-24 md:gap-x-24 transition-all duration-1000"
                    style={{ transitionTimingFunction: 'var(--ease-veil)' }}
                  >
                    {drawnCards.map((drawn, index) => (
                      <SpotlightCard
                        key={drawn.position.id}
                        drawn={drawn}
                        index={index}
                        isRevealed={index < revealedCount}
                        isNext={phase === 'draw' && index === revealedCount}
                        onReveal={() => {
                          if (index === revealedCount) revealNextCard();
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* 控制 */}
              <div className="mt-14 flex gap-10 items-center">
                {phase === 'draw' && revealedCount < drawnCards.length && (
                  <button onClick={revealAllCards} className="btn-ink px-10 py-3.5">
                    全 部 翻 开
                  </button>
                )}

                {phase === 'reveal' && (
                  <div className="flex flex-col sm:flex-row gap-8 sm:gap-10 items-center anim-veil-rise">
                    <button onClick={reset} className="btn-ink-ghost">
                      重 新 开 始
                    </button>
                    <button
                      onClick={handleStartInterpretation}
                      disabled={isInterpreting}
                      className="btn-ink-primary px-12 py-3.5 inline-flex items-center gap-3"
                    >
                      <span>{isInterpreting ? '聆 听 神 谕' : '请 求 神 谕'}</span>
                      <span className="text-xs">✦</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ─── 幕 Ⅴ · 神谕 · 卷轴徐徐展开 ─── */}
        {phase === 'interpret' && (
          <section className="act-fullscreen items-stretch justify-start pt-28 pb-20">
            <div
              ref={interpretSectionRef}
              className="flex flex-col items-center gap-14 w-full max-w-5xl mx-auto scroll-mt-24 md:scroll-mt-28"
            >
              {/* 幕首 */}
              <div className="text-center anim-veil-rise">
                <span className="cn-label text-gold-dim anim-whisper">第 五 幕 · 聆 听</span>
                <h2 className="font-heading text-massive text-bone tracking-[0.14em] mt-5">
                  神 谕 降 临
                </h2>
                <div className="rule-h-gold w-24 mx-auto mt-6" />
              </div>

              {/* 牌面回顾 · 一排小小的见证者 */}
              <div
                className="flex flex-wrap justify-center gap-5 opacity-70 hover:opacity-100 transition-opacity duration-700"
                style={{ transitionTimingFunction: 'var(--ease-veil)' }}
              >
                {drawnCards.map((drawn) => (
                  <div key={drawn.position.id} className="transform scale-75 origin-top">
                    <TarotCardComponent
                      card={drawn.card}
                      isReversed={drawn.isReversed}
                      isRevealed={true}
                      size="sm"
                    />
                  </div>
                ))}
              </div>

              {/* 卷轴 · 自上而下徐徐展开 */}
              <div className="w-full anim-curtain" style={{ animationDuration: '1600ms' }}>
                {/* 上轴 */}
                <div aria-hidden className="h-2 w-full bg-gradient-to-r from-transparent via-[var(--gold-dim)] to-transparent" />
                <div aria-hidden className="rule-h-gold w-full" />

                <div className="ink-panel-ritual border-y-0 px-6 py-12 md:px-14 md:py-16">
                  <Interpretation
                    content={interpretation}
                    isLoading={isInterpreting}
                    error={error}
                    notice={notice}
                    retry={retryInfo}
                    cardTerms={baseCardTerms}
                    positionTerms={basePositionTerms}
                  />
                </div>

                {/* 下轴 */}
                <div aria-hidden className="rule-h-gold w-full" />
                <div aria-hidden className="h-2 w-full bg-gradient-to-r from-transparent via-[var(--gold-dim)] to-transparent" />
              </div>

              {/* ─── 追问区 ─── */}
              {!isInterpreting && !error && interpretation && (
                <>
                  {followUps.map((fu) => (
                    <FollowUpPanel
                      key={fu.id}
                      followUp={fu}
                      apiConfig={config}
                      baseCardTerms={baseCardTerms}
                      basePositionTerms={basePositionTerms}
                      retry={followUpRetries[fu.id] ?? null}
                      onRevealNext={revealNextFollowUpCard}
                      onRevealAll={revealAllFollowUpCards}
                      onRetry={retryFollowUp}
                    />
                  ))}

                  <div className="w-full max-w-4xl anim-veil-rise">
                    <div className="flex items-center gap-3 mb-5">
                      <span className="text-gold-dim text-base">◆</span>
                      <span className="cn-label text-gold-dim">继 续 追 问</span>
                      <div className="rule-h-fade flex-1" />
                    </div>
                    <div className="chat-bubble-oracle">
                      <textarea
                        value={followUpDraft}
                        onChange={(e) => setFollowUpDraft(e.target.value)}
                        placeholder={
                          hasInFlightFollowUp
                            ? '神谕正在回应，请稍候…'
                            : '若想深入某张牌、追问具体行动，或换个角度，请在此提出'
                        }
                        disabled={hasInFlightFollowUp}
                        className="input-ink-bare w-full h-28 px-7 py-5 text-base text-bone resize-none font-body leading-relaxed"
                        style={{ caretColor: 'var(--gold)' }}
                        spellCheck={false}
                      />
                    </div>
                    <div className="mt-5 flex justify-end">
                      <button
                        onClick={handleAskFollowUp}
                        disabled={hasInFlightFollowUp || !followUpDraft.trim()}
                        className="btn-ink-primary px-10 py-3 inline-flex items-center gap-3"
                      >
                        <span>追 问</span>
                        <span className="text-xs">✦</span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* 终章 */}
              <div className="flex flex-col items-center gap-10 pb-10">
                {!isInterpreting && !hasInFlightFollowUp && (
                  <>
                    <div className="sigil-seal" aria-hidden>
                      <span className="sigil-glyph">✦</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-8 sm:gap-10 items-center">
                      <button
                        onClick={handleStartInterpretation}
                        className="btn-ink px-10 py-3.5"
                      >
                        重 新 解 读
                      </button>
                      <button
                        onClick={reset}
                        className="btn-ink-primary px-12 py-3.5 inline-flex items-center gap-3"
                      >
                        <span>新 的 占 卜</span>
                        <span className="text-xs">✦</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      <ApiSettings
        config={config}
        onSave={saveConfig}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

/* ─── 星尘迸发 · 以 transition 驱动，无需额外 keyframes ─── */

function BurstLayer({ particles }: { particles: BurstParticle[] }) {
  const [ignited, setIgnited] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setIgnited(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      aria-hidden
      className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
    >
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute select-none"
          style={{
            fontSize: `${p.size}px`,
            color: p.color,
            textShadow: '0 0 14px var(--gold-glow)',
            opacity: ignited ? 0 : 0.95,
            transform: ignited
              ? `translate(${p.dx}px, ${p.dy}px) scale(0.35) rotate(${p.dx > 0 ? 40 : -40}deg)`
              : 'translate(0px, 0px) scale(1)',
            transition: `transform ${p.duration}ms var(--ease-veil) ${p.delay}ms, opacity ${p.duration}ms var(--ease-deep) ${p.delay + 120}ms`,
          }}
        >
          {p.glyph}
        </span>
      ))}
    </div>
  );
}
