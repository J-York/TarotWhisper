'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

import { Seal } from '@/components/Seal';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/** 全局错误边界 · 渲染出错时显示说明页而不是白屏 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <main id="main-content" className="page-container page-main flex min-h-dvh items-center justify-center">
        <div className="panel anim-rise w-full max-w-md px-6 py-10 text-center md:px-8">
          <Seal text="塔罗" className="mx-auto" />
          <h1 className="mt-6 text-xl font-semibold text-ink">页面出了点问题</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
            有一部分没能显示出来。你的手札和札记仍然保存在这台设备上。
          </p>
          <details className="mt-5 rounded-md border border-line bg-canvas px-4 py-3 text-left">
            <summary className="cursor-pointer text-[13px] text-ink-muted">技术细节</summary>
            <p className="mt-2 break-all font-mono text-xs leading-relaxed text-ink-soft">{error.message}</p>
          </details>
          <div className="mt-6 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="btn btn-secondary h-10 px-5 text-sm"
            >
              重试
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- 要整页重新载入：错误边界在根布局里，站内跳转不会清掉出错状态 */}
            <a href="/" className="btn btn-primary h-10 px-5 text-sm">
              回到首页
            </a>
          </div>
        </div>
      </main>
    );
  }
}
