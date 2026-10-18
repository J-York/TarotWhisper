import { describe, it, expect } from 'vitest';
import { createRateLimiter } from '@/lib/api/rate-limiter';

const WINDOW = 3_600_000;

describe('createRateLimiter', () => {
  it('窗口内达到上限后拒绝', () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: WINDOW });
    const now = 1_000_000;

    expect(limiter.check('ip-a', now).allowed).toBe(true);
    expect(limiter.check('ip-a', now).allowed).toBe(true);
    expect(limiter.check('ip-a', now).allowed).toBe(true);

    const blocked = limiter.check('ip-a', now);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it('不同 IP 独立计数', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: WINDOW });
    expect(limiter.check('ip-a', 1000).allowed).toBe(true);
    expect(limiter.check('ip-a', 1000).allowed).toBe(false);
    expect(limiter.check('ip-b', 1000).allowed).toBe(true);
  });

  it('窗口过期后重新放行', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: WINDOW });
    expect(limiter.check('ip-a', 0).allowed).toBe(true);
    expect(limiter.check('ip-a', 0).allowed).toBe(false);
    expect(limiter.check('ip-a', WINDOW).allowed).toBe(true);
  });

  it('过期记录会被回收，不会无限增长', () => {
    const limiter = createRateLimiter({
      limit: 5,
      windowMs: WINDOW,
      sweepIntervalMs: 1000,
    });

    // 大量不同 IP 各请求一次，全部过期
    for (let i = 0; i < 500; i++) limiter.check(`ip-${i}`, 0);
    expect(limiter.size()).toBe(500);

    // 触发清理：时间越过清理间隔与窗口
    limiter.check('fresh', WINDOW + 5000);
    expect(limiter.size()).toBe(1);
  });

  it('键数量超过上限时淘汰旧记录，而非无限增长', () => {
    const limiter = createRateLimiter({
      limit: 5,
      windowMs: WINDOW,
      maxKeys: 100,
      sweepIntervalMs: 1, // 每次都清理，但记录不会过期
    });

    for (let i = 0; i < 150; i++) limiter.check(`ip-${i}`, 1000);

    expect(limiter.size()).toBeLessThanOrEqual(100);
  });

  it('已在计数中的键不会因容量检查被误删', () => {
    const limiter = createRateLimiter({
      limit: 3,
      windowMs: WINDOW,
      maxKeys: 2,
      sweepIntervalMs: 1,
    });

    limiter.check('a', 0);
    limiter.check('b', 0);
    limiter.check('a', 0); // 第二次请求，不应触发淘汰把 a 自己删掉

    expect(limiter.size()).toBe(2);
    expect(limiter.check('a', 0).allowed).toBe(true); // 第三次
    expect(limiter.check('a', 0).allowed).toBe(false); // 第四次 → 拒绝
  });

  it('剩余次数随请求递减', () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: WINDOW });
    expect(limiter.check('ip', 0).remaining).toBe(2);
    expect(limiter.check('ip', 0).remaining).toBe(1);
    expect(limiter.check('ip', 0).remaining).toBe(0);
  });
});
