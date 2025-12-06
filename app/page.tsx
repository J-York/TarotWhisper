'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import spreadsData from '../data/spreads.json'
import { isDefaultLlmUsable } from '@/utils/llmConfig'
import { useToast } from '@/components/Toast'
import type { Spread } from '@/types/tarot'

export default function Home() {
  const [question, setQuestion] = useState('')
  const [selectedSpread, setSelectedSpread] = useState<string>('')
  const [showApiWarning, setShowApiWarning] = useState(false)
  const router = useRouter()
  const { showToast } = useToast()
  const defaultLlmUsable = isDefaultLlmUsable()

  useEffect(() => {
    const checkApiConfig = () => {
      const apiKey = localStorage.getItem('tarot_api_key')
      const baseUrl = localStorage.getItem('tarot_api_base_url')
      const hasLocalConfig = Boolean(apiKey && baseUrl)

      setShowApiWarning(!hasLocalConfig && !defaultLlmUsable)
    }

    checkApiConfig()
  }, [defaultLlmUsable])

  const handleStartReading = () => {
    if (!question.trim()) {
      showToast('请输入您的问题', 'warning')
      return
    }

    if (!selectedSpread) {
      showToast('请选择一个牌阵', 'warning')
      return
    }

    const apiKey = localStorage.getItem('tarot_api_key')
    const baseUrl = localStorage.getItem('tarot_api_base_url')
    const hasLocalConfig = Boolean(apiKey && baseUrl)

    if (!hasLocalConfig && !defaultLlmUsable) {
      showToast('请先在设置页面配置您的 API', 'warning')
      router.push('/settings')
      return
    }

    sessionStorage.setItem('tarot_question', question)
    sessionStorage.setItem('tarot_spread', selectedSpread)

    router.push('/draw')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30">
      <div className="stars-bg" />

      {/* Ambient Background Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse-glow" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[128px] animate-pulse-glow delay-1000" />

      <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-16 space-y-6 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border-primary/30 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground/80">
            <span className="animate-pulse">✨</span> Tarot & Astrology
          </div>

          <h1 className="text-6xl md:text-7xl font-bold font-display tracking-tight">
            <span className="text-gradient-mystic block mb-2">Tarot Whisper</span>
            <span className="text-2xl md:text-3xl font-serif italic text-muted-foreground block opacity-80 mt-4">
              Listen to the wisdom of the stars
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-slate-300/80 leading-relaxed">
            探索内心的智慧，聆听塔罗的低语。输入您的问题，选择牌阵，让星辰与神秘之光为您汇聚答案。
          </p>
        </div>

        {/* API Warning */}
        {showApiWarning && (
          <div className="max-w-3xl mx-auto mb-12 animate-fade-in">
            <div className="glass-panel border-warning/30 bg-warning/5 p-6 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center text-xl">
                  ⚠️
                </div>
                <div>
                  <h3 className="font-semibold text-warning">需要配置 API</h3>
                  <p className="text-sm text-warning/80">请先配置您的 OpenAI 兼容 API 以开始占卜</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/settings')}
                className="px-6 py-2 rounded-full bg-warning/20 hover:bg-warning/30 text-warning font-medium transition-colors text-sm"
              >
                前往设置
              </button>
            </div>
          </div>
        )}

        <div className="max-w-5xl mx-auto space-y-12">
          {/* Question Input */}
          <div className="glass-panel rounded-3xl p-1 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="bg-black/40 rounded-[22px] p-6 md:p-8">
              <label htmlFor="question" className="block mb-4 text-sm font-medium uppercase tracking-widest text-primary/80">
                💭 您的问题
              </label>
              <textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="请输入您想要占卜的问题..."
                rows={3}
                className="w-full bg-transparent border-b border-white/10 text-xl md:text-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors resize-none py-4"
              />
            </div>
          </div>

          {/* Spread Selection */}
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="mb-8 flex items-center gap-3 text-xl font-display text-white">
              <span className="text-2xl">🃏</span> 选择牌阵
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {spreadsData.spreads.map((spread: Spread) => (
                <div
                  key={spread.id}
                  onClick={() => setSelectedSpread(spread.id)}
                  className={`group relative cursor-pointer rounded-2xl p-6 transition-all duration-500 ${selectedSpread === spread.id
                      ? 'bg-primary/10 border-primary/50 shadow-[0_0_30px_rgba(124,58,237,0.2)]'
                      : 'glass-panel hover:bg-white/5 hover:border-white/20'
                    } border border-transparent`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className={`text-lg font-bold mb-1 transition-colors ${selectedSpread === spread.id ? 'text-primary' : 'text-white group-hover:text-primary/80'
                        }`}>
                        {spread.name}
                      </h3>
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                        {spread.englishName}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedSpread === spread.id
                        ? 'bg-primary text-white'
                        : 'bg-white/10 text-slate-300'
                      }`}>
                      {spread.cardCount} Cards
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                    {spread.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-center gap-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <button
              onClick={handleStartReading}
              disabled={!question.trim() || !selectedSpread}
              className="group relative px-12 py-4 rounded-full bg-gradient-to-r from-primary via-purple-500 to-secondary text-white font-bold text-lg tracking-wide shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_40px_rgba(124,58,237,0.6)] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span className="relative z-10 flex items-center gap-2">
                ✨ 开始占卜 <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
              <div className="absolute inset-0 rounded-full bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <div className="flex gap-8 text-sm font-medium text-slate-400">
              <button onClick={() => router.push('/history')} className="hover:text-white transition-colors flex items-center gap-2">
                <span>📜</span> 占卜历史
              </button>
              <button onClick={() => router.push('/settings')} className="hover:text-white transition-colors flex items-center gap-2">
                <span>⚙️</span> 设置
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
