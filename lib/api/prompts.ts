import { DrawnCard, Spread } from '../tarot/types';

export function buildInterpretationPrompt(
  question: string,
  spread: Spread,
  drawnCards: DrawnCard[]
): string {
  const cardsDescription = drawnCards.map((drawn, index) => {
    const position = spread.positions[index];
    const orientation = drawn.isReversed ? '逆位' : '正位';
    const keywords = drawn.isReversed
      ? drawn.card.keywords.reversed.join('、')
      : drawn.card.keywords.upright.join('、');

    return `【${position.nameCn}】${drawn.card.nameCn}（${orientation}）
- 关键词：${keywords}
- 含义：${drawn.isReversed ? drawn.card.meaning.reversed : drawn.card.meaning.upright}`;
  }).join('\n\n');

  return `你是一位经验丰富的塔罗牌解读师，拥有深厚的神秘学知识和敏锐的直觉。请为以下塔罗牌占卜提供专业、深入且富有洞察力的解读。

## 问卜者的问题
${question}

## 使用的牌阵
${spread.nameCn}（${spread.name}）
${spread.description}

## 抽到的牌
${cardsDescription}

## 解读要求
1. 首先简要概述整体牌面的能量和主题
2. 逐一解读每张牌在其位置上的含义，并结合问卜者的问题
3. 分析牌与牌之间的关联和互动
4. 给出综合性的建议和指引
5. 语气要温和、富有同理心，但也要诚实直接
6. 使用中文回答，可以适当使用一些神秘学术语

请开始你的解读：`;
}

export function buildSimplePrompt(
  question: string,
  cardName: string,
  isReversed: boolean,
  meaning: string
): string {
  const orientation = isReversed ? '逆位' : '正位';

  return `你是一位塔罗牌解读师。问卜者的问题是："${question}"

抽到的牌是：${cardName}（${orientation}）
牌义：${meaning}

请用2-3段话给出简洁但有深度的解读，结合问卜者的问题给出建议。使用中文回答。`;
}
