#!/usr/bin/env node
/* Flowscope seed generator — slice B (Noted, Maison, Orbit, Bright, Vitalis)
 * Builds polished 390x844 mobile screenshots with a small component library.
 * Usage: node scripts/gen-screens-b.js [--only <id-substring>] [--samples]
 *   --samples : render 3 QA sample screens (noted home, maison product, orbit feed)
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'site/assets/screens');
const ICON_OUT = path.join(ROOT, 'site/assets/apps');
const DATA = path.join(ROOT, 'data');
const FONT_CSS = fs.readFileSync(path.join(ROOT, 'tmp/fonts/inter-font.css'), 'utf8');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(ICON_OUT, { recursive: true });
fs.mkdirSync(DATA, { recursive: true });

// ---------- deterministic PRNG (stable popularity values) ----------
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0)}
function popularity(id, lo, hi){ const r = mulberry32(hashStr(id))(); return Math.round(lo + r*(hi-lo)); }

// ---------- themes ----------
const THEMES = {
  noted:   { bg:'#FFFFFF', surface:'#F1F5F9', surface2:'#F8FAFC', card:'#FFFFFF', text:'#0F172A', muted:'#64748B', faint:'#94A3B8', primary:'#4F46E5', primarySoft:'#EEF2FF', primaryText:'#FFFFFF', accent:'#10B981', danger:'#EF4444', border:'rgba(15,23,42,.08)', shadow:'0 10px 28px rgba(79,70,229,.10)', radius:'14px', dark:false, font:'Inter' },
  maison:  { bg:'#FAFAF9', surface:'#FFFFFF', surface2:'#F5F5F4', card:'#FFFFFF', text:'#111111', muted:'#78716C', faint:'#A8A29E', primary:'#111111', primarySoft:'#F5F5F4', primaryText:'#FFFFFF', accent:'#D97706', danger:'#DC2626', border:'rgba(17,17,17,.10)', shadow:'0 10px 28px rgba(17,17,17,.08)', radius:'10px', dark:false, font:'Inter' },
  orbit:   { bg:'#FFFFFF', surface:'#F4F4F5', surface2:'#FAFAF9', card:'#FFFFFF', text:'#18181B', muted:'#71717A', faint:'#A1A1AA', primary:'#7C3AED', primary2:'#EC4899', primarySoft:'#F5F3FF', primaryText:'#FFFFFF', accent:'#EC4899', danger:'#E11D48', border:'rgba(24,24,27,.08)', shadow:'0 10px 28px rgba(124,58,237,.12)', radius:'16px', dark:false, font:'Inter', grad:'linear-gradient(135deg,#7C3AED,#EC4899)' },
  bright:  { bg:'#EFF6FF', surface:'#FFFFFF', surface2:'#DBEAFE', card:'#FFFFFF', text:'#0F172A', muted:'#64748B', faint:'#94A3B8', primary:'#2563EB', primarySoft:'#DBEAFE', primaryText:'#FFFFFF', accent:'#FACC15', accentText:'#713F12', danger:'#EF4444', border:'rgba(37,99,235,.12)', shadow:'0 10px 28px rgba(37,99,235,.12)', radius:'16px', dark:false, font:'Inter' },
  vitalis: { bg:'#FDFDFD', surface:'#F0FDFA', surface2:'#FFF7ED', card:'#FFFFFF', text:'#134E4A', muted:'#6B7280', faint:'#9CA3AF', primary:'#0D9488', primarySoft:'#CCFBF1', primaryText:'#FFFFFF', accent:'#FB7185', danger:'#E11D48', border:'rgba(13,148,136,.14)', shadow:'0 10px 28px rgba(13,148,136,.12)', radius:'18px', dark:false, font:'Inter' },
};

// ---------- base CSS ----------
function baseCSS(t){
return `
${FONT_CSS}
*{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
html,body{width:390px;height:844px;overflow:hidden}
body{font-family:'Inter',system-ui,-apple-system,sans-serif;background:${t.bg};color:${t.text};font-size:15px;line-height:1.45;letter-spacing:-0.01em}
.phone{width:390px;height:844px;background:${t.bg};color:${t.text};position:relative;overflow:hidden;display:flex;flex-direction:column}
.scroll{flex:1;overflow:hidden;position:relative}
.pad{padding:0 20px}
.row{display:flex;align-items:center}
.between{justify-content:space-between}
.grow{flex:1}
.wrap{flex-wrap:wrap}
.mt2{margin-top:2px}.mt4{margin-top:4px}.mt6{margin-top:6px}.mt8{margin-top:8px}.mt10{margin-top:10px}.mt12{margin-top:12px}.mt14{margin-top:14px}.mt16{margin-top:16px}.mt20{margin-top:20px}.mt24{margin-top:24px}.mt28{margin-top:28px}.mt32{margin-top:32px}
.mb4{margin-bottom:4px}.mb6{margin-bottom:6px}.mb8{margin-bottom:8px}.mb12{margin-bottom:12px}.mb16{margin-bottom:16px}.mb20{margin-bottom:20px}
.ml8{margin-left:8px}.mr8{margin-right:8px}
.gap4{gap:4px}.gap6{gap:6px}.gap8{gap:8px}.gap10{gap:10px}.gap12{gap:12px}.gap16{gap:16px}
.t11{font-size:11px}.t12{font-size:12px}.t13{font-size:13px}.t14{font-size:14px}.t15{font-size:15px}.t16{font-size:16px}.t17{font-size:17px}.t18{font-size:18px}.t20{font-size:20px}.t22{font-size:22px}.t24{font-size:24px}.t28{font-size:28px}.t32{font-size:32px}.t34{font-size:34px}.t40{font-size:40px}.t48{font-size:48px}
.w400{font-weight:400}.w500{font-weight:500}.w600{font-weight:600}.w700{font-weight:700}.w800{font-weight:800}
.muted{color:${t.muted}}.faint{color:${t.faint}}
.center{text-align:center}
.ellip{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rel{position:relative}.abs{position:absolute}
`;
}

// ---------- icon set (24x24 stroke icons, feather-style, hand-drawn) ----------
const P = {
  home:'M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z',
  search:'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  bell:'M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 0 0 4 0',
  user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-6 8-6s8 2 8 6',
  users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  sliders:'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  cal:'M5 6h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM4 10h16M8 3v4M16 3v4',
  chat:'M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1L3 20l1-5.3A8.5 8.5 0 1 1 21 11.5z',
  plus:'M12 5v14M5 12h14',
  heart:'M12 20.5s-7.5-4.6-9.3-9.2A5.2 5.2 0 0 1 12 6.4a5.2 5.2 0 0 1 9.3 4.9c-1.8 4.6-9.3 9.2-9.3 9.2z',
  star:'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.8-5.4 2.8 1-6.1L3.2 9.5l6.1-.9z',
  bag:'M5.5 8h13l-1 12.5a1.5 1.5 0 0 1-1.5 1.4H8a1.5 1.5 0 0 1-1.5-1.4zM9 10V6a3 3 0 0 1 6 0v4',
  cart:'M3 4h2l2.4 12.2a1.5 1.5 0 0 0 1.5 1.2h7.9a1.5 1.5 0 0 0 1.5-1.2L21 8H6M10 21a1.5 1.5 0 1 0 0-.01M18 21a1.5 1.5 0 1 0 0-.01',
  chevR:'M9 6l6 6-6 6',
  chevL:'M15 6l-6 6 6 6',
  chevD:'M6 9l6 6 6-6',
  back:'M19 12H5M12 19l-7-7 7-7',
  x:'M6 6l12 12M18 6L6 18',
  check:'M5 12l5 5 9-10',
  clock:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3.5 2',
  pin:'M12 21s-7-5.4-7-11a7 7 0 0 1 14 0c0 5.6-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  flame:'M12 22c4.1 0 7-2.9 7-6.9 0-2.6-1.4-4.7-3-6.5-.3 1.1-1 2.2-2 2.9.1-2.5-1-5.4-3.2-7.3C9 5.7 7.6 8.3 7.6 10.6c-1.2 1.1-1.9 2.7-1.9 4.5 0 4 2.2 6.9 6.3 6.9zM12 22c-1.7 0-3-1.3-3-3 0-1.2.7-2.3 1.7-3 1.4 1 3.5 2 3.5 3.5 0 1.4-1 2.5-2.2 2.5z',
  drop:'M12 3l6.5 6.8a8 8 0 1 1-13 0z',
  bookmark:'M7 3h10a1 1 0 0 1 1 1v17l-6-4.2L6 21V4a1 1 0 0 1 1-1z',
  share:'M14 5l7 7-7 7M21 12H9M9 12l3-3M9 12l3 3',
  dots:'M5 12h.01M12 12h.01M19 12h.01',
  filter:'M4 5h16l-6 7v6l-4 2v-8z',
  camera:'M4 8h3l2-2.5h6L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  image:'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM3 17l5-5 4 4 3-3 6 6',
  send:'M22 2L11 13M22 2l-7 20-4-9-9-4z',
  edit:'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  card:'M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM2 10h20M6 15h4',
  lock:'M6 11V8a6 6 0 0 1 12 0v3M5 11h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z',
  eye:'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  info:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01',
  alert:'M12 3l10 17H2zM12 10v4M12 17.5h.01',
  trophy:'M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0zM7 6H4a2 2 0 0 0 2 4h1M17 6h3a2 2 0 0 1-2 4h-1',
  zap:'M13 2L4 14h6l-1 8 9-12h-6z',
  trend:'M3 17l6-6 4 4 8-8M15 7h6v6',
  book:'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5',
  briefcase:'M4 8h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM9 8V6a3 3 0 0 1 6 0v2',
  sun:'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon:'M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z',
  minus:'M5 12h14',
  grid:'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  compass:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5z',
  music:'M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM9 18V4l12-2v13M9 7l12-2',
  mic:'M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v1a7 7 0 0 1-14 0v-1M12 18v4M9 22h6',
  smile:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8.5 14.5a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01',
  gift:'M4 11h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM3 7h18v4H3zM12 7v14M12 7S12 3 8.5 3A2.5 2.5 0 0 0 8.5 8M12 7s0-4 3.5-4a2.5 2.5 0 0 1 0 5',
  tag:'M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9zM7.5 7.5h.01',
  truck:'M2 6h12v10H2zM14 10h4l4 4v2h-8M6.5 19a1.8 1.8 0 1 0 0-.01M17.5 19a1.8 1.8 0 1 0 0-.01',
  map:'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
  layers:'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
  globe:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.6 3.9 5.7 3.9 9S14.5 18.4 12 21c-2.5-2.6-3.9-5.7-3.9-9S9.5 5.6 12 3z',
  coffee:'M17 9h1a3 3 0 0 1 0 6h-1M3 9h14v6a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5zM7 2v2M11 2v2M15 2v2',
  award:'M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM8.5 13.5L7 21l5-2.5L17 21l-1.5-7.5',
  target:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  activity:'M3 12h4l3 8 4-16 3 8h4',
  logout:'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  help:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 0 1 4.9.7c0 1.6-2.4 2.1-2.4 3.8M12 17.5h.01',
  download:'M12 3v12M7 10l5 5 5-5M4 21h16',
  refresh:'M20 11A8 8 0 0 0 5.6 6.6L4 8M4 4v4h4M4 13a8 8 0 0 0 14.4 4.4L20 16M20 20v-4h-4',
  video:'M15 10l6-3v10l-6-3M3 7h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z',
  crown:'M3 7l4 3.5L12 5l5 5.5L21 7l-1.6 11a1 1 0 0 1-1 .9H5.6a1 1 0 0 1-1-.9z',
  sparkles:'M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6zM18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z',
  timer:'M9 2h6M12 8v5l3.5 2M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
  dumbbell:'M7 8v8M17 8v8M4 10v4M20 10v4M7 12h10',
  watch:'M12 9v4l2.5 2.5M12 21a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM9 2.5h6M9 21.5h6',
  graduation:'M2 9l10-5 10 5-10 5zM6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9v5',
  shield:'M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5zM9 12l2 2 4-4',
  wallet:'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 9h18M16.5 14.5h.01',
  wifiS:'M2.5 9a15 15 0 0 1 19 0M5.5 12.5a10 10 0 0 1 13 0M8.6 16a5 5 0 0 1 6.8 0M12 19.5h.01',
};
function ic(name, s=24, c='currentColor', sw=1.8){
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex:none"><path d="${P[name]||''}"/></svg>`;
}
function icf(name, s=24, c='currentColor'){ // filled (dots, stars)
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${c}" style="display:block;flex:none"><path d="${P[name]||''}"/></svg>`;
}
// status-bar glyphs
function sbSignal(c){ return `<svg width="18" height="12" viewBox="0 0 18 12" fill="${c}"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0.5" width="3" height="11.5" rx="1"/></svg>`; }
function sbWifi(c){ return `<svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round"><path d="M1.5 4.5a10 10 0 0 1 13 0M4 7.2a6.4 6.4 0 0 1 8 0M6.6 9.8a2.8 2.8 0 0 1 2.8 0"/><circle cx="8" cy="11" r="1" fill="${c}" stroke="none"/></svg>`; }
function sbBattery(c){ return `<svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="${c}" opacity=".5"/><rect x="2.5" y="2.5" width="14" height="7" rx="2" fill="${c}"/><path d="M23.5 4v4a2.2 2.2 0 0 0 0-4z" fill="${c}" opacity=".5"/></svg>`; }

// ---------- shell: status bar / navbars / tab bars ----------
function shellCSS(t){
return `
/* status bar */
.sb{position:relative;display:flex;align-items:center;justify-content:space-between;padding:16px 30px 4px;z-index:5;flex:none}
.sb .time{font-size:15px;font-weight:600;letter-spacing:-.02em}
.sb .sicons{display:flex;align-items:center;gap:6px}
.sb-android{padding:12px 18px 6px}
.sb-android .time{font-size:14px;font-weight:500}
.notch{position:absolute;top:11px;left:50%;transform:translateX(-50%);width:118px;height:30px;background:#000;border-radius:17px}
.camdot{position:absolute;top:20px;left:50%;transform:translateX(-50%);width:12px;height:12px;border-radius:50%;background:#000;box-shadow:inset 0 0 3px 1px #1e293b}
.homebar{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:134px;height:5px;border-radius:3px;background:rgba(0,0,0,.32);z-index:60}
.homebar.light{background:rgba(255,255,255,.85)}
.gesturebar{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:108px;height:4px;border-radius:2px;background:rgba(0,0,0,.3);z-index:60}
/* iOS large-title navbar */
.nav{flex:none;padding:6px 20px 0}
.nav-top{display:flex;align-items:center;justify-content:space-between;min-height:34px}
.nav-back{display:flex;align-items:center;gap:2px;color:${t.primary};font-size:17px}
.nav-actions{display:flex;align-items:center;gap:18px}
.nav-large{font-size:34px;font-weight:700;letter-spacing:-.02em;margin:8px 0 10px}
.nav-sub{font-size:15px;color:${t.muted};margin:-6px 0 12px}
/* android top app bar */
.abar{flex:none;display:flex;align-items:center;gap:14px;padding:14px 16px 12px;min-height:64px}
.abar .ttl{font-size:20px;font-weight:600;letter-spacing:-.01em}
.abar .acts{margin-left:auto;display:flex;align-items:center;gap:20px}
/* iOS tab bar */
.tabbar{flex:none;display:flex;border-top:1px solid ${t.border};background:${t.dark?'rgba(20,20,24,.92)':'rgba(255,255,255,.94)'};padding:10px 6px 26px;position:relative;z-index:5}
.tab{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:10px;font-weight:500;color:${t.faint}}
.tab.on{color:${t.primary}}
/* android bottom nav */
.bnav{flex:none;display:flex;background:${t.card};padding:10px 8px 22px;position:relative;z-index:5;border-top:1px solid ${t.border}}
.bitem{flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;font-size:11px;font-weight:500;color:${t.muted}}
.bitem .pill{padding:5px 18px;border-radius:20px;display:flex}
.bitem.on{color:${t.text}}
.bitem.on .pill{background:${t.primarySoft}}
`;
}
function statusBar(platform, t, opts={}){
  const dark = !!opts.dark;
  const c = dark ? '#fff' : (t.dark ? '#fff' : '#000');
  const time = opts.time || '9:41';
  const glyphs = `<div class="sicons">${sbSignal(c)}${sbWifi(c)}${sbBattery(c)}</div>`;
  if(platform==='Android'){
    return `<div class="sb sb-android"><div class="camdot"></div><span class="time" style="color:${c}">${time}</span>${glyphs}</div>`;
  }
  return `<div class="sb"><span class="time" style="color:${c}">${time}</span><div class="notch"></div>${glyphs}</div>`;
}
function navIOS(t, o={}){
  const back = o.back ? `<div class="nav-back">${ic('back',22,t.primary,2)}<span>${o.backLabel||'Back'}</span></div>` : '<div style="width:60px"></div>';
  const acts = (o.actions||[]).map(a=>`<span style="color:${a.color||t.text}">${ic(a.icon,22,'currentColor',1.8)}</span>`).join('');
  return `<div class="nav">${o.large===false?'':`<div class="nav-top">${back}<div class="nav-actions">${acts}</div></div>`}`
    + (o.title?`<div class="nav-large">${o.title}</div>`:'')
    + (o.sub?`<div class="nav-sub">${o.sub}</div>`:'') + `</div>`;
}
function appBarAndroid(t, o={}){
  const nav = o.back===false ? '' : `<span style="color:${t.text}">${ic(o.backIcon||'back',24,'currentColor',2)}</span>`;
  const acts = (o.actions||[]).map(a=>`<span style="color:${a.color||t.text}">${ic(a.icon,24,'currentColor',1.9)}</span>`).join('');
  return `<div class="abar">${nav}<div class="ttl">${o.title||''}</div><div class="acts">${acts}</div></div>`;
}
function tabBar(t, items, active){
  const tabs = items.map(it=>`<div class="tab${it.id===active?' on':''}">${ic(it.icon,25,'currentColor',it.id===active?2:1.7)}<span>${it.label}</span></div>`).join('');
  return `<div class="tabbar">${tabs}</div><div class="homebar"></div>`;
}
function bottomNav(t, items, active){
  const tabs = items.map(it=>`<div class="bitem${it.id===active?' on':''}"><span class="pill">${ic(it.icon,24,'currentColor',it.id===active?2:1.7)}</span><span>${it.label}</span></div>`).join('');
  return `<div class="bnav">${tabs}</div><div class="gesturebar"></div>`;
}

// ---------- component library ----------
function compCSS(t){
const gradBtn = t.grad ? `background:${t.grad}` : `background:${t.primary}`;
return `
/* buttons */
.btn{display:flex;align-items:center;justify-content:center;gap:8px;min-height:52px;border-radius:${t.radius};${gradBtn};color:${t.primaryText};font-size:17px;font-weight:600;letter-spacing:-.01em}
.btn.ghost{background:${t.primarySoft};color:${t.primary}}
.btn.plain{background:transparent;color:${t.primary}}
.btn.dark{background:#111;color:#fff}
.btn.light{background:#fff;color:${t.text};border:1px solid ${t.border}}
.btn.sm{min-height:38px;font-size:14px;padding:0 18px;border-radius:10px;display:inline-flex;width:auto}
.btnrow{display:flex;gap:12px}
/* card */
.card{background:${t.card};border-radius:${t.radius};box-shadow:${t.shadow};border:1px solid ${t.border}}
.card-p{padding:16px}
/* section head */
.sec{display:flex;align-items:center;justify-content:space-between;margin:22px 0 12px}
.sec h3{font-size:18px;font-weight:700;letter-spacing:-.01em}
.sec a{font-size:14px;font-weight:500;color:${t.primary}}
/* list item */
.li{display:flex;align-items:center;gap:12px;padding:13px 16px;background:${t.card}}
.li + .li{border-top:1px solid ${t.border}}
.li .tt{font-size:16px;font-weight:600;letter-spacing:-.01em}
.li .st{font-size:13px;color:${t.muted};margin-top:1px}
.li .chev{margin-left:auto;color:${t.faint}}
.li-group{background:${t.card};border-radius:${t.radius};overflow:hidden;border:1px solid ${t.border}}
/* search bar */
.sbar{display:flex;align-items:center;gap:10px;background:${t.surface};border-radius:12px;padding:11px 14px;color:${t.muted};font-size:16px}
.sbar.solid{background:${t.card};border:1px solid ${t.border};box-shadow:${t.shadow}}
/* chips */
.chips{display:flex;gap:8px;overflow:hidden;padding:2px 0}
.chip{flex:none;padding:8px 14px;border-radius:20px;background:${t.surface};font-size:14px;font-weight:500;color:${t.text};border:1px solid transparent}
.chip.on{background:${t.dark?'#fff':'#111'};color:${t.dark?'#111':'#fff'};font-weight:600}
.chip.brand.on,.chip.on.brand{background:${t.primary};color:${t.primaryText}}
/* toggle */
.tgl{width:51px;height:31px;border-radius:16px;background:#E2E8F0;position:relative;flex:none;transition:background .2s}
.tgl.on{background:${t.primary}}
.tgl::after{content:'';position:absolute;top:2px;left:2px;width:27px;height:27px;border-radius:50%;background:#fff;box-shadow:0 2px 5px rgba(0,0,0,.2)}
.tgl.on::after{left:22px}
/* slider */
.sld{position:relative;height:28px;flex:1}
.sld .track{position:absolute;top:12px;left:0;right:0;height:4px;border-radius:2px;background:${t.surface2==='#F8FAFC'?'#E2E8F0':t.border}}
.sld .fill{position:absolute;top:12px;left:0;height:4px;border-radius:2px;background:${t.primary}}
.sld .knob{position:absolute;top:4px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.25);border:.5px solid rgba(0,0,0,.06)}
/* progress bar */
.pbar{height:8px;border-radius:4px;background:${t.surface};overflow:hidden}
.pbar > div{height:100%;border-radius:4px;background:${t.primary}}
.pbar.grad > div{background:${t.grad||t.primary}}
/* segmented */
.seg{display:flex;background:${t.surface};border-radius:12px;padding:3px;gap:2px}
.seg div{flex:1;text-align:center;padding:8px 0;font-size:14px;font-weight:500;color:${t.muted};border-radius:9px}
.seg div.on{background:${t.card};color:${t.text};font-weight:600;box-shadow:0 2px 6px rgba(0,0,0,.08)}
/* bottom sheet + modal */
.scrim{position:absolute;inset:0;background:rgba(10,12,20,.45);z-index:40}
.sheet{position:absolute;left:0;right:0;bottom:0;background:${t.card};border-radius:24px 24px 0 0;z-index:41;padding:10px 20px 34px;box-shadow:0 -12px 40px rgba(0,0,0,.18)}
.grab{width:40px;height:5px;border-radius:3px;background:${t.faint};opacity:.5;margin:0 auto 14px}
.modal-wrap{position:absolute;inset:0;z-index:41;display:flex;align-items:center;justify-content:center;padding:36px}
.modal{background:${t.card};border-radius:20px;padding:24px;width:100%;box-shadow:0 24px 60px rgba(0,0,0,.25);text-align:center}
/* badge + dot */
.badge{min-width:20px;height:20px;padding:0 6px;border-radius:10px;background:${t.danger};color:#fff;font-size:12px;font-weight:700;display:inline-flex;align-items:center;justify-content:center}
.dot{width:9px;height:9px;border-radius:50%;background:${t.primary};flex:none}
/* avatar */
.av{border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;flex:none;letter-spacing:.02em}
.avstack{display:flex}
.avstack .av{margin-left:-10px;border:2.5px solid ${t.card}}
.avstack .av:first-child{margin-left:0}
/* charts */
.bars{display:flex;align-items:flex-end;gap:7px;height:120px}
.bars .b{flex:1;border-radius:5px 5px 3px 3px;min-height:6px}
.ringwrap{position:relative;width:120px;height:120px}
.ringwrap .rc{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
/* skeleton */
.skel{border-radius:8px;background:linear-gradient(100deg,${t.surface} 40%,${t.card} 50%,${t.surface} 60%);background-size:200% 100%;animation:sh 1.6s infinite linear}
@keyframes sh{to{background-position:-200% 0}}
/* toast */
.toast{position:absolute;left:20px;right:20px;bottom:110px;z-index:50;background:#1C1917;color:#fff;border-radius:14px;padding:14px 16px;display:flex;align-items:center;gap:12px;box-shadow:0 12px 32px rgba(0,0,0,.3)}
/* banner */
.banner{display:flex;gap:12px;align-items:center;border-radius:${t.radius};padding:14px 16px;background:${t.primarySoft};border:1px solid ${t.border}}
/* empty state */
.empty{display:flex;flex-direction:column;align-items:center;text-align:center;padding:36px 32px}
/* stars */
.stars{display:flex;gap:3px}
/* stepper */
.stepper{display:flex;align-items:center;gap:14px}
.stepper .stbtn{width:34px;height:34px;border-radius:50%;background:${t.surface};display:flex;align-items:center;justify-content:center;color:${t.text};border:1px solid ${t.border}}
.stepper .val{font-size:20px;font-weight:700;min-width:34px;text-align:center}
/* text field */
.field{background:${t.surface};border-radius:12px;padding:0 16px;min-height:54px;display:flex;align-items:center;gap:10px;border:1.5px solid transparent}
.field.focus{border-color:${t.primary};background:${t.card}}
.field .ph{color:${t.faint};font-size:16px}
.field .vl{font-size:16px}
.flabel{font-size:13px;font-weight:600;color:${t.muted};margin:0 0 6px 2px}
/* checkbox / radio */
.chk{width:24px;height:24px;border-radius:8px;border:2px solid ${t.faint};flex:none;display:flex;align-items:center;justify-content:center;color:#fff}
.chk.on{background:${t.primary};border-color:${t.primary}}
.chk.round{border-radius:50%}
.rad{width:24px;height:24px;border-radius:50%;border:2px solid ${t.faint};flex:none;position:relative}
.rad.on{border-color:${t.primary}}
.rad.on::after{content:'';position:absolute;inset:4px;border-radius:50%;background:${t.primary}}
/* carousel */
.car{display:flex;gap:12px;overflow:hidden;padding:4px 20px 8px;margin:0 -20px}
/* fab */
.fab{position:absolute;right:20px;bottom:112px;width:58px;height:58px;border-radius:29px;${t.grad?`background:${t.grad}`:`background:${t.primary}`};color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 24px rgba(0,0,0,.28);z-index:20}
/* accordion */
.acc{border-bottom:1px solid ${t.border};padding:15px 2px}
.acc .ah{display:flex;align-items:center;justify-content:space-between;font-size:15px;font-weight:600}
/* date picker strip */
.dpstrip{display:flex;gap:8px;overflow:hidden}
.dpday{flex:1;min-width:52px;border-radius:14px;background:${t.surface};padding:10px 0;text-align:center;border:1.5px solid transparent}
.dpday.on{background:${t.primary};color:${t.primaryText}}
.dpday .dw{font-size:11px;font-weight:600;opacity:.7}
.dpday .dn{font-size:17px;font-weight:700;margin-top:2px}
/* calendar grid */
.cal{background:${t.card};border-radius:${t.radius};padding:16px;border:1px solid ${t.border}}
.cal .cdow{display:grid;grid-template-columns:repeat(7,1fr);text-align:center;font-size:11px;font-weight:700;color:${t.faint};margin-bottom:8px}
.cal .cgrid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}
.cal .cd{aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:500;border-radius:50%;position:relative;flex-direction:column}
.cal .cd.dim{color:${t.faint};opacity:.45}
.cal .cd.sel{background:${t.primary};color:${t.primaryText};font-weight:700}
.cal .cd .evd{position:absolute;bottom:4px;width:4px;height:4px;border-radius:2px;background:${t.accent}}
.cal .cd.sel .evd{background:#fff}
/* dropdown */
.dd{display:flex;align-items:center;justify-content:space-between;background:${t.surface};border-radius:12px;padding:14px 16px;font-size:15px;font-weight:500;border:1px solid ${t.border}}
/* tag / pill */
.tag{display:inline-flex;align-items:center;padding:5px 11px;border-radius:8px;font-size:12px;font-weight:700;background:${t.primarySoft};color:${t.primary}}
.tag.amber{background:#FEF3C7;color:#B45309}
.tag.green{background:#D1FAE5;color:#047857}
.tag.rose{background:#FFE4E6;color:#BE123C}
/* misc */
.hr{height:1px;background:${t.border};margin:14px 0}
.kv{display:flex;justify-content:space-between;align-items:center;padding:11px 0;font-size:15px}
.kv + .kv{border-top:1px solid ${t.border}}
.stat3{display:flex;background:${t.card};border-radius:${t.radius};border:1px solid ${t.border};overflow:hidden}
.stat3 > div{flex:1;padding:14px 6px;text-align:center}
.stat3 > div + div{border-left:1px solid ${t.border}}
.hero-illu{border-radius:20px;overflow:hidden;position:relative}
`;
}
// ----- component functions -----
function btn(label, style='', icon=null, sub=''){
  const icn = icon?ic(icon,20,'currentColor',2):'';
  return `<div class="btn ${style}">${icn}<span>${label}${sub?`<div class="t12 w400" style="opacity:.75">${sub}</div>`:''}</span></div>`;
}
function secHead(title, link=''){
  return `<div class="sec"><h3>${title}</h3>${link?`<a>${link}</a>`:''}</div>`;
}
function listItem(t, o){
  const av = o.avatar ? `<div class="av" style="width:46px;height:46px;font-size:16px;background:${o.avatar.bg}">${o.avatar.init}</div>`
    : o.thumb ? `<div style="width:46px;height:46px;border-radius:12px;background:${o.thumb};flex:none"></div>`
    : o.icon ? `<div style="width:46px;height:46px;border-radius:14px;background:${o.iconBg||t.primarySoft};display:flex;align-items:center;justify-content:center;color:${o.iconColor||t.primary};flex:none">${ic(o.icon,22,'currentColor',1.9)}</div>` : '';
  const end = o.badge ? `<span class="badge">${o.badge}</span>`
    : o.toggle!==undefined ? `<div class="tgl${o.toggle?' on':''}"></div>`
    : o.value ? `<span class="t15 muted mr8">${o.value}</span><span class="chev">${ic('chevR',20,'currentColor',2)}</span>`
    : o.chev===false ? '' : `<span class="chev">${ic('chevR',20,'currentColor',2)}</span>`;
  const dot = o.dot ? `<span class="dot" style="margin-right:2px"></span>` : '';
  return `<div class="li">${av}<div class="grow"><div class="row gap6">${dot}<div class="tt ellip">${o.title}</div></div>${o.sub?`<div class="st ellip">${o.sub}</div>`:''}</div>${end}</div>`;
}
function avatar(init, bg, size=46, fs=16){
  return `<div class="av" style="width:${size}px;height:${size}px;font-size:${fs}px;background:${bg}">${init}</div>`;
}
function searchBar(t, ph, opts={}){
  return `<div class="sbar${opts.solid?' solid':''}">${ic('search',20,'currentColor',2)}<span class="${opts.value?'':'ph'}" style="${opts.value?'':'color:'+t.faint}">${opts.value||ph}</span>${opts.filter?`<span style="margin-left:auto;color:${t.text}">${ic('sliders',20,'currentColor',1.9)}</span>`:''}</div>`;
}
function chips(t, items, activeIdx=0, brand=false){
  return `<div class="chips">${items.map((c,i)=>`<div class="chip${i===activeIdx?' on':''}${brand?' brand':''}">${c}</div>`).join('')}</div>`;
}
function toggleRow(t, icon, title, sub, on){
  return `<div class="li"><div style="width:40px;height:40px;border-radius:12px;background:${t.primarySoft};display:flex;align-items:center;justify-content:center;color:${t.primary};flex:none">${ic(icon,20,'currentColor',1.9)}</div><div class="grow"><div class="tt">${title}</div>${sub?`<div class="st">${sub}</div>`:''}</div><div class="tgl${on?' on':''}"></div></div>`;
}
function progressBar(pct, grad=false){
  return `<div class="pbar${grad?' grad':''}"><div style="width:${pct}%"></div></div>`;
}
function ringChart(t, pct, size=120, sw=11, label='', sub=''){
  const r=(size-sw)/2, c=2*Math.PI*r, off=c*(1-pct/100);
  return `<div class="ringwrap" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${t.surface}" stroke-width="${sw}"/><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${t.grad?'url(#rg)':t.primary}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 ${size/2} ${size/2})"/>${t.grad?`<defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.primary}"/><stop offset="1" stop-color="${t.primary2}"/></linearGradient></defs>`:''}</svg><div class="rc"><div class="t22 w800">${label}</div>${sub?`<div class="t11 muted">${sub}</div>`:''}</div></div>`;
}
function barChart(t, vals, opts={}){
  const max = Math.max(...vals.map(v=>v.v));
  const bars = vals.map(v=>`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px"><div class="b" style="width:100%;height:${Math.max(8,Math.round(v.v/max*(opts.h||110)))}px;background:${v.c||t.primary};${v.soft?`opacity:.35`:''}"></div><div class="t11 faint">${v.l}</div></div>`).join('');
  return `<div style="display:flex;align-items:flex-end;gap:8px">${bars}</div>`;
}
function lineChart(t, pts, w=350, h=110){
  const max=Math.max(...pts), min=Math.min(...pts), rg=(max-min)||1;
  const step=w/(pts.length-1);
  const d=pts.map((p,i)=>`${i?'L':'M'}${(i*step).toFixed(1)},${(h-8-((p-min)/rg)*(h-28)).toFixed(1)}`).join(' ');
  const area=d+` L${w},${h} L0,${h} Z`;
  const gid='lg'+Math.round(Math.random()*1e6);
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.primary}" stop-opacity=".28"/><stop offset="1" stop-color="${t.primary}" stop-opacity="0"/></linearGradient></defs><path d="${area}" fill="url(#${gid})"/><path d="${d}" fill="none" stroke="${t.primary}" stroke-width="2.5" stroke-linecap="round"/></svg>`;
}
function stars(n, size=16, color='#F59E0B'){
  let s=''; for(let i=0;i<5;i++) s+=icf('star',size,i<n?color:'#E2E8F0');
  return `<div class="stars">${s}</div>`;
}
function toast(msg, icon='check', t){
  return `<div class="toast"><span style="color:#4ADE80">${ic(icon,22,'currentColor',2.2)}</span><span class="t15 w500">${msg}</span></div>`;
}
function banner(t, icon, title, sub, cta=''){
  return `<div class="banner"><span style="color:${t.primary}">${ic(icon,24,'currentColor',1.9)}</span><div class="grow"><div class="t15 w700">${title}</div>${sub?`<div class="t13 muted">${sub}</div>`:''}</div>${cta?`<span class="t14 w700" style="color:${t.primary}">${cta}</span>`:''}</div>`;
}
function textField(t, o={}){
  const left = o.icon?ic(o.icon,20,t.faint,1.9):'';
  const right = o.right?`<span style="color:${t.faint}">${ic(o.right,20,'currentColor',1.9)}</span>`:'';
  return `${o.label?`<div class="flabel">${o.label}</div>`:''}<div class="field${o.focus?' focus':''}">${left}${o.value?`<span class="vl">${o.value}</span>`:`<span class="ph">${o.ph||''}</span>`}${right}</div>`;
}
function stepper(t, val, label=''){
  return `<div class="stepper"><div class="stbtn">${ic('minus',18,'currentColor',2.2)}</div><div class="val">${val}</div><div class="stbtn" style="background:${t.primary};color:#fff">${ic('plus',18,'currentColor',2.2)}</div>${label?`<span class="t15 w600 ml8">${label}</span>`:''}</div>`;
}
function slider(t, pct){
  return `<div class="sld"><div class="track"></div><div class="fill" style="width:${pct}%"></div><div class="knob" style="left:calc(${pct}% - 10px)"></div></div>`;
}
function segmented(items, active=0){
  return `<div class="seg">${items.map((s,i)=>`<div class="${i===active?'on':''}">${s}</div>`).join('')}</div>`;
}
function dropdown(t, label, value){
  return `${label?`<div class="flabel">${label}</div>`:''}<div class="dd"><span>${value}</span>${ic('chevD',20,t.faint,2)}</div>`;
}
function dpStrip(t, days, active=2){
  return `<div class="dpstrip">${days.map((d,i)=>`<div class="dpday${i===active?' on':''}"><div class="dw">${d[0]}</div><div class="dn">${d[1]}</div></div>`).join('')}</div>`;
}
function calGrid(t, o){
  // o: {month, year, lead, days, sel, events:[dayNums]}
  let cells='';
  for(let i=0;i<o.lead;i++) cells+=`<div class="cd dim">${o.prevStart+i}</div>`;
  for(let d=1;d<=o.days;d++){
    const ev=o.events&&o.events.includes(d)?'<span class="evd"></span>':'';
    cells+=`<div class="cd${d===o.sel?' sel':''}">${d}${ev}</div>`;
  }
  const dows=['S','M','T','W','T','F','S'];
  return `<div class="cal"><div class="row between mb12"><span class="t17 w700">${o.month} ${o.year}</span><span class="row gap16" style="color:${t.muted}">${ic('chevL',20,'currentColor',2)}${ic('chevR',20,'currentColor',2)}</span></div><div class="cdow">${dows.map(d=>`<span>${d}</span>`).join('')}</div><div class="cgrid">${cells}</div></div>`;
}
function skeletonRows(t, n=3){
  let s='';
  for(let i=0;i<n;i++) s+=`<div class="row gap12 mb12"><div class="skel" style="width:48px;height:48px;border-radius:50%"></div><div class="grow"><div class="skel" style="height:14px;width:70%;margin-bottom:8px"></div><div class="skel" style="height:12px;width:45%"></div></div></div>`;
  return s;
}
function bottomSheet(t, inner, opts={}){
  return `<div class="scrim"></div><div class="sheet" ${opts.tall?'style="top:120px;display:flex;flex-direction:column"':''}><div class="grab"></div>${inner}</div>`;
}
function modalBox(t, inner){
  return `<div class="scrim"></div><div class="modal-wrap"><div class="modal">${inner}</div></div>`;
}
function emptyState(t, art, title, sub, cta){
  return `<div class="empty"><div class="mb20">${art}</div><div class="t20 w700 mb8">${title}</div><div class="t15 muted mb20" style="max-width:260px">${sub}</div>${cta||''}</div>`;
}
function fab(t, icon='plus'){
  return `<div class="fab">${ic(icon,26,'#fff',2.2)}</div>`;
}
function avatarGrad(init, size=46, fs=16, g='linear-gradient(135deg,#7C3AED,#EC4899)'){
  return `<div class="av" style="width:${size}px;height:${size}px;font-size:${fs}px;background:${g}">${init}</div>`;
}

// ---------- render pipeline ----------
let browser = null, page = null, pageErrors = [];
async function ensureBrowser(){
  if(browser) return;
  browser = await puppeteer.launch({ headless: true, args:['--no-sandbox','--disable-dev-shm-usage'] });
  page = await browser.newPage();
  page.on('pageerror', e => pageErrors.push(String(e.message||e).slice(0,200)));
  page.on('console', m => { if(m.type()==='error') pageErrors.push('console: '+m.text().slice(0,200)); });
}
function pageHTML(t, body){
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=390">`
    + `<style>${baseCSS(t)}${shellCSS(t)}${compCSS(t)}</style></head>`
    + `<body><div class="phone">${body}</div></body></html>`;
}
async function renderScreen(def){
  const t = THEMES[def.app];
  await ensureBrowser();
  pageErrors = [];
  const { body } = def.build(t);
  await page.setViewport({ width:390, height:844, deviceScaleFactor:2 });
  await page.setContent(pageHTML(t, body), { waitUntil:'domcontentloaded' });
  await page.evaluate(() => Promise.race([
    (document.fonts ? document.fonts.ready : Promise.resolve()),
    new Promise(r=>setTimeout(r,1500)),
  ])).catch(()=>{});
  await new Promise(r=>setTimeout(r,150));
  const text = await page.evaluate(() => {
    const clone = document.querySelector('.phone').cloneNode(true);
    clone.querySelectorAll('.sb,.homebar,.gesturebar,.notch,.camdot').forEach(e=>e.remove());
    const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
    const parts = [];
    while(walker.nextNode()){
      const t = walker.currentNode.nodeValue.replace(/\s+/g,' ').trim();
      if(t) parts.push(t);
    }
    return parts.join(' ');
  });
  const out = path.join(OUT, def.id + '.png');
  await page.screenshot({ path: out });
  if(pageErrors.length) console.error(`  !! ${def.id} page errors:`, pageErrors.join(' | '));
  return { text };
}
// ---------- app icons ----------
const ICON_GRAD = {
  noted:'linear-gradient(135deg,#4F46E5,#818CF8)',
  maison:'linear-gradient(135deg,#111111,#57534E)',
  orbit:'linear-gradient(135deg,#7C3AED,#EC4899)',
  bright:'linear-gradient(135deg,#2563EB,#60A5FA)',
  vitalis:'linear-gradient(135deg,#0D9488,#5EEAD4)',
};
const ICON_LETTER = { noted:'N', maison:'M', orbit:'O', bright:'B', vitalis:'V' };
async function renderIcon(app){
  await ensureBrowser();
  await page.setViewport({ width:256, height:256, deviceScaleFactor:2 });
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT_CSS}*{margin:0;box-sizing:border-box}body{font-family:Inter,system-ui}</style></head>`
    + `<body><div style="width:256px;height:256px;border-radius:58px;background:${ICON_GRAD[app]};display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 6px rgba(255,255,255,.35), inset 0 -8px 18px rgba(0,0,0,.18)">`
    + `<span style="font-size:128px;font-weight:800;color:#fff;letter-spacing:-.04em">${ICON_LETTER[app]}</span></div></body></html>`;
  await page.setContent(html, { waitUntil:'domcontentloaded' });
  await page.evaluate(() => Promise.race([
    (document.fonts ? document.fonts.ready : Promise.resolve()),
    new Promise(r=>setTimeout(r,1500)),
  ])).catch(()=>{});
  await page.screenshot({ path: path.join(ICON_OUT, app + '.png') });
}

// ================= SAMPLE BUILDERS (QA first) =================
function bNotedHome(t){
  const task = (done, title, meta, tag, tagCls) => `
    <div class="li">
      <div class="chk${done?' on':''}">${done?ic('check',15,'#fff',3):''}</div>
      <div class="grow">
        <div class="t16 w600" style="${done?`text-decoration:line-through;color:${t.faint}`:''}">${title}</div>
        <div class="t13 muted mt2">${meta}</div>
      </div>
      ${tag?`<span class="tag ${tagCls||''}">${tag}</span>`:''}
    </div>`;
  const body = `
  ${statusBar('iOS', t)}
  <div class="nav"><div class="nav-large" style="margin-top:2px">Today</div><div class="nav-sub">Tuesday, October 15 &middot; 3 of 6 done</div></div>
  <div class="scroll"><div class="pad">
    ${banner(t,'sparkles','Morning briefing','3 tasks due before noon','View')}
    <div class="card card-p mt16"><div class="row gap16">
      ${ringChart(t,50,96,10,'50%','complete')}
      <div class="grow">
        <div class="t17 w700">Today&rsquo;s progress</div>
        <div class="t13 muted mt4 mb8">3 of 6 tasks finished</div>
        ${progressBar(50)}
        <div class="t12 muted mt6">2h 15m in focus so far</div>
      </div>
    </div></div>
    ${secHead('Up next','See all')}
    <div class="li-group">
      ${task(false,'Review Q4 roadmap deck','9:30 AM &middot; with Lena Fischer','Work')}
      ${task(false,'Send invoice #1042','Overdue since yesterday','Finance','rose')}
      ${task(true,'Book dentist appointment','Done at 8:05 AM','Health','green')}
      ${task(false,'Water the monstera','6:00 PM &middot; recurring','Home')}
    </div>
  </div></div>
  ${fab(t)}
  ${tabBar(t,[{id:'home',icon:'home',label:'Today'},{id:'cal',icon:'cal',label:'Calendar'},{id:'search',icon:'search',label:'Search'},{id:'chat',icon:'chat',label:'Chat'},{id:'me',icon:'user',label:'Profile'}],'home')}`;
  return { body };
}

function chairSVG(bg1, bg2, accent){
  return `<svg viewBox="0 0 200 200" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <defs><linearGradient id="cbg${bg1.replace('#','')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient></defs>
    <rect width="200" height="200" fill="url(#cbg${bg1.replace('#','')})"/>
    <circle cx="100" cy="95" r="58" fill="#ffffff" opacity=".35"/>
    <ellipse cx="100" cy="172" rx="56" ry="9" fill="#000" opacity=".10"/>
    <path d="M78 148 L72 176 M122 148 L128 176" stroke="#44403C" stroke-width="6" stroke-linecap="round"/>
    <rect x="66" y="52" width="68" height="78" rx="30" fill="${accent}"/>
    <rect x="66" y="52" width="68" height="78" rx="30" fill="#000" opacity=".06"/>
    <rect x="56" y="112" width="88" height="30" rx="15" fill="${accent}"/>
    <rect x="56" y="112" width="88" height="30" rx="15" fill="#fff" opacity=".18"/>
    <rect x="52" y="96" width="14" height="44" rx="7" fill="${accent}" opacity=".85"/>
    <rect x="134" y="96" width="14" height="44" rx="7" fill="${accent}" opacity=".85"/>
  </svg>`;
}
function bMaisonProduct(t){
  const swatch=(c,on)=>`<div style="width:38px;height:38px;border-radius:50%;background:${c};border:${on?`2.5px solid ${t.text}`:'1px solid '+t.border};${on?`box-shadow:0 0 0 3px #fff,0 0 0 5px ${t.text}`:''}"></div>`;
  const body = `
  ${statusBar('iOS', t)}
  <div class="scroll" style="overflow:hidden">
    <div class="rel" style="height:352px">
      <div class="car" style="padding:0;margin:0;height:352px">${['#EDE9E3,#D6CDBF','#E8E4DA,#CFC6B4','#EFE7DB,#D9CDBB'].map((g,i)=>{
        const [a,b]=g.split(','); return `<div style="flex:none;width:390px;height:352px">${chairSVG(a,b,['#E4D6BE','#D8C9AE','#EDE0CC'][i])}</div>`;}).join('')}
      </div>
      <div class="abs" style="top:0;left:0;right:0;display:flex;justify-content:space-between;padding:12px 20px;align-items:center">
        <span style="width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.92);display:flex;align-items:center;justify-content:center">${ic('back',20,'#111',2)}</span>
        <span class="row gap10"><span style="width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.92);display:flex;align-items:center;justify-content:center">${ic('heart',20,'#111',1.9)}</span>
        <span style="width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.92);display:flex;align-items:center;justify-content:center">${ic('share',20,'#111',1.9)}</span></span>
      </div>
      <div class="abs" style="bottom:12px;left:0;right:0;display:flex;justify-content:center;gap:6px">
        <span style="width:22px;height:5px;border-radius:3px;background:#111"></span><span style="width:5px;height:5px;border-radius:3px;background:rgba(0,0,0,.25)"></span><span style="width:5px;height:5px;border-radius:3px;background:rgba(0,0,0,.25)"></span>
      </div>
      <div class="abs" style="top:14px;left:78px"><span class="tag amber">Bestseller</span></div>
    </div>
    <div class="pad mt16">
      <div class="t12 w700" style="letter-spacing:.14em;color:${t.muted}">MAISON ATELIER</div>
      <div class="row between mt4"><div class="t24 w700">Aria Lounge Chair</div></div>
      <div class="row gap8 mt6"><span>${stars(5,15)}</span><span class="t14 w600">4.8</span><span class="t14 muted">212 reviews</span></div>
      <div class="row between mt10"><div class="row gap8"><span class="t22 w800">&euro;349</span><span class="t15 muted" style="text-decoration:line-through">&euro;429</span><span class="tag rose">-19%</span></div><span class="t13 w600" style="color:#B45309">Only 3 left</span></div>
      <div class="t14 w700 mt16 mb8">Fabric &mdash; Oat Boucl&eacute;</div>
      <div class="row gap12">${swatch('#E4D6BE',true)}${swatch('#8A7B66')}${swatch('#3F3A34')}${swatch('#B7C4C9')}</div>
      <div class="row between mt16"><span class="t14 w700">Quantity</span>${stepper(t,1)}</div>
      <div class="mt16">
        <div class="acc"><div class="ah"><span>Details &amp; materials</span>${ic('chevD',20,t.faint,2)}</div><div class="t14 muted mt8" style="line-height:1.55">Solid oak frame, high-resilience foam and a washable boucl&eacute; cover. W 68 &times; D 72 &times; H 76 cm.</div></div>
        <div class="acc"><div class="ah"><span>Shipping &amp; returns</span>${ic('chevR',20,t.faint,2)}</div></div>
        <div class="acc"><div class="ah"><span>Care guide</span>${ic('chevR',20,t.faint,2)}</div></div>
      </div>
    </div>
  </div>
  <div style="flex:none;padding:12px 20px 30px;background:${t.card};border-top:1px solid ${t.border}" class="rel">
    <div class="row gap12"><div class="grow"><div class="t12 muted">Total</div><div class="t20 w800">&euro;349.00</div></div><div class="grow">${btn('Add to bag','dark','bag')}</div></div>
    <div class="homebar"></div>
  </div>`;
  return { body };
}

function bOrbitFeed(t){
  const grad = t.grad;
  const story=(init,bg,label,you=false)=>`<div style="display:flex;flex-direction:column;align-items:center;gap:5px;flex:none">
    <div style="width:66px;height:66px;border-radius:50%;padding:3px;background:${you?'#E4E4E7':grad}"><div class="av" style="width:60px;height:60px;font-size:19px;background:${bg};border:2.5px solid #fff">${init}</div></div>
    <span class="t11 ${you?'w600':''} muted" style="max-width:66px">${label}</span></div>`;
  const post=(init,bg,name,time,likes,cap,comments,liked=false)=>`
    <div class="mt16">
      <div class="pad row gap10">
        ${avatar(init,bg,42,15)}
        <div class="grow"><div class="t14 w700">${name}</div><div class="t12 muted">${time} &middot; Hamburg</div></div>
        <span style="color:${t.faint}">${icf('dots',20,'currentColor')}</span>
      </div>
      <div class="mt10" style="height:300px;background:linear-gradient(160deg,#1e1b4b,#7c3aed 55%,#ec4899);position:relative;overflow:hidden">
        <svg viewBox="0 0 390 300" width="390" height="300" preserveAspectRatio="xMidYMid slice" style="display:block">
          <circle cx="290" cy="80" r="42" fill="#FDE68A" opacity=".9"/>
          <path d="M0 230 L110 130 L200 230 Z" fill="#312e81" opacity=".85"/>
          <path d="M140 230 L250 110 L360 230 Z" fill="#4c1d95" opacity=".9"/>
          <path d="M250 110 L278 145 L250 160 L222 145 Z" fill="#fff" opacity=".85"/>
          <rect y="230" width="390" height="70" fill="#1e1b4b"/>
          <path d="M0 258 Q60 246 120 258 T240 258 T390 258" stroke="#ec4899" stroke-width="3" fill="none" opacity=".7"/>
          <path d="M0 272 Q80 262 160 272 T390 272" stroke="#7c3aed" stroke-width="2.5" fill="none" opacity=".6"/>
        </svg>
        <div class="abs" style="top:12px;right:12px;background:rgba(0,0,0,.45);color:#fff;border-radius:12px;padding:5px 10px" ><span class="t12 w600">1/3</span></div>
      </div>
      <div class="pad">
        <div class="row gap16 mt10">
          <span style="color:${liked?'#E11D48':t.text}">${liked?icf('heart',26,'#E11D48'):ic('heart',26,'currentColor',1.9)}</span>
          <span style="color:${t.text}">${ic('chat',26,'currentColor',1.9)}</span>
          <span style="color:${t.text}">${ic('send',26,'currentColor',1.9)}</span>
          <span style="margin-left:auto;color:${t.text}">${ic('bookmark',26,'currentColor',1.9)}</span>
        </div>
        <div class="t14 w700 mt8">${likes} likes</div>
        <div class="t14 mt2"><span class="w700">${name}</span> ${cap}</div>
        <div class="t14 muted mt2">View all ${comments} comments</div>
      </div>
    </div>`;
  const body = `
  ${statusBar('iOS', t)}
  <div class="pad"><div class="row between" style="padding:10px 0 4px">
    <span class="t28 w800" style="background:${grad};-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:-.03em">orbit</span>
    <span class="row gap18"><span style="position:relative;color:${t.text}">${ic('heart',25,'currentColor',1.9)}<span class="abs" style="top:-5px;right:-6px"><span class="badge">3</span></span></span><span style="color:${t.text}">${ic('chat',25,'currentColor',1.9)}</span></span>
  </div></div>
  <div class="scroll">
    <div class="row gap14 mt6" style="padding:4px 20px 10px;overflow:hidden">
      ${story('','linear-gradient(135deg,#c4b5fd,#f9a8d4)','You',true)}
      ${story('JW','linear-gradient(135deg,#7C3AED,#EC4899)','jonas.w')}
      ${story('MK','linear-gradient(135deg,#F59E0B,#EF4444)','mia.k')}
      ${story('LT','linear-gradient(135deg,#10B981,#3B82F6)','leo.t')}
      ${story('AS','linear-gradient(135deg,#F472B6,#8B5CF6)','ava.s')}
    </div>
    <div style="height:1px;background:${t.border}"></div>
    ${post('JW','linear-gradient(135deg,#7C3AED,#EC4899)','jonas.weber','2h','2,418','Golden hour over the harbor. No filter needed.','184',true)}
    <div class="mt16 mb16"><div class="pad row gap10">
      ${avatar('MK','linear-gradient(135deg,#F59E0B,#EF4444)',42,15)}
      <div class="grow"><div class="t14 w700">mia.kim</div><div class="t12 muted">5h &middot; Berlin</div></div>
      <span style="color:${t.faint}">${icf('dots',20,'currentColor')}</span>
    </div></div>
  </div>
  ${tabBar(t,[{id:'home',icon:'home',label:'Home'},{id:'search',icon:'search',label:'Explore'},{id:'post',icon:'plus',label:'Post'},{id:'act',icon:'heart',label:'Activity'},{id:'me',icon:'user',label:'Profile'}],'home')}`;
  return { body };
}

// ================= MANIFEST =================
const SCREENS = [
  { id:'noted-home-04', app:'noted', app_name:'Noted', title:'Home — today', pattern:'Home', platform:'iOS', category:'Productivity',
    elements:['Tab Bar','Card','Checkbox','Avatar','FAB','Progress Bar','Banner','Button'], build:bNotedHome,
    colors:['#FFFFFF','#F1F5F9','#4F46E5','#0F172A','#10B981'] },
  { id:'maison-product-04', app:'maison', app_name:'Maison', title:'Product detail', pattern:'Product Detail', platform:'iOS', category:'Shopping',
    elements:['Carousel','Rating','Stepper','Button','Accordion','Badge'], build:bMaisonProduct,
    colors:['#FAFAF9','#FFFFFF','#111111','#D97706','#E4D6BE'] },
  { id:'orbit-feed-12', app:'orbit', app_name:'Orbit', title:'Feed', pattern:'Feed', platform:'iOS', category:'Social',
    elements:['Tab Bar','Avatar','Badge','Card','Button'], build:bOrbitFeed,
    colors:['#FFFFFF','#7C3AED','#EC4899','#18181B','#F4F4F5'] },
];

// ================= MAIN =================
async function main(){
  const args = process.argv.slice(2);
  const onlyIdx = args.indexOf('--only');
  const only = onlyIdx>=0 ? args[onlyIdx+1] : null;
  const samples = args.includes('--samples');
  let list = SCREENS;
  if(samples) list = SCREENS.filter(s=>['noted-home-04','maison-product-04','orbit-feed-12'].includes(s.id));
  else if(only) list = SCREENS.filter(s=>s.id.includes(only));
  console.log(`Rendering ${list.length} screens...`);
  const t0 = Date.now();
  for(const def of list){
    const { text } = await renderScreen(def);
    def._text = text;
    console.log(`  ok ${def.id} (${text.length} chars)`);
  }
  const full = !samples && !only;
  if(full){
    console.log('Rendering app icons...');
    for(const app of ['noted','maison','orbit','bright','vitalis']){ await renderIcon(app); console.log('  ok icon '+app); }
    writeDataFiles();
  }
  if(browser) await browser.close();
  console.log(`Done in ${((Date.now()-t0)/1000).toFixed(1)}s`);
}
// (entry point wired at end of file)

// ================= NOTED (productivity) =================
function illuTasks(t){
  return `<svg width="220" height="170" viewBox="0 0 220 170">
    <rect x="30" y="30" width="150" height="110" rx="18" fill="${t.primarySoft}"/>
    <rect x="48" y="52" width="114" height="16" rx="8" fill="${t.primary}" opacity=".25"/>
    <rect x="48" y="76" width="80" height="12" rx="6" fill="${t.primary}" opacity=".15"/>
    <rect x="52" y="98" width="96" height="30" rx="10" fill="#fff"/>
    <circle cx="68" cy="113" r="8" fill="none" stroke="${t.primary}" stroke-width="3"/>
    <rect x="82" y="108" width="52" height="10" rx="5" fill="${t.primary}" opacity=".3"/>
    <circle cx="180" cy="42" r="22" fill="${t.accent}" opacity=".9"/>
    <path d="M172 42l6 6 11-12" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="36" cy="140" r="10" fill="${t.primary}" opacity=".2"/>
  </svg>`;
}
function illuBox(t){
  return `<svg width="200" height="160" viewBox="0 0 200 160">
    <ellipse cx="100" cy="140" rx="60" ry="10" fill="${t.primary}" opacity=".08"/>
    <path d="M55 70 L100 88 L145 70 L145 120 L100 138 L55 120 Z" fill="${t.primarySoft}" stroke="${t.primary}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M55 70 L100 88 L145 70 L100 52 Z" fill="#fff" stroke="${t.primary}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M100 88 L100 138" stroke="${t.primary}" stroke-width="3"/>
    <circle cx="150" cy="40" r="6" fill="${t.accent}"/>
    <circle cx="52" cy="48" r="4" fill="${t.primary}" opacity=".4"/>
    <path d="M162 62l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" fill="${t.primary}" opacity=".5"/>
  </svg>`;
}
function bNotedOnboarding(t){
  const body = `
  <div class="scroll"><div class="pad center" style="padding-top:70px">
    <div class="row" style="justify-content:center">${illuTasks(t)}</div>
    <div class="t28 w800 mt24" style="letter-spacing:-.02em">A calmer<br>to-do list</div>
    <div class="t16 muted mt12" style="max-width:270px;margin-left:auto;margin-right:auto">Capture tasks in seconds, plan your day with focus, and actually finish things.</div>
    <div class="row mt24 mb24" style="justify-content:center;gap:7px">
      <span style="width:24px;height:6px;border-radius:3px;background:${t.primary}"></span>
      <span style="width:6px;height:6px;border-radius:3px;background:${t.faint};opacity:.4"></span>
      <span style="width:6px;height:6px;border-radius:3px;background:${t.faint};opacity:.4"></span>
    </div>
  </div></div>
  <div style="flex:none;padding:0 20px 44px" class="rel">${btn('Get started','',null)}<div class="mt12">${btn('I already have an account','ghost')}</div><div class="homebar"></div></div>`;
  return { body };
}
function bNotedLogin(t){
  const body = `
  ${statusBar('iOS', t)}
  <div class="scroll"><div class="pad" style="padding-top:34px">
    <div class="row gap12"><div class="av" style="width:52px;height:52px;font-size:22px;background:${t.primary}">N</div></div>
    <div class="t28 w800 mt20" style="letter-spacing:-.02em">Welcome back</div>
    <div class="t16 muted mt6 mb24">Log in to pick up where you left off.</div>
    ${textField(t,{label:'Email', value:'jonas.weber@mail.de'})}
    <div class="mt14">${textField(t,{label:'Password', value:'••••••••••', right:'eye'})}</div>
    <div class="row between mt12 mb20"><span class="row gap8"><span class="chk on">${ic('check',14,'#fff',3)}</span><span class="t14 muted">Remember me</span></span><span class="t14 w600" style="color:${t.primary}">Forgot password?</span></div>
    ${btn('Log in')}
    <div class="row gap12 mt20 mb20"><div class="hr grow" style="margin:0"></div><span class="t13 muted">or continue with</span><div class="hr grow" style="margin:0"></div></div>
    <div class="btnrow"><div class="grow">${btn('Google','light')}</div><div class="grow">${btn('Apple','light')}</div></div>
    <div class="center t15 muted mt24">New to Noted? <span class="w700" style="color:${t.primary}">Create account</span></div>
  </div></div><div class="rel"><div class="homebar"></div></div>`;
  return { body };
}
function bNotedForgot(t){
  const body = `
  ${statusBar('iOS', t)}
  <div class="nav"><div class="nav-top"><div class="nav-back">${ic('back',22,t.primary,2)}<span>Back</span></div><div></div></div></div>
  <div class="scroll"><div class="pad" style="padding-top:26px">
    <div class="center"><svg width="120" height="120" viewBox="0 0 120 120"><rect x="20" y="34" width="80" height="56" rx="12" fill="${t.primarySoft}"/><path d="M22 40l38 26 38-26" stroke="${t.primary}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="88" cy="82" r="16" fill="${t.primary}"/><path d="M82 82l4 4 8-9" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
    <div class="t24 w800 center mt20">Reset password</div>
    <div class="t15 muted center mt8 mb24" style="max-width:290px;margin-left:auto;margin-right:auto">Enter the email you signed up with and we&rsquo;ll send you a reset link.</div>
    ${textField(t,{label:'Email', value:'jonas.weber@mail.de', focus:true})}
    <div class="mt20">${btn('Send reset link')}</div>
    <div class="center t15 mt20" style="color:${t.primary}"><span class="w600">Back to log in</span></div>
  </div></div><div class="rel"><div class="homebar"></div></div>`;
  return { body };
}
function bNotedCalendar(t){
  const body = `
  ${statusBar('Android', t)}
  ${appBarAndroid(t,{title:'Calendar', actions:[{icon:'search'},{icon:'plus'}]})}
  <div class="scroll"><div class="pad">
    ${calGrid(t,{month:'October', year:'2026', lead:3, prevStart:28, days:31, sel:15, events:[6,9,15,21,27]})}
    ${secHead('Thursday, Oct 15','')}
    <div class="li-group">
      ${listItem(t,{icon:'briefcase', title:'Sprint review', sub:'10:00 – 11:00 AM · Studio room', iconBg:'#EEF2FF'})}
      ${listItem(t,{icon:'users', title:'Lunch with Priya', sub:'12:30 PM · Café Krämer', iconBg:'#F0FDF4', iconColor:'#10B981'})}
      ${listItem(t,{icon:'zap', title:'Deep work: thesis', sub:'3:00 – 5:00 PM · Focus block', iconBg:'#FEF3C7', iconColor:'#D97706'})}
    </div>
  </div></div>
  ${fab(t)}
  ${bottomNav(t,[{id:'home',icon:'home',label:'Today'},{id:'cal',icon:'cal',label:'Calendar'},{id:'search',icon:'search',label:'Search'},{id:'chat',icon:'chat',label:'Chat'},{id:'me',icon:'user',label:'Profile'}],'cal')}`;
  return { body };
}
function bNotedSearch(t){
  const body = `
  ${statusBar('Android', t)}
  <div style="flex:none;padding:8px 16px 4px">${searchBar(t,'Search tasks, projects, notes',{solid:true, value:'roadmap', filter:true})}</div>
  <div class="scroll"><div class="pad">
    <div class="mt8 mb12">${chips(t,['All','Tasks','Projects','Notes','Files'],0)}</div>
    <div class="t13 w700 muted mb8" style="letter-spacing:.06em">3 RESULTS</div>
    <div class="li-group">
      ${listItem(t,{icon:'check', title:'Review Q4 roadmap deck', sub:'Task · Work · Due today', iconBg:'#EEF2FF'})}
      ${listItem(t,{icon:'layers', title:'Roadmap 2026', sub:'Project · 14 tasks · Updated 2h ago', iconBg:'#F0FDF4', iconColor:'#10B981'})}
      ${listItem(t,{icon:'edit', title:'Roadmap feedback notes', sub:'Note · Edited yesterday', iconBg:'#FEF3C7', iconColor:'#D97706'})}
    </div>
    <div class="t13 w700 muted mt20 mb8" style="letter-spacing:.06em">RECENT</div>
    <div class="li-group">
      ${listItem(t,{icon:'clock', title:'dentist', sub:'', iconBg:t.surface, iconColor:t.muted, chev:false})}
      ${listItem(t,{icon:'clock', title:'invoice template', sub:'', iconBg:t.surface, iconColor:t.muted, chev:false})}
    </div>
  </div></div>
  ${bottomNav(t,[{id:'home',icon:'home',label:'Today'},{id:'cal',icon:'cal',label:'Calendar'},{id:'search',icon:'search',label:'Search'},{id:'chat',icon:'chat',label:'Chat'},{id:'me',icon:'user',label:'Profile'}],'search')}`;
  return { body };
}
function bNotedChat(t){
  const bub=(me,txt,time)=>me
    ? `<div class="row mt10" style="justify-content:flex-end"><div style="max-width:270px;background:${t.primary};color:#fff;border-radius:18px 18px 6px 18px;padding:11px 14px"><div class="t15">${txt}</div><div class="t11 mt4" style="opacity:.75;text-align:right">${time}</div></div></div>`
    : `<div class="row gap8 mt10"><div style="max-width:270px;background:${t.surface};border-radius:18px 18px 18px 6px;padding:11px 14px"><div class="t15">${txt}</div><div class="t11 muted mt4" style="text-align:right">${time}</div></div></div>`;
  const body = `
  ${statusBar('Android', t)}
  ${appBarAndroid(t,{title:'Design team', backIcon:'back', actions:[{icon:'video'},{icon:'dots'}]})}
  <div class="scroll"><div class="pad">
    <div class="row" style="justify-content:center"><span class="tag" style="background:${t.surface};color:${t.muted}">Today</span></div>
    ${bub(false,'Morning! The Q4 deck is ready for review — link is in the task.','9:12 AM')}
    ${bub(true,'On it. I&rsquo;ll leave comments before the 10 AM review.','9:18 AM')}
    ${bub(false,'Perfect. Also, can you add the onboarding metrics slide?','9:20 AM')}
    ${bub(true,'Already added — check slide 14. Numbers look strong.','9:24 AM')}
    <div class="row mt10 gap8">${avatar('LF','linear-gradient(135deg,#F59E0B,#EF4444)',30,11)}<span class="t12 muted"><span class="w600" style="color:${t.text}">Lena</span> is typing…</span></div>
  </div></div>
  <div style="flex:none;padding:10px 16px 26px" class="rel">
    <div class="row gap10"><div class="grow">${textField(t,{ph:'Message the team…', icon:'smile'})}</div><div style="width:50px;height:50px;border-radius:50%;background:${t.primary};display:flex;align-items:center;justify-content:center;flex:none">${ic('send',22,'#fff',2)}</div></div>
    <div class="gesturebar"></div>
  </div>`;
  return { body };
}
function bNotedSettings(t){
  const body = `
  ${statusBar('iOS', t)}
  <div class="nav"><div class="nav-large" style="margin-top:2px">Settings</div></div>
  <div class="scroll"><div class="pad">
    <div class="li-group">
      ${listItem(t,{avatar:{init:'JW',bg:t.primary}, title:'Jonas Weber', sub:'jonas.weber@mail.de · Free plan'})}
    </div>
    <div class="t13 w700 muted mt20 mb8" style="letter-spacing:.06em">PREFERENCES</div>
    <div class="li-group">
      ${toggleRow(t,'bell','Notifications','Reminders & mentions',true)}
      ${toggleRow(t,'refresh','Sync','Across all devices',true)}
      ${toggleRow(t,'moon','Sounds','Task complete chime',false)}
    </div>
    <div class="t13 w700 muted mt20 mb8" style="letter-spacing:.06em">APPEARANCE</div>
    ${segmented(['Light','System','Dark'],1)}
    <div class="t13 w700 muted mt20 mb8" style="letter-spacing:.06em">GENERAL</div>
    <div class="li-group">
      ${listItem(t,{icon:'user', title:'Account', sub:'', iconBg:t.primarySoft})}
      ${listItem(t,{icon:'lock', title:'Privacy', sub:'', iconBg:t.primarySoft})}
      ${listItem(t,{icon:'help', title:'Help & feedback', sub:'', iconBg:t.primarySoft})}
      ${listItem(t,{icon:'logout', title:'Log out', sub:'', iconBg:'#FEE2E2', iconColor:t.danger, chev:false})}
    </div>
    <div class="center t12 faint mt20">Noted 4.2.0 · Made with care in Bremen</div>
  </div></div>
  ${tabBar(t,[{id:'home',icon:'home',label:'Today'},{id:'cal',icon:'cal',label:'Calendar'},{id:'search',icon:'search',label:'Search'},{id:'chat',icon:'chat',label:'Chat'},{id:'me',icon:'user',label:'Profile'}],'me')}`;
  return { body };
}
function bNotedProfile(t){
  const body = `
  ${statusBar('Android', t)}
  ${appBarAndroid(t,{title:'Profile', actions:[{icon:'edit'}]})}
  <div class="scroll"><div class="pad center">
    ${avatar('JW',t.primary,88,30)}
    <div class="t22 w800 mt12">Jonas Weber</div>
    <div class="t14 muted">Product designer · Bremen</div>
    <div class="mt16"><span class="tag">Free plan</span> <span class="tag green ml8">12-day streak</span></div>
    <div class="stat3 mt16" style="text-align:center">
      <div><div class="t20 w800">128</div><div class="t12 muted">Tasks</div></div>
      <div><div class="t20 w800">96</div><div class="t12 muted">Done</div></div>
      <div><div class="t20 w800">75%</div><div class="t12 muted">Rate</div></div>
    </div>
  </div>
  <div class="pad mt16"><div class="li-group">
    ${listItem(t,{icon:'check', title:'My tasks', sub:'6 due today', iconBg:t.primarySoft, badge:'6'})}
    ${listItem(t,{icon:'users', title:'Shared with me', sub:'3 projects', iconBg:'#F0FDF4', iconColor:'#10B981'})}
    ${listItem(t,{icon:'bookmark', title:'Pinned', sub:'8 items', iconBg:'#FEF3C7', iconColor:'#D97706'})}
    ${listItem(t,{icon:'sliders', title:'Settings', sub:'', iconBg:t.surface, iconColor:t.muted})}
  </div></div></div>
  ${bottomNav(t,[{id:'home',icon:'home',label:'Today'},{id:'cal',icon:'cal',label:'Calendar'},{id:'search',icon:'search',label:'Search'},{id:'chat',icon:'chat',label:'Chat'},{id:'me',icon:'user',label:'Profile'}],'me')}`;
  return { body };
}
function bNotedNotifications(t){
  const ni=(icon,bg,fg,title,sub,time,unread)=>`
    <div class="li"><span class="dot" style="${unread?'':'visibility:hidden'}"></span>
      <div style="width:44px;height:44px;border-radius:14px;background:${bg};display:flex;align-items:center;justify-content:center;color:${fg};flex:none">${ic(icon,21,'currentColor',1.9)}</div>
      <div class="grow"><div class="t15 w600 ellip">${title}</div><div class="t13 muted ellip">${sub}</div></div>
      <span class="t12 faint" style="flex:none">${time}</span></div>`;
  const body = `
  ${statusBar('iOS', t)}
  <div class="nav"><div class="nav-top"><div></div><div class="nav-actions"><span class="t15 w600" style="color:${t.primary}">Mark all read</span></div></div><div class="nav-large">Notifications</div></div>
  <div class="scroll"><div class="pad">
    <div class="t13 w700 muted mb8" style="letter-spacing:.06em">TODAY</div>
    <div class="li-group">
      ${ni('bell',t.primarySoft,t.primary,'Reminder: Sprint review','Starts in 30 minutes · Studio room','9:30 AM',true)}
      ${ni('users','#F0FDF4','#10B981','Lena mentioned you','“Can you add the metrics slide?”','8:42 AM',true)}
    </div>
    <div class="t13 w700 muted mt20 mb8" style="letter-spacing:.06em">EARLIER</div>
    <div class="li-group">
      ${ni('trophy','#FEF3C7','#D97706','Streak milestone','12-day streak! Keep it going.','Yesterday',false)}
      ${ni('check',t.primarySoft,t.primary,'Task completed','“Book dentist appointment” done','Yesterday',false)}
      ${ni('zap','#F0FDF4','#10B981','Weekly report ready','You finished 21 tasks this week','Mon',false)}
    </div>
  </div></div>
  ${tabBar(t,[{id:'home',icon:'home',label:'Today'},{id:'cal',icon:'cal',label:'Calendar'},{id:'search',icon:'search',label:'Search'},{id:'chat',icon:'chat',label:'Chat'},{id:'me',icon:'user',label:'Profile'}],'home')}`;
  return { body };
}
function bNotedEmpty(t){
  const body = `
  ${statusBar('iOS', t)}
  <div class="nav"><div class="nav-top"><div class="nav-back">${ic('back',22,t.primary,2)}<span>Today</span></div><div class="nav-actions"><span style="color:${t.primary}">${ic('plus',24,'currentColor',2)}</span></div></div><div class="nav-large">Projects</div></div>
  <div class="scroll"><div class="pad" style="padding-top:60px">
    ${emptyState(t, illuBox(t), 'No projects yet', 'Group related tasks into projects to keep big goals on track.', btn('Create project','', 'plus'))}
  </div></div>
  ${tabBar(t,[{id:'home',icon:'home',label:'Today'},{id:'cal',icon:'cal',label:'Calendar'},{id:'search',icon:'search',label:'Search'},{id:'chat',icon:'chat',label:'Chat'},{id:'me',icon:'user',label:'Profile'}],'home')}`;
  return { body };
}
function bNotedSubscription(t){
  const plan=(name,price,per,save,on)=>`
    <div class="card card-p mt12" style="${on?`border:2px solid ${t.primary}`:'border:1px solid '+t.border}">
      <div class="row gap12"><div class="rad${on?' on':''}"></div>
      <div class="grow"><div class="t16 w700">${name} ${save?`<span class="tag green ml8">${save}</span>`:''}</div><div class="t13 muted">${per}</div></div>
      <div class="t18 w800">${price}</div></div>
    </div>`;
  const feat=x=>`<div class="row gap10 mt10"><span style="color:${t.accent}">${ic('check',19,'currentColor',2.4)}</span><span class="t15">${x}</span></div>`;
  const body = `
  ${statusBar('iOS', t)}
  <div class="nav"><div class="nav-top"><div class="nav-back">${ic('x',22,t.text,2)}</div><div></div></div></div>
  <div class="scroll"><div class="pad center">
    <div class="av" style="width:72px;height:72px;font-size:30px;background:linear-gradient(135deg,${t.primary},#818CF8);margin:6px auto">${ic('trophy',32,'#fff',1.8)}</div>
    <div class="t24 w800 mt12">Noted Plus</div>
    <div class="t15 muted mt6">Do more with fewer taps.</div>
    <div style="text-align:left" class="mt16">
      ${feat('Unlimited projects & file uploads')}
      ${feat('Smart reminders with location')}
      ${feat('Calendar sync & team workspaces')}
    </div>
    ${plan('Monthly','€4.99','per month, billed monthly','',false)}
    ${plan('Yearly','€39.99','per year · €3.33/mo','Save 33%',true)}
    <div class="mt16">${btn('Start 7-day free trial')}</div>
    <div class="t12 faint mt10">Free for 7 days, then €39.99/year. Cancel anytime.</div>
    <div style="text-align:left" class="mt16">
      <div class="acc"><div class="ah"><span>Can I cancel anytime?</span>${ic('chevD',20,t.faint,2)}</div></div>
      <div class="acc"><div class="ah"><span>Is there a student discount?</span>${ic('chevR',20,t.faint,2)}</div></div>
    </div>
  </div></div><div class="rel"><div class="homebar"></div></div>`;
  return { body };
}
function bNotedNewTask(t){
  const dim = `
  ${statusBar('iOS', t)}
  <div class="nav"><div class="nav-large" style="margin-top:2px;opacity:.35">Today</div></div>
  <div class="scroll"><div class="pad" style="opacity:.35">
    <div class="card card-p"><div class="row gap16"><div class="t17 w700">Today&rsquo;s progress</div></div>${progressBar(50)}</div>
  </div></div>`;
  const sheet = bottomSheet(t, `
    <div class="t20 w800 center mb16">New task</div>
    ${textField(t,{ph:'What needs doing?', focus:true})}
    <div class="mt14 mb4">${chips(t,['Today','Tomorrow','Next week','No date'],0)}</div>
    <div class="mt12">${dropdown(t,'Project','Work')}</div>
    <div class="li mt12" style="border:1px solid ${t.border};border-radius:12px"><div class="grow"><div class="t15 w600">Reminder</div><div class="t13 muted">Tue, Oct 20 · 9:00 AM</div></div><div class="tgl on"></div></div>
    <div class="mt16">${btn('Add task')}</div>`, {tall:false});
  return { body: dim + sheet + `<div class="homebar light"></div>` };
}
function bNotedDatePicker(t){
  const times=['9:00 AM','12:30 PM','3:00 PM','6:00 PM'];
  const body = `
  ${statusBar('iOS', t)}
  <div class="nav"><div class="nav-top"><div class="nav-back">${ic('back',22,t.primary,2)}<span>New task</span></div><div></div></div><div class="nav-large">Set reminder</div><div class="nav-sub">“Call the tax office”</div></div>
  <div class="scroll"><div class="pad">
    <div class="mb16">${dpStrip(t,[['M','19'],['T','20'],['W','21'],['T','22'],['F','23'],['S','24'],['S','25']],3)}</div>
    ${calGrid(t,{month:'October', year:'2026', lead:3, prevStart:28, days:31, sel:22, events:[22]})}
    <div class="t15 w700 mt20 mb8">Time</div>
    <div class="chips">${times.map((x,i)=>`<div class="chip${i===0?' on brand':''}">${x}</div>`).join('')}</div>
  </div></div>
  <div style="flex:none;padding:0 20px 44px" class="rel">${btn('Set reminder')}<div class="homebar"></div></div>`;
  return { body };
}
function bNotedTaskDone(t){
  const task = (done, title, meta, tag, tagCls) => `
    <div class="li"><div class="chk${done?' on':''}">${done?ic('check',15,'#fff',3):''}</div>
      <div class="grow"><div class="t16 w600" style="${done?`text-decoration:line-through;color:${t.faint}`:''}">${title}</div><div class="t13 muted mt2">${meta}</div></div>
      ${tag?`<span class="tag ${tagCls||''}">${tag}</span>`:''}</div>`;
  const body = `
  ${statusBar('iOS', t)}
  <div class="nav"><div class="nav-large" style="margin-top:2px">Today</div><div class="nav-sub">Tuesday, October 15 · 3 of 7 done</div></div>
  <div class="scroll"><div class="pad">
    <div class="t15 w700 mb8">Just added</div>
    <div class="li-group" style="border:2px solid ${t.primary}">
      ${task(false,'Call the tax office','Tue, Oct 20 · 9:00 AM · Reminder on','Work')}
    </div>
    ${secHead('Up next','See all')}
    <div class="li-group">
      ${task(false,'Review Q4 roadmap deck','9:30 AM · with Lena Fischer','Work')}
      ${task(false,'Send invoice #1042','Overdue since yesterday','Finance','rose')}
    </div>
  </div></div>
  ${toast('Task created · Reminder Tue 9:00 AM','check',t)}
  ${fab(t)}
  ${tabBar(t,[{id:'home',icon:'home',label:'Today'},{id:'cal',icon:'cal',label:'Calendar'},{id:'search',icon:'search',label:'Search'},{id:'chat',icon:'chat',label:'Chat'},{id:'me',icon:'user',label:'Profile'}],'home')}`;
  return { body };
}
SCREENS.push(
  { id:'noted-onboarding-01', app:'noted', app_name:'Noted', title:'Onboarding', pattern:'Onboarding', platform:'iOS', category:'Productivity', elements:['Button'], build:bNotedOnboarding, colors:['#FFFFFF','#EEF2FF','#4F46E5','#0F172A','#10B981'] },
  { id:'noted-login-02', app:'noted', app_name:'Noted', title:'Login', pattern:'Login', platform:'iOS', category:'Productivity', elements:['Text Field','Button','Checkbox'], build:bNotedLogin, colors:['#FFFFFF','#F1F5F9','#4F46E5','#0F172A','#64748B'] },
  { id:'noted-forgot-password-03', app:'noted', app_name:'Noted', title:'Forgot password', pattern:'Forgot Password', platform:'iOS', category:'Productivity', elements:['Text Field','Button'], build:bNotedForgot, colors:['#FFFFFF','#EEF2FF','#4F46E5','#0F172A','#64748B'] },
  { id:'noted-calendar-05', app:'noted', app_name:'Noted', title:'Calendar — month', pattern:'Calendar', platform:'Android', category:'Productivity', elements:['Calendar','List Item','FAB'], build:bNotedCalendar, colors:['#FFFFFF','#F1F5F9','#4F46E5','#0F172A','#D97706'] },
  { id:'noted-search-06', app:'noted', app_name:'Noted', title:'Search', pattern:'Search', platform:'Android', category:'Productivity', elements:['Search Bar','Chip','List Item'], build:bNotedSearch, colors:['#FFFFFF','#F1F5F9','#4F46E5','#0F172A','#64748B'] },
  { id:'noted-chat-07', app:'noted', app_name:'Noted', title:'Chat — team', pattern:'Chat', platform:'Android', category:'Productivity', elements:['Avatar','Text Field','Badge'], build:bNotedChat, colors:['#FFFFFF','#F1F5F9','#4F46E5','#0F172A','#64748B'] },
  { id:'noted-settings-08', app:'noted', app_name:'Noted', title:'Settings', pattern:'Settings', platform:'iOS', category:'Productivity', elements:['Toggle','Segmented Control','List Item'], build:bNotedSettings, colors:['#FFFFFF','#F1F5F9','#4F46E5','#0F172A','#64748B'] },
  { id:'noted-profile-09', app:'noted', app_name:'Noted', title:'Profile', pattern:'Profile', platform:'Android', category:'Productivity', elements:['Avatar','Button','List Item','Badge'], build:bNotedProfile, colors:['#FFFFFF','#F1F5F9','#4F46E5','#0F172A','#10B981'] },
  { id:'noted-notifications-10', app:'noted', app_name:'Noted', title:'Notifications', pattern:'Notifications', platform:'iOS', category:'Productivity', elements:['List Item','Badge','Avatar'], build:bNotedNotifications, colors:['#FFFFFF','#F1F5F9','#4F46E5','#0F172A','#EF4444'] },
  { id:'noted-empty-state-11', app:'noted', app_name:'Noted', title:'Empty state — projects', pattern:'Empty State', platform:'iOS', category:'Productivity', elements:['Button'], build:bNotedEmpty, colors:['#FFFFFF','#EEF2FF','#4F46E5','#0F172A','#64748B'] },
  { id:'noted-subscription-12', app:'noted', app_name:'Noted', title:'Subscription — Noted Plus', pattern:'Subscription', platform:'iOS', category:'Productivity', elements:['Radio','Accordion','Button','Card'], build:bNotedSubscription, colors:['#FFFFFF','#EEF2FF','#4F46E5','#0F172A','#F59E0B'] },
  { id:'noted-new-task-13', app:'noted', app_name:'Noted', title:'New task — bottom sheet', pattern:'Home', platform:'iOS', category:'Productivity', elements:['Bottom Sheet','Text Field','Chip','Dropdown','Toggle','Button'], build:bNotedNewTask, colors:['#FFFFFF','#F1F5F9','#4F46E5','#0F172A','#64748B'] },
  { id:'noted-date-picker-14', app:'noted', app_name:'Noted', title:'Set reminder — date picker', pattern:'Home', platform:'iOS', category:'Productivity', elements:['Date Picker','Calendar','Chip','Button'], build:bNotedDatePicker, colors:['#FFFFFF','#F1F5F9','#4F46E5','#0F172A','#D97706'] },
  { id:'noted-task-done-15', app:'noted', app_name:'Noted', title:'Task created — toast', pattern:'Home', platform:'iOS', category:'Productivity', elements:['Toast','Tab Bar','Card','Checkbox','FAB'], build:bNotedTaskDone, colors:['#FFFFFF','#F1F5F9','#4F46E5','#0F172A','#10B981'] },
);

// ================= MAISON (e-commerce) =================
function prodThumb(kind, bg1, bg2){
  const inner = kind==='chair'
    ? `<rect x="78" y="58" width="44" height="52" rx="20" fill="#E4D6BE"/><rect x="70" y="100" width="60" height="22" rx="11" fill="#EDE0CC"/><path d="M84 122 L80 142 M116 122 L120 142" stroke="#44403C" stroke-width="5" stroke-linecap="round"/>`
    : kind==='table'
    ? `<ellipse cx="100" cy="132" rx="34" ry="6" fill="#000" opacity=".08"/><rect x="62" y="66" width="76" height="12" rx="6" fill="#8A7B66"/><rect x="96" y="78" width="8" height="56" fill="#6B5F4E"/><rect x="72" y="128" width="56" height="8" rx="4" fill="#6B5F4E"/><rect x="76" y="44" width="30" height="22" rx="4" fill="#D97706" opacity=".85"/>`
    : kind==='lamp'
    ? `<ellipse cx="100" cy="140" rx="30" ry="6" fill="#000" opacity=".08"/><rect x="97" y="80" width="6" height="60" fill="#44403C"/><path d="M70 80 L130 80 L118 44 L82 44 Z" fill="#F5F0E6" stroke="#D6CDBF" stroke-width="3"/><circle cx="100" cy="100" r="10" fill="#FDE68A"/>`
    : `<rect x="56" y="84" width="88" height="44" rx="14" fill="#C9BFAE"/><rect x="56" y="70" width="26" height="34" rx="12" fill="#B7AB97"/><rect x="118" y="70" width="26" height="34" rx="12" fill="#B7AB97"/><path d="M66 128 L62 144 M134 128 L138 144" stroke="#44403C" stroke-width="5" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 200 200" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="pt${bg1.replace('#','')}${kind}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient></defs><rect width="200" height="200" fill="url(#pt${bg1.replace('#','')}${kind})"/>${inner}</svg>`;
}
function bMaisonWelcome(t){
  const body = `
  <div class="scroll" style="position:relative">
    <svg viewBox="0 0 390 844" width="390" height="844" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0">
      <defs><linearGradient id="mwbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EFE9DD"/><stop offset="1" stop-color="#DCD2BF"/></linearGradient></defs>
      <rect width="390" height="844" fill="url(#mwbg)"/>
      <rect x="45" y="120" width="300" height="380" rx="150" fill="#F7F3EA" opacity=".7"/>
      <ellipse cx="195" cy="640" rx="150" ry="22" fill="#000" opacity=".08"/>
      <rect x="85" y="380" width="220" height="120" rx="34" fill="#C9BFAE"/>
      <rect x="85" y="330" width="64" height="90" rx="28" fill="#B7AB97"/>
      <rect x="241" y="330" width="64" height="90" rx="28" fill="#B7AB97"/>
      <rect x="70" y="470" width="250" height="34" rx="17" fill="#D8CDB8"/>
      <path d="M110 504 L100 580 M280 504 L290 580" stroke="#44403C" stroke-width="12" stroke-linecap="round"/>
      <rect x="250" y="200" width="60" height="130" rx="8" fill="#8A7B66" opacity=".55"/>
      <circle cx="120" cy="220" r="34" fill="#FDE68A" opacity=".55"/>
    </svg>
    <div class="abs" style="top:0;left:0;right:0">${statusBar('iOS', t)}</div>
    <div class="abs" style="top:76px;left:0;right:0;text-align:center"><span class="t22 w800" style="letter-spacing:.34em">MAISON</span></div>
    <div class="abs" style="bottom:0;left:0;right:0;padding:0 28px 54px;background:linear-gradient(transparent,rgba(20,16,10,.42))">
      <div class="t34 w800" style="color:#fff;letter-spacing:-.02em">Furniture for<br>slow living</div>
      <div class="t16 mt8" style="color:rgba(255,255,255,.85)">Timeless pieces, honest materials,<br>delivered to your door.</div>
      <div class="mt20">${btn('Start shopping','light')}</div>
      <div class="mt10">${btn('Log in','plain')}</div>
    </div>
    <div class="homebar light"></div>
  </div>`;
  return { body };
}
function bMaisonHome(t){
  const edCard=(title,sub,kind)=>`
    <div style="flex:none;width:250px">
      <div class="hero-illu" style="height:300px">${prodThumb(kind,'#EDE9E3','#D6CDBF')}</div>
      <div class="t16 w700 mt8">${title}</div><div class="t13 muted">${sub}</div>
    </div>`;
  const prod=(name,price,kind)=>`
    <div style="flex:none;width:160px">
      <div class="hero-illu" style="height:160px">${prodThumb(kind,'#F5F5F4','#E7E5E4')}</div>
      <div class="t14 w600 mt6 ellip">${name}</div><div class="t14 w700">${price}</div>
    </div>`;
  const body = `
  ${statusBar('Android', t)}
  <div style="flex:none;padding:6px 16px 0"><div class="row between">
    <span class="t20 w800" style="letter-spacing:.22em">MAISON</span>
    <span class="row gap18"><span style="color:${t.text}">${ic('search',24,'currentColor',1.9)}</span><span style="position:relative;color:${t.text}">${ic('bag',24,'currentColor',1.9)}<span class="abs" style="top:-6px;right:-8px"><span class="badge">2</span></span></span></span>
  </div></div>
  <div class="scroll"><div>
    <div class="pad mt8">${searchBar(t,'Search furniture',{})}</div>
    <div class="pad mt12">${banner(t,'tag','The Autumn Edit','Up to 30% off warm minimalism','Shop')}</div>
    <div class="pad">${secHead('Editorial','View all')}</div>
    <div class="car">${edCard('The Reading Corner','12 pieces','chair')}${edCard('Soft Light','9 pieces','lamp')}${edCard('Small Spaces','15 pieces','sofa')}</div>
    <div class="pad">
      ${secHead('Shop by room','')}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        ${['Living room','Bedroom','Dining','Office'].map((r,i)=>`<div class="card card-p row between"><span class="t15 w600">${r}</span>${ic('chevR',18,t.faint,2)}</div>`).join('')}
      </div>
      ${secHead('New arrivals','See all')}
    </div>
    <div class="car">${prod('Aria Lounge Chair','€349','chair')}${prod('Duna Side Table','€129','table')}${prod('Halo Floor Lamp','€189','lamp')}${prod('Fjord 2-Seat Sofa','€899','sofa')}</div>
    <div style="height:14px"></div>
  </div></div>
  ${bottomNav(t,[{id:'home',icon:'home',label:'Home'},{id:'search',icon:'search',label:'Search'},{id:'bag',icon:'bag',label:'Bag'},{id:'heart',icon:'heart',label:'Saved'},{id:'me',icon:'user',label:'Profile'}],'home')}`;
  return { body };
}
function bMaisonSearch(t){
  const tile=(name,price,kind,tag)=>`
    <div><div class="hero-illu" style="height:170px;position:relative">${prodThumb(kind,'#F5F5F4','#E7E5E4')}${tag?`<span class="abs" style="top:8px;left:8px"><span class="tag ${tag[1]}">${tag[0]}</span></span>`:''}</div>
    <div class="t14 w600 mt6 ellip">${name}</div><div class="t14 w700">${price}</div></div>`;
  const dim = `
  ${statusBar('iOS', t)}
  <div style="flex:none;padding:8px 16px">${searchBar(t,'Search Maison',{solid:true, value:'lounge chair', filter:true})}</div>
  <div class="scroll"><div class="pad" style="opacity:.4">
    <div class="row between mt4 mb12"><span class="t14 muted">24 results</span>${''}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      ${tile('Aria Lounge Chair','€349','chair',['-19%','rose'])}
      ${tile('Nube Accent Chair','€279','chair')}
      ${tile('Fjord 2-Seat Sofa','€899','sofa')}
      ${tile('Pouf Ottoman','€89','chair',['New',''])}
    </div>
  </div></div>`;
  const sheet = bottomSheet(t, `
    <div class="t20 w800 center mb4">Filters</div>
    <div class="t15 w700 mt16 mb8">Max price · €350</div>
    ${slider(t,70)}
    <div class="row between t12 muted"><span>€0</span><span>€500</span></div>
    <div class="t15 w700 mt16 mb8">Availability</div>
    <div class="chips">${['In stock','On sale','Solid oak','Under €200'].map((c,i)=>`<div class="chip${i<2?' on':''}">${c}</div>`).join('')}</div>
    <div class="t15 w700 mt16 mb8">Sort by</div>
    <div class="li-group">
      ${['Most popular','Price: low to high','Newest'].map((s,i)=>`<div class="li"><div class="grow t15 ${i===0?'w700':''}">${s}</div><div class="rad${i===0?' on':''}"></div></div>`).join('')}
    </div>
    <div class="mt16">${btn('Show 24 results','dark')}</div>`);
  return { body: dim + sheet + `<div class="homebar light"></div>` };
}
function bMaisonCart(t){
  const item=(kind,name,meta,price,qty)=>`
    <div class="li" style="padding:14px 16px;align-items:flex-start">
      <div style="width:76px;height:76px;border-radius:12px;overflow:hidden;flex:none">${prodThumb(kind,'#F5F5F4','#E7E5E4')}</div>
      <div class="grow"><div class="t15 w700">${name}</div><div class="t13 muted mt2">${meta}</div>
        <div class="row between mt8"><span class="t15 w800">${price}</span>${stepper(t,qty)}</div></div>
    </div>`;
  const body = `
  ${statusBar('iOS', t)}
  <div class="nav"><div class="nav-top"><div class="nav-back">${ic('back',22,t.text,2)}</div><div class="t17 w700">Bag (2)</div><div style="width:40px"></div></div></div>
  <div class="scroll"><div class="pad">
    <div class="li-group mt8">
      ${item('chair','Aria Lounge Chair','Oat Bouclé · Qty 1','€349',1)}
      ${item('table','Duna Side Table','Smoked oak · Qty 2','€258',2)}
    </div>
    <div class="row gap10 mt16"><div class="grow">${textField(t,{ph:'Promo code'})}</div><div>${btn('Apply','dark sm')}</div></div>
    <div class="card card-p mt16">
      <div class="kv"><span class="muted">Subtotal</span><span class="w600">€607.00</span></div>
      <div class="kv"><span class="muted">Shipping</span><span class="w600" style="color:#B45309">Free</span></div>
      <div class="kv"><span class="w700">Total</span><span class="t18 w800">€607.00</span></div>
    </div>
    <div class="row gap8 mt12"><span style="color:#10B981">${ic('truck',20,'currentColor',1.9)}</span><span class="t13 muted">Free carbon-neutral delivery · arrives Fri, Oct 23</span></div>
  </div></div>
  <div style="flex:none;padding:12px 20px 34px" class="rel">${btn('Checkout · €607.00','dark')}<div class="homebar"></div></div>`;
  return { body };
}
function bMaisonCheckout(t){
  const step=(n,label,on,done)=>`<div class="row gap6"><span class="av" style="width:24px;height:24px;font-size:12px;background:${on?t.text:(done?'#10B981':t.surface2)};color:${on?'#fff':(done?'#fff':t.muted)}">${done?'✓':n}</span><span class="t13 ${on?'w700':'muted'}">${label}</span></div>`;
  const body = `
  ${statusBar('Android', t)}
  ${appBarAndroid(t,{title:'Checkout'})}
  <div class="scroll"><div class="pad">
    <div class="row gap10 mt4 mb16">${step(1,'Shipping',true)}<span class="faint">—</span>${step(2,'Payment')}<span class="faint">—</span>${step(3,'Review')}</div>
    <div class="t15 w700 mb8">Delivery address</div>
    ${textField(t,{value:'Sofia Rossi'})}
    <div class="mt12">${textField(t,{value:'Osterstraße 14'})}</div>
    <div class="row gap12 mt12"><div class="grow">${textField(t,{value:'28199'})}</div><div class="grow" style="flex:2">${textField(t,{value:'Bremen'})}</div></div>
    <div class="t15 w700 mt20 mb8">Shipping method</div>
    <div class="card card-p" style="border:2px solid ${t.text}"><div class="row gap12"><div class="rad on"></div><div class="grow"><div class="t15 w700">Standard</div><div class="t13 muted">3–5 business days</div></div><div class="t15 w800" style="color:#B45309">Free</div></div></div>
    <div class="card card-p mt10"><div class="row gap12"><div class="rad"></div><div class="grow"><div class="t15 w700">Express</div><div class="t13 muted">1–2 business days</div></div><div class="t15 w700">€9.00</div></div></div>
  </div></div>
  <div style="flex:none;padding:12px 20px 28px" class="rel">${btn('Continue to payment','dark')}<div class="gesturebar"></div></div>`;
  return { body };
}
function bMaisonPayment(t){
  const body = `
  ${statusBar('Android', t)}
  ${appBarAndroid(t,{title:'Payment'})}
  <div class="scroll"><div class="pad">
    <div style="border-radius:18px;background:linear-gradient(135deg,#1c1917,#44403c);padding:20px;color:#fff" class="mt4">
      <div class="row between"><span class="t13 w700" style="letter-spacing:.24em;opacity:.8">MAISON</span><span style="opacity:.8">${ic('wifiS',22,'#fff',1.8)}</span></div>
      <div class="mt20 mb4">${ic('card',34,'#D97706',1.6)}</div>
      <div class="t20 w600" style="letter-spacing:.12em">•••• •••• •••• 4021</div>
      <div class="row between mt16"><div><div class="t11" style="opacity:.6">Card holder</div><div class="t14 w600">SOFIA ROSSI</div></div><div><div class="t11" style="opacity:.6">Expires</div><div class="t14 w600">08/28</div></div></div>
    </div>
    <div class="t15 w700 mt20 mb8">Card details</div>
    ${textField(t,{ph:'Card number', icon:'card'})}
    <div class="row gap12 mt12"><div class="grow">${textField(t,{ph:'MM / YY'})}</div><div class="grow">${textField(t,{ph:'CVC'})}</div></div>
    <div class="t15 w700 mt20 mb8">Pay with</div>
    <div class="li-group">
      <div class="li"><div class="grow t15 w600">Card</div><div class="rad on"></div></div>
      <div class="li"><div class="grow t15">PayPal</div><div class="rad"></div></div>
      <div class="li"><div class="grow t15">Klarna <span class="t13 muted">· pay in 3</span></div><div class="rad"></div></div>
    </div>
    <div class="row gap10 mt16"><div class="chk on">${ic('check',14,'#fff',3)}</div><span class="t14 muted">Save card for next time</span></div>
  </div></div>
  <div style="flex:none;padding:12px 20px 28px" class="rel">${btn('Pay €607.00','dark','lock')}<div class="gesturebar"></div></div>`;
  return { body };
}
function bMaisonOrders(t){
  const order=(id,status,tagCls,date,items,prog)=>`
    <div class="card card-p mt12">
      <div class="row between"><span class="t15 w800">${id}</span><span class="tag ${tagCls}">${status}</span></div>
      <div class="t13 muted mt4">${date} · ${items}</div>
      ${prog!==undefined?`<div class="mt10">${progressBar(prog)}</div><div class="row gap6 mt8"><span style="color:${t.accent}">${ic('truck',18,'currentColor',1.9)}</span><span class="t13 w600">Arriving Friday</span></div>`:''}
    </div>`;
  const body = `
  ${statusBar('iOS', t)}
  <div class="nav"><div class="nav-large" style="margin-top:2px">Orders</div><div class="nav-sub">Track, return, reorder</div></div>
  <div class="scroll"><div class="pad">
    <div class="stat3"><div><div class="t20 w800">12</div><div class="t12 muted">Orders</div></div><div><div class="t20 w800">€2.4k</div><div class="t12 muted">Spent</div></div><div><div class="t20 w800">€312</div><div class="t12 muted">Saved</div></div></div>
    ${order('#MS-8421','Delivered','green','Oct 10 · 2 items')}
    ${order('#MS-8390','In transit','amber','Oct 13 · 1 item',65)}
    ${order('#MS-8274','Delivered','green','Sep 28 · 3 items')}
  </div></div>
  ${bottomNav(t,[{id:'home',icon:'home',label:'Home'},{id:'search',icon:'search',label:'Search'},{id:'bag',icon:'bag',label:'Bag'},{id:'heart',icon:'heart',label:'Saved'},{id:'me',icon:'user',label:'Profile'}],'bag')}`;
  return { body };
}
function bMaisonProfile(t){
  const body = `
  ${statusBar('Android', t)}
  ${appBarAndroid(t,{title:'Profile', actions:[{icon:'sliders'}]})}
  <div class="scroll"><div class="pad">
    <div class="row gap14 mt8">${avatar('SR','#111',72,24)}<div><div class="t20 w800">Sofia Rossi</div><div class="t14 muted">sofia.rossi@mail.de</div><div class="mt6"><span class="tag amber">Gold member</span></div></div></div>
    <div class="mt20 li-group">
      ${listItem(t,{icon:'bag', title:'Orders', sub:'12 orders', iconBg:t.surface2, iconColor:t.text})}
      ${listItem(t,{icon:'heart', title:'Wishlist', sub:'4 saved pieces', iconBg:t.surface2, iconColor:t.text, badge:'4'})}
      ${listItem(t,{icon:'pin', title:'Addresses', sub:'Home · Office', iconBg:t.surface2, iconColor:t.text})}
      ${listItem(t,{icon:'card', title:'Payment methods', sub:'Visa ···· 4021', iconBg:t.surface2, iconColor:t.text})}
      ${listItem(t,{icon:'help', title:'Help center', sub:'', iconBg:t.surface2, iconColor:t.text})}
    </div>
    <div class="center t12 faint mt20">Maison 3.8.1</div>
  </div></div>
  ${bottomNav(t,[{id:'home',icon:'home',label:'Home'},{id:'search',icon:'search',label:'Search'},{id:'bag',icon:'bag',label:'Bag'},{id:'heart',icon:'heart',label:'Saved'},{id:'me',icon:'user',label:'Profile'}],'me')}`;
  return { body };
}
function bMaisonNotifications(t){
  const ni=(icon,title,sub,time,tag)=>`
    <div class="li"><div style="width:46px;height:46px;border-radius:14px;background:${t.surface2};display:flex;align-items:center;justify-content:center;color:${t.text};flex:none">${ic(icon,22,'currentColor',1.9)}</div>
      <div class="grow"><div class="t15 w600 ellip">${title}</div><div class="t13 muted ellip">${sub}</div></div>
      <div class="t12 faint" style="flex:none;text-align:right">${time}${tag?`<div class="mt4"><span class="tag ${tag[1]}">${tag[0]}</span></div>`:''}</div></div>`;
  const body = `
  ${statusBar('iOS', t)}
  <div class="nav"><div class="nav-large" style="margin-top:2px">Notifications</div></div>
  <div class="scroll"><div class="pad"><div class="li-group">
    ${ni('tag','Price drop','Aria Lounge Chair is now €349','2h ago',['-19%','rose'])}
    ${ni('truck','Order shipped','#MS-8390 is on its way','5h ago')}
    ${ni('check','Back in stock','Duna Side Table · Smoked oak','1d ago')}
    ${ni('zap','Sale ends Sunday','The Autumn Edit · up to 30% off','2d ago')}
  </div></div></div>
  ${bottomNav(t,[{id:'home',icon:'home',label:'Home'},{id:'search',icon:'search',label:'Search'},{id:'bag',icon:'bag',label:'Bag'},{id:'heart',icon:'heart',label:'Saved'},{id:'me',icon:'user',label:'Profile'}],'heart')}`;
  return { body };
}
function bMaisonEmpty(t){
  const body = `
  ${statusBar('iOS', t)}
  <div class="nav"><div class="nav-top"><div></div><div class="nav-actions"><span style="color:${t.text}">${ic('share',22,'currentColor',1.9)}</span></div></div><div class="nav-large">Wishlist</div></div>
  <div class="scroll"><div class="pad" style="padding-top:70px">
    ${emptyState(t, `<svg width="180" height="150" viewBox="0 0 180 150"><path d="M90 128S34 92 34 56a30 30 0 0 1 56-15 30 30 0 0 1 56 15c0 36-56 72-56 72z" fill="none" stroke="${t.text}" stroke-width="5"/><path d="M60 52a22 22 0 0 1 16-8" stroke="${t.accent}" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="140" cy="110" r="7" fill="${t.accent}"/></svg>`,
      'Your wishlist is empty', 'Save pieces you love and we&rsquo;ll keep an eye on the price for you.', btn('Discover pieces','dark'))}
  </div></div>
  ${bottomNav(t,[{id:'home',icon:'home',label:'Home'},{id:'search',icon:'search',label:'Search'},{id:'bag',icon:'bag',label:'Bag'},{id:'heart',icon:'heart',label:'Saved'},{id:'me',icon:'user',label:'Profile'}],'heart')}`;
  return { body };
}
function bMaisonError(t){
  const body = `
  ${statusBar('Android', t)}
  ${appBarAndroid(t,{title:'New arrivals'})}
  <div class="scroll"><div class="pad" style="padding-top:110px">
    ${emptyState(t, `<svg width="170" height="150" viewBox="0 0 170 150"><circle cx="85" cy="75" r="52" fill="#FEE2E2"/><path d="M85 48v30" stroke="${t.danger}" stroke-width="7" stroke-linecap="round"/><circle cx="85" cy="98" r="4.5" fill="${t.danger}"/><path d="M40 30l6 2M130 30l-6 2" stroke="${t.faint}" stroke-width="4" stroke-linecap="round"/></svg>`,
      'Something went wrong', 'We couldn&rsquo;t load this collection. Check your connection and try again.', btn('Try again','dark','refresh'))}
    <div class="center mt12">${btn('Back to home','plain')}</div>
  </div></div>
  ${bottomNav(t,[{id:'home',icon:'home',label:'Home'},{id:'search',icon:'search',label:'Search'},{id:'bag',icon:'bag',label:'Bag'},{id:'heart',icon:'heart',label:'Saved'},{id:'me',icon:'user',label:'Profile'}],'home')}`;
  return { body };
}
function bMaisonConfirmed(t){
  const body = `
  ${statusBar('iOS', t)}
  <div class="scroll"><div class="pad center" style="padding-top:64px">
    <div class="av" style="width:96px;height:96px;background:#10B981;margin:0 auto">${ic('check',44,'#fff',2.6)}</div>
    <div class="t26 w800 mt20" style="font-size:26px">Order confirmed</div>
    <div class="t15 muted mt8">Order <span class="w700" style="color:${t.text}">#MS-8421</span> · Arriving <span class="w700" style="color:${t.text}">Fri, Oct 23</span></div>
    <div class="card card-p mt24" style="text-align:left">
      <div class="row gap12"><span style="color:${t.accent}">${ic('truck',24,'currentColor',1.9)}</span><div class="grow"><div class="t15 w700">Standard delivery · Free</div><div class="t13 muted">Osterstraße 14, 28199 Bremen</div></div></div>
      <div class="hr"></div>
      <div class="row gap12"><div style="width:52px;height:52px;border-radius:10px;overflow:hidden;flex:none">${prodThumb('chair','#F5F5F4','#E7E5E4')}</div><div class="grow"><div class="t14 w600">Aria Lounge Chair</div><div class="t13 muted">Qty 1 · Oat Bouclé</div></div><div class="t15 w800">€349</div></div>
    </div>
    <div class="mt24">${btn('Track order','dark')}</div>
    <div class="mt12">${btn('Continue shopping','plain')}</div>
  </div></div><div class="rel"><div class="homebar"></div></div>`;
  return { body };
}
SCREENS.push(
  { id:'maison-welcome-01', app:'maison', app_name:'Maison', title:'Welcome', pattern:'Welcome', platform:'iOS', category:'Shopping', elements:['Button'], build:bMaisonWelcome, colors:['#FAFAF9','#EFE9DD','#111111','#D97706','#FFFFFF'] },
  { id:'maison-home-02', app:'maison', app_name:'Maison', title:'Home — editorial', pattern:'Home', platform:'Android', category:'Shopping', elements:['Carousel','Banner','Card','Search Bar','Badge'], build:bMaisonHome, colors:['#FAFAF9','#FFFFFF','#111111','#D97706','#F5F5F4'] },
  { id:'maison-search-03', app:'maison', app_name:'Maison', title:'Search — filters', pattern:'Search', platform:'iOS', category:'Shopping', elements:['Search Bar','Chip','Slider','Radio','Bottom Sheet','Button'], build:bMaisonSearch, colors:['#FAFAF9','#FFFFFF','#111111','#D97706','#F5F5F4'] },
  { id:'maison-cart-05', app:'maison', app_name:'Maison', title:'Cart', pattern:'Cart', platform:'iOS', category:'Shopping', elements:['List Item','Stepper','Text Field','Button'], build:bMaisonCart, colors:['#FAFAF9','#FFFFFF','#111111','#D97706','#10B981'] },
  { id:'maison-checkout-06', app:'maison', app_name:'Maison', title:'Checkout — shipping', pattern:'Checkout', platform:'Android', category:'Shopping', elements:['Text Field','Radio','Button'], build:bMaisonCheckout, colors:['#FAFAF9','#FFFFFF','#111111','#D97706','#F5F5F4'] },
  { id:'maison-payment-07', app:'maison', app_name:'Maison', title:'Payment method', pattern:'Payment Method', platform:'Android', category:'Shopping', elements:['Text Field','Radio','Checkbox','Button','Card'], build:bMaisonPayment, colors:['#FAFAF9','#1C1917','#111111','#D97706','#FFFFFF'] },
  { id:'maison-orders-08', app:'maison', app_name:'Maison', title:'Orders', pattern:'Activity/Stats', platform:'iOS', category:'Shopping', elements:['List Item','Badge','Progress Bar','Card'], build:bMaisonOrders, colors:['#FAFAF9','#FFFFFF','#111111','#D97706','#10B981'] },
  { id:'maison-profile-09', app:'maison', app_name:'Maison', title:'Profile', pattern:'Profile', platform:'Android', category:'Shopping', elements:['Avatar','List Item','Badge'], build:bMaisonProfile, colors:['#FAFAF9','#FFFFFF','#111111','#D97706','#F5F5F4'] },
  { id:'maison-notifications-10', app:'maison', app_name:'Maison', title:'Notifications', pattern:'Notifications', platform:'iOS', category:'Shopping', elements:['List Item','Badge'], build:bMaisonNotifications, colors:['#FAFAF9','#FFFFFF','#111111','#D97706','#F5F5F4'] },
  { id:'maison-empty-11', app:'maison', app_name:'Maison', title:'Empty state — wishlist', pattern:'Empty State', platform:'iOS', category:'Shopping', elements:['Button'], build:bMaisonEmpty, colors:['#FAFAF9','#FFFFFF','#111111','#D97706','#F5F5F4'] },
  { id:'maison-error-12', app:'maison', app_name:'Maison', title:'Error state', pattern:'Error State', platform:'Android', category:'Shopping', elements:['Button'], build:bMaisonError, colors:['#FAFAF9','#FFFFFF','#111111','#DC2626','#F5F5F4'] },
  { id:'maison-order-confirmed-13', app:'maison', app_name:'Maison', title:'Order confirmed', pattern:'Checkout', platform:'iOS', category:'Shopping', elements:['Button','Card'], build:bMaisonConfirmed, colors:['#FAFAF9','#FFFFFF','#111111','#10B981','#D97706'] },
);

// ================= ORBIT (social) =================
function bOrbitSignup(t){
  const body = `
  ${statusBar('iOS', t)}
  <div class="scroll"><div class="pad" style="padding-top:20px">
    <div class="center"><span class="t34 w800" style="background:${t.grad};-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:-.03em">orbit</span></div>
    <div class="t24 w800 center mt16">Create your account</div>
    <div class="t15 muted center mt6 mb20">Join 2M+ people sharing their world.</div>
    ${textField(t,{label:'Name', value:'Jonas Weber'})}
    <div class="mt12">${textField(t,{label:'Email', value:'jonas.weber@mail.de'})}</div>
    <div class="mt12">${textField(t,{label:'Password', value:'••••••••••', right:'eye'})}</div>
    <div class="mt12">${textField(t,{label:'Phone', value:'+49 170 123 456'})}</div>
    <div class="mt20">${btn('Sign up')}</div>
    <div class="t12 faint center mt12" style="line-height:1.5">By signing up you agree to our Terms<br>and Privacy Policy.</div>
    <div class="center t15 muted mt16">Have an account? <span class="w700" style="color:${t.primary}">Log in</span></div>
  </div></div><div class="rel"><div class="homebar"></div></div>`;
  return { body };
}
function bOrbitOtp(t){
  const box=(d,fill)=>`<div style="width:64px;height:72px;border-radius:16px;background:${fill?t.primarySoft:t.surface};border:${fill?`2px solid ${t.primary}`:'1px solid '+t.border};display:flex;align-items:center;justify-content:center"><span class="t24 w700" style="color:${fill?t.primary:t.text}">${d||''}</span></div>`;
  const body = `
  ${statusBar('iOS', t)}
  <div class="nav"><div class="nav-top"><div class="nav-back">${ic('back',22,t.primary,2)}<span>Back</span></div><div></div></div></div>
  <div class="scroll"><div class="pad center" style="padding-top:18px">
    <div class="av" style="width:84px;height:84px;background:${t.primarySoft};margin:0 auto">${ic('shield',38,t.primary,1.8)}</div>
    <div class="t24 w800 mt20">Verify your number</div>
    <div class="t15 muted mt8">We sent a 4-digit code to<br><span class="w700" style="color:${t.text}">+49 170 123 456</span></div>
    <div class="row mt24 mb8" style="justify-content:center;gap:10px">${box('4',true)}${box('7',true)}${box('',false)}${box('',false)}</div>
    <div class="t14 mt16"><span class="muted">Didn&rsquo;t get it?</span> <span class="w700" style="color:${t.primary}">Resend in 0:42</span></div>
    <div class="mt24" style="text-align:left">${btn('Verify')}</div>
  </div></div><div class="rel"><div class="homebar"></div></div>`;
  return { body };
}
function bOrbitHome(t){
  const grad=t.grad;
  const story=(init,bg,label)=>`<div style="display:flex;flex-direction:column;align-items:center;gap:5px;flex:none">
    <div style="width:62px;height:62px;border-radius:50%;padding:2.5px;background:${grad}"><div class="av" style="width:57px;height:57px;font-size:17px;background:${bg};border:2.5px solid #fff">${init}</div></div>
    <span class="t11 muted" style="max-width:62px">${label}</span></div>`;
  const body = `
  ${statusBar('iOS', t)}
  <div class="pad"><div class="row between" style="padding:10px 0 2px">
    <div><div class="t20 w800">Good evening,</div><div class="t20 w800" style="background:${grad};-webkit-background-clip:text;background-clip:text;color:transparent">Jonas</div></div>
    <span class="row gap16"><span style="position:relative;color:${t.text}">${ic('heart',25,'currentColor',1.9)}<span class="abs" style="top:-5px;right:-6px"><span class="badge">3</span></span></span><span style="color:${t.text}">${ic('chat',25,'currentColor',1.9)}</span></span>
  </div></div>
  <div class="scroll">
    <div class="pad mt8"><div class="card card-p row gap12">
      ${avatar('JW',grad,46,16)}
      <div class="grow t15" style="color:${t.faint}">Share a moment…</div>
      <span style="color:${t.primary}">${ic('image',24,'currentColor',1.9)}</span>
      <span style="color:${t.primary}">${ic('camera',24,'currentColor',1.9)}</span>
    </div></div>
    <div class="row gap12 mt14" style="padding:2px 20px;overflow:hidden">
      ${story('MK','linear-gradient(135deg,#F59E0B,#EF4444)','mia.k')}
      ${story('LT','linear-gradient(135deg,#10B981,#3B82F6)','leo.t')}
      ${story('AS','linear-gradient(135deg,#F472B6,#8B5CF6)','ava.s')}
      ${story('DR','linear-gradient(135deg,#6366F1,#22D3EE)','dan.r')}
      ${story('EP','linear-gradient(135deg,#FB7185,#FBBF24)','emi.p')}
    </div>
    <div class="pad mt14">
      <div class="card card-p">
        <div class="row gap10">${avatar('LT','linear-gradient(135deg,#10B981,#3B82F6)',42,15)}<div class="grow"><div class="t14 w700">leo.teller</div><div class="t12 muted">1h · Munich</div></div><span style="color:${t.faint}">${icf('dots',20,'currentColor')}</span></div>
        <div class="t14 mt10">Just shipped our new studio site. Three months of work, finally live. Link in bio.</div>
        <div class="row gap14 mt10" style="color:${t.muted}">${ic('heart',22,'currentColor',1.9)}<span class="t13 w600">842</span>${ic('chat',22,'currentColor',1.9)}<span class="t13 w600">96</span><span style="margin-left:auto">${ic('bookmark',22,'currentColor',1.9)}</span></div>
      </div>
    </div>
  </div>
  ${tabBar(t,[{id:'home',icon:'home',label:'Home'},{id:'search',icon:'search',label:'Explore'},{id:'post',icon:'plus',label:'Post'},{id:'act',icon:'heart',label:'Activity'},{id:'me',icon:'user',label:'Profile'}],'home')}`;
  return { body };
}
function bOrbitExplore(t){
  const tile=(g,h,label)=>`<div style="border-radius:12px;overflow:hidden;background:${g};height:${h}px;position:relative;flex:none"><span class="abs t12 w700" style="bottom:8px;left:10px;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,.4)">${label}</span></div>`;
  const body = `
  ${statusBar('Android', t)}
  <div style="flex:none;padding:8px 16px 4px">${searchBar(t,'Search Orbit',{solid:true, filter:false})}</div>
  <div class="scroll"><div class="pad">
    <div class="mt8 mb12">${chips(t,['For you','Travel','Food','Design','Music'],0)}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">
      ${tile('linear-gradient(160deg,#7C3AED,#EC4899)',150,'Santorini')}
      ${tile('linear-gradient(160deg,#F59E0B,#EF4444)',110,'Ramen')}
      ${tile('linear-gradient(160deg,#10B981,#3B82F6)',150,'Dolomites')}
      ${tile('linear-gradient(160deg,#6366F1,#22D3EE)',110,'Studio')}
      ${tile('linear-gradient(160deg,#FB7185,#FBBF24)',150,'Concert')}
      ${tile('linear-gradient(160deg,#8B5CF6,#EC4899)',110,'Ceramics')}
      ${tile('linear-gradient(160deg,#0EA5E9,#6366F1)',150,'Lisbon')}
      ${tile('linear-gradient(160deg,#F472B6,#FB7185)',110,'Brunch')}
      ${tile('linear-gradient(160deg,#34D399,#0EA5E9)',150,'Norway')}
    </div>
  </div></div>
  ${bottomNav(t,[{id:'home',icon:'home',label:'Home'},{id:'search',icon:'search',label:'Explore'},{id:'post',icon:'plus',label:'Post'},{id:'act',icon:'heart',label:'Activity'},{id:'me',icon:'user',label:'Profile'}],'search')}`;
  return { body };
}
function bOrbitComposer(t){
  const dim = `
  ${statusBar('iOS', t)}
  <div class="pad"><div class="row between" style="padding:10px 0 4px;opacity:.4">
    <span class="t28 w800" style="letter-spacing:-.03em">orbit</span>
  </div></div>
  <div class="scroll" style="opacity:.4"><div class="pad"><div class="card card-p"><div class="t14">Golden hour over the harbor…</div></div></div></div>`;
  const sheet = bottomSheet(t, `
    <div class="row between mb12"><span class="t16 w600" style="color:${t.muted}">Cancel</span><span class="t18 w800">New post</span><span class="t16 w700" style="color:${t.primary}">Share</span></div>
    <div class="row gap12">
      <div style="width:88px;height:88px;border-radius:14px;background:linear-gradient(160deg,#1e1b4b,#7c3aed 55%,#ec4899);flex:none;position:relative;overflow:hidden">
        <svg viewBox="0 0 88 88" width="88" height="88"><circle cx="62" cy="24" r="14" fill="#FDE68A" opacity=".9"/><path d="M0 66 L30 36 L58 66 Z" fill="#312e81"/><rect y="66" width="88" height="22" fill="#1e1b4b"/></svg>
      </div>
      <div class="grow">${textField(t,{ph:'Write a caption…', focus:true})}</div>
    </div>
    <div class="mt14 li-group">
      <div class="li"><span style="color:${t.primary}">${ic('pin',20,'currentColor',1.9)}</span><div class="grow t15">Add location</div><span class="chev">${ic('chevR',20,t.faint,2)}</span></div>
      <div class="li"><span style="color:${t.primary}">${ic('tag',20,'currentColor',1.9)}</span><div class="grow t15">Tag people</div><span class="chev">${ic('chevR',20,t.faint,2)}</span></div>
      <div class="li"><span style="color:${t.primary}">${ic('users',20,'currentColor',1.9)}</span><div class="grow"><div class="t15">Who can reply</div><div class="t13 muted">Everyone</div></div><div class="rad on"></div></div>
    </div>
    <div class="mt16">${btn('Share')}</div>`, {tall:false});
  return { body: dim + sheet + `<div class="homebar light"></div>` };
}
function bOrbitCaption(t){
  const body = `
  ${statusBar('iOS', t)}
  <div class="nav"><div class="nav-top"><div class="nav-back"><span class="t16" style="color:${t.muted}">Cancel</span></div><div class="t17 w700">New post</div><span class="t16 w700" style="color:${t.primary}">Share</span></div></div>
  <div class="scroll"><div class="pad">
    <div style="height:220px;border-radius:18px;background:linear-gradient(160deg,#1e1b4b,#7c3aed 55%,#ec4899);overflow:hidden;position:relative">
      <svg viewBox="0 0 350 220" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"><circle cx="260" cy="60" r="36" fill="#FDE68A" opacity=".9"/><path d="M0 170 L100 90 L190 170 Z" fill="#312e81"/><path d="M120 170 L220 70 L330 170 Z" fill="#4c1d95"/><rect y="170" width="350" height="50" fill="#1e1b4b"/></svg>
      <span class="abs" style="top:10px;right:10px;background:rgba(0,0,0,.45);color:#fff;border-radius:12px;padding:5px 10px"><span class="t12 w600">1/3</span></span>
    </div>
    <div class="mt14">${textField(t,{value:'Golden hour over the harbor. No filter needed.', focus:true})}</div>
    <div class="t12 muted mt6" style="text-align:right">48 / 220</div>
    <div class="mt12">${chips(t,['Add location','Tag people','Add music'], -1)}</div>
    <div class="t15 w700 mt20 mb8">Audience</div>
    <div class="li-group">
      <div class="li"><div class="grow t15 w600">Everyone</div><div class="rad on"></div></div>
      <div class="li"><div class="grow t15">Followers only</div><div class="rad"></div></div>
    </div>
  </div></div>
  <div style="flex:none;padding:12px 20px 40px" class="rel">${btn('Share')}<div class="homebar"></div></div>`;
  return { body };
}
function bOrbitProfile(t){
  const tile=(g)=>`<div style="aspect-ratio:1;border-radius:6px;background:${g}"></div>`;
  const body = `
  ${statusBar('Android', t)}
  ${appBarAndroid(t,{title:'jonas.weber', actions:[{icon:'plus'},{icon:'sliders'}]})}
  <div class="scroll"><div class="pad">
    <div class="row gap16 mt6">
      <div style="width:84px;height:84px;border-radius:50%;padding:3px;background:${t.grad}">${avatar('JW',t.grad,78,24)}</div>
      <div class="grow row between" style="text-align:center">
        <div><div class="t18 w800">248</div><div class="t12 muted">Posts</div></div>
        <div><div class="t18 w800">12.4k</div><div class="t12 muted">Followers</div></div>
        <div><div class="t18 w800">890</div><div class="t12 muted">Following</div></div>
      </div>
    </div>
    <div class="t15 w700 mt10">Jonas Weber</div>
    <div class="t14 muted">Photographer · Hamburg<br>Chasing light since 2019</div>
    <div class="row gap10 mt12"><div class="grow">${btn('Edit profile','ghost sm')}</div><div class="grow">${btn('Share profile','light sm')}</div></div>
    <div class="mt14">${segmented(['Posts','Reels','Tagged'],0)}</div>
    <div class="mt12" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px">
      ${tile('linear-gradient(160deg,#7C3AED,#EC4899)')}${tile('linear-gradient(160deg,#F59E0B,#EF4444)')}${tile('linear-gradient(160deg,#10B981,#3B82F6)')}
      ${tile('linear-gradient(160deg,#6366F1,#22D3EE)')}${tile('linear-gradient(160deg,#FB7185,#FBBF24)')}${tile('linear-gradient(160deg,#8B5CF6,#EC4899)')}
    </div>
  </div></div>
  ${bottomNav(t,[{id:'home',icon:'home',label:'Home'},{id:'search',icon:'search',label:'Explore'},{id:'post',icon:'plus',label:'Post'},{id:'act',icon:'heart',label:'Activity'},{id:'me',icon:'user',label:'Profile'}],'me')}`;
  return { body };
}
function bOrbitDms(t){
  const dm=(init,bg,name,msg,time,unread,online)=>`
    <div class="li"><div class="rel">${avatar(init,bg,50,17)}${online?'<span class="abs" style="bottom:1px;right:1px;width:13px;height:13px;border-radius:50%;background:#22C55E;border:2.5px solid #fff"></span>':''}</div>
      <div class="grow"><div class="t15 w700 ellip">${name}</div><div class="t13 ${unread?'w600':'muted'} ellip" style="${unread?`color:${t.text}`:''}">${msg}</div></div>
      <div style="text-align:right;flex:none"><div class="t12 faint">${time}</div>${unread?`<div class="mt4"><span class="badge">${unread}</span></div>`:''}</div></div>`;
  const body = `
  ${statusBar('Android', t)}
  ${appBarAndroid(t,{title:'Messages', actions:[{icon:'edit'}]})}
  <div style="flex:none;padding:4px 16px 8px">${searchBar(t,'Search conversations',{solid:true})}</div>
  <div class="scroll"><div class="pad"><div class="li-group">
    ${dm('MK','linear-gradient(135deg,#F59E0B,#EF4444)','mia.kim','That sunset shot is unreal','2m',2,true)}
    ${dm('LT','linear-gradient(135deg,#10B981,#3B82F6)','leo.teller','Sent you the studio link','1h',0,true)}
    ${dm('AS','linear-gradient(135deg,#F472B6,#8B5CF6)','ava.santos','Are we still on for Saturday?','3h',1,false)}
    ${dm('DR','linear-gradient(135deg,#6366F1,#22D3EE)','dan.richter','Thanks for the feedback!','Yesterday',0,false)}
    ${dm('EP','linear-gradient(135deg,#FB7185,#FBBF24)','emi.park','Loved your latest reel','Yesterday',0,true)}
  </div></div></div>
  ${bottomNav(t,[{id:'home',icon:'home',label:'Home'},{id:'search',icon:'search',label:'Explore'},{id:'post',icon:'plus',label:'Post'},{id:'act',icon:'heart',label:'Activity'},{id:'me',icon:'user',label:'Profile'}],'post')}`;
  return { body };
}
function bOrbitNotifications(t){
  const ni=(icon,bg,fg,title,sub,time,action)=>`
    <div class="li"><div style="width:46px;height:46px;border-radius:14px;background:${bg};display:flex;align-items:center;justify-content:center;color:${fg};flex:none">${ic(icon,22,'currentColor',1.9)}</div>
      <div class="grow"><div class="t14 ellip"><span class="w700">${title}</span> <span class="muted">${sub}</span></div><div class="t12 faint mt2">${time}</div></div>
      ${action==='follow'?`<div>${btn('Follow','sm')}</div>`:action==='tile'?`<div style="width:46px;height:46px;border-radius:10px;background:linear-gradient(160deg,#7C3AED,#EC4899);flex:none"></div>`:''}</div>`;
  const body = `
  ${statusBar('Android', t)}
  ${appBarAndroid(t,{title:'Activity'})}
  <div class="scroll"><div class="pad">
    <div class="t13 w700 muted mb8" style="letter-spacing:.06em">TODAY</div>
    <div class="li-group">
      ${ni('heart','#FEE2E2','#E11D48','mia.kim','liked your photo.','12m','tile')}
      ${ni('user','#F5F3FF','#7C3AED','leo.teller','started following you.','1h','follow')}
      ${ni('chat','#EFF6FF','#2563EB','ava.santos','mentioned you in a comment.','3h','tile')}
    </div>
    <div class="t13 w700 muted mt20 mb8" style="letter-spacing:.06em">THIS WEEK</div>
    <div class="li-group">
      ${ni('zap','#FEF3C7','#D97706','Your reel','hit 10k views. Keep going!','2d','tile')}
      ${ni('users','#F5F3FF','#7C3AED','dan.richter','and 48 others followed you.','4d','')}
    </div>
  </div></div>
  ${bottomNav(t,[{id:'home',icon:'home',label:'Home'},{id:'search',icon:'search',label:'Explore'},{id:'post',icon:'plus',label:'Post'},{id:'act',icon:'heart',label:'Activity'},{id:'me',icon:'user',label:'Profile'}],'act')}`;
  return { body };
}
function bOrbitSettings(t){
  const body = `
  ${statusBar('iOS', t)}
  <div class="nav"><div class="nav-large" style="margin-top:2px">Settings</div></div>
  <div class="scroll"><div class="pad">
    <div class="t13 w700 muted mb8" style="letter-spacing:.06em">ACCOUNT</div>
    <div class="li-group">
      ${toggleRow(t,'lock','Private account','Only followers see posts',false)}
      ${toggleRow(t,'bell','Push notifications','Likes, comments, follows',true)}
      ${toggleRow(t,'play','Autoplay videos','On Wi-Fi only',true)}
    </div>
    <div class="t13 w700 muted mt20 mb8" style="letter-spacing:.06em">PREFERENCES</div>
    <div class="mb12">${dropdown(t,'Language','English')}</div>
    <div class="li-group">
      ${listItem(t,{icon:'shield', title:'Privacy', iconBg:t.primarySoft})}
      ${listItem(t,{icon:'eye', title:'Blocked accounts', iconBg:t.primarySoft})}
      ${listItem(t,{icon:'help', title:'Help center', iconBg:t.primarySoft})}
      ${listItem(t,{icon:'logout', title:'Log out', iconBg:'#FEE2E2', iconColor:t.danger, chev:false})}
    </div>
  </div></div>
  ${tabBar(t,[{id:'home',icon:'home',label:'Home'},{id:'search',icon:'search',label:'Explore'},{id:'post',icon:'plus',label:'Post'},{id:'act',icon:'heart',label:'Activity'},{id:'me',icon:'user',label:'Profile'}],'me')}`;
  return { body };
}
function bOrbitEmpty(t){
  const body = `
  ${statusBar('Android', t)}
  ${appBarAndroid(t,{title:'Saved'})}
  <div class="scroll"><div class="pad" style="padding-top:90px">
    ${emptyState(t, `<svg width="170" height="150" viewBox="0 0 170 150"><path d="M60 18h50a8 8 0 0 1 8 8v106l-33-22-33 22V26a8 8 0 0 1 8-8z" fill="none" stroke="url(#obg)" stroke-width="6"/><defs><linearGradient id="obg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7C3AED"/><stop offset="1" stop-color="#EC4899"/></linearGradient></defs><circle cx="126" cy="40" r="7" fill="#EC4899" opacity=".6"/></svg>`,
      'No saved posts yet', 'Tap the bookmark on any post to build your collection of favorites.', btn('Explore'))}
  </div></div>
  ${bottomNav(t,[{id:'home',icon:'home',label:'Home'},{id:'search',icon:'search',label:'Explore'},{id:'post',icon:'plus',label:'Post'},{id:'act',icon:'heart',label:'Activity'},{id:'me',icon:'user',label:'Profile'}],'me')}`;
  return { body };
}
function bOrbitInsights(t){
  const body = `
  ${statusBar('Android', t)}
  ${appBarAndroid(t,{title:'Insights', actions:[{icon:'info'}]})}
  <div class="scroll"><div class="pad">
    <div class="mt4">${segmented(['7 days','30 days','90 days'],0)}</div>
    <div class="row gap12 mt16">
      <div class="card card-p grow"><div class="t12 muted">Reach</div><div class="t22 w800 mt2">48.2k</div><div class="t12 w700" style="color:#10B981">+12.4%</div></div>
      <div class="card card-p grow"><div class="t12 muted">Likes</div><div class="t22 w800 mt2">9,148</div><div class="t12 w700" style="color:#10B981">+8.1%</div></div>
      <div class="card card-p grow"><div class="t12 muted">Follows</div><div class="t22 w800 mt2">312</div><div class="t12 w700" style="color:#EF4444">-2.3%</div></div>
    </div>
    <div class="card card-p mt12">
      <div class="row between mb12"><span class="t15 w700">Profile visits</span><span class="t13 muted">This week</span></div>
      ${barChart(t,[{l:'M',v:42},{l:'T',v:68},{l:'W',v:55},{l:'T',v:90},{l:'F',v:74},{l:'S',v:120},{l:'S',v:98}],{h:110})}
    </div>
    <div class="card card-p mt12"><div class="t15 w700 mb8">Top post</div>
      <div class="row gap12"><div style="width:56px;height:56px;border-radius:12px;background:linear-gradient(160deg,#7C3AED,#EC4899);flex:none"></div>
      <div class="grow"><div class="t14 w600">Golden hour over the harbor</div><div class="t13 muted">2,418 likes · 184 comments</div></div></div>
    </div>
  </div></div>
  ${bottomNav(t,[{id:'home',icon:'home',label:'Home'},{id:'search',icon:'search',label:'Explore'},{id:'post',icon:'plus',label:'Post'},{id:'act',icon:'heart',label:'Activity'},{id:'me',icon:'user',label:'Profile'}],'act')}`;
  return { body };
}
function bOrbitOtpSuccess(t){
  const body = `
  ${statusBar('iOS', t)}
  <div class="scroll"><div class="pad center" style="padding-top:110px">
    <div class="av" style="width:104px;height:104px;background:${t.grad};margin:0 auto">${ic('check',48,'#fff',2.6)}</div>
    <div class="t26 w800 mt24" style="font-size:26px">You&rsquo;re verified!</div>
    <div class="t15 muted mt8" style="max-width:260px;margin-left:auto;margin-right:auto">Your number is confirmed. Let&rsquo;s set up your profile and find your people.</div>
    <div class="row mt24 mb16" style="justify-content:center">${avatarGrad('JW',56,20)}${avatarGrad('MK',56,20,'linear-gradient(135deg,#F59E0B,#EF4444)')}${avatarGrad('LT',56,20,'linear-gradient(135deg,#10B981,#3B82F6)')}</div>
    <div class="t14 muted mb20">Mia, Leo and 3 friends are already here</div>
    ${btn('Continue')}
  </div></div><div class="rel"><div class="homebar"></div></div>`;
  return { body };
}
SCREENS.push(
  { id:'orbit-signup-01', app:'orbit', app_name:'Orbit', title:'Sign up', pattern:'Sign Up', platform:'iOS', category:'Social', elements:['Text Field','Button'], build:bOrbitSignup, colors:['#FFFFFF','#F5F3FF','#7C3AED','#EC4899','#18181B'] },
  { id:'orbit-otp-02', app:'orbit', app_name:'Orbit', title:'OTP verification', pattern:'OTP Verification', platform:'iOS', category:'Social', elements:['Text Field','Button','Avatar'], build:bOrbitOtp, colors:['#FFFFFF','#F5F3FF','#7C3AED','#EC4899','#18181B'] },
  { id:'orbit-home-03', app:'orbit', app_name:'Orbit', title:'Home', pattern:'Home', platform:'iOS', category:'Social', elements:['Tab Bar','Avatar','Badge','Card','Button'], build:bOrbitHome, colors:['#FFFFFF','#F4F4F5','#7C3AED','#EC4899','#18181B'] },
  { id:'orbit-explore-04', app:'orbit', app_name:'Orbit', title:'Explore', pattern:'Search', platform:'Android', category:'Social', elements:['Search Bar','Chip','Card'], build:bOrbitExplore, colors:['#FFFFFF','#F4F4F5','#7C3AED','#EC4899','#18181B'] },
  { id:'orbit-composer-05', app:'orbit', app_name:'Orbit', title:'New post — composer', pattern:'Post Composer', platform:'iOS', category:'Social', elements:['Bottom Sheet','Text Field','Button','Radio','Avatar'], build:bOrbitComposer, colors:['#FFFFFF','#F4F4F5','#7C3AED','#EC4899','#18181B'] },
  { id:'orbit-profile-06', app:'orbit', app_name:'Orbit', title:'Profile', pattern:'Profile', platform:'Android', category:'Social', elements:['Avatar','Segmented Control','Button','Card'], build:bOrbitProfile, colors:['#FFFFFF','#F4F4F5','#7C3AED','#EC4899','#18181B'] },
  { id:'orbit-dms-07', app:'orbit', app_name:'Orbit', title:'Messages', pattern:'Chat', platform:'Android', category:'Social', elements:['List Item','Avatar','Badge','Search Bar'], build:bOrbitDms, colors:['#FFFFFF','#F4F4F5','#7C3AED','#EC4899','#22C55E'] },
  { id:'orbit-notifications-08', app:'orbit', app_name:'Orbit', title:'Activity', pattern:'Notifications', platform:'Android', category:'Social', elements:['List Item','Avatar','Button','Badge'], build:bOrbitNotifications, colors:['#FFFFFF','#F4F4F5','#7C3AED','#E11D48','#18181B'] },
  { id:'orbit-settings-09', app:'orbit', app_name:'Orbit', title:'Settings', pattern:'Settings', platform:'iOS', category:'Social', elements:['Toggle','List Item','Dropdown'], build:bOrbitSettings, colors:['#FFFFFF','#F4F4F5','#7C3AED','#EC4899','#71717A'] },
  { id:'orbit-empty-10', app:'orbit', app_name:'Orbit', title:'Empty state — saved', pattern:'Empty State', platform:'Android', category:'Social', elements:['Button'], build:bOrbitEmpty, colors:['#FFFFFF','#F4F4F5','#7C3AED','#EC4899','#18181B'] },
  { id:'orbit-insights-11', app:'orbit', app_name:'Orbit', title:'Insights', pattern:'Activity/Stats', platform:'Android', category:'Social', elements:['Chart','Segmented Control','Card','Badge'], build:bOrbitInsights, colors:['#FFFFFF','#F4F4F5','#7C3AED','#EC4899','#10B981'] },
  { id:'orbit-caption-13', app:'orbit', app_name:'Orbit', title:'New post — caption', pattern:'Post Composer', platform:'iOS', category:'Social', elements:['Text Field','Button','Chip','Radio'], build:bOrbitCaption, colors:['#FFFFFF','#F4F4F5','#7C3AED','#EC4899','#18181B'] },
  { id:'orbit-otp-success-13', app:'orbit', app_name:'Orbit', title:'Verified — success', pattern:'OTP Verification', platform:'iOS', category:'Social', elements:['Button','Avatar'], build:bOrbitOtpSuccess, colors:['#FFFFFF','#F5F3FF','#7C3AED','#EC4899','#18181B'] },
);

// ================= BRIGHT (education) =================
function courseArt(g1, g2, glyph){
  return `<svg viewBox="0 0 350 180" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="ca${g1.replace('#','')}${glyph}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${g1}"/><stop offset="1" stop-color="${g2}"/></linearGradient></defs><rect width="350" height="180" fill="url(#ca${g1.replace('#','')}${glyph})"/><circle cx="290" cy="30" r="60" fill="#fff" opacity=".14"/><circle cx="40" cy="160" r="46" fill="#fff" opacity=".10"/><g transform="translate(155,62)" opacity=".95"><circle r="28" fill="rgba(0,0,0,.28)"/><path d="M-8 -12 L12 0 L-8 12 Z" fill="#fff"/></g></svg>`;
}
function bBrightOnboarding(t){
  const body = `
  <div class="scroll"><div class="pad center" style="padding-top:64px">
    <svg width="230" height="180" viewBox="0 0 230 180">
      <rect x="55" y="60" width="120" height="90" rx="16" fill="#fff" stroke="${t.primary}" stroke-width="4"/>
      <path d="M15 62 L115 18 L215 62 L115 106 Z" fill="${t.primary}"/>
      <path d="M200 62v34" stroke="${t.accent}" stroke-width="6" stroke-linecap="round"/>
      <circle cx="200" cy="108" r="8" fill="${t.accent}"/>
      <rect x="75" y="82" width="80" height="10" rx="5" fill="${t.primary}" opacity=".25"/>
      <rect x="75" y="100" width="56" height="10" rx="5" fill="${t.primary}" opacity=".15"/>
      <circle cx="180" cy="130" r="14" fill="${t.accent}"/>
      <path d="M174 130l4 4 8-9" stroke="#713F12" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <div class="t28 w800 mt24" style="letter-spacing:-.02em">Learn anything,<br>anywhere</div>
    <div class="t16 muted mt12" style="max-width:280px;margin-left:auto;margin-right:auto">Bite-size video courses from world-class instructors. 15 minutes a day is enough.</div>
    <div class="row mt24 mb24" style="justify-content:center;gap:7px">
      <span style="width:24px;height:6px;border-radius:3px;background:${t.primary}"></span>
      <span style="width:6px;height:6px;border-radius:3px;background:${t.faint};opacity:.4"></span>
      <span style="width:6px;height:6px;border-radius:3px;background:${t.faint};opacity:.4"></span>
    </div>
  </div></div>
  <div style="flex:none;padding:0 20px 44px" class="rel">${btn('Get started')}<div class="mt12">${btn('Log in','ghost')}</div><div class="homebar"></div></div>`;
  return { body };
}
function bBrightWelcome(t){
  const chipRow=(items,on)=>`<div class="chips wrap" style="overflow:visible">${items.map((c,i)=>`<div class="chip${i===on?' on brand':''}" style="margin-bottom:8px">${c}</div>`).join('')}</div>`;
  const body = `
  ${statusBar('iOS', t)}
  <div class="scroll"><div class="pad" style="padding-top:30px">
    <div class="t28 w800" style="letter-spacing:-.02em">Welcome to<br>Bright, Jonas</div>
    <div class="t16 muted mt8 mb20">Pick what you want to learn. We&rsquo;ll build your path.</div>
    <div class="t15 w700 mb8">I&rsquo;m interested in</div>
    ${chipRow(['Design','Coding','Business','Languages','Photography','Music'],0)}
    ${chipRow(['Marketing','Data'],1)}
    <div class="t15 w700 mt16 mb8">My level</div>
    ${segmented(['Beginner','Intermediate','Advanced'],0)}
    <div class="t15 w700 mt16 mb8">Daily goal</div>
    <div class="chips">${['15 min','30 min','1 hour'].map((c,i)=>`<div class="chip${i===1?' on brand':''}">${c}</div>`).join('')}</div>
  </div></div>
  <div style="flex:none;padding:12px 20px 44px" class="rel">${btn('Continue')}<div class="homebar"></div></div>`;
  return { body };
}
function bBrightHome(t){
  const rec=(g1,g2,title,meta)=>`
    <div style="flex:none;width:210px"><div class="hero-illu" style="height:120px">${courseArt(g1,g2,'p')}</div>
    <div class="t15 w700 mt8 ellip">${title}</div><div class="t13 muted">${meta}</div></div>`;
  const body = `
  ${statusBar('Android', t)}
  ${appBarAndroid(t,{title:'Hi, Jonas', backIcon:'', actions:[{icon:'bell'},{icon:'user'}]})}
  <div class="scroll"><div class="pad">
    <div class="mt4">${searchBar(t,'Search courses, topics…',{})}</div>
    <div class="mt12">${banner(t,'flame','12-day streak!','You&rsquo;re on fire. 3 more days to beat your record.','')}</div>
    ${secHead('Continue learning','')}
    <div class="card card-p">
      <div class="row gap14">
        <div style="width:92px;height:92px;border-radius:14px;overflow:hidden;flex:none">${courseArt('#2563EB','#7C3AED','c')}</div>
        <div class="grow"><div class="tag amber mb6">DESIGN</div><div class="t16 w700">Design Systems 101</div><div class="t13 muted mt2">Lesson 16 of 24 · 12 min left</div>
          <div class="mt8">${progressBar(68)}</div></div>
      </div>
      <div class="mt12">${btn('Resume lesson','sm','play')}</div>
    </div>
    ${secHead('Recommended for you','See all')}
  </div>
  <div class="car">${rec('#0EA5E9','#6366F1','Figma Masterclass','18 lessons · 4.9')}${rec('#F59E0B','#EF4444','Color Theory Basics','12 lessons · 4.8')}${rec('#10B981','#0EA5E9','UX Research','20 lessons · 4.7')}</div>
  </div>
  ${bottomNav(t,[{id:'home',icon:'home',label:'Home'},{id:'search',icon:'search',label:'Search'},{id:'cal',icon:'cal',label:'Plan'},{id:'me',icon:'user',label:'Profile'}],'home')}`;
  return { body };
}
function bBrightSearch(t){
  const course=(g1,g2,tag,title,meta,price)=>`
    <div class="card card-p mt12"><div class="row gap14">
      <div style="width:96px;height:96px;border-radius:14px;overflow:hidden;flex:none">${courseArt(g1,g2,'s')}</div>
      <div class="grow"><div class="tag mb6">${tag}</div><div class="t16 w700">${title}</div><div class="t13 muted mt2">${meta}</div>
      <div class="row between mt6"><span>${stars(5,13)}</span><span class="t15 w800">${price}</span></div></div>
    </div></div>`;
  const body = `
  ${statusBar('iOS', t)}
  <div style="flex:none;padding:8px 20px 4px">${searchBar(t,'Search courses',{solid:true, value:'design'})}</div>
  <div class="scroll"><div class="pad">
    <div class="row between mt8 mb4"><div style="flex:1;margin-right:12px">${chips(t,['All','Beginner','Certificate'],0)}</div><div style="flex:none;min-width:118px">${dropdown(t,'','Popular')}</div></div>
    ${course('#2563EB','#7C3AED','DESIGN','Design Systems 101','24 lessons · 8h · 4.9 (3.2k)','€49')}
    ${course('#0EA5E9','#6366F1','DESIGN','Figma Masterclass','18 lessons · 6h · 4.9 (5.1k)','€39')}
    <div class="mt12">${skeletonRows(t,2)}</div>
  </div></div>
  ${tabBar(t,[{id:'home',icon:'home',label:'Home'},{id:'search',icon:'search',label:'Search'},{id:'cal',icon:'cal',label:'Plan'},{id:'me',icon:'user',label:'Profile'}],'search')}`;
  return { body };
}
function bBrightCourse(t){
  const mod=(n,title,lessons,time,open)=>`
    <div class="acc"><div class="ah"><span class="row gap10"><span class="av" style="width:30px;height:30px;font-size:13px;background:${open?t.primary:t.surface};color:${open?'#fff':t.muted}">${n}</span><span>${title}</span></span>${ic(open?'chevD':'chevR',20,t.faint,2)}</div>
    ${open?`<div class="mt10">${['Tokens & variables · 12 min','Component anatomy · 18 min','Hands-on: build a button · 24 min'].map((l,i)=>`<div class="row gap10 mt8"><span style="color:${i===0?t.accent:t.faint}">${ic(i===0?'check':'play',18,'currentColor',2)}</span><span class="t14 ${i===0?'muted':''}">${l}</span><span class="t12 faint" style="margin-left:auto">${i===0?'Done':''}</span></div>`).join('')}</div>`:''}
    <div class="t12 muted mt6">${lessons} lessons · ${time}</div></div>`;
  const body = `
  ${statusBar('iOS', t)}
  <div class="scroll" style="overflow:hidden">
    <div class="rel" style="height:230px">${courseArt('#1D4ED8','#7C3AED','h')}
      <div class="abs" style="top:12px;left:20px"><span style="width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.92);display:flex;align-items:center;justify-content:center">${ic('back',20,'#0F172A',2)}</span></div>
      <div class="abs" style="top:12px;right:20px"><span style="width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.92);display:flex;align-items:center;justify-content:center">${ic('bookmark',20,'#0F172A',1.9)}</span></div>
    </div>
    <div class="pad mt16">
      <div class="tag">DESIGN · BEGINNER</div>
      <div class="t24 w800 mt6">Design Systems 101</div>
      <div class="row gap10 mt8">${avatar('AR','#2563EB',36,13)}<div><div class="t14 w700">Amara Rossi</div><div class="t12 muted">Design Lead · 12 courses</div></div><span class="t13 w700 ml8" style="color:${t.primary}">Follow</span></div>
      <div class="row gap8 mt10"><span>${stars(5,15)}</span><span class="t14 w700">4.9</span><span class="t14 muted">3,214 ratings</span><span class="t14 muted">·</span><span class="t14 muted">24 lessons</span><span class="t14 muted">·</span><span class="t14 muted">8h</span></div>
      <div class="card card-p mt14 row gap10"><span style="color:${t.primary}">${ic('award',24,'currentColor',1.9)}</span><div class="t14"><span class="w700">Certificate included</span><span class="muted"> · shareable on LinkedIn</span></div></div>
      <div class="t17 w800 mt20 mb4">Curriculum</div>
      ${mod(1,'Foundations',8,'2h 10m',true)}
      ${mod(2,'Components in depth',10,'3h 05m',false)}
      ${mod(3,'Shipping your system',6,'2h 40m',false)}
      <div style="height:10px"></div>
    </div>
  </div>
  <div style="flex:none;padding:12px 20px 34px;background:${t.card};border-top:1px solid ${t.border}" class="rel">
    <div class="row gap12"><div class="grow"><div class="t12 muted">One-time</div><div class="t20 w800">€49.00</div></div><div class="grow">${btn('Enroll now')}</div></div>
    <div class="homebar"></div>
  </div>`;
  return { body };
}
function bBrightStats(t){
  const body = `
  ${statusBar('Android', t)}
  ${appBarAndroid(t,{title:'Your progress', actions:[{icon:'share'}]})}
  <div class="scroll"><div class="pad">
    <div class="card card-p mt8"><div class="row gap16">
      ${ringChart(t,72,104,11,'72%','of goal')}
      <div class="grow"><div class="t17 w700">Weekly goal</div><div class="t13 muted mt4 mb8">5h 24m of 7h 30m</div>${progressBar(72)}<div class="t12 muted mt6">2 lessons to go</div></div>
    </div></div>
    <div class="card card-p mt12">
      <div class="row between mb12"><span class="t15 w700">Study time</span><span class="t13 muted">Minutes / day</span></div>
      ${barChart(t,[{l:'M',v:35},{l:'T',v:52},{l:'W',v:28},{l:'T',v:64},{l:'F',v:48},{l:'S',v:80},{l:'S',v:58}],{h:110})}
    </div>
    <div class="stat3 mt12"><div><div class="t20 w800">24h</div><div class="t12 muted">Learned</div></div><div><div class="t20 w800">3</div><div class="t12 muted">Courses</div></div><div><div class="t20 w800">12</div><div class="t12 muted">Day streak</div></div></div>
    <div class="mt12">${banner(t,'trophy','Level 7 reached','You earned 420 XP this week.','')}</div>
  </div></div>
  ${bottomNav(t,[{id:'home',icon:'home',label:'Home'},{id:'search',icon:'search',label:'Search'},{id:'cal',icon:'cal',label:'Plan'},{id:'me',icon:'user',label:'Profile'}],'home')}`;
  return { body };
}
function bBrightCalendar(t){
  const sess=(time,title,meta,color)=>`
    <div class="li"><div style="width:52px;flex:none;text-align:center"><div class="t15 w800" style="color:${color}">${time[0]}</div><div class="t11 muted">${time[1]}</div></div>
      <div style="width:4px;align-self:stretch;border-radius:2px;background:${color}"></div>
      <div class="grow"><div class="t15 w700">${title}</div><div class="t13 muted">${meta}</div></div>
      <span class="chev">${ic('chevR',20,t.faint,2)}</span></div>`;
  const body = `
  ${statusBar('iOS', t)}
  <div class="nav"><div class="nav-large" style="margin-top:2px">Study plan</div><div class="nav-sub">3 sessions this week</div></div>
  <div class="scroll"><div class="pad">
    <div class="mb14">${dpStrip(t,[['T','14'],['W','15'],['T','16'],['F','17'],['S','18'],['S','19'],['M','20']],1)}</div>
    <div class="t15 w700 mb8">Today · Wednesday</div>
    <div class="li-group">
      ${sess(['6:00','PM'],'Design Systems 101','Lesson 16 · Tokens & variables',t.primary)}
      ${sess(['7:30','PM'],'Spanish: Unit 4','15 min review · Flashcards',t.accent)}
    </div>
    <div class="t15 w700 mt20 mb8">Tomorrow</div>
    <div class="li-group">
      ${sess(['8:00','AM'],'Figma Masterclass','Lesson 3 · Auto layout','#8B5CF6')}
    </div>
  </div></div>
  ${tabBar(t,[{id:'home',icon:'home',label:'Home'},{id:'search',icon:'search',label:'Search'},{id:'cal',icon:'cal',label:'Plan'},{id:'me',icon:'user',label:'Profile'}],'cal')}`;
  return { body };
}
function bBrightPaywall(t){
  const feat=x=>`<div class="row gap10 mt10"><span style="color:${t.primary}">${ic('check',19,'currentColor',2.6)}</span><span class="t15">${x}</span></div>`;
  const body = `
  ${statusBar('iOS', t)}
  <div class="nav"><div class="nav-top"><div class="nav-back">${ic('x',22,t.text,2)}</div><div></div></div></div>
  <div class="scroll"><div class="pad center">
    <div class="av" style="width:76px;height:76px;font-size:30px;background:linear-gradient(135deg,#FACC15,#F59E0B);margin:4px auto">${ic('crown',36,'#713F12',1.8)}</div>
    <div class="t24 w800 mt12">Bright Pro</div>
    <div class="t15 muted mt6">Unlock every course, certificate<br>and offline download.</div>
    <div style="text-align:left" class="mt16 card card-p">
      ${feat('Unlimited access to 2,400+ courses')}
      ${feat('Certificates for every completion')}
      ${feat('Offline downloads & 1.5x audio')}
      ${feat('Priority help from tutors')}
    </div>
    <div class="card card-p mt12" style="border:2px solid ${t.primary};text-align:left"><div class="row gap12"><div class="rad on"></div><div class="grow"><div class="t16 w700">Yearly <span class="tag amber ml8">Best value</span></div><div class="t13 muted">€6.58/month, billed yearly</div></div><div class="t18 w800">€79</div></div></div>
    <div class="card card-p mt10" style="text-align:left"><div class="row gap12"><div class="rad"></div><div class="grow"><div class="t16 w700">Monthly</div><div class="t13 muted">Billed monthly, cancel anytime</div></div><div class="t18 w800">€9.99</div></div></div>
    <div class="mt16">${btn('Start 7-day free trial')}</div>
    <div class="t12 faint mt10">Free for 7 days, then €79/year.<br>Cancel anytime in Settings.</div>
  </div></div><div class="rel"><div class="homebar"></div></div>`;
  return { body };
}
function bBrightProfile(t){
  const body = `
  ${statusBar('Android', t)}
  ${appBarAndroid(t,{title:'Profile', actions:[{icon:'sliders'}]})}
  <div class="scroll"><div class="pad">
    <div class="row gap14 mt8">${avatar('JW','#2563EB',72,24)}<div class="grow"><div class="t20 w800">Jonas Weber</div><div class="t14 muted">Learning since Mar 2026</div></div><span class="tag amber">PRO</span></div>
    <div class="card card-p mt16"><div class="row between"><div><div class="t12 muted">Level 7 · 4,280 XP</div><div class="mt8" style="width:200px">${progressBar(64)}</div></div><span style="color:${t.accent}">${ic('trophy',30,'currentColor',1.8)}</span></div></div>
    <div class="stat3 mt12"><div><div class="t20 w800">3</div><div class="t12 muted">Courses</div></div><div><div class="t20 w800">2</div><div class="t12 muted">Certificates</div></div><div><div class="t20 w800">12</div><div class="t12 muted">Day streak</div></div></div>
    <div class="mt16 li-group">
      ${listItem(t,{icon:'book', title:'My courses', iconBg:t.primarySoft})}
      ${listItem(t,{icon:'award', title:'Certificates', iconBg:'#FEF3C7', iconColor:'#B45309', badge:'2'})}
      ${listItem(t,{icon:'download', title:'Downloads', iconBg:t.primarySoft})}
      ${listItem(t,{icon:'sliders', title:'Settings', iconBg:t.surface, iconColor:t.muted})}
    </div>
  </div></div>
  ${bottomNav(t,[{id:'home',icon:'home',label:'Home'},{id:'search',icon:'search',label:'Search'},{id:'cal',icon:'cal',label:'Plan'},{id:'me',icon:'user',label:'Profile'}],'me')}`;
  return { body };
}
function bBrightSettings(t){
  const body = `
  ${statusBar('iOS', t)}
  <div class="nav"><div class="nav-large" style="margin-top:2px">Settings</div></div>
  <div class="scroll"><div class="pad">
    <div class="t13 w700 muted mb8" style="letter-spacing:.06em">LEARNING</div>
    <div class="li-group">
      ${toggleRow(t,'bell','Study reminders','Daily at 6:00 PM',true)}
      ${toggleRow(t,'download','Downloads','Wi-Fi only',true)}
      ${toggleRow(t,'zap','Streak freeze','Protect 1 missed day / month',false)}
    </div>
    <div class="t13 w700 muted mt20 mb8" style="letter-spacing:.06em">PLAYBACK</div>
    <div class="mb12">${dropdown(t,'Default speed','1.25x')}</div>
    <div class="mb12">${dropdown(t,'Video quality','Auto (HD on Wi-Fi)')}</div>
    <div class="t13 w700 muted mt20 mb8" style="letter-spacing:.06em">GENERAL</div>
    <div class="li-group">
      ${listItem(t,{icon:'globe', title:'Language', value:'English', iconBg:t.primarySoft})}
      ${listItem(t,{icon:'help', title:'Help center', iconBg:t.primarySoft})}
      ${listItem(t,{icon:'logout', title:'Log out', iconBg:'#FEE2E2', iconColor:t.danger, chev:false})}
    </div>
  </div></div>
  ${tabBar(t,[{id:'home',icon:'home',label:'Home'},{id:'search',icon:'search',label:'Search'},{id:'cal',icon:'cal',label:'Plan'},{id:'me',icon:'user',label:'Profile'}],'me')}`;
  return { body };
}
function bBrightNotifications(t){
  const ni=(icon,bg,fg,title,sub,time,unread)=>`
    <div class="li"><span class="dot" style="${unread?'':'visibility:hidden'}"></span>
      <div style="width:44px;height:44px;border-radius:14px;background:${bg};display:flex;align-items:center;justify-content:center;color:${fg};flex:none">${ic(icon,21,'currentColor',1.9)}</div>
      <div class="grow"><div class="t15 w600 ellip">${title}</div><div class="t13 muted ellip">${sub}</div></div>
      <span class="t12 faint" style="flex:none">${time}</span></div>`;
  const body = `
  ${statusBar('Android', t)}
  ${appBarAndroid(t,{title:'Notifications'})}
  <div class="scroll"><div class="pad"><div class="li-group">
    ${ni('play',t.primarySoft,t.primary,'New lesson dropped','Design Systems 101 · Lesson 16','10m',true)}
    ${ni('flame','#FEF3C7','#D97706','Streak reminder','Study 12 min to keep your 12-day streak','2h',true)}
    ${ni('award','#D1FAE5','#047857','Certificate ready','Figma Masterclass · Download PDF','1d',false)}
    ${ni('users','#F5F3FF','#7C3AED','Study group invite','Mia invited you to “Design Buddies”','2d',false)}
  </div></div></div>
  ${bottomNav(t,[{id:'home',icon:'home',label:'Home'},{id:'search',icon:'search',label:'Search'},{id:'cal',icon:'cal',label:'Plan'},{id:'me',icon:'user',label:'Profile'}],'home')}`;
  return { body };
}
function bBrightTutor(t){
  const bub=(me,txt)=>me
    ? `<div class="row mt10" style="justify-content:flex-end"><div style="max-width:270px;background:${t.primary};color:#fff;border-radius:18px 18px 6px 18px;padding:11px 14px"><div class="t15">${txt}</div></div></div>`
    : `<div class="row gap8 mt10" style="align-items:flex-end"><div class="av" style="width:32px;height:32px;font-size:14px;background:linear-gradient(135deg,#2563EB,#7C3AED);flex:none">M</div><div style="max-width:270px;background:#fff;border:1px solid ${t.border};border-radius:18px 18px 18px 6px;padding:11px 14px;box-shadow:${t.shadow}"><div class="t15">${txt}</div></div></div>`;
  const body = `
  ${statusBar('iOS', t)}
  <div class="nav"><div class="nav-top"><div class="nav-back">${ic('back',22,t.primary,2)}<span>Back</span></div><div class="t17 w700">Mira · AI Tutor</div><div class="row gap6"><span class="dot" style="background:#22C55E"></span><span class="t13 muted">Online</span></div></div></div>
  <div class="scroll"><div class="pad">
    ${bub(false,'Hi Jonas! I see you&rsquo;re on <b>Lesson 16: Tokens & variables</b>. Want a quick recap before you start?')}
    ${bub(true,'Yes please — what&rsquo;s the difference between a token and a variable?')}
    ${bub(false,`Great question! A <b>token</b> is the raw value (e.g. <span class="t14" style="font-family:monospace;background:${t.primarySoft};padding:2px 6px;border-radius:6px">#4F46E5</span>). A <b>variable</b> in Figma is the container that holds it — so one token can feed many variables.`)}
    ${bub(true,`Got it. And when would I use modes?`)}
    <div class="chips mt12">${['Explain with example','Quiz me','Show lesson','Summarize'].map(c=>`<div class="chip">${c}</div>`).join('')}</div>
  </div></div>
  <div style="flex:none;padding:10px 20px 40px" class="rel">
    <div class="row gap10"><div class="grow">${textField(t,{ph:'Ask Mira anything…', icon:'mic'})}</div><div style="width:50px;height:50px;border-radius:50%;background:${t.primary};display:flex;align-items:center;justify-content:center;flex:none">${ic('send',22,'#fff',2)}</div></div>
    <div class="homebar"></div>
  </div>`;
  return { body };
}
function bBrightCheckout(t){
  const body = `
  ${statusBar('iOS', t)}
  <div class="nav"><div class="nav-top"><div class="nav-back">${ic('back',22,t.primary,2)}<span>Course</span></div><div class="t17 w700">Checkout</div><div style="width:60px"></div></div></div>
  <div class="scroll"><div class="pad">
    <div class="card card-p mt8"><div class="row gap14">
      <div style="width:76px;height:76px;border-radius:12px;overflow:hidden;flex:none">${courseArt('#2563EB','#7C3AED','k')}</div>
      <div class="grow"><div class="t15 w700">Design Systems 101</div><div class="t13 muted">Amara Rossi · 24 lessons</div><div class="t15 w800 mt4">€49.00</div></div>
    </div></div>
    <div class="t15 w700 mt20 mb8">Payment</div>
    <div class="card card-p"><div class="row gap12"><span style="color:${t.text}">${ic('card',24,'currentColor',1.9)}</span><div class="grow"><div class="t15 w600">Visa ···· 4021</div><div class="t13 muted">Expires 08/28</div></div><span class="t14 w600" style="color:${t.primary}">Change</span></div></div>
    <div class="mt12">${textField(t,{ph:'Promo code'})}</div>
    <div class="card card-p mt16">
      <div class="kv"><span class="muted">Course price</span><span class="w600">€49.00</span></div>
      <div class="kv"><span class="muted">Launch discount</span><span class="w600" style="color:#047857">−€10.00</span></div>
      <div class="kv"><span class="w700">Total</span><span class="t18 w800">€39.00</span></div>
    </div>
    <div class="row gap8 mt12"><span style="color:${t.muted}">${ic('shield',20,'currentColor',1.9)}</span><span class="t13 muted">30-day money-back guarantee</span></div>
  </div></div>
  <div style="flex:none;padding:12px 20px 40px" class="rel">${btn('Pay €39.00','','lock')}<div class="homebar"></div></div>`;
  return { body };
}
function bBrightEnrolled(t){
  const body = `
  ${statusBar('Android', t)}
  <div class="scroll"><div class="pad center" style="padding-top:56px">
    <div class="av" style="width:92px;height:92px;background:#10B981;margin:0 auto">${ic('check',42,'#fff',2.6)}</div>
    <div class="t24 w800 mt16">You&rsquo;re enrolled!</div>
    <div class="t15 muted mt8">Design Systems 101 is now<br>in your library.</div>
    <div class="card card-p mt20" style="text-align:left"><div class="row gap14">
      <div style="width:76px;height:76px;border-radius:12px;overflow:hidden;flex:none">${courseArt('#2563EB','#7C3AED','e')}</div>
      <div class="grow"><div class="t15 w700">Design Systems 101</div><div class="t13 muted mt2">24 lessons · 8 hours</div><div class="mt6">${progressBar(0)}</div></div>
    </div></div>
    <div class="mt20" style="text-align:left">${btn('Start learning','play')}</div>
    <div class="mt12" style="text-align:left">${btn('Browse more courses','ghost')}</div>
  </div></div>
  ${toast('Welcome aboard — lesson 1 unlocked','check',t)}
  <div class="rel"><div class="gesturebar"></div></div>`;
  return { body };
}
SCREENS.push(
  { id:'bright-onboarding-01', app:'bright', app_name:'Bright', title:'Onboarding', pattern:'Onboarding', platform:'iOS', category:'Education', elements:['Button'], build:bBrightOnboarding, colors:['#EFF6FF','#FFFFFF','#2563EB','#0F172A','#FACC15'] },
  { id:'bright-welcome-02', app:'bright', app_name:'Bright', title:'Welcome — interests', pattern:'Welcome', platform:'iOS', category:'Education', elements:['Button','Chip','Segmented Control'], build:bBrightWelcome, colors:['#EFF6FF','#FFFFFF','#2563EB','#0F172A','#FACC15'] },
  { id:'bright-home-03', app:'bright', app_name:'Bright', title:'Home — continue learning', pattern:'Home', platform:'Android', category:'Education', elements:['Card','Progress Bar','Avatar','Search Bar','Banner','Carousel','Button'], build:bBrightHome, colors:['#EFF6FF','#FFFFFF','#2563EB','#0F172A','#FACC15'] },
  { id:'bright-search-04', app:'bright', app_name:'Bright', title:'Search — courses', pattern:'Search', platform:'iOS', category:'Education', elements:['Search Bar','Chip','Dropdown','Skeleton','Rating','Card'], build:bBrightSearch, colors:['#EFF6FF','#FFFFFF','#2563EB','#0F172A','#FACC15'] },
  { id:'bright-course-05', app:'bright', app_name:'Bright', title:'Course detail', pattern:'Course Detail', platform:'iOS', category:'Education', elements:['Rating','Accordion','Button','Avatar','Card'], build:bBrightCourse, colors:['#EFF6FF','#FFFFFF','#2563EB','#1D4ED8','#FACC15'] },
  { id:'bright-stats-06', app:'bright', app_name:'Bright', title:'Your progress', pattern:'Activity/Stats', platform:'Android', category:'Education', elements:['Chart','Progress Bar','Card','Banner'], build:bBrightStats, colors:['#EFF6FF','#FFFFFF','#2563EB','#0F172A','#FACC15'] },
  { id:'bright-calendar-07', app:'bright', app_name:'Bright', title:'Study plan', pattern:'Calendar', platform:'iOS', category:'Education', elements:['Date Picker','List Item'], build:bBrightCalendar, colors:['#EFF6FF','#FFFFFF','#2563EB','#0F172A','#8B5CF6'] },
  { id:'bright-paywall-08', app:'bright', app_name:'Bright', title:'Bright Pro — paywall', pattern:'Paywall', platform:'iOS', category:'Education', elements:['Button','Card','Radio'], build:bBrightPaywall, colors:['#EFF6FF','#FFFFFF','#2563EB','#FACC15','#0F172A'] },
  { id:'bright-profile-09', app:'bright', app_name:'Bright', title:'Profile', pattern:'Profile', platform:'Android', category:'Education', elements:['Avatar','Button','List Item','Progress Bar'], build:bBrightProfile, colors:['#EFF6FF','#FFFFFF','#2563EB','#0F172A','#FACC15'] },
  { id:'bright-settings-10', app:'bright', app_name:'Bright', title:'Settings', pattern:'Settings', platform:'iOS', category:'Education', elements:['Toggle','Dropdown','List Item'], build:bBrightSettings, colors:['#EFF6FF','#FFFFFF','#2563EB','#0F172A','#64748B'] },
  { id:'bright-notifications-11', app:'bright', app_name:'Bright', title:'Notifications', pattern:'Notifications', platform:'Android', category:'Education', elements:['List Item','Badge','Avatar'], build:bBrightNotifications, colors:['#EFF6FF','#FFFFFF','#2563EB','#0F172A','#D97706'] },
  { id:'bright-tutor-12', app:'bright', app_name:'Bright', title:'Chat — AI tutor', pattern:'Chat', platform:'iOS', category:'Education', elements:['Avatar','Text Field','Chip'], build:bBrightTutor, colors:['#EFF6FF','#FFFFFF','#2563EB','#0F172A','#7C3AED'] },
  { id:'bright-checkout-13', app:'bright', app_name:'Bright', title:'Checkout', pattern:'Checkout', platform:'iOS', category:'Education', elements:['Text Field','Button','Card'], build:bBrightCheckout, colors:['#EFF6FF','#FFFFFF','#2563EB','#0F172A','#047857'] },
  { id:'bright-enrolled-14', app:'bright', app_name:'Bright', title:'Enrolled — success', pattern:'Subscription', platform:'Android', category:'Education', elements:['Toast','Button','Progress Bar','Card'], build:bBrightEnrolled, colors:['#EFF6FF','#FFFFFF','#2563EB','#10B981','#0F172A'] },
);

// ================= VITALIS (wellness) =================
function bVitalisWelcome(t){
  const body = `
  <div class="scroll"><div class="pad center" style="padding-top:56px">
    <svg width="240" height="190" viewBox="0 0 240 190">
      <circle cx="120" cy="105" r="52" fill="#FACC15" opacity=".9"/>
      <path d="M20 150 Q70 120 120 150 T220 150 L220 190 L20 190 Z" fill="${t.primary}" opacity=".9"/>
      <path d="M0 162 Q60 138 120 162 T240 162 L240 190 L0 190 Z" fill="${t.primary}" opacity=".55"/>
      <path d="M120 105 m0 -78 a78 78 0 0 1 55 23" stroke="${t.accent}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <ellipse cx="62" cy="60" rx="16" ry="9" fill="#fff" opacity=".9" transform="rotate(-18 62 60)"/>
      <ellipse cx="186" cy="44" rx="20" ry="11" fill="#fff" opacity=".9" transform="rotate(12 186 44)"/>
      <path d="M96 150 q6 -26 22 -34 q-2 22 -22 34z" fill="#10B981"/>
      <path d="M144 150 q-6 -26 -22 -34 q2 22 22 34z" fill="#10B981"/>
    </svg>
    <div class="t28 w800 mt20" style="letter-spacing:-.02em">Build habits<br>that stick</div>
    <div class="t16 muted mt12" style="max-width:280px;margin-left:auto;margin-right:auto">Track water, movement and mindfulness. Small steps, every day.</div>
    <div class="row mt20 mb24" style="justify-content:center;gap:7px">
      <span style="width:24px;height:6px;border-radius:3px;background:${t.primary}"></span>
      <span style="width:6px;height:6px;border-radius:3px;background:${t.faint};opacity:.4"></span>
      <span style="width:6px;height:6px;border-radius:3px;background:${t.faint};opacity:.4"></span>
    </div>
  </div></div>
  <div style="flex:none;padding:0 20px 44px" class="rel">${btn('Get started')}<div class="mt12">${btn('Log in','ghost')}</div><div class="homebar"></div></div>`;
  return { body };
}
function bVitalisHome(t){
  const habit=(done,title,meta,icon)=>`
    <div class="li"><div class="chk round${done?' on':''}">${done?ic('check',14,'#fff',3):''}</div>
      <div style="width:40px;height:40px;border-radius:13px;background:${t.primarySoft};display:flex;align-items:center;justify-content:center;color:${t.primary};flex:none">${ic(icon,20,'currentColor',1.9)}</div>
      <div class="grow"><div class="t15 w600" style="${done?`color:${t.faint};text-decoration:line-through`:''}">${title}</div><div class="t13 muted">${meta}</div></div></div>`;
  const body = `
  ${statusBar('iOS', t)}
  <div class="nav"><div class="nav-top"><div><div class="t13 muted">TUESDAY, OCT 15</div><div class="t24 w800" style="margin-top:2px">Good morning, Jonas</div></div><div class="nav-actions">${avatar('JW',t.primary,44,15)}</div></div></div>
  <div class="scroll"><div class="pad">
    <div class="card card-p mt8" style="background:linear-gradient(135deg,#0D9488,#14B8A6);border:none">
      <div class="row gap14">
        <div class="rel" style="width:92px;height:92px;flex:none">
          <svg width="92" height="92" viewBox="0 0 92 92"><circle cx="46" cy="46" r="39" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="9"/><circle cx="46" cy="46" r="39" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-dasharray="245" stroke-dashoffset="128" transform="rotate(-90 46 46)"/></svg>
          <div class="abs" style="inset:0;display:flex;align-items:center;justify-content:center"><span style="color:#fff">${ic('drop',26,'currentColor',2)}</span></div>
        </div>
        <div class="grow"><div class="t17 w800" style="color:#fff">1.2 of 2.5 L</div><div class="t13 mt2" style="color:rgba(255,255,255,.85)">3 glasses to go today</div><div class="mt8">${btn('Log water','sm light')}</div></div>
      </div>
    </div>
    ${secHead('Today&rsquo;s habits','Edit')}
    <div class="li-group">
      ${habit(true,'Meditate · 10 min','Done at 7:15 AM','smile')}
      ${habit(false,'Walk · 8,000 steps','6,240 so far','activity')}
      ${habit(false,'Read · 20 pages','Atomic Habits · p. 112','book')}
      ${habit(false,'No sugar','Day 4 of 7','zap')}
    </div>
    <div class="mt16">${banner(t,'flame','12-week streak','Your longest streak ever. Keep it alive today.','')}</div>
  </div></div>
  ${fab(t,'plus')}
  ${tabBar(t,[{id:'home',icon:'home',label:'Home'},{id:'stats',icon:'trend',label:'Activity'},{id:'coach',icon:'chat',label:'Coach'},{id:'me',icon:'user',label:'Profile'}],'home')}`;
  return { body };
}
function bVitalisStats(t){
  const body = `
  ${statusBar('Android', t)}
  ${appBarAndroid(t,{title:'Activity', actions:[{icon:'cal'}]})}
  <div class="scroll"><div class="pad">
    <div class="mt4">${segmented(['Week','Month','Year'],0)}</div>
    <div class="card card-p mt12"><div class="row gap16">
      ${ringChart(t,86,104,11,'86%','habits')}
      <div class="grow"><div class="row gap8"><span style="color:${t.accent}">${ic('flame',22,'currentColor',1.9)}</span><div class="t28 w800">12</div></div><div class="t13 muted">week streak · personal best</div><div class="mt8">${progressBar(86)}</div></div>
    </div></div>
    <div class="card card-p mt12">
      <div class="row between mb12"><span class="t15 w700">Habits completed</span><span class="t13 muted">per day</span></div>
      ${barChart(t,[{l:'M',v:5},{l:'T',v:7},{l:'W',v:6},{l:'T',v:8},{l:'F',v:7},{l:'S',v:4},{l:'S',v:6}],{h:100})}
    </div>
    <div class="card card-p mt12">
      <div class="row between mb8"><span class="t15 w700">Water intake</span><span class="t13 w700" style="color:${t.primary}">2.1 L avg</span></div>
      ${lineChart(t,[1.2,1.8,2.0,1.5,2.4,2.8,2.1],330,96)}
    </div>
  </div></div>
  ${bottomNav(t,[{id:'home',icon:'home',label:'Home'},{id:'stats',icon:'trend',label:'Activity'},{id:'coach',icon:'chat',label:'Coach'},{id:'me',icon:'user',label:'Profile'}],'stats')}`;
  return { body };
}
function bVitalisCalendar(t){
  const body = `
  ${statusBar('iOS', t)}
  <div class="nav"><div class="nav-large" style="margin-top:2px">Calendar</div><div class="nav-sub">Every dot is a day you showed up</div></div>
  <div class="scroll"><div class="pad">
    ${calGrid(t,{month:'October', year:'2026', lead:3, prevStart:28, days:31, sel:15, events:[1,2,3,5,6,7,8,9,10,12,13,14,15]})}
    <div class="card card-p mt16 row gap12">
      <span style="color:${t.accent}">${ic('flame',30,'currentColor',1.8)}</span>
      <div class="grow"><div class="t16 w800">3 perfect weeks</div><div class="t13 muted">All habits completed, 3 weeks running</div></div>
      <span class="tag">Best</span>
    </div>
    <div class="t15 w700 mt20 mb8">Today&rsquo;s plan</div>
    <div class="li-group">
      ${listItem(t,{icon:'drop', title:'Water · 500 ml', sub:'After lunch', iconBg:'#CCFBF1', iconColor:t.primary})}
      ${listItem(t,{icon:'dumbbell', title:'Strength · 30 min', sub:'6:00 PM · Home workout', iconBg:'#FFE4E6', iconColor:t.accent})}
      ${listItem(t,{icon:'moon', title:'Wind down · 10:30 PM', sub:'No screens, herbal tea', iconBg:'#E0E7FF', iconColor:'#4F46E5'})}
    </div>
  </div></div>
  ${tabBar(t,[{id:'home',icon:'home',label:'Home'},{id:'stats',icon:'trend',label:'Activity'},{id:'coach',icon:'chat',label:'Coach'},{id:'me',icon:'user',label:'Profile'}],'home')}`;
  return { body };
}
function bVitalisCoach(t){
  const bub=(me,txt)=>me
    ? `<div class="row mt10" style="justify-content:flex-end"><div style="max-width:270px;background:${t.primary};color:#fff;border-radius:18px 18px 6px 18px;padding:11px 14px"><div class="t15">${txt}</div></div></div>`
    : `<div class="row gap8 mt10" style="align-items:flex-end"><div class="av" style="width:34px;height:34px;font-size:15px;background:linear-gradient(135deg,#FB7185,#F59E0B);flex:none">A</div><div style="max-width:270px;background:#fff;border:1px solid ${t.border};border-radius:18px 18px 18px 6px;padding:11px 14px;box-shadow:${t.shadow}"><div class="t15">${txt}</div></div></div>`;
  const body = `
  ${statusBar('Android', t)}
  ${appBarAndroid(t,{title:'Coach Ava', backIcon:'back', actions:[{icon:'video'},{icon:'dots'}]})}
  <div class="scroll"><div class="pad">
    <div class="center"><span class="tag">Today</span></div>
    ${bub(false,'Morning Jonas! You&rsquo;re 800 ml behind your usual water pace. Big meeting day?')}
    ${bub(true,'Yeah — back to back until 4. Any quick tips?')}
    ${bub(false,'Keep a glass at your desk and finish it every hour. I&rsquo;ll nudge you at 11, 1 and 3. Deal?')}
    ${bub(true,'Deal. Also — is my streak safe if I skip meditation once?')}
    ${bub(false,'Totally. One rest day won&rsquo;t break a 12-week streak. Consistency beats perfection.')}
    <div class="chips mt12">${['Log water','Start workout','Breathing exercise'].map(c=>`<div class="chip">${c}</div>`).join('')}</div>
  </div></div>
  <div style="flex:none;padding:10px 16px 26px" class="rel">
    <div class="row gap10"><div class="grow">${textField(t,{ph:'Message Ava…'})}</div><div style="width:50px;height:50px;border-radius:50%;background:${t.primary};display:flex;align-items:center;justify-content:center;flex:none">${ic('send',22,'#fff',2)}</div></div>
    <div class="gesturebar"></div>
  </div>`;
  return { body };
}
function bVitalisSubscription(t){
  const feat=x=>`<div class="row gap10 mt10"><span style="color:${t.primary}">${ic('check',19,'currentColor',2.6)}</span><span class="t15">${x}</span></div>`;
  const body = `
  ${statusBar('iOS', t)}
  <div class="nav"><div class="nav-top"><div class="nav-back">${ic('x',22,t.text,2)}</div><div></div></div></div>
  <div class="scroll"><div class="pad center">
    <div class="av" style="width:76px;height:76px;font-size:30px;background:linear-gradient(135deg,#0D9488,#5EEAD4);margin:4px auto">${ic('sparkles',36,'#fff',1.8)}</div>
    <div class="t24 w800 mt12">Vitalis Plus</div>
    <div class="t15 muted mt6">Your habits, supercharged.</div>
    <div style="text-align:left" class="mt16 card card-p">
      ${feat('AI coach with adaptive plans')}
      ${feat('Advanced streaks & insights')}
      ${feat('Apple Health & Garmin sync')}
      ${feat('Guided meditations library')}
    </div>
    <div class="card card-p mt12" style="border:2px solid ${t.primary};text-align:left"><div class="row gap12"><div class="rad on"></div><div class="grow"><div class="t16 w700">Yearly <span class="tag ml8" style="background:#CCFBF1;color:#0D9488">2 months free</span></div><div class="t13 muted">€4.99/month, billed yearly</div></div><div class="t18 w800">€59</div></div></div>
    <div class="card card-p mt10" style="text-align:left"><div class="row gap12"><div class="rad"></div><div class="grow"><div class="t16 w700">Monthly</div><div class="t13 muted">Billed monthly</div></div><div class="t18 w800">€5.99</div></div></div>
    <div class="mt16">${btn('Start 14-day free trial')}</div>
    <div class="t12 faint mt10">Free for 14 days, then €59/year. Cancel anytime.</div>
  </div></div><div class="rel"><div class="homebar"></div></div>`;
  return { body };
}
function bVitalisProfile(t){
  const body = `
  ${statusBar('iOS', t)}
  <div class="nav"><div class="nav-top"><div></div><div class="nav-actions"><span style="color:${t.text}">${ic('sliders',22,'currentColor',1.9)}</span></div></div><div class="nav-large">Profile</div></div>
  <div class="scroll"><div class="pad center">
    ${avatar('JW',t.primary,88,30)}
    <div class="t22 w800 mt12">Jonas Weber</div>
    <div class="t14 muted">Member since January 2026</div>
    <div class="mt10"><span class="tag" style="background:#FFE4E6;color:#BE123C"><span class="row gap6" style="display:inline-flex;align-items:center;gap:6px">${ic('flame',14,'currentColor',2)} 12-week streak</span></span></div>
    <div class="stat3 mt16"><div><div class="t20 w800">86%</div><div class="t12 muted">Adherence</div></div><div><div class="t20 w800">214</div><div class="t12 muted">Workouts</div></div><div><div class="t20 w800">38</div><div class="t12 muted">Meditations</div></div></div>
  </div>
  <div class="pad mt16"><div class="li-group">
    ${listItem(t,{icon:'trend', title:'My stats', iconBg:t.primarySoft})}
    ${listItem(t,{icon:'users', title:'Challenges', sub:'2 active', iconBg:'#FFE4E6', iconColor:t.accent, badge:'2'})}
    ${listItem(t,{icon:'award', title:'Achievements', sub:'14 unlocked', iconBg:'#FEF3C7', iconColor:'#B45309'})}
    ${listItem(t,{icon:'sliders', title:'Settings', iconBg:t.surface, iconColor:t.muted})}
  </div></div></div>
  ${tabBar(t,[{id:'home',icon:'home',label:'Home'},{id:'stats',icon:'trend',label:'Activity'},{id:'coach',icon:'chat',label:'Coach'},{id:'me',icon:'user',label:'Profile'}],'me')}`;
  return { body };
}
function bVitalisSettings(t){
  const body = `
  ${statusBar('Android', t)}
  ${appBarAndroid(t,{title:'Settings'})}
  <div class="scroll"><div class="pad">
    <div class="t13 w700 muted mb8" style="letter-spacing:.06em">GENERAL</div>
    <div class="mb12">${dropdown(t,'Units','Metric (kg, km, ml)')}</div>
    <div class="mb12">${dropdown(t,'Week starts on','Monday')}</div>
    <div class="t13 w700 muted mt20 mb8" style="letter-spacing:.06em">REMINDERS</div>
    <div class="li-group">
      ${toggleRow(t,'bell','Habit reminders','Gentle nudges through the day',true)}
      ${toggleRow(t,'drop','Water reminders','Every 2 hours, 8 AM – 8 PM',true)}
      ${toggleRow(t,'moon','Bedtime wind-down','30 min before sleep',false)}
    </div>
    <div class="t15 w700 mt20 mb8">Reminder intensity</div>
    <div class="card card-p"><div class="row gap12"><span class="t13 muted">Soft</span><div class="grow">${slider(t,55)}</div><span class="t13 muted">Firm</span></div></div>
    <div class="t13 w700 muted mt20 mb8" style="letter-spacing:.06em">CONNECTIONS</div>
    <div class="li-group">
      ${listItem(t,{icon:'activity', title:'Apple Health', value:'Connected', iconBg:t.primarySoft, chev:false})}
      ${listItem(t,{icon:'watch', title:'Garmin', value:'Not connected', iconBg:t.surface, iconColor:t.muted})}
    </div>
  </div></div>
  ${bottomNav(t,[{id:'home',icon:'home',label:'Home'},{id:'stats',icon:'trend',label:'Activity'},{id:'coach',icon:'chat',label:'Coach'},{id:'me',icon:'user',label:'Profile'}],'me')}`;
  return { body };
}
function bVitalisNotifications(t){
  const ni=(icon,bg,fg,title,sub,time,unread)=>`
    <div class="li"><span class="dot" style="${unread?'':'visibility:hidden'};${unread?`background:${t.accent}`:''}"></span>
      <div style="width:44px;height:44px;border-radius:14px;background:${bg};display:flex;align-items:center;justify-content:center;color:${fg};flex:none">${ic(icon,21,'currentColor',1.9)}</div>
      <div class="grow"><div class="t15 w600 ellip">${title}</div><div class="t13 muted ellip">${sub}</div></div>
      <span class="t12 faint" style="flex:none">${time}</span></div>`;
  const body = `
  ${statusBar('iOS', t)}
  <div class="nav"><div class="nav-top"><div></div><div class="nav-actions"><span class="t15 w600" style="color:${t.primary}">Mark all read</span></div></div><div class="nav-large">Notifications</div></div>
  <div class="scroll"><div class="pad"><div class="li-group">
    ${ni('flame','#FFE4E6','#E11D48','Streak at risk!','Meditation still open today','1h',true)}
    ${ni('pin','#CCFBF1','#0D9488','New studio nearby','Atem Yoga · 400 m from you','4h',true)}
    ${ni('trend','#CCFBF1','#0D9488','Weekly report','You hit 86% of habits — new best','1d',false)}
    ${ni('users','#FEF3C7','#B45309','Challenge update','Mia overtook you in “October Miles”','2d',false)}
  </div></div></div>
  ${tabBar(t,[{id:'home',icon:'home',label:'Home'},{id:'stats',icon:'trend',label:'Activity'},{id:'coach',icon:'chat',label:'Coach'},{id:'me',icon:'user',label:'Profile'}],'home')}`;
  return { body };
}
function bVitalisEmpty(t){
  const body = `
  ${statusBar('Android', t)}
  ${appBarAndroid(t,{title:'Saved studios'})}
  <div class="scroll"><div class="pad" style="padding-top:90px">
    ${emptyState(t, `<svg width="180" height="150" viewBox="0 0 180 150"><circle cx="90" cy="70" r="44" fill="${t.primarySoft}"/><path d="M70 70h-8M118 70h-8M70 62v16M110 62v16" stroke="${t.primary}" stroke-width="7" stroke-linecap="round"/><rect x="52" y="108" width="76" height="10" rx="5" fill="${t.primary}" opacity=".3"/><circle cx="140" cy="40" r="7" fill="${t.accent}" opacity=".7"/></svg>`,
      'No saved studios yet', 'Discover yoga, pilates and gyms near you and save your favorites here.', btn('Find studios','pin'))}
  </div></div>
  ${bottomNav(t,[{id:'home',icon:'home',label:'Home'},{id:'stats',icon:'trend',label:'Activity'},{id:'coach',icon:'chat',label:'Coach'},{id:'me',icon:'user',label:'Profile'}],'home')}`;
  return { body };
}
function bVitalisMap(t){
  const pin=(x,y,label)=>`<g><path d="M${x} ${y}c-9 0-14-6-14-13 0-8 6-14 14-14s14 6 14 14c0 7-5 13-14 13z" fill="${t.primary}" transform="translate(0,4)"/><circle cx="${x}" cy="${y-9}" r="5.5" fill="#fff"/></g>`;
  const body = `
  ${statusBar('Android', t)}
  ${appBarAndroid(t,{title:'Nearby studios', actions:[{icon:'sliders'}]})}
  <div class="scroll" style="position:relative">
    <svg viewBox="0 0 390 560" width="390" height="560" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0">
      <rect width="390" height="560" fill="#F0FDFA"/>
      <path d="M-20 120 Q120 100 220 140 T420 120" stroke="#fff" stroke-width="26" fill="none"/>
      <path d="M-20 300 Q140 280 260 320 T420 300" stroke="#fff" stroke-width="34" fill="none"/>
      <path d="M-20 470 Q160 440 300 480 T420 460" stroke="#fff" stroke-width="22" fill="none"/>
      <path d="M90 -20 Q110 200 80 400 T100 580" stroke="#fff" stroke-width="20" fill="none"/>
      <path d="M250 -20 Q230 220 260 420 T240 580" stroke="#fff" stroke-width="28" fill="none"/>
      <path d="M-20 200 Q200 240 420 180" stroke="#BAE6FD" stroke-width="18" fill="none" opacity=".8"/>
      <ellipse cx="310" cy="420" rx="70" ry="52" fill="#BBF7D0" opacity=".8"/>
      <ellipse cx="90" cy="380" rx="46" ry="34" fill="#BBF7D0" opacity=".6"/>
      ${pin(150,190)}${pin(235,330)}${pin(110,430)}
      <circle cx="195" cy="270" r="10" fill="${t.accent}" stroke="#fff" stroke-width="4"/>
      <circle cx="195" cy="270" r="20" fill="${t.accent}" opacity=".2"/>
    </svg>
    <div class="abs" style="top:12px;left:16px;right:16px">${searchBar(t,'Search studios, classes…',{solid:true})}</div>
    <div class="abs" style="top:70px;left:16px;right:16px"><div class="chips">${['Yoga','Pilates','Gym','Swimming'].map((c,i)=>`<div class="chip${i===0?' on brand':''}">${c}</div>`).join('')}</div></div>
    <div class="abs" style="bottom:14px;left:16px;right:16px">
      <div class="card card-p"><div class="row gap12">
        <div style="width:58px;height:58px;border-radius:14px;background:linear-gradient(135deg,#0D9488,#5EEAD4);flex:none;display:flex;align-items:center;justify-content:center;color:#fff">${ic('pin',26,'currentColor',1.9)}</div>
        <div class="grow"><div class="t15 w800">Atem Yoga Studio</div><div class="row gap6 mt2"><span>${stars(5,12)}</span><span class="t13 muted">4.9 · 400 m</span></div></div>
        <div>${btn('Book','sm')}</div>
      </div></div>
    </div>
  </div>
  ${bottomNav(t,[{id:'home',icon:'home',label:'Home'},{id:'stats',icon:'trend',label:'Activity'},{id:'coach',icon:'chat',label:'Coach'},{id:'me',icon:'user',label:'Profile'}],'home')}`;
  return { body };
}
function bVitalisSearch(t){
  const body = `
  ${statusBar('Android', t)}
  <div style="flex:none;padding:8px 16px 4px">${searchBar(t,'Search habits, workouts, recipes',{solid:true, filter:true})}</div>
  <div class="scroll"><div class="pad">
    <div class="mt8 mb12">${chips(t,['All','Habits','Workouts','Recipes','Meditations'],0)}</div>
    <div class="t13 w700 muted mb8" style="letter-spacing:.06em">POPULAR HABITS</div>
    <div class="li-group">
      ${listItem(t,{icon:'drop', title:'Drink 2.5 L water', sub:'Hydration · 2.1M doing this', iconBg:'#CCFBF1', iconColor:t.primary})}
      ${listItem(t,{icon:'activity', title:'Walk 10,000 steps', sub:'Movement · 3.4M doing this', iconBg:'#FFE4E6', iconColor:t.accent})}
      ${listItem(t,{icon:'book', title:'Read 20 pages', sub:'Mind · 1.8M doing this', iconBg:'#FEF3C7', iconColor:'#B45309'})}
      ${listItem(t,{icon:'moon', title:'Sleep by 11 PM', sub:'Recovery · 2.6M doing this', iconBg:'#E0E7FF', iconColor:'#4F46E5'})}
    </div>
    <div class="t13 w700 muted mt20 mb8" style="letter-spacing:.06em">TRENDING WORKOUTS</div>
    <div class="li-group">
      ${listItem(t,{icon:'dumbbell', title:'Full-body HIIT · 20 min', sub:'No equipment · 4.9', iconBg:t.primarySoft})}
      ${listItem(t,{icon:'zap', title:'Morning yoga flow', sub:'15 min · Beginner', iconBg:'#FFE4E6', iconColor:t.accent})}
    </div>
  </div></div>
  ${bottomNav(t,[{id:'home',icon:'home',label:'Home'},{id:'stats',icon:'trend',label:'Activity'},{id:'coach',icon:'chat',label:'Coach'},{id:'me',icon:'user',label:'Profile'}],'home')}`;
  return { body };
}
function bVitalisLogger(t){
  const dim = `
  ${statusBar('iOS', t)}
  <div class="nav"><div class="nav-top" style="opacity:.35"><div><div class="t13 muted">TUESDAY, OCT 15</div><div class="t24 w800">Good morning, Jonas</div></div></div></div>
  <div class="scroll"><div class="pad" style="opacity:.35"><div class="card card-p"><div class="t17 w800">1.2 of 2.5 L</div>${progressBar(48)}</div></div></div>`;
  const modal = modalBox(t, `
    <div class="av" style="width:64px;height:64px;background:${t.primarySoft};margin:0 auto">${ic('drop',30,t.primary,2)}</div>
    <div class="t20 w800 mt12">Log water</div>
    <div class="t14 muted mt4 mb16">How much did you drink?</div>
    <div class="row" style="justify-content:center">${stepper(t,2,'glasses')}</div>
    <div class="chips mt16" style="justify-content:center">${['250 ml','500 ml','750 ml'].map((c,i)=>`<div class="chip${i===1?' on brand':''}">${c}</div>`).join('')}</div>
    <div class="t28 w800 mt12">500 <span class="t16 w500 muted">ml</span></div>
    <div class="mt16">${btn('Log water')}</div>`);
  return { body: dim + modal + `<div class="homebar light"></div>` };
}
SCREENS.push(
  { id:'vitalis-welcome-01', app:'vitalis', app_name:'Vitalis', title:'Welcome', pattern:'Welcome', platform:'iOS', category:'Lifestyle', elements:['Button'], build:bVitalisWelcome, colors:['#FDFDFD','#F0FDFA','#0D9488','#FB7185','#FACC15'] },
  { id:'vitalis-home-02', app:'vitalis', app_name:'Vitalis', title:'Home — habits', pattern:'Home', platform:'iOS', category:'Lifestyle', elements:['Card','Progress Bar','Checkbox','FAB','Avatar','Banner'], build:bVitalisHome, colors:['#FDFDFD','#F0FDFA','#0D9488','#FB7185','#134E4A'] },
  { id:'vitalis-stats-03', app:'vitalis', app_name:'Vitalis', title:'Activity', pattern:'Activity/Stats', platform:'Android', category:'Lifestyle', elements:['Chart','Segmented Control','Progress Bar'], build:bVitalisStats, colors:['#FDFDFD','#F0FDFA','#0D9488','#FB7185','#134E4A'] },
  { id:'vitalis-calendar-04', app:'vitalis', app_name:'Vitalis', title:'Calendar', pattern:'Calendar', platform:'iOS', category:'Lifestyle', elements:['Calendar','Badge','List Item','Card'], build:bVitalisCalendar, colors:['#FDFDFD','#F0FDFA','#0D9488','#FB7185','#4F46E5'] },
  { id:'vitalis-coach-05', app:'vitalis', app_name:'Vitalis', title:'Chat — coach', pattern:'Chat', platform:'Android', category:'Lifestyle', elements:['Avatar','Text Field','Chip','Card'], build:bVitalisCoach, colors:['#FDFDFD','#F0FDFA','#0D9488','#FB7185','#134E4A'] },
  { id:'vitalis-subscription-06', app:'vitalis', app_name:'Vitalis', title:'Subscription — Vitalis Plus', pattern:'Subscription', platform:'iOS', category:'Lifestyle', elements:['Radio','Button','Card'], build:bVitalisSubscription, colors:['#FDFDFD','#F0FDFA','#0D9488','#FB7185','#5EEAD4'] },
  { id:'vitalis-profile-07', app:'vitalis', app_name:'Vitalis', title:'Profile', pattern:'Profile', platform:'iOS', category:'Lifestyle', elements:['Avatar','Button','List Item','Badge'], build:bVitalisProfile, colors:['#FDFDFD','#F0FDFA','#0D9488','#FB7185','#134E4A'] },
  { id:'vitalis-settings-08', app:'vitalis', app_name:'Vitalis', title:'Settings', pattern:'Settings', platform:'Android', category:'Lifestyle', elements:['Toggle','Dropdown','Slider','List Item'], build:bVitalisSettings, colors:['#FDFDFD','#F0FDFA','#0D9488','#FB7185','#6B7280'] },
  { id:'vitalis-notifications-09', app:'vitalis', app_name:'Vitalis', title:'Notifications', pattern:'Notifications', platform:'iOS', category:'Lifestyle', elements:['List Item','Badge','Avatar'], build:bVitalisNotifications, colors:['#FDFDFD','#F0FDFA','#0D9488','#FB7185','#E11D48'] },
  { id:'vitalis-empty-10', app:'vitalis', app_name:'Vitalis', title:'Empty state — saved studios', pattern:'Empty State', platform:'Android', category:'Lifestyle', elements:['Button'], build:bVitalisEmpty, colors:['#FDFDFD','#F0FDFA','#0D9488','#FB7185','#134E4A'] },
  { id:'vitalis-map-11', app:'vitalis', app_name:'Vitalis', title:'Map — nearby studios', pattern:'Map', platform:'Android', category:'Lifestyle', elements:['Search Bar','Chip','Card','Button','Avatar'], build:bVitalisMap, colors:['#F0FDFA','#FFFFFF','#0D9488','#FB7185','#BAE6FD'] },
  { id:'vitalis-search-12', app:'vitalis', app_name:'Vitalis', title:'Search', pattern:'Search', platform:'Android', category:'Lifestyle', elements:['Search Bar','Chip','List Item'], build:bVitalisSearch, colors:['#FDFDFD','#F0FDFA','#0D9488','#FB7185','#B45309'] },
  { id:'vitalis-water-logger-13', app:'vitalis', app_name:'Vitalis', title:'Log water — modal', pattern:'Activity/Stats', platform:'iOS', category:'Lifestyle', elements:['Modal','Stepper','Button','Chip','Progress Bar'], build:bVitalisLogger, colors:['#FDFDFD','#F0FDFA','#0D9488','#FB7185','#134E4A'] },
);

// ================= FLOWS / APPS / PATTERNS / ELEMENTS =================
const FLOWS = [
  { id:'noted-create-task', app_id:'noted', app_name:'Noted', title:'Create a task with reminder',
    description:'Add a new task from Home, set a reminder date and time, and get a confirmation toast.',
    category:'Productivity', platform:'iOS', popularity:88, created:'2026-10-15',
    steps:[
      { screen_id:'noted-home-04', caption:'Start from Home', hotspot:{x:88,y:92,label:'Tap +'} },
      { screen_id:'noted-new-task-13', caption:'Fill in the task', hotspot:{x:50,y:60,label:'Type task title'} },
      { screen_id:'noted-date-picker-14', caption:'Pick a date and time', hotspot:{x:51,y:24,label:'Tap Oct 22'} },
      { screen_id:'noted-task-done-15', caption:'Toast confirms the reminder', hotspot:{x:50,y:84,label:'Task created'} },
    ]},
  { id:'maison-buy-chair', app_id:'maison', app_name:'Maison', title:'Buy a chair',
    description:'Search for a lounge chair, open the product, add it to the bag and check out.',
    category:'Shopping', platform:'iOS', popularity:91, created:'2026-10-15',
    steps:[
      { screen_id:'maison-home-02', caption:'Start from Home', hotspot:{x:50,y:14,label:'Tap search'} },
      { screen_id:'maison-search-03', caption:'Find the chair', hotspot:{x:28,y:36,label:'Tap Aria Lounge Chair'} },
      { screen_id:'maison-product-04', caption:'Review details and options', hotspot:{x:75,y:94,label:'Tap Add to bag'} },
      { screen_id:'maison-cart-05', caption:'Review the bag', hotspot:{x:50,y:93,label:'Tap Checkout'} },
      { screen_id:'maison-checkout-06', caption:'Enter shipping details', hotspot:{x:50,y:93,label:'Continue to payment'} },
      { screen_id:'maison-order-confirmed-13', caption:'Order confirmed', hotspot:{x:50,y:88,label:'Track order'} },
    ]},
  { id:'orbit-post-photo', app_id:'orbit', app_name:'Orbit', title:'Post a photo',
    description:'Compose a new post from Home, add a caption and share it to the feed.',
    category:'Social', platform:'iOS', popularity:86, created:'2026-10-15',
    steps:[
      { screen_id:'orbit-home-03', caption:'Start from Home', hotspot:{x:50,y:95,label:'Tap Post'} },
      { screen_id:'orbit-composer-05', caption:'Pick a photo', hotspot:{x:50,y:72,label:'Add caption'} },
      { screen_id:'orbit-caption-13', caption:'Write a caption', hotspot:{x:85,y:8,label:'Tap Share'} },
      { screen_id:'orbit-feed-12', caption:'Post appears in the feed', hotspot:{x:50,y:45,label:'New post'} },
    ]},
  { id:'bright-enroll-course', app_id:'bright', app_name:'Bright', title:'Enroll in a course',
    description:'Open a course from Home, enroll through the paywall and checkout, then start learning.',
    category:'Education', platform:'iOS', popularity:84, created:'2026-10-15',
    steps:[
      { screen_id:'bright-home-03', caption:'Start from Home', hotspot:{x:50,y:38,label:'Tap Design Systems 101'} },
      { screen_id:'bright-course-05', caption:'Review the course', hotspot:{x:70,y:95,label:'Tap Enroll now'} },
      { screen_id:'bright-paywall-08', caption:'Choose Bright Pro or single course', hotspot:{x:50,y:86,label:'Start free trial'} },
      { screen_id:'bright-checkout-13', caption:'Pay for the course', hotspot:{x:50,y:93,label:'Tap Pay €39.00'} },
      { screen_id:'bright-enrolled-14', caption:'Enrolled — start learning', hotspot:{x:50,y:70,label:'Tap Start learning'} },
    ]},
  { id:'vitalis-log-water', app_id:'vitalis', app_name:'Vitalis', title:'Log water intake',
    description:'Log a glass of water from Home and watch the activity stats update.',
    category:'Lifestyle', platform:'iOS', popularity:82, created:'2026-10-15',
    steps:[
      { screen_id:'vitalis-home-02', caption:'Start from Home', hotspot:{x:62,y:30,label:'Tap Log water'} },
      { screen_id:'vitalis-water-logger-13', caption:'Choose the amount', hotspot:{x:50,y:74,label:'Tap Log water'} },
      { screen_id:'vitalis-stats-03', caption:'Stats update instantly', hotspot:{x:50,y:62,label:'Water chart'} },
    ]},
  { id:'orbit-verify-phone', app_id:'orbit', app_name:'Orbit', title:'Verify phone number',
    description:'Sign up, enter the SMS code, and land on Home verified.',
    category:'Social', platform:'iOS', popularity:79, created:'2026-10-15',
    steps:[
      { screen_id:'orbit-signup-01', caption:'Create an account', hotspot:{x:50,y:78,label:'Tap Sign up'} },
      { screen_id:'orbit-otp-02', caption:'Enter the SMS code', hotspot:{x:50,y:50,label:'Type code'} },
      { screen_id:'orbit-otp-success-13', caption:'Number verified', hotspot:{x:50,y:82,label:'Tap Continue'} },
      { screen_id:'orbit-home-03', caption:'Land on Home', hotspot:{x:50,y:50,label:'Explore feed'} },
    ]},
];
const APPS = [
  { id:'noted', name:'Noted', tagline:'A calmer to-do list', category:'Productivity', platforms:['iOS','Android'], brand_color:'#4F46E5', icon:'assets/apps/noted.png', description:'Noted is a calm task manager that turns chaotic days into clear, finishable plans. Capture tasks in seconds, time-block your calendar, and build streaks with gentle reminders — without the noise of traditional productivity apps.', featured:true },
  { id:'maison', name:'Maison', tagline:'Furniture for slow living', category:'Shopping', platforms:['iOS','Android'], brand_color:'#111111', icon:'assets/apps/maison.png', description:'Maison is a curated furniture store for warm minimalism. Browse editorial collections, filter by material and room, and check out in a few taps — with carbon-neutral delivery and a 30-day home trial on every piece.', featured:true },
  { id:'orbit', name:'Orbit', tagline:'Share your world', category:'Social', platforms:['iOS','Android'], brand_color:'#7C3AED', icon:'assets/apps/orbit.png', description:'Orbit is a photo-first social network for people who chase light. Share moments, discover creators through a human-curated explore feed, and grow an audience with built-in insights — no algorithmic doomscrolling.', featured:true },
  { id:'bright', name:'Bright', tagline:'Learn anything, anywhere', category:'Education', platforms:['iOS','Android'], brand_color:'#2563EB', icon:'assets/apps/bright.png', description:'Bright makes learning a daily habit with bite-size video courses from working professionals. Follow adaptive study plans, chat with an AI tutor, earn shareable certificates, and keep a streak with just 15 minutes a day.', featured:false },
  { id:'vitalis', name:'Vitalis', tagline:'Build habits that stick', category:'Lifestyle', platforms:['iOS','Android'], brand_color:'#0D9488', icon:'assets/apps/vitalis.png', description:'Vitalis is a habit companion for water, movement, mindfulness and sleep. Log in seconds, get nudges from an adaptive AI coach, find nearby studios on the map, and watch streaks compound into a healthier routine.', featured:false },
];
const PATTERNS = [
  ['onboarding','Onboarding','First-run screens that introduce the app and its value.'],
  ['welcome','Welcome','Branded entry screen with a clear next step.'],
  ['login','Login','Sign-in form for returning users.'],
  ['sign-up','Sign Up','Registration form for new accounts.'],
  ['forgot-password','Forgot Password','Password reset request flow.'],
  ['otp-verification','OTP Verification','One-time code entry to verify identity.'],
  ['home','Home','Main landing screen after sign-in.'],
  ['feed','Feed','Scrolling content stream.'],
  ['search','Search','Find content with filters and results.'],
  ['profile','Profile','User identity, stats and account menu.'],
  ['settings','Settings','Preferences, toggles and account controls.'],
  ['notifications','Notifications','Activity alerts grouped by time.'],
  ['cart','Cart','Review selected items before purchase.'],
  ['checkout','Checkout','Address, shipping and order review steps.'],
  ['payment-method','Payment Method','Card entry and payment options.'],
  ['subscription','Subscription','Plan selection for recurring billing.'],
  ['paywall','Paywall','Upgrade prompt gating premium features.'],
  ['empty-state','Empty State','Friendly placeholder for no content.'],
  ['error-state','Error State','Recovery screen for failed loads.'],
  ['calendar','Calendar','Month grid and scheduled items.'],
  ['map','Map','Location view with pins and place cards.'],
  ['chat','Chat','Conversation thread with message bubbles.'],
  ['activity-stats','Activity/Stats','Charts and metrics summarizing activity.'],
  ['post-composer','Post Composer','Create-and-publish sheet for new posts.'],
  ['product-detail','Product Detail','Item page with options and purchase CTA.'],
  ['course-detail','Course Detail','Course overview with curriculum and enroll CTA.'],
].map(([id,name,description])=>({id,name,description}));
const ELEMENTS = [
  ['button','Button','Primary, ghost and dark call-to-action buttons.'],
  ['card','Card','Elevated content container with rounded corners.'],
  ['tab-bar','Tab Bar','Bottom navigation with icons and labels.'],
  ['bottom-sheet','Bottom Sheet','Slide-up panel over dimmed content.'],
  ['modal','Modal','Centered dialog requiring a decision.'],
  ['search-bar','Search Bar','Text input for queries with icon.'],
  ['carousel','Carousel','Horizontal snap-scrolling card row.'],
  ['toggle','Toggle','On/off switch for settings.'],
  ['slider','Slider','Draggable control for a value range.'],
  ['progress-bar','Progress Bar','Linear indicator of completion.'],
  ['avatar','Avatar','Circular user mark with initials or gradient.'],
  ['badge','Badge','Count pill for unread or status.'],
  ['chip','Chip','Compact filter or tag pill.'],
  ['fab','FAB','Floating action button for the primary action.'],
  ['segmented-control','Segmented Control','Inline single-select option group.'],
  ['list-item','List Item','Row with icon, title, subtitle and chevron.'],
  ['text-field','Text Field','Labeled input for text entry.'],
  ['checkbox','Checkbox','Multi-select square or round check.'],
  ['radio','Radio','Single-select circular option.'],
  ['dropdown','Dropdown','Collapsed select showing the chosen value.'],
  ['date-picker','Date Picker','Day strip and calendar for picking dates.'],
  ['chart','Chart','Bar, line and ring data visualizations.'],
  ['skeleton','Skeleton','Shimmer placeholder while content loads.'],
  ['toast','Toast','Temporary confirmation message.'],
  ['banner','Banner','Inline promotional or informational strip.'],
  ['accordion','Accordion','Expandable section list.'],
  ['stepper','Stepper','Plus/minus quantity control.'],
  ['rating','Rating','Star display for scores and reviews.'],
].map(([id,name,description])=>({id,name,description}));
const REQUIRED_ELEMENTS = ['Button','Card','Tab Bar','Bottom Sheet','Modal','Search Bar','Carousel','Toggle','Slider','Progress Bar','Avatar','Badge','Chip','FAB','Segmented Control','List Item','Text Field','Checkbox','Radio','Dropdown','Date Picker','Chart','Skeleton','Toast','Banner','Accordion','Stepper','Rating'];
const REQUIRED_PATTERNS = ['Onboarding','Welcome','Login','Sign Up','Forgot Password','OTP Verification','Home','Feed','Search','Profile','Settings','Notifications','Cart','Checkout','Payment Method','Subscription','Paywall','Empty State','Error State','Calendar','Map','Chat','Activity/Stats'];

function writeDataFiles(){
  const recs = SCREENS.map(def=>{
    const t = THEMES[def.app];
    return {
      id: def.id, app_id: def.app, app_name: def.app_name, title: def.title,
      pattern: def.pattern, elements: def.elements, platform: def.platform, category: def.category,
      colors: def.colors,
      tokens: { bg:t.bg, surface:t.surface, primary:t.primary, text:t.text, muted:t.muted, radius:t.radius, font:t.font },
      text: (def._text||'').replace(/\n+/g,' ').replace(/ {2,}/g,' ').trim(),
      image: 'assets/screens/'+def.id+'.png', width:390, height:844,
      popularity: popularity(def.id, 40, 98), created:'2026-10-15',
    };
  });
  fs.writeFileSync(path.join(DATA,'screens-b.json'), JSON.stringify(recs,null,1));
  fs.writeFileSync(path.join(DATA,'flows-b.json'), JSON.stringify(FLOWS,null,1));
  fs.writeFileSync(path.join(DATA,'apps-b.json'), JSON.stringify(APPS,null,1));
  fs.writeFileSync(path.join(DATA,'patterns-b.json'), JSON.stringify(PATTERNS,null,1));
  fs.writeFileSync(path.join(DATA,'elements-b.json'), JSON.stringify(ELEMENTS,null,1));
  // coverage report
  const elCount={}, patCount={}, plat={iOS:0,Android:0};
  for(const d of SCREENS){ d.elements.forEach(e=>elCount[e]=(elCount[e]||0)+1); patCount[d.pattern]=(patCount[d.pattern]||0)+1; plat[d.platform]++; }
  console.log('\n=== COVERAGE (slice B: '+SCREENS.length+' screens) ===');
  console.log('Platforms: iOS '+plat.iOS+' / Android '+plat.Android);
  const missE = REQUIRED_ELEMENTS.filter(e=>!elCount[e]);
  const missP = REQUIRED_PATTERNS.filter(p=>!patCount[p]);
  console.log('Elements: '+REQUIRED_ELEMENTS.length+'/'+REQUIRED_ELEMENTS.length+' required covered'+(missE.length?'  MISSING: '+missE.join(', '):''));
  console.log('Patterns: '+REQUIRED_PATTERNS.length+'/'+REQUIRED_PATTERNS.length+' required covered'+(missP.length?'  MISSING: '+missP.join(', '):''));
  console.log('\nElement counts:'); Object.keys(elCount).sort().forEach(e=>console.log('  '+e+': '+elCount[e]));
  console.log('\nPattern counts:'); Object.keys(patCount).sort().forEach(p=>console.log('  '+p+': '+patCount[p]));
  if(missE.length||missP.length){ console.error('\nCOVERAGE GAPS DETECTED'); process.exitCode=1; }
  return recs;
}

if(require.main===module) main().catch(e=>{ console.error(e); process.exit(1); });
