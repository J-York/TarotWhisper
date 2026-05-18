'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ApiSettings } from '@/components/ApiSettings';
import { useApiConfig } from '@/hooks/useApiConfig';

export default function Home() {
  const { config, isLoaded, isConfigured, saveConfig } = useApiConfig();
  const [showSettings, setShowSettings] = useState(false);
  const [fallbackAvailable, setFallbackAvailable] = useState(false);

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
        <div className="flex items-center gap-10">
          <Link
            href="/history"
            className="cn-nav text-bone-dim hover:text-bone transition-colors duration-500"
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

        {/* ─── 三柱特性 · 极细分隔 ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 mt-36 w-full max-w-5xl">
          <Pillar
            symbol="◇"
            title="七十八卷"
            subtitle="Rider–Waite Smith"
            text="大阿卡纳与小阿卡纳，完整呈现于幽暗之中。"
            position="left"
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
}

function Pillar({ symbol, title, subtitle, text, position }: PillarProps) {
  // 中柱左右各加一条极细分隔线
  const dividerClass =
    position === 'middle'
      ? 'md:border-l md:border-r md:border-[var(--ink-line)]'
      : '';

  return (
    <div
      className={`group p-12 flex flex-col items-start transition-all duration-700 hover:bg-[var(--ink-veil)] ${dividerClass}`}
      style={{ transitionTimingFunction: 'var(--ease-ritual)' }}
    >
      <span className="text-gold-dim text-xl mb-8 group-hover:text-gold transition-colors duration-700">
        {symbol}
      </span>

      <h3 className="font-display text-bone text-lg mb-2 tracking-[0.18em]">
        {title}
      </h3>

      <p className="font-display text-[11px] tracking-veil uppercase text-bone-faint mb-6">
        {subtitle}
      </p>

      <div className="rule-h w-8 mb-6" />

      <p className="font-body text-bone-dim text-base leading-relaxed">
        {text}
      </p>
    </div>
  );
}
