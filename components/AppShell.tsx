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
import { Seal } from '@/components/Seal';
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
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: '神谕', icon: 'M4 6.5h16v11H4z M4 7.5l8 5.5 8-5.5' },
  { href: '/daily', label: '今日', icon: 'M5 5.5h14v14H5z M5 9.5h14 M9 3.5v4 M15 3.5v4 M12 13v3' },
  {
    href: '/library',
    label: '牌典',
    icon: 'M12 6.5C10.2 5.2 7.7 4.5 5 4.5v13c2.7 0 5.2.7 7 2 1.8-1.3 4.3-2 7-2v-13c-2.7 0-5.2.7-7 2Z M12 6.5v13',
  },
  { href: '/history', label: '手札', icon: 'M6.5 3.5h11v17h-11z M9.5 3.5v17 M12.5 8h2.5 M12.5 11h2.5' },
];

function NavIcon({ d }: { d: string }): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[22px] w-[22px]"
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

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }): ReactElement {
  const pathname = usePathname();
  const { config, saveConfig, isLoaded, canUseApi } = useApiConfig();
  const [showSettings, setShowSettings] = useState(false);

  const openSettings = useCallback(() => setShowSettings(true), []);
  const contextValue = useMemo<SettingsDialogApi>(() => ({ openSettings }), [openSettings]);
  const needsSetup = isLoaded && !canUseApi;

  return (
    <SettingsDialogContext.Provider value={contextValue}>
      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-40 bg-canvas/90 backdrop-blur-md">
          <div className="page-container flex h-16 items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-3" aria-label="神秘塔罗 · 首页">
              <Seal text="塔罗" />
              <span className="flex flex-col leading-tight">
                <span className="text-[17px] font-bold tracking-[0.14em] text-ink">神秘塔罗</span>
                <span className="font-latin text-[13px] italic tracking-[0.04em] text-ink-muted">
                  Tarot Whisper
                </span>
              </span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex" aria-label="主导航">
              {NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`relative px-4 py-2 text-[15px] tracking-[0.16em] transition-colors duration-150 ${
                      active ? 'font-semibold text-ink' : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    {item.label}
                    {/* 书签：压在页眉双线上 */}
                    {active && <span className="absolute inset-x-3 -bottom-3 h-[3px] bg-accent" aria-hidden />}
                  </Link>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={openSettings}
              className="btn btn-ghost relative h-9 gap-1.5 text-sm"
              aria-label={needsSetup ? 'API 配置（尚未配置）' : 'API 配置'}
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
              </svg>
              <span className="hidden sm:inline">配置</span>
              {needsSetup && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" aria-hidden />
              )}
            </button>
          </div>
          <div className="rule-double" />
        </header>

        <div className="flex-1">{children}</div>

        {/* 移动端底部导航 */}
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line-strong bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
          aria-label="主导航"
        >
          <div className="grid h-16 grid-cols-4">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex flex-col items-center justify-center gap-1 text-xs tracking-[0.12em] transition-colors ${
                    active ? 'text-accent' : 'text-ink-muted'
                  }`}
                >
                  <NavIcon d={item.icon} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="h-[calc(4rem+env(safe-area-inset-bottom))] md:hidden" aria-hidden />
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
