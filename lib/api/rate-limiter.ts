/**
 * 进程内固定窗口限流
 *
 * 只在单实例部署下有效：多实例 / Serverless 每个实例各自计数，
 * 请求被分散时实际放行量会高于配置值。要严格限制请换共享存储
 * （如 Upstash Redis）。这里解决的是另一个问题：记录永不回收。
 */

interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimiterOptions {
  /** 窗口内允许的请求数 */
  limit: number;
  /** 窗口长度（毫秒） */
  windowMs: number;
  /** 同时保存的键上限，防止记录无限增长 */
  maxKeys?: number;
  /** 两次全量清理的最小间隔（毫秒） */
  sweepIntervalMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** 窗口内剩余次数 */
  remaining: number;
  /** 距离窗口重置的秒数 */
  retryAfterSec: number;
}

const DEFAULT_MAX_KEYS = 10_000;
const DEFAULT_SWEEP_INTERVAL_MS = 60_000;

export function createRateLimiter(options: RateLimiterOptions) {
  const {
    limit,
    windowMs,
    maxKeys = DEFAULT_MAX_KEYS,
    sweepIntervalMs = DEFAULT_SWEEP_INTERVAL_MS,
  } = options;

  const buckets = new Map<string, Bucket>();
  let lastSweep = Number.NEGATIVE_INFINITY;

  /** 清掉已过期记录 */
  const sweep = (now: number): void => {
    for (const [key, bucket] of buckets) {
      if (now >= bucket.resetAt) buckets.delete(key);
    }
    lastSweep = now;
  };

  /** 清理后仍超限则淘汰最早写入的记录（Map 保持插入顺序） */
  const evictOldest = (count: number): void => {
    let removed = 0;
    for (const key of buckets.keys()) {
      buckets.delete(key);
      if (++removed >= count) break;
    }
  };

  return {
    check(key: string, now = Date.now()): RateLimitResult {
      // 按时间顺带清理，不额外起定时器：Serverless 里常驻定时器会拖住实例
      if (now - lastSweep >= sweepIntervalMs) sweep(now);

      const existing = buckets.get(key);
      const isNewWindow = !existing || now >= existing.resetAt;

      if (isNewWindow) {
        // 只有新增键才需要腾容量；已存在的键覆写不会增长
        if (!existing && buckets.size >= maxKeys) {
          sweep(now);
          if (buckets.size >= maxKeys) evictOldest(buckets.size - maxKeys + 1);
        }
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return {
          allowed: true,
          remaining: limit - 1,
          retryAfterSec: Math.ceil(windowMs / 1000),
        };
      }

      const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

      if (existing.count >= limit) {
        return { allowed: false, remaining: 0, retryAfterSec };
      }

      existing.count++;
      return { allowed: true, remaining: limit - existing.count, retryAfterSec };
    },

    /** 仅供测试与诊断 */
    size(): number {
      return buckets.size;
    },
  };
}
