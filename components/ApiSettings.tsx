'use client';

import { useState, useEffect, type ReactElement } from 'react';
import { ApiConfig } from '@/lib/tarot/types';
import { fetchAvailableModels, ModelInfo } from '@/lib/api/llm-client';

interface ApiSettingsProps {
  config: ApiConfig;
  onSave: (config: ApiConfig) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ApiSettings({ config, onSave, isOpen, onClose }: ApiSettingsProps): ReactElement | null {
  const [localConfig, setLocalConfig] = useState<ApiConfig>(config);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string>('');
  const [fallbackInfo, setFallbackInfo] = useState<{ available: boolean; rateLimit: number } | null>(null);

  useEffect(() => {
    queueMicrotask(() => setLocalConfig(config));
  }, [config]);

  // Esc 关闭 + 锁定背景滚动
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        setFallbackInfo({
          available: data.fallbackAvailable,
          rateLimit: data.rateLimit,
        });
      })
      .catch(() => {
        setFallbackInfo(null);
      });
  }, [isOpen]);

  const handleFetchModels = async (): Promise<void> => {
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
      } else if (!models.some((m) => m.id === localConfig.model)) {
        setLocalConfig({ ...localConfig, model: models[0].id });
      }
    } catch (error) {
      setModelsError(error instanceof Error ? error.message : '获取模型列表失败');
      setAvailableModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleSave = (): void => {
    onSave(localConfig);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-[var(--ink-void)]/85 p-4 backdrop-blur-md anim-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-settings-title"
    >
      <div
        className="surface my-8 w-full max-w-md bg-[var(--ink-deep)] anim-veil-rise"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between border-b border-[var(--ink-line)] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="text-gold-dim" aria-hidden>◇</span>
            <h2 id="api-settings-title" className="section-title">API 配置</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="grid h-8 w-8 place-items-center rounded-full text-bone-faint transition-colors hover:bg-white/5 hover:text-bone"
          >
            ×
          </button>
        </div>

        {/* ─── Body ─── */}
        <div className="max-h-[70dvh] space-y-6 overflow-y-auto px-6 py-6">
          {fallbackInfo?.available && (
            <div className="rounded-lg border border-[var(--gold-faint)] bg-[rgba(210,178,116,0.06)] px-4 py-3">
              <p className="text-xs leading-relaxed text-bone-dim">
                未填写密钥时，将使用内置 API（每小时 {fallbackInfo.rateLimit} 次）。
                配置自有密钥可解除限制。
              </p>
            </div>
          )}

          {/* 端点 */}
          <div>
            <label htmlFor="api-endpoint" className="mb-2 block text-xs tracking-[0.1em] text-bone-dim">
              API 端点
            </label>
            <input
              id="api-endpoint"
              type="url"
              value={localConfig.endpoint}
              onChange={(e) => setLocalConfig({ ...localConfig, endpoint: e.target.value })}
              placeholder="https://api.openai.com/v1/chat/completions"
              className="input-ink font-mono text-sm"
            />
            <p className="mt-1.5 text-[11px] text-bone-faint">
              OpenAI / Claude / 任意兼容 Chat Completions 的格式
            </p>
          </div>

          {/* 密钥 */}
          <div>
            <label htmlFor="api-key" className="mb-2 block text-xs tracking-[0.1em] text-bone-dim">
              API 密钥
            </label>
            <input
              id="api-key"
              type="password"
              value={localConfig.apiKey}
              onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
              placeholder="sk-..."
              className="input-ink font-mono text-sm"
              autoComplete="off"
            />
            <p className="mt-1.5 text-[11px] text-bone-faint">
              <span className="mr-1 text-gold-dim" aria-hidden>⊹</span>
              仅保存在本机浏览器，不会上传到服务器
            </p>
          </div>

          {/* 模型 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="api-model" className="block text-xs tracking-[0.1em] text-bone-dim">
                模型
              </label>
              <button
                type="button"
                onClick={handleFetchModels}
                disabled={isLoadingModels || !localConfig.endpoint || !localConfig.apiKey}
                className="btn-ink-ghost text-xs"
              >
                {isLoadingModels ? '获取中…' : '获取模型列表'}
              </button>
            </div>

            {availableModels.length > 0 ? (
              <select
                id="api-model"
                value={localConfig.model}
                onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
                className="input-ink font-mono text-sm"
              >
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id} className="bg-[var(--ink-deep)]">
                    {model.id}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="api-model"
                type="text"
                value={localConfig.model}
                onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
                placeholder="gpt-4o-mini"
                className="input-ink font-mono text-sm"
              />
            )}

            {modelsError ? (
              <p className="mt-1.5 text-[11px] text-gold-warm">
                <span className="mr-1" aria-hidden>◇</span>
                {modelsError}
              </p>
            ) : availableModels.length > 0 ? (
              <p className="mt-1.5 text-[11px] text-gold-dim">
                <span className="mr-1" aria-hidden>✦</span>
                已载入 {availableModels.length} 个模型
              </p>
            ) : (
              <p className="mt-1.5 text-[11px] text-bone-faint">例如 gpt-4o / claude-sonnet-4-5</p>
            )}
          </div>
        </div>

        {/* ─── Footer ─── */}
        <div className="flex items-center justify-end gap-2 border-t border-[var(--ink-line)] px-6 py-4">
          <button type="button" onClick={onClose} className="btn-ink-ghost px-4 py-2 text-sm">
            取消
          </button>
          <button type="button" onClick={handleSave} className="btn-ink-primary h-9 px-5 text-sm">
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
