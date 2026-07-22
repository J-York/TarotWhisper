'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Reading, FollowUp } from '@/lib/tarot/types';
import { getReadingById, deleteReadings } from '@/lib/readingStorage';
import { Interpretation, InterpretationBody } from '@/components/Interpretation';
import { TarotCardComponent } from '@/components/TarotCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useConfirm } from '@/hooks/useConfirm';
import { ReadingDetailSkeleton } from '@/components/Skeletons';

interface PageProps {
  params: Promise<{ id: string }>;
}

const CN_NUMERALS = ['壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖', '拾'];

export default function ReadingDetailPage({ params }: PageProps) {
  const [reading, setReading] = useState<Reading | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();
  const { dialog, confirm, handleConfirm, handleCancel } = useConfirm();

  useEffect(() => {
    params.then((resolvedParams) => {
      const loadedReading = getReadingById(resolvedParams.id);
      setReading(loadedReading || null);
      setIsLoaded(true);
    });
  }, [params]);

  const handleDelete = async (): Promise<void> => {
    if (!reading) return;

    const ok = await confirm({
      title: '删 除 记 录',
      message: '此 次 占 卜 的 轨 迹 将 永 远 消 失 ， 不 可 被 唤 回 。',
      confirmLabel: '删 除',
      cancelLabel: '保 留',
      tone: 'danger',
    });
    if (!ok) return;

    deleteReadings([reading.id]);
    router.push('/history');
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hour}:${minute}`;
  };

  if (!isLoaded) {
    return <ReadingDetailSkeleton />;
  }

  if (!reading) {
    return (
      <div className="min-h-screen flex items-center px-8 md:px-16">
        <div className="relative max-w-xl anim-veil-rise">
          <span className="absolute -top-16 -left-6 text-[10rem] leading-none text-bone-whisper opacity-40 select-none pointer-events-none anim-drift">
            ✧
          </span>
          <div className="relative pt-20 pl-4">
            <p className="text-tiny font-heading text-bone-faint tracking-veil uppercase mb-6">
              Lost to the Void
            </p>
            <h3 className="font-heading text-2xl text-bone-dim mb-5 tracking-[0.2em]">
              记 录 不 存 在
            </h3>
            <p className="font-body italic-soft text-bone-faint text-lg leading-relaxed mb-10">
              该占卜已消失在虚空中，星辰不再记得它的轨迹。
            </p>
            <Link href="/history" className="btn-ink-primary inline-block px-12 py-3.5">
              返 回 轨 迹
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col px-6 md:px-10 py-10 md:py-12">
      {/* ─── Nav · 返回轨迹 ─── */}
      <header className="relative z-20 max-w-7xl w-full mx-auto flex items-center justify-between">
        <Link
          href="/history"
          className="text-bone-dim hover:text-bone transition-colors duration-500 flex items-center gap-4 group"
          style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
        >
          <span
            className="text-base group-hover:-translate-x-1 transition-transform duration-700"
            style={{ transitionTimingFunction: 'var(--ease-veil)' }}
          >
            ←
          </span>
          <span className="cn-nav">轨 迹</span>
        </Link>

        <button onClick={handleDelete} className="btn-ink-ghost">
          删 除 记 录
        </button>
      </header>

      <main className="relative z-10 flex-1">
        {/* ─── 开卷 · 问题即标题 ─── */}
        <section className="relative max-w-6xl mx-auto mt-14 md:mt-20 mb-24 md:mb-28 anim-veil-rise">
          {/* 背景光弧 + 星尘 */}
          <div className="arc-glow w-[36rem] h-[36rem] -top-48 -right-48 hidden lg:block" />
          <span className="scatter-symbol text-xl top-4 right-[14%] anim-twinkle hidden md:block">✧</span>
          <span
            className="scatter-symbol text-2xl top-36 right-[3%] anim-drift hidden md:block"
            style={{ animationDelay: '1s' }}
          >
            ☽
          </span>

          {/* 卷首行 */}
          <div className="flex items-center gap-5 mb-10 md:mb-12">
            <span className="text-tiny font-heading text-gold-dim tracking-veil uppercase">
              Reading Archive
            </span>
            <span className="rule-h-gold w-24 md:w-40" />
            <span className="text-tiny font-heading text-bone-faint tracking-quiet">
              {formatDate(reading.createdAt)}
            </span>
          </div>

          {/* 问题 · 巨型左倾 */}
          <h1 className="text-massive font-body italic-soft text-bone max-w-5xl">
            <span
              aria-hidden="true"
              className="align-top mr-4 md:mr-6 inline-block text-[0.4em] text-gold not-italic anim-twinkle"
            >
              ✦
            </span>
            {reading.question || '未 记 录 问 题'}
          </h1>

          {/* 版权行 · 牌阵档案 */}
          <div className="mt-12 md:mt-14 flex flex-col md:flex-row md:items-end gap-7 md:gap-14">
            <div>
              <p className="cn-hint text-bone-faint tracking-veil mb-2.5">牌 阵</p>
              <p className="font-heading text-xl text-bone tracking-[0.12em]">
                {reading.spread.nameCn}
                <span className="text-bone-whisper text-sm ml-3">/ {reading.spread.name}</span>
              </p>
            </div>
            <div className="hidden md:block rule-v self-stretch" />
            <div>
              <p className="cn-hint text-bone-faint tracking-veil mb-2.5">抽 牌</p>
              <p className="font-heading text-xl text-bone">
                {reading.drawnCards.length} 张
              </p>
            </div>
            <div className="hidden md:block rule-v self-stretch" />
            <p className="font-body italic-soft text-bone-faint leading-relaxed max-w-md md:pb-1">
              {reading.spread.description}
            </p>
          </div>
        </section>

        {/* ─── 抽取的牌 · 横向卷轴 ─── */}
        <section className="relative max-w-6xl mx-auto mb-24 md:mb-28 anim-veil-rise">
          <div className="flex items-center gap-5 mb-4">
            <span className="text-gold anim-drift">✦</span>
            <h2 className="font-heading text-xl md:text-2xl text-bone tracking-mystic uppercase">
              抽 取 的 牌
            </h2>
            <div className="rule-h-gold flex-1" />
            <span className="cn-hint text-bone-faint tracking-veil hidden md:inline">
              ⟵ 滑 动 翻 阅 ⟶
            </span>
          </div>

          {/* 出血滚动条 · 突破栏宽，边缘羽化 */}
          <div className="bleed-left bleed-right overflow-x-auto snap-x [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
            <div className="flex w-max gap-10 md:gap-16 py-12">
              {reading.drawnCards.map((drawn, index) => (
                <div key={index} className="group/card shrink-0 w-52 md:w-60 snap-start">
                  <div className="float-card bg-[var(--ink-veil)] p-3.5 pb-4">
                    <TarotCardComponent
                      card={drawn.card}
                      isReversed={drawn.isReversed}
                      isRevealed={true}
                      size="md"
                    />
                  </div>
                  <div className="mt-7 text-center">
                    <p className="cn-label text-celestial mb-2.5">
                      {String(index + 1).padStart(2, '0')} · {drawn.position.nameCn}
                    </p>
                    <p className="font-body italic-soft text-xs text-bone-faint leading-relaxed line-clamp-2 px-2">
                      {drawn.position.description}
                    </p>
                    <div className="rule-h-fade w-10 mx-auto my-4" />
                    <p className="font-display text-gold text-lg tracking-[0.08em]">
                      {drawn.card.nameCn}
                    </p>
                    <p className="text-tiny font-heading text-bone-faint mt-2">
                      {drawn.card.name}
                    </p>
                    {drawn.isReversed && (
                      <p className="cn-hint text-gold-dim mt-2.5">⟲ 逆 位</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 星辰回音 · 解读 ─── */}
        <section className="relative max-w-6xl mx-auto mb-24 md:mb-28">
          <div className="flex items-center gap-5 mb-10">
            <span className="text-gold anim-drift">✦</span>
            <h2 className="font-heading text-xl md:text-2xl text-bone tracking-mystic uppercase">
              星 辰 回 音
            </h2>
            <div className="rule-h-gold flex-1" />
          </div>

          {reading.interpretation ? (
            <div className="chat-bubble-oracle p-8 md:p-14 lg:px-16 lg:py-14 anim-curtain">
              <ReadingInterpretation reading={reading} />
            </div>
          ) : (
            <div className="ink-panel-quiet p-10 md:p-12">
              <p className="font-body italic-soft text-bone-faint text-lg">
                此次占卜未留下解读，星辰的低语散入了虚空。
              </p>
            </div>
          )}
        </section>

        {/* ─── 追问回声 · 月蓝脉络 ─── */}
        {reading.followUps && reading.followUps.length > 0 && (
          <section className="relative max-w-6xl mx-auto pb-8">
            <div className="flex items-center gap-5 mb-14">
              <span className="text-celestial anim-twinkle">◆</span>
              <h2 className="font-heading text-xl md:text-2xl text-bone tracking-mystic uppercase">
                追 问 回 声
              </h2>
              <div className="rule-h-celestial flex-1" />
              <span className="cn-hint text-bone-faint tracking-veil">
                {reading.followUps.length} 次
              </span>
            </div>

            <div className="space-y-16 md:space-y-20">
              {reading.followUps.map((fu, i) => (
                <FollowUpRecord key={fu.id} followUp={fu} reading={reading} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* ─── 卷尾 ─── */}
        <footer className="relative max-w-6xl mx-auto mt-20 pt-8 pb-4 hairline-top flex items-center justify-between">
          <span className="text-tiny font-heading text-bone-whisper tracking-veil uppercase">
            Reading Archive · {formatDate(reading.createdAt)}
          </span>
          <span className="text-gold-dim text-sm anim-whisper">✦</span>
        </footer>
      </main>

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
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ReadingInterpretation · 关键词高亮的解读正文
   ═══════════════════════════════════════════════════════════════ */

function ReadingInterpretation({ reading }: { reading: Reading }) {
  const cardTerms = useMemo<string[]>(
    () => reading.drawnCards.flatMap((d) => [d.card.nameCn, d.card.name]),
    [reading]
  );
  const positionTerms = useMemo<string[]>(
    () => reading.spread.positions.map((p) => p.nameCn),
    [reading]
  );
  return (
    <Interpretation
      content={reading.interpretation || ''}
      isLoading={false}
      error={null}
      staggerOnMount
      cardTerms={cardTerms}
      positionTerms={positionTerms}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════
   FollowUpRecord · 一次追问 = 一段月蓝色的回声
   ═══════════════════════════════════════════════════════════════ */

interface FollowUpRecordProps {
  followUp: FollowUp;
  reading: Reading;
  index: number;
}

function FollowUpRecord({ followUp, reading, index }: FollowUpRecordProps) {
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

  const numeral = CN_NUMERALS[index] ?? String(index + 1);

  return (
    <section className="relative anim-veil-rise">
      {/* 月蓝书脊 · 与主解读的金脉区分 */}
      <div className="relative pl-8 md:pl-12 border-l border-[var(--celestial-faint)]">
        <span className="absolute -left-[5px] top-1 w-2.5 h-2.5 rotate-45 bg-[var(--ink-deep)] border border-[var(--celestial-dim)]" />

        {/* 回声编号 */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-tiny font-heading text-celestial tracking-veil uppercase">
            Echo {String(index + 1).padStart(2, '0')}
          </span>
          <span className="cn-label text-celestial-dim">追 问 · {numeral}</span>
          <div className="rule-h-celestial w-24 md:w-40" />
        </div>

        {/* 问句 · 求问者气泡 */}
        <div className="chat-bubble-user px-8 py-6 md:px-10 md:py-7 mb-8 max-w-3xl">
          <p className="font-body italic-soft text-bone text-lg md:text-xl leading-relaxed">
            {followUp.question}
          </p>
        </div>

        {/* 补充牌 */}
        {followUp.additionalCards.length > 0 && (
          <div className="ink-panel-quiet p-6 md:p-8 mb-8 max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-celestial-dim">◇</span>
              <span className="cn-label text-bone">
                补 充 指 引 · {followUp.additionalCards.length} 张
              </span>
              <div className="rule-h-fade flex-1" />
            </div>
            <div className="flex flex-wrap justify-center gap-8">
              {followUp.additionalCards.map((drawn) => (
                <div key={drawn.position.id} className="flex flex-col items-center gap-3">
                  <TarotCardComponent
                    card={drawn.card}
                    isReversed={drawn.isReversed}
                    isRevealed={true}
                    size="sm"
                  />
                  <span className="cn-hint text-bone-faint">
                    {drawn.card.nameCn}
                    {drawn.isReversed ? ' · 逆位' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 追问解读 */}
        {followUp.interpretation && (
          <div className="chat-bubble-oracle p-8 md:p-12">
            <InterpretationBody
              content={followUp.interpretation}
              stagger
              cardTerms={cardTerms}
              positionTerms={positionTerms}
              showSigil
            />
          </div>
        )}
      </div>
    </section>
  );
}
