import type { ReactElement } from 'react';

interface SealProps {
  /** 印文，一到两个字；两个字时竖排 */
  text: string;
  size?: 'sm' | 'md' | 'lg';
  /** 出现时播放一次盖印动画 */
  stamp?: boolean;
  className?: string;
}

const SINGLE: Record<NonNullable<SealProps['size']>, string> = {
  sm: 'h-7 w-7 text-[15px]',
  md: 'h-10 w-10 text-[21px]',
  lg: 'h-14 w-14 text-[29px]',
};

const DOUBLE: Record<NonNullable<SealProps['size']>, string> = {
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-10 w-10 text-[15px]',
  lg: 'h-14 w-14 text-[21px]',
};

/** 朱砂印章 · 品牌、完成、日期等处的落款 */
export function Seal({ text, size = 'md', stamp = false, className = '' }: SealProps): ReactElement {
  const isDouble = text.length > 1;
  return (
    <span
      aria-hidden
      className={`seal ${isDouble ? `${DOUBLE[size]} [writing-mode:vertical-rl]` : SINGLE[size]} ${
        stamp ? 'anim-stamp' : ''
      } ${className}`}
    >
      {text}
    </span>
  );
}
