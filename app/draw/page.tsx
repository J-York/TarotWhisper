'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import tarotCardsData from '../../data/tarot-cards.json'
import spreadsData from '../../data/spreads.json'
import SpreadLayout from '../../components/SpreadLayout'

interface TarotCard {
  id: string | number
  name: string
  englishName: string
  suit: string
  uprightKeywords: string[]
  reversedKeywords: string[]
}

interface DrawnCard {
  card: TarotCard
  isReversed: boolean
  position: {
    id: number
    name: string
    description: string
  }
}

interface Spread {
  id: string
  name: string
  englishName: string
  description: string
  cardCount: number
  positions: Array<{
    id: number
    name: string
    description: string
  }>
}

export default function DrawPage() {
  const [question, setQuestion] = useState('')
  const [spread, setSpread] = useState<Spread | null>(null)
  const [, setAllCards] = useState<TarotCard[]>([])
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)
  const [shuffledDeck, setShuffledDeck] = useState<TarotCard[]>([])
  const [drawingPositionId, setDrawingPositionId] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    // 从 sessionStorage 获取问题和牌阵
    const savedQuestion = sessionStorage.getItem('tarot_question')
    const savedSpreadId = sessionStorage.getItem('tarot_spread')

    if (!savedQuestion || !savedSpreadId) {
      router.push('/')
      return
    }

    // 使用 setTimeout 避免同步 setState
    setTimeout(() => {
      setQuestion(savedQuestion)

      // 找到对应的牌阵
      const selectedSpread = spreadsData.spreads.find(s => s.id === savedSpreadId)
      if (!selectedSpread) {
        router.push('/')
        return
      }
      setSpread(selectedSpread)

      // 准备所有塔罗牌数据
      const cards: TarotCard[] = []

      // 添加大阿尔卡那
      tarotCardsData.majorArcana.forEach(card => {
        cards.push({
          id: card.id,
          name: card.name,
          englishName: card.englishName,
          suit: card.suit,
          uprightKeywords: card.uprightKeywords,
          reversedKeywords: card.reversedKeywords
        })
      })

      // 添加小阿尔卡那
      Object.entries(tarotCardsData.minorArcana).forEach(([, suitCards]) => {
        suitCards.forEach(card => {
          cards.push({
            id: card.id,
            name: card.name,
            englishName: card.englishName,
            suit: card.suit,
            uprightKeywords: card.uprightKeywords,
            reversedKeywords: card.reversedKeywords
          })
        })
      })

      setAllCards(cards)

      // 洗牌 - Fisher-Yates 算法
      const shuffled = [...cards]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      setShuffledDeck(shuffled)
    }, 0)
  }, [router])

  const drawCardAtPosition = (positionId: number) => {
    if (!spread || isDrawing || currentCardIndex >= spread.cardCount) return

    // 检查该位置是否已经抽过牌
    const alreadyDrawn = drawnCards.some(card => card.position.id === positionId)
    if (alreadyDrawn) return

    setIsDrawing(true)
    setDrawingPositionId(positionId)

    // 模拟抽牌动画延迟
    setTimeout(() => {
      const card = shuffledDeck[currentCardIndex]
      const isReversed = Math.random() < 0.5 // 50% 概率逆位
      const position = spread.positions.find(p => p.id === positionId)!

      const drawnCard: DrawnCard = {
        card,
        isReversed,
        position
      }

      setDrawnCards(prev => [...prev, drawnCard])
      setCurrentCardIndex(prev => prev + 1)
      setIsDrawing(false)
      setDrawingPositionId(null)
    }, 1000)
  }

  // 获取指定位置的已抽牌
  const getCardAtPosition = (positionId: number): DrawnCard | null => {
    return drawnCards.find(card => card.position.id === positionId) || null
  }

  // 检查位置是否可以抽牌
  const canDrawAtPosition = (positionId: number): boolean => {
    return !getCardAtPosition(positionId) && !isDrawing
  }

  const handleAnalyze = () => {
    // 保存抽牌结果到 sessionStorage
    sessionStorage.setItem('tarot_drawn_cards', JSON.stringify(drawnCards))
    router.push('/analysis')
  }

  if (!spread) {
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
            正在准备牌阵...
          </div>
        </div>
      </div>
    )
  }

  const isComplete = drawnCards.length === spread.cardCount

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30">
      <div className="stars-bg" />

      {/* Ambient Background Effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[128px] animate-pulse-glow" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[128px] animate-pulse-glow delay-1000" />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10 space-y-6 animate-slide-up">
            <div className="inline-flex items-center justify-center gap-3">
              <span className="text-4xl animate-float">🔮</span>
              <h1 className="text-4xl md:text-5xl font-bold font-display tracking-tight">
                <span className="text-gradient-mystic">神秘抽牌</span>
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
                  {spread.name} <span className="text-slate-500">({spread.cardCount} cards)</span>
                </p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-12 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex justify-between items-end mb-3 px-2">
              <span className="text-primary/80 text-xs font-bold uppercase tracking-widest">Progress</span>
              <div className="text-white text-xl font-bold font-display">
                {drawnCards.length} <span className="text-slate-500 text-sm font-normal">/ {spread.cardCount}</span>
              </div>
            </div>
            <div className="relative w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="relative h-full rounded-full bg-gradient-to-r from-primary via-purple-500 to-secondary shadow-[0_0_20px_rgba(124,58,237,0.5)] transition-all duration-700 ease-out"
                style={{ width: `${(drawnCards.length / spread.cardCount) * 100}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent animate-shimmer" />
              </div>
            </div>
          </div>

          {/* 抽牌指引 */}
          {!isComplete && (
            <div className="text-center mb-12 animate-fade-in">
              <div className="inline-flex flex-col gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-10 py-6 shadow-[0_0_40px_rgba(124,58,237,0.2)] backdrop-blur-sm">
                <div className="text-xl font-bold text-white font-display">
                  {isDrawing ? '✨ 正在抽牌...' : '💫 点击下方位置进行抽牌'}
                </div>
                <p className="text-primary-foreground/80 text-sm">
                  请按照牌阵布局，点击相应位置抽取塔罗牌
                </p>
              </div>
            </div>
          )}

          {/* 牌阵布局 */}
          <div className="mb-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <SpreadLayout
              spreadId={spread.id}
              positions={spread.positions}
              drawnCards={drawnCards}
              onPositionClick={drawCardAtPosition}
              canDrawAtPosition={canDrawAtPosition}
              isDrawing={isDrawing}
              drawingPositionId={drawingPositionId}
            />
          </div>

          {/* Complete Button */}
          {isComplete && (
            <div className="text-center animate-float">
              <button
                onClick={handleAnalyze}
                className="group relative px-12 py-4 rounded-full bg-gradient-to-r from-primary via-purple-500 to-secondary text-white font-bold text-lg tracking-wide shadow-[0_0_30px_rgba(124,58,237,0.5)] hover:shadow-[0_0_50px_rgba(124,58,237,0.7)] hover:scale-105 transition-all duration-300"
              >
                <span className="relative z-10 flex items-center gap-2">
                  ✨ 开始分析 <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
                <div className="absolute inset-0 rounded-full bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          )}

          {/* Back Button */}
          <div className="text-center mt-16">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 rounded-full glass-button text-sm font-medium text-slate-400 hover:text-white flex items-center gap-2 mx-auto"
            >
              <span>←</span> 返回首页
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
