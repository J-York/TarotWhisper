import { describe, it, expect } from 'vitest';
import { allCards, majorArcanaCards, getCardsBySuit } from '@/lib/tarot/cards';

describe('tarot cards data', () => {
  it('has 78 cards total', () => {
    expect(allCards).toHaveLength(78);
  });

  it('has 22 major arcana', () => {
    expect(majorArcanaCards).toHaveLength(22);
    majorArcanaCards.forEach((c) => expect(c.type).toBe('major'));
  });

  it('has 14 cards per suit', () => {
    for (const suit of ['wands', 'cups', 'swords', 'pentacles'] as const) {
      const cards = getCardsBySuit(suit);
      expect(cards).toHaveLength(14);
      cards.forEach((c) => {
        expect(c.type).toBe('minor');
        expect(c.suit).toBe(suit);
      });
    }
  });

  it('every card has required fields', () => {
    allCards.forEach((card) => {
      expect(card.id).toBeTruthy();
      expect(card.name).toBeTruthy();
      expect(card.nameCn).toBeTruthy();
      expect(card.image).toBeTruthy();
      expect(card.keywords.upright.length).toBeGreaterThan(0);
      expect(card.keywords.reversed.length).toBeGreaterThan(0);
      expect(card.meaning.upright).toBeTruthy();
      expect(card.meaning.reversed).toBeTruthy();
    });
  });

  it('all card IDs are unique', () => {
    const ids = allCards.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
