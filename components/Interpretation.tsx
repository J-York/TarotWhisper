'use client';

import ReactMarkdown from 'react-markdown';

interface InterpretationProps {
  content: string;
  isLoading: boolean;
  error: string | null;
}

export function Interpretation({ content, isLoading, error }: InterpretationProps) {
  if (error) {
    return (
      <div className="w-full max-w-4xl p-8 bg-red-950/30 border border-red-500/30 rounded-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4 text-red-400 mb-4">
          <span className="text-3xl">⚠️</span>
          <h3 className="font-serif text-2xl tracking-wide">连接已断开</h3>
        </div>
        <p className="text-red-200/80 font-light leading-relaxed text-base">{error}</p>
        <p className="text-red-400/50 text-sm mt-4 uppercase tracking-widest">
          请检查你与以太的连接（API设置），然后重试。
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl relative group">
      {/* Mystical Header */}
      <div className="flex flex-col items-center gap-3 mb-8 animate-in fade-in duration-700">
        <div className="flex items-center gap-3">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-500/50" />
          <div className="flex gap-1">
            <span className="text-amber-500/60 text-xs">✧</span>
            <span className="text-amber-400/80 text-sm">✦</span>
            <span className="text-amber-500/60 text-xs">✧</span>
          </div>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-500/50" />
        </div>
        <h3 className="text-3xl font-serif text-amber-100 tracking-[0.2em] uppercase text-center">
          神谕降临
        </h3>
        <div className="h-px w-32 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
      </div>

      <div className={`
        relative overflow-hidden rounded-2xl transition-all duration-1000
        ${isLoading ? 'min-h-[300px]' : 'min-h-[100px]'}
        glass-panel bg-[#0F0518]/60 border-amber-900/30
      `}>
        {/* Decorative Corners */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-amber-500/20 rounded-tl-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-amber-500/20 rounded-tr-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-amber-500/20 rounded-bl-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-amber-500/20 rounded-br-2xl pointer-events-none" />

        {/* Content Area */}
        <div className="p-8 md:p-12 relative z-10">
          {content ? (
            <div className="interpretation-content">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-3xl font-serif text-amber-200 mt-8 mb-4 first:mt-0 tracking-wide border-b border-amber-500/20 pb-2">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-2xl font-serif text-amber-200 mt-8 mb-4 first:mt-0 tracking-wide">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-serif text-amber-200 mt-6 mb-3 first:mt-0 tracking-wide">
                      {children}
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-lg font-serif text-amber-200 mt-5 mb-2 first:mt-0 tracking-wide">
                      {children}
                    </h4>
                  ),
                  p: ({ children }) => (
                    <p className="text-purple-100 text-lg leading-relaxed mb-5 last:mb-0">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside text-purple-100 text-lg leading-relaxed my-5 space-y-2 pl-2">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside text-purple-100 text-lg leading-relaxed my-5 space-y-2 pl-2">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-purple-100 leading-relaxed">
                      {children}
                    </li>
                  ),
                  strong: ({ children }) => (
                    <strong className="text-amber-300 font-semibold">{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="text-purple-200 italic">{children}</em>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-amber-500/40 pl-4 my-5 italic text-purple-200/80">
                      {children}
                    </blockquote>
                  ),
                  hr: () => (
                    <hr className="my-8 border-t border-amber-500/20" />
                  ),
                }}
              >
                {isLoading ? content + '▌' : content}
              </ReactMarkdown>
            </div>
          ) : isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {/* Mystical Loading Animation - Pulsing Eye */}
              <div className="relative mb-8">
                <div className="text-6xl animate-pulse opacity-80">👁</div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 animate-ping" />
                </div>
              </div>
              <p className="text-amber-200/70 font-serif tracking-[0.3em] uppercase text-base">
                正在通灵
              </p>
              <div className="flex gap-1 mt-2">
                <span className="w-1.5 h-1.5 bg-amber-400/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-amber-400/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-amber-400/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center py-12 text-purple-300/30">
                <span className="text-4xl mb-4 opacity-50">⚖️</span>
                <p className="font-serif tracking-widest text-base uppercase">
                  等待牌面...
                </p>
             </div>
          )}
        </div>
        
        {/* Background Texture Overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
      </div>
    </div>
  );
}
