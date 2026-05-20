/**
 * Skeletons · 路由级与组件级骨架屏
 *
 * 设计原则：
 * - 与 ApiSettings / 解读区同源风格：极细边框 + 暗色脉冲 + 极弱金色扫光
 * - 占位高度 / 间距尽量复刻最终内容形态，避免布局抖动
 * - 不展示 "载入中" 字样，留白即等待，符合仪式感
 */

interface SkeletonProps {
  className?: string;
  /** 自定义内联 style；常见用例是高度（h-3 不够时） */
  style?: React.CSSProperties;
}

/** 基础骨架原件 · 一根脉冲条 */
export function Skeleton({ className = '', style }: SkeletonProps) {
  return <div className={`skeleton-base ${className}`} style={style} aria-hidden />;
}

/** 卡牌占位 · 3:5 portrait */
function CardSkeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`relative w-full aspect-[3/5] skeleton-base ${className}`} aria-hidden>
      {/* 内框双线，复刻牌背风格 */}
      <div className="absolute inset-2 hairline" />
      <div className="absolute inset-3.5 hairline-strong" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-bone-whisper text-xl">✦</span>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
   History list · /history
   ─────────────────────────────────────────────────────────────── */

export function HistoryListSkeleton(): React.ReactElement {
  return (
    <div className="relative min-h-screen flex flex-col px-10 py-12 anim-fade-in">
      {/* Header bar */}
      <header className="relative z-20 max-w-7xl w-full mx-auto mb-16">
        <div className="flex items-center justify-between">
          <Skeleton className="w-20 h-4" />
          <div className="flex gap-8 items-center">
            <Skeleton className="w-12 h-4" />
            <Skeleton className="w-12 h-4" />
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto">
        {/* Title block */}
        <div className="text-center mb-20">
          <Skeleton className="w-1.5 h-1.5 rounded-full mx-auto mb-7" />
          <Skeleton className="w-72 h-8 mx-auto mb-4" />
          <Skeleton className="w-32 h-3 mx-auto mb-6" />
          <Skeleton className="w-20 h-px mx-auto mb-6" />
          <Skeleton className="w-56 h-4 mx-auto" />
        </div>

        {/* Grid · 6 cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => {
            const colMod = idx % 3;
            const borderClasses = [
              idx >= 3 ? 'md:border-t md:border-[var(--ink-line)]' : '',
              colMod !== 0 ? 'md:border-l md:border-[var(--ink-line)]' : '',
              idx % 2 === 1 ? 'border-t border-[var(--ink-line)] md:border-t-0' : '',
            ].join(' ');
            return (
              <div key={idx} className={`p-9 ${borderClasses}`}>
                <Skeleton className="w-32 h-3 mb-6" />
                <Skeleton className="w-full h-5 mb-3" />
                <Skeleton className="w-2/3 h-5 mb-6" />
                <div className="flex items-center gap-3 mb-7">
                  <Skeleton className="w-2 h-2 rounded-full" />
                  <Skeleton className="w-20 h-3" />
                  <Skeleton className="w-2 h-px" />
                  <Skeleton className="w-12 h-3" />
                </div>
                <div className="flex gap-1.5 mb-6 items-end">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <Skeleton
                      key={j}
                      className="w-1"
                      style={{ height: `${16 + (j % 3) * 4}px` }}
                    />
                  ))}
                </div>
                <Skeleton className="w-full h-3 mb-2" />
                <Skeleton className="w-4/5 h-3" />
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
   Reading detail · /history/[id]
   ─────────────────────────────────────────────────────────────── */

export function ReadingDetailSkeleton(): React.ReactElement {
  return (
    <div className="relative min-h-screen flex flex-col px-10 py-12 anim-fade-in">
      <header className="relative z-20 max-w-7xl w-full mx-auto mb-16">
        <div className="flex items-center justify-between">
          <Skeleton className="w-28 h-4" />
          <Skeleton className="w-20 h-4" />
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto">
        {/* 标题区 */}
        <div className="text-center mb-20">
          <Skeleton className="w-32 h-3 mx-auto mb-7" />
          <Skeleton className="w-1.5 h-1.5 rounded-full mx-auto mb-7" />
          <Skeleton className="w-3/4 max-w-2xl h-8 mx-auto mb-3" />
          <Skeleton className="w-1/2 max-w-md h-6 mx-auto mb-6" />
          <Skeleton className="w-20 h-px mx-auto mb-6" />
          <Skeleton className="w-40 h-3 mx-auto" />
        </div>

        {/* 牌阵信息卡 */}
        <div className="ink-panel-quiet p-12 mb-20">
          <div className="flex items-center gap-4 mb-5">
            <Skeleton className="w-2 h-2 rounded-full" />
            <Skeleton className="w-24 h-4" />
          </div>
          <Skeleton className="w-12 h-px mb-6" />
          <Skeleton className="w-full h-4 mb-3" />
          <Skeleton className="w-5/6 h-4" />
        </div>

        {/* 牌阵 · 3 张占位 */}
        <div className="mb-20">
          <div className="text-center mb-14">
            <Skeleton className="w-1.5 h-1.5 rounded-full mx-auto mb-5" />
            <Skeleton className="w-40 h-7 mx-auto mb-4" />
            <Skeleton className="w-20 h-px mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-14">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="w-48 mb-7">
                  <CardSkeleton />
                </div>
                <Skeleton className="w-16 h-3 mb-3" />
                <Skeleton className="w-32 h-3 mb-6" />
                <Skeleton className="w-10 h-px mb-5" />
                <Skeleton className="w-24 h-5 mb-2" />
                <Skeleton className="w-20 h-3" />
              </div>
            ))}
          </div>
        </div>

        {/* 解读区 · 大段文本骨架 */}
        <div className="flex flex-col items-center pb-12">
          <div className="w-full max-w-4xl">
            <div className="flex flex-col items-center gap-4 mb-12">
              <Skeleton className="w-1.5 h-1.5 rounded-full" />
              <Skeleton className="w-24 h-7" />
              <Skeleton className="w-20 h-px" />
              <Skeleton className="w-40 h-3" />
            </div>
            <div className="ink-panel-quiet p-10 md:p-16">
              <Skeleton className="w-1/3 h-7 mb-6" />
              {Array.from({ length: 4 }).map((_, p) => (
                <div key={p} className="mb-6">
                  <Skeleton className="w-full h-4 mb-3" />
                  <Skeleton className="w-full h-4 mb-3" />
                  <Skeleton className="w-11/12 h-4 mb-3" />
                  <Skeleton className="w-3/5 h-4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
   Library · /library
   ─────────────────────────────────────────────────────────────── */

export function LibrarySkeleton(): React.ReactElement {
  return (
    <div className="relative min-h-screen flex flex-col anim-fade-in">
      <nav className="absolute top-0 left-0 right-0 flex justify-between items-center px-10 py-7 z-30">
        <Skeleton className="w-20 h-4" />
        <div className="flex items-center gap-9">
          <Skeleton className="w-12 h-4" />
          <Skeleton className="w-12 h-4" />
        </div>
      </nav>

      <main className="flex-1 px-6 md:px-10 pt-32 pb-20 max-w-7xl w-full mx-auto">
        {/* Title */}
        <header className="text-center mb-16">
          <Skeleton className="w-1.5 h-1.5 rounded-full mx-auto mb-7" />
          <Skeleton className="w-64 h-9 mx-auto mb-4" />
          <Skeleton className="w-36 h-3 mx-auto mb-6" />
          <Skeleton className="w-20 h-px mx-auto mb-6" />
          <Skeleton className="w-72 h-4 mx-auto" />
        </header>

        {/* Tab bar */}
        <div className="mb-16 flex flex-wrap justify-center items-stretch border-y border-[var(--ink-line)]">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 px-6 py-5 ${idx > 0 ? 'border-l border-[var(--ink-line)]' : ''}`}
            >
              <Skeleton className="w-2 h-2 rounded-full" />
              <Skeleton className="w-12 h-3" />
            </div>
          ))}
        </div>

        {/* Total count */}
        <div className="text-center mb-12">
          <Skeleton className="w-20 h-3 mx-auto" />
        </div>

        {/* Section */}
        <section>
          <div className="text-center mb-12">
            <Skeleton className="w-40 h-7 mx-auto mb-3" />
            <Skeleton className="w-24 h-3 mx-auto mb-5" />
            <Skeleton className="w-16 h-px mx-auto mb-5" />
            <Skeleton className="w-48 h-3 mx-auto" />
          </div>

          {/* Card grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-12">
            {Array.from({ length: 12 }).map((_, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <CardSkeleton />
                <Skeleton className="w-20 h-4 mt-4 mb-2" />
                <Skeleton className="w-16 h-3" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
   Daily card · /daily
   ─────────────────────────────────────────────────────────────── */

export function DailyCardSkeleton(): React.ReactElement {
  return (
    <div className="relative min-h-screen flex flex-col px-10 py-12 anim-fade-in">
      <header className="relative z-20 max-w-5xl w-full mx-auto mb-12">
        <div className="flex items-center justify-between">
          <Skeleton className="w-20 h-4" />
          <Skeleton className="w-16 h-4" />
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto">
        <div className="text-center mb-14">
          <Skeleton className="w-1.5 h-1.5 rounded-full mx-auto mb-7" />
          <Skeleton className="w-48 h-9 mx-auto mb-4" />
          <Skeleton className="w-32 h-3 mx-auto mb-6" />
          <Skeleton className="w-20 h-px mx-auto mb-6" />
          <Skeleton className="w-56 h-4 mx-auto" />
        </div>

        <div className="flex flex-col items-center mb-16">
          <div className="w-48 md:w-56 mb-9">
            <CardSkeleton />
          </div>
          <Skeleton className="w-32 h-7 mb-3" />
          <Skeleton className="w-24 h-3" />
        </div>

        <div className="ink-panel-quiet p-10 max-w-2xl mx-auto">
          <Skeleton className="w-24 h-4 mb-5" />
          <Skeleton className="w-12 h-px mb-6" />
          <Skeleton className="w-full h-4 mb-3" />
          <Skeleton className="w-full h-4 mb-3" />
          <Skeleton className="w-4/5 h-4" />
        </div>
      </main>
    </div>
  );
}
