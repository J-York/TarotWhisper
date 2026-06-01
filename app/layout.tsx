import type { Metadata } from "next";
import { Geist_Mono, Cinzel, Cormorant_Garamond } from "next/font/google";
import { AmbientField } from "@/components/AmbientField";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Cinzel — 古罗马碑刻风格，用于标题与标签
const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

// Cormorant Garamond — 优雅衬线，用于正文与副标题
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mystic Tarot — 神秘塔罗",
  description: "聆听命运的回声",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${cormorant.variable} ${geistMono.variable} ${cinzel.variable} antialiased min-h-screen`}
      >
        {/* Skip to content · 键盘用户快捷进入 */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[var(--ink-veil)] focus:text-gold focus:outline-none focus:ring-1 focus:ring-[var(--gold-dim)] cn-nav"
        >
          跳 至 内 容
        </a>
        {/* Atmospheric vignette — candlelit center */}
        <div className="fixed inset-0 pointer-events-none z-0 bg-vignette" aria-hidden />

        {/* Ambient field — 粒子 / 雾气 / 烛火跟随 */}
        <AmbientField />

        <div className="relative z-10">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </body>
    </html>
  );
}
