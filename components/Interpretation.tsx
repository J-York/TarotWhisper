'use client';

import { Fragment, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

interface InterpretationProps {
  content: string;
  isLoading: boolean;
  error: string | null;
  /**
   * 是否在首次加载时应用逐段揭幕动画。
   * 历史详情页：true。
   * 实时解读（已经有流式动画）：false。
   */
  staggerOnMount?: boolean;
  /**
   * 需要高亮为金色描边小标签的牌名。
   * 传入后，文中出现的 nameCn / name 会被识别并装饰。
   */
  cardTerms?: string[];
  /**
   * 需要高亮为月雾色阵位标签的阵位名。
   */
  positionTerms?: string[];
}

type InterpretationSegmentType = 'answer' | 'thinking';

interface InterpretationSegment {
  type: InterpretationSegmentType;
  markdown: string;
}

const THINKING_TAG_PATTERN = /<\/?(think|thinking)>/gi;

/**
 * Markdown 渲染映射 —
 * 标题用 Cinzel · 正文用 Cormorant Garamond ·
 * 强调用金叶色 · 引用用金线左缀
 */
const MARKDOWN_COMPONENTS: Components = {
  h1: ({ children }) => (
    <h1 className="font-display text-2xl text-bone mt-12 mb-6 first:mt-0 tracking-[0.18em] pb-4 hairline-bottom">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-display text-xl text-bone mt-10 mb-5 first:mt-0 tracking-[0.16em]">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-display text-lg text-bone mt-8 mb-4 first:mt-0 tracking-[0.14em]">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="font-display text-base text-bone mt-6 mb-3 first:mt-0 tracking-[0.12em]">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="font-body text-bone-dim text-lg leading-[1.95] mb-6 last:mb-0 font-light">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="font-body list-none text-bone-dim text-lg leading-[1.95] my-6 space-y-3 pl-0 font-light">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="font-body list-decimal list-inside text-bone-dim text-lg leading-[1.95] my-6 space-y-3 pl-2 font-light">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-bone-dim leading-[1.95] pl-6 relative before:content-['◇'] before:absolute before:left-0 before:text-gold-dim before:text-sm before:top-2">
      {children}
    </li>
  ),
  strong: ({ children }) => (
    <strong className="text-gold font-medium tracking-wide">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="font-body italic text-bone">{children}</em>
  ),
  blockquote: ({ children }) => (
    <blockquote className="font-body border-l border-[var(--gold-dim)] pl-6 my-8 italic-soft text-bone-faint text-lg leading-[1.95]">
      {children}
    </blockquote>
  ),
  hr: () => (
    <hr className="my-10 border-0 rule-h-fade" />
  ),
};

/* ─── 关键词装饰 · 在 markdown 渲染前用 HTML span 包裹 ───
   ReactMarkdown 默认不走原生 HTML，这里用零宽零室 placeholder 还原，
   以避免依赖 rehype-raw 这样的额外 deps。
   策略：在 Markdown AST 处理之后、渲染为 React 节点之前，用一个 text 重写器。
   由于我们控制了 paragraph / heading / li 等几个容器，在它们内部运行拆分。 */

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildTermRegex(terms: string[]): RegExp | null {
  const cleaned = terms.filter(t => t && t.trim().length > 1);
  if (cleaned.length === 0) return null;
  // 按长度降序，避免“圣杯骑士”被 “圣杯” 先吃掉
  const sorted = [...cleaned].sort((a, b) => b.length - a.length);
  return new RegExp(sorted.map(escapeRegExp).join('|'), 'g');
}

function renderWithGlyphs(
  text: string,
  cardRe: RegExp | null,
  positionRe: RegExp | null
): React.ReactNode {
  if (!cardRe && !positionRe) return text;

  // 先按牌名拆，再在未装饰片段按阵位名拆
  const parts: Array<{ text: string; kind: 'plain' | 'card' | 'position' }> = [
    { text, kind: 'plain' },
  ];

  const splitBy = (re: RegExp, kind: 'card' | 'position'): void => {
    for (let i = parts.length - 1; i >= 0; i--) {
      const seg = parts[i];
      if (seg.kind !== 'plain') continue;
      const matches = [...seg.text.matchAll(re)];
      if (matches.length === 0) continue;

      const replacement: typeof parts = [];
      let cursor = 0;
      for (const m of matches) {
        const idx = m.index ?? 0;
        if (idx > cursor) {
          replacement.push({ text: seg.text.slice(cursor, idx), kind: 'plain' });
        }
        replacement.push({ text: m[0], kind });
        cursor = idx + m[0].length;
      }
      if (cursor < seg.text.length) {
        replacement.push({ text: seg.text.slice(cursor), kind: 'plain' });
      }
      parts.splice(i, 1, ...replacement);
    }
  };

  if (cardRe) splitBy(cardRe, 'card');
  if (positionRe) splitBy(positionRe, 'position');

  return parts.map((seg, i) => {
    if (seg.kind === 'card')     return <span key={i} className="glyph-card">{seg.text}</span>;
    if (seg.kind === 'position') return <span key={i} className="glyph-position">{seg.text}</span>;
    return seg.text;
  });
}

/** 递归遍历 ReactMarkdown 的 children，仅处理字符串叶节点 */
function decorateChildren(
  children: React.ReactNode,
  cardRe: RegExp | null,
  positionRe: RegExp | null
): React.ReactNode {
  if (!cardRe && !positionRe) return children;
  if (typeof children === 'string') {
    return renderWithGlyphs(children, cardRe, positionRe);
  }
  if (Array.isArray(children)) {
    return children.map((child, i) => {
      if (typeof child === 'string') {
        return <Fragment key={i}>{renderWithGlyphs(child, cardRe, positionRe)}</Fragment>;
      }
      return child;
    });
  }
  return children;
}

/* ─── Segment 解析（保留 thinking 标签处理） ─── */

function appendSegment(
  segments: InterpretationSegment[],
  type: InterpretationSegmentType,
  markdown: string
): void {
  if (!markdown.trim()) return;

  const normalizedMarkdown = type === 'thinking' ? markdown.trim() : markdown;
  const last = segments.at(-1);

  if (last && last.type === type) {
    last.markdown += normalizedMarkdown;
    return;
  }

  segments.push({ type, markdown: normalizedMarkdown });
}

function parseInterpretationSegments(rawContent: string): InterpretationSegment[] {
  const segments: InterpretationSegment[] = [];
  let activeType: InterpretationSegmentType = 'answer';
  let cursor = 0;

  for (const match of rawContent.matchAll(THINKING_TAG_PATTERN)) {
    const tag = match[0].toLowerCase();
    const index = match.index ?? 0;

    appendSegment(segments, activeType, rawContent.slice(cursor, index));
    activeType = tag.startsWith('</') ? 'answer' : 'thinking';
    cursor = index + match[0].length;
  }

  appendSegment(segments, activeType, rawContent.slice(cursor));
  return segments;
}

/**
 * 把模型多轮交错产生的 thinking / answer 段合并：
 * - thinking 全部并到顶部统一折叠块（每段间空一行）
 * - answer 拼成连续正文，避免被思考块切碎、视觉错乱
 */
function mergeSegments(segments: InterpretationSegment[]): {
  thinking: string;
  answer: string;
} {
  const thinkingChunks: string[] = [];
  const answerChunks: string[] = [];

  for (const seg of segments) {
    if (seg.type === 'thinking') {
      thinkingChunks.push(seg.markdown);
    } else {
      answerChunks.push(seg.markdown);
    }
  }

  return {
    thinking: thinkingChunks.join('\n\n'),
    answer: answerChunks.join(''),
  };
}

export function Interpretation({
  content,
  isLoading,
  error,
  staggerOnMount = false,
  cardTerms,
  positionTerms,
}: InterpretationProps) {
  /* ─── 错误态 ─── */
  if (error) {
    return (
      <div className="w-full max-w-4xl p-12 ink-panel-quiet anim-veil-rise">
        <div className="flex items-center gap-4 mb-5">
          <span className="text-gold-dim text-lg">◇</span>
          <h3 className="font-display text-xl text-bone tracking-[0.18em]">
            连 接 已 断
          </h3>
        </div>
        <div className="rule-h-gold w-20 mb-6" />
        <p className="font-body text-bone-dim text-base leading-relaxed mb-4 italic-soft">
          {error}
        </p>
        <p className="cn-label text-bone-dim">
          请 检 查 与 以 太 的 连 接 ， 然 后 重 试
        </p>
      </div>
    );
  }

  // 流式过程中追加金色光标
  const isStreamingActive = isLoading && content.length > 0;

  // 仅在历史重现时启用逐段揭幕；实时解读依赖 LLM 流式自然逐词显现
  const useStaggerReveal = staggerOnMount && !isLoading && content.length > 0;

  return (
    <div className="w-full max-w-4xl">
      {/* ─── 标题 ─── */}
      <div className="flex flex-col items-center gap-4 mb-12 anim-fade-in">
        <span className="text-gold text-xl anim-drift">✦</span>
        <h3 className="font-display text-2xl text-bone tracking-[0.32em] uppercase">
          神 谕
        </h3>
        <div className="rule-h-gold w-20" />
        <p className="font-body italic-soft text-bone-faint text-sm">
          The Oracle Speaks
        </p>
      </div>

      {/* ─── 内容容器 ─── */}
      <div
        className={`relative ink-panel-quiet transition-all duration-1000 ${
          isLoading && !content ? 'min-h-[320px]' : 'min-h-[120px]'
        }`}
        style={{ transitionTimingFunction: 'var(--ease-veil)' }}
      >
        <div className="p-10 md:p-16 relative">
          {content ? (
            <InterpretationBody
              content={content}
              streaming={isStreamingActive}
              stagger={useStaggerReveal}
              cardTerms={cardTerms}
              positionTerms={positionTerms}
              showSigil={!isLoading}
            />
          ) : isLoading ? (
            // ─── 加载态 · 通灵中 ───
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-7">
              <div className="relative">
                <span className="text-gold text-4xl anim-whisper">✦</span>
                <span className="absolute inset-0 anim-glow-pulse rounded-full" aria-hidden />
              </div>
              <p className="cn-label text-bone-dim">
                正 在 通 灵
              </p>
              <div className="flex gap-2.5">
                <span className="w-1 h-1 bg-[var(--gold-dim)] rounded-full anim-whisper" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 bg-[var(--gold-dim)] rounded-full anim-whisper" style={{ animationDelay: '400ms' }} />
                <span className="w-1 h-1 bg-[var(--gold-dim)] rounded-full anim-whisper" style={{ animationDelay: '800ms' }} />
              </div>
              <p className="font-body italic-soft text-bone-faint text-sm mt-2">
                星辰需要时间才能开口
              </p>
            </div>
          ) : (
            // ─── 空态 ───
            <div className="flex flex-col items-center justify-center py-14 gap-5">
              <span className="text-bone-whisper text-2xl">◇</span>
              <p className="cn-label text-bone-faint">
                等 待 牌 面
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 无外框的 markdown 解读正文：解析 thinking 段并渲染。
 * 供主解读区与 FollowUpPanel 共用。
 */
interface InterpretationBodyProps {
  content: string;
  streaming?: boolean;
  stagger?: boolean;
  cardTerms?: string[];
  positionTerms?: string[];
  /**
   * 是否在正文后面盖一个金色封印。
   * 仅在解读完成（非流式中）且有正文时应该为 true。
   */
  showSigil?: boolean;
}

export function InterpretationBody({
  content,
  streaming = false,
  stagger = false,
  cardTerms,
  positionTerms,
  showSigil = false,
}: InterpretationBodyProps) {
  const segments = parseInterpretationSegments(content);
  const { thinking, answer } = mergeSegments(segments);
  const showWaitingHint = streaming && !answer;

  // 关键词正则 · useMemo 避免每个 paragraph 重建
  const cardRe     = useMemo(() => buildTermRegex(cardTerms ?? []),     [cardTerms]);
  const positionRe = useMemo(() => buildTermRegex(positionTerms ?? []), [positionTerms]);

  const components: Components = useMemo(() => {
    if (!cardRe && !positionRe) return MARKDOWN_COMPONENTS;
    // 包装 paragraph / heading / li / strong / em 使其子元素被装饰
    const wrap =
      <T extends keyof typeof MARKDOWN_COMPONENTS>(
        key: T
      ): (typeof MARKDOWN_COMPONENTS)[T] => {
        const original = MARKDOWN_COMPONENTS[key];
        if (!original) return original;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return ((props: any) => {
          const decorated = decorateChildren(props.children, cardRe, positionRe);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (original as any)({ ...props, children: decorated });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;
      };
    return {
      ...MARKDOWN_COMPONENTS,
      p:   wrap('p'),
      h1:  wrap('h1'),
      h2:  wrap('h2'),
      h3:  wrap('h3'),
      h4:  wrap('h4'),
      li:  wrap('li'),
      em:  wrap('em'),
      strong: wrap('strong'),
      blockquote: wrap('blockquote'),
    };
  }, [cardRe, positionRe]);

  return (
    <div
      className={`interpretation-content ${
        stagger
          ? 'interpretation-reveal'
          : streaming
          ? 'interpretation-streaming'
          : ''
      }`}
    >
      {/* 思考块 · 统一折叠在顶部，不再切碎正文 */}
      {thinking && (
        <details className="group ink-panel-quiet my-6">
          <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer select-none [&::-webkit-details-marker]:hidden">
            <div className="flex items-center gap-4">
              <span className="text-gold-dim text-sm">◇</span>
              <div className="flex flex-col gap-1.5">
                <span className="cn-label text-bone">
                  模 型 思 考
                </span>
                <span className="cn-hint text-bone-faint group-open:hidden">
                  点 击 展 开
                </span>
                <span className="cn-hint text-bone-faint hidden group-open:inline">
                  点 击 折 叠
                </span>
              </div>
            </div>
            <span
              className="text-bone-faint transition-transform duration-700 group-open:rotate-180"
              style={{ transitionTimingFunction: 'var(--ease-veil)' }}
            >
              ⌄
            </span>
          </summary>

          <div className="px-6 pb-6 hairline-top pt-5">
            <ReactMarkdown components={MARKDOWN_COMPONENTS}>
              {thinking}
            </ReactMarkdown>
          </div>
        </details>
      )}

      {/* 思考已经在动但正文还未出现 · 给一个轻量等候提示 */}
      {showWaitingHint && (
        <div className="flex items-center gap-4 py-3">
          <span className="text-gold-dim anim-whisper">✦</span>
          <span className="cn-hint text-bone-faint">神 谕 正 在 凝 聚</span>
        </div>
      )}

      {/* 正文 · 连续渲染 */}
      {answer && (
        <ReactMarkdown components={components}>
          {answer}
        </ReactMarkdown>
      )}

      {streaming && answer && (
        <span className="streaming-cursor" aria-hidden />
      )}

      {/* 仪式封印 · 解读完成后盖在正文底部 */}
      {showSigil && answer && !streaming && <SigilSeal />}
    </div>
  );
}

/** 金色仪式封印 · 解读完成的“盖印”动作 */
function SigilSeal(): React.ReactElement {
  // 上下左右四道小到许 · 表示四象限定
  const ticks = [0, 90, 180, 270];
  return (
    <div className="sigil-seal" aria-hidden>
      {ticks.map((deg) => (
        <span
          key={deg}
          className="sigil-ring-tick"
          style={{ transform: `rotate(${deg}deg) translateX(28px)` }}
        />
      ))}
      <span className="sigil-glyph">✦</span>
    </div>
  );
}
