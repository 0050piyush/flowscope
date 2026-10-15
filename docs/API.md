# Flowscope API

REST API served by the local dev server (`api/server.js`). All endpoints return JSON, have CORS enabled (`Access-Control-Allow-Origin: *`), and require **no auth**.

- **Base URL (local dev):** `http://localhost:3000` (override with `PORT`)
- **Production:** Flowscope is a fully static site — there is **no hosted API**. Upload `site/` to Hostinger (see `docs/DEPLOY.md`). The API exists for local development and tooling only.

## Quick start

```bash
cd ~/workspace/flowscope
npm install
npm run dev        # starts API + serves site/ at http://localhost:3000
```

## Response envelope

List endpoints return:

```json
{
  "screens": [ ... ],
  "total": 128,
  "limit": 50,
  "offset": 0
}
```

`total` is the number of items *before* pagination. Single-item endpoints return `{ "screen": { ... } }` (or `{ "flow" }`, `{ "app" }`).

If the data files are missing or incomplete, every response also carries a `warning` field — the server never crashes on missing data:

```json
{ "screens": [], "total": 0, "limit": 50, "offset": 0,
  "warning": "Data incomplete or missing: Data directory not found: ..." }
```

Errors look like `{ "error": "Screen not found: xyz" }` with the matching HTTP status.

## Data merging

At startup the server merges **all** data parts from `data/`:

- `data/screens.json` **and** every `data/screens-*.json` → merged, deduplicated by `id`
- same for `flows-*.json`, `apps-*.json`, `patterns-*.json`, `elements-*.json`

Drop `screens-a.json`, `screens-b.json`, … into `data/` and restart the server — no code changes needed.

---

## Endpoints

### `GET /api/screens`

List screens with optional filters. Defaults: `sort=popular`, `limit=50`, `offset=0` (max `limit=100`).

| Query param | Description |
|---|---|
| `app` | Match `app_id` or `app_name` (case-insensitive, partial) |
| `pattern` | Match `pattern` name, e.g. `Sign In` |
| `element` | Match an entry in the screen's `elements[]`, e.g. `Button` |
| `platform` | `iOS` / `Android` / `Web` … |
| `category` | App category, e.g. `Finance` |
| `q` | Free text over title, app_name, pattern, elements, text blob |
| `sort` | `popular` (default, by `popularity` desc) or `newest` (by `created` desc) |
| `limit` / `offset` | Pagination |

**Example**

```bash
curl "http://localhost:3000/api/screens?app=nimbus&platform=iOS&sort=newest&limit=5"
```

```json
{
  "screens": [
    {
      "id": "scr-002",
      "app_id": "app-01",
      "app_name": "Nimbus Bank",
      "title": "Dashboard",
      "pattern": "Dashboard",
      "elements": ["Cards", "Chart"],
      "platform": "iOS",
      "category": "Finance",
      "colors": ["#1A73E8"],
      "tokens": {},
      "text": "Balance overview",
      "image": "screens/scr-002.png",
      "width": 390,
      "height": 844,
      "popularity": 88,
      "created": "2026-09-05"
    }
  ],
  "total": 2,
  "limit": 5,
  "offset": 0
}
```

### `GET /api/screens/:id`

**Example:** `curl http://localhost:3000/api/screens/scr-002`

```json
{ "screen": { "id": "scr-002", "app_id": "app-01", "app_name": "Nimbus Bank", "title": "Dashboard", "...": "..." } }
```

404 if the id doesn't exist: `{ "error": "Screen not found: xyz" }`.

### `GET /api/flows`

| Query param | Description |
|---|---|
| `app` | Match `app_id` or `app_name` (partial, case-insensitive) |
| `category` | e.g. `Finance` |
| `q` | Free text over title, app_name, description, category, platform |
| `limit` / `offset` | Pagination |

**Example**

```bash
curl "http://localhost:3000/api/flows?app=nimbus"
```

```json
{
  "flows": [
    {
      "id": "flow-01",
      "app_id": "app-01",
      "app_name": "Nimbus Bank",
      "title": "Open an account",
      "description": "Full signup flow",
      "category": "Finance",
      "platform": "iOS",
      "steps": [
        { "screen_id": "scr-001", "caption": "Enter credentials" },
        { "screen_id": "scr-002", "caption": "View dashboard", "hotspot": { "x": 50, "y": 80 } }
      ],
      "popularity": 80,
      "created": "2026-09-10"
    }
  ],
  "total": 1, "limit": 50, "offset": 0
}
```

### `GET /api/flows/:id`

**Example:** `curl http://localhost:3000/api/flows/flow-01` → `{ "flow": { ... } }`. 404 if missing.

### `GET /api/apps`

List all apps (`?limit=&offset=` supported).

```json
{
  "apps": [
    {
      "id": "app-01",
      "name": "Nimbus Bank",
      "tagline": "Banking without the bank",
      "category": "Finance",
      "platforms": ["iOS", "Android"],
      "brand_color": "#1A73E8",
      "icon": "apps/nimbus.png",
      "description": "A fictional neobank",
      "featured": true
    }
  ],
  "total": 2, "limit": 50, "offset": 0
}
```

### `GET /api/apps/:id`

The app **with its screens and flows embedded** — handy for app detail pages:

```bash
curl http://localhost:3000/api/apps/app-01
```

```json
{
  "app": {
    "id": "app-01",
    "name": "Nimbus Bank",
    "...": "...",
    "screens": [ { "id": "scr-001", "...": "..." }, { "id": "scr-002", "...": "..." } ],
    "flows": [ { "id": "flow-01", "...": "..." } ]
  }
}
```

404 if missing: `{ "error": "App not found: xyz" }`.

### `GET /api/patterns` · `GET /api/elements`

Reference lists (`?limit=&offset=` supported):

```bash
curl http://localhost:3000/api/patterns
# { "patterns": [ { "id": "pat-signin", "name": "Sign In", "description": "Authentication entry point" } ], "total": 1, ... }
```

### `GET /api/search?q=`

Cross-collection search: `q` is matched against title, app_name, pattern, elements, and the text blob of screens, plus title/app_name/description/category/platform of flows. `q` is **required** (400 without it).

**Example**

```bash
curl "http://localhost:3000/api/search?q=onboarding"
```

```json
{
  "query": "onboarding",
  "screens": [ ... ],
  "flows": [ ... ],
  "totals": { "screens": 12, "flows": 3 }
}
```

### `GET /api/stats`

Dataset totals:

```bash
curl http://localhost:3000/api/stats
# { "screens": 3, "flows": 1, "apps": 2, "patterns": 1, "elements": 1 }
```

### `GET /api`

Service index — name, version, endpoint list. Useful for a quick health check.

---

## Rate limits

**None — be nice.** This is a local dev server. Don't hammer it in a loop; add a small delay between bulk requests if you're scripting imports.

## CORS

Wide open: `Access-Control-Allow-Origin: *` on every response, `OPTIONS` preflights answered with `204`. Any origin (the static site, a local prototype, `curl`) can call the API directly from the browser.

## Versioning

The API is **unversioned** (`/api/...`, no `/v1/` prefix) while Flowscope is pre-1.0 and the only consumer is the local dev site. If a hosted API ever ships, it will be versioned and this document updated. Breaking changes before then will be noted in the changelog.

## Running the server

```bash
cd ~/workspace/flowscope
npm install     # once
npm run dev     # node api/server.js → http://localhost:3000
PORT=4000 npm run dev   # custom port
```

Startup logs show what was loaded (`[data] screens: +120 from screens-a.json`) and any warnings. Every request is logged to the console (`2026-10-15T… GET /api/screens?app=…`).
