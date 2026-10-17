'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactElement } from 'react';
import Link from 'next/link';

import { TarotCardComponent } from '@/components/TarotCard';
import { CardDeck } from '@/components/CardDeck';
import { SpreadSelector } from '@/components/SpreadSelector';
import { Interpretation } from '@/components/Interpretation';
import { FollowUpPanel } from '@/components/FollowUpPanel';
import { CelticCrossLayout } from '@/components/CelticCrossLayout';
import { useSettingsDialog } from '@/components/AppShell';
import { useReading, type ReadingPhase } from '@/hooks/useReading';
import { useApiConfig } from '@/hooks/useApiConfig';
import type { DrawnCard } from '@/lib/tarot/types';

/* ─── 步骤映射 · 与 useReading 的阶段一一对应 ─── */

const STEP_INDEX: Record<ReadingPhase, number> = {
  question: 0,
  spread: 1,
  shuffle: 2,
  draw: 3,
  reveal: 3,
  interpret: 4,
};

const STEPS = ['提问', '牌阵', '洗牌', '翻牌', '解读'];

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
    const dist = 120 + ((seed * 53 + i * 97) % 140);
    return {
      glyph: BURST_GLYPHS[i % BURST_GLYPHS.length],
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist * 0.82,
      size: 10 + ((seed * 29 + i * 41) % 14),
      delay: ((seed * 17 + i * 23) % 10) * 26,
      duration: 900 + ((seed * 11 + i * 31) % 10) * 55,
      color: i % 4 === 0 ? 'var(--bone)' : 'var(--gold-warm)',
    };
  });
}

/* ─── 单张抽牌位 · 阵位名常驻，牌名翻后显示 ─── */

interface DrawSlotProps {
  drawn: DrawnCard;
  index: number;
  isRevealed: boolean;
  isNext: boolean;
  onReveal: () => void;
  size?: 'sm' | 'md';
}

function DrawSlot({
  drawn,
  index,
  isRevealed,
  isNext,
  onReveal,
  size = 'md',
}: DrawSlotProps): ReactElement {
  return (
    <div
      className="flex w-full max-w-[190px] flex-col items-center anim-veil-rise"
      style={{ animationDelay: `${Math.min(index * 90, 720)}ms` }}
    >
      <div className="mb-3 flex w-full items-center gap-2">
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-[var(--ink-line-strong)] text-[10px] text-bone-faint">
          {index + 1}
        </span>
        <span className="truncate text-xs tracking-[0.1em] text-bone-faint">{drawn.position.nameCn}</span>
      </div>

      <div className="relative">
        <div className={isNext ? 'rounded-lg shadow-[0_0_0_1px_var(--gold-dim),0_0_28px_-6px_var(--gold-glow)]' : ''}>
          <TarotCardComponent
            card={drawn.card}
            isReversed={drawn.isReversed}
            isRevealed={isRevealed}
            onClick={onReveal}
            size={size}
          />
        </div>
        {isNext && (
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-[var(--gold-faint)] bg-[var(--ink-deep)] px-2 py-0.5 text-[10px] tracking-wider text-gold-warm">
            轻触翻开
          </span>
        )}
      </div>

      <div className="mt-3 flex min-h-10 flex-col items-center text-center">
        <span
          className={`font-heading text-sm tracking-[0.05em] transition-all duration-500 ${
            isRevealed ? 'translate-y-0 text-gold-warm opacity-100' : 'translate-y-1 text-bone-faint opacity-0'
          }`}
        >
          {drawn.card.nameCn}
        </span>
        <span
          className={`mt-0.5 text-[10px] uppercase tracking-[0.16em] transition-all duration-500 ${
            isRevealed ? 'text-bone-faint opacity-100' : 'opacity-0'
          }`}
        >
          {drawn.isReversed ? '逆位 · Reversed' : '正位 · Upright'}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Page
   ═══════════════════════════════════════════════════════════════ */

export default function ReadingPage(): ReactElement {
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
    cancelRequest,
    reset,
    goToPhase,
  } = useReading();

  const { config, isLoaded: configLoaded, canUseApi } = useApiConfig();
  const { openSettings } = useSettingsDialog();
  const needsConfig = configLoaded && !canUseApi;
  const [followUpDraft, setFollowUpDraft] = useState('');

  const stepIndex = STEP_INDEX[phase];
  const questionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (phase !== 'question') return;
    const t = window.setTimeout(() => questionRef.current?.focus({ preventScroll: true }), 300);
    return () => window.clearTimeout(t);
  }, [phase]);

  /* ── 洗牌 burst ── */
  const [burst, setBurst] = useState<{ key: number; particles: BurstParticle[] } | null>(null);
  const burstTimer = useRef<number>(0);

  const igniteBurst = (): void => {
    if (phase !== 'shuffle' || burst !== null) return;
    const key = Date.now();
    setBurst({ key, particles: makeBurst(26, key % 9973) });
    burstTimer.current = window.setTimeout(() => setBurst(null), 2000);
  };

  useEffect(() => () => window.clearTimeout(burstTimer.current), []);

  /* ── 进入解读时滚到结果区 ── */
  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (phase !== 'interpret') return;
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = window.setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(t);
  }, [phase]);

  const baseCardTerms = useMemo<string[]>(
    () => drawnCards.flatMap((d) => [d.card.nameCn, d.card.name]),
    [drawnCards]
  );
  const basePositionTerms = useMemo<string[]>(() => spread.positions.map((p) => p.nameCn), [spread]);

  const handleStartInterpretation = (): void => {
    if (needsConfig) {
      openSettings();
      return;
    }
    startInterpretation(config);
  };

  const handleAskFollowUp = (): void => {
    const text = followUpDraft.trim();
    if (!text || hasInFlightFollowUp) return;
    askFollowUp(text, config);
    setFollowUpDraft('');
  };

  const handleQuestionKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter' && !e.shiftKey && question.trim()) {
      e.preventDefault();
      goToPhase('spread');
    }
  };

  const goBack = (): void => {
    if (phase === 'spread') goToPhase('question');
    else if (phase === 'shuffle') goToPhase('spread');
  };

  return (
    <main id="main-content" className="page-container page-main">
      {/* ─── 流程条 ─── */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 md:mb-10">
        <div className="flex items-center gap-2">
          <Link href="/" className="btn-ink-ghost -ml-2 text-xs">
            ← 首页
          </Link>
          <span className="hidden h-4 w-px bg-[var(--ink-line)] sm:block" />
          <ol className="hidden items-center gap-1 sm:flex" aria-label="占卜进度">
            {STEPS.map((label, i) => (
              <li key={label}>
                <span
                  className={`step-pill ${
                    i < stepIndex ? 'step-pill--done' : i === stepIndex ? 'step-pill--active' : ''
                  }`}
                  aria-current={i === stepIndex ? 'step' : undefined}
                >
                  <span className="text-[10px]">{i < stepIndex ? '✓' : String(i + 1).padStart(2, '0')}</span>
                  {label}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-bone-faint sm:hidden">
            第 {stepIndex + 1} / 5 步 · {STEPS[stepIndex]}
          </span>
          {phase !== 'question' && (
            <button
              type="button"
              onClick={() => {
                cancelRequest();
                reset();
              }}
              className="btn-ink-ghost text-xs"
            >
              重新开始
            </button>
          )}
        </div>
      </div>

      {/* ═══ 步骤 1 · 提问 ═══ */}
      {phase === 'question' && (
        <section className="mx-auto max-w-3xl anim-veil-rise">
          <header className="text-center">
            <p className="eyebrow">Step 01 · Your Question</p>
            <h1 className="page-title mt-4">把问题写下来</h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-bone-faint">
              越具体的问题，越能得到有用的答案。写下此刻最想厘清的那一件事。
            </p>
          </header>

          <div className="surface mt-9 p-5 md:p-7">
            <label htmlFor="reading-question" className="eyebrow">
              你的问题
            </label>
            <textarea
              id="reading-question"
              ref={questionRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleQuestionKeyDown}
              placeholder="例如：我是否应该接受这份新的工作机会？"
              rows={4}
              spellCheck={false}
              className="mt-3 w-full resize-none rounded-lg border border-[var(--ink-line-strong)] bg-[rgba(10,8,18,0.5)] px-4 py-3.5 font-body text-lg leading-relaxed text-bone outline-none transition-colors placeholder:text-bone-whisper focus:border-[var(--gold-dim)]"
            />
            <div className="mt-4 flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
              <span className="text-center text-xs text-bone-faint sm:text-left">
                Enter 继续 · Shift + Enter 换行
              </span>
              <button
                type="button"
                onClick={() => question.trim() && goToPhase('spread')}
                disabled={!question.trim()}
                className="btn-ink-primary h-11 w-full px-6 sm:w-auto"
              >
                选择牌阵 →
              </button>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-center text-xs tracking-wider text-bone-faint">不知道问什么？从这里开始</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {['我最近的事业发展会顺利吗？', '我和 Ta 的关系未来会怎样？', '面对眼前的选择，我该如何决定？'].map(
                (sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => {
                      setQuestion(sample);
                      questionRef.current?.focus();
                    }}
                    className="rounded-full border border-[var(--ink-line)] px-4 py-2 text-sm text-bone-faint transition-colors hover:border-[var(--gold-faint)] hover:text-bone"
                  >
                    {sample}
                  </button>
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══ 步骤 2 · 选择牌阵 ═══ */}
      {phase === 'spread' && (
        <section className="anim-veil-rise">
          <header className="mb-8 text-center">
            <p className="eyebrow">Step 02 · Choose a Spread</p>
            <h1 className="page-title mt-4">选择牌阵</h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-bone-faint">
              牌阵决定了每张牌回答问题的哪一部分。张数越多，画面越完整，解读也越长。
            </p>
          </header>

          <div className="surface mx-auto max-w-5xl p-5 md:p-8">
            <SpreadSelector selectedSpread={spread} onSelect={setSpread} />

            <div className="mt-8 flex flex-col-reverse items-center justify-between gap-4 border-t border-[var(--ink-line)] pt-6 sm:flex-row">
              <button type="button" onClick={goBack} className="btn-ink-ghost text-sm">
                ← 返回修改问题
              </button>
              <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
                <span className="text-xs text-bone-faint">
                  已选「{spread.nameCn}」· {spread.positions.length} 张牌
                </span>
                <button
                  type="button"
                  onClick={() => goToPhase('shuffle')}
                  className="btn-ink-primary h-11 w-full px-6 sm:w-auto"
                >
                  进入洗牌 →
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══ 步骤 3 · 洗牌 ═══ */}
      {phase === 'shuffle' && (
        <section className="mx-auto flex max-w-2xl flex-col items-center anim-veil-rise">
          <p className="eyebrow">Step 03 · Shuffle</p>
          <h1 className="page-title mt-4 text-center">洗牌</h1>
          <p className="mt-3 max-w-md text-center text-sm leading-relaxed text-bone-faint">
            在洗牌时默念你的问题。牌堆停下后，你会依次翻开 {spread.positions.length} 张牌。
          </p>

          <blockquote className="mt-8 w-full rounded-xl border border-[var(--ink-line)] bg-[rgba(20,16,34,0.5)] px-6 py-4 text-center">
            <span className="text-xs tracking-wider text-gold-dim">你的问题</span>
            <p className="mt-2 font-body text-base leading-relaxed text-bone-dim">「{question}」</p>
          </blockquote>

          <div className="relative mt-12" onClickCapture={igniteBurst}>
            {burst && <BurstLayer key={burst.key} particles={burst.particles} />}
            <CardDeck onShuffle={shuffleAndDraw} />
          </div>

          <button type="button" onClick={goBack} className="btn-ink-ghost mt-6 text-sm">
            ← 换一个牌阵
          </button>
        </section>
      )}

      {/* ═══ 步骤 4 · 翻牌 ═══ */}
      {(phase === 'draw' || phase === 'reveal') && (
        <section className="anim-veil-rise">
          <header className="text-center">
            <p className="eyebrow">
              Step 04 · {phase === 'draw' ? `Reveal ${revealedCount} / ${drawnCards.length}` : 'All Cards'}
            </p>
            <h1 className="page-title mt-4">{phase === 'draw' ? '翻开你的牌' : '牌面已全部展开'}</h1>
            <p className="mt-3 text-sm text-bone-faint">
              {spread.nameCn} · {drawnCards.length} 张牌
              {phase === 'draw' ? ' · 轻触发光的牌逐张翻开' : ''}
            </p>
          </header>

          <div className="surface mx-auto mt-8 max-w-5xl px-3 py-8 md:px-8 md:py-10">
            {spread.id === 'celtic-cross' ? (
              <CelticCrossLayout
                drawnCards={drawnCards}
                revealedCount={revealedCount}
                onReveal={(index) => {
                  if (index === revealedCount) revealNextCard();
                }}
              />
            ) : (
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-10 md:gap-x-10">
                {drawnCards.map((drawn, index) => (
                  <DrawSlot
                    key={drawn.position.id}
                    drawn={drawn}
                    index={index}
                    isRevealed={index < revealedCount}
                    isNext={phase === 'draw' && index === revealedCount}
                    onReveal={() => {
                      if (index === revealedCount) revealNextCard();
                    }}
                    size={drawnCards.length > 5 ? 'sm' : 'md'}
                  />
                ))}
              </div>
            )}

            <div className="mt-9 flex flex-col items-center gap-4 border-t border-[var(--ink-line)] pt-6 sm:flex-row sm:justify-between">
              <span className="text-xs text-bone-faint">
                已翻开 {Math.min(revealedCount, drawnCards.length)} / {drawnCards.length} 张
              </span>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {phase === 'draw' && revealedCount < drawnCards.length && (
                  <button type="button" onClick={revealAllCards} className="btn-ink h-11 px-5 text-sm">
                    全部翻开
                  </button>
                )}
                {phase === 'reveal' && (
                  <button
                    type="button"
                    onClick={handleStartInterpretation}
                    disabled={isInterpreting}
                    className="btn-ink-primary h-11 px-6"
                  >
                    <span className="text-gold-pale" aria-hidden>✦</span>
                    请 求 神 谕
                  </button>
                )}
              </div>
            </div>
            {phase === 'reveal' && needsConfig && (
              <p className="mt-4 text-center text-xs text-bone-faint">
                解读需要 API 配置 ·
                <button
                  type="button"
                  onClick={openSettings}
                  className="ml-1 text-gold-warm underline decoration-[var(--gold-faint)] underline-offset-4"
                >
                  现在配置
                </button>
              </p>
            )}
          </div>
        </section>
      )}

      {/* ═══ 步骤 5 · 解读 ═══ */}
      {phase === 'interpret' && (
        <section ref={resultRef} className="scroll-mt-24 anim-veil-rise">
          <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Step 05 · The Oracle</p>
              <h1 className="page-title mt-3">解读</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/history" className="btn-ink-ghost text-sm">
                轨迹
              </Link>
              <button
                type="button"
                onClick={() => {
                  cancelRequest();
                  reset();
                }}
                className="btn-ink h-10 px-4 text-sm"
              >
                新的占卜
              </button>
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
            {/* 左侧 · 本次占卜摘要（sticky） */}
            <aside className="order-2 flex flex-col gap-4 lg:order-1 lg:sticky lg:top-24">
              <div className="surface overflow-hidden">
                <div className="border-b border-[var(--ink-line)] px-5 py-4">
                  <p className="eyebrow">本次占卜</p>
                  <p className="mt-2 font-body text-[15px] leading-relaxed text-bone">「{question}」</p>
                  <p className="mt-2 text-xs text-bone-faint">
                    {spread.nameCn} · {drawnCards.length} 张
                  </p>
                </div>
                <ul className="divide-y divide-[var(--ink-line)]">
                  {drawnCards.map((drawn) => (
                    <li key={drawn.position.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-9 shrink-0">
                        <TarotCardComponent
                          card={drawn.card}
                          isReversed={drawn.isReversed}
                          isRevealed
                          size="sm"
                          enableInteractions={false}
                          className="!h-[60px] !w-9"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] tracking-[0.08em] text-bone-faint">{drawn.position.nameCn}</p>
                        <p className="truncate font-heading text-sm text-bone">
                          {drawn.card.nameCn}
                          {drawn.isReversed && <span className="ml-1.5 text-[10px] text-gold-dim">逆</span>}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {!isInterpreting && (
                <div className="surface-soft px-5 py-4">
                  <p className="text-xs leading-relaxed text-bone-faint">
                    解读与追问会自动保存到「
                    <Link href="/history" className="text-gold-warm hover:underline">
                      轨迹
                    </Link>
                    」，仅保存在本地浏览器。
                  </p>
                </div>
              )}
            </aside>

            {/* 右侧 · 解读正文与追问 */}
            <div className="order-1 flex min-w-0 flex-col gap-6 lg:order-2">
              <Interpretation
                content={interpretation}
                isLoading={isInterpreting}
                error={error}
                notice={notice}
                onOpenSettings={openSettings}
                retry={retryInfo}
                cardTerms={baseCardTerms}
                positionTerms={basePositionTerms}
              />

              {isInterpreting && (
                <div className="flex justify-center">
                  <button type="button" onClick={cancelRequest} className="btn-ink-ghost text-sm">
                    停止生成
                  </button>
                </div>
              )}

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

                  <div className="surface p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="section-title text-[15px]">继续追问</span>
                      <span className="text-xs text-bone-faint">Enter 发送</span>
                    </div>
                    <div className="field-shell">
                      <textarea
                        value={followUpDraft}
                        onChange={(e) => setFollowUpDraft(e.target.value)}
                        placeholder={
                          hasInFlightFollowUp
                            ? '神谕正在回应，请稍候…'
                            : '想深入某张牌、追问具体行动，或换个角度？'
                        }
                        disabled={hasInFlightFollowUp}
                        className="input-ink-bare h-24 w-full resize-none px-4 py-3 text-base leading-relaxed"
                        style={{ caretColor: 'var(--gold)' }}
                        spellCheck={false}
                      />
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={handleAskFollowUp}
                        disabled={hasInFlightFollowUp || !followUpDraft.trim()}
                        className="btn-ink-primary h-10 px-5 text-sm"
                      >
                        追问
                      </button>
                    </div>
                  </div>
                </>
              )}

              {!isInterpreting && !hasInFlightFollowUp && (
                <div className="flex flex-wrap items-center justify-center gap-3 border-t border-[var(--ink-line)] pt-6">
                  <button type="button" onClick={handleStartInterpretation} className="btn-ink h-11 px-5 text-sm">
                    重新解读
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      cancelRequest();
                      reset();
                    }}
                    className="btn-ink-primary h-11 px-6"
                  >
                    新的占卜
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

/* ─── 星尘迸发 ─── */

function BurstLayer({ particles }: { particles: BurstParticle[] }): ReactElement {
  const [ignited, setIgnited] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setIgnited(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/3 z-20 -translate-x-1/2 -translate-y-1/2"
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
