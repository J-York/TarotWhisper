'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import spreadsData from '../../data/spreads.json'
import DrawnCardsDisplay from '../../components/DrawnCardsDisplay'
import AnalysisDisplay from '../../components/AnalysisDisplay'
import { useTarotAnalysis } from '@/hooks/useTarotAnalysis'
import type { DrawnCard, Spread } from '@/types/tarot'

export default function AnalysisPage() {
  const [question, setQuestion] = useState('')
  const [spread, setSpread] = useState<Spread | null>(null)
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([])
  const router = useRouter()

  const {
    analysis,
    isLoading,
    error,
    chatHistory,
    hasCustomApiConfig,
    customApiBaseUrl,
    customApiKey,
    selectedModel,
    analysisContainerRef,
    setSelectedModel,
    performAnalysis
  } = useTarotAnalysis()

  useEffect(() => {
    // 从 sessionStorage 获取数据
    const savedQuestion = sessionStorage.getItem('tarot_question')
    const savedSpreadId = sessionStorage.getItem('tarot_spread')
    const savedDrawnCards = sessionStorage.getItem('tarot_drawn_cards')

    if (!savedQuestion || !savedSpreadId || !savedDrawnCards) {
      router.push('/')
      return
    }

    setQuestion(savedQuestion)

    // 找到对应的牌阵
    const selectedSpread = spreadsData.spreads.find(s => s.id === savedSpreadId)
    if (!selectedSpread) {
      router.push('/')
      return
    }
    setSpread(selectedSpread)

    try {
      const cards = JSON.parse(savedDrawnCards) as DrawnCard[]
      setDrawnCards(cards)

      // 自动开始分析
      performAnalysis(savedQuestion, selectedSpread, cards)
    } catch (parseError) {
      console.error('解析抽牌数据失败:', parseError)
      router.push('/')
    }
  }, [router, performAnalysis])

  const handleReinterpret = useCallback(async (model: string): Promise<boolean> => {
    if (!spread || drawnCards.length === 0) return false
    return performAnalysis(question, spread, drawnCards, model)
  }, [question, spread, drawnCards, performAnalysis])

  const handleNewReading = () => {
    // 清除 sessionStorage
    sessionStorage.removeItem('tarot_question')
    sessionStorage.removeItem('tarot_spread')
    sessionStorage.removeItem('tarot_drawn_cards')
    router.push('/')
  }

  if (!spread || drawnCards.length === 0) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-background flex items-center justify-center">
        <div className="stars-bg" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(139,92,246,0.28),transparent_60%)]" />
        <div className="relative text-center space-y-4 animate-pulse">
          <div className="relative mx-auto h-20 w-20">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary border-r-secondary"></div>
          </div>
          <div className="text-xl font-semibold text-white font-display">
            正在汇聚塔罗能量...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30">
      <div className="stars-bg" />

      {/* Ambient Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[128px] animate-pulse-glow" />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10 space-y-6 animate-slide-up">
            <div className="inline-flex items-center justify-center gap-3">
              <span className="text-4xl animate-float">🔮</span>
              <h1 className="text-4xl md:text-5xl font-bold font-display tracking-tight">
                <span className="text-gradient-mystic">塔罗解读</span>
              </h1>
            </div>

            <div className="glass-panel rounded-2xl px-8 py-6 max-w-3xl mx-auto">
              <div className="space-y-3">
                <p className="text-slate-200 text-base">
                  <span className="text-primary font-bold uppercase tracking-wider text-xs mr-2">Question</span>
                  {question}
                </p>
                <div className="h-px w-full bg-white/5" />
                <p className="text-slate-300 text-sm">
                  <span className="text-secondary font-bold uppercase tracking-wider text-xs mr-2">Spread</span>
                  {spread.name}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Cards Display */}
            <DrawnCardsDisplay drawnCards={drawnCards} />

            {/* Analysis Display */}
            <AnalysisDisplay
              analysis={analysis}
              isLoading={isLoading}
              error={error}
              chatHistory={chatHistory}
              hasCustomApiConfig={hasCustomApiConfig}
              customApiBaseUrl={customApiBaseUrl}
              customApiKey={customApiKey}
              selectedModel={selectedModel}
              analysisContainerRef={analysisContainerRef}
              onModelChange={setSelectedModel}
              onReinterpret={handleReinterpret}
            />
          </div>

          {/* Action Buttons */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <button
              onClick={handleNewReading}
              className="group relative px-8 py-3 rounded-full bg-gradient-to-r from-primary via-purple-500 to-secondary text-white font-bold shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] hover:scale-105 transition-all duration-300"
            >
              <span className="flex items-center gap-2">
                <span className="text-xl">🔮</span> 新的占卜
              </span>
            </button>

            <button
              onClick={() => router.push('/history')}
              className="px-8 py-3 rounded-full glass-button text-slate-200 hover:text-white font-medium flex items-center gap-2"
            >
              <span className="text-xl">📜</span> 占卜历史
            </button>

            <button
              onClick={() => router.push('/settings')}
              className="px-8 py-3 rounded-full glass-button text-slate-200 hover:text-white font-medium flex items-center gap-2"
            >
              <span className="text-xl">⚙️</span> 设置
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
