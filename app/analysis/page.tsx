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
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [isFetchingModels, setIsFetchingModels] = useState(false)
  const [modelMessage, setModelMessage] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [hasCustomApiConfig, setHasCustomApiConfig] = useState(false)
  const [customApiBaseUrl, setCustomApiBaseUrl] = useState<string | null>(null)
  const [customApiKey, setCustomApiKey] = useState<string | null>(null)
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

    // 检查用户是否配置了自己的API
    const localBaseUrl = localStorage.getItem('tarot_api_base_url')?.trim() || null
    const localApiKey = localStorage.getItem('tarot_api_key')?.trim() || null
    const localModel = localStorage.getItem('tarot_api_model')?.trim() || ''
    const hasLocalConfig = Boolean(localBaseUrl && localApiKey)
    setHasCustomApiConfig(hasLocalConfig)
    setCustomApiBaseUrl(localBaseUrl)
    setCustomApiKey(localApiKey)
    if (localModel) {
      setSelectedModel(localModel)
    }

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

  const performAnalysis = async (
    question: string,
    spread: Spread,
    cards: DrawnCard[],
    overrideModel?: string
  ): Promise<boolean> => {
    setAnalysis('')
    setIsLoading(true)
    setError('')

    let success = false

    try {
      const localBaseUrl = localStorage.getItem('tarot_api_base_url')?.trim() || null
      const localApiKey = localStorage.getItem('tarot_api_key')?.trim() || null
      const localModel = localStorage.getItem('tarot_api_model')?.trim() || null

      const hasLocalConfig = Boolean(localBaseUrl && localApiKey)
      const defaultConfig = getDefaultLlmConfig()
      const useDefaultConfig = !hasLocalConfig && isDefaultLlmUsable()

      setHasCustomApiConfig(hasLocalConfig)
      setCustomApiBaseUrl(localBaseUrl)
      setCustomApiKey(localApiKey)

      const trimmedOverrideModel = overrideModel?.trim() || ''
      const overrideCandidate = trimmedOverrideModel.length > 0 ? trimmedOverrideModel : null

      if (!hasLocalConfig && !useDefaultConfig) {
        setError('API 配置缺失，请前往设置页面配置')
        return false
      }

      const effectiveModel =
        overrideCandidate ??
        (hasLocalConfig ? localModel : null) ??
        (useDefaultConfig ? defaultConfig.model : null) ??
        'gpt-4o-mini'

      if (hasLocalConfig && effectiveModel) {
        localStorage.setItem('tarot_api_model', effectiveModel)
      }

      setSelectedModel(effectiveModel)

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
        model: effectiveModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        stream: true
      }

      let response: Response

      if (hasLocalConfig) {
        const normalizedBaseUrl = (localBaseUrl ?? '').replace(/\/+$/, '')
        response = await fetch(`${normalizedBaseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localApiKey}`
          },
          body: JSON.stringify(requestBody)
        })
      } else {
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

                setTimeout(() => {
                  if (analysisContainerRef.current) {
                    analysisContainerRef.current.scrollTop = analysisContainerRef.current.scrollHeight
                  }
                }, 10)
              }
            } catch {
            }
          }
        }
      }

      const hasContent = analysisText.trim().length > 0

      if (hasContent) {
        success = true
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
      success = false
    } finally {
      setIsLoading(false)
    }

    return success
  }

  const handleFetchModels = async () => {
    if (!hasCustomApiConfig || !customApiBaseUrl || !customApiKey) {
      setModelMessage('请先在设置页面配置API')
      return
    }

    setIsFetchingModels(true)
    setModelMessage(availableModels.length > 0 ? '正在刷新模型列表...' : '正在获取模型列表...')

    try {
      const normalizedBaseUrl = customApiBaseUrl.replace(/\/+$/, '')
      const response = await fetch(`${normalizedBaseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${customApiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const payload = (await response.json()) as {
          data?: Array<{ id?: string | null; name?: string | null }>
        }

        const modelIds = Array.isArray(payload.data)
          ? payload.data
            .map((item) => item?.id ?? item?.name ?? '')
            .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
          : []

        const uniqueModels = Array.from(new Set(modelIds)).sort((a, b) => a.localeCompare(b))

        if (uniqueModels.length > 0) {
          setAvailableModels(uniqueModels)
          setSelectedModel((prev) => {
            const trimmedPrev = prev.trim()
            if (trimmedPrev && uniqueModels.includes(trimmedPrev)) {
              return trimmedPrev
            }
            return uniqueModels[0] ?? ''
          })
          setModelMessage(`✅ 成功获取 ${uniqueModels.length} 个可用模型`)
        } else {
          setAvailableModels([])
          setSelectedModel('')
          setModelMessage('⚠️ 未找到可用模型')
        }
      } else {
        setAvailableModels([])
        setSelectedModel('')
        setModelMessage('❌ 获取模型列表失败，请检查配置')
      }
    } catch {
      setAvailableModels([])
      setSelectedModel('')
      setModelMessage('❌ 获取模型列表失败，请检查网络和配置')
    } finally {
      setIsFetchingModels(false)
    }
  }

  const handleReinterpret = async () => {
    if (isLoading) {
      return
    }

    if (!hasCustomApiConfig || !customApiBaseUrl || !customApiKey) {
      setModelMessage('请先在设置页面配置API')
      return
    }

    const trimmedSelection = selectedModel.trim()
    if (!trimmedSelection) {
      setModelMessage('请先选择一个模型')
      return
    }

    if (!spread || drawnCards.length === 0) {
      setModelMessage('无法重新解读：缺少卡牌数据')
      return
    }

    setSelectedModel(trimmedSelection)
    setModelMessage(`🔁 正在使用 ${trimmedSelection} 重新解读...`)

    const success = await performAnalysis(question, spread, drawnCards, trimmedSelection)

    if (success) {
      setModelMessage(`✅ 已使用 ${trimmedSelection} 完成重新解读`)
    } else {
      setModelMessage('❌ 重新解读失败，请检查模型配置或稍后重试')
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
      <div className="relative min-h-screen overflow-hidden bg-background flex items-center justify-center">
        <div className="stars-bg" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(139,92,246,0.28),transparent_60%)]" />
        <div className="relative text-center space-y-4 animate-pulse">
          <div className="relative mx-auto h-20 w-20">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary border-r-secondary"></div>
          </div>
          <div className="text-xl font-semibold text-white font-display">
            正在汇聚塔罗能量...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30">
      <div className="stars-bg" />

      {/* Ambient Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[128px] animate-pulse-glow" />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10 space-y-6 animate-slide-up">
            <div className="inline-flex items-center justify-center gap-3">
              <span className="text-4xl animate-float">🔮</span>
              <h1 className="text-4xl md:text-5xl font-bold font-display tracking-tight">
                <span className="text-gradient-mystic">塔罗解读</span>
              </h1>
            </div>

            <div className="glass-panel rounded-2xl px-8 py-6 max-w-3xl mx-auto">
              <div className="space-y-3">
                <p className="text-slate-200 text-base">
                  <span className="text-primary font-bold uppercase tracking-wider text-xs mr-2">Question</span>
                  {question}
                </p>
                <div className="h-px w-full bg-white/5" />
                <p className="text-slate-300 text-sm">
                  <span className="text-secondary font-bold uppercase tracking-wider text-xs mr-2">Spread</span>
                  {spread.name}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Cards Display */}
            <div className="glass-panel rounded-3xl p-6 flex flex-col lg:sticky lg:top-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-xl font-bold text-center text-white mb-6 font-display flex items-center justify-center gap-2">
                <span>🃏</span> 抽到的牌
              </h2>
              <div className="flex-1 space-y-5 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
                {drawnCards.map((drawnCard, index) => (
                  <div
                    key={index}
                    className="group rounded-2xl bg-black/20 border border-white/5 p-4 transition-all hover:bg-white/5 hover:border-primary/30 hover:shadow-[0_0_30px_rgba(124,58,237,0.1)]"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-sm font-bold text-slate-400 uppercase tracking-wider group-hover:text-primary/80 transition-colors">
                        {drawnCard.position.name}
                      </div>
                      <div
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${drawnCard.isReversed
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-emerald-500/10 text-emerald-500'
                          }`}
                      >
                        {drawnCard.isReversed ? 'Reversed' : 'Upright'}
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
                          className="w-full shadow-lg"
                        />
                      </div>

                      <div className="flex-1">
                        <div className="mb-1 text-lg font-bold text-white group-hover:text-primary-foreground transition-colors">
                          {drawnCard.card.name}
                        </div>
                        <div className="mb-2 text-xs font-medium text-slate-500">
                          {drawnCard.card.englishName}
                        </div>
                        <div className="mb-3 text-xs leading-relaxed text-slate-400">
                          {drawnCard.position.description}
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
                                className="rounded-md bg-white/5 border border-white/5 px-2 py-1 text-[10px] text-slate-300"
                              >
                                {keyword}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Analysis Display */}
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

                {isLoading && (
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
              </div>

              {/* Reinterpret Section */}
              {analysis && hasCustomApiConfig && (
                <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-xl">🔄</span>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        重新解读
                      </h3>
                      <p className="text-xs text-slate-400">
                        尝试使用其他模型获取不同的视角
                      </p>
                    </div>
                  </div>

                  {modelMessage && (
                    <div
                      className={`mb-4 rounded-xl border p-3 text-xs font-medium ${modelMessage.includes('成功') || modelMessage.includes('✅')
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : modelMessage.includes('❌') || modelMessage.includes('失败')
                            ? 'border-red-500/30 bg-red-500/10 text-red-400'
                            : 'border-sky-500/30 bg-sky-500/10 text-sky-400'
                        }`}
                    >
                      {modelMessage}
                    </div>
                  )}

                  <div className="space-y-4">
                    <button
                      onClick={handleFetchModels}
                      disabled={isFetchingModels || isLoading}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-white/10 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isFetchingModels
                        ? '获取中...'
                        : availableModels.length > 0
                          ? '🔁 刷新模型列表'
                          : '📋 获取模型列表'}
                    </button>

                    {availableModels.length > 0 && (
                      <div className="space-y-4 animate-fade-in">
                        <div>
                          <select
                            id="modelSelect"
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            disabled={isLoading}
                            className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 appearance-none cursor-pointer"
                          >
                            <option value="">请选择模型</option>
                            {availableModels.map((modelId) => (
                              <option key={modelId} value={modelId} className="bg-slate-900">
                                {modelId}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={handleReinterpret}
                            disabled={!selectedModel || isLoading}
                            className="flex-1 rounded-xl bg-primary hover:bg-primary/90 px-4 py-3 text-sm font-bold text-white transition-all disabled:opacity-50"
                          >
                            {isLoading ? '解读中...' : '✨ 开始解读'}
                          </button>
                          <button
                            onClick={() => {
                              setAvailableModels([])
                              setModelMessage('')
                            }}
                            disabled={isLoading}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-400 hover:text-white transition-all disabled:opacity-50"
                          >
                            隐藏
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <button
              onClick={handleNewReading}
              className="group relative px-8 py-3 rounded-full bg-gradient-to-r from-primary via-purple-500 to-secondary text-white font-bold shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] hover:scale-105 transition-all duration-300"
            >
              <span className="flex items-center gap-2">
                <span className="text-xl">🔮</span> 新的占卜
              </span>
            </button>

            <button
              onClick={() => router.push('/history')}
              className="px-8 py-3 rounded-full glass-button text-slate-200 hover:text-white font-medium flex items-center gap-2"
            >
              <span className="text-xl">📜</span> 占卜历史
            </button>

            <button
              onClick={() => router.push('/settings')}
              className="px-8 py-3 rounded-full glass-button text-slate-200 hover:text-white font-medium flex items-center gap-2"
            >
              <span className="text-xl">⚙️</span> 设置
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
