/**
 * 牌组的名称、元素与配色。牌典、今日一牌、牌面详情共用。
 * 颜色类名必须写全，Tailwind 才扫描得到。
 */

import type { Suit, TarotCard } from './types';

export type Arcana = 'major' | Suit;

export interface ArcanaMeta {
  key: Arcana;
  nameCn: string;
  nameEn: string;
  /** 小阿卡纳对应的元素；大阿卡纳为空串 */
  element: string;
  theme: string;
  textClass: string;
  bgClass: string;
}

export const ARCANA: Record<Arcana, ArcanaMeta> = {
  major: {
    key: 'major',
    nameCn: '大阿卡纳',
    nameEn: 'Major Arcana',
    element: '',
    theme: '从愚者到世界的旅程',
    textClass: 'text-suit-major',
    bgClass: 'bg-suit-major',
  },
  wands: {
    key: 'wands',
    nameCn: '权杖',
    nameEn: 'Wands',
    element: '火',
    theme: '行动与创造',
    textClass: 'text-suit-wands',
    bgClass: 'bg-suit-wands',
  },
  cups: {
    key: 'cups',
    nameCn: '圣杯',
    nameEn: 'Cups',
    element: '水',
    theme: '情感与关系',
    textClass: 'text-suit-cups',
    bgClass: 'bg-suit-cups',
  },
  swords: {
    key: 'swords',
    nameCn: '宝剑',
    nameEn: 'Swords',
    element: '风',
    theme: '思想与真相',
    textClass: 'text-suit-swords',
    bgClass: 'bg-suit-swords',
  },
  pentacles: {
    key: 'pentacles',
    nameCn: '星币',
    nameEn: 'Pentacles',
    element: '土',
    theme: '物质与工作',
    textClass: 'text-suit-pentacles',
    bgClass: 'bg-suit-pentacles',
  },
};

export const ARCANA_ORDER: Arcana[] = ['major', 'wands', 'cups', 'swords', 'pentacles'];

export function arcanaOf(card: TarotCard): Arcana {
  return card.type === 'major' || !card.suit ? 'major' : card.suit;
}

const ROMAN: ReadonlyArray<readonly [number, string]> = [
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

function toRoman(value: number): string {
  let remaining = value;
  let result = '';
  for (const [numeral, glyph] of ROMAN) {
    while (remaining >= numeral) {
      result += glyph;
      remaining -= numeral;
    }
  }
  return result;
}

/** 牌面编号：大阿卡纳用罗马数字（愚者为 0），小阿卡纳用两位数字 */
export function catalogNumber(card: TarotCard): string {
  if (card.type === 'major') return card.number === 0 ? '0' : toRoman(card.number);
  return String(card.number).padStart(2, '0');
}
