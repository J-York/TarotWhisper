/**
 * Skeletons · 路由级骨架屏
 *
 * 与页面同构：同样的 page-container / 卡片圆角 / 间距，
 * 避免加载完成后的布局跳动。
 */

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

/** 基础骨架原件 · 一根脉冲条 */
export function Skeleton({ className = '', style }: SkeletonProps): React.ReactElement {
  return <div className={`skeleton-base rounded-md ${className}`} style={style} aria-hidden />;
}

/** 卡牌占位 · 3:5 portrait */
function CardSkeleton({ className = '' }: SkeletonProps): React.ReactElement {
  return (
    <div className={`skeleton-base relative aspect-[3/5] w-full rounded-lg ${className}`} aria-hidden>
      <div className="absolute inset-2 rounded border border-[var(--gold-faint)]/50" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg text-gold-dim/60">✦</span>
      </div>
    </div>
  );
}

function HeaderSkeleton({ withAction = true }: { withAction?: boolean }): React.ReactElement {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <Skeleton className="h-2.5 w-32" />
        <Skeleton className="mt-4 h-8 w-56" />
        <Skeleton className="mt-3 h-3 w-72" />
      </div>
      {withAction && <Skeleton className="h-10 w-28 rounded-full" />}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
   History list · /history
   ─────────────────────────────────────────────────────────────── */

export function HistoryListSkeleton(): React.ReactElement {
  return (
    <main className="page-container page-main anim-fade-in">
      <HeaderSkeleton />
      <div className="mt-7 flex items-center gap-4 border-y border-[var(--ink-line)] py-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="ml-auto h-9 w-16 rounded-full" />
        <Skeleton className="h-9 w-16 rounded-full" />
      </div>
      <div className="mt-8 space-y-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="flex items-center gap-4 rounded-xl border border-[var(--ink-line)] bg-[rgba(20,16,34,0.4)] px-4 py-4"
          >
            <div className="hidden w-24 shrink-0 flex-col gap-2 md:flex">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-10" />
            </div>
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mt-2 h-3 w-1/3" />
            </div>
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
        ))}
      </div>
    </main>
  );
}

/* ───────────────────────────────────────────────────────────────
   Reading detail · /history/[id]
   ─────────────────────────────────────────────────────────────── */

export function ReadingDetailSkeleton(): React.ReactElement {
  return (
    <main className="page-container page-main anim-fade-in">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="mt-8 border-b border-[var(--ink-line)] pb-7">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-5 h-7 w-3/4" />
        <div className="mt-5 flex gap-6">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="mt-8">
        <Skeleton className="h-4 w-20" />
        <div className="mt-5 flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="w-36 shrink-0 md:w-40">
              <CardSkeleton />
              <Skeleton className="mt-3 h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-9">
        <Skeleton className="h-4 w-20" />
        <div className="mt-3 rounded-xl border border-[var(--ink-line)] bg-[rgba(20,16,34,0.4)] p-6">
          {Array.from({ length: 5 }).map((_, p) => (
            <Skeleton key={p} className="mb-3 h-3.5 w-full last:mb-0 last:w-2/3" />
          ))}
        </div>
      </div>
    </main>
  );
}

/* ───────────────────────────────────────────────────────────────
   Library · /library
   ─────────────────────────────────────────────────────────────── */

export function LibrarySkeleton(): React.ReactElement {
  return (
    <main className="page-container page-main anim-fade-in">
      <HeaderSkeleton withAction={false} />
      <div className="mt-6 flex flex-wrap gap-2 border-b border-[var(--ink-line)] pb-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Skeleton key={idx} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      {Array.from({ length: 2 }).map((_, s) => (
        <section key={s} className="mt-9">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-14" />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7">
            {Array.from({ length: 7 }).map((_, idx) => (
              <div key={idx}>
                <CardSkeleton />
                <Skeleton className="mt-2.5 h-3 w-16" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

/* ───────────────────────────────────────────────────────────────
   Daily card · /daily
   ─────────────────────────────────────────────────────────────── */

export function DailyCardSkeleton(): React.ReactElement {
  return (
    <main className="page-container page-main anim-fade-in">
      <HeaderSkeleton withAction={false} />
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-start">
        <div className="rounded-2xl border border-[var(--ink-line)] bg-[rgba(20,16,34,0.5)] p-5">
          <div className="flex justify-between pb-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-10" />
          </div>
          <div className="mx-auto w-[220px]">
            <CardSkeleton />
          </div>
          <div className="mt-5 flex flex-col items-center gap-2">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
        <div className="flex flex-col gap-6">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div key={idx} className="rounded-2xl border border-[var(--ink-line)] bg-[rgba(20,16,34,0.5)] p-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-4 h-3 w-full" />
              <Skeleton className="mt-2 h-3 w-5/6" />
              <Skeleton className="mt-2 h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
