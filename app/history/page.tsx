'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { historyManager, type ReadingHistory } from '@/utils/historyManager'

export default function HistoryPage() {
  const router = useRouter()
  const [history, setHistory] = useState<ReadingHistory[]>(() => {
    if (typeof window !== 'undefined') {
      return historyManager.getAllHistory()
    }
    return []
  })

  useEffect(() => {
    // Hydration fix: ensure we have the latest data after mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory(historyManager.getAllHistory())
  }, [])

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    if (Number.isNaN(date.getTime())) {
      return '未知时间'
    }

    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const handleClear = () => {
    if (!history.length) return

    const confirmResult = window.confirm('确定要清空所有占卜历史吗？')
    if (!confirmResult) return

    try {
      historyManager.clearAllHistory()
      setHistory([])
    } catch (error) {
      console.error('清空历史记录失败:', error)
      alert('清空失败，请稍后重试。')
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30">
      <div className="stars-bg" />

      {/* Ambient Background Effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[128px] animate-pulse-glow" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[128px] animate-pulse-glow delay-700" />

      <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 space-y-6 animate-slide-up">
            <div className="inline-flex items-center justify-center gap-3">
              <span className="text-4xl animate-float">📜</span>
              <h1 className="text-4xl md:text-5xl font-bold font-display tracking-tight">
                <span className="text-gradient-mystic">占卜历史</span>
              </h1>
            </div>
            <p className="mx-auto max-w-2xl text-lg text-slate-300/80">
              回顾你与塔罗的每一次心灵对话，点击记录查看详细解读。
            </p>
          </div>

          <div className="mb-10 flex flex-wrap items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2.5 rounded-full glass-button text-sm font-medium text-slate-200 hover:text-white flex items-center gap-2"
            >
              <span>←</span> 返回首页
            </button>
            <button
              onClick={handleClear}
              disabled={!history.length}
              className="px-6 py-2.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-200 border border-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>🧹</span> 清空历史
            </button>
          </div>

          {history.length === 0 ? (
            <div className="glass-panel rounded-3xl p-12 text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-4xl animate-float">
                🔮
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                还没有占卜历史
              </h2>
              <p className="text-slate-300/80 mb-8 max-w-md mx-auto">
                前往首页提出你的问题，与塔罗再度连结，我们会为你保留每一次独特的指引。
              </p>
              <button
                onClick={() => router.push('/')}
                className="px-8 py-3 rounded-full bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/25 transition-all hover:scale-105"
              >
                ✨ 开始一次新的占卜
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              {history.map((entry, index) => (
                <div
                  key={entry.id}
                  onClick={() => router.push(`/history/${entry.id}`)}
                  className="group relative cursor-pointer overflow-hidden rounded-2xl glass-panel p-6 transition-all duration-300 hover:bg-white/5 hover:border-primary/30 hover:shadow-[0_0_30px_rgba(124,58,237,0.15)]"
                  style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                        <span className="text-xs font-medium text-slate-400 border border-white/10 px-2 py-0.5 rounded-md">
                          {entry.spreadName}
                        </span>
                      </div>
                      <h3 className="text-lg font-medium text-white truncate group-hover:text-primary-foreground transition-colors">
                        {entry.question}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm sm:text-right opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-4 group-hover:translate-x-0">
                      <span className="hidden sm:inline">查看详情</span>
                      <span className="text-lg">→</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
