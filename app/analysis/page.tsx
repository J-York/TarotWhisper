'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import spreadsData from '../../data/spreads.json'
import TarotCard from '../../components/TarotCard'
import { getDefaultLlmConfig, isDefaultLlmUsable } from '@/utils/llmConfig'
import { historyManager } from '@/utils/historyManager'

interface TarotCard {
  id: string | number
  name: string
  englishName: string
  suit: string
  uprightKeywords: string[]
  reversedKeywords: string[]
}

interface DrawnCard {
  card: TarotCard
  isReversed: boolean
  position: {
    id: number
    name: string
    description: string
  }
}

interface Spread {
  id: string
  name: string
  englishName: string
  description: string
  cardCount: number
  positions: Array<{
    id: number
    name: string
    description: string
  }>
}

export default function AnalysisPage() {
  const [question, setQuestion] = useState('')
  const [spread, setSpread] = useState<Spread | null>(null)
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([])
  const [analysis, setAnalysis] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const analysisContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 从 sessionStorage 获取数据
    const savedQuestion = sessionStorage.getItem('tarot_question')
    const savedSpreadId = sessionStorage.getItem('tarot_spread')
    const savedDrawnCards = sessionStorage.getItem('tarot_drawn_cards')
    
    if (!savedQuestion || !savedSpreadId || !savedDrawnCards) {
      router.push('/')
      return
    }

    setQuestion(savedQuestion)
    
    // 找到对应的牌阵
    const selectedSpread = spreadsData.spreads.find(s => s.id === savedSpreadId)
    if (!selectedSpread) {
      router.push('/')
      return
    }
    setSpread(selectedSpread)

    try {
      const cards = JSON.parse(savedDrawnCards) as DrawnCard[]
      setDrawnCards(cards)
      
      // 自动开始分析
      performAnalysis(savedQuestion, selectedSpread, cards)
    } catch (error) {
      console.error('解析抽牌数据失败:', error)
      router.push('/')
    }
  }, [router])

  const performAnalysis = async (question: string, spread: Spread, cards: DrawnCard[]) => {
    setIsLoading(true)
    setError('')

    try {
      // 从 localStorage 获取 API 配置
      const localBaseUrl = localStorage.getItem('tarot_api_base_url')?.trim() || null
      const localApiKey = localStorage.getItem('tarot_api_key')?.trim() || null
      const localModel = localStorage.getItem('tarot_api_model')?.trim() || null

      const hasLocalConfig = Boolean(localBaseUrl && localApiKey)
      const defaultConfig = getDefaultLlmConfig()
      const useDefaultConfig = !hasLocalConfig && isDefaultLlmUsable()

      if (!hasLocalConfig && !useDefaultConfig) {
        setError('API 配置缺失，请前往设置页面配置')
        return
      }

      const model =
        (hasLocalConfig ? localModel : null) ??
        (useDefaultConfig ? defaultConfig.model : null) ??
        'gpt-4o-mini'

      // 构建系统提示词
      const systemPrompt = `你是一位专业的塔罗占卜师，具备深厚的神秘学知识和丰富的解读经验。
请基于用户的问题、所选牌阵、以及抽到的每一张牌（位置、牌名与正/逆位）进行准确而深入的整合解读。

解读原则（非常重要）：
- 保持客观中立，如实反映每张牌的含义，无论是正面还是负面信息。
- 对于逆位牌或负面牌义，不要刻意美化或回避，而要诚实地指出潜在的挑战、阻碍或警示。
- 适量使用符合情境的表情符号（如 ✨🌙🔮🌟），但保持专业度，避免过度使用。
- 提供平衡的视角：既要指出困难和挑战，也要给出建设性的应对建议。
- 明确塔罗解读仅供参考，最终的决定权在求问者手中。

解读方法：
1. 综合叙事：将所有牌连成一个完整的故事，展现它们之间的关联与发展脉络。
2. 位置语境：严格按照每张牌在牌阵中的位置来解释其特定含义。
3. 正逆位准确性：准确区分正位与逆位的不同含义，逆位时要如实反映其阻滞、内化或负面的特质。
4. 平衡表述：使用"这表明…/这揭示…/这警示…"等客观表述，避免过度乐观或悲观。
5. 专业边界：不提供医疗、法律或具体投资建议；涉及相关领域时，建议咨询专业人士。
6. 结构清晰：使用明确的小标题和条列，便于理解。

输出结构：
- 整体能量分析与核心主题
- 逐张牌的位置解读（明确标注牌名与正/逆位）
- 牌组间的互动关系与发展趋势
- 实用建议与行动指导
- 专业总结（强调塔罗为参考工具，决策权在个人）`

      // 构建用户提示词
      const cardsData = cards.map(drawnCard => ({
        position_name: drawnCard.position.name,
        card_name: drawnCard.card.name,
        orientation: drawnCard.isReversed ? '逆位' : '正位'
      }))

      const userPrompt = `请为我进行专业的塔罗解读 🔮

[我的问题]
${question}

[我选择的牌阵]
${spread.name}

[我抽到的牌]
${JSON.stringify({ cards: cardsData }, null, 2)}

请依据以上信息，以中文给出准确而深入的整合解读：既要有整体的故事脉络，也要有每张牌在对应位置的具体含义与建议。请如实反映每张牌的含义，包括负面信息和挑战，并提供平衡的视角和建设性的建议。最后请提醒：塔罗解读仅供参考，最终决策权在我手中。`

      const requestBody = {
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        stream: true
      }

      let response: Response

      if (hasLocalConfig) {
        // 用户使用自己的配置，直接从客户端请求
        response = await fetch(`${localBaseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localApiKey}`
          },
          body: JSON.stringify(requestBody)
        })
      } else {
        // 使用默认配置，通过服务器代理
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        })
      }

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status} ${response.statusText}`)
      }

      // 处理流式响应
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法读取响应流')
      }

      let analysisText = ''
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                analysisText += content
                setAnalysis(analysisText)
                
                // 自动滚动到底部
                setTimeout(() => {
                  if (analysisContainerRef.current) {
                    analysisContainerRef.current.scrollTop = analysisContainerRef.current.scrollHeight
                  }
                }, 10)
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }

      // 分析完成后保存到历史记录
      if (analysisText) {
        try {
          historyManager.saveReading(
            question,
            spread.name,
            spread.id,
            cards,
            analysisText
          )
        } catch (error) {
          console.error('保存历史记录失败:', error)
        }
      }

    } catch (error) {
      console.error('分析失败:', error)
      setError(error instanceof Error ? error.message : '分析过程中出现未知错误')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewReading = () => {
    // 清除 sessionStorage
    sessionStorage.removeItem('tarot_question')
    sessionStorage.removeItem('tarot_spread')
    sessionStorage.removeItem('tarot_drawn_cards')
    router.push('/')
  }

  if (!spread || drawnCards.length === 0) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#050311] flex items-center justify-center">
        <div className="stars-bg" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(139,92,246,0.28),transparent_60%)]" />
        <div className="relative text-center space-y-4">
          <div className="relative mx-auto h-20 w-20">
            <div className="absolute inset-0 rounded-full border-4 border-purple-500/20"></div>
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-purple-400 border-r-pink-400"></div>
          </div>
          <div className="text-xl font-semibold text-white font-[var(--font-display)]">
            正在汇聚塔罗能量...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050311] text-slate-100">
      <div className="stars-bg" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.28),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(56,189,248,0.18),transparent_60%)]" />
      <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-purple-500/25 blur-[140px] animate-mystical-gradient" />
      <div className="absolute bottom-[-180px] right-[-120px] h-[520px] w-[520px] rounded-full bg-indigo-500/20 blur-[180px] animate-mystical-gradient" />

      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10 space-y-4">
              <div className="inline-flex items-center justify-center gap-3">
                <span className="text-4xl">🔮</span>
                <h1 className="text-3xl md:text-4xl font-semibold font-[var(--font-display)] text-transparent bg-clip-text bg-gradient-to-r from-purple-100 via-violet-200 to-pink-200 drop-shadow-[0_10px_40px_rgba(124,58,237,0.45)]">
                  塔罗解读
                </h1>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-xl shadow-[0_20px_60px_rgba(76,29,149,0.35)] max-w-3xl mx-auto">
                <p className="text-slate-200/90 text-sm mb-2">
                  <span className="text-purple-200 font-medium">您的问题：</span>
                  {question}
                </p>
                <p className="text-purple-200/80 text-sm">
                  <span className="text-pink-200 font-medium">牌阵：</span>
                  {spread.name}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Cards Display */}
              <div className="rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_35px_120px_rgba(76,29,149,0.45)] backdrop-blur-xl flex flex-col lg:sticky lg:top-8">
                <h2 className="text-xl font-semibold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-100 to-pink-100 mb-6 font-[var(--font-display)]">
                  抽到的牌
                </h2>
                <div className="flex-1 space-y-5 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
                  {drawnCards.map((drawnCard, index) => (
                    <div
                      key={index}
                      className="group rounded-2xl border border-white/10 bg-black/20 p-4 transition-all hover:border-purple-300/40 hover:shadow-[0_15px_45px_rgba(124,58,237,0.3)]"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="text-sm font-medium text-purple-200">
                          {drawnCard.position.name}
                        </div>
                        <div
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            drawnCard.isReversed
                              ? 'bg-amber-500/20 text-amber-200'
                              : 'bg-emerald-500/20 text-emerald-200'
                          }`}
                        >
                          {drawnCard.isReversed ? '逆位' : '正位'}
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-20 flex-shrink-0">
                          <TarotCard
                            cardId={drawnCard.card.id}
                            cardName={drawnCard.card.name}
                            englishName={drawnCard.card.englishName}
                            isReversed={drawnCard.isReversed}
                            isRevealed={true}
                            className="w-full"
                          />
                        </div>

                        <div className="flex-1">
                          <div className="mb-1 text-base font-bold text-white">
                            {drawnCard.card.name}
                          </div>
                          <div className="mb-2 text-xs text-purple-200/70">
                            {drawnCard.card.englishName}
                          </div>
                          <div className="mb-3 text-xs leading-relaxed text-slate-300/70">
                            {drawnCard.position.description}
                          </div>

                          <div>
                            <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                              关键词
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {(drawnCard.isReversed
                                ? drawnCard.card.reversedKeywords
                                : drawnCard.card.uprightKeywords
                              )
                                .slice(0, 3)
                                .map((keyword, i) => (
                                  <span
                                    key={i}
                                    className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[11px] text-purple-200"
                                  >
                                    {keyword}
                                  </span>
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            </div>

            {/* Analysis Display */}
            <div className="rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_35px_120px_rgba(76,29,149,0.45)] backdrop-blur-xl flex flex-col">
              <h2 className="text-xl font-semibold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-100 to-pink-100 mb-6 font-[var(--font-display)]">
                塔罗解读
              </h2>

              <div
                ref={analysisContainerRef}
                className="flex-1 max-h-[calc(100vh-250px)] overflow-y-auto scroll-smooth pr-2"
              >
                {error && (
                  <div className="mb-6 rounded-2xl border border-red-400/40 bg-red-500/10 p-4 shadow-[0_15px_40px_rgba(220,38,38,0.3)]">
                    <div className="mb-2 text-sm font-semibold text-red-200">
                      分析失败
                    </div>
                    <div className="text-sm text-red-100/80">{error}</div>
                    <button
                      onClick={() => router.push('/settings')}
                      className="mt-3 inline-flex rounded-full bg-gradient-to-r from-red-500 to-orange-500 px-4 py-2 text-sm font-medium text-white shadow-[0_10px_25px_rgba(220,38,38,0.35)] transition-transform hover:scale-[1.03]"
                    >
                      检查设置
                    </button>
                  </div>
                )}

                {isLoading && (
                  <div className="py-12 text-center">
                    <div className="relative mx-auto mb-6 h-16 w-16">
                      <div className="absolute inset-0 rounded-full border-4 border-purple-500/20"></div>
                      <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-purple-400 border-r-pink-400"></div>
                    </div>
                    <div className="mb-2 text-base font-semibold text-white">
                      塔罗大师正在为您解读...
                    </div>
                    <div className="text-sm text-slate-300/70">
                      这可能需要几十秒时间
                    </div>
                  </div>
                )}

                {analysis && (
                  <div className="prose prose-invert max-w-none prose-headings:font-[var(--font-display)] prose-headings:text-white prose-p:text-slate-200 prose-p:leading-relaxed prose-strong:text-white prose-em:text-purple-300 prose-ul:text-slate-200 prose-ol:text-slate-200 prose-li:text-slate-200">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => (
                          <h1 className="mb-4 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-100 to-pink-100">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="mb-3 mt-6 text-xl font-bold text-white">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="mb-2 mt-4 text-lg font-semibold text-purple-100">
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p className="mb-4 leading-relaxed text-slate-200">
                            {children}
                          </p>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-white">
                            {children}
                          </strong>
                        ),
                        em: ({ children }) => (
                          <em className="text-purple-300">{children}</em>
                        ),
                        ul: ({ children }) => (
                          <ul className="mb-4 space-y-1 pl-6 text-slate-200">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="mb-4 space-y-1 pl-6 text-slate-200">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="text-slate-200">{children}</li>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="my-4 border-l-4 border-purple-400/60 bg-purple-500/10 py-2 pl-4 italic text-purple-200 rounded-r-lg">
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
                  <div className="py-12 text-center text-slate-400">
                    等待分析开始...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleNewReading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 px-8 py-3 text-base font-semibold text-white shadow-[0_25px_65px_rgba(232,121,249,0.45)] transition-all duration-300 hover:scale-[1.04]"
            >
              <span className="text-lg">🔮</span>
              新的占卜
            </button>

            <button
              onClick={() => router.push('/history')}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-3 text-base font-medium text-slate-200 backdrop-blur transition-all hover:border-white/40 hover:bg-white/10"
            >
              <span className="text-lg">📜</span>
              占卜历史
            </button>

            <button
              onClick={() => router.push('/settings')}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-3 text-base font-medium text-slate-200 backdrop-blur transition-all hover:border-white/40 hover:bg-white/10"
            >
              <span className="text-lg">⚙️</span>
              设置
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}
