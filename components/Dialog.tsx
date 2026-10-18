'use client';

import { useEffect, useEffectEvent, useRef, type ReactElement, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

type DialogSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<DialogSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-3xl',
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** 标题元素的 id */
  labelledBy: string;
  /** 打开时聚焦的元素；不传则聚焦第一个可聚焦元素 */
  initialFocusRef?: RefObject<HTMLElement | null>;
  size?: DialogSize;
  children: ReactNode;
}

/** 弹窗外壳：遮罩、Esc 关闭、锁定背景滚动、Tab 不跑出弹窗、关闭后焦点回到原处 */
export function Dialog({
  isOpen,
  onClose,
  labelledBy,
  initialFocusRef,
  size = 'md',
  children,
}: DialogProps): ReactElement | null {
  const panelRef = useRef<HTMLDivElement>(null);
  const pressedOnBackdrop = useRef(false);

  const requestClose = useEffectEvent(() => onClose());
  const focusInitial = useEffectEvent((panel: HTMLElement) => {
    (initialFocusRef?.current ?? panel.querySelector<HTMLElement>(FOCUSABLE) ?? panel).focus();
  });

  useEffect(() => {
    const panel = panelRef.current;
    if (!isOpen || !panel) return;

    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    focusInitial(panel);

    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault();
        requestClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      opener?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // 挂到 body 上：页面里带 transform / backdrop-filter 的祖先会让 fixed 定位失效
  return createPortal(
    <div className="dialog-backdrop anim-fade fixed inset-0 z-[70] overflow-y-auto">
      <div
        className="flex min-h-full items-center justify-center p-4 sm:p-8"
        // 在弹窗里按下、拖到遮罩上松开（比如选中输入框里的字）不应关闭
        onPointerDown={(e) => {
          pressedOnBackdrop.current = e.target === e.currentTarget;
        }}
        onClick={(e) => {
          if (pressedOnBackdrop.current && e.target === e.currentTarget) onClose();
        }}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          tabIndex={-1}
          className={`panel anim-rise w-full ${SIZE_CLASSES[size]} shadow-[var(--shadow-lift)] focus:outline-none`}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** 弹窗右上角的关闭按钮 */
export function DialogCloseButton({
  onClick,
  buttonRef,
}: {
  onClick: () => void;
  buttonRef?: RefObject<HTMLButtonElement | null>;
}): ReactElement {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      aria-label="关闭"
      className="btn btn-ghost h-9 w-9 shrink-0 px-0"
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="m4 4 8 8M12 4l-8 8" />
      </svg>
    </button>
  );
}
