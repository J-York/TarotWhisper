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
  const imageUrl = showCardBack || !isRevealed ? CARD_BACK_IMAGE : getCardImage(cardId ?? '')

  return (
    <div
      className={`group relative transition-all duration-500 ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''} ${className}`}
      onClick={onClick}
    >
      <div className={`relative transition-transform duration-700 ${isReversed && isRevealed ? 'rotate-180' : ''}`}>
        {/* Card Container */}
        <div className="relative w-full aspect-[2/3.5] overflow-hidden rounded-xl shadow-lg border border-white/10 bg-black/40 transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(124,58,237,0.3)] group-hover:border-primary/30">
          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none z-10" />

          <Image
            src={imageUrl}
            alt={isRevealed ? `${cardName} - ${englishName}` : '塔罗牌背面'}
            fill
            className="object-cover"
            priority={false}
            sizes="(max-width: 768px) 150px, 200px"
          />
        </div>

        {/* Reversed Indicator */}
        {isReversed && isRevealed && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm border border-amber-500/30 text-amber-400 text-[10px] px-2 py-0.5 rounded rotate-180 z-20 font-bold uppercase tracking-wider shadow-sm">
            Reversed
          </div>
        )}

        {/* Upright Indicator (Optional, usually not needed but kept for symmetry if desired) */}
        {!isReversed && isRevealed && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm border border-emerald-500/30 text-emerald-400 text-[10px] px-2 py-0.5 rounded z-20 font-bold uppercase tracking-wider shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
            Upright
          </div>
        )}
      </div>

      {/* Card Info - Only shown when revealed and names provided */}
      {isRevealed && cardName && (
        <div className="mt-3 text-center">
          <div className="text-white font-bold text-sm mb-0.5 tracking-wide">{cardName}</div>
          {englishName && (
            <div className="text-slate-400 text-xs font-medium">{englishName}</div>
          )}
        </div>
      )}
    </div>
  )
}
