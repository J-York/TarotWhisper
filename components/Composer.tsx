'use client';

import { useEffect, useRef, type ReactElement } from 'react';

import type { DrawMode } from '@/hooks/useAgentChat';

/** 下一次发送会发生什么 */
export type ComposerIntent = 'new' | 'follow-up' | 'blocked';

interface ComposerProps {
  variant: 'hero' | 'dock';
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  intent: ComposerIntent;
  mode: DrawMode;
  onModeChange: (mode: DrawMode) => void;
  /** 当前能否发送（内容、API、运行状态都已考虑） */
  canSubmit: boolean;
  /** 正在生成：显示停止按钮 */
  isRunning: boolean;
  /** 别处的回合仍在生成（例如离开页面后又回来），此时不能发送也无法停止 */
  isBusy: boolean;
  focusSignal?: number;
}

const MODES: { value: DrawMode; label: string }[] = [
  { value: 'oracle', label: '神谕选牌' },
  { value: 'self', label: '我自己抽' },
];

const MODE_HINTS: Record<DrawMode, string> = {
  oracle: '神谕会按你的问题挑一个牌阵、抽牌，再写下解读。',
  self: '你来选牌阵、洗牌、一张张翻开，最后请神谕解读。',
};

function placeholderFor(intent: ComposerIntent, mode: DrawMode, isBusy: boolean): string {
  if (isBusy) return '神谕正在回信…';
  if (intent === 'blocked') return '先把这次的牌抽完，或者放弃后再提问';
  if (intent === 'follow-up') return '继续追问这次占卜…';
  return mode === 'self'
    ? '写下你的问题，然后亲手洗牌、抽牌'
    : '写下你的问题，比如：这份新工作值得接受吗？';
}

export function Composer({
  variant,
  value,
  onChange,
  onSubmit,
  onStop,
  intent,
  mode,
  onModeChange,
  canSubmit,
  isRunning,
  isBusy,
  focusSignal = 0,
}: ComposerProps): ReactElement {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isDock = variant === 'dock';
  const showModes = intent === 'new' && !isBusy;
  const inputDisabled = isBusy || intent === 'blocked';

  // 底栏输入框随内容长高；清空后复原
  useEffect(() => {
    const el = inputRef.current;
    if (!isDock || !el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value, isDock]);

  useEffect(() => {
    if (focusSignal > 0) inputRef.current?.focus();
  }, [focusSignal]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    // 输入法组字时的回车只是确认候选词
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSubmit) onSubmit();
    }
  };

  const modeToggle = (
    <div className="inline-flex rounded-md border border-line-strong bg-surface p-0.5" role="group" aria-label="选牌方式">
      {MODES.map((m) => (
        <button
          key={m.value}
          type="button"
          onClick={() => onModeChange(m.value)}
          aria-pressed={mode === m.value}
          className={`h-8 rounded-[5px] px-3 text-[13px] tracking-[0.06em] transition-colors duration-150 ${
            mode === m.value ? 'bg-ink text-canvas' : 'text-ink-soft hover:text-ink'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );

  const submitLabel = intent === 'follow-up' ? '追问' : mode === 'self' ? '开始抽牌' : '请神谕解读';

  if (!isDock) {
    return (
      <div>
        <div className="panel px-5 pb-5 pt-4 md:px-7 md:pb-6 md:pt-5">
          <label htmlFor="oracle-question" className="sr-only">
            你的问题
          </label>
          <textarea
            id="oracle-question"
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholderFor(intent, mode, isBusy)}
            disabled={inputDisabled}
            rows={3}
            spellCheck={false}
            className="ruled field-bare block w-full resize-none font-hand text-[19px] text-voice md:text-xl"
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            {modeToggle}
            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit}
              className="btn btn-primary h-11 px-6"
            >
              {submitLabel}
            </button>
          </div>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
          {MODE_HINTS[mode]}
          <span className="hidden md:inline"> Enter 发送，Shift + Enter 换行。</span>
        </p>
      </div>
    );
  }

  return (
    <div>
      {showModes && <div className="mb-2 flex items-center gap-3">{modeToggle}</div>}
      <div className="field-shell flex items-end gap-2 py-1.5 pl-4 pr-1.5">
        <label htmlFor="oracle-dock-input" className="sr-only">
          {intent === 'follow-up' ? '追问' : '你的问题'}
        </label>
        <textarea
          id="oracle-dock-input"
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholderFor(intent, mode, isBusy)}
          disabled={inputDisabled}
          rows={1}
          spellCheck={false}
          className="field-bare max-h-40 min-h-9 flex-1 resize-none py-1.5 font-hand text-[17px] leading-relaxed text-voice disabled:cursor-not-allowed"
        />
        {isRunning ? (
          <button type="button" onClick={onStop} className="btn btn-secondary h-9 shrink-0 px-4 text-sm">
            停止
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className="btn btn-primary h-9 shrink-0 px-4 text-sm"
          >
            {submitLabel}
          </button>
        )}
      </div>
    </div>
  );
}
