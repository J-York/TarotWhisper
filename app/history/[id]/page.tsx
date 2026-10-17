'use client';

import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Reading, FollowUp } from '@/lib/tarot/types';
import { getReadingById, deleteReadings } from '@/lib/readingStorage';
import { InterpretationBody } from '@/components/Interpretation';
import { TarotCardComponent } from '@/components/TarotCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useConfirm } from '@/hooks/useConfirm';
import { ReadingDetailSkeleton } from '@/components/Skeletons';

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}.${month}.${day} ${hour}:${minute}`;
}

export default function ReadingDetailPage({ params }: PageProps): ReactElement {
  const [reading, setReading] = useState<Reading | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();
  const { dialog, confirm, handleConfirm, handleCancel } = useConfirm();

  useEffect(() => {
    params.then((resolved) => {
      setReading(getReadingById(resolved.id) || null);
      setIsLoaded(true);
    });
  }, [params]);

  const handleDelete = async (): Promise<void> => {
    if (!reading) return;
    const ok = await confirm({
      title: '删除记录',
      message: '此次占卜的记录将被永久删除，无法恢复。',
      confirmLabel: '删除',
      cancelLabel: '保留',
      tone: 'danger',
    });
    if (!ok) return;

    deleteReadings([reading.id]);
    router.push('/history');
  };

  if (!isLoaded) {
    return <ReadingDetailSkeleton />;
  }

  if (!reading) {
    return (
      <main id="main-content" className="page-container page-main">
        <div className="surface mx-auto mt-12 flex max-w-md flex-col items-center gap-4 px-6 py-14 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full border border-[var(--ink-line-strong)] text-xl text-gold-dim" aria-hidden>
            ✧
          </span>
          <h1 className="font-heading text-xl text-bone">记录不存在</h1>
          <p className="text-sm leading-relaxed text-bone-faint">
            这条占卜记录可能已被删除，或保存在其他浏览器中。
          </p>
          <Link href="/history" className="btn-ink-primary mt-2 h-10 px-5 text-sm">
            返回轨迹
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="page-container page-main">
      {/* ─── 返回栏 ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/history" className="btn-ink-ghost -ml-2 text-sm">
          ← 返回轨迹
        </Link>
        <button type="button" onClick={handleDelete} className="btn-ink-ghost text-sm">
          删除记录
        </button>
      </div>

      {/* ─── 卷首 · 问题 ─── */}
      <header className="mt-6 border-b border-[var(--ink-line)] pb-7">
        <p className="eyebrow">{formatDate(reading.createdAt)}</p>
        <h1 className="mt-4 font-body text-[clamp(1.4rem,3.2vw,2rem)] font-light leading-snug text-bone">
          <span className="mr-2 align-middle text-sm text-gold" aria-hidden>✦</span>
          {reading.question || '未记录问题'}
        </h1>
        <dl className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-2 text-xs">
          <div className="flex items-center gap-2">
            <dt className="text-bone-faint">牌阵</dt>
            <dd className="text-bone">
              {reading.spread.nameCn}
              <span className="ml-1.5 text-[10px] text-bone-whisper">{reading.spread.name}</span>
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="text-bone-faint">抽牌</dt>
            <dd className="text-bone">{reading.drawnCards.length} 张</dd>
          </div>
          {reading.followUps && reading.followUps.length > 0 && (
            <div className="flex items-center gap-2">
              <dt className="text-bone-faint">追问</dt>
              <dd className="text-celestial">{reading.followUps.length} 次</dd>
            </div>
          )}
        </dl>
      </header>

      {/* ─── 牌面 ─── */}
      <section className="mt-8" aria-labelledby="cards-title">
        <div className="mb-4 flex items-center gap-2.5">
          <h2 id="cards-title" className="section-title">抽到的牌</h2>
          <span className="h-px flex-1 bg-[var(--ink-line)]" />
          <span className="text-[11px] text-bone-faint">横向滑动查看</span>
        </div>

        <div className="-mx-5 overflow-x-auto px-5 pb-2 [scrollbar-width:thin] md:-mx-8 md:px-8">
          <ul className="flex w-max gap-4">
            {reading.drawnCards.map((drawn, index) => (
              <li key={`${drawn.position.id}-${index}`} className="w-36 md:w-40">
                <div className="rounded-xl border border-[var(--ink-line)] bg-[rgba(20,16,34,0.45)] p-2.5">
                  <TarotCardComponent
                    card={drawn.card}
                    isReversed={drawn.isReversed}
                    isRevealed
                    size="sm"
                    enableInteractions={false}
                    className="!h-[200px] !w-full"
                  />
                </div>
                <div className="mt-2.5">
                  <p className="flex items-center gap-1.5 text-[11px] text-bone-faint">
                    <span className="grid h-4 w-4 place-items-center rounded-full border border-[var(--ink-line-strong)] text-[9px]">
                      {index + 1}
                    </span>
                    {drawn.position.nameCn}
                  </p>
                  <p className="mt-1 truncate font-heading text-sm text-bone">
                    {drawn.card.nameCn}
                    {drawn.isReversed && <span className="ml-1.5 text-[10px] text-gold-dim">逆位</span>}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-bone-whisper">{drawn.card.name}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── 解读 ─── */}
      <section className="mt-9" aria-labelledby="interpretation-title">
        <div className="mb-3 flex items-center gap-2.5">
          <h2 id="interpretation-title" className="section-title">神的回答</h2>
          <span className="h-px flex-1 bg-[var(--ink-line)]" />
        </div>

        {reading.interpretation ? (
          <div className="surface px-5 py-6 md:px-8 md:py-8">
            <ReadingInterpretation reading={reading} />
          </div>
        ) : (
          <div className="surface px-5 py-8">
            <p className="text-sm text-bone-faint">此次占卜没有留下解读内容。</p>
          </div>
        )}
      </section>

      {/* ─── 追问 ─── */}
      {reading.followUps && reading.followUps.length > 0 && (
        <section className="mt-9" aria-labelledby="followups-title">
          <div className="mb-3 flex items-center gap-2.5">
            <h2 id="followups-title" className="section-title">追问</h2>
            <span className="h-px flex-1 bg-[var(--ink-line)]" />
            <span className="text-[11px] text-celestial">{reading.followUps.length} 次</span>
          </div>

          <div className="space-y-4">
            {reading.followUps.map((fu, i) => (
              <FollowUpRecord key={fu.id} followUp={fu} reading={reading} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ─── 卷尾 ─── */}
      <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--ink-line)] pt-6">
        <span className="text-[11px] text-bone-whisper">Reading Archive · {formatDate(reading.createdAt)}</span>
        <div className="flex items-center gap-2">
          <Link href="/history" className="btn-ink h-9 px-4 text-sm">
            返回轨迹
          </Link>
          <Link href="/reading" className="btn-ink-primary h-9 px-4 text-sm">
            新的占卜
          </Link>
        </div>
      </footer>

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

function ReadingInterpretation({ reading }: { reading: Reading }): ReactElement {
  const cardTerms = useMemo<string[]>(
    () => reading.drawnCards.flatMap((d) => [d.card.nameCn, d.card.name]),
    [reading]
  );
  const positionTerms = useMemo<string[]>(
    () => reading.spread.positions.map((p) => p.nameCn),
    [reading]
  );
  return (
    <InterpretationBody
      content={reading.interpretation || ''}
      stagger
      cardTerms={cardTerms}
      positionTerms={positionTerms}
      showSigil
    />
  );
}

interface FollowUpRecordProps {
  followUp: FollowUp;
  reading: Reading;
  index: number;
}

function FollowUpRecord({ followUp, reading, index }: FollowUpRecordProps): ReactElement {
  const cardTerms = useMemo<string[]>(
    () => [
      ...reading.drawnCards.flatMap((d) => [d.card.nameCn, d.card.name]),
      ...followUp.additionalCards.flatMap((d) => [d.card.nameCn, d.card.name]),
    ],
    [reading, followUp]
  );
  const positionTerms = useMemo<string[]>(
    () => [
      ...reading.spread.positions.map((p) => p.nameCn),
      ...followUp.additionalCards.map((d) => d.position.nameCn),
    ],
    [reading, followUp]
  );

  return (
    <article className="rounded-xl border border-[var(--celestial-faint)] bg-[rgba(139,159,212,0.05)] p-4 md:p-5">
      <div className="flex items-center gap-2.5">
        <span className="grid h-5 w-5 place-items-center rounded-full border border-[var(--celestial-dim)] text-[10px] text-celestial">
          {index + 1}
        </span>
        <span className="text-[10px] tracking-[0.16em] text-celestial">追问</span>
      </div>
      <p className="mt-2 font-body text-[15px] leading-relaxed text-bone">{followUp.question}</p>

      {followUp.additionalCards.length > 0 && (
        <div className="mt-4 rounded-lg border border-[var(--ink-line)] bg-[rgba(20,16,34,0.4)] p-3">
          <p className="text-[11px] text-bone-faint">
            补充牌 · {followUp.additionalCards.length} 张
          </p>
          <ul className="mt-3 flex flex-wrap gap-4">
            {followUp.additionalCards.map((drawn) => (
              <li key={drawn.position.id} className="flex w-20 flex-col items-center gap-1.5">
                <TarotCardComponent
                  card={drawn.card}
                  isReversed={drawn.isReversed}
                  isRevealed
                  size="sm"
                  enableInteractions={false}
                />
                <span className="text-center text-[10px] text-bone-faint">
                  {drawn.card.nameCn}
                  {drawn.isReversed ? ' · 逆' : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {followUp.interpretation && (
        <div className="mt-4 rounded-lg border border-[var(--ink-line)] bg-[rgba(20,16,34,0.4)] p-4">
          <InterpretationBody
            content={followUp.interpretation}
            stagger
            cardTerms={cardTerms}
            positionTerms={positionTerms}
            showSigil
          />
        </div>
      )}
    </article>
  );
}
