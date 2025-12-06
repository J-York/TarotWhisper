'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { parseSSEStream } from '@/utils/sseParser'
import type { ChatMessage, ApiConfig } from '@/types/tarot'

interface TarotChatProps {
  initialHistory: ChatMessage[]
  apiConfig: ApiConfig
}

export default function TarotChat({ initialHistory, apiConfig }: TarotChatProps) {
  const [history, setHistory] = useState<ChatMessage[]>(initialHistory)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
     if (initialHistory.length > 0) {
        setHistory(initialHistory)
     }
  }, [initialHistory])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMsg: ChatMessage = { role: 'user', content: input.trim() }
    const newHistory = [...history, userMsg]
    setHistory(newHistory)
    setInput('')
    setIsLoading(true)

    try {
      const requestBody = {
        model: apiConfig.model || 'gpt-4o-mini',
        messages: newHistory,
        stream: true
      }

      let response: Response
      const hasLocalConfig = !!(apiConfig.baseUrl && apiConfig.apiKey)
      
      if (hasLocalConfig) {
        const normalizedBaseUrl = (apiConfig.baseUrl ?? '').replace(/\/+$/, '')
        response = await fetch(`${normalizedBaseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiConfig.apiKey}`
          },
          body: JSON.stringify(requestBody)
        })
      } else {
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })
      }

      if (!response.ok) throw new Error(`API Error: ${response.status}`)

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader')

      let assistantMsgContent = ''
      
      setHistory(prev => [...prev, { role: 'assistant', content: '' }])

      for await (const chunk of parseSSEStream(reader)) {
        const content = chunk.choices?.[0]?.delta?.content
        if (content) {
          assistantMsgContent += content
          setHistory(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'assistant', content: assistantMsgContent }
            return updated
          })
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      setHistory(prev => [...prev, { role: 'assistant', content: '⚠️ 连接断开，请重试。' }])
    } finally {
      setIsLoading(false)
    }
  }

  // Only show follow-up messages (skip system, initial user, initial analysis)
  const followUpMessages = history.slice(3)

  return (
    <div className="mt-8 border-t border-white/10 pt-8 animate-fade-in">
       <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
         <span>💬</span> 塔罗师对话
       </h3>
       
       <div className="space-y-6 mb-6 max-h-[400px] overflow-y-auto">
          {followUpMessages.map((msg, idx) => (
             <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                   msg.role === 'user'
                   ? 'bg-primary text-white rounded-br-none'
                   : 'bg-white/10 text-slate-200 rounded-bl-none'
                }`}>
                   <div className="prose prose-invert prose-sm max-w-none">
                     <ReactMarkdown>{msg.content || '...'}</ReactMarkdown>
                   </div>
                </div>
             </div>
          ))}
          {isLoading && (followUpMessages.length === 0 || followUpMessages[followUpMessages.length - 1]?.content !== '') && (
             <div className="flex justify-start">
                <div className="bg-white/10 rounded-2xl rounded-bl-none px-4 py-3">
                   <div className="flex gap-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                   </div>
                </div>
             </div>
          )}
       </div>

       <form onSubmit={handleSubmit} className="relative">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="对此次解读还有疑问？请继续提问..."
            className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 pr-12 text-white placeholder:text-slate-500 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
            disabled={isLoading}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
       </form>
    </div>
  )
}
