'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState, type ReactElement } from 'react';

import { useApiConfig } from '@/hooks/useApiConfig';
import { useSettingsDialog } from '@/components/AppShell';
import { getDailyDraw } from '@/lib/tarot/daily';
import { spreads } from '@/lib/tarot/spreads';

const ENTRIES = [
  {
    href: '/reading',
    title: '开始占卜',
    en: 'Guided Reading',
    text: '写下问题，选择牌阵，亲手翻开属于你的牌。',
    glyph: '✦',
  },
  {
    href: '/agent',
    title: '神谕对话',
    en: 'Oracle Chat',
    text: '无需选牌。提出问题，让 AI 选阵、抽牌并一步步解读。',
    glyph: '☾',
  },
  {
    href: '/library',
    title: '牌典',
    en: 'Card Library',
    text: '七十八张牌的含义、关键词与正逆位对照。',
    glyph: '◇',
  },
];

export default function HomePage(): ReactElement {
  const { isLoaded, canUseApi } = useApiConfig();
  const { openSettings } = useSettingsDialog();

  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => {
    queueMicrotask(() => setToday(new Date()));
  }, []);
  const dailyDraw = useMemo(() => (today ? getDailyDraw(today) : null), [today]);

  const needsSetup = isLoaded && !canUseApi;

  return (
    <main id="main-content" className="page-container page-main">
      {/* ─── Hero ─── */}
      <section className="grid items-center gap-12 pt-6 md:grid-cols-[1.15fr_0.85fr] md:gap-16 md:pt-12">
        <div className="anim-veil-rise">
          <p className="eyebrow">Tarot Whisper · 神秘塔罗</p>
          <h1 className="mt-5 font-heading text-[clamp(2.4rem,6vw,4rem)] leading-[1.12] tracking-[0.02em] text-bone">
            聆听命运
            <span className="text-gold"> 的回声</span>
          </h1>
          <p className="mt-6 max-w-lg font-body text-base leading-relaxed text-bone-dim md:text-[17px]">
            七十八张韦特塔罗，六种经典牌阵。写下你心中的问题，翻开牌面，
            让一段安静的解读替星辰开口。
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/reading" className="btn-ink-primary h-12 px-7">
              开始占卜
              <span aria-hidden>→</span>
            </Link>
            <Link href="/agent" className="btn-ink h-12 px-6">
              <span className="text-gold" aria-hidden>✦</span>
              与神谕对话
            </Link>
          </div>

          {needsSetup && (
            <p className="mt-5 flex flex-wrap items-center gap-2 text-sm text-bone-faint">
              <span className="text-gold-dim" aria-hidden>◇</span>
              尚未配置 API 密钥，解读功能需要先完成配置。
              <button
                type="button"
                onClick={openSettings}
                className="text-gold-warm underline decoration-[var(--gold-faint)] underline-offset-4 hover:decoration-[var(--gold)]"
              >
                现在配置
              </button>
            </p>
          )}

          <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
            {[
              { k: '78', v: '张完整牌组' },
              { k: '6', v: '种经典牌阵' },
              { k: '∞', v: '次追问解读' },
            ].map((item) => (
              <div key={item.v} className="flex items-baseline gap-2.5">
                <dt className="font-heading text-xl text-gold">{item.k}</dt>
                <dd className="text-xs tracking-wide text-bone-faint">{item.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ─── 今日一牌 ─── */}
        <div className="anim-veil-rise" style={{ animationDelay: '120ms' }}>
          {dailyDraw ? (
            <Link
              href="/daily"
              className="group relative mx-auto block w-full max-w-[320px] overflow-hidden rounded-2xl border border-[var(--ink-line)] bg-[var(--ink-veil)] p-4 transition-all duration-500 hover:-translate-y-1 hover:border-[var(--gold-faint)] hover:shadow-[0_30px_60px_-28px_rgba(0,0,0,0.9),0_0_50px_-24px_var(--gold-glow)]"
            >
              <div className="flex items-center justify-between pb-3">
                <span className="eyebrow">今日一牌 · Daily Card</span>
                <span className="grid h-6 w-6 place-items-center rounded-full border border-[var(--gold-faint)] text-[10px] text-gold-dim">
                  ✦
                </span>
              </div>
              <div className="relative aspect-[3/5] w-full overflow-hidden rounded-lg bg-[var(--ink-void)]">
                <Image
                  src={dailyDraw.card.image}
                  alt={dailyDraw.card.nameCn}
                  fill
                  sizes="(max-width: 768px) 80vw, 288px"
                  className={`object-cover transition-transform duration-700 group-hover:scale-[1.03] ${
                    dailyDraw.isReversed ? 'rotate-180' : ''
                  }`}
                  priority
                />
                {dailyDraw.isReversed && (
                  <span className="absolute right-2.5 top-2.5 rounded-full bg-[var(--ink-void)]/80 px-2 py-1 text-[10px] tracking-widest text-gold-warm">
                    逆位
                  </span>
                )}
              </div>
              <div className="pt-4">
                <p className="font-heading text-lg tracking-[0.06em] text-bone">
                  {dailyDraw.card.nameCn}
                  <span className="ml-2 font-display text-[10px] uppercase tracking-[0.2em] text-bone-faint">
                    {dailyDraw.card.name}
                  </span>
                </p>
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-bone-faint">
                  {(dailyDraw.isReversed
                    ? dailyDraw.card.keywords.reversed
                    : dailyDraw.card.keywords.upright
                  ).join(' · ')}
                </p>
              </div>
              <span className="absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--gold-dim)] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </Link>
          ) : (
            <div className="mx-auto aspect-[3/5] w-full max-w-[320px] animate-pulse rounded-2xl border border-[var(--ink-line)] bg-[var(--ink-veil)]" />
          )}
        </div>
      </section>

      {/* ─── 主要入口 ─── */}
      <section className="mt-20 md:mt-28" aria-labelledby="entries-title">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Ways to Begin</p>
            <h2 id="entries-title" className="page-title mt-3 text-[clamp(1.35rem,2.6vw,1.75rem)]">
              选择一种方式开始
            </h2>
          </div>
          <span className="hidden text-xs text-bone-faint md:block">三种入口 · 同一副牌</span>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {ENTRIES.map((entry) => (
            <Link
              key={entry.href}
              href={entry.href}
              className="group surface flex flex-col p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--gold-faint)]"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-full border border-[var(--ink-line-strong)] text-gold-dim transition-colors duration-300 group-hover:border-[var(--gold-dim)] group-hover:text-gold">
                  {entry.glyph}
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-bone-faint">{entry.en}</span>
              </div>
              <h3 className="mt-5 font-heading text-lg tracking-[0.04em] text-bone">{entry.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-bone-faint">{entry.text}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm text-gold-warm">
                进入
                <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>
                  →
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── 牌阵一览 ─── */}
      <section className="mt-16 md:mt-20" aria-labelledby="spreads-title">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Sacred Spreads</p>
            <h2 id="spreads-title" className="page-title mt-3 text-[clamp(1.35rem,2.6vw,1.75rem)]">
              六种牌阵
            </h2>
          </div>
          <Link href="/reading" className="btn-ink-ghost hidden md:inline-flex">
            去选择 →
          </Link>
        </div>

        <ul className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {spreads.map((spread) => (
            <li key={spread.id} className="surface-soft flex items-start gap-4 p-5">
              <span className="mt-0.5 grid h-11 w-9 shrink-0 place-items-center rounded border border-[var(--gold-faint)] bg-[rgba(210,178,116,0.07)] font-heading text-xs text-gold">
                {spread.positions.length}
              </span>
              <div className="min-w-0">
                <h3 className="font-heading text-[15px] tracking-[0.04em] text-bone">{spread.nameCn}</h3>
                <p className="mt-1 text-xs leading-relaxed text-bone-faint">{spread.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-20 flex flex-col items-center gap-3 border-t border-[var(--ink-line)] pt-8 text-center">
        <span className="text-gold-dim" aria-hidden>✦</span>
        <p className="text-xs tracking-[0.14em] text-bone-faint">
          所有记录与密钥仅保存在你的浏览器中 · 命运在等待召唤
        </p>
      </footer>
    </main>
  );
}
