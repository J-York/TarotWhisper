'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState, useEffect } from 'react';
import { ApiSettings } from '@/components/ApiSettings';
import { useApiConfig } from '@/hooks/useApiConfig';
import { getDailyDraw } from '@/lib/tarot/daily';

export default function Home() {
  const { config, isLoaded, isConfigured, fallbackAvailable, saveConfig } = useApiConfig();
  const [showSettings, setShowSettings] = useState(false);

  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => {
    queueMicrotask(() => setToday(new Date()));
  }, []);
  const dailyDraw = useMemo(() => (today ? getDailyDraw(today) : null), [today]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ─── 固定侧边导航 ─── */}
      <nav className="side-nav" aria-label="主导航">
        <Link href="/" className="text-gold text-lg anim-twinkle" aria-label="首页">
          ✦
        </Link>
        <Link
          href="/agent"
          className="text-vertical text-tiny text-bone-faint hover:text-gold transition-colors duration-500 hidden md:block"
          style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
        >
          神谕
        </Link>
        <Link
          href="/daily"
          className="text-vertical text-tiny text-bone-faint hover:text-gold transition-colors duration-500 hidden md:block"
          style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
        >
          今日
        </Link>
        <Link
          href="/library"
          className="text-vertical text-tiny text-bone-faint hover:text-gold transition-colors duration-500 hidden md:block"
          style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
        >
          牌典
        </Link>
        <Link
          href="/history"
          className="text-vertical text-tiny text-bone-faint hover:text-gold transition-colors duration-500 hidden md:block"
          style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
        >
          轨迹
        </Link>
        <button
          onClick={() => setShowSettings(true)}
          className="text-bone-whisper hover:text-gold transition-colors duration-500 text-xs"
          aria-label="配置"
        >
          ⚙
        </button>
        {/* 移动端导航 */}
        <Link href="/agent" className="cn-hint text-bone-faint md:hidden">神谕</Link>
        <Link href="/daily" className="cn-hint text-bone-faint md:hidden">今日</Link>
        <Link href="/library" className="cn-hint text-bone-faint md:hidden">牌典</Link>
        <Link href="/history" className="cn-hint text-bone-faint md:hidden">轨迹</Link>
      </nav>

      {/* ─── 散射装饰符号 ─── */}
      <span className="scatter-symbol text-4xl top-[12%] right-[18%] anim-drift" style={{ animationDelay: '0s' }} aria-hidden>◇</span>
      <span className="scatter-symbol text-2xl top-[68%] left-[15%] anim-drift" style={{ animationDelay: '2s' }} aria-hidden>✧</span>
      <span className="scatter-symbol text-lg top-[35%] right-[42%] anim-whisper" aria-hidden>⊹</span>
      <span className="scatter-symbol text-3xl bottom-[22%] right-[12%] anim-drift" style={{ animationDelay: '4s' }} aria-hidden>✦</span>
      <span className="scatter-symbol text-xl top-[82%] left-[45%] anim-whisper" style={{ animationDelay: '1.5s' }} aria-hidden>◇</span>

      {/* ─── 背景光弧装饰 ─── */}
      <div className="arc-glow w-[600px] h-[600px] -top-[200px] -right-[100px] hidden md:block" aria-hidden />
      <div className="arc-glow w-[400px] h-[400px] bottom-[10%] left-[5%] hidden md:block" style={{ animationDirection: 'reverse', animationDuration: '80s' }} aria-hidden />

      {/* ─── 主内容区 · 偏右以避开侧边栏 ─── */}
      <main id="main-content" className="md:pl-16 relative z-10">
        {/* ─── 英雄区 · 非对称双栏 ─── */}
        <section className="min-h-screen grid grid-cols-1 md:grid-cols-[1fr_0.8fr] items-center relative px-6 md:px-12 lg:px-20 py-20">

          {/* 左栏 · 文字 */}
          <div className="flex flex-col gap-8 anim-curtain order-2 md:order-1">
            {/* 微型标签 */}
            <div className="flex items-center gap-4">
              <span className="w-8 h-px bg-[var(--gold-dim)]" />
              <span className="text-tiny text-gold-dim font-heading">
                Divination Engine
              </span>
            </div>

            {/* 巨型标题 · 左对齐 · 戏剧性字号 */}
            <h1 className="font-display text-colossal text-gold-foil">
              MYSTIC
              <br />
              <span className="text-bone" style={{ WebkitTextFillColor: 'unset', background: 'none' }}>
                TAROT
              </span>
            </h1>

            {/* 中文副标题 · 极端字号对比 */}
            <p className="font-heading text-massive text-bone-faint tracking-[0.3em] -mt-4 md:-mt-6">
              神秘塔罗
            </p>

            {/* 引语 */}
            <p className="font-body italic text-bone-dim text-lg md:text-xl leading-relaxed max-w-md mt-4">
              聆听命运的回声，于沉默中读取星辰的低语。每一张牌都是一面镜子，映射你内心深处的真相。
            </p>

            {/* CTA 区域 · 左对齐 */}
            <div className="flex items-center gap-6 mt-6">
              <Link
                href="/agent"
                className="btn-ink-primary px-10 py-4 inline-flex items-center gap-3 text-base"
              >
                <span>与神谕对话</span>
                <span className="text-gold-pale">→</span>
              </Link>
              <Link
                href="/reading"
                className="btn-ink-ghost text-sm"
              >
                开始占卜
              </Link>
            </div>

            {/* 配置提示 */}
            {isLoaded && !isConfigured && !fallbackAvailable && (
              <p className="font-body text-sm text-bone-faint italic mt-4 flex items-center gap-2">
                <span className="text-gold-dim">◇</span>
                请先于「配置」中设置 API 密钥
              </p>
            )}
          </div>

          {/* 右栏 · 巨型牌面出血 */}
          <div className="relative flex justify-center md:justify-end order-1 md:order-2 mb-12 md:mb-0">
            {dailyDraw && (
              <Link href="/daily" className="group block">
                <div className="float-card relative w-56 md:w-72 lg:w-80 aspect-[3/5] overflow-hidden">
                  <Image
                    src={dailyDraw.card.image}
                    alt={dailyDraw.card.name}
                    fill
                    sizes="(max-width: 768px) 224px, 320px"
                    className={`object-cover transition-transform duration-1000 group-hover:scale-105 ${
                      dailyDraw.isReversed ? 'rotate-180' : ''
                    }`}
                    style={{ transitionTimingFunction: 'var(--ease-veil)' }}
                    priority
                  />
                  {/* 底部信息覆层 */}
                  <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-[var(--ink-void)] via-[var(--ink-void)]/80 to-transparent">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-gold text-xs">✦</span>
                      <span className="text-tiny text-gold-dim">今日一牌</span>
                    </div>
                    <p className="font-heading text-bone text-lg tracking-[0.15em]">
                      {dailyDraw.card.nameCn}
                    </p>
                    <p className="font-body italic text-bone-faint text-sm mt-1">
                      {(dailyDraw.isReversed ? dailyDraw.card.keywords.reversed : dailyDraw.card.keywords.upright).slice(0, 3).join(' · ')}
                    </p>
                  </div>
                  {/* 逆位标记 */}
                  {dailyDraw.isReversed && (
                    <div className="absolute top-4 right-4">
                      <span className="text-tiny text-gold-dim bg-[var(--ink-void)]/70 px-2 py-1">逆位</span>
                    </div>
                  )}
                </div>
              </Link>
            )}
          </div>
        </section>

        {/* ─── 三柱特性 · 非对称错落布局 ─── */}
        <section className="px-6 md:px-12 lg:px-20 pb-32">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
            {/* 第一柱 · 宽 */}
            <FeatureBlock
              className="md:col-span-5 md:row-span-2"
              symbol="◇"
              number="78"
              title="七十八卷"
              subtitle="Rider-Waite Smith"
              text="大阿卡纳与小阿卡纳的完整宇宙，每一张牌都是一个世界的缩影。在幽暗中静静等待被唤醒。"
              href="/library"
              large
            />
            {/* 第二柱 · 窄高 */}
            <FeatureBlock
              className="md:col-span-4"
              symbol="✦"
              number="05"
              title="圣阵牌位"
              subtitle="Sacred Spreads"
              text="凯尔特十字、三张牌阵、单张指引——每种阵型都是一次与命运的对话结构。"
            />
            {/* 第三柱 · 窄 */}
            <FeatureBlock
              className="md:col-span-3"
              symbol="⊹"
              number="∞"
              title="幽影神谕"
              subtitle="The Oracle"
              text="AI 穿过星纱，传回深处之声。"
            />
            {/* 第四块 · 填充剩余空间 */}
            <div className="md:col-span-7 ink-panel-quiet p-8 md:p-10 flex items-center justify-between group hover:shadow-[0_0_48px_-16px_var(--gold-glow)] transition-shadow duration-700">
              <div>
                <p className="text-tiny text-celestial-dim font-heading mb-3">Begin Your Journey</p>
                <p className="font-body text-bone-dim text-base md:text-lg italic leading-relaxed max-w-sm">
                  无需预设，无需准备。只需带着你的疑问，让牌面为你展开命运的图景。
                </p>
              </div>
              <Link href="/agent" className="shrink-0 text-gold text-3xl group-hover:translate-x-2 transition-transform duration-700">
                →
              </Link>
            </div>
          </div>
        </section>

        {/* ─── 底部签名 ─── */}
        <footer className="px-6 md:px-12 lg:px-20 pb-12 md:pb-20">
          <div className="flex items-center justify-between">
            <span className="font-heading text-tiny text-bone-whisper">
              Whisper · MMXXVI
            </span>
            <div className="flex items-center gap-3">
              <span className="w-12 h-px bg-[var(--ink-line)]" />
              <span className="text-gold-faint text-xs anim-whisper">✦</span>
              <span className="w-12 h-px bg-[var(--ink-line)]" />
            </div>
            <span className="cn-hint text-bone-whisper hidden md:block">
              命运在等待召唤
            </span>
          </div>
        </footer>
      </main>

      <ApiSettings
        config={config}
        onSave={saveConfig}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

/* ─── 特性块组件 · 非对称尺寸 ─── */
interface FeatureBlockProps {
  className?: string;
  symbol: string;
  number: string;
  title: string;
  subtitle: string;
  text: string;
  href?: string;
  large?: boolean;
}

function FeatureBlock({ className = '', symbol, number, title, subtitle, text, href, large }: FeatureBlockProps) {
  const inner = (
    <div className={`ink-panel-quiet p-8 md:p-10 h-full flex flex-col justify-between group hover:shadow-[0_0_48px_-16px_var(--gold-glow)] transition-all duration-700 ${className}`}>
      <div>
        <div className="flex items-start justify-between mb-6">
          <span className={`text-gold-dim group-hover:text-gold transition-colors duration-500 ${large ? 'text-3xl' : 'text-xl'}`}>
            {symbol}
          </span>
          <span className="font-heading text-tiny text-bone-whisper">
            {number}
          </span>
        </div>
        <h3 className={`font-heading text-bone group-hover:text-gold-warm transition-colors duration-700 mb-2 ${large ? 'text-2xl md:text-3xl' : 'text-xl'} tracking-[0.12em]`}>
          {title}
        </h3>
        <p className="font-heading text-tiny text-bone-faint mb-5">
          {subtitle}
        </p>
      </div>
      <div>
        <div className="w-8 h-px bg-[var(--ink-line)] group-hover:bg-[var(--gold-faint)] transition-colors duration-700 mb-5" />
        <p className={`font-body text-bone-dim leading-relaxed ${large ? 'text-base md:text-lg' : 'text-sm md:text-base'}`}>
          {text}
        </p>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className={`block ${className}`}>{inner}</Link>;
  }
  return <div className={className}>{inner}</div>;
}
