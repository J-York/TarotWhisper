'use client';

import { use, useEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Interpretation } from '@/components/Interpretation';
import { ReadingDetailSkeleton } from '@/components/Skeletons';
import { SpreadBoard } from '@/components/SpreadBoard';
import { useConfirm } from '@/hooks/useConfirm';
import { formatClock, formatMonthDay, weekdayName } from '@/lib/dates';
import { deleteReadings, getReadingById } from '@/lib/readingStorage';
import type { FollowUp, Reading } from '@/lib/tarot/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

function Section({ children, className = '' }: { children: ReactNode; className?: string }): ReactElement {
  return (
    <div className={`border-t border-dashed border-line px-5 py-6 first:border-t-0 md:px-8 ${className}`}>
      {children}
    </div>
  );
}

export default function ReadingDetailPage({ params }: PageProps): ReactElement {
  const { id } = use(params);
  const router = useRouter();
  const [reading, setReading] = useState<Reading | null | undefined>(undefined);
  const { dialog, confirm, handleConfirm, handleCancel } = useConfirm();

  useEffect(() => {
    queueMicrotask(() => setReading(getReadingById(id) ?? null));
  }, [id]);

  const handleDelete = async (): Promise<void> => {
    if (!reading) return;
    const ok = await confirm({
      title: '删除这篇手札',
      message: '删除后无法恢复。',
      confirmLabel: '删除',
      cancelLabel: '保留',
      tone: 'danger',
    });
    if (!ok) return;
    deleteReadings([reading.id]);
    router.replace('/history');
  };

  if (reading === undefined) return <ReadingDetailSkeleton />;

  if (reading === null) {
    return (
      <main id="main-content" className="page-container page-main">
        <div className="panel mx-auto mt-6 max-w-md px-6 py-12 text-center">
          <h1 className="text-xl font-semibold text-ink">找不到这篇手札</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
            它可能已经被删除，或者保存在另一台设备的浏览器里。
          </p>
          <Link href="/history" className="btn btn-primary mt-6 h-10 px-5">
            回到手札
          </Link>
        </div>
      </main>
    );
  }

  const { createdAt, drawnCards, spread } = reading;
  const followUps = reading.followUps ?? [];

  return (
    <main id="main-content" className="page-container page-main">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-3">
          <Link href="/history" className="btn btn-ghost -ml-2.5 h-9 text-sm">
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="m10 3-5 5 5 5" />
            </svg>
            手札
          </Link>
          <button type="button" onClick={() => void handleDelete()} className="btn btn-ghost h-9 text-sm">
            删除
          </button>
        </div>

        <header className="mt-6">
          <p className="kicker">
            {createdAt.getFullYear()}年{formatMonthDay(createdAt)} · {weekdayName(createdAt)} · {formatClock(createdAt)}
          </p>
          <div className="mt-5 flex items-start gap-3">
            <span className="voice-label mt-1.5">问</span>
            <h1 className="font-hand text-[clamp(1.375rem,3.4vw,1.875rem)] font-normal leading-snug text-voice">
              {reading.question || '（没有写下问题）'}
            </h1>
          </div>
          <p className="mt-4 text-[13px] text-ink-muted">
            {spread.nameCn} · {drawnCards.length} 张牌
            {followUps.length > 0 && ` · 追问 ${followUps.length} 次`}
          </p>
        </header>

        <article className="panel anim-rise mt-8">
          {drawnCards.length > 0 && (
            <Section>
              <SpreadBoard spreadId={spread.id} drawnCards={drawnCards} revealedCount={drawnCards.length} />
            </Section>
          )}

          <Section className="pb-8">
            {reading.interpretation ? (
              <Interpretation
                content={reading.interpretation}
                isLoading={false}
                error={null}
                staggerOnMount
                drawnCards={drawnCards}
              />
            ) : (
              <p className="text-[15px] text-ink-muted">这次没有留下解读。</p>
            )}
          </Section>

          {followUps.map((fu) => (
            <FollowUpRecord key={fu.id} followUp={fu} reading={reading} />
          ))}
        </article>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3">
          <Link href="/history" className="btn btn-secondary h-10 px-5 text-sm">
            回到手札
          </Link>
          <Link href="/" className="btn btn-primary h-10 px-5 text-sm">
            去问神谕
          </Link>
        </footer>
      </div>

      <ConfirmDialog
        isOpen={dialog.isOpen}
        title={dialog.title}
        message={dialog.message}
        confirmLabel={dialog.confirmLabel}
        cancelLabel={dialog.cancelLabel}
        tone={dialog.tone}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </main>
  );
}

function FollowUpRecord({ followUp: fu, reading }: { followUp: FollowUp; reading: Reading }): ReactElement {
  // 追问的回复里常会回头提到首轮的牌
  const mentionCards = useMemo(
    () => [...reading.drawnCards, ...fu.additionalCards],
    [reading.drawnCards, fu.additionalCards],
  );

  return (
    <Section className="pb-8">
      <div className="flex items-start gap-3">
        <span className="voice-label mt-0.5">追问</span>
        <p className="whitespace-pre-wrap font-hand text-lg leading-relaxed text-voice">{fu.question}</p>
      </div>

      {fu.decision === 'draw' && fu.reason && (
        <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
          补抽 {fu.additionalCards.length || fu.drawCount} 张 · {fu.reason}
        </p>
      )}

      {fu.additionalCards.length > 0 && (
        <div className="mt-5">
          <SpreadBoard
            spreadId="supplementary"
            drawnCards={fu.additionalCards}
            revealedCount={fu.additionalCards.length}
            size="xs"
          />
        </div>
      )}

      {fu.interpretation && (
        <div className="mt-5">
          <Interpretation
            content={fu.interpretation}
            isLoading={false}
            error={null}
            staggerOnMount
            drawnCards={mentionCards}
            signed={false}
          />
        </div>
      )}
    </Section>
  );
}
