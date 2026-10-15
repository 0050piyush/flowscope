/* ==========================================================================
   Flowscope — global app shell (js/app.js)
   Theme toggle, injected header/footer, keyboard shortcuts, compare tray,
   toasts, modals, clipboard helpers, localStorage helpers, HTML escaping.
   Depends on: js/data.js (for tray thumbnails only at render time).
   ========================================================================== */
(function () {
  'use strict';

  var F = window.Flowscope = window.Flowscope || {};
  var D = null; // set after data.js loads (may be unavailable on error — guard)

  /* ---- HTML escaping (always escape user/data content before rendering) -- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  F.esc = esc;

  /* ---- localStorage helpers --------------------------------------------- */
  function lsGet(key, fallback) {
    try {
      var v = localStorage.getItem('flowscope:' + key);
      return v == null ? fallback : JSON.parse(v);
    } catch (e) { return fallback; }
  }
  function lsSet(key, val) {
    try { localStorage.setItem('flowscope:' + key, JSON.stringify(val)); return true; }
    catch (e) { return false; } // quota exceeded etc. — caller handles
  }
  F.lsGet = lsGet; F.lsSet = lsSet;

  /* ---- Theme ------------------------------------------------------------- */
  var THEME_KEY = 'flowscope:theme';
  function currentTheme() {
    try {
      var saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
    var btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = t === 'dark' ? '☀️' : '🌙';
    // Keep sample SVG art in sync if present (uses data-theme on <html>)
  }
  function toggleTheme() { applyTheme(currentTheme() === 'dark' ? 'light' : 'dark'); }
  F.toggleTheme = toggleTheme;

  // Apply as early as possible to avoid a flash.
  applyTheme(currentTheme());

  /* ---- Toasts ------------------------------------------------------------- */
  function toast(msg) {
    var box = document.getElementById('toasts');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toasts';
      document.body.appendChild(box);
    }
    var el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(function () {
      el.classList.add('out');
      setTimeout(function () { el.remove(); }, 350);
    }, 2400);
  }
  F.toast = toast;

  /* ---- Clipboard ---------------------------------------------------------- */
  function copyText(text, label) {
    function done() { toast((label || 'Copied') + ' to clipboard'); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
    } else { fallbackCopy(text); done(); }
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove();
  }
  F.copyText = copyText;

  /* ---- Modal -------------------------------------------------------------- */
  function openModal(html) {
    closeModal();
    var ov = document.createElement('div');
    ov.className = 'modal-overlay';
    ov.id = 'fs-modal';
    ov.innerHTML = '<div class="modal" role="dialog" aria-modal="true">' + html + '</div>';
    ov.addEventListener('click', function (e) { if (e.target === ov) closeModal(); });
    document.body.appendChild(ov);
    var first = ov.querySelector('input, textarea, button');
    if (first) first.focus();
    return ov;
  }
  function closeModal() {
    var m = document.getElementById('fs-modal');
    if (m) m.remove();
  }
  F.openModal = openModal; F.closeModal = closeModal;

  /* ---- Save to collection dialog ------------------------------------------ */
  var COLS_KEY = 'collections';
  function getCols() { return lsGet(COLS_KEY, []); }
  function saveToCollectionDialog(id, kind) {
    var cols = getCols();
    var list = cols.map(function (c, i) {
      return '<button class="btn btn-ghost btn-block" data-col="' + i + '" style="justify-content:flex-start">' +
        '🗂️ ' + esc(c.name) + ' <span class="muted">(' + (c.items || []).length + ')</span></button>';
    }).join('');
    var ov = openModal(
      '<h3 style="margin-bottom:12px">Save to collection</h3>' +
      (list || '<p class="muted" style="margin-bottom:12px">No collections yet — create one below.</p>') +
      '<div style="display:flex;gap:8px;margin-top:12px">' +
        '<input id="new-col-name" class="input" placeholder="New collection name" style="flex:1">' +
        '<button class="btn btn-primary" id="new-col-btn">Create</button>' +
      '</div>'
    );
    function addTo(idx) {
      var c = getCols()[idx];
      if (!c) return;
      c.items = c.items || [];
      var exists = c.items.some(function (i) { return i.kind === kind && String(i.id) === String(id); });
      if (!exists) c.items.push({ kind: kind, id: String(id), uid: 'u' + Date.now().toString(36), added: new Date().toISOString() });
      var all = getCols(); all[idx] = c; lsSet(COLS_KEY, all);
      closeModal();
      toast(exists ? 'Already in "' + c.name + '"' : 'Saved to "' + c.name + '"');
    }
    ov.querySelectorAll('[data-col]').forEach(function (b) {
      b.addEventListener('click', function () { addTo(parseInt(b.getAttribute('data-col'), 10)); });
    });
    function createNew() {
      var name = ov.querySelector('#new-col-name').value.trim() || 'Untitled collection';
      var all = getCols();
      all.push({ id: 'c' + Date.now(), name: name, items: [], created: new Date().toISOString() });
      lsSet(COLS_KEY, all);
      addTo(all.length - 1);
    }
    ov.querySelector('#new-col-btn').addEventListener('click', createNew);
    ov.querySelector('#new-col-name').addEventListener('keydown', function (e) { if (e.key === 'Enter') createNew(); });
  }
  F.saveToCollectionDialog = saveToCollectionDialog;

  /* ---- Compare tray ------------------------------------------------------- */
  var COMPARE_KEY = 'compare';
  var COMPARE_MAX = 4;

  function getTray() { return lsGet(COMPARE_KEY, []); }

  function trayHas(id) {
    return getTray().some(function (t) { return String(t) === String(id); });
  }

  /** Add a screen id to the tray. Returns 'added' | 'full' | 'dup'. */
  function trayAdd(id) {
    var tray = getTray();
    if (tray.some(function (t) { return String(t) === String(id); })) return 'dup';
    if (tray.length >= COMPARE_MAX) { toast('Compare tray is full (max ' + COMPARE_MAX + ')'); return 'full'; }
    tray.push(String(id));
    lsSet(COMPARE_KEY, tray);
    renderTray();
    toast('Added to compare tray (press C on compare page to view)');
    return 'added';
  }

  function trayRemove(id) {
    lsSet(COMPARE_KEY, getTray().filter(function (t) { return String(t) !== String(id); }));
    renderTray();
  }
  function trayClear() { lsSet(COMPARE_KEY, []); renderTray(); }

  /** Small floating tray rendered on every page (hidden on compare.html itself). */
  function renderTray() {
    var old = document.getElementById('compare-tray');
    if (old) old.remove();
    var tray = getTray();
    var page = document.body.getAttribute('data-page');
    if (!tray.length || page === 'compare') return;

    var bar = document.createElement('div');
    bar.className = 'compare-tray';
    bar.id = 'compare-tray';

    var thumbs = document.createElement('div');
    thumbs.className = 'thumbs';
    thumbs.innerHTML = tray.map(function (id) {
      var meta = trayMeta[id] || {};
      var src = meta.img ? esc(meta.img) : '';
      return '<img src="' + src + '" alt="" loading="lazy">';
    }).join('');

    var label = document.createElement('span');
    label.textContent = tray.length + ' selected';

    var go = document.createElement('a');
    go.href = 'compare.html';
    go.textContent = 'Compare →';

    var clear = document.createElement('button');
    clear.className = 'chip-btn';
    clear.textContent = '✕';
    clear.title = 'Clear tray';
    clear.setAttribute('aria-label', 'Clear compare tray');
    clear.addEventListener('click', trayClear);

    bar.appendChild(thumbs);
    bar.appendChild(label);
    bar.appendChild(go);
    bar.appendChild(clear);
    document.body.appendChild(bar);
    updateTrayBadge();
  }

  // Screen meta cache (id -> {img, title}) so tray thumbnails render everywhere.
  var trayMeta = lsGet('compare-meta', {});
  function cacheTrayMeta(screen) {
    if (!screen) return;
    trayMeta[String(screen.id)] = {
      img: (window.Flowscope.data ? window.Flowscope.data.assetUrl(screen.image) : screen.image),
      title: screen.title
    };
    lsSet('compare-meta', trayMeta);
  }
  F.cacheTrayMeta = cacheTrayMeta;

  function updateTrayBadge() {
    var badge = document.getElementById('tray-badge');
    var n = getTray().length;
    if (badge) {
      badge.textContent = n;
      badge.style.display = n ? 'grid' : 'none';
    }
  }

  F.compare = {
    get: getTray, has: trayHas, add: trayAdd,
    remove: trayRemove, clear: trayClear, render: renderTray, max: COMPARE_MAX
  };

  /* ---- Header / footer shell ---------------------------------------------- */
  var NAV = [
    { href: 'browse.html', label: 'Library', pages: ['browse'] },
    { href: 'browse.html?tab=flows', label: 'Flows', pages: ['flow'] },
    { href: 'browse.html?tab=apps', label: 'Apps', pages: ['app'] },
    { href: 'collections.html', label: 'Collections', pages: ['collections'] },
    { href: 'api.html', label: 'API', pages: ['api'] }
  ];

  function renderShell() {
    var page = document.body.getAttribute('data-page') || '';

    var header = document.createElement('header');
    header.className = 'site-header';
    var navLinks = NAV.map(function (n) {
      var active = n.pages.indexOf(page) !== -1 ? ' class="active"' : '';
      return '<a href="' + n.href + '"' + active + '>' + n.label + '</a>';
    }).join('');

    header.innerHTML =
      '<div class="header-inner">' +
        '<a class="logo" href="index.html" aria-label="Flowscope home">' +
          '<span class="logo-mark">◈</span> Flowscope' +
        '</a>' +
        '<nav class="main-nav" aria-label="Main">' + navLinks + '</nav>' +
        '<div class="header-actions">' +
          '<a class="search-pill" href="browse.html" id="header-search" title="Search the library">' +
            '<span aria-hidden="true">⌕</span><span class="sp-text">Search</span><kbd>/</kbd>' +
          '</a>' +
          '<button class="icon-btn" id="theme-toggle" title="Toggle dark/light mode" aria-label="Toggle theme">🌙</button>' +
          '<a class="icon-btn" href="compare.html" title="Compare tray" aria-label="Compare tray">▦<span class="badge" id="tray-badge" style="display:none">0</span></a>' +
          '<a class="icon-btn" href="collections.html" title="Collections" aria-label="Collections">♥</a>' +
        '</div>' +
      '</div>';
    document.body.insertBefore(header, document.body.firstChild);
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    applyTheme(currentTheme()); // sync icon after injection
    updateTrayBadge();

    var footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML =
      '<div class="footer-inner">' +
        '<p class="footer-free">100% free · No paywall · No account · Open API · MIT-licensed data (CC0)</p>' +
        '<p class="small muted">Flowscope is a free, open-source UI/UX pattern library. ' +
        'Screens belong to their respective app owners and are shown for design research.</p>' +
        '<div class="footer-hints" aria-label="Keyboard shortcuts">' +
          '<span><kbd>/</kbd> search</span>' +
          '<span><kbd>←</kbd><kbd>→</kbd> prev / next</span>' +
          '<span><kbd>c</kbd> add to compare</span>' +
          '<span><kbd>Esc</kbd> close</span>' +
          '<span><kbd>?</kbd> all shortcuts</span>' +
        '</div>' +
      '</div>';
    document.body.appendChild(footer);

    renderTray();
  }

  /* ---- Data-load error banner ---------------------------------------------- */
  function showDataError(errors) {
    var main = document.querySelector('main .container') || document.querySelector('main');
    if (!main) return;
    var box = document.createElement('div');
    box.className = 'state-box';
    box.innerHTML =
      '<div class="big">📦</div>' +
      '<h3>Library data is unavailable</h3>' +
      '<p>We couldn\'t load ' + esc(errors.map(function (e) { return e.file; }).join(', ')) +
      '. Check that the <code>data/</code> folder sits next to <code>site/</code> and that you\'re serving over HTTP (not <code>file://</code>).</p>';
    main.prepend(box);
  }
  F.showDataError = showDataError;

  /* ---- Skeletons ------------------------------------------------------------ */
  function skeletons(container, n, kind) {
    n = n || 8;
    var html = '';
    for (var i = 0; i < n; i++) {
      html += '<div class="skeleton" style="height:' + (kind === 'flow' ? '300px' : '340px') + '"></div>';
    }
    container.innerHTML = html;
  }
  F.skeletons = skeletons;

  /* ---- Keyboard shortcuts --------------------------------------------------- */
  function isTyping() {
    var el = document.activeElement;
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
  }

  function shortcutsModal() {
    openModal(
      '<h3>Keyboard shortcuts</h3>' +
      '<div class="meta-row"><span class="k"><kbd>/</kbd></span><span>Focus search</span></div>' +
      '<div class="meta-row"><span class="k"><kbd>←</kbd> <kbd>→</kbd></span><span>Previous / next screen or flow step</span></div>' +
      '<div class="meta-row"><span class="k"><kbd>c</kbd></span><span>Add current screen to compare tray</span></div>' +
      '<div class="meta-row"><span class="k"><kbd>Esc</kbd></span><span>Close dialog / leave compare view</span></div>' +
      '<div class="meta-row"><span class="k"><kbd>?</kbd></span><span>Open this cheat sheet</span></div>' +
      '<div class="btn-row" style="margin-top:16px"><button class="btn btn-ghost btn-sm" id="m-close">Close</button></div>'
    );
    document.getElementById('m-close').addEventListener('click', closeModal);
  }

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }
  F.getParam = getParam;

  document.addEventListener('keydown', function (e) {
    var page = document.body.getAttribute('data-page') || '';

    if (e.key === 'Escape') {
      if (document.getElementById('fs-modal')) { closeModal(); e.preventDefault(); return; }
      var sidebar = document.querySelector('.sidebar.open');
      if (sidebar) { sidebar.classList.remove('open'); return; }
      if (page === 'compare') { window.location.href = 'browse.html'; return; }
      return;
    }
    if (isTyping()) return;

    if (e.key === '/') {
      var s = document.querySelector('[data-global-search]') || document.getElementById('header-search');
      e.preventDefault();
      if (s) {
        if (s.tagName === 'INPUT') s.focus();
        else window.location.href = 'browse.html';
      }
      return;
    }
    if (e.key === '?') { shortcutsModal(); return; }

    if (e.key === 'c' || e.key === 'C') {
      // On screen.html, "c" adds the current screen to the compare tray.
      if (page === 'screen' && window.FlowscopeScreen && window.FlowscopeScreen.currentId) {
        trayAdd(window.FlowscopeScreen.currentId);
      }
      return;
    }
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !e.metaKey && !e.ctrlKey) {
      var dir = e.key === 'ArrowRight' ? 1 : -1;
      if (page === 'screen' && window.FlowscopeScreen && window.FlowscopeScreen.step) {
        window.FlowscopeScreen.step(dir);
        e.preventDefault();
      } else if (page === 'flow' && window.FlowscopeFlow && window.FlowscopeFlow.step) {
        window.FlowscopeFlow.step(dir);
        e.preventDefault();
      }
    }
  });

  /* ---- Boot ----------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    renderShell();
  });
})();
