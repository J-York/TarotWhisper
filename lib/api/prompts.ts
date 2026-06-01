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
  const builder = spreadPromptBuilders[spread.id];
  if (builder) {
    return builder(question, spread, drawnCards);
  }
  return buildGenericInterpretationPrompt(question, spread, drawnCards);
}

// ── 通用解读 prompt（兜底） ──────────────────────────────────

function buildGenericInterpretationPrompt(
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

// ── 单张牌 ─────────────────────────────────────────────────

function buildSingleCardPrompt(
  question: string,
  spread: Spread,
  drawnCards: DrawnCard[]
): string {
  const cardsDescription = describeDrawnCards(drawnCards);

  return `你是一位经验丰富的塔罗牌解读师，拥有深厚的神秘学知识和敏锐的直觉。

## 问卜者的问题
${question}

## 使用的牌阵
${spread.nameCn} — ${spread.description}

## 抽到的牌
${cardsDescription}

## 解读要求
1. 开篇用 1–2 句话点出这张牌给出的核心信息
2. 结合问卜者的具体问题，深入解读牌在当前处境下的含义
3. 给出明确、可行的建议（2–3 条）
4. 整体控制在 3–4 段，简洁有力
5. 语气温和、诚实
6. 使用中文，可适当使用神秘学术语

请开始你的解读：`;
}

// ── 三张牌阵 ───────────────────────────────────────────────

function buildThreeCardPrompt(
  question: string,
  spread: Spread,
  drawnCards: DrawnCard[]
): string {
  const cardsDescription = describeDrawnCards(drawnCards);

  return `你是一位经验丰富的塔罗牌解读师，拥有深厚的神秘学知识和敏锐的直觉。

## 问卜者的问题
${question}

## 使用的牌阵
${spread.nameCn}（${spread.name}）— ${spread.description}

## 抽到的牌
${cardsDescription}

## 解读要求
1. 首先简要概述整体牌面的能量基调
2. 以「过去 → 现在 → 未来」的时间线为主线逐一解读，重点展现事情的演变逻辑
3. 分析三张牌的能量流动：过去如何塑造了现在，现在的选择又将如何影响未来
4. 给出基于时间脉络的综合建议
5. 语气温和、诚实
6. 使用中文，可适当使用神秘学术语

请开始你的解读：`;
}

// ── 二择一牌阵 ─────────────────────────────────────────────

function buildTwoOptionsPrompt(
  question: string,
  spread: Spread,
  drawnCards: DrawnCard[]
): string {
  const cardsDescription = describeDrawnCards(drawnCards);

  return `你是一位经验丰富的塔罗牌解读师，擅长帮助问卜者在两难之间看清方向。

## 问卜者的问题
${question}

## 使用的牌阵
${spread.nameCn}（${spread.name}）— ${spread.description}

## 抽到的牌
${cardsDescription}

## 解读要求
1. 先结合「当前处境」牌，简要点出问卜者此刻面临抉择的核心处境和心态
2. 分别解读两条路径：
   - 「选择A」：结合「选择A的发展」和「选择A的结果」两张牌，描述这条路的过程体验与最终走向
   - 「选择B」：同样方式解读
3. 将两条路径放在一起对比：各自的优势、风险、能量差异
4. 给出明确的倾向性建议（不要回避「都可以」），同时说明无论哪条路需要注意什么
5. 语气温和、诚实，像一位智者帮助折叠可能性
6. 使用中文，可适当使用神秘学术语

请开始你的解读：`;
}

// ── 关系牌阵 ───────────────────────────────────────────────

function buildRelationshipPrompt(
  question: string,
  spread: Spread,
  drawnCards: DrawnCard[]
): string {
  const cardsDescription = describeDrawnCards(drawnCards);

  return `你是一位经验丰富的塔罗牌解读师，尤其擅长感情与人际关系的解读。

## 问卜者的问题
${question}

## 使用的牌阵
${spread.nameCn}（${spread.name}）— ${spread.description}

## 抽到的牌
${cardsDescription}

## 解读要求
1. 先概述这段关系的整体能量氛围
2. 分别解读「你的感受」与「对方的感受」，然后将两张牌放在一起分析双方的能量是否匹配、是否存在认知差异
3. 通过「关系现状」牌描述两人当前的互动模式和关系质量
4. 结合「关系挑战」牌指出需要共同面对的障碍或盲点
5. 用「关系走向」牌给出这段关系的发展趋势和建议
6. 语气温柔、富有同理心，但不回避难听的真相
7. 使用中文，可适当使用神秘学术语

请开始你的解读：`;
}

// ── 时间之流 ───────────────────────────────────────────────

function buildTimelinePrompt(
  question: string,
  spread: Spread,
  drawnCards: DrawnCard[]
): string {
  const cardsDescription = describeDrawnCards(drawnCards);

  return `你是一位经验丰富的塔罗牌解读师，擅长追溯事件的根源并看清未来走向。

## 问卜者的问题
${question}

## 使用的牌阵
${spread.nameCn}（${spread.name}）— ${spread.description}

## 抽到的牌
${cardsDescription}

## 解读要求
1. 以因果叙事线为主轴，从「根源」开始，揭示事情发生的深层原因
2. 结合「过去影响」牌说明这些根源如何在过去的经历中发酵、累积
3. 解读「当下」牌，点明现在所处的关键节点
4. 通过「近期趋势」牌描绘事态将如何演变
5. 以「行动建议」牌给出具体、可执行的行动指引
6. 强调五张牌的因果链条：根源 → 过去 → 当下 → 趋势 → 建议，体现能量的流动和转化
7. 语气温和、诚实
8. 使用中文，可适当使用神秘学术语

请开始你的解读：`;
}

// ── 凯尔特十字 ─────────────────────────────────────────────

function buildCelticCrossPrompt(
  question: string,
  spread: Spread,
  drawnCards: DrawnCard[]
): string {
  const cardsDescription = describeDrawnCards(drawnCards);

  return `你是一位经验深厚的塔罗牌解读大师，擅长使用凯尔特十字进行全景式深度解读。

## 问卜者的问题
${question}

## 使用的牌阵
${spread.nameCn}（${spread.name}）— ${spread.description}

## 抽到的牌
${cardsDescription}

## 解读要求
1. 简要概述整体牌面的能量格局
2. 先解读十字核心：「现状」与「挑战」的交织，点明问题的核心张力
3. 再解读时间线：「过去」→「现状」→「近期未来」
4. 分析垂直维度：「目标」（意识层）与「潜意识」（无意识层）的对照
5. 解读右侧柱：「建议」「外部影响」「希望与恐惧」「最终结果」的递进关系
6. 综合十张牌给出全局性的深度建议
7. 语气温和、诚实，体现解读的层次感
8. 使用中文，可适当使用神秘学术语

请开始你的解读：`;
}

// ── 牌阵 → prompt 分发映射 ───────────────────────────────────

type SpreadPromptBuilder = (question: string, spread: Spread, drawnCards: DrawnCard[]) => string;

const spreadPromptBuilders: Record<string, SpreadPromptBuilder> = {
  'single': buildSingleCardPrompt,
  'three-card': buildThreeCardPrompt,
  'two-options': buildTwoOptionsPrompt,
  'relationship': buildRelationshipPrompt,
  'timeline': buildTimelinePrompt,
  'celtic-cross': buildCelticCrossPrompt,
};

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
