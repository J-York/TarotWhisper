'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState, useEffect } from 'react';
import { ApiSettings } from '@/components/ApiSettings';
import { useApiConfig } from '@/hooks/useApiConfig';
import { getDailyDraw } from '@/lib/tarot/daily';

export default function Home() {
  const { config, isLoaded, isConfigured, saveConfig } = useApiConfig();
  const [showSettings, setShowSettings] = useState(false);
  const [fallbackAvailable, setFallbackAvailable] = useState(false);

  /* 今日一牌 · 确定性派生，需要在客户端计算以使用本地时区
     queueMicrotask 避开 React 19 的 set-state-in-effect 告警，与 useApiConfig 使用同一约定 */
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => {
    queueMicrotask(() => setToday(new Date()));
  }, []);
  const dailyDraw = useMemo(() => (today ? getDailyDraw(today) : null), [today]);

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => setFallbackAvailable(data.fallbackAvailable))
      .catch(() => setFallbackAvailable(false));
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* ─── 顶部 utility bar ─── */}
      <nav className="absolute top-0 left-0 right-0 flex justify-between items-center px-10 py-7 z-20">
        <span className="font-display text-[11px] tracking-veil text-bone-faint uppercase">
          Whisper
        </span>
        <div className="flex items-center gap-6 md:gap-10">
          <Link
            href="/daily"
            className="cn-nav text-bone-dim hover:text-bone transition-colors duration-500"
            style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
          >
            今 日
          </Link>
          <Link
            href="/library"
            className="cn-nav text-bone-dim hover:text-bone transition-colors duration-500 hidden sm:inline"
            style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
          >
            牌 典
          </Link>
          <Link
            href="/history"
            className="cn-nav text-bone-dim hover:text-bone transition-colors duration-500 hidden sm:inline"
            style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
          >
            轨 迹
          </Link>
          <button
            onClick={() => setShowSettings(true)}
            className="cn-nav text-bone-dim hover:text-bone transition-colors duration-500"
            style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
          >
            配 置
          </button>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 anim-veil-rise">
        <div className="flex flex-col items-center text-center max-w-2xl">

          {/* 漂浮的星辰符号 */}
          <div className="anim-drift text-gold text-2xl mb-14 select-none" aria-hidden>
            ✦
          </div>

          {/* 主标题 — Cinzel 古典碑刻 */}
          <h1 className="font-display text-5xl md:text-6xl text-bone mb-2 tracking-[0.22em]">
            MYSTIC TAROT
          </h1>

          {/* 中文副标题 — Cormorant 衬线 + 间距 */}
          <p className="font-display text-sm tracking-mystic text-bone-dim mt-5">
            神 秘 塔 罗
          </p>

          {/* 金色细线分隔 */}
          <div className="rule-h-gold w-32 my-10" />

          {/* 引语 — Cormorant 斜体 */}
          <p className="font-body italic-soft text-bone-faint text-lg leading-relaxed mb-16 max-w-md">
            聆听命运的回声，于沉默中读取星辰的低语。
          </p>

          {/* 主 CTA */}
          <Link
            href="/reading"
            className="btn-ink-primary px-12 py-4 inline-flex items-center gap-4"
          >
            <span>开始占卜</span>
            <span className="text-xs">✦</span>
          </Link>

          {/* 配置提示 */}
          {isLoaded && !isConfigured && !fallbackAvailable && (
            <p className="mt-12 font-body text-sm tracking-quiet text-bone-faint italic">
              <span className="text-gold-dim mr-2">◇</span>
              请先于「配置」中设置 API 密钥
            </p>
          )}
        </div>

        {/* ─── 今日一牌 · 静谧的留存样素 ─── */}
        {dailyDraw && (
          <Link
            href="/daily"
            className="group mt-24 md:mt-28 w-full max-w-3xl flex items-center gap-7 md:gap-10 px-8 py-7 hairline hover:bg-[var(--ink-veil)] transition-all duration-700"
            style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
          >
            {/* 牌面缩略 */}
            <div className="relative shrink-0 w-16 md:w-20 aspect-[3/5] bg-[var(--ink-void)] overflow-hidden hairline transition-all duration-700 group-hover:shadow-[0_0_24px_-12px_var(--gold-glow)]"
                 style={{ transitionTimingFunction: 'var(--ease-veil)' }}>
              <Image
                src={dailyDraw.card.image}
                alt={dailyDraw.card.name}
                fill
                sizes="80px"
                className={`object-cover transition-transform duration-1000 group-hover:scale-105 ${
                  dailyDraw.isReversed ? 'rotate-180' : ''
                }`}
                style={{ transitionTimingFunction: 'var(--ease-veil)' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink-void)]/60 via-transparent to-transparent" />
            </div>

            {/* 文字块 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-gold text-sm">✦</span>
                <span className="cn-label text-gold-dim">今 日 一 牌</span>
                <span className="font-display text-[10px] tracking-veil text-bone-whisper uppercase hidden sm:inline">
                  Card of the Day
                </span>
              </div>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="font-display text-bone group-hover:text-gold text-xl tracking-[0.18em] transition-colors duration-700">
                  {dailyDraw.card.nameCn}
                </span>
                {dailyDraw.isReversed && (
                  <span className="cn-hint text-bone-whisper">· 逆 位</span>
                )}
              </div>
              <p className="font-body italic-soft text-bone-faint text-sm leading-relaxed line-clamp-1">
                {(dailyDraw.isReversed ? dailyDraw.card.keywords.reversed : dailyDraw.card.keywords.upright).slice(0, 4).join(' ╱ ')}
              </p>
            </div>

            {/* 右侧箭头 */}
            <span
              className="shrink-0 text-bone-faint group-hover:text-gold group-hover:translate-x-1 transition-all duration-700"
              style={{ transitionTimingFunction: 'var(--ease-veil)' }}
            >
              →
            </span>
          </Link>
        )}

        {/* ─── 三柱特性 · 极细分隔 ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 mt-24 md:mt-28 w-full max-w-5xl">
          <Pillar
            symbol="◇"
            title="七十八卷"
            subtitle="Rider–Waite Smith"
            text="大阿卡纳与小阿卡纳，完整呈现于幽暗之中。"
            position="left"
            href="/library"
          />
          <Pillar
            symbol="✦"
            title="圣阵牌位"
            subtitle="Sacred Spreads"
            text="凯尔特十字、三张牌阵、单张指引。"
            position="middle"
          />
          <Pillar
            symbol="⊹"
            title="幽影神谕"
            subtitle="The Oracle"
            text="AI 模型穿过星纱，传回深处之声。"
            position="right"
          />
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="py-10 text-center">
        <p className="cn-hint text-bone-whisper">
          命 运 ╱ 在 等 待 召 唤
        </p>
      </footer>

      <ApiSettings
        config={config}
        onSave={saveConfig}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

interface PillarProps {
  symbol: string;
  title: string;
  subtitle: string;
  text: string;
  position: 'left' | 'middle' | 'right';
  href?: string;
}

function Pillar({ symbol, title, subtitle, text, position, href }: PillarProps) {
  // 中柱左右各加一条极细分隔线
  const dividerClass =
    position === 'middle'
      ? 'md:border-l md:border-r md:border-[var(--ink-line)]'
      : '';

  const inner = (
    <>
      <span className="text-gold-dim text-xl mb-8 group-hover:text-gold transition-colors duration-700">
        {symbol}
      </span>

      <h3 className="font-display text-bone text-lg mb-2 tracking-[0.18em] group-hover:text-gold-warm transition-colors duration-700">
        {title}
      </h3>

      <p className="font-display text-[11px] tracking-veil uppercase text-bone-faint mb-6">
        {subtitle}
      </p>

      <div className="rule-h w-8 mb-6 group-hover:bg-[var(--gold-dim)] transition-colors duration-700" />

      <p className="font-body text-bone-dim text-base leading-relaxed">
        {text}
      </p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`group p-12 flex flex-col items-start transition-all duration-700 hover:bg-[var(--ink-veil)] ${dividerClass}`}
        style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div
      className={`group p-12 flex flex-col items-start transition-all duration-700 hover:bg-[var(--ink-veil)] ${dividerClass}`}
      style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
    >
      {inner}
    </div>
  );
}
