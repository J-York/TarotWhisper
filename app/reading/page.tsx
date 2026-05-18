'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TarotCardComponent } from '@/components/TarotCard';
import { CardDeck } from '@/components/CardDeck';
import { SpreadSelector } from '@/components/SpreadSelector';
import { ApiSettings } from '@/components/ApiSettings';
import { Interpretation } from '@/components/Interpretation';
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
    setQuestion,
    setSpread,
    shuffleAndDraw,
    revealNextCard,
    revealAllCards,
    startInterpretation,
    reset,
    goToPhase,
  } = useReading();

  const { config, saveConfig } = useApiConfig();
  const [showSettings, setShowSettings] = useState(false);

  const handleStartInterpretation = () => {
    startInterpretation(config);
  };

  const steps = [
    { id: 'question', label: '提 问' },
    { id: 'spread', label: '牌 阵' },
    { id: 'shuffle', label: '洗 牌' },
    { id: 'draw', label: '揭 示' },
    { id: 'interpret', label: '洞 察' }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === phase) !== -1
    ? steps.findIndex(s => s.id === phase)
    : (phase === 'reveal' ? 3 : 0);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-8 py-6 bg-gradient-to-b from-[var(--ink-deep)] via-[var(--ink-deep)]/80 to-transparent pointer-events-none">
        <Link
          href="/"
          className="pointer-events-auto flex items-center gap-3 text-bone-faint hover:text-bone transition-colors group"
        >
          <span className="text-sm group-hover:-translate-x-1 transition-transform">←</span>
          <span className="text-xs tracking-mystic uppercase">离 开</span>
        </Link>

        {/* Step indicator */}
        <div className="hidden md:flex items-center gap-6 pointer-events-auto">
          {steps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;

            return (
              <div key={step.id} className="flex items-center gap-3">
                <div className={`
                  w-1.5 h-1.5 rounded-full transition-all duration-500
                  ${isActive ? 'bg-[var(--gold)] scale-150' :
                    isCompleted ? 'bg-[var(--gold-dim)]' : 'bg-[var(--bone-whisper)]'}
                `} />
                <span className={`
                  text-[10px] tracking-mystic uppercase transition-colors duration-300
                  ${isActive ? 'text-gold' :
                    isCompleted ? 'text-bone-faint' : 'text-bone-whisper'}
                `}>
                  {step.label}
                </span>
                {index < steps.length - 1 && (
                  <div className={`h-px w-6 transition-colors duration-500 ${isCompleted ? 'bg-[var(--gold-dim)]' : 'bg-[var(--ink-line)]'}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-6 pointer-events-auto">
          <Link
            href="/history"
            className="text-xs tracking-mystic text-bone-faint hover:text-bone uppercase transition-colors"
          >
            轨 迹
          </Link>
          <button
            onClick={() => setShowSettings(true)}
            className="text-xs tracking-mystic text-bone-faint hover:text-bone uppercase transition-colors"
          >
            配 置
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-28 pb-12 min-h-screen">

        {/* Phase: Question */}
        {phase === 'question' && (
          <div className="w-full max-w-2xl anim-fade-in-up">
            <div className="text-center mb-12">
              <span className="text-gold text-xl">✦</span>
              <h2 className="text-3xl md:text-4xl font-serif text-bone mt-6 mb-4 tracking-wider">
                你 寻 求 什 么
              </h2>
              <div className="rule-h-fade w-24 mx-auto mb-4" />
              <p className="text-bone-faint text-sm font-light tracking-quiet">
                集中精神，让问题在心中浮现
              </p>
            </div>

            <div className="ink-panel-quiet">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="例如：我在事业上应该采取什么行动？"
                className="w-full h-44 px-8 py-7 bg-transparent text-lg text-bone placeholder:text-bone-whisper resize-none focus:outline-none text-center leading-loose font-light"
                spellCheck={false}
              />
            </div>

            <div className="mt-12 flex justify-center">
              <button
                onClick={() => goToPhase('spread')}
                disabled={!question.trim()}
                className="btn-ink-primary px-10 py-3"
              >
                继 续 ✦
              </button>
            </div>
          </div>
        )}

        {/* Phase: Spread Selection */}
        {phase === 'spread' && (
          <div className="w-full flex flex-col items-center anim-fade-in-up">
            <SpreadSelector selectedSpread={spread} onSelect={setSpread} />
            <div className="mt-12 flex gap-8 items-center">
              <button
                onClick={() => goToPhase('question')}
                className="btn-ink-ghost"
              >
                ← 返 回
              </button>
              <button
                onClick={() => goToPhase('shuffle')}
                className="btn-ink-primary px-10 py-3"
              >
                确 认 牌 阵
              </button>
            </div>
          </div>
        )}

        {/* Phase: Shuffle */}
        {phase === 'shuffle' && (
          <div className="flex flex-col items-center anim-fade-in">
            <div className="text-center mb-14">
              <span className="text-gold text-xl">✦</span>
              <h2 className="text-2xl font-serif text-bone mt-6 mb-3 tracking-wider">
                汇 聚 你 的 能 量
              </h2>
              <div className="rule-h-fade w-24 mx-auto mb-4" />
              <p className="text-bone-faint font-light italic text-sm">
                在洗牌时，于心中默念你的问题
              </p>
            </div>
            <CardDeck onShuffle={shuffleAndDraw} />
          </div>
        )}

        {/* Phase: Draw / Reveal */}
        {(phase === 'draw' || phase === 'reveal') && (
          <div className="flex flex-col items-center w-full max-w-6xl anim-fade-in">
            <div className="text-center mb-10">
              <span className="text-gold text-lg">✦</span>
              <h2 className="text-2xl font-serif text-bone mt-4 mb-3 tracking-wider">
                {phase === 'draw' ? '牌 面 已 现' : '命 运 揭 晓'}
              </h2>
              <div className="rule-h-fade w-24 mx-auto mb-3" />
              <div className="text-xs text-bone-faint tracking-mystic uppercase">
                {spread.nameCn}
              </div>
            </div>

            {/* Card table */}
            <div className="relative w-full min-h-[600px] flex items-center justify-center p-12 ink-panel-quiet">
              <div className={`flex flex-wrap justify-center items-center gap-8 md:gap-12 transition-all duration-700 ${spread.id === 'celtic-cross' ? 'max-w-4xl' : ''}`}>
                {drawnCards.map((drawn, index) => (
                  <div key={drawn.position.id} className="flex flex-col items-center gap-4 group relative">
                    <span className="absolute -top-7 text-[10px] text-bone-whisper uppercase tracking-mystic opacity-0 group-hover:opacity-100 transition-opacity">
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
            </div>

            {/* Controls */}
            <div className="mt-12 flex gap-8 items-center">
              {phase === 'draw' && revealedCount < drawnCards.length && (
                <button
                  onClick={revealAllCards}
                  className="btn-ink px-8 py-3"
                >
                  全 部 翻 开
                </button>
              )}

              {phase === 'reveal' && (
                <div className="flex gap-8 items-center anim-fade-in-up">
                  <button
                    onClick={reset}
                    className="btn-ink-ghost"
                  >
                    重 新 开 始
                  </button>
                  <button
                    onClick={handleStartInterpretation}
                    disabled={isInterpreting}
                    className="btn-ink-primary px-10 py-3"
                  >
                    {isInterpreting ? '聆 听 神 谕' : '请 求 神 谕 ✦'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Phase: Interpretation */}
        {phase === 'interpret' && (
          <div className="flex flex-col items-center gap-10 w-full max-w-5xl anim-fade-in">
            <div className="flex flex-wrap justify-center gap-4 opacity-70 hover:opacity-100 transition-opacity">
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
            />

            <div className="flex gap-8 items-center pb-12">
              {!isInterpreting && (
                <>
                  <button
                    onClick={handleStartInterpretation}
                    className="btn-ink px-8 py-3"
                  >
                    重 新 解 读
                  </button>
                  <button
                    onClick={reset}
                    className="btn-ink-primary px-10 py-3"
                  >
                    新 的 占 卜 ✦
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
