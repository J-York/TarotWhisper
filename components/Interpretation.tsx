'use client';

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

export function Interpretation({
  content,
  isLoading,
  error,
  staggerOnMount = false,
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
  const segments = parseInterpretationSegments(content);
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
            <div
              className={`interpretation-content ${
                useStaggerReveal
                  ? 'interpretation-reveal'
                  : isStreamingActive
                  ? 'interpretation-streaming'
                  : ''
              }`}
            >
              {segments.map((segment, index) => {
                if (segment.type === 'thinking') {
                  return (
                    <details
                      key={`thinking-${index}`}
                      className="group ink-panel-quiet my-6"
                    >
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
                          {segment.markdown}
                        </ReactMarkdown>
                      </div>
                    </details>
                  );
                }

                return (
                  <ReactMarkdown
                    key={`answer-${index}`}
                    components={MARKDOWN_COMPONENTS}
                  >
                    {segment.markdown}
                  </ReactMarkdown>
                );
              })}

              {/* 流式光标 — 仅在加载中显示 */}
              {isStreamingActive && (
                <span className="streaming-cursor" aria-hidden />
              )}
            </div>
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
