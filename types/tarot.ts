// 塔罗牌相关类型定义

/**
 * 塔罗牌位置信息
 */
export interface Position {
  id: number
  name: string
  description: string
}

/**
 * 塔罗牌基础信息
 */
export interface TarotCard {
  id: string | number
  name: string
  englishName: string
  suit: string
  uprightKeywords: string[]
  reversedKeywords: string[]
}

/**
 * 抽取的牌（包含位置和正逆位信息）
 */
export interface DrawnCard {
  card: TarotCard
  isReversed: boolean
  position: Position
}

/**
 * 牌阵信息
 */
export interface Spread {
  id: string
  name: string
  englishName: string
  description: string
  cardCount: number
  positions: Position[]
}

/**
 * 占卜历史记录
 */
export interface ReadingHistory {
  id: string
  timestamp: number
  question: string
  spreadName: string
  spreadId: string
  drawnCards: DrawnCard[]
  analysis: string
}

/**
 * API 配置
 */
export interface ApiConfig {
  baseUrl: string | null
  apiKey: string | null
  model: string
}

/**
 * 聊天消息
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}
