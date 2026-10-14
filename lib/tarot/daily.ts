/**
 * Daily card · 每日一牌的确定性抽取
 *
 * 给定同一天，所有用户得到同一张牌（含正逆位）。
 * 用本地时区的日期作 seed —— 让"今天"的边界与用户感知一致。
 */

import { TarotCard } from './types';
import { allCards } from './cards';

const SEED_PREFIX = 'mystic-tarot-daily-v2';

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
 * FNV-1a + murmur3 fmix32 收尾 · 32-bit 无符号
 * 相邻日期只差末位字符，必须有收尾混合才能雪崩到全部位；
 * 单纯的 djb2 会让连续日期落在连续的牌上，且某一位整月不变。
 */
function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
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
  const cardIdx = hash32(`${SEED_PREFIX}|card|${dateKey}`) % allCards.length;
  // 正逆位用独立的哈希，避免与卡牌选择相关
  const isReversed = (hash32(`${SEED_PREFIX}|orientation|${dateKey}`) & 1) === 1;
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
