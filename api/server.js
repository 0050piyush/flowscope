/**
 * Flowscope — local dev API server.
 *
 * A tiny Node/Express server for local development. NOT required for hosting:
 * production is a fully static site (upload `site/` contents to Hostinger).
 *
 * Endpoints (all JSON, CORS enabled, no auth):
 *   GET /api/screens  ?app=&pattern=&element=&platform=&category=&q=&sort=popular|newest&limit=&offset=
 *   GET /api/screens/:id
 *   GET /api/flows     ?app=&category=&q=&limit=&offset=
 *   GET /api/flows/:id
 *   GET /api/apps
 *   GET /api/apps/:id            (embeds that app's screens + flows)
 *   GET /api/patterns
 *   GET /api/elements
 *   GET /api/search?q=           (screens + flows, title/app_name/pattern/elements/text)
 *   GET /api/stats               {screens, flows, apps, patterns, elements}
 *
 * Data: the server merges ALL data parts at startup. Files matching
 *   data/screens-*.json -> merged into screens (deduplicated by `id`),
 * same for flows/apps/patterns/elements, plus single data/screens.json
 * etc. if present. Missing data dir/files are fine — endpoints return
 * empty arrays with a `warning` field, never a crash.
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, '..', 'data');
const SITE_DIR = path.join(__dirname, '..', 'site');

// ---------------------------------------------------------------- data loading
const COLLECTIONS = ['screens', 'flows', 'apps', 'patterns', 'elements'];
const data = {};          // { screens: [...], flows: [...], ... }
const dataWarnings = [];  // human-readable notes when something is off

/**
 * Load + merge one collection.
 * Sources: data/<name>.json  and  data/<name>-*.json  (parts). Parts are
 * sorted alphabetically, merged in order, and deduplicated by `id`
 * (first occurrence wins).
 */
function loadCollection(name) {
  const items = [];
  const seen = new Set();
  const files = [];

  if (fs.existsSync(DATA_DIR)) {
    if (fs.existsSync(path.join(DATA_DIR, `${name}.json`))) files.push(`${name}.json`);
    fs.readdirSync(DATA_DIR)
      .filter((f) => f.startsWith(`${name}-`) && f.endsWith('.json'))
      .sort()
      .forEach((f) => files.push(f));
  } else {
    dataWarnings.push(`Data directory not found: ${DATA_DIR}`);
    return items;
  }

  for (const file of files) {
    const full = path.join(DATA_DIR, file);
    try {
      const parsed = JSON.parse(fs.readFileSync(full, 'utf8'));
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      let added = 0;
      for (const item of arr) {
        if (item && item.id != null && !seen.has(item.id)) {
          seen.add(item.id);
          items.push(item);
          added++;
        }
      }
      console.log(`[data] ${name}: +${added} from ${file}`);
    } catch (err) {
      dataWarnings.push(`Could not parse ${file}: ${err.message}`);
    }
  }

  if (files.length === 0) {
    dataWarnings.push(`No data files found for "${name}" (looked for ${name}.json / ${name}-*.json)`);
  }
  return items;
}

for (const name of COLLECTIONS) {
  data[name] = loadCollection(name);
}
// Collapse duplicate warnings (e.g. missing data dir was reported once per collection).
for (let i = dataWarnings.length - 1; i > 0; i--) {
  if (dataWarnings.indexOf(dataWarnings[i]) < i) dataWarnings.splice(i, 1);
}

if (dataWarnings.length) {
  console.warn('[data] warnings:\n  - ' + dataWarnings.join('\n  - '));
}

// ------------------------------------------------------------------- app setup
const app = express();

// CORS — everything open, no auth on this dev API.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Tiny request log.
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method} ${req.originalUrl}`);
  next();
});

// Static site at /. If site/ isn't built yet, API routes still work.
if (fs.existsSync(SITE_DIR)) {
  app.use(express.static(SITE_DIR));
  console.log(`[site] serving static files from ${SITE_DIR}`);
} else {
  console.warn(`[site] not found (${SITE_DIR}) — API only until the site is built`);
}

// Also expose the raw JSON data dir at /data (mirrors the open-data layout
// used when the repo root is served statically).
if (fs.existsSync(DATA_DIR)) {
  app.use('/data', express.static(DATA_DIR));
}

// ------------------------------------------------------------------- helpers
const toInt = (v, fallback) => {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? fallback : n;
};

const ci = (v) => String(v ?? '').toLowerCase();
const contains = (haystack, needle) => ci(haystack).includes(ci(needle));

/** Build a standard list response: { <key>: [...], total, limit, offset }. */
function listResponse(items, req, key, maxLimit = 100) {
  const limit = Math.min(Math.max(toInt(req.query.limit, 50), 1), maxLimit);
  const offset = Math.max(toInt(req.query.offset, 0), 0);
  return withWarning({
    [key]: items.slice(offset, offset + limit),
    total: items.length,
    limit,
    offset,
  });
}

function withWarning(payload) {
  if (dataWarnings.length) payload.warning = 'Data incomplete or missing: ' + dataWarnings.join('; ');
  return payload;
}

function byId(collection, id) {
  return data[collection].find((item) => String(item.id) === String(id));
}

/** Sort screens: 'popular' (popularity desc) or 'newest' (created desc). */
function sortScreens(items, sort) {
  const arr = [...items];
  if (sort === 'newest') arr.sort((a, b) => (b.created || '').localeCompare(a.created || ''));
  else arr.sort((a, b) => (b.popularity || 0) - (a.popularity || 0)); // default: popular
  return arr;
}

/** Shared text search across the schema's searchable fields. */
function matchesQuery(item, q, fields) {
  if (!q) return true;
  return fields.some((f) => {
    const v = item[f];
    if (Array.isArray(v)) return v.some((x) => contains(x, q));
    return contains(v, q);
  });
}

const SCREEN_FIELDS = ['title', 'app_name', 'pattern', 'elements', 'text', 'category', 'platform'];

// --------------------------------------------------------------------- routes
app.get('/api/screens', (req, res) => {
  const { app: appQ, pattern, element, platform, category, q, sort } = req.query;
  let items = data.screens.filter((s) => {
    if (appQ && !(contains(s.app_name, appQ) || contains(s.app_id, appQ))) return false;
    if (pattern && !contains(s.pattern, pattern)) return false;
    if (element && !(Array.isArray(s.elements) && s.elements.some((e) => contains(e, element)))) return false;
    if (platform && !contains(s.platform, platform)) return false;
    if (category && !contains(s.category, category)) return false;
    return matchesQuery(s, q, SCREEN_FIELDS);
  });
  items = sortScreens(items, sort);
  res.json(listResponse(items, req, "screens"));
});

// NOTE: Express 4 style optional params would be '/api/screens/:id'; keep it simple.
app.get('/api/screens/:id', (req, res) => {
  const screen = byId('screens', req.params.id);
  if (!screen) return res.status(404).json({ error: `Screen not found: ${req.params.id}` });
  res.json(withWarning({ screen }));
});

app.get('/api/flows', (req, res) => {
  const { app: appQ, category, q } = req.query;
  const items = data.flows.filter((f) => {
    if (appQ && !(contains(f.app_name, appQ) || contains(f.app_id, appQ))) return false;
    if (category && !contains(f.category, category)) return false;
    return matchesQuery(f, q, ['title', 'app_name', 'description', 'category', 'platform']);
  });
  res.json(listResponse(items, req, "flows"));
});

app.get('/api/flows/:id', (req, res) => {
  const flow = byId('flows', req.params.id);
  if (!flow) return res.status(404).json({ error: `Flow not found: ${req.params.id}` });
  res.json(withWarning({ flow }));
});

app.get('/api/apps', (req, res) => {
  res.json(listResponse(data.apps, req, "apps"));
});

app.get('/api/apps/:id', (req, res) => {
  const found = byId('apps', req.params.id);
  if (!found) return res.status(404).json({ error: `App not found: ${req.params.id}` });
  res.json(
    withWarning({
      app: {
        ...found,
        screens: data.screens.filter((s) => String(s.app_id) === String(found.id)),
        flows: data.flows.filter((f) => String(f.app_id) === String(found.id)),
      },
    })
  );
});

app.get('/api/patterns', (req, res) => {
  res.json(listResponse(data.patterns, req, "patterns"));
});

app.get('/api/elements', (req, res) => {
  res.json(listResponse(data.elements, req, "elements"));
});

app.get('/api/search', (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Missing required query param: q' });
  const screens = sortScreens(
    data.screens.filter((s) => matchesQuery(s, q, SCREEN_FIELDS)),
    req.query.sort
  );
  const flows = data.flows.filter((f) =>
    matchesQuery(f, q, ['title', 'app_name', 'description', 'category', 'platform'])
  );
  const screensPage = listResponse(screens, req, 'screens');
  const flowsPage = listResponse(flows, req, 'flows');
  res.json(
    withWarning({
      query: q,
      screens: screensPage.screens,
      flows: flowsPage.flows,
      totals: { screens: screensPage.total, flows: flowsPage.total },
    })
  );
});

app.get('/api/stats', (req, res) => {
  res.json(
    withWarning({
      screens: data.screens.length,
      flows: data.flows.length,
      apps: data.apps.length,
      patterns: data.patterns.length,
      elements: data.elements.length,
    })
  );
});

// Friendly root for API-only usage.
app.get('/api', (req, res) => {
  res.json({
    name: 'Flowscope API',
    version: '1.0.0',
    docs: '/docs/API.md (repo) or see README.md',
    endpoints: [
      'GET /api/screens', 'GET /api/screens/:id',
      'GET /api/flows', 'GET /api/flows/:id',
      'GET /api/apps', 'GET /api/apps/:id',
      'GET /api/patterns', 'GET /api/elements',
      'GET /api/search?q=', 'GET /api/stats',
    ],
  });
});

// 404 for unknown API routes (not for the static site — express.static handles those).
app.use('/api', (req, res) => res.status(404).json({ error: `Unknown API route: ${req.originalUrl}` }));

app.listen(PORT, () => {
  console.log(`\n[flowscope] API + static site on http://localhost:${PORT}`);
  console.log(`[flowscope] Data: ${data.screens.length} screens, ${data.flows.length} flows, ${data.apps.length} apps\n`);
});
