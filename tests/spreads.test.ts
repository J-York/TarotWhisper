import { describe, it, expect } from 'vitest';
import { spreads, getSpreadById, getDefaultSpread } from '@/lib/tarot/spreads';

describe('spreads', () => {
  it('has at least 3 spreads', () => {
    expect(spreads.length).toBeGreaterThanOrEqual(3);
  });

  it('each spread has positions array', () => {
    spreads.forEach((s) => {
      expect(s.positions.length).toBeGreaterThan(0);
      s.positions.forEach((p) => {
        expect(p.id).toBeTruthy();
        expect(p.name).toBeTruthy();
        expect(p.nameCn).toBeTruthy();
      });
    });
  });

  it('getSpreadById returns correct spread', () => {
    const celtic = getSpreadById('celtic-cross');
    expect(celtic).toBeDefined();
    expect(celtic!.nameCn).toBe('凯尔特十字');
    expect(celtic!.positions).toHaveLength(10);
  });

  it('getSpreadById returns undefined for unknown id', () => {
    expect(getSpreadById('nonexistent')).toBeUndefined();
  });

  it('getDefaultSpread returns three-card', () => {
    const def = getDefaultSpread();
    expect(def.id).toBe('three-card');
  });
});
