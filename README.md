# TarotWhisper — Mystic Tarot (神秘塔罗)

*English · [简体中文](./README.zh-CN.md)*

An immersive tarot reading web app built with **Next.js 16 (App Router) + React 19 + TypeScript 5 (strict) + Tailwind CSS 4**.

It ships the complete 78-card Rider–Waite–Smith deck, six spreads, deterministic daily draws, a fully agentic reading mode, and streaming AI interpretation from any OpenAI-compatible Chat Completions endpoint.

> **Note on language:** the application UI and the AI prompts are written in **Simplified Chinese**. This README documents the project in English; the original Chinese README lives in [README.zh-CN.md](./README.zh-CN.md).

---

## Features

| | |
|---|---|
| 🃏 **Full deck** | 78 Rider–Waite–Smith cards (22 Major Arcana + 4 suits × 14), each with upright/reversed keywords and meanings |
| ✨ **Six spreads** | Single Card, Three Card, Two Options, Relationship, Timeline, Celtic Cross |
| 🔮 **Streaming interpretation** | Server-Sent Events straight through to the UI, including `thinking` / reasoning deltas from reasoning models |
| 🤖 **Agent mode** (`/agent`) | Chat-style flow where the LLM picks the spread itself, draws, and interprets — the user only asks a question |
| 💬 **Follow-up questions** | The model decides whether it can answer directly or needs supplementary cards, then draws and re-interprets |
| 🌅 **Daily card** (`/daily`) | Deterministic draw — everyone gets the same card on a given local date — with a personal reflection note and optional AI reading |
| 📖 **Card library** (`/library`) | Browse and filter the whole deck with detail views |
| 🕰️ **History** (`/history`) | Readings, follow-ups and interpretations stored locally, with detail pages and bulk delete |
| ⚙️ **Bring your own API** | Endpoint / model / key configured in the browser, or an optional server-side fallback key with per-IP rate limiting |

---

## Tech stack

- **Framework:** Next.js 16 (App Router, Node.js runtime for the API routes)
- **UI:** React 19, Tailwind CSS 4 (`@import "tailwindcss"`, `@theme inline`), glassmorphism dark theme
- **Language:** TypeScript 5, `strict` mode — no `any`, no `@ts-ignore`
- **Markdown:** `react-markdown` for rendering interpretations
- **Tests:** Vitest 4 + Testing Library + jsdom
- **Lint:** ESLint 9 flat config (`eslint.config.mjs`, `eslint-config-next`)
- **Node:** 24.x (see `.nvmrc`)

---

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

Other scripts:

```bash
npm run build        # production build
npm run start        # serve the production build
npm run lint         # ESLint
npm run test         # Vitest, single run
npm run test:watch   # Vitest, watch mode
```

Card images are committed under `public/cards/`. To re-fetch them from the public archive source:

```bash
node scripts/download-cards.js
```

---

## Configuring the LLM

The app never talks to the LLM from the browser directly — requests go to `POST /api/interpret`, which forwards them upstream and pipes the SSE stream back.

### Option A — user-supplied key (default)

Open **API settings** (the ⚙ control in the side navigation) and fill in:

| Field | Meaning | Example |
|---|---|---|
| `endpoint` | Any OpenAI-compatible Chat Completions URL. If the path is omitted, `/chat/completions` is appended automatically. | `https://api.openai.com/v1/chat/completions` |
| `apiKey` | Your key. Sent per request; **stored only in `localStorage`**, never on the server. | `sk-…` |
| `model` | Model name | `gpt-4o-mini` |

### Option B — server-side fallback key

Set the environment variables from [`.env.example`](./.env.example) so visitors can use the app without a key of their own:

```bash
FALLBACK_LLM_ENDPOINT=https://api.openai.com/v1/chat/completions
FALLBACK_LLM_KEY=your-api-key-here
FALLBACK_LLM_MODEL=gpt-4o-mini
ENABLE_FALLBACK_LLM=true      # must be exactly "true" to enable
RATE_LIMIT_PER_HOUR=10        # per-IP hourly cap for fallback usage only
```

The fallback is used **only** when the request carries no user key. Requests that try to replay the server's own credentials are rejected with `403`, and requests with neither a user key nor an enabled fallback get `401`. `GET /api/config` reports whether a fallback is available so the UI can enable the "start reading" affordances accordingly.

The rate limiter is an in-memory `Map`, so on a multi-instance or serverless deployment each instance keeps its own counters.

---

## How it works

### Reading flow (`/reading`)

`question → spread → shuffle → draw → reveal → interpret`

Cards are drawn client-side by a pure function (`lib/tarot/draw.ts`), each with a 50 % reversal chance; the prompt (`lib/api/prompts.ts`) then describes the question, spread positions, and drawn cards to the model.

### Agent flow (`/agent`)

One agent turn (`lib/agent/agentTurn.ts`) is:

1. **Choose spread** — the model picks one of the six spreads and explains why, returning JSON-only output (`lib/agent/spreadChoice.ts`).
2. **Draw** — pure function, no model involvement.
3. **Interpret** — streamed, reusing the same interpretation prompts as the manual flow.

Follow-up turns run `decide → (optionally draw supplementary cards) → interpret`. Every step is driven by event callbacks so the UI can render each stage as it happens, and turns can be cancelled or regenerated.

### Streaming reliability

Long-thinking models can stay silent for minutes, so the stream path is hardened at both ends:

- **Server** (`app/api/interpret/route.ts`): `maxDuration = 300`, a 180 s upstream connect timeout, a 180 s inter-chunk idle guard, `: keepalive` SSE heartbeats every 15 s, and `X-Accel-Buffering: no` to stop proxies from buffering.
- **Client** (`lib/api/stream-client.ts`): connect and idle timeouts, `AbortController` cancellation, automatic retries with exponential backoff for retryable errors (surfaced in the UI as "retrying N/M"), and structured error classification (`lib/api/errors.ts`).
- Upstream error bodies are scrubbed of bearer tokens and `sk-…` keys before reaching the client.

---

## Project structure

```text
.
├─ app/
│  ├─ api/
│  │  ├─ interpret/route.ts   # LLM proxy: validation, fallback, rate limit, guarded SSE passthrough
│  │  └─ config/route.ts      # reports fallback availability + rate limit to the client
│  ├─ page.tsx                # landing
│  ├─ reading/page.tsx        # manual reading flow
│  ├─ agent/page.tsx          # agentic chat reading
│  ├─ daily/page.tsx          # daily card + reflection notes
│  ├─ library/page.tsx        # 78-card browser
│  ├─ history/                # timeline list + [id] detail page
│  ├─ layout.tsx
│  └─ globals.css             # theme variables, animations, 3D transforms
├─ components/                # TarotCard, Interpretation, FollowUpPanel, ApiSettings, …
├─ hooks/                     # useReading, useAgentChat, useApiConfig, useConfirm
├─ lib/
│  ├─ tarot/                  # cards, spreads, draw, daily, types, SSE parsing
│  ├─ api/                    # prompts, stream client, stream buffer, error classification
│  ├─ agent/                  # turn orchestration, spread-choice decision step
│  ├─ readingStorage.ts       # reading history in localStorage (max 50)
│  └─ dailyStorage.ts         # daily reflection notes (max 60)
├─ tests/                     # Vitest suites: cards, spreads, daily, SSE utils, stream buffer
├─ public/cards/              # Rider–Waite–Smith imagery
└─ scripts/download-cards.js  # re-download card imagery
```

---

## Data & privacy

- Reading history, daily notes, and API settings live in the browser's `localStorage` only.
- The server persists nothing: `/api/interpret` forwards the request upstream and streams the response back.
- Your API key is sent with each request to your own configured endpoint via the app's server route; keep it out of shared environments.

---

## Contributing

Conventions used throughout the codebase:

- **Strict TypeScript** — no `any`, no `@ts-ignore`, explicit return types on functions and components
- **Named exports** for components, with a `{ComponentName}Props` interface for props
- `'use client'` on anything using hooks or browser APIs; server components by default
- `@/*` path alias for root-relative imports, ordered React/Next → third-party → `@/lib` → `@/hooks` → `@/components` → relative
- Tailwind utilities over inline styles; `globals.css` only for CSS variables, animations, 3D transforms and scrollbars
- User-facing strings and error messages in Simplified Chinese
- Domain types centralised in `lib/tarot/types.ts`; state via React built-ins, no external store

Run `npm run lint && npm run test` before opening a PR.

---

## License

Source code is released under the [MIT License](./LICENSE).

That covers the code only — **not** the card imagery under `public/cards/`. Those files are derived from the Rider–Waite–Smith deck (Pamela Colman Smith, 1909), public domain in the US and most jurisdictions, but the specific scans come from a third-party archive. Confirm the terms applying to them yourself before redistributing or using them commercially.
