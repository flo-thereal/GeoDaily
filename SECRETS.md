# GeoDaily Secrets

## GitHub repository secrets

| Secret | Used by | Purpose |
|--------|---------|---------|
| `GEMINI_API_KEY` | [generate-challenges.yml](.github/workflows/generate-challenges.yml) | Generate daily challenge JSON via Gemini |

Add under **Settings → Secrets and variables → Actions → New repository secret**.

## GitHub Actions (deploy)

The [deploy.yml](.github/workflows/deploy.yml) workflow uses the default `GITHUB_TOKEN` with `pages: write` and `id-token: write`. No extra token is required.

**First-time setup:** enable GitHub Pages for the repo (**Settings → Pages → Build and deployment → Source: GitHub Actions**). The workflow cannot create the Pages site if Pages was never enabled.

## Local development

Optional: copy `.env.example` to `.env` if you run `npm run generate:challenges` locally and need `GEMINI_API_KEY` on your machine.

Never commit `.env` or API keys to the repository.
