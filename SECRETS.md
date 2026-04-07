# GeoDaily Secrets and Environment Management

## Required Secrets (Production)

- `DATABASE_URL`: PostgreSQL connection string
- `GEMINI_API_KEY`: Gemini API key
- `JWT_SECRET`: JWT signing secret, minimum 32 characters
- `DB_USER`: Postgres username for compose-managed DB
- `DB_PASSWORD`: Postgres password for compose-managed DB

## Recommended

- rotate `JWT_SECRET` periodically
- store secrets in platform secret manager
- avoid plain-text `.env` files on shared hosts

## GitHub Actions

The GHCR publish workflow uses:

- `${{ secrets.GITHUB_TOKEN }}`

No custom GHCR token is required unless your org policy requires one.

## Local Development

Use `.env` from `.env.example`.

For local-only convenience:

- you may set `DEV_AUTH_BYPASS=true`
- never use `DEV_AUTH_BYPASS=true` in production

## Production Compose

`docker-compose.prod.yml` enforces required variables with compose expansion checks.

Example export before deployment:

- `export DATABASE_URL=postgresql://...`
- `export GEMINI_API_KEY=...`
- `export JWT_SECRET=...`
- `export DB_USER=...`
- `export DB_PASSWORD=...`
