import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Noto_Serif_SC } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { ErrorBoundary } from "@/components/ErrorBoundary";
// 霞鹜文楷屏幕阅读版（简体字形）· 神谕回信与用户笔迹；按 unicode-range 分片，只下载用到的字
import "lxgw-wenkai-screen-webfont/lxgwwenkaigbscreen.css";
import "./globals.css";

// 思源宋体 · 标题与界面文字
const notoSerifSC = Noto_Serif_SC({
  variable: "--font-noto-serif-sc",
  subsets: ["latin"],
  display: "swap",
});

// Cormorant Garamond · 英文牌名与数字
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "神秘塔罗 · Tarot Whisper",
  description: "把问题写下来，抽一副牌，收一封神谕的回信。七十八张韦特塔罗、六种牌阵与流式 AI 解读。",
};

export const viewport: Viewport = {
  themeColor: "#F3EDE1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${notoSerifSC.variable} ${cormorant.variable}`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-surface focus:px-4 focus:py-2 focus:text-accent focus:shadow-lg"
        >
          跳至正文
        </a>
        <ErrorBoundary>
          <AppShell>{children}</AppShell>
        </ErrorBoundary>
      </body>
    </html>
  );
}
