'use client';

import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import Link from 'next/link';

import { CardPlate } from '@/components/CardPlate';
import { Composer, type ComposerIntent } from '@/components/Composer';
import { OracleLetter, type OracleLetterActions } from '@/components/OracleLetter';
import { useSettingsDialog } from '@/components/AppShell';
import { useAgentChat, type AgentMessage, type DrawMode } from '@/hooks/useAgentChat';
import { useApiConfig } from '@/hooks/useApiConfig';
import { formatMonthDay, weekdayName } from '@/lib/dates';
import { formatLunarDate } from '@/lib/lunar';
import { getReadings } from '@/lib/readingStorage';
import { getDailyDraw } from '@/lib/tarot/daily';
import type { Reading } from '@/lib/tarot/types';

const SUGGESTIONS = [
  { label: '工作', question: '最近的工作状态，我该怎么调整？' },
  { label: '关系', question: '我和 Ta 的关系接下来会怎样发展？' },
  { label: '抉择', question: '眼前有两个选择，我该怎么决定？' },
  { label: '今天', question: '今天有什么需要特别留意的？' },
];

export default function OraclePage(): ReactElement {
  const chat = useAgentChat();
  const { messages, isHydrated, isRunning } = chat;
  const { config, isLoaded, canUseApi } = useApiConfig();
  const { openSettings } = useSettingsDialog();

  const [draft, setDraft] = useState('');
  const [mode, setMode] = useState<DrawMode>('oracle');
  const [focusSignal, setFocusSignal] = useState(0);
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    // 日期只在客户端取，避免服务端与浏览器跨零点时渲染不一致
    queueMicrotask(() => setToday(new Date()));
    // 旧的 /reading 链接会带 ?mode=self 跳到这里
    if (new URLSearchParams(window.location.search).get('mode') === 'self') {
      queueMicrotask(() => setMode('self'));
      window.history.replaceState(null, '', '/');
    }
  }, []);

  const lastAgent = useMemo(
    () => messages.findLast((m): m is AgentMessage => m.role === 'agent'),
    [messages],
  );

  // 离开页面再回来时，上一个实例发起的流仍在后台写入；此时不能再发起新的回合
  const isBusy =
    isRunning ||
    lastAgent?.status === 'running' ||
    Boolean(lastAgent?.followUps.some((fu) => fu.status === 'running'));

  const intent: ComposerIntent =
    lastAgent?.status === 'ritual'
      ? 'blocked'
      : lastAgent?.status === 'done' && lastAgent.spread && lastAgent.content
        ? 'follow-up'
        : 'new';

  // 亲手抽牌前几步不需要 API，解读时再提示配置
  const needsApi = intent === 'follow-up' || mode === 'oracle';
  const canSubmit =
    draft.trim().length > 0 && !isBusy && intent !== 'blocked' && (!needsApi || canUseApi);

  const handleSubmit = (): void => {
    const text = draft.trim();
    if (!canSubmit) return;
    if (intent === 'follow-up') chat.askFollowUp(text, config);
    else if (mode === 'self') chat.startRitual(text);
    else chat.sendQuestion(text, config);
    setDraft('');
  };

  const actions: OracleLetterActions = {
    regenerate: (agentId) => chat.regenerateAgentMessage(agentId, config),
    regenerateFollowUp: (agentId, followUpId) => chat.regenerateFollowUp(agentId, followUpId, config),
    chooseSpread: chat.chooseRitualSpread,
    backToSpreadChoice: chat.backToSpreadChoice,
    shuffle: chat.shuffleAndDraw,
    reveal: chat.revealCards,
    interpret: (agentId) => chat.interpretRitual(agentId, config),
    handOver: (agentId) => chat.handOverToOracle(agentId, config),
    discard: chat.discardRitual,
    openSettings,
  };

  // 新问题或新追问出现时，把它滚到视口上方，接下来的回信顺着往下读
  const lastUserId = messages.findLast((m) => m.role === 'user')?.id;
  const lastFollowUpId = lastAgent?.followUps.at(-1)?.id;
  const scrolledTo = useRef<string | undefined>(undefined);
  useEffect(() => {
    const target = lastFollowUpId ? `fu-${lastFollowUpId}` : lastUserId ? `q-${lastUserId}` : undefined;
    if (!target) return;
    // 首次载入历史对话时不滚动，只记下位置
    if (scrolledTo.current === undefined) {
      scrolledTo.current = target;
      return;
    }
    if (scrolledTo.current === target) return;
    scrolledTo.current = target;
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [lastUserId, lastFollowUpId]);

  const composerProps = {
    value: draft,
    onChange: setDraft,
    onSubmit: handleSubmit,
    onStop: chat.cancel,
    intent,
    mode,
    onModeChange: setMode,
    canSubmit,
    isRunning,
    isBusy,
    focusSignal,
  };

  const needsSetup = isLoaded && !canUseApi;

  if (!isHydrated) {
    return (
      <main id="main-content" className="page-container page-main" aria-busy>
        <div className="max-w-2xl space-y-4">
          <div className="skeleton h-4 w-48" />
          <div className="skeleton h-10 w-80 max-w-full" />
          <div className="skeleton mt-8 h-44 w-full" />
        </div>
      </main>
    );
  }

  if (messages.length === 0) {
    return (
      <main id="main-content" className="page-container page-main">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-16">
          <section className="anim-rise max-w-2xl">
            <p className="kicker min-h-5">{today ? dateLine(today) : ''}</p>
            <h1 className="page-title mt-4">此刻，你想问什么？</h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-soft">
              把问题写下来，抽一副牌，收一封回信。每次解读都会自动存进手札。
            </p>

            <div className="mt-8">
              <Composer variant="hero" {...composerProps} />
            </div>

            {needsSetup && (
              <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border border-line border-l-[3px] border-l-accent bg-surface px-4 py-3 text-sm text-ink-soft">
                <span>
                  还没有配置模型 API。{mode === 'self' ? '可以先亲手抽牌，解读前再配置。' : '神谕需要它才能回信。'}
                </span>
                <button type="button" onClick={openSettings} className="link">
                  去配置
                </button>
              </div>
            )}

            <div className="mt-8">
              <p className="text-[13px] text-ink-muted">不知道怎么问？从这里开个头：</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    className="chip"
                    onClick={() => {
                      setDraft(s.question);
                      setFocusSignal((n) => n + 1);
                    }}
                  >
                    <span className="text-accent">{s.label}</span>
                    {s.question}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <aside className="anim-rise space-y-10 [animation-delay:120ms] lg:pt-2">
            <TodayCard today={today} />
            <RecentEntries />
          </aside>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="page-container page-main pb-56 md:pb-48">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
          <p className="kicker">{today ? dateLine(today) : '神谕'}</p>
          <button type="button" onClick={chat.reset} disabled={isBusy} className="btn btn-ghost h-9 text-sm">
            新的一页
          </button>
        </div>

        <div className="mt-8 flex flex-col gap-5">
          {messages.map((msg, index) =>
            msg.role === 'user' ? (
              <div
                key={msg.id}
                id={`q-${msg.id}`}
                className={`anim-rise flex scroll-mt-28 items-start gap-3 ${index > 0 ? 'mt-10' : ''}`}
              >
                <span className="voice-label mt-1">问</span>
                <p className="whitespace-pre-wrap font-hand text-[19px] leading-relaxed text-voice md:text-xl">
                  {msg.content}
                </p>
              </div>
            ) : (
              <OracleLetter
                key={msg.id}
                message={msg}
                isBusy={isBusy}
                canUseApi={canUseApi}
                actions={actions}
              />
            ),
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-line bg-canvas/95 backdrop-blur-md md:bottom-0">
        <div className="mx-auto max-w-3xl px-4 pb-3 pt-3 md:px-0 md:pb-4">
          <Composer variant="dock" {...composerProps} />
          <div className="mt-1.5 flex min-h-5 items-center justify-between gap-3 px-1 text-xs text-ink-muted">
            <span>
              {intent === 'follow-up'
                ? '追问会接着这次的牌来回答；想问别的事，就翻开新的一页。'
                : intent === 'blocked'
                  ? '牌还没抽完。'
                  : ''}
            </span>
            {needsSetup && (
              <button type="button" onClick={openSettings} className="link shrink-0">
                配置 API
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function dateLine(date: Date): string {
  const lunar = formatLunarDate(date);
  return `${formatMonthDay(date)} · ${weekdayName(date)}${lunar ? ` · ${lunar}` : ''}`;
}

/* ─── 侧栏 ─── */

function TodayCard({ today }: { today: Date | null }): ReactElement {
  const draw = useMemo(() => (today ? getDailyDraw(today) : null), [today]);

  return (
    <section aria-labelledby="today-card-title">
      <h2 id="today-card-title" className="kicker">
        今日一牌
      </h2>
      {draw ? (
        <Link href="/daily" className="group mt-4 flex gap-4">
          <CardPlate
            card={draw.card}
            isReversed={draw.isReversed}
            sizes="80px"
            decorative
            className="w-20 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5"
          />
          <span className="min-w-0 pt-1">
            <span className="block text-lg font-semibold text-ink group-hover:text-accent">
              {draw.card.nameCn}
            </span>
            <span className="font-latin text-sm italic text-ink-muted">{draw.card.name}</span>
            <span className={`mt-1 block text-[13px] ${draw.isReversed ? 'text-accent' : 'text-ink-muted'}`}>
              {draw.isReversed ? '逆位' : '正位'}
            </span>
            <span className="mt-2 line-clamp-2 break-keep text-[13px] leading-relaxed text-ink-soft">
              {(draw.isReversed ? draw.card.keywords.reversed : draw.card.keywords.upright).join(' · ')}
            </span>
          </span>
        </Link>
      ) : (
        <div className="mt-4 flex gap-4" aria-hidden>
          <div className="skeleton aspect-[3/5] w-20" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="skeleton h-5 w-20" />
            <div className="skeleton h-4 w-24" />
          </div>
        </div>
      )}
    </section>
  );
}

function RecentEntries(): ReactElement {
  const [readings, setReadings] = useState<Reading[] | null>(null);

  useEffect(() => {
    queueMicrotask(() => setReadings(getReadings().slice(0, 3)));
  }, []);

  return (
    <section aria-labelledby="recent-title">
      <div className="flex items-baseline justify-between">
        <h2 id="recent-title" className="kicker">
          最近的手札
        </h2>
        {readings && readings.length > 0 && (
          <Link href="/history" className="text-[13px] text-ink-muted hover:text-accent">
            全部
          </Link>
        )}
      </div>
      {readings === null ? null : readings.length === 0 ? (
        <p className="mt-4 text-[13px] leading-relaxed text-ink-muted">
          还没有记录。每次解读完成后会自动存进来。
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {readings.map((r) => (
            <li key={r.id}>
              <Link href={`/history/${r.id}`} className="group block py-3">
                <span className="text-xs text-ink-muted">
                  {formatMonthDay(r.createdAt)} · {r.spread.nameCn}
                </span>
                <span className="mt-0.5 line-clamp-2 font-hand text-base leading-snug text-voice group-hover:text-accent">
                  {r.question}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
