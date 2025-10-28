import Image from 'next/image'
import { getCardImage, CARD_BACK_IMAGE } from '../utils/cardImages'

interface TarotCardProps {
  cardId?: string | number
  cardName?: string
  englishName?: string
  isReversed?: boolean
  isRevealed?: boolean
  className?: string
  onClick?: () => void
  showCardBack?: boolean
}

export default function TarotCard({
  cardId,
  cardName,
  englishName,
  isReversed = false,
  isRevealed = true,
  className = '',
  onClick,
  showCardBack = false
}: TarotCardProps) {
  const imageUrl = showCardBack || !isRevealed ? CARD_BACK_IMAGE : getCardImage(cardId || '')
  
  return (
    <div 
      className={`relative transition-all duration-300 ${onClick ? 'cursor-pointer hover:scale-105' : ''} ${className}`}
      onClick={onClick}
    >
      <div className={`relative ${isReversed && isRevealed ? 'transform rotate-180' : ''}`}>
        <Image
          src={imageUrl}
          alt={isRevealed ? `${cardName} - ${englishName}` : '塔罗牌背面'}
          width={200}
          height={350}
          className="w-full h-auto rounded-lg shadow-lg border border-white/20"
          priority={false}
        />
        
        {/* 逆位指示器 */}
        {isReversed && isRevealed && (
          <div className="absolute top-2 right-2 bg-orange-500/80 text-white text-xs px-2 py-1 rounded transform rotate-180">
            逆位
          </div>
        )}
        
        {/* 正位指示器 */}
        {!isReversed && isRevealed && (
          <div className="absolute top-2 right-2 bg-green-500/80 text-white text-xs px-2 py-1 rounded">
            正位
          </div>
        )}
      </div>
      
      {/* 卡牌信息 */}
      {isRevealed && cardName && (
        <div className="mt-2 text-center">
          <div className="text-white font-medium text-sm">{cardName}</div>
          {englishName && (
            <div className="text-gray-400 text-xs">{englishName}</div>
          )}
        </div>
      )}
    </div>
  )
}
