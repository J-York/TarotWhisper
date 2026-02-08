import { Reading } from '@/lib/tarot/types';

const STORAGE_KEY = 'mystic-tarot-readings-v1';
const MAX_READINGS = 50;

interface StoredReading extends Omit<Reading, 'createdAt'> {
  createdAt: string;
}

export function saveReading(reading: Reading): void {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const readings: StoredReading[] = stored ? JSON.parse(stored) : [];

    const storedReading: StoredReading = {
      ...reading,
      createdAt: reading.createdAt.toISOString(),
    };

    const updated = [storedReading, ...readings];
    const trimmed = updated.length > MAX_READINGS ? updated.slice(0, MAX_READINGS) : updated;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded');
    } else {
      console.error('Failed to save reading:', error);
    }
  }
}

export function getReadings(): Reading[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const readings: StoredReading[] = JSON.parse(stored);
    return readings.map(item => ({
      ...item,
      createdAt: new Date(item.createdAt),
    }));
  } catch (error) {
    console.error('Failed to load readings:', error);
    return [];
  }
}

export function getReadingById(id: string): Reading | undefined {
  const readings = getReadings();
  return readings.find(reading => reading.id === id);
}

export function deleteReadings(ids: string[]): void {
  if (typeof window === 'undefined') return;

  try {
    const readings = getReadings();
    const filtered = readings.filter(reading => !ids.includes(reading.id));
    
    const storedReadings: StoredReading[] = filtered.map(item => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    }));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedReadings));
  } catch (error) {
    console.error('Failed to delete readings:', error);
  }
}

export function clearAll(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear readings:', error);
  }
}
