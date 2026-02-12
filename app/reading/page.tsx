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
    // 直接开始解读，服务器端会自动使用内置配置（如果用户未配置）
    startInterpretation(config);
  };

  const steps = [
    { id: 'question', label: '提问' },
    { id: 'spread', label: '牌阵' },
    { id: 'shuffle', label: '洗牌' },
    { id: 'draw', label: '揭示' },
    { id: 'interpret', label: '洞察' }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === phase) !== -1 
    ? steps.findIndex(s => s.id === phase)
    : (phase === 'reveal' ? 3 : 0);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1A0B2E] via-[#0F0518] to-[#0F0518] bg-fixed">
      {/* 顶部导航 - Sanctuary Header */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-8 py-6 bg-gradient-to-b from-[#0F0518] to-transparent pointer-events-none">
        <Link
          href="/"
          className="pointer-events-auto flex items-center gap-3 text-purple-300/60 hover:text-amber-200 transition-colors group"
        >
          <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
          <span className="text-base tracking-[0.2em] font-light uppercase">离开圣殿</span>
        </Link>

        {/* Constellation Progress Bar */}
        <div className="hidden md:flex items-center gap-8 pointer-events-auto">
          {steps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;

            return (
              <div key={step.id} className="flex items-center gap-3">
                <div className={`
                  w-2.5 h-2.5 rounded-full transition-all duration-500 relative
                  ${isActive ? 'bg-amber-400 scale-150 shadow-[0_0_10px_rgba(251,191,36,0.8)]' :
                    isCompleted ? 'bg-amber-500/50' : 'bg-purple-900/50'}
                `}>
                  {isActive && <div className="absolute inset-0 rounded-full animate-ping bg-amber-400/50" />}
                </div>
                <span className={`
                  text-sm tracking-widest uppercase transition-colors duration-300
                  ${isActive ? 'text-amber-100 font-medium' :
                    isCompleted ? 'text-purple-300/50' : 'text-purple-900/30'}
                `}>
                  {step.label}
                </span>
                {index < steps.length - 1 && (
                  <div className={`h-[1px] w-8 transition-colors duration-500 ${isCompleted ? 'bg-amber-500/20' : 'bg-purple-900/20'}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/history"
            className="pointer-events-auto p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-md"
            title="历史记录"
          >
            <svg className="w-6 h-6 text-purple-300 hover:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </Link>

          <button
            onClick={() => setShowSettings(true)}
            className="pointer-events-auto p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-md"
            title="API 设置"
          >
            <svg className="w-6 h-6 text-purple-300 hover:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 pt-24 min-h-screen">
        
        {/* Phase: Question */}
        {phase === 'question' && (
          <div className="w-full max-w-2xl animate-in fade-in zoom-in duration-500">
            <div className="text-center mb-10">
              <h2 className="text-4xl md:text-5xl font-serif text-amber-100 mb-4 drop-shadow-lg">
                你寻求什么？
              </h2>
              <p className="text-purple-200/60 text-lg font-light">
                集中精神，让问题在心中浮现。
              </p>
            </div>
            
            <div className="glass-panel p-1 rounded-2xl relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-purple-600 rounded-2xl opacity-20 group-focus-within:opacity-50 transition duration-500 blur-sm"></div>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="例如：我在事业上应该采取什么行动？"
                className="w-full h-48 px-6 py-6 bg-[#0F0518]/80 rounded-xl text-xl text-amber-50 placeholder-purple-500/30 resize-none focus:outline-none relative z-10 text-center leading-relaxed"
                spellCheck={false}
              />
            </div>
            
            <div className="mt-10 flex justify-center">
              <button
                onClick={() => goToPhase('spread')}
                disabled={!question.trim()}
                className="btn-mystic px-12 py-4 rounded-full text-lg tracking-widest uppercase font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                继续
              </button>
            </div>
          </div>
        )}

        {/* Phase: Spread Selection */}
        {phase === 'spread' && (
          <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-500">
            <SpreadSelector selectedSpread={spread} onSelect={setSpread} />
            <div className="mt-12 flex gap-6">
              <button
                onClick={() => goToPhase('question')}
                className="px-8 py-3 text-purple-300/60 hover:text-purple-100 transition-colors uppercase tracking-widest text-base"
              >
                返回
              </button>
              <button
                onClick={() => goToPhase('shuffle')}
                className="btn-mystic px-10 py-3 rounded-full text-base tracking-widest uppercase font-semibold"
              >
                确认牌阵
              </button>
            </div>
          </div>
        )}

        {/* Phase: Shuffle */}
        {phase === 'shuffle' && (
          <div className="flex flex-col items-center animate-in fade-in duration-700">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-serif text-amber-100 mb-3 tracking-wide">
                汇聚你的能量
              </h2>
              <p className="text-purple-200/60 font-light italic text-lg">
                在洗牌时，于心中默念你的问题...
              </p>
            </div>
            <div className="scale-125 transform transition-transform duration-500 hover:scale-130">
              <CardDeck onShuffle={shuffleAndDraw} />
            </div>
          </div>
        )}

        {/* Phase: Draw / Reveal */}
        {(phase === 'draw' || phase === 'reveal') && (
          <div className="flex flex-col items-center w-full max-w-6xl animate-in fade-in duration-500">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-serif text-amber-100 mb-2">
                {phase === 'draw' ? '牌面已现' : '命运揭晓'}
              </h2>
              <div className="text-base text-purple-300/40 uppercase tracking-[0.2em]">
                {spread.nameCn} • {question}
              </div>
            </div>

            {/* Table / Card Area */}
            <div className="relative w-full min-h-[600px] flex items-center justify-center p-12 rounded-[3rem] border border-white/5 bg-gradient-to-b from-[#1A0B2E]/50 to-transparent backdrop-blur-sm shadow-2xl">
               {/* Decorative Table Elements */}
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.05),transparent_70%)] pointer-events-none" />
               
               <div className={`flex flex-wrap justify-center items-center gap-8 md:gap-12 transition-all duration-700 ${spread.id === 'celtic-cross' ? 'max-w-4xl' : ''}`}>
                {drawnCards.map((drawn, index) => (
                  <div key={drawn.position.id} className="flex flex-col items-center gap-4 group">
                    <span className="text-sm text-purple-300/40 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8">
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
            <div className="mt-12 flex gap-6 items-center">
              {phase === 'draw' && revealedCount < drawnCards.length && (
                <button
                  onClick={revealAllCards}
                  className="px-8 py-3 border border-purple-500/30 text-purple-200 rounded-full hover:bg-purple-800/30 transition-all uppercase text-base tracking-widest hover:border-amber-500/50 hover:text-amber-200"
                >
                  全部翻开
                </button>
              )}
              
              {phase === 'reveal' && (
                <div className="flex gap-4 animate-in slide-in-from-bottom-4 duration-500">
                   <button
                    onClick={reset}
                    className="px-8 py-3 text-purple-300/60 hover:text-white transition-colors uppercase tracking-widest text-base"
                  >
                    重新开始
                  </button>
                  <button
                    onClick={handleStartInterpretation}
                    disabled={isInterpreting}
                    className="btn-mystic px-10 py-3 rounded-full text-base tracking-widest uppercase font-semibold disabled:opacity-50"
                  >
                    {isInterpreting ? '正在聆听神谕...' : '请求神谕'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Phase: Interpretation */}
        {phase === 'interpret' && (
          <div className="flex flex-col items-center gap-10 w-full max-w-5xl animate-in fade-in duration-700">
             {/* Mini Spread Review */}
            <div className="flex flex-wrap justify-center gap-4 opacity-80 hover:opacity-100 transition-opacity">
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

            <div className="flex gap-6 pb-20">
               {!isInterpreting && (
                <>
                  <button
                    onClick={handleStartInterpretation}
                    className="px-8 py-3 border border-amber-500/30 text-amber-400 rounded-full hover:bg-amber-500/10 transition-colors uppercase tracking-widest text-base"
                  >
                    重新解读
                  </button>
                  <button
                    onClick={reset}
                    className="btn-mystic px-10 py-3 rounded-full text-base tracking-widest uppercase font-semibold"
                  >
                    开始新的占卜
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
