'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { getCardImage, CARD_BACK_IMAGE } from '../utils/cardImages'

interface FlyingCardProps {
  cardId: string | number
  cardName: string
  englishName: string
  isReversed: boolean
  startPosition: { x: number; y: number }
  endPosition: { x: number; y: number }
  onAnimationComplete: () => void
  delay?: number
}

export default function FlyingCard({
  cardId,
  isReversed,
  startPosition,
  endPosition,
  onAnimationComplete,
  delay = 0
}: FlyingCardProps) {
  const [phase, setPhase] = useState<'waiting' | 'flying' | 'flipping' | 'complete'>('waiting')
  const [position, setPosition] = useState(startPosition)
  const [rotation, setRotation] = useState(0)
  const [scale, setScale] = useState(1)
  const [isFlipped, setIsFlipped] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 延迟开始动画
    const startTimer = setTimeout(() => {
      setPhase('flying')
      
      // 飞行动画
      setPosition(endPosition)
      setRotation(360) // 飞行时旋转一圈
      setScale(1.2) // 飞行时略微放大
      
      // 飞行完成后开始翻牌
      const flyTimer = setTimeout(() => {
        setScale(1)
        setRotation(0)
        setPhase('flipping')
        
        // 翻牌动画
        setTimeout(() => {
          setIsFlipped(true)
          
          // 动画完成
          setTimeout(() => {
            setPhase('complete')
            onAnimationComplete()
          }, 600)
        }, 100)
      }, 800)
      
      return () => clearTimeout(flyTimer)
    }, delay)

    return () => clearTimeout(startTimer)
  }, [delay, endPosition, onAnimationComplete])

  const cardImage = getCardImage(cardId)

  return (
    <div
      ref={cardRef}
      className="fixed pointer-events-none z-[1000]"
      style={{
        left: position.x,
        top: position.y,
        transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
        transition: phase === 'flying' 
          ? 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' 
          : phase === 'flipping'
          ? 'all 0.3s ease-out'
          : 'none',
      }}
    >
      {/* 飞行轨迹光效 */}
      {phase === 'flying' && (
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/30 rounded-full blur-xl animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-secondary/40 rounded-full blur-lg animate-ping" />
        </div>
      )}
      
      {/* 粒子效果 */}
      {phase === 'flying' && (
        <div className="absolute inset-0 -z-10">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-primary rounded-full animate-particle"
              style={{
                left: '50%',
                top: '50%',
                animationDelay: `${i * 0.1}s`,
                transform: `rotate(${i * 45}deg) translateY(-30px)`,
              }}
            />
          ))}
        </div>
      )}

      {/* 3D翻牌容器 */}
      <div
        className="relative w-[120px] h-[210px]"
        style={{
          perspective: '1000px',
        }}
      >
        <div
          className="relative w-full h-full transition-transform duration-600"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* 牌背面 */}
          <div
            className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl"
            style={{
              backfaceVisibility: 'hidden',
            }}
          >
            <Image
              src={CARD_BACK_IMAGE}
              alt="塔罗牌背面"
              fill
              className="object-cover"
              sizes="120px"
            />
            <div className="absolute inset-0 border-2 border-primary/50 rounded-xl" />
            
            {/* 发光边框 */}
            <div className="absolute inset-0 rounded-xl shadow-[0_0_30px_rgba(124,58,237,0.5)]" />
          </div>

          {/* 牌正面 */}
          <div
            className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className={`w-full h-full ${isReversed ? 'rotate-180' : ''}`}>
              <Image
                src={cardImage}
                alt="塔罗牌"
                fill
                className="object-cover"
                sizes="120px"
              />
            </div>
            <div className="absolute inset-0 border-2 border-secondary/50 rounded-xl" />
            
            {/* 揭示时的光效 */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 animate-shimmer" />
          </div>
        </div>
      </div>

      {/* 落地光环效果 */}
      {phase === 'flipping' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-20">
          <div className="w-40 h-40 rounded-full border-2 border-primary/50 animate-ripple" />
          <div className="absolute inset-0 w-40 h-40 rounded-full border-2 border-secondary/30 animate-ripple" style={{ animationDelay: '0.2s' }} />
        </div>
      )}
    </div>
  )
}