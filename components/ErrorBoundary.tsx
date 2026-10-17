'use client';

import { Component, type ReactNode } from 'react';
import Link from 'next/link';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * 全局 Error Boundary — 捕获渲染时异常，显示仪式感的错误页而非白屏。
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[70dvh] items-center justify-center p-6">
          <div className="surface max-w-md px-8 py-10 text-center anim-veil-rise">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-[var(--ink-line-strong)] text-xl text-gold-dim" aria-hidden>
              ◇
            </div>
            <h1 className="mt-5 font-heading text-xl text-bone">页面出现了一点问题</h1>
            <p className="mt-2 text-sm leading-relaxed text-bone-faint">
              某个组件渲染失败。你的占卜记录仍安全保存在本地。
            </p>
            {this.state.error && (
              <details className="mt-5 rounded-lg border border-[var(--ink-line)] px-4 py-3 text-left">
                <summary className="cursor-pointer text-xs text-bone-faint">技术细节</summary>
                <p className="mt-2 break-all font-mono text-[11px] leading-relaxed text-bone-whisper">
                  {this.state.error.message}
                </p>
              </details>
            )}
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="btn-ink h-10 px-5 text-sm"
              >
                重试
              </button>
              <Link href="/" className="btn-ink-primary h-10 px-5 text-sm">
                返回首页
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
