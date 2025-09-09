# US Fleet

Minimal demo of a Transport Management System UI. All data is local (stored in `localStorage`). No backend required.

## How to run
- Local (optional):
  - Backend (Node, no deps): `node server/api-server.js` → http://localhost:3000
  - Frontend (static dev server): `node tools/dev-server.js` → http://localhost:5173
  - Or open `index.html` directly in a modern browser (Chrome / Safari / Edge)

## Cloudflare Pages (free)
- This repo contains Pages Functions under `functions/api` that expose the REST API using Cloudflare KV (binding `DB`).
- Two ways to deploy:
  1) Dashboard → Pages → Create project → Connect Git (recommended). Build output directory: root (`/`). Functions: auto-detected from `functions/`.
  2) CLI: `npx wrangler pages deploy .` (free). Requires Node. `wrangler.toml` is included.
- After creating the Pages project, go to Settings → Functions → KV Bindings and add a KV namespace named `DB`.
- Endpoints: `GET/POST/PUT/DELETE /api/{trucks|trailers|repairs|expenses}`.

## Features
- Sections: Trucks / Trailers / Repairs / Expenses
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
