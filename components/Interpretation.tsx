'use client';

import { Fragment, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import type { RetryState } from '@/lib/api/stream-client';

interface InterpretationProps {
  content: string;
  isLoading: boolean;
  error: string | null;
  /**
   * 非致命警示（如输出被截断）。
   * 与 error 不同：正文照常显示，仅在底部附加提示条。
   */
  notice?: string | null;
  /** 传入后，错误态显示“去配置”按钮 */
  onOpenSettings?: () => void;
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
  /**
   * 自动重试的瞬时状态。非空时在加载态显示「正在重试 N/M」。
   */
  retry?: RetryState | null;
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
    <h1 className="mb-4 mt-9 border-b border-[var(--ink-line)] pb-3 font-heading text-xl text-bone first:mt-0 md:text-[22px]">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-8 font-heading text-lg text-bone first:mt-0 md:text-xl">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2.5 mt-7 font-heading text-base text-bone first:mt-0 md:text-[17px]">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="mb-2 mt-6 font-heading text-[15px] text-bone first:mt-0">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="mb-4 font-body text-[15px] font-light leading-[1.9] text-bone-dim last:mb-0 md:text-base md:leading-[1.95]">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="my-4 list-none space-y-2 pl-0 font-body text-[15px] font-light leading-[1.9] text-bone-dim md:text-base">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 list-decimal space-y-2 pl-5 font-body text-[15px] font-light leading-[1.9] text-bone-dim md:text-base">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="relative pl-5 leading-[1.9] text-bone-dim before:absolute before:left-0 before:top-0 before:text-[10px] before:text-gold-dim before:content-['◆'] before:opacity-80">
      {children}
    </li>
  ),
  strong: ({ children }) => (
    <strong className="font-medium text-gold-warm">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="font-body italic text-bone">{children}</em>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-6 rounded-r-lg border-l-2 border-[var(--gold-dim)] bg-[rgba(210,178,116,0.05)] py-2 pl-4 pr-4 font-body text-[15px] italic text-bone-faint">
      {children}
    </blockquote>
  ),
  hr: () => (
    <hr className="my-8 border-0 rule-h-fade" />
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
): ReactNode {
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
  children: ReactNode,
  cardRe: RegExp | null,
  positionRe: RegExp | null
): ReactNode {
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
  notice,
  onOpenSettings,
  staggerOnMount = false,
  cardTerms,
  positionTerms,
  retry,
}: InterpretationProps) {
  /* ─── 错误态 ─── */
  if (error) {
    return (
      <div className="w-full rounded-xl border border-[rgba(210,178,116,0.3)] bg-[rgba(210,178,116,0.05)] p-6 anim-fade-in md:p-8">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-full border border-[var(--gold-faint)] text-sm text-gold" aria-hidden>
            ◇
          </span>
          <h3 className="section-title">连接已断</h3>
        </div>
        <p className="mt-4 font-body text-sm leading-relaxed text-bone-dim">{error}</p>
        <p className="mt-2 text-xs text-bone-faint">请检查 API 配置与网络，然后重新解读。</p>
        {onOpenSettings && (
          <button onClick={onOpenSettings} className="btn-ink mt-5 h-9 px-4 text-sm">
            去配置
          </button>
        )}
      </div>
    );
  }

  // 流式过程中追加金色光标
  const isStreamingActive = isLoading && content.length > 0;

  // 仅在历史重现时启用逐段揭幕；实时解读依赖 LLM 流式自然逐词显现
  const useStaggerReveal = staggerOnMount && !isLoading && content.length > 0;

  return (
    <div className="w-full">
      {/* ─── 标题 ─── */}
      <div className="mb-3 flex items-center gap-2.5">
        <span className="text-xs text-gold" aria-hidden>✦</span>
        <h3 className="text-xs tracking-[0.16em] text-gold-dim">神谕</h3>
        <span className="h-px flex-1 bg-[var(--ink-line)]" />
        {isLoading && <span className="text-[11px] text-bone-faint">生成中…</span>}
      </div>

      {/* ─── 内容容器 ─── */}
      <div className="surface px-5 py-6 md:px-8 md:py-8">
        {content ? (
          <>
            <InterpretationBody
              content={content}
              streaming={isStreamingActive}
              stagger={useStaggerReveal}
              cardTerms={cardTerms}
              positionTerms={positionTerms}
              showSigil={!isLoading}
            />
            {/* 非致命警示 · 正文之下的安静提示条 */}
            {notice && !isLoading && (
              <div className="mt-7 rounded-lg border-l-2 border-[var(--gold-dim)] bg-[rgba(210,178,116,0.05)] px-4 py-3 anim-fade-in">
                <p className="font-body text-xs leading-relaxed text-bone-faint">
                  <span className="mr-1.5 text-gold-dim" aria-hidden>◇</span>
                  {notice}
                </p>
              </div>
            )}
          </>
        ) : isLoading ? (
          // ─── 加载态 · 通灵中 ───
          <div className="flex min-h-[260px] flex-col items-center justify-center gap-4">
            <span className="text-2xl text-gold anim-whisper" aria-hidden>✦</span>
            <p className="text-xs tracking-[0.16em] text-bone-dim">
              {retry ? '正在重新连接' : '正在通灵'}
            </p>
            <div className="flex gap-1.5" aria-hidden>
              <span className="h-1 w-1 rounded-full bg-[var(--gold-dim)] anim-whisper" style={{ animationDelay: '0ms' }} />
              <span className="h-1 w-1 rounded-full bg-[var(--gold-dim)] anim-whisper" style={{ animationDelay: '400ms' }} />
              <span className="h-1 w-1 rounded-full bg-[var(--gold-dim)] anim-whisper" style={{ animationDelay: '800ms' }} />
            </div>
            <p className="text-xs text-bone-faint">
              {retry
                ? `连接中断，正在重试（${retry.attempt} / ${retry.max}）`
                : '长思考模型可能需要等待一会儿'}
            </p>
          </div>
        ) : (
          // ─── 空态 ───
          <div className="flex min-h-[160px] flex-col items-center justify-center gap-3">
            <span className="text-xl text-bone-whisper" aria-hidden>◇</span>
            <p className="text-xs tracking-[0.16em] text-bone-faint">等待牌面</p>
          </div>
        )}
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
  // 思考块默认折叠；折叠时不必把整段思考喂给 Markdown 解析器
  const [thinkingOpen, setThinkingOpen] = useState(false);

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

  // 流式中的正文：超过一定长度时跳过关键词装饰，降低每帧开销
  const answerComponents = streaming && answer.length > 4_000
    ? MARKDOWN_COMPONENTS
    : components;

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
        <details
          className="group my-5 rounded-lg border border-[var(--ink-line)] bg-[rgba(10,8,18,0.35)]"
          open={thinkingOpen}
          onToggle={(event) => {
            setThinkingOpen((event.currentTarget as HTMLDetailsElement).open);
          }}
        >
          <summary className="flex cursor-pointer select-none items-center justify-between gap-4 px-4 py-3 [&::-webkit-details-marker]:hidden">
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] text-gold-dim" aria-hidden>◇</span>
              <span className="text-xs text-bone-dim">模型思考</span>
              <span className="text-[11px] text-bone-faint">
                {streaming && !answer
                  ? `进行中 · ${thinking.length.toLocaleString()} 字`
                  : `${thinking.length.toLocaleString()} 字`}
              </span>
            </div>
            <span className="text-[11px] text-bone-faint transition-transform duration-300 group-open:rotate-180" aria-hidden>
              ⌄
            </span>
          </summary>

          {/* 流式中用纯文本避免反复解析 Markdown；完成后才走 ReactMarkdown */}
          {thinkingOpen && (
            <div className="border-t border-[var(--ink-line)] px-4 pb-4 pt-3">
              {streaming ? (
                <pre className="m-0 whitespace-pre-wrap break-words font-body text-sm font-light leading-[1.85] text-bone-dim">
                  {thinking}
                </pre>
              ) : (
                <ReactMarkdown components={MARKDOWN_COMPONENTS}>{thinking}</ReactMarkdown>
              )}
            </div>
          )}
        </details>
      )}

      {/* 思考已经在动但正文还未出现 · 给一个轻量等候提示 */}
      {showWaitingHint && (
        <div className="flex items-center gap-2.5 py-2">
          <span className="text-xs text-gold-dim anim-whisper" aria-hidden>✦</span>
          <span className="text-xs text-bone-faint">神谕正在凝聚</span>
        </div>
      )}

      {/* 正文 · 连续渲染 */}
      {answer && (
        <ReactMarkdown components={answerComponents}>
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
function SigilSeal(): ReactElement {
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
