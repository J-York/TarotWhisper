'use client';

import { useEffect, useRef } from 'react';

export type ConfirmTone = 'neutral' | 'danger';

export interface ConfirmDialogProps {
  /** 是否显示。受控属性。 */
  isOpen: boolean;
  /** 主标题（中文，标签风格）。例：「删 除 记 录」 */
  title: string;
  /** 描述文本（衬线斜体小字）。可包含变量，例：「确 定 要 删 除 选 中 的 3 条 记 录 吗 ？」 */
  message: string;
  /** 确认按钮文字。默认「确 认」 */
  confirmLabel?: string;
  /** 取消按钮文字。默认「取 消」 */
  cancelLabel?: string;
  /** 确认按钮的语义色调。danger 用红调金，neutral 用普通金。 */
  tone?: ConfirmTone;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 自定义确认对话框 · 与 ApiSettings 同源风格
 * - 极细金色/骨色边框
 * - 衬线斜体描述
 * - Escape 关闭、Enter 确认、首焦点落在确认按钮
 * - 进入时柔缓 veil-rise，退出由父组件直接卸载（足够轻量）
 */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = '确 认',
  cancelLabel = '取 消',
  tone = 'neutral',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  /* ─── Esc 关闭 / Enter 确认 / body scroll lock / 首焦点 ─── */
  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };
    window.addEventListener('keydown', onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // 首焦点 · 确认按钮（让 Enter 直接生效）
    const focusTimer = window.setTimeout(() => {
      confirmBtnRef.current?.focus();
    }, 60);

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
    };
  }, [isOpen, onCancel, onConfirm]);

  if (!isOpen) return null;

  const confirmClass =
    tone === 'danger'
      ? 'btn-ink flex-1 py-5 text-bone hover:text-gold-warm'
      : 'btn-ink-primary flex-1 py-5';

  return (
    <div
      className="fixed inset-0 bg-[var(--ink-void)]/92 backdrop-blur-md flex items-center justify-center z-[60] p-4 anim-fade-in"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="ink-panel-quiet bg-[var(--ink-deep)] w-full max-w-md anim-veil-rise"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Header ─── */}
        <div className="flex items-center gap-4 px-10 py-7 hairline-bottom">
          <span className={tone === 'danger' ? 'text-gold-dim' : 'text-gold-dim'}>
            {tone === 'danger' ? '◇' : '✦'}
          </span>
          <h2 id="confirm-dialog-title" className="cn-nav text-bone">
            {title}
          </h2>
        </div>

        {/* ─── Body ─── */}
        <div className="px-10 py-10">
          <div className="rule-h-gold w-12 mb-7" />
          <p className="font-body italic-soft text-bone-dim text-base leading-loose">
            {message}
          </p>
        </div>

        {/* ─── Footer ─── */}
        <div className="flex hairline-top">
          <button
            onClick={onCancel}
            className="btn-ink-ghost flex-1 py-5"
            style={{ boxShadow: 'inset -0.5px 0 0 0 var(--ink-line)' }}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            className={confirmClass}
            style={{ border: 'none' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
