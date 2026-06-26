'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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

  // 解读区 ref · 进入 interpret 阶段时自动滚动至此
  const interpretSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase !== 'interpret') return;
    const el = interpretSectionRef.current;
    if (!el) return;

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 让牙台动画先展开，随后再滚，避免跳动感
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

  const steps = [
    { id: 'question',  label: '提 问' },
    { id: 'spread',    label: '牌 阵' },
    { id: 'shuffle',   label: '洗 牌' },
    { id: 'draw',      label: '揭 示' },
    { id: 'interpret', label: '洞 察' },
  ];

  const currentStepIndex =
    steps.findIndex((s) => s.id === phase) !== -1
      ? steps.findIndex((s) => s.id === phase)
      : phase === 'reveal'
      ? 3
      : 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ═══════════════════════════════════════
          Header · 步骤指示
         ═══════════════════════════════════════ */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-5 md:px-10 py-7 bg-gradient-to-b from-[var(--ink-deep)] via-[var(--ink-deep)]/85 to-transparent pointer-events-none">
        <Link
          href="/"
          className="pointer-events-auto flex items-center gap-4 text-bone-dim hover:text-bone transition-colors duration-500 group"
          style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
        >
          <span className="text-base group-hover:-translate-x-1 transition-transform duration-700"
                style={{ transitionTimingFunction: 'var(--ease-veil)' }}>
            ←
          </span>
          <span className="cn-nav">离 开</span>
        </Link>

        {/* Step indicator · 缓慢的金线 */}
        <div className="hidden md:flex items-center gap-7 pointer-events-auto">
          {steps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;

            return (
              <div key={step.id} className="flex items-center gap-3">
                <div
                  className={`
                    w-1.5 h-1.5 rounded-full transition-all duration-700
                    ${isActive
                      ? 'bg-[var(--gold)] scale-150 shadow-[0_0_10px_var(--gold-glow)]'
                      : isCompleted
                      ? 'bg-[var(--gold-dim)]'
                      : 'bg-[var(--bone-whisper)]'}
                  `}
                  style={{ transitionTimingFunction: 'var(--ease-veil)' }}
                />
                <span
                  className={`
                    cn-label transition-colors duration-700
                    ${isActive
                      ? 'text-gold'
                      : isCompleted
                      ? 'text-bone-dim'
                      : 'text-bone-whisper'}
                  `}
                  style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
                >
                  {step.label}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={`h-px w-8 transition-colors duration-700 ${
                      isCompleted
                        ? 'bg-[var(--gold-dim)]'
                        : 'bg-[var(--ink-line)]'
                    }`}
                    style={{ transitionTimingFunction: 'var(--ease-veil)' }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-5 md:gap-9 pointer-events-auto">
          <Link
            href="/library"
            className="cn-nav text-bone-dim hover:text-bone transition-colors duration-500"
            style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
          >
            牌 典
          </Link>
          <Link
            href="/history"
            className="cn-nav text-bone-dim hover:text-bone transition-colors duration-500"
            style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
          >
            轨 迹
          </Link>
          <button
            onClick={() => setShowSettings(true)}
            className="cn-nav text-bone-dim hover:text-bone transition-colors duration-500"
            style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
          >
            配 置
          </button>
        </div>
      </header>

      {/* ═════════════════════════════════════
          移动端步骤指示 · 底部隐性 · 仅 < md 可见
         ═════════════════════════════════════ */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 pointer-events-none"
        aria-hidden
      >
        {/* 上边缘 · 金色进度细线 */}
        <div className="relative h-px bg-[var(--ink-line)]">
          <div
            className="absolute top-0 left-0 h-px bg-gradient-to-r from-[var(--gold-dim)] to-[var(--gold)] shadow-[0_0_8px_var(--gold-glow)] transition-all duration-1000"
            style={{
              width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
              transitionTimingFunction: 'var(--ease-veil)',
            }}
          />
        </div>

        {/* 下部 · 圆点 + 当前阶段名 */}
        <div className="bg-gradient-to-t from-[var(--ink-deep)] via-[var(--ink-deep)]/92 to-transparent pt-5 pb-5 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2.5">
            {steps.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;
              return (
                <span
                  key={step.id}
                  className={`
                    w-1 h-1 rounded-full transition-all duration-700
                    ${isActive
                      ? 'bg-[var(--gold)] scale-[1.6] shadow-[0_0_8px_var(--gold-glow)]'
                      : isCompleted
                      ? 'bg-[var(--gold-dim)]'
                      : 'bg-[var(--bone-whisper)]'}
                  `}
                  style={{ transitionTimingFunction: 'var(--ease-veil)' }}
                />
              );
            })}
          </div>
          <span className="cn-hint text-gold-dim">
            {steps[currentStepIndex]?.label}
            <span className="text-bone-whisper ml-3">
              {currentStepIndex + 1} ╱ {steps.length}
            </span>
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          Main · 阶段
         ═══════════════════════════════════════ */}
      <main id="main-content" className="flex-1 flex flex-col items-center justify-center px-6 pt-32 pb-32 md:pb-16 min-h-screen">

        {/* ─── 阶段 1：提问 ─── */}
        {phase === 'question' && (
          <div className="w-full max-w-2xl anim-veil-rise">
            <div className="text-center mb-14">
              <span className="text-gold text-xl anim-drift">✦</span>
              <h2 className="font-display text-3xl md:text-4xl text-bone mt-7 mb-4 tracking-[0.22em] uppercase">
                你 寻 求 什 么
              </h2>
              <div className="rule-h-gold w-20 mx-auto mb-6" />
              <p className="font-body italic-soft text-bone-faint text-base">
                集中精神，让问题在心中浮现
              </p>
            </div>

            <div className="ink-panel-quiet">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="例如：我在事业上应该采取什么行动？"
                className="input-ink-bare w-full h-48 px-10 py-8 text-xl text-bone resize-none text-center leading-loose font-body"
                spellCheck={false}
              />
            </div>

            <div className="mt-14 flex justify-center">
              <button
                onClick={() => goToPhase('spread')}
                disabled={!question.trim()}
                className="btn-ink-primary px-12 py-3.5 inline-flex items-center gap-3"
              >
                <span>继 续</span>
                <span className="text-xs">✦</span>
              </button>
            </div>
          </div>
        )}

        {/* ─── 阶段 2：牌阵选择 ─── */}
        {phase === 'spread' && (
          <div className="w-full flex flex-col items-center anim-veil-rise">
            <SpreadSelector selectedSpread={spread} onSelect={setSpread} />
            <div className="mt-14 flex gap-10 items-center">
              <button onClick={() => goToPhase('question')} className="btn-ink-ghost">
                ← 返 回
              </button>
              <button
                onClick={() => goToPhase('shuffle')}
                className="btn-ink-primary px-12 py-3.5"
              >
                确 认 牌 阵
              </button>
            </div>
          </div>
        )}

        {/* ─── 阶段 3：洗牌 ─── */}
        {phase === 'shuffle' && (
          <div className="flex flex-col items-center anim-veil-rise">
            <div className="text-center mb-16">
              <span className="text-gold text-xl anim-drift">✦</span>
              <h2 className="font-display text-2xl md:text-3xl text-bone mt-6 mb-4 tracking-[0.22em] uppercase">
                汇 聚 你 的 能 量
              </h2>
              <div className="rule-h-gold w-20 mx-auto mb-5" />
              <p className="font-body italic-soft text-bone-faint text-base">
                在洗牌时，于心中默念你的问题
              </p>
            </div>
            <CardDeck onShuffle={shuffleAndDraw} />
          </div>
        )}

        {/* ─── 阶段 4 / 5：揭示 ─── */}
        {(phase === 'draw' || phase === 'reveal') && (
          <div className="flex flex-col items-center w-full max-w-6xl anim-veil-rise">
            <div className="text-center mb-12">
              <span className="text-gold text-lg anim-drift">✦</span>
              <h2 className="font-display text-2xl md:text-3xl text-bone mt-5 mb-4 tracking-[0.22em] uppercase">
                {phase === 'draw' ? '牌 面 已 现' : '命 运 揭 晓'}
              </h2>
              <div className="rule-h-gold w-20 mx-auto mb-4" />
              <div className="cn-label text-bone-dim">
                {spread.nameCn}
              </div>
              {phase === 'draw' && revealedCount < drawnCards.length && (
                <p className="font-body italic-soft text-bone-whisper text-sm mt-4">
                  逐张轻触，让命运缓缓显形
                </p>
              )}
            </div>

            {/* 牌桌 · 极细边框 · 留白驱动 */}
            <div className="relative w-full min-h-[600px] flex items-center justify-center px-2 py-10 md:p-12 ink-panel-quiet">
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
                className="flex flex-wrap justify-center items-center gap-x-10 gap-y-16 md:gap-x-14 transition-all duration-1000"
                style={{ transitionTimingFunction: 'var(--ease-veil)' }}
              >
                {drawnCards.map((drawn, index) => (
                  <div key={drawn.position.id} className="flex flex-col items-center gap-4">
                    {/* 阵位名 · 常驻显示（触屏无 hover，这是唯一的阵位信息来源） */}
                    <span className="cn-label text-bone-faint">
                      {drawn.position.nameCn}
                    </span>
                    <TarotCardComponent
                      card={drawn.card}
                      isReversed={drawn.isReversed}
                      isRevealed={index < revealedCount}
                      onClick={() => {
                        if (index === revealedCount) {
                          revealNextCard();
                        }
                      }}
                      size="md"
                    />
                  </div>
                ))}
              </div>
              )}
            </div>

            {/* 控制按钮 */}
            <div className="mt-14 flex gap-10 items-center">
              {phase === 'draw' && revealedCount < drawnCards.length && (
                <button onClick={revealAllCards} className="btn-ink px-10 py-3.5">
                  全 部 翻 开
                </button>
              )}

              {phase === 'reveal' && (
                <div className="flex gap-10 items-center anim-veil-rise">
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
        )}

        {/* ─── 阶段 6：解读 ─── */}
        {phase === 'interpret' && (
          <div
            ref={interpretSectionRef}
            className="flex flex-col items-center gap-12 w-full max-w-5xl anim-veil-rise scroll-mt-28 md:scroll-mt-32"
          >
            <div className="flex flex-wrap justify-center gap-5 opacity-70 hover:opacity-100 transition-opacity duration-700"
                 style={{ transitionTimingFunction: 'var(--ease-veil)' }}>
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

            <Interpretation
              content={interpretation}
              isLoading={isInterpreting}
              error={error}
              notice={notice}
              retry={retryInfo}
              cardTerms={baseCardTerms}
              positionTerms={basePositionTerms}
            />

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

                <div className="w-full max-w-4xl">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-gold-dim text-base">◆</span>
                    <span className="cn-label text-gold-dim">继 续 追 问</span>
                    <div className="rule-h-fade flex-1" />
                  </div>
                  <div className="ink-panel-quiet">
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

            <div className="flex gap-10 items-center pb-12">
              {!isInterpreting && !hasInFlightFollowUp && (
                <>
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
                </>
              )}
            </div>
          </div>
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
