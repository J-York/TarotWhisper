'use client';

import { useEffect, useRef, type ReactElement } from 'react';

export type ConfirmTone = 'neutral' | 'danger';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 确认对话框 · 与 ApiSettings 同源风格
 * Escape 关闭、Enter 确认、首焦点落在确认按钮。
 */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = '确认',
  cancelLabel = '取消',
  tone = 'neutral',
  onConfirm,
  onCancel,
}: ConfirmDialogProps): ReactElement | null {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

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

    const focusTimer = window.setTimeout(() => confirmBtnRef.current?.focus(), 60);

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
    };
  }, [isOpen, onCancel, onConfirm]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--ink-void)]/85 p-4 backdrop-blur-md anim-fade-in"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="surface w-full max-w-sm bg-[var(--ink-deep)] anim-veil-rise"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 px-6 py-4">
          <span className={tone === 'danger' ? 'text-gold-warm' : 'text-gold-dim'} aria-hidden>
            {tone === 'danger' ? '◇' : '✦'}
          </span>
          <h2 id="confirm-dialog-title" className="section-title">{title}</h2>
        </div>

        <div className="border-y border-[var(--ink-line)] px-6 py-5">
          <p className="font-body text-sm leading-relaxed text-bone-dim">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4">
          <button type="button" onClick={onCancel} className="btn-ink-ghost px-4 py-2 text-sm">
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            className={`h-9 px-5 text-sm ${tone === 'danger' ? 'btn-ink' : 'btn-ink-primary'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
