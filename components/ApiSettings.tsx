'use client';

import { useState, useEffect } from 'react';
import { ApiConfig } from '@/lib/tarot/types';
import { fetchAvailableModels, ModelInfo } from '@/lib/api/llm-client';

interface ApiSettingsProps {
  config: ApiConfig;
  onSave: (config: ApiConfig) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ApiSettings({ config, onSave, isOpen, onClose }: ApiSettingsProps) {
  const [localConfig, setLocalConfig] = useState<ApiConfig>(config);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string>('');
  const [fallbackInfo, setFallbackInfo] = useState<{ available: boolean; rateLimit: number } | null>(null);

  // 同步父组件的config变化到localConfig
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  // 检查内置配置是否可用
  useEffect(() => {
    if (isOpen) {
      fetch('/api/config')
        .then(res => res.json())
        .then(data => {
          setFallbackInfo({
            available: data.fallbackAvailable,
            rateLimit: data.rateLimit,
          });
        })
        .catch(() => {
          setFallbackInfo(null);
        });
    }
  }, [isOpen]);

  const handleFetchModels = async () => {
    if (!localConfig.endpoint || !localConfig.apiKey) {
      setModelsError('请先填写 API 端点和密钥');
      return;
    }

    setIsLoadingModels(true);
    setModelsError('');

    try {
      const models = await fetchAvailableModels(localConfig.endpoint, localConfig.apiKey);
      setAvailableModels(models);
      if (models.length === 0) {
        setModelsError('未找到可用模型');
      } else {
        // 检查当前模型是否在列表中，如果不在则自动选择第一个
        const currentModelExists = models.some(m => m.id === localConfig.model);
        if (!currentModelExists) {
          setLocalConfig({ ...localConfig, model: models[0].id });
        }
      }
    } catch (error) {
      setModelsError(error instanceof Error ? error.message : '获取模型列表失败');
      setAvailableModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="glass-panel bg-[#1A0B2E]/90 rounded-2xl p-8 w-full max-w-md border border-amber-500/30 shadow-[0_0_40px_rgba(15,5,24,0.8)]">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <h2 className="text-xl font-serif text-amber-100 tracking-wide">星图配置 (API)</h2>
          </div>
          <button
            onClick={onClose}
            className="text-purple-300/50 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* 内置配置提示 */}
          {fallbackInfo?.available && (
            <div className="px-4 py-3 rounded-lg bg-indigo-900/20 border border-indigo-500/30 backdrop-blur-sm">
              <p className="text-indigo-300 text-sm flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  如果不填写配置，将使用内置 API（每小时限 {fallbackInfo.rateLimit} 次请求）。
                  配置自己的 API Key 可解除限制。
                </span>
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-amber-100/80 mb-2 uppercase tracking-wider">
              API 端点
            </label>
            <input
              type="url"
              value={localConfig.endpoint}
              onChange={(e) => setLocalConfig({ ...localConfig, endpoint: e.target.value })}
              placeholder="https://api.openai.com/v1/chat/completions"
              className="w-full px-4 py-3 bg-[#0F0518]/60 border border-purple-500/20 rounded-lg text-purple-100 placeholder-purple-500/30 focus:outline-none focus:border-amber-500/50 focus:bg-[#0F0518]/80 transition-all font-mono text-sm"
            />
            <p className="text-xs text-purple-300/40 mt-2">
              支持 OpenAI, Claude 或兼容格式
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-100/80 mb-2 uppercase tracking-wider">
              密钥
            </label>
            <input
              type="password"
              value={localConfig.apiKey}
              onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
              placeholder="sk-..."
              className="w-full px-4 py-3 bg-[#0F0518]/60 border border-purple-500/20 rounded-lg text-purple-100 placeholder-purple-500/30 focus:outline-none focus:border-amber-500/50 focus:bg-[#0F0518]/80 transition-all font-mono text-sm"
            />
            <p className="text-xs text-purple-300/40 mt-2 flex items-center gap-1">
              <span>🔒</span> 密钥仅保存在本地
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-amber-100/80 uppercase tracking-wider">
                模型名称
              </label>
              <button
                type="button"
                onClick={handleFetchModels}
                disabled={isLoadingModels || !localConfig.endpoint || !localConfig.apiKey}
                className="text-xs px-3 py-1 rounded bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                {isLoadingModels ? (
                  <>
                    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    获取中...
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    获取模型
                  </>
                )}
              </button>
            </div>
            
            {availableModels.length > 0 ? (
              <select
                value={localConfig.model}
                onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
                className="w-full px-4 py-3 bg-[#0F0518]/60 border border-purple-500/20 rounded-lg text-purple-100 focus:outline-none focus:border-amber-500/50 focus:bg-[#0F0518]/80 transition-all font-mono text-sm"
              >
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.id}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={localConfig.model}
                onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
                placeholder="gpt-4o-mini"
                className="w-full px-4 py-3 bg-[#0F0518]/60 border border-purple-500/20 rounded-lg text-purple-100 placeholder-purple-500/30 focus:outline-none focus:border-amber-500/50 focus:bg-[#0F0518]/80 transition-all font-mono text-sm"
              />
            )}
            
            {modelsError && (
              <p className="text-xs text-red-400/80 mt-2 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {modelsError}
              </p>
            )}
            
            {!modelsError && availableModels.length === 0 && (
              <p className="text-xs text-purple-300/40 mt-2">
                例如: gpt-4o, claude-3-opus-20240229
              </p>
            )}
            
            {availableModels.length > 0 && (
              <p className="text-xs text-green-400/60 mt-2 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                已加载 {availableModels.length} 个可用模型
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-4 mt-8 pt-6 border-t border-purple-500/20">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-900/20 hover:text-white transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg transition-all shadow-lg shadow-amber-900/20 font-medium tracking-wide"
          >
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
}
