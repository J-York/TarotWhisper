'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import spreadsData from '../../data/spreads.json'
import TarotCard from '../../components/TarotCard'

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
      const baseUrl = localStorage.getItem('tarot_api_base_url')
      const apiKey = localStorage.getItem('tarot_api_key')
      const model = localStorage.getItem('tarot_api_model') || 'gpt-4o-mini'

      if (!baseUrl || !apiKey) {
        setError('API 配置缺失，请前往设置页面配置')
        return
      }

      // 构建系统提示词
      const systemPrompt = `你是一位经验丰富、富有同情心和洞察力的塔罗牌占卜大师。
你的任务是基于用户提供的问题、选择的牌阵、以及抽到的每一张牌（包括其在牌阵中的位置、牌名和正逆位）来进行一次完整且深入的分析。

你的分析应遵循以下准则：
1. **综合解读：** 不要孤立地解释每一张牌。你需要将所有牌串联起来，讲述一个完整的故事，特别是要分析牌与牌之间的相互影响。
2. **深入位置含义：** 重点分析每张牌在其特定"位置"上的含义。例如，"死神"在"过去"和在"未来"的位置，其解读是完全不同的。
3. **结合正逆位：** 必须明确指出每张牌是正位还是逆位，并根据其正逆状态进行解读。
4. **富有同情心：** 你的语气应该是建设性、支持性和富有同理心的，即使是面对"坏牌"（如高塔、死神），也要提供积极的建议和成长的视角。
5. **不作断言：** 避免使用"你一定会..."这样的宿命论断言。使用"这可能意味着..."、"这暗示了..."或"这建议你..."等更具指导性的语言。
6. **安全边界：** 严格禁止提供任何具体的医疗、法律或金融投资建议。如果问题涉及这些领域，请将解读引向精神和心态层面，并提醒用户寻求专业人士的帮助。
7. **结构清晰：** 在分析的最后，请给出一个简洁明了的总结和建议。`

      // 构建用户提示词
      const cardsData = cards.map(drawnCard => ({
        position_name: drawnCard.position.name,
        card_name: drawnCard.card.name,
        orientation: drawnCard.isReversed ? '逆位' : '正位'
      }))

      const userPrompt = `你好，塔罗大师。我需要你的指引。

[我的问题]
${question}

[我选择的牌阵]
${spread.name}

[我抽到的牌]
${JSON.stringify({ cards: cardsData }, null, 2)}

请根据以上所有信息，为我提供详细的解读和建议。`

      // 调用 API
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          stream: true
        })
      })

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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">🔮 塔罗解读</h1>
            <p className="text-gray-300 mb-2">您的问题：{question}</p>
            <p className="text-purple-300">牌阵：{spread.name}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Cards Display */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-6 text-center">抽到的牌</h2>
              <div className="space-y-6">
                {drawnCards.map((drawnCard, index) => (
                  <div key={index} className="bg-white/10 rounded-lg p-4 border border-white/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-purple-300 font-medium">
                        {drawnCard.position.name}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded ${
                        drawnCard.isReversed 
                          ? 'bg-orange-500/20 text-orange-300' 
                          : 'bg-green-500/20 text-green-300'
                      }`}>
                        {drawnCard.isReversed ? '逆位' : '正位'}
                      </div>
                    </div>
                    
                    {/* 卡牌图片和信息 */}
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 overflow-hidden">
                        <TarotCard
                          cardId={drawnCard.card.id}
                          cardName={drawnCard.card.name}
                          englishName={drawnCard.card.englishName}
                          isReversed={drawnCard.isReversed}
                          isRevealed={true}
                          className="w-20"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <div className="text-white font-bold text-lg mb-1">
                          {drawnCard.card.name}
                        </div>
                        <div className="text-gray-300 text-sm mb-2">
                          {drawnCard.card.englishName}
                        </div>
                        <div className="text-gray-400 text-xs mb-3">
                          {drawnCard.position.description}
                        </div>
                        
                        {/* Keywords */}
                        <div>
                          <div className="text-xs text-gray-400 mb-1">关键词：</div>
                          <div className="flex flex-wrap gap-1">
                            {(drawnCard.isReversed 
                              ? drawnCard.card.reversedKeywords 
                              : drawnCard.card.uprightKeywords
                            ).slice(0, 3).map((keyword, i) => (
                              <span key={i} className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
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
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-6 text-center">塔罗解读</h2>
              
              {/* 固定高度的内容容器，防止页面晃动 */}
              <div 
                ref={analysisContainerRef}
                className="min-h-[600px] max-h-[800px] overflow-y-auto scroll-smooth"
              >
                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
                    <div className="text-red-300 font-medium mb-2">分析失败</div>
                    <div className="text-red-200 text-sm">{error}</div>
                    <button
                      onClick={() => router.push('/settings')}
                      className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-colors"
                    >
                      检查设置
                    </button>
                  </div>
                )}

                {isLoading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
                    <div className="text-white">塔罗大师正在为您解读...</div>
                    <div className="text-gray-400 text-sm mt-2">这可能需要几十秒时间</div>
                  </div>
                )}

                {analysis && (
                  <div className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-200 prose-strong:text-white prose-em:text-purple-300 prose-ul:text-gray-200 prose-ol:text-gray-200 prose-li:text-gray-200">
                    <ReactMarkdown
                      components={{
                        // 自定义样式组件
                        h1: ({children}) => <h1 className="text-2xl font-bold text-white mb-4">{children}</h1>,
                        h2: ({children}) => <h2 className="text-xl font-bold text-white mb-3 mt-6">{children}</h2>,
                        h3: ({children}) => <h3 className="text-lg font-semibold text-white mb-2 mt-4">{children}</h3>,
                        p: ({children}) => <p className="text-gray-200 leading-relaxed mb-4">{children}</p>,
                        strong: ({children}) => <strong className="text-white font-semibold">{children}</strong>,
                        em: ({children}) => <em className="text-purple-300">{children}</em>,
                        ul: ({children}) => <ul className="text-gray-200 mb-4 pl-6 space-y-1">{children}</ul>,
                        ol: ({children}) => <ol className="text-gray-200 mb-4 pl-6 space-y-1">{children}</ol>,
                        li: ({children}) => <li className="text-gray-200">{children}</li>,
                        blockquote: ({children}) => (
                          <blockquote className="border-l-4 border-purple-400 pl-4 italic text-purple-200 my-4">
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
                  <div className="text-center py-8 text-gray-400">
                    等待分析开始...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="text-center mt-8 space-x-4">
            <button
              onClick={handleNewReading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              🔮 新的占卜
            </button>
            
            <button
              onClick={() => router.push('/settings')}
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-full transition-colors duration-200"
            >
              ⚙️ 设置
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
