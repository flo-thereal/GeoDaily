# GeoDaily Deployment Guide

## 1. Build and Push Image to GHCR

This repository includes GitHub Actions workflow:

- `.github/workflows/build-image.yml`

On push to `main`, it builds and publishes:

- `ghcr.io/<owner>/geodaily:latest`
- `ghcr.io/<owner>/geodaily:<sha>`

## 2. Prepare Production Environment Variables

Required:

- `DATABASE_URL`
- `GEMINI_API_KEY`
- `JWT_SECRET` (32+ chars)
- `DB_USER`
- `DB_PASSWORD`

Optional:

- `DB_NAME` (default: `geodaily`)
- `GITHUB_OWNER` (default image owner namespace)
- `IMAGE_TAG` (default: `latest`)

## 3. Start Production Stack

Run:

- `docker compose -f docker-compose.prod.yml up -d`

Check health:

- `curl http://localhost:3000/api/health`

## 4. Apply Migrations

Before first production run against a fresh database:

- `npm run db:generate` (already done in repo)
- `npm run db:push`
- `npm run db:seed` (optional for initial data)

## 5. Local Development with Compose

Run:

- `docker compose up --build`

Notes:

- `docker-compose.yml` is for development.
- `docker-compose.prod.yml` is for production-like runtime.

## 6. Rollback

Use an older image tag:

1. Set `IMAGE_TAG=<known-good-sha>`
2. `docker compose -f docker-compose.prod.yml up -d`

## 7. Security Checklist

- `DEV_AUTH_BYPASS=false` in production
- strong `JWT_SECRET`
- no secrets committed to git
- monitoring and backups enabled
