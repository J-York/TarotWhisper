'use client'

import { useState, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { CARD_BACK_IMAGE } from '../utils/cardImages'

interface FanDeckProps {
  totalCards: number
  selectedCards: number[]
  onCardSelect: (cardIndex: number) => void
  disabled?: boolean
  className?: string
}

export default function FanDeck({
  totalCards,
  selectedCards,
  onCardSelect,
  disabled = false,
  className = ''
}: FanDeckProps) {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [rotationAngle, setRotationAngle] = useState(0) // 整体旋转角度
  
  // 每次旋转的角度
  const ROTATION_STEP = 20
  
  // 计算可用的牌（排除已选中的）
  const availableCards = useMemo(() => {
    return Array.from({ length: totalCards }, (_, i) => i)
      .filter(i => !selectedCards.includes(i))
  }, [totalCards, selectedCards])

  // 扇形参数
  const SPREAD_ANGLE = 160 // 扇形总角度
  const RADIUS = 380 // 扇形半径
  const CARD_WIDTH = 85
  const CARD_HEIGHT = 149

  // 计算每张牌的基础角度（不含旋转偏移）
  const getCardBaseAngle = useCallback((index: number, total: number) => {
    if (total <= 1) return 0
    const startAngle = -SPREAD_ANGLE / 2
    const angleStep = SPREAD_ANGLE / (total - 1)
    return startAngle + (index * angleStep)
  }, [])

  // 计算每张牌的样式
  const getCardStyle = useCallback((index: number, total: number, originalIndex: number) => {
    const baseAngle = getCardBaseAngle(index, total)
    const finalAngle = baseAngle + rotationAngle
    
    // 计算牌的位置（基于圆弧）
    const radians = (finalAngle * Math.PI) / 180
    const x = Math.sin(radians) * RADIUS
    const y = -Math.cos(radians) * RADIUS + RADIUS
    
    const isHovered = hoveredCard === originalIndex
    const hoverLift = isHovered ? -35 : 0
    const hoverScale = isHovered ? 1.15 : 1
    
    // 计算z-index：中间的牌在上面，悬停的牌最上面
    const centerDistance = Math.abs(finalAngle)
    const baseZIndex = Math.round(50 - centerDistance / 2)
    
    return {
      transform: `
        translateX(${x}px) 
        translateY(${y + hoverLift}px) 
        rotate(${finalAngle}deg)
        scale(${hoverScale})
      `,
      zIndex: isHovered ? 200 : baseZIndex,
    }
  }, [getCardBaseAngle, rotationAngle, hoveredCard])

  const handleCardClick = (originalIndex: number) => {
    if (disabled) return
    onCardSelect(originalIndex)
  }

  const handleMouseEnter = (originalIndex: number) => {
    if (!disabled) {
      setHoveredCard(originalIndex)
    }
  }

  const handleMouseLeave = () => {
    setHoveredCard(null)
  }

  // 向左旋转（顺时针）
  const rotateLeft = () => {
    setRotationAngle(prev => prev + ROTATION_STEP)
  }

  // 向右旋转（逆时针）
  const rotateRight = () => {
    setRotationAngle(prev => prev - ROTATION_STEP)
  }

  return (
    <div className={`relative ${className}`}>
      {/* 扇形牌堆容器 */}
      <div className="relative h-[420px] w-full flex items-end justify-center overflow-hidden">
        {/* 底部装饰光效 */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-gradient-radial from-primary/20 via-primary/5 to-transparent rounded-full blur-2xl pointer-events-none" />
        
        {/* 左旋转按钮 */}
        <button
          onClick={rotateLeft}
          disabled={disabled}
          className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 z-[300] w-14 h-14 rounded-full bg-black/70 backdrop-blur-md border border-primary/40 text-primary hover:bg-primary/30 hover:border-primary hover:scale-110 transition-all duration-300 flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          aria-label="向左旋转"
        >
          <svg className="w-7 h-7 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* 右旋转按钮 */}
        <button
          onClick={rotateRight}
          disabled={disabled}
          className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 z-[300] w-14 h-14 rounded-full bg-black/70 backdrop-blur-md border border-primary/40 text-primary hover:bg-primary/30 hover:border-primary hover:scale-110 transition-all duration-300 flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          aria-label="向右旋转"
        >
          <svg className="w-7 h-7 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        {/* 牌堆容器 - 使用 transform-origin 确保旋转中心正确 */}
        <div 
          className="relative"
          style={{ 
            height: '380px', 
            width: '100%',
          }}
        >
          {availableCards.map((originalIndex, displayIndex) => {
            const style = getCardStyle(displayIndex, availableCards.length, originalIndex)
            const isHovered = hoveredCard === originalIndex
            
            return (
              <div
                key={originalIndex}
                className="absolute bottom-0 left-1/2 cursor-pointer"
                style={{
                  ...style,
                  marginLeft: -CARD_WIDTH / 2,
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                  // 关键：使用 CSS transition 实现平滑动画
                  transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), z-index 0s',
                }}
                onClick={() => handleCardClick(originalIndex)}
                onMouseEnter={() => handleMouseEnter(originalIndex)}
                onMouseLeave={handleMouseLeave}
              >
                {/* 牌卡 */}
                <div 
                  className={`
                    relative w-full h-full rounded-lg overflow-hidden
                    transition-shadow duration-300
                    ${isHovered ? 'shadow-[0_0_35px_rgba(124,58,237,0.7)]' : 'shadow-[0_4px_15px_rgba(0,0,0,0.4)]'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {/* 牌背图片 */}
                  <Image
                    src={CARD_BACK_IMAGE}
                    alt="塔罗牌"
                    fill
                    className="object-cover"
                    sizes="85px"
                    draggable={false}
                  />
                  
                  {/* 悬停光效 */}
                  <div 
                    className={`
                      absolute inset-0 bg-gradient-to-t from-primary/50 via-transparent to-white/30
                      transition-opacity duration-200
                      ${isHovered ? 'opacity-100' : 'opacity-0'}
                    `}
                  />
                  
                  {/* 边框光效 */}
                  <div 
                    className={`
                      absolute inset-0 rounded-lg border-2 transition-colors duration-200
                      ${isHovered ? 'border-primary' : 'border-white/5'}
                    `}
                  />
                  
                  {/* 选择提示 */}
                  {isHovered && !disabled && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/80 backdrop-blur-sm text-white text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider shadow-lg">
                        ✨ 选择
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* 剩余牌数提示 */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md border border-primary/30 px-5 py-2 rounded-full z-[250] shadow-lg">
          <span className="text-primary font-bold text-lg">{availableCards.length}</span>
          <span className="text-slate-400 text-sm ml-1.5">张牌可选</span>
        </div>
      </div>
      
      {/* 提示文字 */}
      {!disabled && availableCards.length > 0 && (
        <div className="text-center mt-3">
          <p className="text-slate-400 text-xs">
            ← → 点击箭头旋转牌堆，选择你感应到的那一张
          </p>
        </div>
      )}
    </div>
  )
}