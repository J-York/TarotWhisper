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
      {/* Top utility bar */}
      <nav className="absolute top-0 left-0 right-0 flex justify-between items-center px-8 py-6 z-20">
        <span className="text-xs tracking-mystic text-bone-faint uppercase">Whisper</span>
        <div className="flex items-center gap-6">
          <Link
            href="/history"
            className="text-xs tracking-mystic text-bone-faint hover:text-bone uppercase transition-colors"
          >
            轨迹
          </Link>
          <button
            onClick={() => setShowSettings(true)}
            className="text-xs tracking-mystic text-bone-faint hover:text-bone uppercase transition-colors"
          >
            配置
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 anim-fade-in">
        <div className="flex flex-col items-center text-center max-w-2xl">
          <div className="anim-drift text-gold text-2xl mb-12 select-none">✦</div>

          <h1 className="text-5xl md:text-6xl font-serif text-bone mb-3 tracking-[0.18em]">
            MYSTIC TAROT
          </h1>
          <div className="rule-h-fade w-24 my-6" />
          <p className="text-bone-dim text-sm tracking-mystic uppercase mb-2">神 秘 塔 罗</p>
          <p className="text-bone-faint text-sm font-light leading-loose mb-16 max-w-md">
            聆听命运的回声，于沉默中读取星辰的低语。
          </p>

          <Link
            href="/reading"
            className="btn-ink-primary px-10 py-4 inline-flex items-center gap-3"
          >
            <span>开始占卜</span>
            <span className="text-xs">✦</span>
          </Link>

          {isLoaded && !isConfigured && !fallbackAvailable && (
            <p className="mt-10 text-xs tracking-quiet text-bone-faint">
              <span className="text-gold-dim mr-2">◇</span>
              请先于「配置」中设置 API 密钥
            </p>
          )}
        </div>

        {/* Features — three quiet pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--ink-line)] mt-32 w-full max-w-4xl border border-[var(--ink-line)]">
          <Pillar symbol="◇" title="七十八卷" subtitle="Rider–Waite Smith"
            text="大阿卡纳与小阿卡纳，完整呈现。" />
          <Pillar symbol="✦" title="圣阵牌位" subtitle="Sacred Spreads"
            text="凯尔特十字、三张牌阵、单张指引。" />
          <Pillar symbol="⊹" title="幽影神谕" subtitle="The Oracle"
            text="AI 模型穿过星纱，传回深处之声。" />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center">
        <p className="text-xs tracking-mystic text-bone-whisper uppercase">
          命运 ╱ 在等待召唤
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

function Pillar({
  symbol,
  title,
  subtitle,
  text,
}: {
  symbol: string;
  title: string;
  subtitle: string;
  text: string;
}) {
  return (
    <div className="bg-[var(--ink-deep)] p-10 flex flex-col items-start group transition-colors hover:bg-[var(--ink-veil)]">
      <span className="text-gold-dim text-xl mb-6 group-hover:text-gold transition-colors">{symbol}</span>
      <h3 className="font-serif text-bone text-lg mb-1 tracking-wider">{title}</h3>
      <p className="text-bone-whisper text-xs tracking-quiet uppercase mb-4">{subtitle}</p>
      <p className="text-bone-faint text-sm font-light leading-relaxed">{text}</p>
    </div>
  );
}
