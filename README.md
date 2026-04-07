# GeoDaily

GeoDaily is a geography learning app with a React frontend, Express API, and PostgreSQL persistence.

## Prerequisites

- Node.js 20+
- npm
- Docker + Docker Compose (for containerized dev/prod workflows)

## Local Development (Node)

1. Install dependencies:
   `npm install`
2. Create env file from template:
   `cp .env.example .env`
3. Set at least `GEMINI_API_KEY` in `.env`
4. Start app:
   `npm run dev`

App runs on `http://localhost:3000`.

## Local Development (Docker Compose)

Use development compose setup (builds locally):

1. Create `.env` (or export env vars) with at least:
   - `GEMINI_API_KEY`
   - Optional overrides: `DEV_AUTH_BYPASS`, `JWT_SECRET`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
2. Start services:
   `docker compose up --build`

## Production Compose (GHCR image)

Use `docker-compose.prod.yml` for production-like orchestration.

Required env vars:
- `DATABASE_URL`
- `GEMINI_API_KEY`
- `JWT_SECRET` (32+ chars)
- `DB_USER`
- `DB_PASSWORD`

Optional:
- `DB_NAME` (default: `geodaily`)
- `GITHUB_OWNER` (default image namespace)
- `IMAGE_TAG` (default: `latest`)

Run:

`docker compose -f docker-compose.prod.yml up -d`

## Database

Generate and apply migrations:

1. `npm run db:generate`
2. `npm run db:push`
3. `npm run db:seed`

## Test Commands

- Unit tests: `npm run test`
- API tests: `npm run test:api`
- E2E tests: `npm run test:e2e`

## Security Notes

- `DEV_AUTH_BYPASS` must be `false` in production.
- `JWT_SECRET` must be strong and private.
- Do not commit `.env` with real secrets.
