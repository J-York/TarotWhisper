import FlipCard from './FlipCard'
import type { Position, DrawnCard } from '@/types/tarot'

interface SpreadLayoutProps {
  spreadId: string
  positions: Position[]
  drawnCards: DrawnCard[]
  onPositionClick: (positionId: number) => void
  canDrawAtPosition: (positionId: number) => boolean
  isDrawing: boolean
  drawingPositionId: number | null
}

export default function SpreadLayout({
  spreadId,
  positions,
  drawnCards,
  onPositionClick,
  canDrawAtPosition,
  drawingPositionId
}: SpreadLayoutProps) {
  const getCardAtPosition = (positionId: number): DrawnCard | null => {
    return drawnCards.find(card => card.position.id === positionId) || null
  }

  const renderPosition = (position: Position, className: string = '') => {
    const drawnCard = getCardAtPosition(position.id)
    const canDraw = canDrawAtPosition(position.id)
    const isCurrentlyDrawing = drawingPositionId === position.id

    return (
      <div
        key={position.id}
        className={`group relative flex flex-col items-center pt-14 ${className}`}
      >
        {/* Position Label */}
        <div className="absolute top-0 left-1/2 z-10 -translate-x-1/2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-black/60 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-[0_0_20px_rgba(124,58,237,0.3)] backdrop-blur whitespace-nowrap transition-all group-hover:border-primary/60 group-hover:scale-105">
            <span className="text-[10px]">✦</span>
            <span>{position.name}</span>
          </div>
        </div>

        {/* Card Slot */}
        <div
          className={`relative flex w-32 items-center justify-center rounded-xl border border-dashed transition-all duration-500 ${canDraw
              ? 'cursor-pointer border-primary/40 bg-primary/5 hover:border-primary/80 hover:shadow-[0_0_30px_rgba(124,58,237,0.2)] hover:bg-primary/10'
              : 'border-white/10 bg-black/20'
            } ${isCurrentlyDrawing
              ? 'border-primary bg-primary/20 shadow-[0_0_40px_rgba(124,58,237,0.5)] animate-pulse-glow'
              : ''
            }`}
          style={{ aspectRatio: '2/3.5' }}
          onClick={() => canDraw && onPositionClick(position.id)}
        >
          {/* Hover Glow Effect */}
          <div className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none">
            <div className="h-full w-full rounded-xl bg-gradient-to-b from-primary/10 to-transparent" />
          </div>

          {drawnCard ? (
            <FlipCard
              cardId={drawnCard.card.id}
              cardName=""
              englishName=""
              isReversed={drawnCard.isReversed}
              autoFlip={true}
              flipDelay={500}
              className="w-full h-full"
            />
          ) : (
            <div className="relative flex flex-col items-center gap-2 text-center text-sm z-10 px-2">
              {isCurrentlyDrawing ? (
                <span className="text-primary font-bold animate-pulse">Drawing...</span>
              ) : canDraw ? (
                <span className="text-primary/80 font-medium group-hover:text-primary transition-colors">Click to Draw</span>
              ) : (
                <span className="text-slate-500 text-xs uppercase tracking-widest">Waiting</span>
              )}
              <span className="text-[10px] leading-relaxed text-slate-400 group-hover:text-slate-300 transition-colors line-clamp-3">
                {position.description}
              </span>
            </div>
          )}
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
          </div>
        )}

        {/* Position Description (Before Drawn) */}
        {!drawnCard && (
          <div className="mt-4 w-32 text-center text-[10px] leading-relaxed text-slate-500 group-hover:text-slate-400 transition-colors">
            {position.description}
          </div>
        )}
      </div>
    )
  }

  // Layouts based on spread ID
  switch (spreadId) {
    case 'single_card':
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          {renderPosition(positions[0])}
        </div>
      )

    case 'three_card_time':
    case 'three_card_mind_body_spirit':
      return (
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 min-h-[400px]">
          {positions.map((position, index) =>
            renderPosition(position, index === 1 ? 'md:-mt-12' : '')
          )}
        </div>
      )

    case 'celtic_cross':
      return (
        <div className="min-h-[900px] max-w-7xl mx-auto px-4 py-8 overflow-x-auto">
          <div className="min-w-[800px] grid grid-cols-7 gap-8 max-w-6xl mx-auto">

            {/* Center Cross & Surrounding */}
            <div className="col-span-5 grid grid-cols-5 grid-rows-3 gap-4">
              {/* Top: Possible Future */}
              <div className="col-start-3 row-start-1 flex justify-center">
                {renderPosition(positions[4])}
              </div>

              {/* Middle Row: Past, Challenge, Present, Future */}
              <div className="col-start-2 row-start-2 flex justify-center items-center">
                {renderPosition(positions[3])}
              </div>
              <div className="col-start-3 row-start-2 flex justify-center items-center relative">
                {/* Present (0) and Challenge (1) overlap */}
                <div className="absolute z-0">
                  {renderPosition(positions[0])}
                </div>
                <div className="absolute z-10 rotate-90 opacity-90 hover:opacity-100 hover:rotate-0 transition-all duration-500">
                  {renderPosition(positions[1])}
                </div>
              </div>
              <div className="col-start-4 row-start-2 flex justify-center items-center">
                {renderPosition(positions[5])}
              </div>

              {/* Bottom: Foundation */}
              <div className="col-start-3 row-start-3 flex justify-center">
                {renderPosition(positions[2])}
              </div>
            </div>

            {/* Right Staff */}
            <div className="col-span-2 flex flex-col justify-center gap-6 pl-8 border-l border-white/5">
              {renderPosition(positions[9])} {/* Outcome */}
              {renderPosition(positions[8])} {/* Hopes/Fears */}
              {renderPosition(positions[7])} {/* External Influences */}
              {renderPosition(positions[6])} {/* Self */}
            </div>

          </div>
        </div>
      )

    default:
      return (
        <div className="flex flex-wrap justify-center gap-8 min-h-[300px]">
          {positions.map((position) => renderPosition(position))}
        </div>
      )
  }
}
