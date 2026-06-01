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
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="ink-panel-quiet p-16 md:p-20 text-center max-w-lg anim-veil-rise">
            <div className="text-gold-dim text-3xl mb-8">◇</div>
            <h1 className="font-display text-2xl text-bone mb-5 tracking-[0.2em] uppercase">
              以 太 连 接 断 裂
            </h1>
            <div className="rule-h-gold w-16 mx-auto mb-6" />
            <p className="font-body italic-soft text-bone-faint text-base mb-4 leading-relaxed">
              某个星辰的低语未能被解读。
            </p>
            {this.state.error && (
              <details className="mb-8 text-left">
                <summary className="cn-hint text-bone-whisper cursor-pointer">
                  技 术 细 节
                </summary>
                <p className="mt-3 font-mono text-xs text-bone-faint break-all leading-relaxed">
                  {this.state.error.message}
                </p>
              </details>
            )}
            <div className="flex gap-8 justify-center">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="btn-ink px-10 py-3"
              >
                重 试
              </button>
              <Link href="/" className="btn-ink-primary px-10 py-3">
                返 回 首 页
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
