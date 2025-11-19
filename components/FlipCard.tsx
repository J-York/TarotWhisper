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
  const [showAnimation, setShowAnimation] = useState(false)

  useEffect(() => {
    if (autoFlip) {
      const timer = setTimeout(() => {
        setShowAnimation(true)
        setTimeout(() => {
          setIsFlipped(true)
          onFlipComplete?.()
        }, 300) // 翻牌动画持续时间的一半
      }, flipDelay)

      return () => clearTimeout(timer)
    }
  }, [autoFlip, flipDelay, onFlipComplete])

  const handleClick = () => {
    if (!autoFlip && !isFlipped) {
      setShowAnimation(true)
      setTimeout(() => {
        setIsFlipped(true)
        onFlipComplete?.()
      }, 300)
    }
  }

  return (
    <div
      className={`group relative ${className}`}
      style={{ perspective: '1000px' }}
      onClick={handleClick}
    >
      <div
        className={`relative w-full h-full transition-all duration-700 ${!autoFlip && !isFlipped ? 'cursor-pointer hover:scale-105' : ''
          }`}
        style={{
          transformStyle: 'preserve-3d',
          transform: showAnimation ? (isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)') : 'rotateY(0deg)'
        }}
      >
        {/* 牌背面 */}
        <div
          className={`absolute inset-0 ${isFlipped ? 'invisible' : 'visible'}`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <TarotCard
            showCardBack={true}
            className="w-full h-full"
          />
        </div>

        {/* 牌正面 */}
        <div
          className={`absolute inset-0 ${isFlipped ? 'visible' : 'invisible'}`}
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
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

      {/* 翻牌提示 - 改进版 */}
      {!autoFlip && !isFlipped && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md border border-primary/30 text-white text-[10px] px-3 py-1.5 rounded-full opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-110 font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(124,58,237,0.4)]">
            Click to Flip
          </div>
        </div>
      )}

      {/* 翻牌时的光效 */}
      {showAnimation && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      )}
    </div>
  )
}
