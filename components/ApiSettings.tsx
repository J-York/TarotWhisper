'use client';

import { useEffect, useState, type FormEvent, type ReactElement, type ReactNode } from 'react';

import { Dialog, DialogCloseButton } from '@/components/Dialog';
import { fetchAvailableModels, type ModelInfo } from '@/lib/api/llm-client';
import type { ApiConfig } from '@/lib/tarot/types';

interface ApiSettingsProps {
  config: ApiConfig;
  onSave: (config: ApiConfig) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ApiSettings({ config, onSave, isOpen, onClose }: ApiSettingsProps): ReactElement {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} labelledBy="api-settings-title" size="md">
      {/* 弹窗关闭时表单随之卸载：每次打开都从已保存的配置开始，取消不会留下改了一半的内容 */}
      <SettingsForm initial={config} onSave={onSave} onClose={onClose} />
    </Dialog>
  );
}

interface SettingsFormProps {
  initial: ApiConfig;
  onSave: (config: ApiConfig) => void;
  onClose: () => void;
}

function SettingsForm({ initial, onSave, onClose }: SettingsFormProps): ReactElement {
  const [draft, setDraft] = useState<ApiConfig>(initial);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState('');
  const [fallback, setFallback] = useState<{ available: boolean; rateLimit: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setFallback({ available: Boolean(data.fallbackAvailable), rateLimit: Number(data.rateLimit) });
      })
      .catch(() => {
        if (!cancelled) setFallback(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (patch: Partial<ApiConfig>): void => setDraft((prev) => ({ ...prev, ...patch }));

  const loadModels = async (): Promise<void> => {
    if (!draft.endpoint || !draft.apiKey) {
      setModelsError('请先填写 API 端点和密钥');
      return;
    }
    setIsLoadingModels(true);
    setModelsError('');
    try {
      const list = await fetchAvailableModels(draft.endpoint, draft.apiKey);
      setModels(list);
      if (list.length === 0) setModelsError('没有找到可用的模型');
      else if (!list.some((m) => m.id === draft.model)) update({ model: list[0].id });
    } catch (error) {
      setModels([]);
      setModelsError(error instanceof Error ? error.message : '获取模型列表失败');
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    onSave(draft);
    onClose();
  };

  const modelHint = modelsError || (models.length > 0 ? `已载入 ${models.length} 个模型` : '例如 gpt-4o-mini、claude-sonnet-4-5');

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center justify-between gap-3 border-b border-line py-2 pl-6 pr-3">
        <h2 id="api-settings-title" className="section-title">
          API 配置
        </h2>
        <DialogCloseButton onClick={onClose} />
      </div>

      <div className="space-y-6 px-6 py-6">
        {fallback?.available && (
          <p className="rounded-md border border-line border-l-[3px] border-l-accent bg-canvas px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
            不填密钥时使用站点内置的模型，每小时可解读 {fallback.rateLimit} 次；填上自己的密钥就不受这个限制。
          </p>
        )}

        <Field id="api-endpoint" label="API 端点" hint="OpenAI、Claude，或任何兼容 Chat Completions 格式的地址。">
          <input
            id="api-endpoint"
            type="url"
            value={draft.endpoint}
            onChange={(e) => update({ endpoint: e.target.value })}
            placeholder="https://api.openai.com/v1/chat/completions"
            aria-describedby="api-endpoint-hint"
            autoComplete="off"
            spellCheck={false}
            className="field font-mono text-sm"
          />
        </Field>

        <Field
          id="api-key"
          label="API 密钥"
          hint="只保存在这台设备的浏览器里。解读时随请求经本站服务器转发给上面的端点，服务器不会保存。"
        >
          <input
            id="api-key"
            type="password"
            value={draft.apiKey}
            onChange={(e) => update({ apiKey: e.target.value })}
            placeholder="sk-..."
            aria-describedby="api-key-hint"
            autoComplete="off"
            spellCheck={false}
            className="field font-mono text-sm"
          />
        </Field>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label htmlFor="api-model" className="text-sm font-medium text-ink">
              模型
            </label>
            <button
              type="button"
              onClick={() => void loadModels()}
              disabled={isLoadingModels || !draft.endpoint || !draft.apiKey}
              className="link text-[13px] disabled:cursor-not-allowed disabled:text-ink-muted disabled:no-underline"
            >
              {isLoadingModels ? '正在获取…' : '获取模型列表'}
            </button>
          </div>
          {models.length > 0 ? (
            <select
              id="api-model"
              value={draft.model}
              onChange={(e) => update({ model: e.target.value })}
              aria-describedby="api-model-hint"
              className="field font-mono text-sm"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.id}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="api-model"
              type="text"
              value={draft.model}
              onChange={(e) => update({ model: e.target.value })}
              placeholder="gpt-4o-mini"
              aria-describedby="api-model-hint"
              autoComplete="off"
              spellCheck={false}
              className="field font-mono text-sm"
            />
          )}
          <p
            id="api-model-hint"
            role={modelsError ? 'alert' : undefined}
            className={`mt-1.5 text-[13px] leading-relaxed ${modelsError ? 'text-accent-strong' : 'text-ink-muted'}`}
          >
            {modelHint}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-4">
        <button type="button" onClick={onClose} className="btn btn-ghost h-9 px-4 text-sm">
          取消
        </button>
        <button type="submit" className="btn btn-primary h-9 px-5 text-sm">
          保存
        </button>
      </div>
    </form>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint: string; children: ReactNode }): ReactElement {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      <p id={`${id}-hint`} className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
        {hint}
      </p>
    </div>
  );
}
