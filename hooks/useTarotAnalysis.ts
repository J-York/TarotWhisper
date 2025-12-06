'use client'

import { useState, useRef, useCallback } from 'react'
import { getDefaultLlmConfig, isDefaultLlmUsable } from '@/utils/llmConfig'
import { historyManager } from '@/utils/historyManager'
import { constructTarotPrompts } from '@/utils/prompts'
import { parseSSEStream } from '@/utils/sseParser'
import type { DrawnCard, Spread, ChatMessage } from '@/types/tarot'

interface ApiConfigState {
  hasCustomApiConfig: boolean
  customApiBaseUrl: string | null
  customApiKey: string | null
  selectedModel: string
}

interface AnalysisState {
  analysis: string
  isLoading: boolean
  error: string
  chatHistory: ChatMessage[]
}

export function useTarotAnalysis() {
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    analysis: '',
    isLoading: false,
    error: '',
    chatHistory: []
  })

  const [apiConfig, setApiConfig] = useState<ApiConfigState>({
    hasCustomApiConfig: false,
    customApiBaseUrl: null,
    customApiKey: null,
    selectedModel: ''
  })

  const analysisContainerRef = useRef<HTMLDivElement>(null)

  const loadApiConfig = useCallback(() => {
    const localBaseUrl = localStorage.getItem('tarot_api_base_url')?.trim() || null
    const localApiKey = localStorage.getItem('tarot_api_key')?.trim() || null
    const localModel = localStorage.getItem('tarot_api_model')?.trim() || ''
    const hasLocalConfig = Boolean(localBaseUrl && localApiKey)

    setApiConfig({
      hasCustomApiConfig: hasLocalConfig,
      customApiBaseUrl: localBaseUrl,
      customApiKey: localApiKey,
      selectedModel: localModel
    })

    return { localBaseUrl, localApiKey, localModel, hasLocalConfig }
  }, [])

  const setSelectedModel = useCallback((model: string) => {
    setApiConfig(prev => ({ ...prev, selectedModel: model }))
  }, [])

  const performAnalysis = useCallback(async (
    question: string,
    spread: Spread,
    cards: DrawnCard[],
    overrideModel?: string
  ): Promise<boolean> => {
    setAnalysisState(prev => ({
      ...prev,
      analysis: '',
      isLoading: true,
      error: '',
      chatHistory: []
    }))

    let success = false

    try {
      const localBaseUrl = localStorage.getItem('tarot_api_base_url')?.trim() || null
      const localApiKey = localStorage.getItem('tarot_api_key')?.trim() || null
      const localModel = localStorage.getItem('tarot_api_model')?.trim() || null

      const hasLocalConfig = Boolean(localBaseUrl && localApiKey)
      const defaultConfig = getDefaultLlmConfig()
      const useDefaultConfig = !hasLocalConfig && isDefaultLlmUsable()

      setApiConfig(prev => ({
        ...prev,
        hasCustomApiConfig: hasLocalConfig,
        customApiBaseUrl: localBaseUrl,
        customApiKey: localApiKey
      }))

      const trimmedOverrideModel = overrideModel?.trim() || ''
      const overrideCandidate = trimmedOverrideModel.length > 0 ? trimmedOverrideModel : null

      if (!hasLocalConfig && !useDefaultConfig) {
        setAnalysisState(prev => ({
          ...prev,
          error: 'API 配置缺失，请前往设置页面配置',
          isLoading: false
        }))
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

      setApiConfig(prev => ({ ...prev, selectedModel: effectiveModel }))

      const { systemPrompt, userPrompt } = constructTarotPrompts(
        question,
        spread.name,
        spread.id,
        cards
      )

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

      for await (const chunk of parseSSEStream(reader)) {
        const content = chunk.choices?.[0]?.delta?.content
        if (content) {
          analysisText += content
          setAnalysisState(prev => ({ ...prev, analysis: analysisText }))
        }
      }

      const hasContent = analysisText.trim().length > 0

      if (hasContent) {
        success = true
        setAnalysisState(prev => ({
          ...prev,
          chatHistory: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
            { role: 'assistant', content: analysisText }
          ]
        }))

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
      setAnalysisState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '分析过程中出现未知错误'
      }))
      success = false
    } finally {
      setAnalysisState(prev => ({ ...prev, isLoading: false }))
    }

    return success
  }, [])

  return {
    ...analysisState,
    ...apiConfig,
    analysisContainerRef,
    loadApiConfig,
    setSelectedModel,
    performAnalysis
  }
}
