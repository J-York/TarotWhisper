'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import ReactMarkdown, { type Components } from 'react-markdown'
import { historyManager } from '@/utils/historyManager'
import TarotChat from '@/components/TarotChat'
import { constructTarotPrompts } from '@/utils/prompts'
import { getDefaultLlmConfig, isDefaultLlmUsable } from '@/utils/llmConfig'
import type { ReadingHistory, ChatMessage } from '@/types/tarot'

const cx = (...classes: Array<string | undefined>) =>
    classes.filter(Boolean).join(' ')

const markdownComponents: Components = {
    h1: ({ children, className, ...props }) => (
        <h1
            {...props}
            className={cx(
                'mb-6 text-3xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-secondary',
                className
            )}
        >
            {children}
        </h1>
    ),
    h2: ({ children, className, ...props }) => (
        <h2 {...props} className={cx('mb-4 mt-8 text-2xl font-bold text-white border-b border-white/10 pb-2', className)}>
            {children}
        </h2>
    ),
    h3: ({ children, className, ...props }) => (
        <h3 {...props} className={cx('mb-3 mt-6 text-xl font-semibold text-primary-foreground', className)}>
            {children}
        </h3>
    ),
    p: ({ children, className, ...props }) => (
        <p {...props} className={cx('mb-4 leading-relaxed text-slate-300', className)}>
            {children}
        </p>
    ),
    strong: ({ children, className, ...props }) => (
        <strong {...props} className={cx('font-semibold text-white', className)}>
            {children}
        </strong>
    ),
    em: ({ children, className, ...props }) => (
        <em {...props} className={cx('text-primary not-italic', className)}>
            {children}
        </em>
    ),
    ul: ({ children, className, ...props }) => (
        <ul {...props} className={cx('mb-4 space-y-2 pl-6 text-slate-300 list-disc marker:text-primary', className)}>
            {children}
        </ul>
    ),
    ol: ({ children, className, ...props }) => (
        <ol {...props} className={cx('mb-4 space-y-2 pl-6 text-slate-300 list-decimal marker:text-primary', className)}>
            {children}
        </ol>
    ),
    li: ({ children, className, ...props }) => (
        <li {...props} className={cx('pl-1', className)}>
            {children}
        </li>
    ),
    blockquote: ({ children, className, ...props }) => (
        <blockquote
            {...props}
            className={cx(
                'my-6 border-l-4 border-primary bg-primary/5 py-4 pl-6 italic text-slate-200 rounded-r-lg',
                className
            )}
        >
            {children}
        </blockquote>
    ),
}

export default function HistoryDetailPage() {
    const router = useRouter()
    const params = useParams()
    const [reading, setReading] = useState<ReadingHistory | null>(null)
    const [loading, setLoading] = useState(true)
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
    const [apiConfig, setApiConfig] = useState<{baseUrl: string | null, apiKey: string | null, model: string}>({ baseUrl: null, apiKey: null, model: '' })

    useEffect(() => {
        if (params.id && typeof params.id === 'string') {
            const foundReading = historyManager.getReadingById(params.id)
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setReading(foundReading)
            
            if (foundReading) {
               // Construct Chat History
               const { systemPrompt, userPrompt } = constructTarotPrompts(
                  foundReading.question,
                  foundReading.spreadName,
                  foundReading.spreadId,
                  foundReading.drawnCards
               )
               setChatHistory([
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userPrompt },
                  { role: 'assistant', content: foundReading.analysis }
               ])

               // Load API Config
               const localBaseUrl = localStorage.getItem('tarot_api_base_url')?.trim() || null
               const localApiKey = localStorage.getItem('tarot_api_key')?.trim() || null
               const localModel = localStorage.getItem('tarot_api_model')?.trim() || ''
               
               const hasLocalConfig = Boolean(localBaseUrl && localApiKey)
               const defaultConfig = getDefaultLlmConfig()
               const useDefaultConfig = !hasLocalConfig && isDefaultLlmUsable()

               const effectiveModel =
                 (hasLocalConfig ? localModel : null) ??
                 (useDefaultConfig ? defaultConfig.model : null) ??
                 'gpt-4o-mini'
               
               setApiConfig({
                  baseUrl: localBaseUrl,
                  apiKey: localApiKey,
                  model: effectiveModel
               })
            }

            setLoading(false)
        }
    }, [params.id])

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
            second: '2-digit',
            hour12: false,
        }).format(date)
    }

    const handleDelete = () => {
        if (!reading) return
        const confirmResult = window.confirm('确定要删除这条占卜记录吗？')
        if (!confirmResult) return

        try {
            historyManager.deleteReading(reading.id)
            router.push('/history')
        } catch (error) {
            console.error('删除历史记录失败:', error)
            alert('删除失败，请稍后重试。')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                <div className="text-primary animate-pulse">加载中...</div>
            </div>
        )
    }

    if (!reading) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-6">
                <div className="text-2xl text-slate-400">未找到该记录</div>
                <button
                    onClick={() => router.push('/history')}
                    className="px-6 py-2.5 rounded-full glass-button text-sm font-medium text-slate-200 hover:text-white"
                >
                    返回列表
                </button>
            </div>
        )
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30">
            <div className="stars-bg" />

            {/* Ambient Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[128px] animate-pulse-glow" />

            <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8 flex items-center justify-between animate-slide-up">
                        <button
                            onClick={() => router.push('/history')}
                            className="px-4 py-2 rounded-full glass-button text-sm font-medium text-slate-300 hover:text-white flex items-center gap-2"
                        >
                            <span>←</span> 返回列表
                        </button>

                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-200 border border-red-500/20 transition-all flex items-center gap-2 text-sm"
                        >
                            <span>🗑️</span> 删除记录
                        </button>
                    </div>

                    <div className="glass-panel rounded-3xl p-8 md:p-12 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        {/* Header Info */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/10 pb-8">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold uppercase tracking-widest text-primary">
                                    <span>📅</span> {formatTimestamp(reading.timestamp)}
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                                    {reading.question}
                                </h1>
                                <div className="flex items-center gap-2 text-slate-400">
                                    <span className="text-lg">🃏</span>
                                    <span className="font-medium">{reading.spreadName}</span>
                                </div>
                            </div>
                        </div>

                        {/* Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                            {reading.drawnCards.map((card, index) => (
                                <div
                                    key={`${reading.id}-${card.position.id}-${index}`}
                                    className="group relative rounded-2xl bg-black/20 border border-white/5 p-6 transition-all duration-300 hover:bg-white/5 hover:border-primary/30 hover:shadow-[0_0_30px_rgba(124,58,237,0.1)]"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-primary/70 transition-colors">
                                            {card.position.name}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${card.isReversed
                                                ? 'bg-amber-500/10 text-amber-500'
                                                : 'bg-emerald-500/10 text-emerald-500'
                                            }`}>
                                            {card.isReversed ? 'Reversed' : 'Upright'}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary-foreground transition-colors">
                                        {card.card.name}
                                    </h3>
                                    <p className="text-xs font-medium text-slate-500 mb-4">{card.card.englishName}</p>

                                    <p className="text-sm text-slate-400 leading-relaxed mb-4 min-h-[3em]">
                                        {card.position.description}
                                    </p>

                                    <div className="flex flex-wrap gap-2 mt-auto">
                                        {(card.isReversed ? card.card.reversedKeywords : card.card.uprightKeywords)
                                            .slice(0, 3)
                                            .map((keyword, i) => (
                                                <span key={i} className="px-2 py-1 rounded-md bg-white/5 text-xs text-slate-300 border border-white/5">
                                                    {keyword}
                                                </span>
                                            ))
                                        }
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Analysis */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                                <span className="text-2xl animate-pulse">🔮</span>
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                            </div>

                            <div className="prose prose-invert max-w-none">
                                <ReactMarkdown components={markdownComponents}>
                                    {reading.analysis}
                                </ReactMarkdown>
                            </div>
                        </div>

                         {/* Chat Section */}
                         <TarotChat 
                            initialHistory={chatHistory} 
                            apiConfig={apiConfig}
                         />
                    </div>
                </div>
            </div>
        </div>
    )
}
