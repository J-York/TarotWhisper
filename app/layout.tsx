import type { Metadata } from "next";
import { Geist_Mono, Cinzel, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const STAR_COUNT = 22;

function pseudoRandom(index: number, offset: number): number {
  const value = Math.sin(index * 12.9898 + offset) * 43758.5453;
  return value - Math.floor(value);
}

const STAR_STYLES = Array.from({ length: STAR_COUNT }, (_, index) => ({
  left: `${pseudoRandom(index, 1.23) * 100}%`,
  top: `${pseudoRandom(index, 4.56) * 100}%`,
  animationDelay: `${pseudoRandom(index, 7.89) * 6}s`,
  animationDuration: `${4 + pseudoRandom(index, 2.34) * 4}s`,
  opacity: pseudoRandom(index, 0.12) * 0.3 + 0.08,
}));

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
        {/* Atmospheric vignette — candlelit center */}
        <div className="fixed inset-0 pointer-events-none z-0 bg-vignette" aria-hidden />

        {/* Distant stars */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          {STAR_STYLES.map((style, i) => (
            <div
              key={i}
              className="absolute w-px h-px rounded-full bg-[var(--bone)] anim-whisper"
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
