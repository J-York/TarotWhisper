'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import tarotCardsData from '../../data/tarot-cards.json'
import spreadsData from '../../data/spreads.json'
import FanDeck from '../../components/FanDeck'
import FlyingCard from '../../components/FlyingCard'
import FlipCard from '../../components/FlipCard'

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

interface FlyingCardData {
  card: TarotCard
  isReversed: boolean
  positionId: number
  startPosition: { x: number; y: number }
  endPosition: { x: number; y: number }
}

export default function DrawPage() {
  const [question, setQuestion] = useState('')
  const [spread, setSpread] = useState<Spread | null>(null)
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([])
  const [shuffledDeck, setShuffledDeck] = useState<TarotCard[]>([])
  const [selectedCardIndices, setSelectedCardIndices] = useState<number[]>([])
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0)
  const [flyingCard, setFlyingCard] = useState<FlyingCardData | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const positionRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const router = useRouter()

  useEffect(() => {
    // 从 sessionStorage 获取问题和牌阵
    const savedQuestion = sessionStorage.getItem('tarot_question')
    const savedSpreadId = sessionStorage.getItem('tarot_spread')

    if (!savedQuestion || !savedSpreadId) {
      router.push('/')
      return
    }

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

      // 洗牌 - Fisher-Yates 算法
      const shuffled = [...cards]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      setShuffledDeck(shuffled)
    }, 0)
  }, [router])

  // 获取位置元素的中心坐标
  const getPositionCenter = useCallback((positionId: number) => {
    const element = positionRefs.current.get(positionId)
    if (element) {
      const rect = element.getBoundingClientRect()
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      }
    }
    return { x: window.innerWidth / 2, y: 200 }
  }, [])

  // 处理从扇形牌堆选牌
  const handleCardSelect = useCallback((cardIndex: number) => {
    if (!spread || isAnimating || currentPositionIndex >= spread.cardCount) return

    setIsAnimating(true)
    setSelectedCardIndices(prev => [...prev, cardIndex])

    const card = shuffledDeck[cardIndex]
    const isReversed = Math.random() < 0.5
    const currentPosition = spread.positions[currentPositionIndex]

    // 计算起始位置（扇形牌堆的大致中心）
    const startPosition = {
      x: window.innerWidth / 2,
      y: window.innerHeight - 200
    }

    // 计算目标位置
    const endPosition = getPositionCenter(currentPosition.id)

    // 设置飞行中的牌
    setFlyingCard({
      card,
      isReversed,
      positionId: currentPosition.id,
      startPosition,
      endPosition
    })
  }, [spread, isAnimating, currentPositionIndex, shuffledDeck, getPositionCenter])

  // 飞行动画完成后的处理
  const handleFlyingComplete = useCallback(() => {
    if (!flyingCard || !spread) return

    const position = spread.positions.find(p => p.id === flyingCard.positionId)!
    
    const drawnCard: DrawnCard = {
      card: flyingCard.card,
      isReversed: flyingCard.isReversed,
      position
    }

    setDrawnCards(prev => [...prev, drawnCard])
    setCurrentPositionIndex(prev => prev + 1)
    setFlyingCard(null)
    setIsAnimating(false)
  }, [flyingCard, spread])

  // 获取指定位置的已抽牌
  const getCardAtPosition = (positionId: number): DrawnCard | null => {
    return drawnCards.find(card => card.position.id === positionId) || null
  }

  const handleAnalyze = () => {
    sessionStorage.setItem('tarot_drawn_cards', JSON.stringify(drawnCards))
    router.push('/analysis')
  }

  // 渲染牌阵位置
  const renderPosition = (position: { id: number; name: string; description: string }, className: string = '') => {
    const drawnCard = getCardAtPosition(position.id)
    const isNextPosition = currentPositionIndex < (spread?.cardCount || 0) && 
                          spread?.positions[currentPositionIndex]?.id === position.id

    return (
      <div
        key={position.id}
        className={`group relative flex flex-col items-center pt-14 ${className}`}
      >
        {/* Position Label */}
        <div className="absolute top-0 left-1/2 z-10 -translate-x-1/2">
          <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(124,58,237,0.3)] backdrop-blur whitespace-nowrap transition-all ${
            isNextPosition 
              ? 'border-primary bg-primary/30 text-white animate-pulse' 
              : 'border-primary/30 bg-black/60 text-primary-foreground'
          }`}>
            <span className="text-[10px]">✦</span>
            <span>{position.name}</span>
            {isNextPosition && <span className="ml-1">← 下一张</span>}
          </div>
        </div>

        {/* Card Slot - 固定尺寸避免抖动 */}
        <div
          ref={(el) => {
            if (el) positionRefs.current.set(position.id, el)
          }}
          className={`relative flex w-32 items-center justify-center rounded-xl border ${
            isNextPosition
              ? 'border-primary border-2 bg-primary/20 shadow-[0_0_40px_rgba(124,58,237,0.5)] animate-pulse-glow'
              : drawnCard
              ? 'border-white/20 bg-black/20'
              : 'border-dashed border-white/10 bg-black/20'
          }`}
          style={{
            aspectRatio: '2/3.5',
            // 只对边框和阴影应用过渡，不对所有属性
            transition: 'border-color 0.3s, box-shadow 0.3s, background-color 0.3s'
          }}
        >
          {/* 内容容器 - 绝对定位避免布局变化 */}
          <div className="absolute inset-0">
            {drawnCard ? (
              <FlipCard
                cardId={drawnCard.card.id}
                cardName=""
                englishName=""
                isReversed={drawnCard.isReversed}
                autoFlip={true}
                flipDelay={100}
                className="w-full h-full"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-sm z-10 px-2">
                {isNextPosition ? (
                  <span className="text-primary font-bold">等待选牌...</span>
                ) : (
                  <span className="text-slate-500 text-xs uppercase tracking-widest">
                    {currentPositionIndex > spread!.positions.findIndex(p => p.id === position.id) ? '已跳过' : '等待中'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Card Name (After Drawn) */}
        {drawnCard && (
          <div className="mt-4 w-36 text-center animate-fade-in">
            <div className="text-sm font-bold text-white mb-0.5">
              {drawnCard.card.name}
            </div>
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
              {drawnCard.card.englishName}
            </div>
            {drawnCard.isReversed && (
              <div className="text-[10px] text-amber-400 mt-1">逆位</div>
            )}
          </div>
        )}
      </div>
    )
  }

  // 渲染牌阵布局
  const renderSpreadLayout = () => {
    if (!spread) return null

    switch (spread.id) {
      case 'single_card':
        return (
          <div className="flex justify-center items-center min-h-[300px]">
            {renderPosition(spread.positions[0])}
          </div>
        )

      case 'three_card_time':
      case 'three_card_mind_body_spirit':
        return (
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 min-h-[300px]">
            {spread.positions.map((position, index) =>
              renderPosition(position, index === 1 ? 'md:-mt-12' : '')
            )}
          </div>
        )

      case 'celtic_cross':
        return (
          <div className="min-h-[700px] max-w-6xl mx-auto px-4 py-8 overflow-x-auto">
            <div className="min-w-[700px] grid grid-cols-7 gap-6 max-w-5xl mx-auto">
              {/* Center Cross & Surrounding */}
              <div className="col-span-5 grid grid-cols-5 grid-rows-3 gap-4">
                {/* Top: Possible Future */}
                <div className="col-start-3 row-start-1 flex justify-center">
                  {renderPosition(spread.positions[4])}
                </div>

                {/* Middle Row */}
                <div className="col-start-2 row-start-2 flex justify-center items-center">
                  {renderPosition(spread.positions[3])}
                </div>
                <div className="col-start-3 row-start-2 flex justify-center items-center relative">
                  <div className="absolute z-0">
                    {renderPosition(spread.positions[0])}
                  </div>
                  <div className="absolute z-10 rotate-90 opacity-90">
                    {renderPosition(spread.positions[1])}
                  </div>
                </div>
                <div className="col-start-4 row-start-2 flex justify-center items-center">
                  {renderPosition(spread.positions[5])}
                </div>

                {/* Bottom: Foundation */}
                <div className="col-start-3 row-start-3 flex justify-center">
                  {renderPosition(spread.positions[2])}
                </div>
              </div>

              {/* Right Staff */}
              <div className="col-span-2 flex flex-col justify-center gap-4 pl-6 border-l border-white/5">
                {renderPosition(spread.positions[9])}
                {renderPosition(spread.positions[8])}
                {renderPosition(spread.positions[7])}
                {renderPosition(spread.positions[6])}
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="flex flex-wrap justify-center gap-8 min-h-[300px]">
            {spread.positions.map((position) => renderPosition(position))}
          </div>
        )
    }
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

      <div className="relative z-10 container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 space-y-4 animate-slide-up">
            <div className="inline-flex items-center justify-center gap-3">
              <span className="text-3xl animate-float">🔮</span>
              <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight">
                <span className="text-gradient-mystic">神秘抽牌</span>
              </h1>
            </div>

            <div className="glass-panel rounded-2xl px-6 py-4 max-w-2xl mx-auto">
              <div className="space-y-2">
                <p className="text-slate-200 text-sm">
                  <span className="text-primary font-bold uppercase tracking-wider text-xs mr-2">问题</span>
                  {question}
                </p>
                <div className="h-px w-full bg-white/5" />
                <p className="text-slate-300 text-xs">
                  <span className="text-secondary font-bold uppercase tracking-wider text-xs mr-2">牌阵</span>
                  {spread.name} <span className="text-slate-500">({spread.cardCount} 张牌)</span>
                </p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-6 max-w-xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex justify-between items-end mb-2 px-2">
              <span className="text-primary/80 text-xs font-bold uppercase tracking-widest">进度</span>
              <div className="text-white text-lg font-bold font-display">
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

          {/* 牌阵布局 */}
          <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {renderSpreadLayout()}
          </div>

          {/* 扇形牌堆 - 只在未完成时显示 */}
          {!isComplete && (
            <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="text-center mb-4">
                <div className="inline-flex flex-col gap-1 rounded-2xl border border-primary/30 bg-primary/10 px-8 py-4 shadow-[0_0_40px_rgba(124,58,237,0.2)] backdrop-blur-sm">
                  <div className="text-lg font-bold text-white font-display">
                    {isAnimating ? '✨ 牌正在飞向牌阵...' : '💫 从下方牌堆中选择一张牌'}
                  </div>
                  <p className="text-primary-foreground/80 text-xs">
                    将鼠标悬停在牌上感应，点击选择你心仪的那一张
                  </p>
                </div>
              </div>
              
              <FanDeck
                totalCards={shuffledDeck.length}
                selectedCards={selectedCardIndices}
                onCardSelect={handleCardSelect}
                disabled={isAnimating}
                className="mt-4"
              />
            </div>
          )}

          {/* Complete Button */}
          {isComplete && (
            <div className="text-center animate-float mt-8">
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
          <div className="text-center mt-12">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 rounded-full glass-button text-sm font-medium text-slate-400 hover:text-white flex items-center gap-2 mx-auto"
            >
              <span>←</span> 返回首页
            </button>
          </div>
        </div>
      </div>

      {/* Flying Card Animation */}
      {flyingCard && (
        <FlyingCard
          cardId={flyingCard.card.id}
          cardName={flyingCard.card.name}
          englishName={flyingCard.card.englishName}
          isReversed={flyingCard.isReversed}
          startPosition={flyingCard.startPosition}
          endPosition={flyingCard.endPosition}
          onAnimationComplete={handleFlyingComplete}
        />
      )}
    </div>
  )
}
