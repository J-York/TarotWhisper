import type { TarotCard, DrawnCard, ReadingHistory } from '@/types/tarot'

export type { TarotCard, DrawnCard, ReadingHistory }

const HISTORY_STORAGE_KEY = 'tarot_reading_history'
const MAX_HISTORY_ITEMS = 50

export const historyManager = {
  getAllHistory(): ReadingHistory[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY)
      if (!stored) return []
      
      const history = JSON.parse(stored) as ReadingHistory[]
      return history.sort((a, b) => b.timestamp - a.timestamp)
    } catch (error) {
      console.error('Failed to load history:', error)
      return []
    }
  },

  saveReading(
    question: string,
    spreadName: string,
    spreadId: string,
    drawnCards: DrawnCard[],
    analysis: string
  ): ReadingHistory {
    if (typeof window === 'undefined') {
      throw new Error('Cannot save history on server side')
    }

    const newReading: ReadingHistory = {
      id: `reading_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      timestamp: Date.now(),
      question,
      spreadName,
      spreadId,
      drawnCards,
      analysis,
    }

    try {
      const history = this.getAllHistory()
      const updatedHistory = [newReading, ...history].slice(0, MAX_HISTORY_ITEMS)
      
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory))
      return newReading
    } catch (error) {
      console.error('Failed to save history:', error)
      throw error
    }
  },

  deleteReading(id: string): void {
    if (typeof window === 'undefined') return

    try {
      const history = this.getAllHistory()
      const updatedHistory = history.filter(item => item.id !== id)
      
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory))
    } catch (error) {
      console.error('Failed to delete history item:', error)
      throw error
    }
  },

  clearAllHistory(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear history:', error)
      throw error
    }
  },

  getReadingById(id: string): ReadingHistory | null {
    const history = this.getAllHistory()
    return history.find(item => item.id === id) || null
  },
}
