'use client';

import { useState, useCallback } from 'react';
import { TarotCard, DrawnCard, Spread, Reading } from '@/lib/tarot/types';
import { allCards } from '@/lib/tarot/cards';
import { getDefaultSpread } from '@/lib/tarot/spreads';
import { saveReading } from '@/lib/storage';

export type ReadingPhase = 'question' | 'spread' | 'shuffle' | 'draw' | 'reveal' | 'interpret';

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
        throw new Error(`请求失败: ${response.status}`);
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
      let lastChunkAt = Date.now();
      const streamIdleTimeoutMs = 8000;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (Date.now() - lastChunkAt > streamIdleTimeoutMs && receivedAnyContent) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              streamComplete = true;
              break;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullInterpretation += parsed.content;
                setInterpretation(prev => prev + parsed.content);
                receivedAnyContent = true;
                lastChunkAt = Date.now();
              }
              if (parsed.error) {
                setError(parsed.error);
              }
            } catch {
              // 忽略解析错误
            }
          }
        }

        if (streamComplete) break;
      }

      if (buffer.trim().startsWith('data: ')) {
        const data = buffer.trim().slice(6);
        if (data && data !== '[DONE]') {
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullInterpretation += parsed.content;
              setInterpretation(prev => prev + parsed.content);
            }
            if (parsed.error) {
              setError(parsed.error);
            }
          } catch {
            // 忽略解析错误
          }
        }
      }

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

      if (!fullInterpretation && !error) {
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
