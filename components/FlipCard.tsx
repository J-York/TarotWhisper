'use client'

import { useState, useEffect } from 'react'
import TarotCard from './TarotCard'

interface FlipCardProps {
  cardId?: string | number
  cardName?: string
  englishName?: string
  isReversed?: boolean
  className?: string
  onFlipComplete?: () => void
  autoFlip?: boolean
  flipDelay?: number
}

export default function FlipCard({
  cardId,
  cardName,
  englishName,
  isReversed = false,
  className = '',
  onFlipComplete,
  autoFlip = false,
  flipDelay = 1000
}: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  // 自动翻牌
  useEffect(() => {
    if (!autoFlip) return
    const timer = setTimeout(() => {
      setIsFlipped(true)
    }, flipDelay)
    return () => clearTimeout(timer)
  }, [autoFlip, flipDelay])

  // 翻牌完成回调（在动画结束后触发）
  useEffect(() => {
    if (!isFlipped) return
    const timer = setTimeout(() => onFlipComplete?.(), 700)
    return () => clearTimeout(timer)
  }, [isFlipped, onFlipComplete])

  const handleClick = () => {
    if (!autoFlip && !isFlipped) {
      setIsFlipped(true)
    }
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ perspective: '1000px', aspectRatio: '200/350' }}
      onClick={handleClick}
    >
      <div
        className={`relative w-full h-full transition-transform duration-700 ${
          !autoFlip && !isFlipped ? 'cursor-pointer hover:scale-105' : ''
        }`}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* 牌背面 */}
        <div
          className="absolute inset-0"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <TarotCard showCardBack={true} className="w-full h-full" />
        </div>

        {/* 牌正面 */}
        <div
          className="absolute inset-0"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <TarotCard
            cardId={cardId}
            cardName={cardName}
            englishName={englishName}
            isReversed={isReversed}
            isRevealed={true}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* 翻牌提示 */}
      {!autoFlip && !isFlipped && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity">
            点击翻牌
          </div>
        </div>
      )}
    </div>
  )
}
