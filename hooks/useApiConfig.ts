'use client';

import { useState, useEffect, useCallback } from 'react';
import { ApiConfig } from '@/lib/tarot/types';

const STORAGE_KEY = 'tarot-api-config';

const defaultConfig: ApiConfig = {
  endpoint: 'https://api.openai.com/v1/chat/completions',
  apiKey: '',
  model: 'gpt-4o-mini',
};

export function useApiConfig() {
  const [config, setConfig] = useState<ApiConfig>(defaultConfig);
  const [isLoaded, setIsLoaded] = useState(false);
  // 服务端是否配置了可用的后备 LLM（无用户 key 时也能占卜）
  const [fallbackAvailable, setFallbackAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setFallbackAvailable(!!data.fallbackAvailable); })
      .catch(() => { if (!cancelled) setFallbackAvailable(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ApiConfig;
        queueMicrotask(() => {
          setConfig(parsed);
        });
      } catch {
        // 使用默认配置
      }
    }
    queueMicrotask(() => {
      setIsLoaded(true);
    });
  }, []);

  const saveConfig = useCallback((newConfig: ApiConfig) => {
    setConfig(newConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
  }, []);

  const updateConfig = useCallback((updates: Partial<ApiConfig>) => {
    setConfig(prev => {
      const newConfig = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      return newConfig;
    });
  }, []);

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
