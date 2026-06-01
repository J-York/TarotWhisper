/**
 * SSE 流解析工具 — 从 useReading 抽出以便单元测试
 */

export type FollowUpDecision = 'direct' | 'draw';

export interface ParsedSseChunk {
  content: string;
  thinking: string;
  error: string | null;
  isDone: boolean;
}

export interface DecisionResult {
  decision: FollowUpDecision;
  drawCount: number;
  reason: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractTextValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(extractTextValue).join('');
  if (!isRecord(value)) return '';
  const candidateKeys = ['text', 'content', 'value', 'output_text', 'thinking', 'reasoning'] as const;
  for (const key of candidateKeys) {
    const extracted = extractTextValue(value[key]);
    if (extracted) return extracted;
  }
  return '';
}

function isThinkingType(type: unknown): boolean {
  if (typeof type !== 'string') return false;
  const normalized = type.toLowerCase();
  return normalized.includes('think') || normalized.includes('reason');
}

function extractContentText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (isRecord(item) && isThinkingType(item.type)) return '';
        return extractTextValue(item);
      })
      .join('');
  }
  if (isRecord(value) && isThinkingType(value.type)) return '';
  return extractTextValue(value);
}

function extractThinkingText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (isRecord(item) && !isThinkingType(item.type)) return '';
        return extractTextValue(item);
      })
      .join('');
  }
  if (!isRecord(value)) return '';
  if (isThinkingType(value.type)) return extractTextValue(value);
  const thinkingKeys = ['reasoning_content', 'reasoning', 'thinking'] as const;
  for (const key of thinkingKeys) {
    const extracted = extractThinkingText(value[key]);
    if (extracted) return extracted;
  }
  return '';
}

function pickFirstNonEmpty(...values: string[]): string {
  return values.find((value) => value.length > 0) ?? '';
}

function extractErrorMessage(value: unknown): string | null {
  if (typeof value === 'string' && value) return value;
  if (isRecord(value) && typeof value.message === 'string' && value.message) return value.message;
  return null;
}

export function parseSseChunk(data: string): ParsedSseChunk {
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

export function extractDecisionJson(text: string): DecisionResult | null {
  const match = text.match(/\{[^{}]*"decision"[^{}]*\}/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[0]) as Record<string, unknown>;
    const decisionRaw = typeof parsed.decision === 'string' ? parsed.decision.toLowerCase() : '';
    const decision: FollowUpDecision = decisionRaw === 'draw' ? 'draw' : 'direct';
    const drawCountRaw = Number(parsed.drawCount);
    const drawCount = decision === 'draw'
      ? Math.max(1, Math.min(3, Math.floor(Number.isFinite(drawCountRaw) ? drawCountRaw : 1)))
      : 0;
    const reason = typeof parsed.reason === 'string' ? parsed.reason.slice(0, 120) : '';
    return { decision, drawCount, reason };
  } catch {
    return null;
  }
}
