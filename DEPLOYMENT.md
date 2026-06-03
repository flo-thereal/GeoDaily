# GeoDaily Deployment Guide

GeoDaily is a **static** React app deployed to **GitHub Pages**. Daily challenges are pre-generated JSON files committed by GitHub Actions. All progress is stored in the browser (localStorage).

## Automatic deployment

Every push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which builds the Vite app and publishes to GitHub Pages.

**Live URL (project site):** `https://<github-username>.github.io/geodaily/`

## Required repository secret

| Secret | Purpose |
|--------|---------|
| `GEMINI_API_KEY` | Used by [`.github/workflows/generate-challenges.yml`](.github/workflows/generate-challenges.yml) to generate daily challenge JSON |

## Daily challenge generation

The workflow runs daily at 00:05 UTC (and on manual dispatch). It:

1. Calls `npm run generate:challenges`
2. Writes files to `public/data/challenges/YYYY-MM-DD.json`
3. Commits and pushes if there are new files

## Local development

```bash
npm install
npm run dev
```

Open the URL shown by Vite (usually `http://localhost:5173/geodaily/`).

### Generate challenges locally

```bash
GEMINI_API_KEY=your-key npm run generate:challenges
```

## GitHub Pages setup (one-time)

1. **Settings → Actions → General → Workflow permissions** — **Read and write permissions** (required for `configure-pages` with `enablement: true`)
2. **Settings → Pages → Build and deployment** — Source: **GitHub Actions**
3. Private repos need a plan that includes **GitHub Pages for private repositories** (e.g. GitHub Pro)
4. **Settings → Secrets and variables → Actions** — add `GEMINI_API_KEY` for daily challenge generation

The deploy workflow can also enable Pages via API when the above permissions are set.

## Troubleshooting CI

| Symptom | Fix |
|---------|-----|
| `Create Pages site failed: Resource not accessible by integration` | Set workflow permissions to **Read and write** (step 1 above) |
| `Get Pages site failed: Not Found` | Enable Pages with source **GitHub Actions** (step 2) |
| Generate workflow logs `GEMINI_API_KEY not set` | Add the `GEMINI_API_KEY` repository secret |
| Deploy job waits on environment | Approve the **github-pages** environment deployment in the Actions run |
| Site 404 or blank assets | Confirm `vite.config.ts` `base` matches the Pages path (`/geodaily/` for `flo-thereal.github.io/geodaily/`) |

## Base path / custom domain

[`vite.config.ts`](vite.config.ts) defaults to `base: '/geodaily/'` for project Pages URLs.

For a **custom domain** or user/org Pages site, set at build time:

```bash
VITE_BASE=/ npm run build
```

Or add `VITE_BASE=/` to the deploy workflow environment.

## Tests

```bash
npm run test
npm run test:e2e
```

## What is NOT used

- No Docker, PostgreSQL, or Express server in production
- No GHCR images or `docker compose` deploy bundle
