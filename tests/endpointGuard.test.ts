import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { checkEndpoint } from '@/lib/api/endpoint-guard';

describe('checkEndpoint', () => {
  const original = process.env.ALLOW_PRIVATE_ENDPOINTS;

  afterEach(() => {
    if (original === undefined) delete process.env.ALLOW_PRIVATE_ENDPOINTS;
    else process.env.ALLOW_PRIVATE_ENDPOINTS = original;
  });

  describe('默认配置（不允许内网）', () => {
    beforeEach(() => {
      delete process.env.ALLOW_PRIVATE_ENDPOINTS;
    });

    it('放行正常公网地址', () => {
      expect(checkEndpoint('https://api.openai.com/v1/chat/completions').ok).toBe(true);
      expect(checkEndpoint('https://open.bigmodel.cn/api/paas/v4').ok).toBe(true);
    });

    it('拒绝 localhost 与环回地址', () => {
      expect(checkEndpoint('http://localhost:11434/v1').ok).toBe(false);
      expect(checkEndpoint('http://127.0.0.1:8080/v1').ok).toBe(false);
      expect(checkEndpoint('http://127.1.2.3/v1').ok).toBe(false);
    });

    it('拒绝常见私有网段', () => {
      expect(checkEndpoint('http://192.168.1.10:1234/v1').ok).toBe(false);
      expect(checkEndpoint('http://10.0.0.5/v1').ok).toBe(false);
      expect(checkEndpoint('http://172.16.0.1/v1').ok).toBe(false);
      expect(checkEndpoint('http://172.31.255.254/v1').ok).toBe(false);
    });

    it('放行公有 172 段（172.15 / 172.32 不属于私有范围）', () => {
      expect(checkEndpoint('http://172.15.0.1/v1').ok).toBe(true);
      expect(checkEndpoint('http://172.32.0.1/v1').ok).toBe(true);
    });

    it('拒绝内部域名后缀', () => {
      expect(checkEndpoint('http://ollama.local/v1').ok).toBe(false);
      expect(checkEndpoint('http://metadata.internal/v1').ok).toBe(false);
    });

    it('拒绝 IPv6 环回与唯一本地地址', () => {
      expect(checkEndpoint('http://[::1]:11434/v1').ok).toBe(false);
      expect(checkEndpoint('http://[fd00::1]/v1').ok).toBe(false);
      expect(checkEndpoint('http://[fe80::1]/v1').ok).toBe(false);
    });

    it('拒绝 IPv4 映射的 IPv6 环回地址', () => {
      expect(checkEndpoint('http://[::ffff:127.0.0.1]/v1').ok).toBe(false);
    });
  });

  describe('云元数据地址始终拦截', () => {
    it('不允许内网时也拦截', () => {
      delete process.env.ALLOW_PRIVATE_ENDPOINTS;
      expect(checkEndpoint('http://169.254.169.254/latest/meta-data/').ok).toBe(false);
    });

    it('即使开启内网放行仍然拦截', () => {
      process.env.ALLOW_PRIVATE_ENDPOINTS = 'true';
      expect(checkEndpoint('http://169.254.169.254/latest/meta-data/').ok).toBe(false);
      expect(checkEndpoint('http://100.100.100.200/latest/meta-data/').ok).toBe(false);
    });
  });

  describe('ALLOW_PRIVATE_ENDPOINTS=true（本地模型场景）', () => {
    beforeEach(() => {
      process.env.ALLOW_PRIVATE_ENDPOINTS = 'true';
    });

    it('放行本地与内网地址', () => {
      expect(checkEndpoint('http://localhost:11434/v1').ok).toBe(true);
      expect(checkEndpoint('http://192.168.1.10:1234/v1').ok).toBe(true);
      expect(checkEndpoint('http://[::1]:11434/v1').ok).toBe(true);
    });
  });

  describe('协议与格式', () => {
    it('拒绝非 http(s) 协议', () => {
      expect(checkEndpoint('file:///etc/passwd').ok).toBe(false);
      expect(checkEndpoint('gopher://example.com').ok).toBe(false);
      expect(checkEndpoint('ftp://example.com').ok).toBe(false);
    });

    it('拒绝无法解析的地址', () => {
      const result = checkEndpoint('这不是一个网址');
      expect(result.ok).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('大小写不敏感', () => {
      expect(checkEndpoint('http://LOCALHOST:11434/v1').ok).toBe(false);
      expect(checkEndpoint('http://LocalHost:11434/v1').ok).toBe(false);
    });

    it('拒绝失败时给出面向用户的说明', () => {
      const result = checkEndpoint('http://localhost:11434/v1');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('ALLOW_PRIVATE_ENDPOINTS');
    });
  });
});
