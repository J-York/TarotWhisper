import { describe, it, expect } from 'vitest';
import { classifyHttpError } from '@/lib/api/errors';

describe('classifyHttpError', () => {
  it('shows the route message as-is and does not retry the route rate limit', () => {
    const body = JSON.stringify({ error: '内置服务请求过于频繁，请稍后再试', source: 'route' });
    const info = classifyHttpError(429, body);
    expect(info.message).toBe('内置服务请求过于频繁，请稍后再试');
    expect(info.retryable).toBe(false);
  });

  it('still retries an upstream 429', () => {
    const body = JSON.stringify({ error: 'API 请求失败 (429): ...', source: 'upstream' });
    expect(classifyHttpError(429, body).retryable).toBe(true);
  });

  it('appends the upstream reason to the generic message', () => {
    const body = JSON.stringify({
      error: 'API 请求失败 (404): ...',
      source: 'upstream',
      upstreamMessage: 'The model `gpt-9` does not exist',
    });
    const info = classifyHttpError(404, body);
    expect(info.code).toBe('MODEL_NOT_FOUND');
    expect(info.message).toContain('服务商返回：The model `gpt-9` does not exist');
  });

  it('falls back to the generic message for non-JSON bodies', () => {
    const info = classifyHttpError(502, '<html>Bad Gateway</html>');
    expect(info.message).not.toContain('服务商返回');
  });
});
