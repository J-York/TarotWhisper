import { DrawnCard, Spread } from '../tarot/types';

function describeCard(drawn: DrawnCard, label?: string): string {
  const orientation = drawn.isReversed ? '逆位' : '正位';
  const keywords = drawn.isReversed
    ? drawn.card.keywords.reversed.join('、')
    : drawn.card.keywords.upright.join('、');
  const meaning = drawn.isReversed ? drawn.card.meaning.reversed : drawn.card.meaning.upright;
  const head = label ?? `【${drawn.position.nameCn}】`;

  return `${head}${drawn.card.nameCn}（${orientation}）
- 关键词：${keywords}
- 含义：${meaning}`;
}

function describeDrawnCards(drawnCards: DrawnCard[]): string {
  return drawnCards.map((drawn) => describeCard(drawn)).join('\n\n');
}

export function buildInterpretationPrompt(
  question: string,
  spread: Spread,
  drawnCards: DrawnCard[]
): string {
  const cardsDescription = describeDrawnCards(drawnCards);

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

/**
 * 追问 · 决策步
 * 让模型判断当前追问能否用已有牌阵直接回答，或需要补抽 1-3 张指引牌。
 * 严格要求 JSON-only 输出，便于客户端解析。
 */
export function buildFollowUpDecidePrompt(
  originalQuestion: string,
  spread: Spread,
  drawnCards: DrawnCard[],
  previousInterpretation: string,
  followUpQuestion: string
): string {
  return `你正在协助一次塔罗占卜的追问，需要决定如何回应。

## 原占卜
- 原问题：${originalQuestion}
- 牌阵：${spread.nameCn}（${spread.name}）— ${spread.description}
- 抽到的牌：
${describeDrawnCards(drawnCards)}

## 你已给出的解读
${previousInterpretation}

## 问卜者现在追问
${followUpQuestion}

## 请判断
- 如果原有牌阵的能量足以回应这个追问 → 决策 "direct"，drawCount 为 0
- 如果需要补抽 1–3 张牌作为针对此追问的补充指引 → 决策 "draw"，drawCount 为需要的张数

仅输出一个 JSON 对象，禁止任何其他内容（不要 Markdown 代码块、不要解释、不要前后多余文字）：
{"decision":"direct","drawCount":0,"reason":"<不超过 40 字的简短理由>"}
或
{"decision":"draw","drawCount":1,"reason":"<不超过 40 字的简短理由>"}`;
}

/**
 * 追问 · 解读步（不需要补牌）
 */
export function buildFollowUpDirectPrompt(
  originalQuestion: string,
  spread: Spread,
  drawnCards: DrawnCard[],
  previousInterpretation: string,
  followUpQuestion: string
): string {
  return `你正在继续一次塔罗占卜，回应问卜者的追问。

## 原占卜上下文
- 原问题：${originalQuestion}
- 牌阵：${spread.nameCn}（${spread.name}）
- 已抽到的牌：
${describeDrawnCards(drawnCards)}

## 你已给出的解读
${previousInterpretation}

## 问卜者追问
${followUpQuestion}

## 回应要求
1. 直接聚焦在追问点上，不需要重新概述整个牌阵
2. 可以引用已抽牌中相关的能量来支撑你的回应
3. 用 2–5 段话给出有深度的回应，避免空泛
4. 语气温和、诚实
5. 使用中文，可适当使用神秘学术语`;
}

/**
 * 追问 · 解读步（需要补抽指引牌）
 */
export function buildFollowUpWithExtrasPrompt(
  originalQuestion: string,
  spread: Spread,
  drawnCards: DrawnCard[],
  previousInterpretation: string,
  followUpQuestion: string,
  additionalCards: DrawnCard[]
): string {
  const extrasDescription = additionalCards
    .map((drawn) => describeCard(drawn))
    .join('\n\n');

  return `你正在继续一次塔罗占卜，回应问卜者的追问。

## 原占卜上下文
- 原问题：${originalQuestion}
- 牌阵：${spread.nameCn}（${spread.name}）
- 原牌阵中的牌：
${describeDrawnCards(drawnCards)}

## 你已给出的解读
${previousInterpretation}

## 问卜者追问
${followUpQuestion}

## 为回应此追问，又抽出了 ${additionalCards.length} 张补充指引牌
${extrasDescription}

## 回应要求
1. 重点解读这 ${additionalCards.length} 张补充牌如何回应追问
2. 联系原牌阵中相关的牌，说明能量如何演化或互动
3. 给出针对追问的具体建议
4. 用 3–6 段话
5. 语气温和、诚实
6. 使用中文`;
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
