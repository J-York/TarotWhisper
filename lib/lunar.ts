/**
 * 农历日期 · 借助 Intl 的中国历法换算，这里只把日数改写成「初九」「廿三」的写法。
 * 运行环境不支持中国历法时返回 null，调用方直接不显示即可。
 */

export interface LunarDate {
  /** 干支年，如「丙午」；部分环境不提供，此时为空串 */
  yearName: string;
  /** 月份，如「九月」「闰六月」「正月」 */
  month: string;
  /** 日，如「初九」「廿三」 */
  day: string;
}

const DIGITS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

export function lunarDayName(day: number): string {
  if (day <= 10) return `初${DIGITS[day]}`;
  if (day < 20) return `十${DIGITS[day - 10]}`;
  if (day === 20) return '二十';
  if (day < 30) return `廿${DIGITS[day - 20]}`;
  return '三十';
}

let formatter: Intl.DateTimeFormat | null | undefined;

function getFormatter(): Intl.DateTimeFormat | null {
  if (formatter !== undefined) return formatter;
  try {
    formatter = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    formatter = null;
  }
  return formatter;
}

export function getLunarDate(date: Date): LunarDate | null {
  const fmt = getFormatter();
  if (!fmt) return null;

  const parts = fmt.formatToParts(date);
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  const day = Number(parts.find((p) => p.type === 'day')?.value);
  // 不认识中国历法的引擎会悄悄退回公历（月份是数字），这种结果不能用
  if (!month.endsWith('月') || !Number.isInteger(day) || day < 1 || day > 30) return null;

  return {
    // TS 自带的 Intl 类型尚未收录 yearName（干支年），运行时是存在的
    yearName: parts.find((p) => (p.type as string) === 'yearName')?.value ?? '',
    month,
    day: lunarDayName(day),
  };
}

/** 如「丙午年 九月初九」；不支持时返回 null */
export function formatLunarDate(date: Date): string | null {
  const lunar = getLunarDate(date);
  if (!lunar) return null;
  return `${lunar.yearName ? `${lunar.yearName}年 ` : ''}${lunar.month}${lunar.day}`;
}
