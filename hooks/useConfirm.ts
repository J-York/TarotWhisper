'use client';

import { useCallback, useRef, useState } from 'react';
import type { ConfirmTone } from '@/components/ConfirmDialog';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
}

interface DialogState extends ConfirmOptions {
  isOpen: boolean;
}

interface UseConfirmReturn {
  /** 渲染所需的状态字段（接 ConfirmDialog 上） */
  dialog: DialogState;
  /** 确认 handler · 直接传给 ConfirmDialog.onConfirm */
  handleConfirm: () => void;
  /** 取消 handler · 直接传给 ConfirmDialog.onCancel */
  handleCancel: () => void;
  /**
   * 命令式调用：返回 Promise<boolean>。
   * 用法：const ok = await confirm({ title, message }); if (!ok) return;
   */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const DEFAULT_STATE: DialogState = {
  isOpen: false,
  title: '',
  message: '',
};

/**
 * 暗色仪式感确认框的命令式 Hook。
 * - 与 <ConfirmDialog /> 配合：把 dialog / handleConfirm / handleCancel 接上即可
 * - 调用方只需 await confirm({...}) 取得布尔结果
 */
export function useConfirm(): UseConfirmReturn {
  const [dialog, setDialog] = useState<DialogState>(DEFAULT_STATE);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const settle = useCallback((result: boolean): void => {
    setDialog((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions): Promise<boolean> => {
      // 若上一次未结算（理论上不会），先 reject 旧 promise
      if (resolverRef.current) {
        resolverRef.current(false);
        resolverRef.current = null;
      }

      return new Promise<boolean>((resolve) => {
        resolverRef.current = resolve;
        setDialog({ ...options, isOpen: true });
      });
    },
    []
  );

  const handleConfirm = useCallback((): void => settle(true), [settle]);
  const handleCancel = useCallback((): void => settle(false), [settle]);

  return { dialog, handleConfirm, handleCancel, confirm };
}
