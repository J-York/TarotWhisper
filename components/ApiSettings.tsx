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

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

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
    <div className="fixed inset-0 bg-[var(--ink-void)]/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 anim-fade-in">
      <div className="ink-panel-quiet bg-[var(--ink-deep)] w-full max-w-md anim-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-[var(--ink-line)]">
          <div className="flex items-center gap-3">
            <span className="text-gold-dim">◇</span>
            <h2 className="text-sm font-serif text-bone tracking-mystic uppercase">星 图 配 置</h2>
          </div>
          <button
            onClick={onClose}
            className="text-bone-faint hover:text-bone transition-colors text-lg leading-none"
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-7 space-y-8">
          {fallbackInfo?.available && (
            <div className="px-4 py-3 border-l border-[var(--gold-dim)]">
              <p className="text-bone-faint text-xs leading-relaxed font-light">
                未填写配置时，将使用内置 API（每小时 {fallbackInfo.rateLimit} 次）。
                配置自有密钥可解除限制。
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs text-bone-faint tracking-mystic uppercase mb-3">
              端 点
            </label>
            <input
              type="url"
              value={localConfig.endpoint}
              onChange={(e) => setLocalConfig({ ...localConfig, endpoint: e.target.value })}
              placeholder="https://api.openai.com/v1/chat/completions"
              className="input-ink font-mono text-xs"
            />
            <p className="text-[10px] text-bone-whisper mt-2 tracking-quiet uppercase">
              OpenAI ╱ Claude ╱ 兼容格式
            </p>
          </div>

          <div>
            <label className="block text-xs text-bone-faint tracking-mystic uppercase mb-3">
              密 钥
            </label>
            <input
              type="password"
              value={localConfig.apiKey}
              onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
              placeholder="sk-..."
              className="input-ink font-mono text-xs"
            />
            <p className="text-[10px] text-bone-whisper mt-2 tracking-quiet uppercase">
              ⊹ 仅 保 存 在 本 地
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs text-bone-faint tracking-mystic uppercase">
                模 型
              </label>
              <button
                type="button"
                onClick={handleFetchModels}
                disabled={isLoadingModels || !localConfig.endpoint || !localConfig.apiKey}
                className="btn-ink-ghost"
              >
                {isLoadingModels ? '获 取 中' : '⌁ 获 取'}
              </button>
            </div>

            {availableModels.length > 0 ? (
              <select
                value={localConfig.model}
                onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
                className="input-ink font-mono text-xs"
              >
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id} className="bg-[var(--ink-deep)]">
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
                className="input-ink font-mono text-xs"
              />
            )}

            {modelsError && (
              <p className="text-[10px] text-gold-dim mt-2 tracking-quiet uppercase">
                ◇ {modelsError}
              </p>
            )}

            {!modelsError && availableModels.length === 0 && (
              <p className="text-[10px] text-bone-whisper mt-2 tracking-quiet uppercase">
                如 gpt-4o ╱ claude-3-opus
              </p>
            )}

            {availableModels.length > 0 && (
              <p className="text-[10px] text-gold-dim mt-2 tracking-quiet uppercase">
                ✦ 已 载 入 {availableModels.length} 个 模 型
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex border-t border-[var(--ink-line)]">
          <button
            onClick={onClose}
            className="btn-ink-ghost flex-1 py-4 border-r border-[var(--ink-line)]"
          >
            取 消
          </button>
          <button
            onClick={handleSave}
            className="btn-ink-primary flex-1 py-4 border-0"
            style={{ borderRadius: 0 }}
          >
            保 存
          </button>
        </div>
      </div>
    </div>
  );
}
