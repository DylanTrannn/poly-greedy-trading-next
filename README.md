# Greedy Digest (Next.js)

Near-close Polymarket scanner with optional AI analysis. Single Next.js app deployable to Vercel — no separate API server or Postgres.

## Features

- Live Gamma API scan with SSE progress
- Same dark UI as the original monorepo web app
- Optional **Analyze with AI** when `OPENROUTER_API_KEY` is set (fallback text when not)

## Local development

```bash
cp .env.example .env
pnpm install
pnpm dev
```

Open http://localhost:3000

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEAR_CLOSE_MAX_HOURS` | No | Scan window (default 4) |
| `MIN_OUTCOME_PROB` | No | Min leading outcome (default 0.96) |
| `SCAN_MAX_PAGES` | No | Gamma pagination cap (default 50) |
| `OPENROUTER_API_KEY` | No | Enables AI analysis |
| `OPENROUTER_MODEL` | No | OpenRouter model id |

See [`.env.example`](.env.example) for the full list.

## Deploy to Vercel

1. Push this repo (or import the `poly-greedy-trading-next` folder as its own Git repo).
2. Create a Vercel project from the repository root.
3. Add environment variables in the Vercel dashboard (same names as `.env.example`).
4. Deploy.

**Timeout note:** Full scans with many Gamma pages can exceed Vercel Hobby’s 10s limit. Use a lower `SCAN_MAX_PAGES` on Hobby, or Vercel Pro for longer runs (`maxDuration` is set to 300s on scan/analyze routes).

## Scripts

```bash
pnpm dev      # development server
pnpm build    # production build
pnpm start    # run production build locally
```

## Disclaimer

Research aid only — not financial advice. Verify resolution rules and prices on Polymarket before trading.
