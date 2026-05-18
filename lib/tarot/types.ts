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

export type FollowUpDecision = 'direct' | 'draw';

export type FollowUpStatus =
  | 'deciding'         // 等待 decide 步返回
  | 'awaiting-draw'    // decide=draw，等用户点「继续抽牌」
  | 'awaiting-reveal'  // 已抽好补充牌，等用户翻开
  | 'interpreting'     // 流式解读中
  | 'done'
  | 'error';

export interface FollowUp {
  id: string;
  question: string;
  status: FollowUpStatus;
  decision?: FollowUpDecision;
  drawCount: number;
  reason?: string;
  additionalCards: DrawnCard[];
  revealedCount: number;
  interpretation: string;
  error: string | null;
}

export interface ApiConfig {
  endpoint: string;
  apiKey: string;
  model: string;
}
