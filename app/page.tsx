'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ApiSettings } from '@/components/ApiSettings';
import { useApiConfig } from '@/hooks/useApiConfig';

export default function Home() {
  const { config, isLoaded, isConfigured, saveConfig } = useApiConfig();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-8 overflow-hidden">
      {/* 装饰光效 */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[128px] pointer-events-none" />

      {/* 设置按钮 */}
      <button
        onClick={() => setShowSettings(true)}
        className="absolute top-6 right-6 p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 backdrop-blur-sm group z-20"
        title="API 设置"
      >
        <svg className="w-6 h-6 text-purple-200 group-hover:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* 历史记录按钮 */}
      <Link
        href="/history"
        className="absolute top-6 right-20 p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 backdrop-blur-sm group z-20"
        title="历史记录"
      >
        <svg className="w-6 h-6 text-purple-200 group-hover:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </Link>

      {/* 主要内容 */}
      <main className="flex flex-col items-center text-center max-w-4xl z-10">
        
        {/* Logo/Icon */}
        <div className="mb-8 relative animate-float">
          <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full" />
          <span className="relative text-8xl filter drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
            🔮
          </span>
        </div>

        {/* 标题 */}
        <h1 className="text-6xl md:text-7xl font-bold text-gold-gradient mb-2 tracking-wide drop-shadow-lg">
          Mystic Tarot
        </h1>
        <h2 className="text-2xl text-purple-200/60 font-serif mb-6 tracking-[0.2em]">神秘塔罗</h2>
        
        <div className="h-px w-32 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mb-6" />

        {/* 描述 */}
        <p className="text-lg md:text-xl text-purple-100/80 mb-12 max-w-2xl leading-relaxed font-light tracking-wide">
          揭开宇宙的奥秘。<br/>
          聆听古老智慧的指引，穿越命运的迷雾。
        </p>

        {/* 开始按钮 */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-600 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
          <Link
            href="/reading"
            className="btn-mystic relative px-12 py-5 rounded-full text-lg font-semibold tracking-wider flex items-center gap-3"
          >
            <span>开始占卜</span>
            <span className="text-amber-300">✦</span>
          </Link>
        </div>

        {/* API 状态提示 */}
        {isLoaded && !isConfigured && (
          <div className="mt-8 px-4 py-2 rounded-lg bg-amber-900/20 border border-amber-500/30 backdrop-blur-sm animate-pulse">
            <p className="text-amber-400/90 text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              设置 API 密钥以开启 AI 解读
            </p>
          </div>
        )}

        {/* 特性网格 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full">
          <div className="glass-panel p-8 rounded-2xl hover:bg-white/5 transition-colors group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🃏</div>
            <h3 className="text-xl font-serif text-amber-100 mb-2">78张完整牌组</h3>
            <p className="text-purple-200/50 text-sm font-light">
              包含大阿卡纳与小阿卡纳的完整 Rider-Waite Smith 牌组。
            </p>
          </div>
          
          <div className="glass-panel p-8 rounded-2xl hover:bg-white/5 transition-colors group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">✨</div>
            <h3 className="text-xl font-serif text-amber-100 mb-2">神圣牌阵</h3>
            <p className="text-purple-200/50 text-sm font-light">
              提供凯尔特十字、三张牌阵及单张指引等多种占卜方式。
            </p>
          </div>
          
          <div className="glass-panel p-8 rounded-2xl hover:bg-white/5 transition-colors group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">👁️</div>
            <h3 className="text-xl font-serif text-amber-100 mb-2">AI神谕</h3>
            <p className="text-purple-200/50 text-sm font-light">
              融合先进AI模型，为你提供深度、个性化的灵性解读。
            </p>
          </div>
        </div>
      </main>

      {/* 底部装饰 */}
      <footer className="absolute bottom-6 text-purple-400/30 text-xs tracking-[0.2em] font-light">
        命运在等待你的召唤
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
