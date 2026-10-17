'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ApiSettings } from '@/components/ApiSettings';
import { useApiConfig } from '@/hooks/useApiConfig';

/* ─── 全局设置弹窗 · 任意页面都能唤起 ─── */

interface SettingsDialogApi {
  openSettings: () => void;
}

const SettingsDialogContext = createContext<SettingsDialogApi>({ openSettings: () => {} });

export function useSettingsDialog(): SettingsDialogApi {
  return useContext(SettingsDialogContext);
}

/* ─── 导航 ─── */

interface NavItem {
  href: string;
  label: string;
  icon: ReactElement;
}

function Icon({ d }: { d: string }): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { href: '/reading', label: '占卜', icon: <Icon d="M5 4.5h9.5A2.5 2.5 0 0 1 17 7v12.5H7.5A2.5 2.5 0 0 1 5 17V4.5Z M9 8.5h4 M9 12h4" /> },
  { href: '/agent', label: '神谕对话', icon: <Icon d="M4 12a8 8 0 0 1 16 0c0 4.4-3.6 8-8 8-1 0-2-.2-2.8-.6L5 21l1.1-3.6A7.9 7.9 0 0 1 4 12Z" /> },
  { href: '/daily', label: '今日一牌', icon: <Icon d="M12 3v2 M12 19v2 M3 12h2 M19 12h2 M5.6 5.6l1.4 1.4 M17 17l1.4 1.4 M18.4 5.6 17 7 M7 17l-1.4 1.4" /> },
  { href: '/library', label: '牌典', icon: <Icon d="M4 5.5A2 2 0 0 1 6 3.5h5v17H6a2 2 0 0 0-2 2v-17Z M20 5.5a2 2 0 0 0-2-2h-5v17h5a2 2 0 0 1 2 2v-17Z" /> },
  { href: '/history', label: '轨迹', icon: <Icon d="M12 7v5l3 2 M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9Z" /> },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/reading') return pathname === '/reading';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }): ReactElement {
  const pathname = usePathname();
  const { config, saveConfig } = useApiConfig();
  const [showSettings, setShowSettings] = useState(false);

  const openSettings = useCallback(() => setShowSettings(true), []);
  const contextValue = useMemo<SettingsDialogApi>(() => ({ openSettings }), [openSettings]);

  return (
    <SettingsDialogContext.Provider value={contextValue}>
      <div className="relative z-10 flex min-h-dvh flex-col">
        <header className="sticky top-0 z-40 border-b border-[var(--ink-line)] bg-[var(--ink-deep)]/80 backdrop-blur-xl">
          <div className="page-container flex h-16 items-center justify-between gap-4">
            <Link href="/" className="group flex items-center gap-3" aria-label="神秘塔罗 首页">
              <span className="grid h-9 w-9 place-items-center rounded-full border border-[var(--gold-faint)] bg-[rgba(210,178,116,0.08)] text-[15px] text-gold transition-colors duration-300 group-hover:border-[var(--gold-dim)]">
                ✦
              </span>
              <span className="flex flex-col leading-tight">
                <span className="font-heading text-[15px] tracking-[0.14em] text-bone">神秘塔罗</span>
                <span className="hidden text-[9px] uppercase tracking-[0.28em] text-bone-faint sm:block">
                  Mystic Tarot
                </span>
              </span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex" aria-label="主导航">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                  className={`nav-link ${isActive(pathname, item.href) ? 'nav-link-active' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openSettings}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--ink-line-strong)] px-3 text-xs text-bone-faint transition-colors duration-200 hover:border-[var(--gold-dim)] hover:text-gold-warm"
                aria-label="API 配置"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
                </svg>
                <span className="hidden sm:inline">配置</span>
              </button>
              <Link
                href="/reading"
                className="btn-ink-primary hidden h-9 px-5 text-sm md:inline-flex"
              >
                开始占卜
              </Link>
            </div>
          </div>
        </header>

        <div className="flex-1">{children}</div>

        {/* 移动端底部导航 */}
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--ink-line)] bg-[var(--ink-deep)]/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
          aria-label="移动端导航"
        >
          <div className="grid grid-cols-5">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[10px] tracking-wide transition-colors ${
                    active ? 'text-gold-warm' : 'text-bone-faint'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
        {/* 为底部导航留出空间 */}
        <div className="h-16 md:hidden" aria-hidden />
      </div>

      <ApiSettings
        config={config}
        onSave={saveConfig}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </SettingsDialogContext.Provider>
  );
}
