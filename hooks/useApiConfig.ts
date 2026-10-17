'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { ApiConfig } from '@/lib/tarot/types';

const STORAGE_KEY = 'tarot-api-config';

const defaultConfig: ApiConfig = {
  endpoint: 'https://api.openai.com/v1/chat/completions',
  apiKey: '',
  model: 'gpt-4o-mini',
};

/* ─── 全局共享配置 ───
   顶栏与页面各有一处设置入口；若各持一份 useState，
   在顶栏保存的密钥不会传到当前页面。这里用模块级 store 共享。 */

type Snapshot = { config: ApiConfig; loaded: boolean };

let snapshot: Snapshot = { config: defaultConfig, loaded: false };
const listeners = new Set<() => void>();
let storageRead = false;

function publish(next: Snapshot): void {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function loadFromStorage(): void {
  if (storageRead || typeof window === 'undefined') return;
  storageRead = true;
  let config = defaultConfig;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      config = { ...defaultConfig, ...(JSON.parse(stored) as Partial<ApiConfig>) };
    } catch {
      // 损坏的数据回退到默认配置
    }
  }
  if (snapshot.loaded) return;
  publish({ config, loaded: true });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // 首次订阅时补读 localStorage；React 订阅后会重读快照，身份变化才触发重渲染
  loadFromStorage();
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = (): Snapshot => snapshot;
// 必须是稳定引用，否则 React 判定快照每次都变而无限重渲染
const SERVER_SNAPSHOT: Snapshot = { config: defaultConfig, loaded: false };
const getServerSnapshot = (): Snapshot => SERVER_SNAPSHOT;

function saveSharedConfig(next: ApiConfig): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  publish({ config: next, loaded: true });
}

export function useApiConfig() {
  const { config, loaded } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // 服务端是否配置了可用的后备 LLM（无用户 key 时也能占卜）
  const [fallbackAvailable, setFallbackAvailable] = useState(false);
  const [fallbackChecked, setFallbackChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setFallbackAvailable(!!data.fallbackAvailable); })
      .catch(() => { if (!cancelled) setFallbackAvailable(false); })
      .finally(() => { if (!cancelled) setFallbackChecked(true); });
    return () => { cancelled = true; };
  }, []);

  const saveConfig = useCallback((newConfig: ApiConfig) => {
    saveSharedConfig(newConfig);
  }, []);

  const updateConfig = useCallback((updates: Partial<ApiConfig>) => {
    saveSharedConfig({ ...snapshot.config, ...updates });
  }, []);

  // 两项都就绪后 canUseApi 才可信，否则后备配置查询返回前会误判为“未配置”
  const isLoaded = loaded && fallbackChecked;
  const isConfigured = config.apiKey.length > 0;
  // 能否发起占卜：用户配了 key，或服务端有后备配置
  const canUseApi = isConfigured || fallbackAvailable;

  return {
    config,
    isLoaded,
    isConfigured,
    fallbackAvailable,
    canUseApi,
    saveConfig,
    updateConfig,
  };
}
