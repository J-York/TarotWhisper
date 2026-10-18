import type { ReactElement, ReactNode } from 'react';

/**
 * 路由级骨架屏 · 与对应页面同构（同样的版心、栏宽和间距），载入完成时版面不跳动
 */

function Bar({ className = '' }: { className?: string }): ReactElement {
  return <div aria-hidden className={`skeleton ${className}`} />;
}

function Plate({ className = '' }: { className?: string }): ReactElement {
  return <div aria-hidden className={`skeleton aspect-[3/5] rounded-[5px] ${className}`} />;
}

function SkeletonPage({ children }: { children: ReactNode }): ReactElement {
  return (
    <main id="main-content" aria-busy="true" className="page-container page-main anim-fade">
      <span className="sr-only">正在载入</span>
      {children}
    </main>
  );
}

function HeaderSkeleton(): ReactElement {
  return (
    <div>
      <Bar className="my-1 h-3 w-20" />
      <Bar className="mt-4 h-9 w-52 md:h-11 md:w-64" />
      <Bar className="mt-4 h-4 w-full max-w-md" />
    </div>
  );
}

function ParagraphSkeleton({ lines = 5 }: { lines?: number }): ReactElement {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }, (_, i) => (
        <Bar key={i} className={`h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}

/* ─── 手札 · /history ─── */

export function HistoryListSkeleton(): ReactElement {
  return (
    <SkeletonPage>
      <div className="mx-auto max-w-3xl">
        <HeaderSkeleton />
        <div className="mt-8 flex h-[3.375rem] items-center gap-4 border-y border-line">
          <Bar className="h-3.5 w-14" />
          <Bar className="ml-auto h-4 w-10" />
          <Bar className="h-4 w-14" />
        </div>
        <Bar className="mb-2 mt-8 h-4 w-24" />
        <div className="divide-y divide-line border-b border-line">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-start gap-4 py-5 sm:gap-5">
              <div className="flex w-10 shrink-0 flex-col items-center gap-2">
                <Bar className="h-7 w-8" />
                <Bar className="h-3 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <Bar className="h-5 w-3/4" />
                <Bar className="mt-3 h-3 w-44" />
                <Bar className="mt-3 h-3.5 w-full" />
                <Bar className="mt-2 h-3.5 w-1/2" />
              </div>
              <div className="hidden shrink-0 pr-1 pt-1 sm:flex">
                <Plate className="w-10 -rotate-6 ring-2 ring-canvas" />
                <Plate className="-ml-5 w-10 ring-2 ring-canvas" />
                <Plate className="-ml-5 w-10 rotate-6 ring-2 ring-canvas" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}

/* ─── 手札详情 · /history/[id] ─── */

export function ReadingDetailSkeleton(): ReactElement {
  return (
    <SkeletonPage>
      <div className="mx-auto max-w-3xl">
        <div className="flex h-9 items-center justify-between">
          <Bar className="h-4 w-14" />
          <Bar className="h-4 w-10" />
        </div>
        <div className="mt-6">
          <Bar className="my-1 h-3 w-56" />
          <div className="mt-5 flex items-start gap-3">
            <Bar className="mt-1 h-7 w-7 shrink-0" />
            <Bar className="h-9 w-3/4" />
          </div>
          <Bar className="mt-4 h-3 w-32" />
        </div>
        <div className="panel mt-8">
          <div className="flex justify-center gap-4 px-5 py-6 sm:gap-6 md:px-8">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex flex-col items-center">
                <Plate className="w-24 sm:w-36" />
                <Bar className="mt-3 h-3.5 w-14" />
              </div>
            ))}
          </div>
          <div className="border-t border-dashed border-line px-5 pb-8 pt-6 md:px-8">
            <ParagraphSkeleton lines={6} />
          </div>
        </div>
      </div>
    </SkeletonPage>
  );
}

/* ─── 牌典 · /library ─── */

export function LibrarySkeleton(): ReactElement {
  return (
    <SkeletonPage>
      <HeaderSkeleton />
      <div className="-mx-5 mt-8 flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-line px-5 py-3 md:-mx-10 md:px-10">
        <div className="flex min-w-0 flex-1 gap-1.5 overflow-hidden py-0.5">
          {Array.from({ length: 6 }, (_, i) => (
            <Bar key={i} className="h-8 w-20 shrink-0 rounded-full" />
          ))}
        </div>
        <Bar className="h-9 w-full rounded-md sm:w-60" />
      </div>
      <div className="mt-10 space-y-14">
        {Array.from({ length: 2 }, (_, s) => (
          <section key={s}>
            <div className="flex items-center gap-3 border-b border-line pb-3">
              <Bar className="h-3 w-3" />
              <Bar className="h-6 w-16" />
              <Bar className="h-4 w-28" />
              <Bar className="ml-auto h-3.5 w-10" />
            </div>
            <div className="mt-6 grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
              {Array.from({ length: 7 }, (_, i) => (
                <div key={i}>
                  <Plate className="w-full" />
                  <Bar className="mt-3 h-4 w-3/4" />
                  <Bar className="mt-1.5 h-3 w-1/2" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </SkeletonPage>
  );
}

/* ─── 今日一牌 · /daily ─── */

export function DailyCardSkeleton(): ReactElement {
  return (
    <SkeletonPage>
      <HeaderSkeleton />
      <div className="mt-10 grid items-start gap-10 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-14">
        <div className="panel overflow-hidden">
          <div className="perforation" aria-hidden />
          <div className="px-6 pb-8 pt-4">
            <div className="flex justify-between">
              <Bar className="h-3.5 w-20" />
              <Bar className="h-3.5 w-12" />
            </div>
            <div className="mt-3 flex flex-col items-center">
              <Bar className="my-3 h-16 w-24" />
              <Bar className="mt-3 h-3.5 w-28" />
            </div>
            <div className="rule-double mt-6" aria-hidden />
            <div className="mt-8 flex justify-center">
              <Bar className="h-[347px] w-52 rounded-[5px] sm:h-[400px] sm:w-60" />
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-10">
          <div className="panel px-5 py-6 md:px-8 md:py-7">
            <Bar className="h-5 w-20" />
            <Bar className="mt-4 h-4 w-full max-w-sm" />
            <Bar className="mt-5 h-10 w-28 rounded-md" />
          </div>
          <div className="panel px-5 py-6 md:px-8 md:py-7">
            <Bar className="h-5 w-12" />
            <div className="ruled mt-3 h-[13.5rem]" aria-hidden />
          </div>
          <div>
            <div className="flex h-9 items-center">
              <Bar className="h-5 w-24" />
            </div>
            <Bar className="mt-4 h-[29rem] rounded-md sm:h-[32rem]" />
          </div>
        </div>
      </div>
    </SkeletonPage>
  );
}
