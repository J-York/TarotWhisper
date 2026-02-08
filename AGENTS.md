# AGENTS.md - Coding Guidelines for Tarot Web

## Project Overview

Next.js 16 App Router project with React 19, TypeScript 5, and Tailwind CSS 4. A mystical tarot reading web application with AI interpretation.

## Build & Development Commands

```bash
# Development
npm run dev          # Start dev server on localhost:3000

# Build & Deploy
npm run build        # Production build
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint (eslint-config-next)
```

## Code Style Guidelines

### TypeScript

- **Strict mode enabled** - No `any` types, no `@ts-ignore`
- Use explicit return types on functions and React components
- Define interfaces for all props and API payloads
- Prefer `type` for unions, `interface` for object shapes

### Imports & Structure

- Use `@/*` path alias for root-relative imports (configured in tsconfig.json)
- Import order: React/Next → third-party → `@/lib` → `@/hooks` → `@/components` → relative
- Group and separate imports with blank lines between groups

### React Components

```typescript
// Use 'use client' for client components (hooks, browser APIs)
'use client';

// Explicit props interface
interface ComponentProps {
  title: string;
  onAction: () => void;
}

// Named exports for components
export function Component({ title, onAction }: ComponentProps) {
  // implementation
}
```

- Use named exports (not default) for components
- Props interface should be named `{ComponentName}Props`
- Client components using hooks must have `'use client'` directive
- Server components (default) for data fetching and static content

### Naming Conventions

- **Files**: PascalCase for components (`TarotCard.tsx`), camelCase for utilities (`useReading.ts`)
- **Components**: PascalCase (`TarotCardComponent`)
- **Hooks**: camelCase starting with `use` (`useApiConfig`)
- **Types/Interfaces**: PascalCase (`TarotCard`, `DrawnCard`)
- **Constants**: SCREAMING_SNAKE_CASE for true constants
- **CSS Classes**: kebab-case (`glass-panel`, `text-gold-gradient`)

### Styling (Tailwind CSS 4)

- Use Tailwind utility classes exclusively; avoid inline styles
- Custom CSS only in `globals.css` for:
  - CSS variables in `:root`
  - Complex animations
  - 3D transforms (`perspective-1000`, `transform-style-3d`)
  - Scrollbar styling
- Custom colors defined in `@theme inline` block
- Glassmorphism effect: `glass-panel` class

### Error Handling

```typescript
try {
  const data = await fetchData();
} catch {
  // Silent catch OK only for non-critical operations (e.g., localStorage parse)
  // Otherwise, propagate or handle with user feedback
}
```

- Use specific error messages in Chinese for user-facing errors
- Validate API responses before use
- Always check `response.ok` before parsing fetch results

### API Routes (App Router)

- Place in `app/api/[route]/route.ts`
- Export named HTTP method handlers (`POST`, `GET`, etc.)
- Use `NextRequest` type for request parameter
- Return `Response` objects with proper JSON headers
- Support streaming for LLM responses using `ReadableStream`

### Custom Hooks

- Place in `hooks/` directory
- Must start with `use`
- Include `'use client'` directive
- Return object with named properties (not array)
- Use `useCallback` for functions exposed to consumers

### Type Definitions

- Central types in `lib/tarot/types.ts`
- Export all types explicitly
- Use discriminated unions where applicable
- Document complex types with JSDoc comments

### State Management

- Local state: `useState`, `useReducer`
- Persistent state: `localStorage` with try-catch JSON parsing
- No external state library (Redux/Zustand) - use React built-ins

## Project Structure

```
app/               # Next.js App Router
├── api/           # API routes
├── page.tsx       # Home page
├── layout.tsx     # Root layout
└── globals.css    # Global styles
components/        # React components
hooks/             # Custom React hooks
lib/               # Utilities and types
├── tarot/         # Tarot domain (cards, spreads, types)
└── api/           # API clients and prompts
public/            # Static assets
```

## Important Constraints

- **No test framework configured** - Do not write tests (no Jest/Vitest/Playwright setup)
- **ESLint 9 flat config** - Uses `eslint.config.mjs` (not `.eslintrc`)
- **Tailwind CSS 4** - Uses `@import "tailwindcss"` (not directives)
- **React 19** - Latest React features available
- **Strict TypeScript** - Compiler enforces strict type checking
