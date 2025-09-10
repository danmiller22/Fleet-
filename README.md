# US Fleet

Minimal demo of a Transport Management System UI. All data is local (stored in `localStorage`). No backend required.

## How to run`n- Local (one command):`n  - npm start then open http://localhost:8787`n  - Serves the SPA and REST API at /api/{trucks|trailers|cases|expenses} (JSON file server/db.json auto-seeded)`n  - Or open index.html directly in a modern browser (Chrome / Safari / Edge) for offline-only mode`n`n## Cloudflare Pages (free)
- This repo contains Pages Functions under `functions/api` that expose the REST API using Cloudflare KV (binding `DB`).
- Two ways to deploy:
  1) Dashboard → Pages → Create project → Connect Git (recommended). Build output directory: root (`/`). Functions: auto-detected from `functions/`.
  2) CLI: `npx wrangler pages deploy .` (free). Requires Node. `wrangler.toml` is included.
- After creating the Pages project, go to Settings → Functions → KV Bindings and add a KV namespace named `DB`.
- Endpoints: GET/POST/PUT/DELETE /api/{trucks|trailers|cases|expenses}.

## Supabase (free Postgres)
- Optional: Use Supabase instead of KV. Steps:
  1) Create a Supabase project (Free tier).
  2) Open SQL editor and run `supabase/schema.sql` from this repo to create tables.
  3) In Cloudflare Pages → Settings → Environment variables, add:
     - `SUPABASE_URL` = your Supabase project URL (e.g., https://xxxx.supabase.co)
     - `SUPABASE_KEY` = service role key (preferred) or anon key
  4) Redeploy. The API will auto-detect Supabase and use it; KV remains a fallback.
  5) Endpoints unchanged: `/api/{collection}`.

## Features
- Sections: Dashboard / Trucks / Trailers / Cases / Finance / Analytics / Settings
- CRUD modal forms (view, edit, create, delete)
- Global and table search, CSV export
- KPI counters and smooth animations
- Command palette (⌘/Ctrl + K)
- Light/Dark theme toggle

## Customization
- Brand color: `--brand` in `css/style.css`
- Logo: replace `assets/logo.png` (square, ~512×512)
- Company name: `.brand-name` in `index.html`

## Notes
- Data persists via `localStorage` (see `load()` / `persist()` in `js/app.js`).
- When integrating a backend, wire `render()` / `onSave()` / `removeRow()` to your API.
- Backend: JSON file store at `data/db.json`, REST endpoints under `/api`.
- CORS enabled. Collections: `trucks`, `trailers`, `repairs`, `expenses`.
- Cloudflare variant: KV-based storage (free tier). Seed data auto-initialized on first run.



