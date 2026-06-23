import { Spread } from '@/lib/tarot/types';
import { spreads } from '@/lib/tarot/spreads';

/**
 * Agent 化 · 牌阵选择决策步
 *
 * 让 LLM 根据用户问题，从已有牌阵中挑选最合适的一个。
 * 模式与 buildFollowUpDecidePrompt 一致：严格要求 JSON-only 输出，
 * 由 extractSpreadChoiceJson 解析。
 *
 * 这是 Agent 全自动对话流的第一步：用户只需提出问题，
 * 由 Agent 决定使用哪个牌阵，省去用户手动选择的步骤。
 */

// ─── 牌阵清单摘要 ─────────────────────────────────────────────

interface SpreadOption {
  id: string;
  nameCn: string;
  description: string;
  positionCount: number;
}

function buildSpreadOptions(): SpreadOption[] {
  return spreads.map((spread: Spread) => ({
    id: spread.id,
    nameCn: spread.nameCn,
    description: spread.description,
    positionCount: spread.positions.length,
  }));
}

// ─── Prompt 构建 ─────────────────────────────────────────────

export function buildSpreadChoicePrompt(question: string): string {
  const options = buildSpreadOptions();
  const optionsText = options
    .map(
      (opt) =>
        `- "${opt.id}"（${opt.nameCn}，${opt.positionCount}张）：${opt.description}`,
    )
    .join('\n');

  return `你正在协助一次塔罗占卜，需要根据问卜者的问题，为其挑选最合适的牌阵。

## 问卜者的问题
${question}

## 可选牌阵
${optionsText}

## 选择原则
- 简单、笼统或寻求当下指引的问题 → 倾向单张牌（"single"）
- 想了解事情发展脉络、过去现在未来 → 三张牌阵（"three-card"）
- 面对两个具体选项的抉择 → 二择一牌阵（"two-options"）
- 关于感情、人际关系 → 关系牌阵（"relationship"）
- 想追溯根源、看清因果与行动方向 → 时间之流（"timeline"）
- 复杂、多面向、需要全景式深度分析 → 凯尔特十字（"celtic-cross"）
- 默认均衡选择：当问题中等复杂时，优先三张牌阵（"three-card"）

仅输出一个 JSON 对象，禁止任何其他内容（不要 Markdown 代码块、不要解释、不要前后多余文字）：
{"spreadId":"three-card","reason":"<不超过 40 字的简短理由，说明为何选择此牌阵>"}`;
}

// ─── 解析 ───────────────────────────────────────────────────

export interface SpreadChoiceResult {
  spreadId: string;
  reason: string;
}

/** 所有合法的牌阵 id，用于校验 LLM 返回 */
const VALID_SPREAD_IDS = new Set(spreads.map((s: Spread) => s.id));

/** 三张牌阵 id，作为解析失败时的兜底 */
const FALLBACK_SPREAD_ID = 'three-card';

/**
 * 从 LLM 文本输出中提取牌阵选择 JSON。
 * 复用 extractDecisionJson 的正则匹配策略：定位含目标字段的单层 JSON 对象。
 */
export function extractSpreadChoiceJson(text: string): SpreadChoiceResult | null {
  const match = text.match(/\{[^{}]*"spreadId"[^{}]*\}/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[0]) as Record<string, unknown>;
    const spreadIdRaw = typeof parsed.spreadId === 'string' ? parsed.spreadId.trim() : '';
    const spreadId = VALID_SPREAD_IDS.has(spreadIdRaw)
      ? spreadIdRaw
      : FALLBACK_SPREAD_ID;
    const reason =
      typeof parsed.reason === 'string' ? parsed.reason.slice(0, 120) : '';
    return { spreadId, reason };
  } catch {
    return null;
  }
}

/** 解析失败时的兜底选择 */
export function defaultSpreadChoice(question: string): SpreadChoiceResult {
  // 保留 question 参数以便未来做关键词启发式兜底，当前统一兜底三张牌阵
  void question;
  return { spreadId: FALLBACK_SPREAD_ID, reason: '为你展开三张牌阵，审视过去、现在与未来。' };
}
