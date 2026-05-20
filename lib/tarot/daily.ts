/**
 * Daily card · 每日一牌的确定性抽取
 *
 * 给定同一天，所有用户得到同一张牌（含正逆位）。
 * 用本地时区的日期作 seed —— 让"今天"的边界与用户感知一致。
 */

import { TarotCard } from './types';
import { allCards } from './cards';

const SEED_PREFIX = 'mystic-tarot-daily-v1';

/** YYYY-MM-DD（本地时区） */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  const [, y, mo, d] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/**
 * djb2 字符串哈希 · 32-bit 无符号
 * 足够稳定且分布均匀，用于把日期映射到 0..N
 */
function djb2(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    // ((h << 5) + h) ^ c  ≡  h * 33 ^ c
    h = ((h << 5) + h) ^ input.charCodeAt(i);
  }
  return h >>> 0;
}

export interface DailyDraw {
  card: TarotCard;
  isReversed: boolean;
  dateKey: string;
}

/**
 * 给定日期返回当日的塔罗牌（含正逆位）。
 * 同一天 → 同一张牌。
 */
export function getDailyDraw(date: Date = new Date()): DailyDraw {
  const dateKey = formatDateKey(date);
  const seed = djb2(`${SEED_PREFIX}|${dateKey}`);
  const cardIdx = seed % allCards.length;
  // 用 seed 的另一段位决定正逆位，避免与卡牌选择强相关
  const isReversed = (((seed >>> 16) ^ (seed >>> 8)) & 1) === 1;
  return {
    card: allCards[cardIdx],
    isReversed,
    dateKey,
  };
}

/**
 * 生成"过去 N 天"的每日牌列表（含今天，今天在最前）。
 * 用于"轨迹"视图。
 */
export function getRecentDailyDraws(days: number, end: Date = new Date()): DailyDraw[] {
  const out: DailyDraw[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(end.getFullYear(), end.getMonth(), end.getDate() - i);
    out.push(getDailyDraw(d));
  }
  return out;
}
