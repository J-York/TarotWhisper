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

  return {
    config,
    isLoaded,
    isConfigured,
    saveConfig,
    updateConfig,
  };
}
