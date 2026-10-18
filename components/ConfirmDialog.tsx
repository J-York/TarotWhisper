'use client';

import { useRef, type ReactElement } from 'react';

import { Dialog } from '@/components/Dialog';

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

/** 确认对话框 · 危险操作默认聚焦「取消」，误按回车不会删掉东西 */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = '确认',
  cancelLabel = '取消',
  tone = 'neutral',
  onConfirm,
  onCancel,
}: ConfirmDialogProps): ReactElement {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onCancel}
      labelledBy="confirm-dialog-title"
      size="sm"
      initialFocusRef={tone === 'danger' ? cancelRef : confirmRef}
    >
      <div className="px-6 pb-5 pt-6">
        <h2 id="confirm-dialog-title" className="section-title">
          {title}
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{message}</p>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-4">
        <button ref={cancelRef} type="button" onClick={onCancel} className="btn btn-ghost h-9 px-4 text-sm">
          {cancelLabel}
        </button>
        <button ref={confirmRef} type="button" onClick={onConfirm} className="btn btn-primary h-9 px-5 text-sm">
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
