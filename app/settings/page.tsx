'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getDefaultLlmModel, isDefaultLlmUsable } from '@/utils/llmConfig'

export default function SettingsPage() {
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState(() => getDefaultLlmModel())
  const [isLoading, setSaveLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [isFetchingModels, setFetchingModels] = useState(false)
  const router = useRouter()
  const defaultLlmUsable = isDefaultLlmUsable()
  const trimmedBaseUrl = baseUrl.trim()
  const trimmedApiKey = apiKey.trim()
  const normalizedBaseUrl = trimmedBaseUrl.replace(/\/+$/, '')
  const hasCustomConfig = Boolean(trimmedBaseUrl && trimmedApiKey)
  const showDefaultActiveNotice = defaultLlmUsable && !hasCustomConfig

  useEffect(() => {
    // 从 localStorage 加载现有设置
    const savedBaseUrl = localStorage.getItem('tarot_api_base_url')
    const savedApiKey = localStorage.getItem('tarot_api_key')
    const savedModel = localStorage.getItem('tarot_api_model')

    if (savedBaseUrl) setBaseUrl(savedBaseUrl)
    if (savedApiKey) setApiKey(savedApiKey)
    if (savedModel) setModel(savedModel)
  }, [])

  useEffect(() => {
    setAvailableModels([])
  }, [trimmedBaseUrl, trimmedApiKey])

  const handleSave = async () => {
    if (!trimmedBaseUrl || !trimmedApiKey) {
      setMessage('请填写完整的 API 配置信息')
      return
    }

    const trimmedModel = model.trim()

    setSaveLoading(true)
    setMessage('')

    try {
      // 保存到 localStorage
      localStorage.setItem('tarot_api_base_url', trimmedBaseUrl)
      localStorage.setItem('tarot_api_key', trimmedApiKey)
      localStorage.setItem('tarot_api_model', trimmedModel)

      setModel(trimmedModel)
      setMessage('设置已保存成功！')

      // 2秒后跳转到主页
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch {
      setMessage('保存设置时出现错误，请重试')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleTestConnection = async () => {
    if (!trimmedBaseUrl || !trimmedApiKey) {
      setMessage('请先填写完整的 API 配置信息')
      return
    }

    setSaveLoading(true)
    setMessage('正在测试连接...')

    try {
      const response = await fetch(`${normalizedBaseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${trimmedApiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setMessage('✅ API 连接测试成功！')
      } else {
        setMessage('❌ API 连接测试失败，请检查配置')
      }
    } catch {
      setMessage('❌ 连接测试失败，请检查网络和配置')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleFetchModels = async () => {
    if (!trimmedBaseUrl || !trimmedApiKey) {
      setMessage('请先填写完整的 API 配置信息')
      return
    }

    setFetchingModels(true)
    setMessage('正在获取模型列表...')

    try {
      const response = await fetch(`${normalizedBaseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${trimmedApiKey}`,
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
          setMessage(`✅ 成功获取 ${uniqueModels.length} 个可用模型`)
        } else {
          setAvailableModels([])
          setMessage('⚠️ 未找到可用模型')
        }
      } else {
        setAvailableModels([])
        setMessage('❌ 获取模型列表失败，请检查配置')
      }
    } catch {
      setAvailableModels([])
      setMessage('❌ 获取模型列表失败，请检查网络和配置')
    } finally {
      setFetchingModels(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30">
      <div className="stars-bg" />

      {/* Ambient Background Effects */}
      <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[128px] animate-pulse-glow" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[128px] animate-pulse-glow delay-1000" />

      <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 text-center space-y-6 animate-slide-up">
            <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full glass-panel border-primary/30 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground/80">
              Settings
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-display tracking-tight">
              <span className="text-gradient-mystic">API 设置</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-slate-300/80">
              配置您的 OpenAI 兼容 API，让塔罗与星辰的智慧顺畅抵达。
            </p>
          </div>

          <div className="mb-8 flex justify-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2.5 rounded-full glass-button text-sm font-medium text-slate-200 hover:text-white flex items-center gap-2"
            >
              <span>←</span> 返回首页
            </button>
          </div>

          <div className="glass-panel rounded-3xl p-8 md:p-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="space-y-8">
              {showDefaultActiveNotice && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 flex gap-4 items-start">
                  <span className="text-2xl">🌟</span>
                  <div>
                    <div className="mb-1 text-sm font-bold text-emerald-400">
                      默认 LLM 已启用
                    </div>
                    <p className="text-xs leading-relaxed text-emerald-200/80">
                      当前环境提供了预设的 LLM 配置，您可以直接开始占卜，或在下方填写信息以覆盖默认设置。
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="baseUrl" className="mb-3 block text-xs font-bold uppercase tracking-widest text-primary/80">
                  API Base URL
                </label>
                <input
                  type="url"
                  id="baseUrl"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-5 py-4 text-sm text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                />
                <p className="mt-2 text-xs text-slate-400">
                  例如：https://api.openai.com/v1 或其他兼容端点
                </p>
              </div>

              <div>
                <label htmlFor="apiKey" className="mb-3 block text-xs font-bold uppercase tracking-widest text-primary/80">
                  API Key
                </label>
                <input
                  type="password"
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-5 py-4 text-sm text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                />
                <p className="mt-2 text-xs text-slate-400">
                  您的 API 密钥，以 sk- 开头
                </p>
              </div>

              <div>
                <label htmlFor="model" className="mb-3 block text-xs font-bold uppercase tracking-widest text-primary/80">
                  模型名称
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    id="model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="gpt-4o-mini"
                    className="w-full rounded-xl bg-black/40 border border-white/10 px-5 py-4 text-sm text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all sm:flex-1"
                  />
                  <button
                    onClick={handleFetchModels}
                    disabled={isFetchingModels || isLoading}
                    className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10 hover:border-white/20 transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto whitespace-nowrap"
                  >
                    {isFetchingModels ? '获取中...' : '获取模型列表'}
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  要使用的模型名称，如 gpt-4o-mini, gpt-4, claude-3-sonnet 等
                </p>
                {availableModels.length > 0 && (
                  <div className="mt-4 space-y-2 animate-fade-in">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-primary/60">
                      可用模型
                    </span>
                    <select
                      value={availableModels.includes(model) ? model : ''}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full rounded-xl bg-black/40 border border-white/10 px-5 py-4 text-sm text-white focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 appearance-none cursor-pointer"
                    >
                      <option value="">请选择模型</option>
                      {availableModels.map((modelId) => (
                        <option key={modelId} value={modelId} className="bg-slate-900">
                          {modelId}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {message && (
                <div
                  className={`rounded-xl border p-4 text-sm font-medium animate-fade-in ${message.includes('成功') || message.includes('✅')
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : message.includes('❌') || message.includes('错误') || message.includes('失败')
                        ? 'border-red-500/30 bg-red-500/10 text-red-400'
                        : 'border-sky-500/30 bg-sky-500/10 text-sky-400'
                    }`}
                >
                  {message}
                </div>
              )}

              <div className="flex flex-col gap-4 md:flex-row pt-4">
                <button
                  onClick={handleTestConnection}
                  disabled={isLoading}
                  className="flex-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 px-6 py-4 text-sm font-bold text-white transition-all hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? '测试中...' : '测试连接'}
                </button>

                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex-1 rounded-full bg-gradient-to-r from-primary via-purple-500 to-secondary px-6 py-4 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] hover:shadow-primary/40 disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? '保存中...' : '保存设置'}
                </button>
              </div>

              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-500 flex items-center gap-2">
                  <span>🔒</span> 安全与隐私
                </h3>
                <p className="text-xs leading-relaxed text-amber-200/60">
                  如果您填写自己的 API 配置，所有请求将直接从您的浏览器发送到您指定的端点，密钥仅保存在本地浏览器中。如果使用默认配置，请求将通过我们的服务器代理以保护服务端密钥安全。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
