import type { Metadata } from "next";
import { Geist_Mono, Cinzel_Decorative, Marcellus, Spectral } from "next/font/google";
import { AmbientField } from "@/components/AmbientField";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Cinzel Decorative — 装饰碑刻体，用于英雄标题
const cinzelDecorative = Cinzel_Decorative({
  variable: "--font-cinzel-decorative",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

// Marcellus — 古典优雅，用于章节标题与标签
const marcellus = Marcellus({
  variable: "--font-marcellus",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

// Spectral — 屏幕衬线，用于正文
const spectral = Spectral({
  variable: "--font-spectral",
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
        className={`${spectral.variable} ${geistMono.variable} ${cinzelDecorative.variable} ${marcellus.variable} antialiased min-h-screen`}
      >
        {/* Skip to content · 键盘用户快捷进入 */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[var(--ink-veil)] focus:text-gold focus:outline-none focus:ring-1 focus:ring-[var(--gold-dim)] cn-nav"
        >
          跳 至 内 容
        </a>

        {/* Atmospheric vignette — 多层深空渐变 */}
        <div className="fixed inset-0 pointer-events-none z-0 bg-vignette" aria-hidden />

        {/* Film grain overlay · 胶片颗粒质感 */}
        <div className="grain-overlay" aria-hidden />

        {/* Ambient field — 星尘 / 雾幕 / 烛光跟随 / 星座连线 */}
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
