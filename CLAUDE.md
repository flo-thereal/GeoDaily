# GeoDaily — CLAUDE.md

## Project Overview

GeoDaily is a geography learning web app where users complete daily quizzes
(flags, capitals, map pinpointing). It is a **fully static single-page app**
hosted on **GitHub Pages** — there is no server, database, or login.

- **Quiz data** lives in the repo as static JSON. A scheduled GitHub Action
  pre-generates daily challenges with Google Gemini and commits them under
  `public/data/challenges/<YYYY-MM-DD>.json`. If a day's file is missing, the app
  generates that day's challenge deterministically in the browser from the
  bundled country data, so it always works.
- **All user progress** (streak, points, history, stats, continent mastery,
  achievements, settings) is stored in the browser's `localStorage`. It is
  single-device and requires no account.
- **Country reference data** (`src/data/countries.json`, ~195 entries) is bundled
  into the client and queried in memory.

---

## Repository Layout

```
/
├── index.html                   # SPA entry
├── src/
│   ├── App.tsx                  # React Router v7 route definitions
│   ├── main.tsx                 # React DOM root (HashRouter)
│   ├── index.css                # Global styles (Tailwind v4 import)
│   ├── data/countries.json      # Bundled country reference data
│   ├── components/
│   │   ├── Layout.tsx           # Shell with sidebar + bottom nav
│   │   └── MapQuiz.tsx          # Leaflet map component for map questions
│   ├── pages/                   # Dashboard, Quiz, QuestCompleted, Explore,
│   │                            #   Profile, Settings, Welcome
│   ├── services/api.ts          # Local data layer (bundled JSON + store)
│   ├── store/useStore.ts        # Zustand store, persisted to localStorage
│   └── lib/
│       ├── countries.ts         # Typed country data + region→continent
│       ├── generateQuiz.ts      # Deterministic/random quiz generation
│       ├── progress.ts          # Stats + achievement logic, applyDailyResult()
│       └── utils.ts             # cn(), getDistanceFromLatLonInKm()
├── scripts/generate-challenges.ts  # Gemini challenge generator (Action)
├── public/
│   ├── .nojekyll
│   └── data/challenges/         # Pre-generated daily challenge JSON
├── tests/
│   ├── unit/                    # Vitest (Node env)
│   └── e2e/                     # Playwright (Chromium)
├── vite.config.ts               # Tailwind v4 plugin, @/* alias, base path
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
└── .github/workflows/
    ├── deploy.yml               # Build + deploy to GitHub Pages
    ├── generate-challenges.yml  # Nightly Gemini generation + commit
    └── tests.yml                # lint + unit + build
```

---

## Development Commands

```bash
npm run dev               # Vite dev server (HMR)
npm run build             # Production build → dist/
npm run preview           # Serve the production build
npm run lint              # TypeScript type check (tsc --noEmit)
npm run test              # Unit tests (Vitest)
npm run test:e2e          # Playwright E2E (auto-starts dev server)
npm run generate:challenges  # Generate daily challenge JSON (uses GEMINI_API_KEY)
```

---

## Environment / Configuration

The deployed client needs **no secrets**.

| Variable | Where | Description |
|---|---|---|
| `GEMINI_API_KEY` | GitHub Action secret / local only | Used **only** by `scripts/generate-challenges.ts`. Never bundled into the client. Without it, the script falls back to the deterministic local generator. |
| `VITE_BASE` | Build time | Base path. Defaults to `/geodaily/` (Pages project site). Set to `/` for a custom domain, user/org page, or local root testing. |

---

## Code Conventions

### TypeScript / React

- Strict TypeScript; run `npm run lint`. Target ES2022, `moduleResolution: bundler`,
  `resolveJsonModule` enabled.
- `@/*` path alias resolves to the **repository root**.
- Functional components with hooks only; **named exports** (except `App.tsx`).
- **Tailwind utility classes only** (no CSS modules / inline styles, except the
  Leaflet marker config and Material Symbols `fontVariationSettings`).
- `cn()` from `src/lib/utils.ts` for conditional classes; `lucide-react` for icons;
  Material Symbols via the CDN `<link>`; `motion` (import from `motion/react`);
  `canvas-confetti` for celebrations.

### State & data

- **Zustand** (`src/store/useStore.ts`) is the single client store, persisted to
  `localStorage` under `geodaily-storage`. It holds the quiz session state plus a
  `progress` slice (stats, country progress, continent mastery, achievements) and
  a `settings` slice.
- The store's `persist` middleware reads `localStorage` at import time — in unit
  tests use `vi.resetModules()` + dynamic `import()` per test (see existing tests).
- **All data access goes through `src/services/api.ts`.** Its functions keep an
  async, server-like signature but read bundled JSON / the store — no network
  except `fetchDailyTasks`, which fetches the committed challenge file and falls
  back to `generateDailyTasks` from `src/lib/generateQuiz.ts`.

### Routing

- **HashRouter** (`src/main.tsx`) so deep links work on GitHub Pages without a
  server-side 404 fallback. Routes look like `/#/explore`.

---

## Quiz / Challenge Data Model

Each challenge is an array of 5 `DailyTask` objects (`src/store/useStore.ts`):

| Type | Question | `correctAnswer` | `options` | `imageUrl` | `mapCoordinates` |
|---|---|---|---|---|---|
| `flag` | "Which country's flag is this?" | Country name | 4 names | 2-letter ISO code | — |
| `capital` | "Where is the capital of X?" | Capital city | empty | 2-letter ISO code | capital `{ lat, lng }` |
| `map` | "Where is X located?" | Country name | empty | 2-letter ISO code | country centroid `{ lat, lng }` |

**Scoring**: flags are binary 100/0. Country map questions award **100** if the pin
is inside the country polygon (from `public/data/country-boundaries.geojson`), else
**0**. Capital map questions award **0–100** from distance (`round(100 * max(0, 1 - d/500))`);
`isCorrect` when points ≥ 50. Daily max is still 5×100 = 500. Perfect score requires
`score === maxScore && maxScore >= 500`.

**Flag images**: `https://flagcdn.com/w320/{code}.png` (lowercased `imageUrl`).

**Progress / achievements**: `src/lib/progress.ts#applyDailyResult` updates streak,
points, days played, per-country mastery (`timesCorrect >= 3 ⇒ mastered`),
continent mastery %, and unlocks achievements. The store action `submitDailyResult`
wraps it; `Quiz.tsx` calls it when a daily challenge finishes.

---

## Deployment

- **`deploy.yml`**: on push to `main`, `vite build` → upload artifact →
  `actions/deploy-pages`. Requires Pages "Source" set to **GitHub Actions**.
- **`generate-challenges.yml`**: nightly cron (+ manual). Runs
  `npm run generate:challenges` with the `GEMINI_API_KEY` secret, then commits any
  new files under `public/data/challenges/` to `main` (which re-triggers deploy).
- **`tests.yml`**: lint + unit tests + build on every push/PR.

---

## Gotchas for AI Assistants

- **No server, no DB, no accounts.** Don't reintroduce `/api/*` calls — extend
  `src/services/api.ts` or the store instead.
- **`GEMINI_API_KEY` is build/Action-only** — never reference it from client code.
- **Base path matters**: assets are served from `/geodaily/`. Use
  `import.meta.env.BASE_URL` for runtime asset URLs (see `fetchDailyTasks`).
- **HashRouter**: e2e/manual navigation uses `/#/...` paths.
- **Region vs continent**: `countries.json` uses `North America`/`South America`;
  the UI groups them as `Americas` via `regionToContinent` in `src/lib/countries.ts`.
- **Leaflet icon fix in `MapQuiz.tsx`** is a required Vite workaround — keep it.
- **Only automated gate besides tests is `npm run lint`** (no ESLint/Prettier).
