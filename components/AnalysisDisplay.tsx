'use client'

import { RefObject } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import TarotChat from './TarotChat'
import ModelSelector from './ModelSelector'
import type { ChatMessage, ApiConfig } from '@/types/tarot'

interface AnalysisDisplayProps {
  analysis: string
  isLoading: boolean
  error: string
  chatHistory: ChatMessage[]
  hasCustomApiConfig: boolean
  customApiBaseUrl: string | null
  customApiKey: string | null
  selectedModel: string
  analysisContainerRef: RefObject<HTMLDivElement | null>
  onModelChange: (model: string) => void
  onReinterpret: (model: string) => Promise<boolean>
}

export default function AnalysisDisplay({
  analysis,
  isLoading,
  error,
  chatHistory,
  hasCustomApiConfig,
  customApiBaseUrl,
  customApiKey,
  selectedModel,
  analysisContainerRef,
  onModelChange,
  onReinterpret
}: AnalysisDisplayProps) {
  const router = useRouter()

  const apiConfig: ApiConfig = {
    baseUrl: customApiBaseUrl,
    apiKey: customApiKey,
    model: selectedModel
  }

  return (
    <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col animate-slide-up" style={{ animationDelay: '0.2s' }}>
      <h2 className="text-xl font-bold text-center text-white mb-6 font-display flex items-center justify-center gap-2">
        <span>✨</span> 塔罗解读
      </h2>

      <div
        ref={analysisContainerRef}
        className="flex-1 max-h-[calc(100vh-250px)] overflow-y-auto scroll-smooth pr-2 custom-scrollbar"
      >
        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
            <div className="mb-2 text-sm font-bold text-red-400 flex items-center gap-2">
              <span>❌</span> 分析失败
            </div>
            <div className="text-sm text-red-200/80 mb-4">{error}</div>
            <button
              onClick={() => router.push('/settings')}
              className="inline-flex rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 px-4 py-2 text-sm font-medium text-red-200 transition-all"
            >
              检查设置
            </button>
          </div>
        )}

        {isLoading && !analysis && (
          <div className="py-20 text-center">
            <div className="relative mx-auto mb-8 h-20 w-20">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary border-r-secondary"></div>
            </div>
            <div className="mb-3 text-lg font-bold text-white animate-pulse">
              塔罗大师正在为您解读...
            </div>
            <div className="text-sm text-slate-400">
              这可能需要几十秒时间，请耐心等待星辰的指引
            </div>
          </div>
        )}

        {analysis && (
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="mb-6 text-2xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-secondary">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="mb-4 mt-8 text-xl font-bold text-white border-b border-white/10 pb-2">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mb-3 mt-6 text-lg font-bold text-primary-foreground">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="mb-4 leading-relaxed text-slate-300">
                    {children}
                  </p>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-white">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="text-primary not-italic">{children}</em>
                ),
                ul: ({ children }) => (
                  <ul className="mb-4 space-y-2 pl-6 text-slate-300 list-disc marker:text-primary">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-4 space-y-2 pl-6 text-slate-300 list-decimal marker:text-primary">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="pl-1">{children}</li>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="my-6 border-l-4 border-primary bg-primary/5 py-4 pl-6 italic text-slate-200 rounded-r-lg">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {analysis}
            </ReactMarkdown>
          </div>
        )}

        {!isLoading && !error && !analysis && (
          <div className="py-20 text-center text-slate-500">
            等待分析开始...
          </div>
        )}

        {/* Chat Section */}
        {analysis && (
          <TarotChat
            initialHistory={chatHistory}
            apiConfig={apiConfig}
          />
        )}

        {/* Reinterpret Section */}
        {analysis && (
          <ModelSelector
            hasCustomApiConfig={hasCustomApiConfig}
            customApiBaseUrl={customApiBaseUrl}
            customApiKey={customApiKey}
            selectedModel={selectedModel}
            isAnalysisLoading={isLoading}
            onModelChange={onModelChange}
            onReinterpret={onReinterpret}
          />
        )}
      </div>
    </div>
  )
}
