export type Suit = 'wands' | 'cups' | 'swords' | 'pentacles';

export type CardType = 'major' | 'minor';

export interface TarotCard {
  id: string;
  name: string;
  nameCn: string;
  type: CardType;
  suit?: Suit;
  number: number;
  image: string;
  keywords: {
    upright: string[];
    reversed: string[];
  };
  meaning: {
    upright: string;
    reversed: string;
  };
}

export interface DrawnCard {
  card: TarotCard;
  isReversed: boolean;
  position: SpreadPosition;
}

export interface SpreadPosition {
  id: string;
  name: string;
  nameCn: string;
  description: string;
}

export interface Spread {
  id: string;
  name: string;
  nameCn: string;
  description: string;
  positions: SpreadPosition[];
}

export interface Reading {
  id: string;
  question: string;
  spread: Spread;
  drawnCards: DrawnCard[];
  interpretation?: string;
  createdAt: Date;
}

export interface ApiConfig {
  endpoint: string;
  apiKey: string;
  model: string;
}
