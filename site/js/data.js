/* ==========================================================================
   Flowscope — data layer (js/data.js)
   Loads ../data/*.json defensively. Every loader resolves to an array;
   if a file is missing or malformed the page shows a friendly error
   state instead of crashing. No hard dependency on any single file.
   ========================================================================== */
(function () {
  'use strict';

  // Base paths for data files, tried in order:
  //   1. 'data/'      — static hosts (Hostinger, GitHub Pages): site/data/ ships with the site
  //   2. '../data/'   — repo-root checkout served by the dev server
  var DATA_BASES = ['data/', '../data/'];

  // Simple in-memory cache so repeated calls don't re-fetch.
  var cache = {};
  var loadErrors = [];

  /**
   * Fetch one JSON file. Never throws — returns [] on any failure and
   * records the error for the error banner.
   */
  function fetchFirst(name) {
    var attempts = DATA_BASES.map(function (base) { return base + name; });
    function attempt(i) {
      return fetch(attempts[i], { cache: 'no-store' })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(function (json) {
          return Array.isArray(json) ? json : (json && json.data) || [];
        })
        .catch(function (err) {
          if (i + 1 < attempts.length) return attempt(i + 1);
          loadErrors.push({ file: name, error: String(err && err.message || err) });
          return [];
        });
    }
    return attempt(0);
  }

  function loadFile(name) {
    if (cache[name]) return cache[name];
    var p = fetchFirst(name);
    cache[name] = p;
    return p;
  }

  var FILES = {
    screens: 'screens.json',
    flows: 'flows.json',
    apps: 'apps.json',
    patterns: 'patterns.json',
    elements: 'elements.json'
  };

  /** Load everything in parallel. Resolves to {screens, flows, apps, patterns, elements}. */
  function loadAll() {
    return Promise.all([
      loadFile(FILES.screens),
      loadFile(FILES.flows),
      loadFile(FILES.apps),
      loadFile(FILES.patterns),
      loadFile(FILES.elements)
    ]).then(function (r) {
      return { screens: r[0], flows: r[1], apps: r[2], patterns: r[3], elements: r[4] };
    });
  }

  /** Was there at least one failed file? */
  function hadErrors() { return loadErrors.length > 0; }
  function getErrors() { return loadErrors.slice(); }

  /* ---- lookups -------------------------------------------------------- */
  function byId(list, id) {
    if (!id) return null;
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].id) === String(id)) return list[i];
    }
    return null;
  }

  /* ---- color / hue helpers -------------------------------------------- */
  /** hex -> {h, s, l} (h in 0..360, s/l in 0..1) */
  function hexToHsl(hex) {
    var m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex || '').trim());
    if (!m) return null;
    var h = m[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = parseInt(h.slice(0, 2), 16) / 255,
        g = parseInt(h.slice(2, 4), 16) / 255,
        b = parseInt(h.slice(4, 6), 16) / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var hh = 0, ss = 0, l = (max + min) / 2;
    if (max !== min) {
      var d = max - min;
      ss = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) hh = ((g - b) / d + (g < b ? 6 : 0));
      else if (max === g) hh = (b - r) / d + 2;
      else hh = (r - g) / d + 4;
      hh *= 60;
    }
    return { h: hh, s: ss, l: l };
  }

  // Hue buckets used by the color filter (exact display names).
  var HUE_BUCKETS = [
    { id: 'red',     name: 'Red',     swatch: '#ef4444', test: function (c) { return c.s > .25 && (c.h < 15 || c.h >= 345); } },
    { id: 'orange',  name: 'Orange',  swatch: '#f97316', test: function (c) { return c.s > .25 && c.h >= 15 && c.h < 40; } },
    { id: 'yellow',  name: 'Yellow',  swatch: '#eab308', test: function (c) { return c.s > .25 && c.h >= 40 && c.h < 70; } },
    { id: 'green',   name: 'Green',   swatch: '#22c55e', test: function (c) { return c.s > .25 && c.h >= 70 && c.h < 160; } },
    { id: 'teal',    name: 'Teal',    swatch: '#14b8a6', test: function (c) { return c.s > .25 && c.h >= 160 && c.h < 195; } },
    { id: 'blue',    name: 'Blue',    swatch: '#3b82f6', test: function (c) { return c.s > .25 && c.h >= 195 && c.h < 255; } },
    { id: 'purple',  name: 'Purple',  swatch: '#a855f7', test: function (c) { return c.s > .25 && c.h >= 255 && c.h < 300; } },
    { id: 'pink',    name: 'Pink',    swatch: '#ec4899', test: function (c) { return c.s > .25 && c.h >= 300 && c.h < 345; } },
    { id: 'brown',   name: 'Brown',   swatch: '#92400e', test: function (c) { return c.s > .25 && c.h >= 15 && c.h < 40 && c.l < .4; } },
    { id: 'neutral', name: 'Neutral', swatch: '#94a3b8', test: function (c) { return c.s <= .25 && c.l > .2 && c.l < .85; } },
    { id: 'dark',    name: 'Dark',    swatch: '#1e293b', test: function (c) { return c.l <= .2; } },
    { id: 'light',   name: 'Light',   swatch: '#f8fafc', test: function (c) { return c.s <= .25 && c.l >= .85; } }
  ];

  /** True if any color in the screen's colors[] falls into the bucket. */
  function screenMatchesColorBucket(screen, bucketId) {
    var bucket = null;
    for (var i = 0; i < HUE_BUCKETS.length; i++) {
      if (HUE_BUCKETS[i].id === bucketId) { bucket = HUE_BUCKETS[i]; break; }
    }
    if (!bucket || !screen.colors) return false;
    for (var j = 0; j < screen.colors.length; j++) {
      var hsl = hexToHsl(screen.colors[j]);
      if (hsl && bucket.test(hsl)) return true;
    }
    return false;
  }

  /* ---- search --------------------------------------------------------- */
  function norm(s) { return String(s == null ? '' : s).toLowerCase(); }

  /** Full-text search across title, app, pattern, elements and on-screen text blob. */
  function searchScreens(screens, query) {
    var q = norm(query).trim();
    if (!q) return screens;
    var terms = q.split(/\s+/);
    return screens.filter(function (s) {
      var hay = [
        s.title, s.app_name, s.pattern,
        (s.elements || []).join(' '), s.platform, s.category, s.text
      ].map(norm).join(' ');
      return terms.every(function (t) { return hay.indexOf(t) !== -1; });
    });
  }

  /* ---- filtering + sorting -------------------------------------------- */
  /**
   * filters: { platforms:Set, categories:Set, patterns:Set, elements:Set,
   *            apps:Set, colors:Set(bucketIds), query:String }
   */
  function filterScreens(screens, filters) {
    var out = searchScreens(screens, filters.query || '');
    return out.filter(function (s) {
      if (filters.platforms && filters.platforms.size && !filters.platforms.has(s.platform)) return false;
      if (filters.categories && filters.categories.size && !filters.categories.has(s.category)) return false;
      if (filters.patterns && filters.patterns.size && !filters.patterns.has(s.pattern)) return false;
      if (filters.apps && filters.apps.size && !filters.apps.has(s.app_id)) return false;
      if (filters.colors && filters.colors.size) {
        var ok = false;
        filters.colors.forEach(function (b) { if (screenMatchesColorBucket(s, b)) ok = true; });
        if (!ok) return false;
      }
      if (filters.elements && filters.elements.size) {
        var els = s.elements || [];
        var hit = els.some(function (e) { return filters.elements.has(e); });
        if (!hit) return false;
      }
      return true;
    });
  }

  /** sort: 'newest' | 'popular' | 'az' */
  function sortScreens(screens, sort) {
    var arr = screens.slice();
    if (sort === 'popular') {
      arr.sort(function (a, b) { return (b.popularity || 0) - (a.popularity || 0); });
    } else if (sort === 'az') {
      arr.sort(function (a, b) { return norm(a.title).localeCompare(norm(b.title)); });
    } else { // newest
      arr.sort(function (a, b) { return String(b.created || '').localeCompare(String(a.created || '')); });
    }
    return arr;
  }

  /* ---- relations ------------------------------------------------------ */
  function relatedScreens(screens, screen, limit) {
    limit = limit || 8;
    var scored = [];
    for (var i = 0; i < screens.length; i++) {
      var s = screens[i];
      if (String(s.id) === String(screen.id)) continue;
      var score = 0;
      if (s.pattern && s.pattern === screen.pattern) score += 3;
      if (s.app_id && s.app_id === screen.app_id) score += 2;
      if (s.category && s.category === screen.category) score += 1;
      if (score > 0) scored.push({ s: s, score: score });
    }
    scored.sort(function (a, b) { return b.score - a.score || (b.s.popularity || 0) - (a.s.popularity || 0); });
    return scored.slice(0, limit).map(function (x) { return x.s; });
  }

  function screensForApp(screens, appId) {
    return screens.filter(function (s) { return String(s.app_id) === String(appId); });
  }
  function flowsForApp(flows, appId) {
    return flows.filter(function (f) { return String(f.app_id) === String(appId); });
  }

  /* ---- asset URL resolution ------------------------------------------- */
  /** Image paths in JSON ("assets/screens/x.png") are relative to site root. */
  function assetUrl(path) {
    if (!path) return '';
    if (/^(https?:|data:)/.test(path)) return path;
    // All pages live directly in site/, so a site-root-relative path works as-is.
    return path;
  }

  // Public API
  window.Flowscope = window.Flowscope || {};
  window.Flowscope.data = {
    loadAll: loadAll,
    loadFile: loadFile,
    hadErrors: hadErrors,
    getErrors: getErrors,
    byId: byId,
    hexToHsl: hexToHsl,
    HUE_BUCKETS: HUE_BUCKETS,
    screenMatchesColorBucket: screenMatchesColorBucket,
    searchScreens: searchScreens,
    filterScreens: filterScreens,
    sortScreens: sortScreens,
    relatedScreens: relatedScreens,
    screensForApp: screensForApp,
    flowsForApp: flowsForApp,
    assetUrl: assetUrl
  };
})();
