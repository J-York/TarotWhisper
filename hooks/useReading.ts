'use client';

import { useState, useCallback } from 'react';
import { DrawnCard, Spread, Reading } from '@/lib/tarot/types';
import { allCards } from '@/lib/tarot/cards';
import { getDefaultSpread } from '@/lib/tarot/spreads';
import { saveReading } from '@/lib/storage';

export type ReadingPhase = 'question' | 'spread' | 'shuffle' | 'draw' | 'reveal' | 'interpret';

interface ParsedSseChunk {
  content: string;
  thinking: string;
  error: string | null;
  isDone: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractTextValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(extractTextValue).join('');
  }

  if (!isRecord(value)) {
    return '';
  }

  const candidateKeys = ['text', 'content', 'value', 'output_text', 'thinking', 'reasoning'] as const;
  for (const key of candidateKeys) {
    const candidate = value[key];
    const extracted = extractTextValue(candidate);
    if (extracted) {
      return extracted;
    }
  }

  return '';
}

function isThinkingType(type: unknown): boolean {
  if (typeof type !== 'string') {
    return false;
  }

  const normalized = type.toLowerCase();
  return normalized.includes('think') || normalized.includes('reason');
}

function extractContentText(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (isRecord(item) && isThinkingType(item.type)) {
          return '';
        }
        return extractTextValue(item);
      })
      .join('');
  }

  if (isRecord(value) && isThinkingType(value.type)) {
    return '';
  }

  return extractTextValue(value);
}

function extractThinkingText(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (isRecord(item) && !isThinkingType(item.type)) {
          return '';
        }
        return extractTextValue(item);
      })
      .join('');
  }

  if (!isRecord(value)) {
    return '';
  }

  if (isThinkingType(value.type)) {
    return extractTextValue(value);
  }

  const thinkingKeys = ['reasoning_content', 'reasoning', 'thinking'] as const;
  for (const key of thinkingKeys) {
    const extracted = extractThinkingText(value[key]);
    if (extracted) {
      return extracted;
    }
  }

  return '';
}

function pickFirstNonEmpty(...values: string[]): string {
  return values.find((value) => value.length > 0) ?? '';
}

function extractErrorMessage(value: unknown): string | null {
  if (typeof value === 'string' && value) {
    return value;
  }

  if (isRecord(value) && typeof value.message === 'string' && value.message) {
    return value.message;
  }

  return null;
}

function parseSseChunk(data: string): ParsedSseChunk {
  if (data === '[DONE]') {
    return { content: '', thinking: '', error: null, isDone: true };
  }

  try {
    const parsedUnknown: unknown = JSON.parse(data);
    if (!isRecord(parsedUnknown)) {
      return { content: '', thinking: '', error: null, isDone: false };
    }

    const choices = Array.isArray(parsedUnknown.choices) ? parsedUnknown.choices : [];
    const firstChoice = choices.length > 0 && isRecord(choices[0]) ? choices[0] : null;
    const delta = firstChoice && isRecord(firstChoice.delta) ? firstChoice.delta : null;
    const message = firstChoice && isRecord(firstChoice.message) ? firstChoice.message : null;

    const content = pickFirstNonEmpty(
      extractContentText(delta?.content),
      extractContentText(message?.content),
      extractContentText(parsedUnknown.content)
    );

    const thinking = pickFirstNonEmpty(
      extractThinkingText(delta?.reasoning_content),
      extractThinkingText(delta?.reasoning),
      extractThinkingText(delta?.thinking),
      extractThinkingText(message?.reasoning_content),
      extractThinkingText(message?.reasoning),
      extractThinkingText(message?.thinking),
      extractThinkingText(parsedUnknown.reasoning_content),
      extractThinkingText(parsedUnknown.reasoning),
      extractThinkingText(parsedUnknown.thinking),
      extractThinkingText(parsedUnknown.content)
    );

    const error = extractErrorMessage(parsedUnknown.error);

    return { content, thinking, error, isDone: false };
  } catch {
    return { content: '', thinking: '', error: null, isDone: false };
  }
}

export function useReading() {
  const [phase, setPhase] = useState<ReadingPhase>('question');
  const [question, setQuestion] = useState('');
  const [spread, setSpread] = useState<Spread>(getDefaultSpread());
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [interpretation, setInterpretation] = useState('');
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shuffleAndDraw = useCallback(() => {
    const shuffled = [...allCards].sort(() => Math.random() - 0.5);
    const drawn: DrawnCard[] = spread.positions.map((position, index) => ({
      card: shuffled[index],
      isReversed: Math.random() > 0.5,
      position,
    }));
    setDrawnCards(drawn);
    setRevealedCount(0);
    setPhase('draw');
  }, [spread]);

  const revealNextCard = useCallback(() => {
    if (revealedCount < drawnCards.length) {
      setRevealedCount(prev => prev + 1);
      if (revealedCount + 1 >= drawnCards.length) {
        setPhase('reveal');
      }
    }
  }, [revealedCount, drawnCards.length]);

  const revealAllCards = useCallback(() => {
    setRevealedCount(drawnCards.length);
    setPhase('reveal');
  }, [drawnCards.length]);

  const startInterpretation = useCallback(async (apiConfig: { endpoint: string; apiKey: string; model: string }) => {
    setIsInterpreting(true);
    setInterpretation('');
    setError(null);
    setPhase('interpret');

      try {
        const response = await fetch('/api/interpret', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          spread,
          drawnCards,
          apiConfig,
        }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`请求失败: ${response.status} - ${errorText}`);
        }

        // 检查是否使用了内置配置
        const usingFallback = response.headers.get('X-Using-Fallback') === 'true';
        if (usingFallback) {
          console.info('使用内置 LLM 配置（有速率限制）。配置自己的 API Key 可解除限制。');
        }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let fullInterpretation = '';
      let streamComplete = false;
      let receivedAnyContent = false;
      let receivedAnyError = false;
      let lastChunkAt = Date.now();
      let thinkingBlockOpen = false;
      const streamIdleTimeoutMs = 8000;

      const appendChunk = (chunk: string): void => {
        if (!chunk) {
          return;
        }

        fullInterpretation += chunk;
        setInterpretation((prev) => prev + chunk);
        receivedAnyContent = true;
        lastChunkAt = Date.now();
      };

      const openThinkingBlock = (): void => {
        if (thinkingBlockOpen) {
          return;
        }

        const prefix = fullInterpretation ? '\n\n<think>\n' : '<think>\n';
        appendChunk(prefix);
        thinkingBlockOpen = true;
      };

      const closeThinkingBlock = (): void => {
        if (!thinkingBlockOpen) {
          return;
        }

        appendChunk('\n</think>\n\n');
        thinkingBlockOpen = false;
      };

      const processDataLine = (data: string): void => {
        const parsedChunk = parseSseChunk(data);

        if (parsedChunk.isDone) {
          streamComplete = true;
          closeThinkingBlock();
          return;
        }

        if (parsedChunk.thinking) {
          openThinkingBlock();
          appendChunk(parsedChunk.thinking);
        }

        if (parsedChunk.content) {
          closeThinkingBlock();
          appendChunk(parsedChunk.content);
        }

        if (parsedChunk.error) {
          setError(parsedChunk.error);
          receivedAnyError = true;
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (Date.now() - lastChunkAt > streamIdleTimeoutMs && receivedAnyContent) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line.startsWith('data: ')) {
            continue;
          }

          processDataLine(line.slice(6));
          if (streamComplete) {
            break;
          }
        }

        if (streamComplete) {
          break;
        }
      }

      const trailingLines = buffer.split('\n');
      for (const rawLine of trailingLines) {
        const line = rawLine.trim();
        if (!line.startsWith('data: ')) {
          continue;
        }

        processDataLine(line.slice(6));
        if (streamComplete) {
          break;
        }
      }

      closeThinkingBlock();

      // 保存完整的占卜记录到历史
      if (fullInterpretation) {
        const reading: Reading = {
          id: crypto.randomUUID(),
          question,
          spread,
          drawnCards,
          interpretation: fullInterpretation,
          createdAt: new Date(),
        };
        saveReading(reading);
      }

      if (!fullInterpretation && !receivedAnyError) {
        setError('未收到有效解读内容，连接可能被网关提前中断');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '解读失败');
    } finally {
      setIsInterpreting(false);
    }
  }, [question, spread, drawnCards]);

  const reset = useCallback(() => {
    setPhase('question');
    setQuestion('');
    setSpread(getDefaultSpread());
    setDrawnCards([]);
    setRevealedCount(0);
    setInterpretation('');
    setIsInterpreting(false);
    setError(null);
  }, []);

  const goToPhase = useCallback((newPhase: ReadingPhase) => {
    setPhase(newPhase);
  }, []);

  return {
    phase,
    question,
    spread,
    drawnCards,
    revealedCount,
    interpretation,
    isInterpreting,
    error,
    setQuestion,
    setSpread,
    shuffleAndDraw,
    revealNextCard,
    revealAllCards,
    startInterpretation,
    reset,
    goToPhase,
  };
}
