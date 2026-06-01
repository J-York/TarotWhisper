/**
 * SSE chunk 解析逻辑的单元测试。
 * parseSseChunk 和 extractDecisionJson 是 useReading 中的关键纯函数，
 * 但它们是模块内部函数。我们抽取到可测试的位置。
 */
import { describe, it, expect } from 'vitest';
import { parseSseChunk, extractDecisionJson } from '@/lib/tarot/sseUtils';

describe('parseSseChunk', () => {
  it('returns isDone for [DONE]', () => {
    const result = parseSseChunk('[DONE]');
    expect(result.isDone).toBe(true);
  });

  it('extracts content from OpenAI format', () => {
    const data = JSON.stringify({
      choices: [{ delta: { content: '你好' } }],
    });
    const result = parseSseChunk(data);
    expect(result.content).toBe('你好');
    expect(result.isDone).toBe(false);
  });

  it('extracts thinking from reasoning_content', () => {
    const data = JSON.stringify({
      choices: [{ delta: { reasoning_content: '思考中...' } }],
    });
    const result = parseSseChunk(data);
    expect(result.thinking).toBe('思考中...');
  });

  it('extracts error from error field', () => {
    const data = JSON.stringify({ error: { message: '率限' } });
    const result = parseSseChunk(data);
    expect(result.error).toBe('率限');
  });

  it('handles malformed JSON gracefully', () => {
    const result = parseSseChunk('not valid json');
    expect(result.content).toBe('');
    expect(result.thinking).toBe('');
    expect(result.isDone).toBe(false);
    expect(result.error).toBeNull();
  });

  it('handles empty content', () => {
    const data = JSON.stringify({ choices: [{ delta: {} }] });
    const result = parseSseChunk(data);
    expect(result.content).toBe('');
  });
});

describe('extractDecisionJson', () => {
  it('extracts a valid direct decision', () => {
    const text = 'thinking... {"decision": "direct", "drawCount": 0, "reason": "无需抽牌"}';
    const result = extractDecisionJson(text);
    expect(result).not.toBeNull();
    expect(result!.decision).toBe('direct');
    expect(result!.drawCount).toBe(0);
    expect(result!.reason).toBe('无需抽牌');
  });

  it('extracts a valid draw decision', () => {
    const text = '{"decision": "draw", "drawCount": 2, "reason": "需补充"}';
    const result = extractDecisionJson(text);
    expect(result).not.toBeNull();
    expect(result!.decision).toBe('draw');
    expect(result!.drawCount).toBe(2);
  });

  it('clamps drawCount to 1..3', () => {
    const text = '{"decision": "draw", "drawCount": 10, "reason": ""}';
    const result = extractDecisionJson(text);
    expect(result!.drawCount).toBe(3);
  });

  it('returns null for text without valid JSON', () => {
    expect(extractDecisionJson('没有 JSON')).toBeNull();
  });

  it('handles decision case-insensitively', () => {
    const text = '{"decision": "DRAW", "drawCount": 1, "reason": ""}';
    const result = extractDecisionJson(text);
    expect(result!.decision).toBe('draw');
  });
});
