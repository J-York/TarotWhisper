'use client';

import { Fragment, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

import { CardPlate } from '@/components/CardPlate';
import { Seal } from '@/components/Seal';
import type { RetryState } from '@/lib/api/stream-client';
import type { DrawnCard } from '@/lib/tarot/types';

interface InterpretationProps {
  content: string;
  isLoading: boolean;
  error: string | null;
  /**
   * 非致命警示（如输出被截断）。
   * 与 error 不同：正文照常显示，仅在底部附加提示。
   */
  notice?: string | null;
  /** 传入后，错误态显示“去配置”按钮 */
  onOpenSettings?: () => void;
  /** 历史回看时逐段浮现；实时解读本身就是流式出现，不需要 */
  staggerOnMount?: boolean;
  /** 本次牌面：正文里的牌名可悬停看牌，阵位名加点线 */
  drawnCards?: DrawnCard[];
  /** 自动重试的瞬时状态。非空时在加载态显示「正在重试 N/M」 */
  retry?: RetryState | null;
  /** 写完后在末尾落款盖印 */
  signed?: boolean;
}

export function Interpretation({
  content,
  isLoading,
  error,
  notice,
  onOpenSettings,
  staggerOnMount = false,
  drawnCards,
  retry,
  signed = true,
}: InterpretationProps): ReactElement | null {
  const errorBlock = error ? (
    <div
      role="alert"
      className="anim-fade rounded-md border border-line border-l-[3px] border-l-accent bg-accent-soft/50 px-5 py-4"
    >
      <p className="text-sm font-semibold text-accent-strong">
        {content ? '回信没能写完' : '这次没能收到回信'}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{error}</p>
      {!content && (
        <p className="mt-1 text-[13px] text-ink-muted">请检查 API 配置与网络，然后重试。</p>
      )}
      {onOpenSettings && (
        <button type="button" onClick={onOpenSettings} className="btn btn-secondary mt-3 h-9 px-4 text-sm">
          去配置
        </button>
      )}
    </div>
  ) : null;

  if (!content) {
    if (errorBlock) return errorBlock;
    if (!isLoading) return null;
    return (
      <div className="flex items-center gap-3 py-6" role="status">
        <span className="flex gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="anim-pulse h-1.5 w-1.5 rounded-full bg-accent"
              style={{ animationDelay: `${i * 220}ms` }}
            />
          ))}
        </span>
        <span className="font-hand text-[17px] text-ink-soft">
          {retry ? `连接中断，正在重试（${retry.attempt} / ${retry.max}）` : '神谕正在落笔…'}
        </span>
      </div>
    );
  }

  return (
    <div>
      <InterpretationBody
        content={content}
        streaming={isLoading}
        stagger={staggerOnMount && !isLoading}
        drawnCards={drawnCards}
        signed={signed && !isLoading && !error}
      />
      {errorBlock && <div className="mt-6">{errorBlock}</div>}
      {notice && !isLoading && (
        <p className="anim-fade mt-6 border-l-2 border-line-strong pl-3 text-[13px] leading-relaxed text-ink-muted">
          {notice}
        </p>
      )}
    </div>
  );
}

/* ─── 牌名 / 阵位名装饰 ─── */

interface MentionIndex {
  /** 正文只标牌名：阵位名多是日常用词（过去、现在），逢词必标会误伤 */
  cardPattern: RegExp | null;
  /** 标题与强调里连阵位名一起标 */
  fullPattern: RegExp;
  cards: Map<string, DrawnCard>;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function termsPattern(terms: string[]): RegExp | null {
  // 单字词误伤太多；按长度降序，避免“圣杯骑士”被“圣杯”先吃掉
  const list = terms.filter((t) => t.trim().length > 1).sort((a, b) => b.length - a.length);
  return list.length > 0 ? new RegExp(list.map(escapeRegExp).join('|'), 'g') : null;
}

function buildMentionIndex(drawnCards: DrawnCard[] | undefined): MentionIndex | null {
  if (!drawnCards?.length) return null;

  const cards = new Map<string, DrawnCard>();
  const positions = new Set<string>();
  for (const drawn of drawnCards) {
    cards.set(drawn.card.nameCn, drawn);
    cards.set(drawn.card.name, drawn);
    positions.add(drawn.position.nameCn);
  }

  const fullPattern = termsPattern([...cards.keys(), ...positions]);
  if (!fullPattern) return null;
  return { cardPattern: termsPattern([...cards.keys()]), fullPattern, cards };
}

function decorateText(text: string, index: MentionIndex, pattern: RegExp): ReactNode {
  const out: ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(pattern)) {
    const term = match[0];
    const at = match.index ?? 0;
    if (at > cursor) out.push(text.slice(cursor, at));

    const drawn = index.cards.get(term);
    if (drawn) {
      out.push(
        // tabIndex=-1：触屏点按即可聚焦弹出预览，又不挤进键盘 Tab 顺序
        <span key={at} className="mention-card" tabIndex={-1}>
          {term}
          <span className="mention-preview" aria-hidden>
            <CardPlate card={drawn.card} isReversed={drawn.isReversed} sizes="88px" decorative />
            <span className="mt-1 block">
              {drawn.card.nameCn}
              {drawn.isReversed ? ' · 逆位' : ''}
            </span>
          </span>
        </span>,
      );
    } else {
      out.push(
        <span key={at} className="mention-position">
          {term}
        </span>,
      );
    }
    cursor = at + term.length;
  }

  if (cursor === 0) return text;
  if (cursor < text.length) out.push(text.slice(cursor));
  return out;
}

function decorate(children: ReactNode, index: MentionIndex, withPositions: boolean): ReactNode {
  const pattern = withPositions ? index.fullPattern : index.cardPattern;
  if (!pattern) return children;
  if (typeof children === 'string') return decorateText(children, index, pattern);
  if (Array.isArray(children)) {
    return children.map((child, i) =>
      typeof child === 'string' ? <Fragment key={i}>{decorateText(child, index, pattern)}</Fragment> : child,
    );
  }
  return children;
}

function makeComponents(index: MentionIndex | null): Components | undefined {
  if (!index) return undefined;
  return {
    p: ({ children }) => <p>{decorate(children, index, false)}</p>,
    li: ({ children }) => <li>{decorate(children, index, false)}</li>,
    h1: ({ children }) => <h1>{decorate(children, index, true)}</h1>,
    h2: ({ children }) => <h2>{decorate(children, index, true)}</h2>,
    h3: ({ children }) => <h3>{decorate(children, index, true)}</h3>,
    h4: ({ children }) => <h4>{decorate(children, index, true)}</h4>,
    strong: ({ children }) => <strong>{decorate(children, index, true)}</strong>,
    em: ({ children }) => <em>{decorate(children, index, true)}</em>,
  };
}

/* ─── 思考段解析 ─── */

const THINKING_TAG_PATTERN = /<\/?(think|thinking)>/gi;

/**
 * 把模型交错输出的 thinking / answer 段拆开：
 * thinking 合并到顶部的折叠块，answer 拼成连续正文，避免被思考块切碎。
 */
function splitThinking(rawContent: string): { thinking: string; answer: string } {
  const thinking: string[] = [];
  const answer: string[] = [];
  let inThinking = false;
  let cursor = 0;

  const push = (text: string): void => {
    if (!text.trim()) return;
    if (inThinking) thinking.push(text.trim());
    else answer.push(text);
  };

  for (const match of rawContent.matchAll(THINKING_TAG_PATTERN)) {
    const at = match.index ?? 0;
    push(rawContent.slice(cursor, at));
    inThinking = !match[0].startsWith('</');
    cursor = at + match[0].length;
  }
  push(rawContent.slice(cursor));

  return { thinking: thinking.join('\n\n'), answer: answer.join('') };
}

/* ─── 正文 ─── */

interface InterpretationBodyProps {
  content: string;
  streaming?: boolean;
  stagger?: boolean;
  drawnCards?: DrawnCard[];
  /** 末尾落款盖印；只应在写完且有正文时为 true */
  signed?: boolean;
}

/** 无外框的回信正文：折叠思考段、渲染 Markdown、装饰牌名 */
export function InterpretationBody({
  content,
  streaming = false,
  stagger = false,
  drawnCards,
  signed = false,
}: InterpretationBodyProps): ReactElement {
  const { thinking, answer } = splitThinking(content);
  // 思考块默认折叠；折叠时不必把整段思考喂给 Markdown 解析器
  const [thinkingOpen, setThinkingOpen] = useState(false);

  const mentionIndex = useMemo(() => buildMentionIndex(drawnCards), [drawnCards]);
  const components = useMemo(() => makeComponents(mentionIndex), [mentionIndex]);
  // 流式输出到很长时跳过装饰，降低每个 token 的重渲染开销
  const answerComponents = streaming && answer.length > 4_000 ? undefined : components;

  return (
    <div>
      {thinking && (
        <details
          className="group mb-6 rounded-md border border-line bg-sunken/40"
          open={thinkingOpen}
          onToggle={(event) => setThinkingOpen(event.currentTarget.open)}
        >
          <summary className="flex cursor-pointer select-none items-center justify-between gap-4 px-4 py-2.5 text-[13px] text-ink-muted [&::-webkit-details-marker]:hidden">
            <span>
              模型的草稿 · {thinking.length.toLocaleString()} 字{streaming && !answer ? ' · 仍在思考' : ''}
            </span>
            <svg
              viewBox="0 0 16 16"
              className="h-3.5 w-3.5 transition-transform duration-200 group-open:rotate-180"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden
            >
              <path d="m4 6 4 4 4-4" />
            </svg>
          </summary>
          {thinkingOpen && (
            <div className="border-t border-line px-4 pb-4 pt-3">
              {/* 流式中用纯文本，避免每个 token 都重新解析 Markdown */}
              {streaming ? (
                <pre className="letter letter-quiet m-0 whitespace-pre-wrap">{thinking}</pre>
              ) : (
                <div className="letter letter-quiet">
                  <ReactMarkdown>{thinking}</ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </details>
      )}

      {streaming && !answer && (
        <p className="flex items-center gap-2.5 font-hand text-[17px] text-ink-soft" role="status">
          <span className="ink-caret ml-0" aria-hidden />
          神谕在打草稿…
        </p>
      )}

      {answer && (
        <div className={`letter ${stagger ? 'letter-reveal' : ''}`}>
          <ReactMarkdown components={answerComponents}>{answer}</ReactMarkdown>
          {streaming && <span className="ink-caret" aria-hidden />}
        </div>
      )}

      {signed && answer && (
        <div className="mt-8 flex items-center justify-end gap-3" aria-hidden>
          <span className="font-hand text-[17px] text-ink-muted">—— 神谕</span>
          <Seal text="谕" stamp />
        </div>
      )}
    </div>
  );
}
