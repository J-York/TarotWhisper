'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import tarotCardsData from '../../data/tarot-cards.json'
import spreadsData from '../../data/spreads.json'
import TarotCard from '../../components/TarotCard'
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

export default function DrawPage() {
  const [question, setQuestion] = useState('')
  const [spread, setSpread] = useState<Spread | null>(null)
  const [, setAllCards] = useState<TarotCard[]>([])
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)
  const [shuffledDeck, setShuffledDeck] = useState<TarotCard[]>([])
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

  const drawCard = () => {
    if (!spread || isDrawing || currentCardIndex >= spread.cardCount) return

    setIsDrawing(true)

    // 模拟抽牌动画延迟
    setTimeout(() => {
      const card = shuffledDeck[currentCardIndex]
      const isReversed = Math.random() < 0.5 // 50% 概率逆位
      const position = spread.positions[currentCardIndex]

      const drawnCard: DrawnCard = {
        card,
        isReversed,
        position
      }

      setDrawnCards(prev => [...prev, drawnCard])
      setCurrentCardIndex(prev => prev + 1)
      setIsDrawing(false)
    }, 1000)
  }

  const handleAnalyze = () => {
    // 保存抽牌结果到 sessionStorage
    sessionStorage.setItem('tarot_drawn_cards', JSON.stringify(drawnCards))
    router.push('/analysis')
  }

  if (!spread) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    )
  }

  const isComplete = drawnCards.length === spread.cardCount

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">🔮 抽牌中</h1>
            <p className="text-gray-300 mb-4">您的问题：{question}</p>
            <p className="text-purple-300">牌阵：{spread.name} ({spread.cardCount} 张牌)</p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-center items-center mb-4">
              <div className="text-white text-lg">
                进度：{drawnCards.length} / {spread.cardCount}
              </div>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(drawnCards.length / spread.cardCount) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Card Deck */}
          {!isComplete && (
            <div className="text-center mb-8">
              <div className="inline-block">
                <TarotCard
                  showCardBack={true}
                  className={`transition-all duration-300 transform hover:scale-105 ${
                    isDrawing ? 'animate-pulse scale-105' : ''
                  }`}
                  onClick={drawCard}
                />
                
                {/* 抽牌提示 */}
                <div className="mt-4 text-white">
                  <div className="text-lg font-medium mb-2">
                    {isDrawing ? '抽牌中...' : '点击抽牌'}
                  </div>
                  {currentCardIndex < spread.cardCount && (
                    <>
                      <p className="text-lg font-medium">
                        请抽取第 {currentCardIndex + 1} 张牌
                      </p>
                      <p className="text-gray-300 text-sm">
                        位置：{spread.positions[currentCardIndex]?.name}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Drawn Cards */}
          {drawnCards.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white text-center mb-6">已抽取的牌</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {drawnCards.map((drawnCard, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
                    <div className="text-center mb-3">
                      <div className="text-purple-300 text-sm font-medium mb-1">
                        位置 {drawnCard.position.id}: {drawnCard.position.name}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {drawnCard.position.description}
                      </div>
                    </div>
                    
                    <div className="flex justify-center mb-4">
                      <FlipCard
                        cardId={drawnCard.card.id}
                        cardName={drawnCard.card.name}
                        englishName={drawnCard.card.englishName}
                        isReversed={drawnCard.isReversed}
                        autoFlip={true}
                        flipDelay={500 + index * 300} // 错开翻牌时间
                        className="w-full max-w-[200px]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complete Button */}
          {isComplete && (
            <div className="text-center">
              <button
                onClick={handleAnalyze}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                ✨ 开始分析
              </button>
            </div>
          )}

          {/* Back Button */}
          <div className="text-center mt-8">
            <button
              onClick={() => router.push('/')}
              className="text-gray-300 hover:text-white transition-colors duration-200 underline"
            >
              ← 返回首页
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
