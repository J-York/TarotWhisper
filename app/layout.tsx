import type { Metadata } from "next";
import { Geist, Geist_Mono, Cinzel } from "next/font/google";
import "./globals.css";

const STAR_COUNT = 50;

function pseudoRandom(index: number, offset: number): number {
  const value = Math.sin(index * 12.9898 + offset) * 43758.5453;
  return value - Math.floor(value);
}

const STAR_STYLES = Array.from({ length: STAR_COUNT }, (_, index) => ({
  left: `${pseudoRandom(index, 1.23) * 100}%`,
  top: `${pseudoRandom(index, 4.56) * 100}%`,
  animationDelay: `${pseudoRandom(index, 7.89) * 5}s`,
  opacity: pseudoRandom(index, 0.12) * 0.5 + 0.1,
}));

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "塔罗占卜 - Tarot Reading",
  description: "探索命运的奥秘，获取塔罗牌的智慧指引",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} antialiased min-h-screen`}
      >
        {/* 星星背景装饰 */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          {STAR_STYLES.map((style, i) => (
            <div
              key={i}
              className="absolute w-[2px] h-[2px] bg-white rounded-full star animate-pulse"
              style={style}
            />
          ))}
        </div>
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
