'use client';

import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

interface InterpretationProps {
  content: string;
  isLoading: boolean;
  error: string | null;
}

type InterpretationSegmentType = 'answer' | 'thinking';

interface InterpretationSegment {
  type: InterpretationSegmentType;
  markdown: string;
}

const THINKING_TAG_PATTERN = /<\/?(think|thinking)>/gi;

const MARKDOWN_COMPONENTS: Components = {
  h1: ({ children }) => (
    <h1 className="text-2xl font-serif text-bone mt-10 mb-5 first:mt-0 tracking-wider pb-3 border-b border-[var(--ink-line)]">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-serif text-bone mt-8 mb-4 first:mt-0 tracking-wider">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-serif text-bone mt-6 mb-3 first:mt-0 tracking-wider">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-base font-serif text-bone mt-5 mb-2 first:mt-0 tracking-wider">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="text-bone-dim text-base leading-loose mb-5 last:mb-0 font-light">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="list-none text-bone-dim text-base leading-loose my-5 space-y-2 pl-0 font-light marker:text-gold-dim">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside text-bone-dim text-base leading-loose my-5 space-y-2 pl-2 font-light">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-bone-dim leading-loose pl-4 relative before:content-['◇'] before:absolute before:left-0 before:text-gold-dim before:text-xs before:top-2">
      {children}
    </li>
  ),
  strong: ({ children }) => (
    <strong className="text-gold font-normal tracking-wide">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="text-bone italic">{children}</em>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l border-[var(--gold-dim)] pl-5 my-6 italic text-bone-faint font-light">
      {children}
    </blockquote>
  ),
  hr: () => (
    <hr className="my-8 border-t border-[var(--ink-line)]" />
  ),
};

function appendSegment(
  segments: InterpretationSegment[],
  type: InterpretationSegmentType,
  markdown: string
): void {
  if (!markdown.trim()) {
    return;
  }

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

export function Interpretation({ content, isLoading, error }: InterpretationProps) {
  if (error) {
    return (
      <div className="w-full max-w-4xl p-10 ink-panel-quiet anim-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-gold-dim">◇</span>
          <h3 className="font-serif text-xl text-bone tracking-wider">连 接 已 断</h3>
        </div>
        <div className="rule-h-fade w-24 mb-5" />
        <p className="text-bone-dim font-light leading-relaxed text-sm mb-3">{error}</p>
        <p className="text-bone-faint text-xs tracking-quiet uppercase">
          请检查与以太的连接，然后重试
        </p>
      </div>
    );
  }

  const displayContent = isLoading ? `${content}▌` : content;
  const segments = parseInterpretationSegments(displayContent);

  return (
    <div className="w-full max-w-4xl">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 mb-10 anim-fade-in">
        <span className="text-gold text-lg">✦</span>
        <h3 className="text-2xl font-serif text-bone tracking-mystic uppercase">
          神 谕
        </h3>
        <div className="rule-h-fade w-24" />
      </div>

      <div className={`
        relative ink-panel-quiet transition-all duration-1000
        ${isLoading ? 'min-h-[300px]' : 'min-h-[100px]'}
      `}>
        <div className="p-8 md:p-14 relative">
          {content ? (
            <div className="interpretation-content">
              {segments.map((segment, index) => {
                if (segment.type === 'thinking') {
                  return (
                    <details
                      key={`thinking-${index}`}
                      className="group ink-panel-quiet my-5"
                    >
                      <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer select-none [&::-webkit-details-marker]:hidden">
                        <div className="flex items-center gap-3">
                          <span className="text-gold-dim text-sm">◇</span>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs tracking-mystic uppercase text-bone-dim">模 型 思 考</span>
                            <span className="text-[10px] tracking-quiet uppercase text-bone-whisper group-open:hidden">点 击 展 开</span>
                            <span className="text-[10px] tracking-quiet uppercase text-bone-whisper hidden group-open:inline">点 击 折 叠</span>
                          </div>
                        </div>
                        <span className="text-bone-faint transition-transform duration-300 group-open:rotate-180">⌄</span>
                      </summary>

                      <div className="px-5 pb-5 border-t border-[var(--ink-line)] pt-4">
                        <ReactMarkdown components={MARKDOWN_COMPONENTS}>
                          {segment.markdown}
                        </ReactMarkdown>
                      </div>
                    </details>
                  );
                }

                return (
                  <ReactMarkdown key={`answer-${index}`} components={MARKDOWN_COMPONENTS}>
                    {segment.markdown}
                  </ReactMarkdown>
                );
              })}
            </div>
          ) : isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
              <div className="relative">
                <span className="text-gold text-3xl anim-whisper">✦</span>
              </div>
              <p className="text-bone-dim tracking-mystic uppercase text-xs">
                正 在 通 灵
              </p>
              <div className="flex gap-2">
                <span className="w-1 h-1 bg-[var(--gold-dim)] rounded-full anim-whisper" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 bg-[var(--gold-dim)] rounded-full anim-whisper" style={{ animationDelay: '300ms' }} />
                <span className="w-1 h-1 bg-[var(--gold-dim)] rounded-full anim-whisper" style={{ animationDelay: '600ms' }} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <span className="text-bone-whisper text-2xl">◇</span>
              <p className="text-bone-whisper tracking-mystic text-xs uppercase">
                等 待 牌 面
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
