/** 界面上的日期写法，统一用本地时区 */

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

/** 如「星期六」 */
export function weekdayName(date: Date): string {
  return `星期${WEEKDAYS[date.getDay()]}`;
}

/** 如「周六」 */
export function weekdayShort(date: Date): string {
  return `周${WEEKDAYS[date.getDay()]}`;
}

/** 如「10月18日」 */
export function formatMonthDay(date: Date): string {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

/** 如「21:04」 */
export function formatClock(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** 如「2026年10月」，用作按月分组的标题 */
export function formatYearMonth(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}
