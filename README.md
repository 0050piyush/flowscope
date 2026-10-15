# 🔭 Flowscope

**The free, open-source UI/UX pattern library.** Browse thousands of mobile app screens and user flows — search by pattern, UI element, app, or platform, and study how great products are built.

UI inspiration tools exist, but the good ones sit behind paywalls. Flowscope is **100% free forever**: no accounts, no subscriptions, no "pro" tier locking the best content. The library, the data schema, and the code are all open so anyone can browse, contribute, and self-host.

> Inspired by tools like Mobbin — rebuilt as a community-owned, free alternative.

---

## ✨ Features

- **Screen library** — browse app UI screens with titles, patterns, and metadata
- **User flows** — step-by-step flows with captions and hotspot annotations
- **Powerful search & filters** — by app, pattern (`Sign In`, `Onboarding`, `Checkout`…), UI element (`Button`, `Bottom Sheet`…), platform (iOS / Android / Web), and category
- **Sort by popular or newest**, paginated JSON API for builders
- **App pages** — every app with its screens and flows in one place
- **Local dev API** — tiny Express server (`api/`) for development and tooling
- **Static-first** — the production site is plain HTML/CSS/JS; host it anywhere for free

## 📸 Screenshots

> 🚧 Screenshots coming soon — the site is under active development.

| Browse screens | Flow detail | Search |
|---|---|---|
| *placeholder* | *placeholder* | *placeholder* |

*(Replace this table with real screenshots from `site/` once the UI lands.)*

---

## 🚀 Quickstart

**Just look around** (no build step, no server needed):

```bash
open site/index.html        # macOS — or double-click it in your file manager
```

**Run the dev server** (API + site together):

```bash
npm install
npm run dev
# → http://localhost:3000   (API at /api/*, see docs/API.md)
```

**Generate seed data** (screenshots + JSON, via Puppeteer):

```bash
npm run screenshots:a       # node scripts/gen-screens-a.js
npm run screenshots:b       # node scripts/gen-screens-b.js
```

---

## 🗂️ Project structure

```
flowscope/
├── api/
│   └── server.js            # Local dev API (Express). NOT needed for hosting.
├── data/                   # Seed JSON — canonical source of truth
│   ├── screens.json        # Merged: 144 screens (built from screens-a/b.json parts)
│   ├── flows.json          # Merged: 12 flows
│   ├── apps.json           # 10 apps
│   ├── patterns.json       # 27 patterns
│   └── elements.json       # 28 elements
├── site/                   # Static site (HTML/CSS/JS) — this is what gets hosted
│   └── data/               # Static copy of data/*.json so the site works on any
│                           # plain file host (Hostinger, GitHub Pages). Regenerate
│                           # after editing data/: `cp data/*.json site/data/`
├── scripts/
│   ├── gen-screens-a.js    # Screenshot + seed-data generator (batch A)
│   └── gen-screens-b.js    # Screenshot + seed-data generator (batch B)
├── docs/
│   ├── API.md              # Full API reference
│   └── DEPLOY.md           # Hosting guide (Hostinger, GitHub Pages)
├── package.json
└── README.md
```

### Data schema (summary)

- **screens**: `{id, app_id, app_name, title, pattern, elements[], platform, category, colors[], tokens{}, text, image, width, height, popularity, created}`
- **flows**: `{id, app_id, app_name, title, description, category, platform, steps[{screen_id, caption, hotspot?}], popularity, created}`
- **apps**: `{id, name, tagline, category, platforms[], brand_color, icon, description, featured}`
- **patterns / elements**: `{id, name, description}`

The API merges `data/<collection>.json` **and** `data/<collection>-*.json` parts at startup, deduplicating by `id`.

---

## 📜 Licenses

Two licenses, kept separate on purpose:

- **Data** (`data/` — screens, flows, app metadata): **[CC0 (public domain)](https://creativecommons.org/publicdomain/zero/1.0/)**. Every screen in the library is an **original fictional design** created for Flowscope — no real app's copyrighted UI is reproduced. Use the data for anything, no attribution required.
- **Code** (everything else): **[MIT](./LICENSE)** — do what you want, keep the copyright notice.

## 🤝 Contributing

Contributions welcome — screens, flows, bug fixes, docs.

**Adding screens** (the most common contribution):

1. Add your generator or assets under `scripts/` following the existing pattern:
   `scripts/gen-screens-<batch>.js` → writes `data/screens-<batch>.json` (+ images).
2. Keep the schema above exact — the API and site depend on field names.
3. Use original fictional designs only (CC0 requirement — no tracing real apps).
4. Run `npm run dev` and check `http://localhost:3000/api/stats` — your screens should show up in the count.

**Other contributions:** bug reports and PRs via GitHub Issues / pull requests. Keep PRs small and focused; one batch of screens or one fix per PR.

## 🌐 Deployment

Flowscope's production site is **100% static**. Deploying = uploading the `site/` folder:

- **Hostinger:** File Manager or FTP → upload contents of `site/` to `public_html`. Full steps in [`docs/DEPLOY.md`](docs/DEPLOY.md).
- **GitHub Pages / Netlify / Vercel:** point at `site/` as the publish directory.

The Express API is for local development only and is never needed in production.

---

## 🗺️ Roadmap

- [ ] Screen detail pages with element-level annotations
- [ ] Flow player (click-through prototype view)
- [ ] Collections / boards (save screens to named sets, local-first)
- [ ] More seed batches (target: 1,000+ screens across 50+ fictional apps)
- [ ] Dark mode for the site
- [ ] Figma plugin to push Flowscope patterns into your files
- [ ] Community submissions via PR with automated schema validation (CI)

---

MIT © Flowscope contributors. Data is CC0 — free as in everything.
