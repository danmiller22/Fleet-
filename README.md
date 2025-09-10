# US Fleet

Minimal demo of a Transport Management System UI. Supports offline mode (localStorage), a local Node API, and a free cloud DB.

## Local Dev
- Quick start: `npm run dev`
  - API: http://localhost:3000 (`/api/{trucks|trailers|repairs|expenses}`)
  - Web: http://localhost:5173
- Or run separately:
  - API only: `npm run api`
  - Web only: `npm run serve`

## Backend Options (free)
- Local JSON (default):
  - Node API reads/writes `data/db.json` (auto-seeded).
- Supabase (free Postgres):
  1) Create a Supabase project (Free tier).
  2) In SQL editor, run `supabase/schema.sql`.
  3) Set env vars for Node API (or Pages Functions):
     - `SUPABASE_URL` (e.g. https://xxxx.supabase.co)
     - `SUPABASE_KEY` (service role key preferred; anon works for demo)
  4) Restart `npm run dev`. The API auto-detects Supabase and uses it; JSON remains a fallback when not configured.

## Cloudflare Pages (free)
- Functions in `functions/api` provide the same REST API using KV or Supabase.
- Deploy options:
  1) Dashboard → Pages → Create project → Connect Git (build output dir: root `/`). Functions auto-detected.
  2) CLI: `npx wrangler pages deploy .` (see `wrangler.toml`).
- Bind KV in Settings → Functions → KV Bindings: add a namespace named `DB`.
- Optional: set `SUPABASE_URL`, `SUPABASE_KEY` env vars to use Supabase instead of KV.

## Features
- Sections: Trucks / Trailers / Repairs / Expenses
- CRUD modal forms (view, edit, create, delete)
- Global and table search, CSV export
- KPI counters and smooth animations
- Command palette (Ctrl/Cmd + K)
- Light/Dark theme toggle

## Customization
- Brand color: `--brand` in `css/style.css`
- Logo: replace `assets/logo.png` (square, ~512×512)
- Company name: `.brand-name` in `index.html`

## Notes
- Data persists via `localStorage` when offline.
- The frontend auto-detects the API: for local dev it uses `http://localhost:3000/api`; in Pages it uses same-origin `/api`.
- Collections: `trucks`, `trailers`, `repairs`, `expenses`.
