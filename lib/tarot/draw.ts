/**
 * 抽牌纯函数 · 从 useReading.ts 提取，供 Agent 编排与现有流程共用。
 *
 * 抽牌逻辑：从 allCards 中随机洗牌，按牌阵位置取出，
 * 每张以 50% 概率逆位。无副作用、无 React 依赖。
 */

import { allCards } from '@/lib/tarot/cards';
import { DrawnCard, Spread, SpreadPosition } from '@/lib/tarot/types';

/** 洗牌并按牌阵位置抽取 */
export function drawCardsForSpread(spread: Spread): DrawnCard[] {
  const shuffled = [...allCards].sort(() => Math.random() - 0.5);
  return spread.positions.map((position, index) => ({
    card: shuffled[index],
    isReversed: Math.random() > 0.5,
    position,
  }));
}

// ─── 补充牌（追问用） ───────────────────────────────────────

const SUPPLEMENTARY_CN_NAMES = ['补 一', '补 二', '补 三', '补 四', '补 五'];

function makeSupplementaryPositions(
  count: number,
  startIndex: number,
): SpreadPosition[] {
  return Array.from({ length: count }, (_, i) => {
    const idx = startIndex + i;
    return {
      id: `supp-${idx + 1}`,
      name: `Supplementary ${idx + 1}`,
      nameCn: SUPPLEMENTARY_CN_NAMES[i] ?? `补 ${idx + 1}`,
      description: '为回应追问而抽取的补充指引',
    };
  });
}

/** 抽取追问用的补充指引牌 */
export function drawSupplementaryCards(
  count: number,
  startIndex = 0,
): DrawnCard[] {
  const positions = makeSupplementaryPositions(count, startIndex);
  const shuffled = [...allCards].sort(() => Math.random() - 0.5);
  return positions.map((position, idx) => ({
    card: shuffled[idx],
    isReversed: Math.random() > 0.5,
    position,
  }));
}
