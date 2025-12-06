'use client'

import TarotCard from './TarotCard'
import type { DrawnCard } from '@/types/tarot'

interface DrawnCardsDisplayProps {
  drawnCards: DrawnCard[]
}

export default function DrawnCardsDisplay({ drawnCards }: DrawnCardsDisplayProps) {
  return (
    <div className="glass-panel rounded-3xl p-6 flex flex-col lg:sticky lg:top-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
      <h2 className="text-xl font-bold text-center text-white mb-6 font-display flex items-center justify-center gap-2">
        <span>🃏</span> 抽到的牌
      </h2>
      <div className="flex-1 space-y-5 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
        {drawnCards.map((drawnCard, index) => (
          <div
            key={index}
            className="group rounded-2xl bg-black/20 border border-white/5 p-4 transition-all hover:bg-white/5 hover:border-primary/30 hover:shadow-[0_0_30px_rgba(124,58,237,0.1)]"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-bold text-slate-400 uppercase tracking-wider group-hover:text-primary/80 transition-colors">
                {drawnCard.position.name}
              </div>
              <div
                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${drawnCard.isReversed
                    ? 'bg-amber-500/10 text-amber-500'
                    : 'bg-emerald-500/10 text-emerald-500'
                  }`}
              >
                {drawnCard.isReversed ? 'Reversed' : 'Upright'}
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-20 flex-shrink-0">
                <TarotCard
                  cardId={drawnCard.card.id}
                  cardName={drawnCard.card.name}
                  englishName={drawnCard.card.englishName}
                  isReversed={drawnCard.isReversed}
                  isRevealed={true}
                  className="w-full shadow-lg"
                />
              </div>

              <div className="flex-1">
                <div className="mb-1 text-lg font-bold text-white group-hover:text-primary-foreground transition-colors">
                  {drawnCard.card.name}
                </div>
                <div className="mb-2 text-xs font-medium text-slate-500">
                  {drawnCard.card.englishName}
                </div>
                <div className="mb-3 text-xs leading-relaxed text-slate-400">
                  {drawnCard.position.description}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(drawnCard.isReversed
                    ? drawnCard.card.reversedKeywords
                    : drawnCard.card.uprightKeywords
                  )
                    .slice(0, 3)
                    .map((keyword, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-white/5 border border-white/5 px-2 py-1 text-[10px] text-slate-300"
                      >
                        {keyword}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
