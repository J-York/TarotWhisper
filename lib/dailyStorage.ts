/**
 * Daily card · 个人笔记的本地存储
 *
 * 存的是「我对当天那张牌写下的反思」。
 * 当日的牌本身由 lib/tarot/daily.ts 的纯函数派生，无需存储。
 */

const STORAGE_KEY = 'mystic-tarot-daily-notes-v1';
const MAX_ENTRIES = 60;

export interface DailyNoteEntry {
  /** YYYY-MM-DD */
  dateKey: string;
  /** 用户写下的反思 */
  note: string;
  /** 写下/最后修改的 ISO 时间 */
  updatedAt: string;
}

interface NotesMap {
  [dateKey: string]: DailyNoteEntry;
}

function readAll(): NotesMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return {};
    return parsed as NotesMap;
  } catch {
    return {};
  }
}

function writeAll(map: NotesMap): void {
  if (typeof window === 'undefined') return;
  try {
    // 按日期降序保留近 N 条，控制 localStorage 体量
    const entries = Object.values(map).sort((a, b) =>
      a.dateKey < b.dateKey ? 1 : -1
    );
    const trimmed = entries.slice(0, MAX_ENTRIES);
    const next: NotesMap = {};
    for (const e of trimmed) next[e.dateKey] = e;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded');
    } else {
      console.error('Failed to save daily note:', error);
    }
  }
}

export function getDailyNote(dateKey: string): DailyNoteEntry | null {
  const all = readAll();
  return all[dateKey] ?? null;
}

export function saveDailyNote(dateKey: string, note: string): void {
  const all = readAll();
  if (!note.trim()) {
    delete all[dateKey];
  } else {
    all[dateKey] = {
      dateKey,
      note,
      updatedAt: new Date().toISOString(),
    };
  }
  writeAll(all);
}

export function getAllDailyNotes(): DailyNoteEntry[] {
  return Object.values(readAll()).sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
}
