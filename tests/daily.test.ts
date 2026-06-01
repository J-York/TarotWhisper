import { describe, it, expect } from 'vitest';
import {
  formatDateKey,
  parseDateKey,
  getDailyDraw,
  getRecentDailyDraws,
} from '@/lib/tarot/daily';

describe('formatDateKey', () => {
  it('formats a date as YYYY-MM-DD', () => {
    const d = new Date(2025, 0, 5); // Jan 5 2025
    expect(formatDateKey(d)).toBe('2025-01-05');
  });

  it('pads single-digit month and day', () => {
    const d = new Date(2024, 2, 9); // Mar 9 2024
    expect(formatDateKey(d)).toBe('2024-03-09');
  });
});

describe('parseDateKey', () => {
  it('parses a valid YYYY-MM-DD key', () => {
    const result = parseDateKey('2025-06-15');
    expect(result).not.toBeNull();
    expect(result!.getFullYear()).toBe(2025);
    expect(result!.getMonth()).toBe(5); // 0-indexed
    expect(result!.getDate()).toBe(15);
  });

  it('returns null for invalid format', () => {
    expect(parseDateKey('2025/06/15')).toBeNull();
    expect(parseDateKey('not-a-date')).toBeNull();
    expect(parseDateKey('')).toBeNull();
  });

  it('round-trips with formatDateKey', () => {
    const original = new Date(2024, 11, 25);
    const key = formatDateKey(original);
    const parsed = parseDateKey(key);
    expect(parsed).not.toBeNull();
    expect(formatDateKey(parsed!)).toBe(key);
  });
});

describe('getDailyDraw', () => {
  it('returns the same card for the same date', () => {
    const d1 = new Date(2025, 5, 1);
    const d2 = new Date(2025, 5, 1);
    const draw1 = getDailyDraw(d1);
    const draw2 = getDailyDraw(d2);
    expect(draw1.card.id).toBe(draw2.card.id);
    expect(draw1.isReversed).toBe(draw2.isReversed);
    expect(draw1.dateKey).toBe(draw2.dateKey);
  });

  it('returns different cards for different dates (probabilistic)', () => {
    // 连续 30 天不可能全相同
    const draws = Array.from({ length: 30 }, (_, i) =>
      getDailyDraw(new Date(2025, 0, i + 1))
    );
    const uniqueCards = new Set(draws.map((d) => d.card.id));
    expect(uniqueCards.size).toBeGreaterThan(1);
  });

  it('dateKey matches the input date', () => {
    const d = new Date(2025, 3, 20);
    const draw = getDailyDraw(d);
    expect(draw.dateKey).toBe('2025-04-20');
  });
});

describe('getRecentDailyDraws', () => {
  it('returns the correct number of draws', () => {
    const draws = getRecentDailyDraws(7, new Date(2025, 5, 10));
    expect(draws).toHaveLength(7);
  });

  it('first entry is the end date, last is the earliest', () => {
    const end = new Date(2025, 5, 10);
    const draws = getRecentDailyDraws(5, end);
    expect(draws[0].dateKey).toBe('2025-06-10');
    expect(draws[4].dateKey).toBe('2025-06-06');
  });

  it('each draw is deterministic', () => {
    const end = new Date(2025, 5, 10);
    const draws1 = getRecentDailyDraws(5, end);
    const draws2 = getRecentDailyDraws(5, end);
    draws1.forEach((d, i) => {
      expect(d.card.id).toBe(draws2[i].card.id);
      expect(d.isReversed).toBe(draws2[i].isReversed);
    });
  });
});
