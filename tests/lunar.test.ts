import { describe, it, expect } from 'vitest';
import { formatLunarDate, getLunarDate, lunarDayName } from '@/lib/lunar';

describe('农历日名', () => {
  it('按传统写法命名', () => {
    expect(lunarDayName(1)).toBe('初一');
    expect(lunarDayName(10)).toBe('初十');
    expect(lunarDayName(11)).toBe('十一');
    expect(lunarDayName(20)).toBe('二十');
    expect(lunarDayName(23)).toBe('廿三');
    expect(lunarDayName(30)).toBe('三十');
  });
});

describe('农历日期', () => {
  it('换算公历日期', () => {
    expect(getLunarDate(new Date(2026, 9, 18))).toEqual({
      yearName: '丙午',
      month: '九月',
      day: '初九',
    });
    expect(getLunarDate(new Date(2026, 1, 17))?.month).toBe('正月');
    expect(getLunarDate(new Date(2026, 2, 18))?.day).toBe('三十');
  });

  it('保留闰月', () => {
    expect(getLunarDate(new Date(2025, 6, 25))).toMatchObject({ month: '闰六月', day: '初一' });
  });

  it('格式化为一行', () => {
    expect(formatLunarDate(new Date(2026, 9, 18))).toBe('丙午年 九月初九');
  });
});
