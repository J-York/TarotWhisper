import { describe, it, expect, afterEach } from 'vitest';
import { checkEndpoint } from '@/lib/api/endpoint-guard';

/**
 * 这组用例直接复现「用本地模型」这条真实路径，
 * 确保放行开关生效、而元数据地址仍被拦住。
 */
describe('本地模型（Ollama / LM Studio）可用性', () => {
  const original = process.env.ALLOW_PRIVATE_ENDPOINTS;

  afterEach(() => {
    if (original === undefined) delete process.env.ALLOW_PRIVATE_ENDPOINTS;
    else process.env.ALLOW_PRIVATE_ENDPOINTS = original;
  });

  it('开关打开后，Ollama 默认地址可用', () => {
    process.env.ALLOW_PRIVATE_ENDPOINTS = 'true';
    expect(checkEndpoint('http://localhost:11434/api/chat').ok).toBe(true);
    expect(checkEndpoint('http://localhost:11434/v1/chat/completions').ok).toBe(true);
  });

  it('开关打开后，局域网里的 LM Studio 可用', () => {
    process.env.ALLOW_PRIVATE_ENDPOINTS = 'true';
    expect(checkEndpoint('http://192.168.1.20:1234/v1/chat/completions').ok).toBe(true);
    expect(checkEndpoint('http://10.0.0.8:8000/v1').ok).toBe(true);
  });

  it('开关打开也不允许读取云元数据', () => {
    process.env.ALLOW_PRIVATE_ENDPOINTS = 'true';
    expect(checkEndpoint('http://169.254.169.254/latest/meta-data/').ok).toBe(false);
    expect(checkEndpoint('http://169.254.170.2/v2/credentials').ok).toBe(false);
    expect(checkEndpoint('http://100.100.100.200/latest/meta-data/').ok).toBe(false);
  });

  it('只认 "true"，其他取值视为关闭', () => {
    process.env.ALLOW_PRIVATE_ENDPOINTS = '1';
    expect(checkEndpoint('http://localhost:11434/v1').ok).toBe(false);

    process.env.ALLOW_PRIVATE_ENDPOINTS = 'TRUE';
    expect(checkEndpoint('http://localhost:11434/v1').ok).toBe(false);
  });
});
