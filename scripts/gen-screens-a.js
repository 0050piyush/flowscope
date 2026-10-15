#!/usr/bin/env node
/* Flowscope seed generator — slice A (FinPulse, PulseFit, Wanderly, Crave, Tempo)
 * Builds polished 390x844 mobile screenshots with a small component library.
 * Usage: node scripts/gen-screens-a.js [--only <id-substring>] [--samples]
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'site/assets/screens');
const FONT_CSS = fs.readFileSync(path.join(ROOT, 'tmp/fonts/inter-font.css'), 'utf8');
fs.mkdirSync(OUT, { recursive: true });

// ---------- deterministic PRNG ----------
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const rand = mulberry32(20261015);

// ---------- themes ----------
const THEMES = {
  finpulse: { bg:'#0B1220', surface:'#141E33', surface2:'#1B2740', card:'#16203A', text:'#F8FAFC', muted:'#8FA0B8', faint:'#5B6B85', primary:'#22D3EE', primaryText:'#062A33', accent:'#10B981', danger:'#FB7185', border:'rgba(148,163,184,.14)', shadow:'0 12px 32px rgba(0,0,0,.45)', radius:'18px', dark:true,  font:'Inter' },
  pulsefit: { bg:'#0A0F0D', surface:'#111714', surface2:'#161D19', card:'#131A16', text:'#F4F7F2', muted:'#93A396', faint:'#5F6F62', primary:'#A3E635', primaryText:'#1A2E05', accent:'#22D3EE', danger:'#FB7185', border:'rgba(163,230,53,.12)', shadow:'0 12px 32px rgba(0,0,0,.5)', radius:'18px', dark:true,  font:'Inter' },
  wanderly: { bg:'#FFF7ED', surface:'#FFFFFF', surface2:'#FFFBF3', card:'#FFFFFF', text:'#1C1917', muted:'#78716C', faint:'#A8A29E', primary:'#EA580C', primaryText:'#FFFFFF', accent:'#0F766E', danger:'#E11D48', border:'rgba(28,25,23,.08)', shadow:'0 12px 28px rgba(120,53,15,.10)', radius:'18px', dark:false, font:'Inter' },
  crave:    { bg:'#FFFFFF', surface:'#FFF7F7', surface2:'#F8F8FA', card:'#FFFFFF', text:'#18181B', muted:'#71717A', faint:'#A1A1AA', primary:'#F43F5E', primaryText:'#FFFFFF', accent:'#FB7185', danger:'#E11D48', border:'rgba(24,24,27,.08)', shadow:'0 12px 28px rgba(244,63,94,.10)', radius:'18px', dark:false, font:'Inter' },
  tempo:    { bg:'#12071F', surface:'#1B0E2C', surface2:'#221239', card:'#1D1030', text:'#FAF5FF', muted:'#B79FD4', faint:'#7A6399', primary:'#A855F7', primaryText:'#FFFFFF', accent:'#EC4899', danger:'#FB7185', border:'rgba(168,85,247,.16)', shadow:'0 12px 32px rgba(0,0,0,.5)', radius:'18px', dark:true,  font:'Inter' },
};

// ---------- base CSS ----------
function baseCSS(t){
return `
${FONT_CSS}
*{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased}
html,body{width:390px;height:844px;overflow:hidden}
body{font-family:'Inter',system-ui,sans-serif;background:${t.bg};color:${t.text};font-size:15px;line-height:1.45}
.phone{width:390px;height:844px;background:${t.bg};color:${t.text};position:relative;overflow:hidden;display:flex;flex-direction:column}
.scroll{flex:1;overflow:hidden;position:relative}
.pad{padding:0 20px}
.row{display:flex;align-items:center}
.between{justify-content:space-between}
.grow{flex:1}
.mt4{margin-top:4px}.mt8{margin-top:8px}.mt12{margin-top:12px}.mt16{margin-top:16px}.mt20{margin-top:20px}.mt24{margin-top:24px}
.mb4{margin-bottom:4px}.mb8{margin-bottom:8px}.mb12{margin-bottom:12px}.mb16{margin-bottom:16px}
.gap8{gap:8px}.gap12{gap:12px}
.t12{font-size:12px}.t13{font-size:13px}.t14{font-size:14px}.t15{font-size:15px}.t17{font-size:17px}.t20{font-size:20px}.t24{font-size:24px}.t28{font-size:28px}.t34{font-size:34px}
.w400{font-weight:400}.w500{font-weight:500}.w600{font-weight:600}.w700{font-weight:700}
.muted{color:${t.muted}}.faint{color:${t.faint}}
.center{text-align:center}
.ellip{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
`;
}

// ---------- icon set (24x24 stroke icons) ----------
const P = {
  home:'M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z',
  wallet:'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 9h18M16 14h2',
  chart:'M4 20V10M10 20V4M16 20v-8M21 20H3',
  bell:'M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 0 0 4 0',
  gear:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.7h4l.4-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z',
  user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-6 8-6s8 2 8 6',
  search:'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  pin:'M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  cal:'M5 6h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM4 10h16M8 3v4M16 3v4',
  chat:'M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4z',
  heart:'M12 20s-7-4.3-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.7-9 9-9 9z',
  play:'M8 5v14l11-7z',
  pause:'M8 5h3v14H8zM13 5h3v14h-3z',
  plus:'M12 5v14M5 12h14',
  x:'M6 6l12 12M18 6L6 18',
  chevR:'M9 6l6 6-6 6',
  chevL:'M15 6l-6 6 6 6',
  chevD:'M6 9l6 6 6-6',
  back:'M15 5l-7 7 7 7',
  star:'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.8-5.4 2.8 1-6.1L3.2 9.5l6.1-.9z',
  check:'M5 12l5 5 9-10',
  card:'M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM2 10h20',
  send:'M3 11l18-8-8 18-2.5-7.5z',
  plane:'M10 20l-1.5-4.5L4 14l-1-2 6-1L14 4l2-1 1 7 5 3-1 2-4.5.5z',
  food:'M7 3v8M4 3v4a3 3 0 0 0 6 0V3M7 11v10M17 3c-2 2-3 5-3 8h3v10M17 11h4',
  music:'M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM9 18V4l12-2v13M9 6l12-2',
  bolt:'M13 2L4 14h6l-1 8 9-12h-6z',
  dumbbell:'M7 8v8M17 8v8M4 10v4M20 10v4M7 12h10',
  globe:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3.5 3 14 0 18M12 3c-3 3.5-3 14 0 18',
  clock:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  flame:'M12 22c4 0 7-2.8 7-7 0-3-2-5.5-3.5-7C14 6.5 13 5 13 2c-3 2-5 4.5-5.5 7C6 10 5 12 5 15c0 4.2 3 7 7 7z',
  shield:'M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6z',
  eye:'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  dots:'M5 12h.01M12 12h.01M19 12h.01',
  mic:'M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zM6 11a6 6 0 0 0 12 0M12 17v4',
  cam:'M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM12 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  edit:'M4 20l4-1 11-11-3-3L5 16zM13 7l3 3',
  info:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7h.01',
  warn:'M12 3l10 17H2zM12 10v4M12 17h.01',
  logout:'M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4M16 16l4-4-4-4M20 12H9',
  filter:'M4 5h16M7 12h10M10 19h4',
  ticket:'M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4zM13 6v2M13 11v2M13 16v2',
  gift:'M4 10h16v10H4zM4 6h16v4H4zM12 6v14M12 6S8 6 6 4a2 2 0 0 1 3-2c2 1 3 4 3 4zM12 6s4 0 6-2a2 2 0 0 0-3-2c-2 1-3 4-3 4z',
  crown:'M4 18h16M4 18l-1-9 5 3 4-6 4 6 5-3-1 9z',
  wifi:'M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0M12 19.5h.01',
  bag:'M6 8h12l1 12H5zM9 8V6a3 3 0 0 1 6 0v2',
  bike:'M6 17a2.5 2.5 0 1 0 0-.01M18 17a2.5 2.5 0 1 0 0-.01M6 17l3-7h6l3 7M9 10L7 5H4M15 10l2-5',
  bed:'M3 18v-8M3 14h18v4M6 14v-2a2 2 0 0 1 2-2h8a4 4 0 0 1 4 4',
  sliders:'M5 7h14M5 12h14M5 17h14M9 4v6M15 9v6M11 14v6',
};
function icon(name, size=22, color='currentColor', sw=1.8){
  const d = P[name] || P.info;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" style="flex:none;display:block"><path d="${d}"/></svg>`;
}

// ---------- chrome: status bar / nav bars / tab bars ----------
function statusBar(t, light){
  const c = t.dark ? '#fff' : '#111';
  const sig = `<svg width="18" height="12" viewBox="0 0 18 12" fill="${c}"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2" width="3" height="10" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1" opacity="0.35"/></svg>`;
  const wifi = `<svg width="16" height="12" viewBox="0 0 24 18" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round"><path d="M2 6a14 14 0 0 1 20 0M5.5 10a9 9 0 0 1 13 0M9 13.6a4 4 0 0 1 6 0"/><circle cx="12" cy="16.6" r="1.4" fill="${c}" stroke="none"/></svg>`;
  const bat = `<svg width="25" height="12" viewBox="0 0 27 12"><rect x="0.5" y="0.5" width="22" height="11" rx="3.5" fill="none" stroke="${c}" opacity="0.4"/><rect x="2" y="2" width="16" height="8" rx="2" fill="${c}"/><path d="M24.5 4v4a2 2 0 0 0 0-4z" fill="${c}" opacity="0.4"/></svg>`;
  return `<div class="row between" style="padding:14px 26px 6px 30px;flex:none">
    <div class="t15 w600" style="letter-spacing:-.2px;color:${c}">9:41</div>
    <div class="row gap8" style="gap:7px">${sig}${wifi}${bat}</div></div>`;
}
function iosNav({t, title, sub, left='back', right=null, large=true}){
  const leftIcon = left==='back'?icon('back',24,t.text):left==='close'?icon('x',24,t.text):'';
  return `<div style="flex:none;padding:6px 20px 4px">
    <div class="row between" style="height:40px">
      <div style="width:44px;margin-left:-8px">${leftIcon}</div>
      <div class="grow"></div>
      <div class="row gap8">${right||''}</div>
    </div>
    ${large?`<div class="t34 w700" style="letter-spacing:-.8px;margin-top:2px">${title}</div>${sub?`<div class="t14 muted mt4">${sub}</div>`:''}`
      :`<div class="t17 w600 center" style="margin-top:-32px;padding-bottom:8px">${title}</div>`}
  </div>`;
}
function androidBar({t, title, back=true, actions=[]}){
  return `<div class="row" style="flex:none;height:64px;padding:0 8px 0 4px;gap:4px">
    ${back?`<div style="padding:10px">${icon('back',24,t.text)}</div>`:'<div style="width:44px"></div>'}
    <div class="t20 w500 grow ellip" style="letter-spacing:-.2px">${title}</div>
    ${actions.map(a=>`<div style="padding:10px">${icon(a,22,t.text)}</div>`).join('')}
  </div>`;
}
function tabBar(t, items, active){
  return `<div style="flex:none;background:${t.dark?'rgba(10,14,22,.92)':'rgba(255,255,255,.94)'};border-top:1px solid ${t.border};padding:10px 6px 26px;display:flex;backdrop-filter:blur(20px)">
    ${items.map((it,i)=>`
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;color:${i===active?t.primary:t.faint}">
        ${icon(it.icon,24,'currentColor',i===active?2:1.8)}
        <div class="t12 ${i===active?'w600':'w500'}" style="font-size:10.5px">${it.label}</div>
      </div>`).join('')}
  </div>`;
}
function androidNav(t, items, active){
  return `<div style="flex:none;background:${t.surface};border-top:1px solid ${t.border};padding:12px 8px 24px;display:flex">
    ${items.map((it,i)=>`
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;color:${i===active?t.primary:t.faint}">
        <div style="${i===active?`background:${t.primary}22;border-radius:16px;padding:4px 20px;`:''}">${icon(it.icon,22,'currentColor',i===active?2:1.8)}</div>
        <div class="t12 ${i===active?'w600':'w500'}" style="font-size:11.5px">${it.label}</div>
      </div>`).join('')}
  </div>`;
}
function homeIndicator(t){
  return `<div style="flex:none;display:flex;justify-content:center;padding:8px 0 9px"><div style="width:134px;height:5px;border-radius:3px;background:${t.dark?'#fff':'#111'};opacity:.9"></div></div>`;
}

// ---------- atoms ----------
function btn(t, label, kind='primary', opts={}){
  const styles = {
    primary:`background:${t.primary};color:${t.primaryText}`,
    ghost:`background:transparent;color:${t.primary};border:1.5px solid ${t.primary}`,
    soft:`background:${t.primary}1f;color:${t.primary}`,
    danger:`background:${t.danger};color:#fff`,
    dark:`background:${t.text};color:${t.bg}`,
  };
  return `<div class="row center" style="${styles[kind]||styles.primary};border-radius:16px;padding:${opts.small?'10px 16px':'16px'};font-weight:600;font-size:${opts.small?'14px':'16px'};${opts.full===false?'':'width:100%'};${opts.style||''}">${opts.iconBefore||''}<span>${label}</span>${opts.iconAfter||''}</div>`;
}
function avatar(t, initials, size=48, grad=null){
  const g = grad || `linear-gradient(135deg,${t.primary},${t.accent})`;
  return `<div class="row center" style="width:${size}px;height:${size}px;border-radius:${size/2}px;background:${g};color:#fff;font-weight:700;font-size:${Math.round(size*0.34)}px;flex:none;letter-spacing:-.5px">${initials}</div>`;
}
function badge(t, text, kind='primary'){
  const bg = kind==='primary'?t.primary:kind==='danger'?t.danger:kind==='ok'?t.accent:t.muted;
  const fg = (kind==='primary'&&t.dark&&t===THEMES.finpulse)?'#062A33':'#fff';
  return `<div style="background:${bg};color:${fg==='#fff'?'#fff':fg};font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px;flex:none">${text}</div>`;
}
function toggle(t, on){
  return `<div style="width:51px;height:31px;border-radius:16px;background:${on?t.primary:(t.dark?'#3A4356':'#E4E4E7')};position:relative;flex:none;transition:all .2s">
    <div style="position:absolute;top:2px;${on?'right:2px':'left:2px'};width:27px;height:27px;border-radius:14px;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.25)"></div></div>`;
}
function progress(t, value, h=8){
  return `<div style="height:${h}px;border-radius:${h/2}px;background:${t.dark?'#2A3448':'#EDEDEF'};overflow:hidden"><div style="width:${value}%;height:100%;border-radius:${h/2}px;background:linear-gradient(90deg,${t.primary},${t.accent})"></div></div>`;
}
function slider(t, value){
  return `<div style="position:relative;height:28px;display:flex;align-items:center">
    <div style="height:4px;width:100%;border-radius:2px;background:linear-gradient(90deg,${t.primary} ${value}%,${t.dark?'#2A3448':'#E4E4E7'} ${value}%)"></div>
    <div style="position:absolute;left:calc(${value}% - 14px);width:28px;height:28px;border-radius:14px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.3);border:1px solid ${t.border}"></div></div>`;
}
function segmented(t, options, active){
  return `<div class="row" style="background:${t.dark?'#1A2338':'#F1F1F3'};border-radius:12px;padding:3px;gap:2px">
    ${options.map((o,i)=>`<div class="grow center t13 ${i===active?'w600':''}" style="padding:8px 4px;border-radius:9px;${i===active?`background:${t.dark?'#2C3A58':'#fff'};color:${t.text};box-shadow:0 1px 4px rgba(0,0,0,.12)`:`color:${t.muted}`}">${o}</div>`).join('')}
  </div>`;
}
function searchBar(t, placeholder, value=''){
  return `<div class="row gap8" style="background:${t.dark?'#1A2338':'#F1F1F4'};border-radius:14px;padding:12px 14px;gap:10px">
    ${icon('search',20,t.muted)}${value?`<div class="t15 grow ellip">${value}</div>`:`<div class="t15 muted grow">${placeholder}</div>`}
  </div>`;
}
function chips(t, items, active=0){
  return `<div class="row gap8" style="overflow:hidden;gap:8px">${items.map((c,i)=>`
    <div class="t13 ${i===active?'w600':'w500'}" style="flex:none;padding:9px 16px;border-radius:20px;${i===active?`background:${t.primary};color:${t.primaryText}`:`background:${t.dark?'#1A2338':'#F4F4F5'};color:${t.muted};border:1px solid ${t.border}`}">${c}</div>`).join('')}
  </div>`;
}
function listItem(t, {av=null, ic=null, title, sub=null, right=null, chevron=true, sub2=null}){
  return `<div class="row" style="padding:13px 0;gap:12px">
    ${av||''}${ic?`<div class="row center" style="width:46px;height:46px;border-radius:14px;background:${t.primary}1a;flex:none">${icon(ic,22,t.primary)}</div>`:''}
    <div class="grow" style="min-width:0">
      <div class="row between"><div class="t15 w600 ellip">${title}</div>${right||''}</div>
      ${sub?`<div class="t13 muted ellip mt4">${sub}</div>`:''}${sub2||''}
    </div>
    ${chevron?icon('chevR',18,t.faint):''}
  </div>`;
}
function card(t, inner, pad=16, extra=''){
  return `<div style="background:${t.card};border:1px solid ${t.border};border-radius:${t.radius};padding:${pad}px;box-shadow:${t.shadow};${extra}">${inner}</div>`;
}
function stars(t, value, size=16){
  let s='';
  for(let i=1;i<=5;i++){
    const fill = i<=Math.round(value)?t.primary:t.dark?'#2A3448':'#E4E4E7';
    s+=`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}"><path d="${P.star}"/></svg>`;
  }
  return `<div class="row" style="gap:3px">${s}</div>`;
}
function textField(t, {label, value='', placeholder='', icon:ic=null, secure=false}){
  return `<div><div class="t13 w600 mb8" style="color:${t.muted}">${label}</div>
    <div class="row" style="background:${t.dark?'#1A2338':'#F7F7F8'};border:1.5px solid ${t.border};border-radius:14px;padding:15px;gap:10px">
    ${ic?icon(ic,20,t.muted):''}<div class="t15 grow ellip" style="${value?'':'color:'+t.faint}">${secure?'•'.repeat(Math.min(value.length,12)): (value||placeholder)}</div></div></div>`;
}
function checkbox(t, checked, label, sub=null){
  return `<div class="row" style="gap:12px;padding:8px 0">
    <div class="row center" style="width:24px;height:24px;border-radius:8px;flex:none;${checked?`background:${t.primary}`:`border:2px solid ${t.faint}`}">${checked?icon('check',14,t.primaryText,3):''}</div>
    <div><div class="t15 w500">${label}</div>${sub?`<div class="t13 muted">${sub}</div>`:''}</div></div>`;
}
function radio(t, checked, title, sub=null, right=null){
  return `<div class="row" style="gap:12px;padding:12px 0">
    <div class="row center" style="width:24px;height:24px;border-radius:12px;flex:none;border:2px solid ${checked?t.primary:t.faint}">${checked?`<div style="width:12px;height:12px;border-radius:6px;background:${t.primary}"></div>`:''}</div>
    <div class="grow"><div class="t15 w600">${title}</div>${sub?`<div class="t13 muted mt4">${sub}</div>`:''}</div>${right||''}</div>`;
}
function dropdown(t, label, value){
  return `<div><div class="t13 w600 mb8" style="color:${t.muted}">${label}</div>
    <div class="row between" style="background:${t.dark?'#1A2338':'#F7F7F8'};border:1.5px solid ${t.border};border-radius:14px;padding:15px">
    <div class="t15 w500">${value}</div>${icon('chevD',18,t.muted)}</div></div>`;
}
function stepper(t, value, label){
  return `<div class="row between"><div class="t15 w500">${label}</div>
    <div class="row" style="gap:14px">
      <div class="row center" style="width:34px;height:34px;border-radius:17px;background:${t.dark?'#1A2338':'#F1F1F3'};color:${t.primary}">${icon('x',0,'',1)}<span class="t20 w600" style="color:${t.primary}">−</span></div>
      <div class="t17 w700" style="min-width:24px;text-align:center">${value}</div>
      <div class="row center" style="width:34px;height:34px;border-radius:17px;background:${t.primary};color:${t.primaryText}"><span class="t20 w700">+</span></div>
    </div></div>`;
}
function toast(t, msg, ic='check'){
  return `<div style="position:absolute;left:20px;right:20px;bottom:120px;z-index:50">
    <div class="row" style="background:${t.dark?'#1E293B':'#18181B'};color:#fff;border-radius:16px;padding:14px 16px;gap:12px;box-shadow:0 16px 40px rgba(0,0,0,.4)">
      <div class="row center" style="width:32px;height:32px;border-radius:16px;background:${t.accent};flex:none">${icon(ic,16,'#fff',2.4)}</div>
      <div class="t14 w500">${msg}</div></div></div>`;
}
function banner(t, msg, ic='info', kind='info'){
  const bg = kind==='promo'?`${t.primary}1a`:(t.dark?'#1A2338':'#F6F6F7');
  return `<div class="row" style="background:${bg};border:1px solid ${t.border};border-radius:14px;padding:12px 14px;gap:10px">
    ${icon(ic,20,t.primary)}<div class="t13 w500 grow">${msg}</div>${icon('x',16,t.faint)}</div>`;
}
function emptyState(t, {emoji, title, body, action}){
  return `<div class="center" style="padding:48px 32px">
    <div class="row center" style="width:120px;height:120px;border-radius:60px;background:${t.primary}14;margin:0 auto">${emoji}</div>
    <div class="t20 w700 mt20">${title}</div><div class="t14 muted mt8" style="line-height:1.6">${body}</div>
    <div class="mt20" style="max-width:220px;margin-left:auto;margin-right:auto">${btn(t, action, 'primary', {small:true})}</div></div>`;
}
function errorState(t, {title, body}){
  return `<div class="center" style="padding:56px 32px">
    <div class="row center" style="width:120px;height:120px;border-radius:60px;background:${t.danger}14;margin:0 auto">${icon('warn',52,t.danger,1.6)}</div>
    <div class="t20 w700 mt20">${title}</div><div class="t14 muted mt8" style="line-height:1.6">${body}</div>
    <div class="mt20" style="max-width:220px;margin-left:auto;margin-right:auto">${btn(t,'Try again','primary',{small:true})}</div>
    <div class="mt12">${btn(t,'Go back','ghost',{small:true})}</div></div>`;
}
function skeleton(t, h, w='100%'){
  return `<div style="height:${h}px;width:${w};border-radius:12px;background:linear-gradient(100deg,${t.dark?'#1A2338':'#EFEFEF'} 40%,${t.dark?'#24304A':'#F7F7F7'} 50%,${t.dark?'#1A2338':'#EFEFEF'} 60%)"></div>`;
}
function bottomSheet(t, {title, sub, body, cta}){
  return `<div style="position:absolute;left:0;right:0;bottom:0;z-index:40;background:${t.dark?'#182236':'#fff'};border-radius:28px 28px 0 0;padding:12px 20px 34px;box-shadow:0 -12px 40px rgba(0,0,0,.35);border-top:1px solid ${t.border}">
    <div class="row center" style="padding:4px 0 12px"><div style="width:44px;height:5px;border-radius:3px;background:${t.faint};opacity:.5"></div></div>
    <div class="t20 w700">${title}</div>${sub?`<div class="t14 muted mt4">${sub}</div>`:''}
    <div class="mt16">${body}</div>${cta?`<div class="mt16">${cta}</div>`:''}</div>`;
}
function modal(t, {title, body, confirm='Confirm', cancel='Cancel'}){
  return `<div style="position:absolute;inset:0;z-index:60;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:40px">
    <div style="background:${t.dark?'#1B2740':'#fff'};border-radius:24px;padding:24px;width:100%;box-shadow:0 24px 60px rgba(0,0,0,.4)">
      <div class="t17 w700 center">${title}</div><div class="t14 muted center mt8" style="line-height:1.6">${body}</div>
      <div class="row mt20" style="gap:10px"><div class="grow">${btn(t,cancel,'ghost',{small:true})}</div><div class="grow">${btn(t,confirm,'danger',{small:true})}</div></div>
    </div></div>`;
}
function fab(t, ic='plus', label=null){
  return `<div style="position:absolute;right:20px;bottom:118px;z-index:30">
    <div class="row center" style="background:${t.primary};color:${t.primaryText};border-radius:${label?28:30}px;${label?'padding:16px 22px':'width:60px;height:60px'};gap:8px;box-shadow:0 10px 28px ${t.primary}66">
    ${icon(ic,24,'currentColor',2)}${label?`<span class="t15 w700">${label}</span>`:''}</div></div>`;
}
function accordion(t, items){
  return items.map((it,i)=>`<div style="border-bottom:1px solid ${t.border};padding:16px 0">
    <div class="row between"><div class="t15 w600">${it.q}</div><div style="transform:rotate(${i===0?180:0}deg)">${icon('chevD',18,t.muted)}</div></div>
    ${i===0?`<div class="t14 muted mt8" style="line-height:1.6">${it.a}</div>`:''}</div>`).join('');
}
function dateStrip(t, days, active){
  return `<div class="row" style="gap:8px;overflow:hidden">${days.map((d,i)=>`
    <div class="center" style="flex:none;width:58px;padding:10px 0;border-radius:14px;${i===active?`background:${t.primary};color:${t.primaryText}`:`background:${t.dark?'#1A2338':'#F4F4F5'};border:1px solid ${t.border}`}">
      <div class="t12 ${i===active?'w700':''}" style="${i!==active?`color:${t.muted}`:''}">${d[0]}</div>
      <div class="t17 w700 mt4">${d[1]}</div></div>`).join('')}</div>`;
}
function calendarGrid(t, weeks, selected){
  const dn=['M','T','W','T','F','S','S'];
  return `<div><div class="row mb8">${dn.map(d=>`<div class="grow center t12 w600 muted">${d}</div>`).join('')}</div>
    ${weeks.map(w=>`<div class="row mb4">${w.map(d=>`
      <div class="grow center" style="padding:2px"><div class="row center t14 ${d===selected?'w700':''}" style="width:38px;height:38px;border-radius:19px;${d===selected?`background:${t.primary};color:${t.primaryText}`:`color:${d?t.text:'transparent'}`}">${d||''}</div></div>`).join('')}</div>`).join('')}
  </div>`;
}
function carousel(t, cards){
  const inner = Array.isArray(cards) ? cards.join('') : cards;
  return `<div class="row" style="gap:12px;overflow:hidden">${inner}</div>`;
}
// charts
function barsChart(t, data, h=120, color=null){
  const max = Math.max(...data);
  return `<div class="row" style="height:${h}px;align-items:flex-end;gap:8px">${data.map((v,i)=>`
    <div class="grow" style="display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end">
      <div style="width:100%;max-width:34px;height:${Math.round(v/max*100)}%;border-radius:8px;background:${i===data.length-2?(color||t.primary):(t.dark?'#2C3A58':'#E7E7EA')}"></div>
    </div>`).join('')}</div>`;
}
function lineChart(t, data, w=350, h=120){
  const max=Math.max(...data), min=Math.min(...data);
  const pts = data.map((v,i)=>`${(i/(data.length-1)*w).toFixed(1)},${(h-8-((v-min)/(max-min||1))*(h-24)).toFixed(1)}`).join(' ');
  const id='g'+Math.floor(rand()*1e6);
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block;width:100%">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.primary}" stop-opacity=".35"/><stop offset="1" stop-color="${t.primary}" stop-opacity="0"/></linearGradient></defs>
    ${[0.25,0.5,0.75].map(f=>`<line x1="0" y1="${h*f}" x2="${w}" y2="${h*f}" stroke="${t.border}" stroke-width="1"/>`).join('')}
    <polygon points="0,${h} ${pts} ${w},${h}" fill="url(#${id})"/>
    <polyline points="${pts}" fill="none" stroke="${t.primary}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${w}" cy="${(h-8-((data[data.length-1]-min)/(max-min||1))*(h-24)).toFixed(1)}" r="5" fill="${t.primary}" stroke="${t.bg}" stroke-width="2.5"/>
  </svg>`;
}
function ring(t, value, size=120, sw=12, color=null){
  const r=(size-sw)/2, c=2*Math.PI*r, col=color||t.primary;
  return `<div style="position:relative;width:${size}px;height:${size}px">
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${t.dark?'#232E47':'#EDEDF0'}" stroke-width="${sw}"/>
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${(c*value/100).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${size/2} ${size/2})"/>
    </svg>
    <div class="center" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
      <div class="t24 w700">${value}%</div></div></div>`;
}
function donut(t, segs, size=150){
  const total=segs.reduce((a,s)=>a+s.v,0); let off=25;
  const r=54, c=2*Math.PI*r;
  const circles = segs.map(s=>{const len=c*s.v/total; const el=`<circle cx="75" cy="75" r="${r}" fill="none" stroke="${s.c}" stroke-width="22" stroke-dasharray="${len.toFixed(1)} ${(c-len).toFixed(1)}" stroke-dashoffset="${(-off*c/100).toFixed(1)}" stroke-linecap="butt"/>`; off+=s.v/total*100; return el;}).join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 150 150" style="transform:rotate(-90deg)">${circles}</svg>`;
}
// fake map
function mapBase(t, {route=true, pins=[], dark}={}){
  const street = t.dark ? 'rgba(148,163,184,.10)' : 'rgba(28,25,23,.06)';
  const block = t.dark ? '#101827' : '#F3EFE7';
  return `<div style="position:absolute;inset:0;background:${block};overflow:hidden">
    <div style="position:absolute;inset:-40px;background:
      repeating-linear-gradient(0deg, transparent 0 46px, ${street} 46px 50px),
      repeating-linear-gradient(90deg, transparent 0 64px, ${street} 64px 68px)"></div>
    <div style="position:absolute;left:-30px;top:120px;width:200px;height:150px;background:${t.dark?'#0E2A22':'#D7EDE4'};border-radius:40% 60% 55% 45%"></div>
    <div style="position:absolute;right:-40px;bottom:180px;width:240px;height:120px;background:${t.dark?'#12283F':'#DCEBF7'};border-radius:60% 40% 45% 55%"></div>
    ${route?`<svg style="position:absolute;inset:0" width="390" height="844" viewBox="0 0 390 844" fill="none">
      <path d="M60 700 C 90 560, 60 480, 140 420 S 260 340, 250 220 S 300 120, 330 90" stroke="${t.primary}" stroke-width="6" stroke-linecap="round" stroke-dasharray="1 14"/>
      <path d="M60 700 C 90 560, 60 480, 140 420 S 260 340, 250 220 S 300 120, 330 90" stroke="${t.primary}" stroke-width="6" stroke-linecap="round" opacity=".25"/></svg>`:''}
    ${pins.map(p=>`<div style="position:absolute;left:${p.x}%;top:${p.y}%;transform:translate(-50%,-100%)">
      <div class="row center" style="width:40px;height:40px;border-radius:20px;background:${p.c||t.primary};border:3px solid #fff;box-shadow:0 6px 16px rgba(0,0,0,.3);color:#fff">${icon(p.icon||'pin',20,'#fff',2)}</div>
      ${p.label?`<div class="t12 w700 center" style="background:${t.dark?'#1E293B':'#fff'};color:${t.text};padding:4px 10px;border-radius:10px;margin-top:6px;box-shadow:0 4px 12px rgba(0,0,0,.2);white-space:nowrap">${p.label}</div>`:''}
    </div>`).join('')}
  </div>`;
}
function chatBubble(t, {me, text:txt, time}){
  return `<div class="row" style="justify-content:${me?'flex-end':'flex-start'};margin-bottom:10px">
    <div style="max-width:75%;padding:12px 16px;border-radius:${me?'18px 18px 4px 18px':'18px 18px 18px 4px'};background:${me?t.primary:(t.dark?'#1B2740':'#F1F1F4')};color:${me?t.primaryText:t.text}">
      <div class="t15">${txt}</div><div class="t12 mt4" style="color:${me?t.primaryText:t.faint};opacity:.75;text-align:right">${time}</div>
    </div></div>`;
}
function composer(t, placeholder){
  return `<div class="row" style="flex:none;gap:10px;padding:12px 20px 30px;background:${t.dark?'rgba(10,14,22,.9)':'rgba(255,255,255,.95)'};border-top:1px solid ${t.border}">
    <div class="row center" style="width:44px;height:44px;border-radius:22px;background:${t.dark?'#1A2338':'#F1F1F4'};flex:none">${icon('plus',20,t.muted)}</div>
    <div class="row grow" style="background:${t.dark?'#1A2338':'#F1F1F4'};border-radius:22px;padding:12px 16px"><div class="t15 muted grow">${placeholder}</div>${icon('mic',20,t.muted)}</div>
    <div class="row center" style="width:44px;height:44px;border-radius:22px;background:${t.primary};flex:none">${icon('send',20,t.primaryText)}</div></div>`;
}
function keypad(t, dark){
  const keys=['1','2','3','4','5','6','7','8','9','·','0','⌫'];
  return `<div style="padding:8px 40px 0">${[0,1,2,3].map(r=>`<div class="row" style="justify-content:space-around;margin-bottom:6px">${keys.slice(r*3,r*3+3).map(k=>`<div class="row center t24 w500" style="width:72px;height:56px;color:${t.text}">${k}</div>`).join('')}</div>`).join('')}</div>`;
}
function otpBoxes(t){
  return `<div class="row center" style="gap:10px">${['4','8','•','•'].map((d,i)=>`
    <div class="row center t24 w700" style="width:58px;height:68px;border-radius:16px;border:2px solid ${i<2?t.primary:t.border};background:${t.dark?'#1A2338':'#F7F7F8'};color:${t.text}">${d}</div>`).join('')}</div>`;
}

// ================= screen registry =================
const SCREENS = [];
function screen(id, app, meta, build){ SCREENS.push(Object.assign({id, app, build}, meta)); }
function scroller(t, inner){ return `<div class="scroll"><div style="padding-bottom:24px">${inner}</div></div>`; }
const CATS = { finpulse:'Finance', pulsefit:'Health & Fitness', wanderly:'Travel', crave:'Food & Drink', tempo:'Music' };
const NAMES = { finpulse:'FinPulse', pulsefit:'PulseFit', wanderly:'Wanderly', crave:'Crave', tempo:'Tempo' };

// ================= FINPULSE =================
{ const A='finpulse', T=()=>THEMES[A];

screen('finpulse-onboarding-01', A, {title:'Onboarding', pattern:'Onboarding', platform:'iOS',
  elements:['Carousel','Button','Progress Bar'], colors:['#0B1220','#22D3EE','#1E293B','#F8FAFC','#10B981']}, (t)=>{
  const pages=[
    {e:'wallet', h:'All your money,\none clear view', p:'Link every account and card. FinPulse shows your true balance in real time.'},
    {e:'send', h:'Send money in\nseconds', p:'Free instant transfers to anyone in Europe. No IBAN typing, no waiting.'},
    {e:'chart', h:'Budgets that\nbuild themselves', p:'Smart categories learn how you spend and nudge you before you overshoot.'}];
  const dots = `<div class="row center" style="gap:8px">${pages.map((_,i)=>`<div style="width:${i===0?28:8}px;height:8px;border-radius:4px;background:${i===0?t.primary:'#2C3A58'}"></div>`).join('')}</div>`;
  const ill = `<div class="row center" style="width:230px;height:230px;border-radius:48px;margin:0 auto;background:linear-gradient(135deg,#123047,#0B1220);border:1px solid ${t.border};position:relative;overflow:hidden">
      <div style="position:absolute;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(34,211,238,.25),transparent 70%);top:-60px;left:-35px"></div>
      <div style="position:relative">${icon('wallet',96,t.primary,1.2)}</div>
      <div style="position:absolute;right:26px;top:30px;background:#10B981;color:#fff;font-size:12px;font-weight:700;padding:6px 12px;border-radius:14px">+€250.00</div>
      <div style="position:absolute;left:22px;bottom:36px;background:#1B2740;color:#fff;font-size:12px;font-weight:600;padding:6px 12px;border-radius:14px;border:1px solid ${t.border}">Rent paid ✓</div>
    </div>`;
  return `${scroller(t, `<div class="pad" style="padding-top:36px">
      <div class="row between"><div class="t15 w600" style="color:${t.primary}">FinPulse</div><div class="t15 w500 muted">Skip</div></div>
      <div class="mt24">${ill}</div>
      <div class="t28 w700 center mt24" style="line-height:1.25;letter-spacing:-.5px">All your money,<br>one clear view</div>
      <div class="t15 muted center mt12" style="line-height:1.6;padding:0 24px">Link every account and card. FinPulse shows your true balance in real time.</div>
      <div class="mt24">${dots}</div>
      <div class="mt24">${btn(t,'Get started')}<div class="mt12">${btn(t,'I already have an account','ghost')}</div></div>
    </div>`)}`;
});

screen('finpulse-login-02', A, {title:'Login', pattern:'Login', platform:'iOS',
  elements:['Text Field','Button','Checkbox'], colors:['#0B1220','#22D3EE','#1E293B','#F8FAFC','#8FA0B8']}, (t)=>{
  return `${scroller(t, `<div class="pad" style="padding-top:52px">
    <div class="row center" style="width:76px;height:76px;border-radius:22px;background:linear-gradient(135deg,#22D3EE,#0E7490);margin:0 auto">${icon('bolt',38,'#062A33',2)}</div>
    <div class="t28 w700 center mt20" style="letter-spacing:-.5px">Welcome back</div>
    <div class="t15 muted center mt8">Log in to keep your money moving.</div>
    <div class="mt24">${textField(t,{label:'Email', value:'ava.sharma@mail.de', icon:'user'})}</div>
    <div class="mt16">${textField(t,{label:'Password', value:'correct horse', icon:'shield', secure:true})}</div>
    <div class="mt12">${checkbox(t,true,'Remember me','Stay logged in on this device')}</div>
    <div class="mt16">${btn(t,'Log in')}</div>
    <div class="row center mt16" style="gap:12px"><div style="flex:1;height:1px;background:${t.border}"></div><div class="t13 muted">or</div><div style="flex:1;height:1px;background:${t.border}"></div></div>
    <div class="mt16">${btn(t,'Continue with Face ID','soft',{iconBefore:icon('eye',20,t.primary)})}</div>
    <div class="t14 center mt20"><span class="muted">New to FinPulse? </span><span class="w600" style="color:${t.primary}">Create account</span></div>
  </div>`)}`;
});

screen('finpulse-home-03', A, {title:'Home — balance overview', pattern:'Home', platform:'iOS',
  elements:['Tab Bar','Card','Progress Bar','Avatar','Button'], colors:['#0B1220','#1E293B','#22D3EE','#F8FAFC','#10B981']}, (t)=>{
  const tx=[['S','Spotify','Music · Today','−€9.99','linear-gradient(135deg,#1DB954,#0d3b22)'],['A','Ava Sharma','Received · Yesterday','+€250.00','linear-gradient(135deg,#22D3EE,#0E7490)'],['R','REWE','Groceries · Yesterday','−€64.20','linear-gradient(135deg,#F59E0B,#92400E)']];
  return `${statusBar(t)}<div class="scroll"><div class="pad" style="padding-top:8px">
    <div class="row between">
      <div class="row" style="gap:12px">${avatar(t,'AS',46)}<div><div class="t13 muted">Good morning</div><div class="t17 w700">Ava Sharma</div></div></div>
      <div style="position:relative;padding:10px">${icon('bell',24,t.text)}<div style="position:absolute;top:8px;right:8px;width:10px;height:10px;border-radius:5px;background:${t.danger};border:2px solid ${t.bg}"></div></div>
    </div>
    <div class="mt16">${card(t,`
      <div class="row between"><div class="t13 muted w500">TOTAL BALANCE</div><div class="t13 w600" style="color:${t.primary}">EUR ↓</div></div>
      <div class="t34 w700 mt8" style="letter-spacing:-1px">€4,280.50</div>
      <div class="row mt8" style="gap:6px"><div class="t13 w600" style="color:${t.accent}">▲ €312.40</div><div class="t13 muted">this month</div></div>
      <div class="row mt16" style="gap:10px">
        <div class="grow">${btn(t,'Send','primary',{small:true,iconBefore:icon('send',16,t.primaryText)})}</div>
        <div class="grow">${btn(t,'Request','soft',{small:true})}</div>
        <div class="grow">${btn(t,'Top up','soft',{small:true})}</div>
      </div>`)}
    </div>
    <div class="mt16">${card(t,`
      <div class="row between"><div class="t15 w700">Japan trip fund</div><div class="t13 w600" style="color:${t.primary}">€1,840 / €2,500</div></div>
      <div class="mt12">${progress(t,74)}</div>
      <div class="t13 muted mt8">€660 to go · on track for September</div>`)}
    </div>
    <div class="row between mt20 mb8"><div class="t17 w700">Recent activity</div><div class="t13 w600" style="color:${t.primary}">See all</div></div>
    ${card(t, tx.map(x=>listItem(t,{av:avatar(t,x[0],44,x[4]),title:x[1],sub:x[2],right:`<div class="t15 w700" style="color:${x[3][0]==='+'?t.accent:t.text}">${x[3]}</div>`,chevron:false})).join('<div style="border-top:1px solid '+t.border+'"></div>'))}
  </div></div>${tabBar(t,[{icon:'home',label:'Home'},{icon:'wallet',label:'Wallet'},{icon:'chart',label:'Stats'},{icon:'bell',label:'Alerts'}],0)}`;
});

screen('finpulse-wallet-04', A, {title:'Wallet', pattern:'Wallet', platform:'Android',
  elements:['Card','List Item','Button'], colors:['#0B1220','#22D3EE','#1B2740','#F8FAFC','#A855F7']}, (t)=>{
  const stack=`<div style="position:relative;height:210px">
      <div style="position:absolute;top:0;left:24px;right:24px;height:170px;border-radius:20px;background:linear-gradient(135deg,#3B0764,#A855F7);transform:rotate(-3deg)"></div>
      <div style="position:absolute;top:14px;left:12px;right:12px;height:170px;border-radius:20px;background:linear-gradient(135deg,#0E7490,#22D3EE);transform:rotate(2deg)"></div>
      <div style="position:absolute;top:34px;left:0;right:0;height:176px;border-radius:20px;background:linear-gradient(135deg,#16203A,#24365E);border:1px solid ${t.border};padding:20px">
        <div class="row between"><div class="t13 w600" style="color:${t.primary}">FinPulse ··· 4021</div>${icon('wifi',22,t.muted)}</div>
        <div class="t20 w600 mt16" style="letter-spacing:2px">5312&nbsp;&nbsp;····&nbsp;&nbsp;····&nbsp;&nbsp;4021</div>
        <div class="row between mt16"><div><div class="t12 muted">Card holder</div><div class="t14 w600">AVA SHARMA</div></div><div><div class="t12 muted">Expires</div><div class="t14 w600">09/29</div></div></div>
      </div></div>`;
  return `${statusBar(t)}${androidBar({t,title:'Wallet',back:false,actions:['search','dots']})}<div class="scroll"><div class="pad">
    ${stack}
    <div class="row mt8" style="gap:10px"><div class="grow">${btn(t,'Add money','primary',{small:true})}</div><div class="grow">${btn(t,'Card details','soft',{small:true})}</div></div>
    <div class="t17 w700 mt20 mb8">All accounts</div>
    ${card(t,[
      ['G','Girokonto ···4821','Sparkasse Bremen','€3,104.22'],
      ['S','Savings vault','4.1% p.a.','€1,840.00'],
      ['C','Cashback pot','This month','€36.28']].map(x=>listItem(t,{av:avatar(t,x[0],44),title:x[1],sub:x[2],right:`<div class="t15 w700">${x[3]}</div>`,chevron:false})).join('<div style="border-top:1px solid '+t.border+'"></div>'))}
  </div></div>${androidNav(t,[{icon:'home',label:'Home'},{icon:'wallet',label:'Wallet'},{icon:'chart',label:'Stats'},{icon:'bell',label:'Alerts'}],1)}`;
});

screen('finpulse-payment-method-05', A, {title:'Payment methods', pattern:'Payment Method', platform:'Android',
  elements:['Radio','List Item','FAB','Card'], colors:['#0B1220','#22D3EE','#1B2740','#F8FAFC','#10B981']}, (t)=>{
  const mcard=(brand,num,exp,sel,grad)=>`<div style="border-radius:18px;padding:18px;background:${grad};margin-bottom:12px;border:${sel?`2px solid ${t.primary}`:`1px solid ${t.border}`}">
    <div class="row between"><div class="t14 w700" style="color:#fff">${brand}</div>${sel?badge(t,'DEFAULT','ok'):''}</div>
    <div class="t17 w600 mt12" style="color:#fff;letter-spacing:1.5px">····&nbsp;&nbsp;····&nbsp;&nbsp;····&nbsp;&nbsp;${num}</div>
    <div class="row between mt12"><div class="t13" style="color:rgba(255,255,255,.75)">${exp}</div>${radio(t,sel,'','',null).replace(/padding:12px 0/,'padding:0')}</div></div>`;
  return `${statusBar(t)}${androidBar({t,title:'Payment methods',actions:['dots']})}<div class="scroll"><div class="pad" style="padding-top:4px">
    ${mcard('VISA','4021','09/29 · Ava Sharma',true,'linear-gradient(135deg,#0E7490,#22D3EE)')}
    ${mcard('Mastercard','8814','04/28 · Ava Sharma',false,'linear-gradient(135deg,#3B0764,#A855F7)')}
    <div class="t17 w700 mt8 mb8">Bank accounts</div>
    ${card(t, listItem(t,{ic:'card',title:'Sparkasse Bremen',sub:'DE89 ····4821 · Instant transfers',chevron:false, right:radio(t,false,'','',null).replace(/padding:12px 0/,'padding:0')}))}
    <div class="t13 muted mt16 center" style="line-height:1.6">Cards are tokenised and never stored<br>on this device. 3-D Secure enabled.</div>
  </div></div>${fab(t,'plus')}${androidNav(t,[{icon:'home',label:'Home'},{icon:'wallet',label:'Wallet'},{icon:'chart',label:'Stats'},{icon:'user',label:'Profile'}],1)}`;
});

screen('finpulse-activity-06', A, {title:'Activity & stats', pattern:'Activity/Stats', platform:'Android',
  elements:['Segmented Control','Chart','List Item','Card'], colors:['#0B1220','#22D3EE','#1E293B','#F8FAFC','#FB7185']}, (t)=>{
  return `${statusBar(t)}${androidBar({t,title:'Activity',actions:['cal','dots']})}<div class="scroll"><div class="pad">
    <div class="mt8">${segmented(t,['Week','Month','Year'],1)}</div>
    <div class="mt16">${card(t,`
      <div class="row between"><div><div class="t13 muted">SPENT IN OCTOBER</div><div class="t28 w700 mt4">€1,284.90</div></div>${badge(t,'−8% vs Sep','ok')}</div>
      <div class="mt16">${barsChart(t,[42,58,35,70,52,88,64,47,60,74,38,66],110)}</div>
      <div class="row between mt8"><div class="t12 muted">Oct 1</div><div class="t12 muted">Oct 15</div></div>`)}
    </div>
    <div class="t17 w700 mt20 mb8">Top categories</div>
    ${card(t,[
      ['Groceries','€412.30',78,'#F59E0B'],
      ['Dining out','€238.15',45,'#FB7185'],
      ['Transport','€186.40',35,'#22D3EE']].map(c=>`
      <div style="padding:10px 0"><div class="row between"><div class="t15 w600">${c[0]}</div><div class="t15 w700">${c[1]}</div></div>
      <div class="mt8">${progress(t,c[2],6)}</div></div>`).join('<div style="border-top:1px solid '+t.border+'"></div>'))}
  </div></div>${androidNav(t,[{icon:'home',label:'Home'},{icon:'wallet',label:'Wallet'},{icon:'chart',label:'Stats'},{icon:'bell',label:'Alerts'}],2)}`;
});

screen('finpulse-notifications-07', A, {title:'Notifications', pattern:'Notifications', platform:'Android',
  elements:['List Item','Badge','Banner','Avatar'], colors:['#0B1220','#22D3EE','#1B2740','#F8FAFC','#F59E0B']}, (t)=>{
  const n=(ic,title,body,time,unread,bcol)=>`<div class="row" style="padding:14px 0;gap:12px;${unread?`background:${t.primary}0d;margin:0 -20px;padding-left:20px;padding-right:20px;border-radius:14px`:''}">
      <div class="row center" style="width:46px;height:46px;border-radius:14px;background:${bcol}1f;flex:none">${icon(ic,22,bcol==='#fff'?t.text:bcol)}</div>
      <div class="grow"><div class="row between"><div class="t15 w600">${title}</div><div class="t12 faint">${time}</div></div>
      <div class="t13 muted mt4" style="line-height:1.5">${body}</div></div>${unread?`<div style="width:9px;height:9px;border-radius:5px;background:${t.primary};flex:none"></div>`:''}</div>`;
  return `${statusBar(t)}${androidBar({t,title:'Notifications',back:false,actions:['check','dots']})}<div class="scroll"><div class="pad" style="padding-top:4px">
    <div class="mb12">${banner(t,'Invite friends, earn <b>€15</b> each. 3 invites left this month.','gift','promo')}</div>
    <div class="t13 w700 muted mb4" style="letter-spacing:1px">TODAY</div>
    ${n('send','Money received','<b>Lukas Meyer</b> sent you <b>€250.00</b> · “Dinner split”','9:12',true,t.accent)}
    ${n('shield','Suspicious login blocked','New sign-in from Hamburg was stopped. Was this you?','8:03',true,t.danger)}
    <div class="t13 w700 muted mt12 mb4" style="letter-spacing:1px">EARLIER</div>
    ${n('chart','Budget alert','You have spent 80% of your <b>Dining out</b> budget.','Yesterday',false,t.primary)}
    ${n('card','Card ending 4021','Your new virtual card is ready to use online.','Tue',false,t.muted)}
    ${n('gift','Cashback earned','<b>€4.20</b> cashback from REWE landed in your pot.','Mon',false,'#F59E0B')}
  </div></div>${androidNav(t,[{icon:'home',label:'Home'},{icon:'wallet',label:'Wallet'},{icon:'chart',label:'Stats'},{icon:'bell',label:'Alerts'}],3)}`;
});

screen('finpulse-settings-08', A, {title:'Settings', pattern:'Settings', platform:'Android',
  elements:['Toggle','List Item','Dropdown','Modal'], colors:['#0B1220','#22D3EE','#1E293B','#F8FAFC','#FB7185']}, (t)=>{
  const row=(ic,title,control,sub)=>`<div class="row" style="padding:14px 0;gap:12px">
    <div class="row center" style="width:42px;height:42px;border-radius:13px;background:${t.primary}14;flex:none">${icon(ic,21,t.primary)}</div>
    <div class="grow"><div class="t15 w600">${title}</div>${sub?`<div class="t13 muted mt4">${sub}</div>`:''}</div>${control}</div>`;
  return `${statusBar(t)}${androidBar({t,title:'Settings',actions:['dots']})}<div class="scroll"><div class="pad">
    ${card(t,[
      row('bell','Push notifications',toggle(t,true),'Transfers, budgets, security'),
      row('eye','Face ID login',toggle(t,true),'Unlock with biometrics'),
      row('globe','Currency',`<div class="t15 w600" style="color:${t.primary}">EUR €</div>`,''),
    ].join('<div style="border-top:1px solid '+t.border+'"></div>'))}
    <div class="mt16">${card(t,[
      row('shield','Privacy & security',icon('chevR',18,t.faint),''),
      row('card','Linked banks',`<div class="t14 w600 muted">3 connected</div>`,''),
      row('info','Help & support',icon('chevR',18,t.faint),''),
    ].join('<div style="border-top:1px solid '+t.border+'"></div>'))}
    <div class="mt16">${dropdown(t,'Statement language','English')}</div>
    <div class="mt24">${btn(t,'Log out','danger',{iconBefore:icon('logout',18,'#fff')})}</div>
    <div class="t12 faint center mt16">FinPulse v4.2.1 · Made in Bremen</div>
  </div></div>
  ${modal(t,{title:'Log out?',body:'You will need your password and 2FA code to log back in.',confirm:'Log out',cancel:'Stay'})}
  ${androidNav(t,[{icon:'home',label:'Home'},{icon:'wallet',label:'Wallet'},{icon:'chart',label:'Stats'},{icon:'user',label:'Profile'}],3)}`;
});

screen('finpulse-profile-09', A, {title:'Profile', pattern:'Profile', platform:'Android',
  elements:['Avatar','List Item','Badge','Card'], colors:['#0B1220','#22D3EE','#1B2740','#F8FAFC','#A3E635']}, (t)=>{
  return `${statusBar(t)}${androidBar({t,title:'Profile',back:false,actions:['edit']})}<div class="scroll"><div class="pad" style="padding-top:8px">
    <div class="row" style="gap:16px">
      <div style="position:relative">${avatar(t,'AS',84,'linear-gradient(135deg,#22D3EE,#A855F7)')}
        <div class="row center" style="position:absolute;right:0;bottom:0;width:30px;height:30px;border-radius:15px;background:${t.primary};border:3px solid ${t.bg}">${icon('cam',15,t.primaryText,2)}</div></div>
      <div><div class="t20 w700">Ava Sharma</div><div class="t14 muted mt4">ava.sharma@mail.de</div>
        <div class="row mt8" style="gap:6px">${badge(t,'VERIFIED','ok')}${badge(t,'PLUS','primary')}</div></div>
    </div>
    <div class="mt16">${card(t,`<div class="row" style="text-align:center">
      ${[['€48.2k','Moved in 2026'],['126','Transfers'],['4.9','Trust score']].map(s=>`<div class="grow"><div class="t20 w700" style="color:${t.primary}">${s[0]}</div><div class="t12 muted mt4">${s[1]}</div></div>`).join('')}</div>`)}
    </div>
    <div class="mt16">${card(t,[
      listItem(t,{ic:'user',title:'Personal details',sub:'Name, address, tax ID'}),
      listItem(t,{ic:'shield',title:'Verification',sub:'Identity verified 12 Mar 2026',right:badge(t,'DONE','ok'),chevron:false}),
      listItem(t,{ic:'ticket',title:'Referrals',sub:'6 friends joined · €90 earned'}),
      listItem(t,{ic:'info',title:'About FinPulse',sub:'Licenses, terms, imprint',chevron:true}),
    ].join('<div style="border-top:1px solid '+t.border+'"></div>'))}
  </div></div>${androidNav(t,[{icon:'home',label:'Home'},{icon:'wallet',label:'Wallet'},{icon:'chart',label:'Stats'},{icon:'user',label:'Profile'}],3)}`;
});

screen('finpulse-empty-10', A, {title:'Empty state — no transactions', pattern:'Empty State', platform:'iOS',
  elements:['Button'], colors:['#0B1220','#22D3EE','#1E293B','#F8FAFC','#8FA0B8']}, (t)=>{
  return `${statusBar(t)}${iosNav({t,title:'Activity',left:'back'})}<div class="scroll">
    ${emptyState(t,{emoji:icon('chart',52,t.primary,1.4),title:'No transactions yet',body:'Your activity will appear here once you send, receive or spend money. It only takes a minute to get started.',action:'Make first transfer'})}
  </div>${tabBar(t,[{icon:'home',label:'Home'},{icon:'wallet',label:'Wallet'},{icon:'chart',label:'Stats'},{icon:'bell',label:'Alerts'}],2)}`;
});

screen('finpulse-error-11', A, {title:'Error state — connection failed', pattern:'Error State', platform:'iOS',
  elements:['Button'], colors:['#0B1220','#FB7185','#1E293B','#F8FAFC','#8FA0B8']}, (t)=>{
  return `${statusBar(t)}${iosNav({t,title:'Activity',left:'back'})}<div class="scroll">
    ${errorState(t,{title:'Connection lost',body:'We could not reach FinPulse servers. Check your connection and try again — your money is safe.'})}
  </div>${tabBar(t,[{icon:'home',label:'Home'},{icon:'wallet',label:'Wallet'},{icon:'chart',label:'Stats'},{icon:'bell',label:'Alerts'}],2)}`;
});

screen('finpulse-send-contacts-12', A, {title:'Send money — contacts', pattern:'Search', platform:'iOS',
  elements:['Search Bar','Chip','Avatar','List Item','Button'], colors:['#0B1220','#22D3EE','#1E293B','#F8FAFC','#8FA0B8']}, (t)=>{
  const people=[['LM','Lukas Meyer','@lukas_m · DE12 ····9912','linear-gradient(135deg,#22D3EE,#0E7490)'],['PS','Priya Singh','@priya_s · DE44 ····3302','linear-gradient(135deg,#A855F7,#6D28D9)'],['JT','Jonas Weber','@jonasw · DE09 ····7718','linear-gradient(135deg,#10B981,#065F46)'],['MK','Maria Klein','@mariak · DE77 ····2210','linear-gradient(135deg,#F59E0B,#92400E)']];
  return `${statusBar(t)}${iosNav({t,title:'Send money',sub:'Step 1 of 3 · Choose recipient',left:'x',large:false})}
  <div class="scroll"><div class="pad" style="padding-top:12px">
    ${searchBar(t,'Name, @handle or IBAN')}
    <div class="mt12">${chips(t,['All','Favorites','Recent','FinPulse'],0)}</div>
    <div class="t13 w700 muted mt16 mb8" style="letter-spacing:1px">FAVORITES</div>
    <div class="row" style="gap:16px">${people.slice(0,4).map(p=>`<div class="center" style="flex:none"><div style="${p[0]==='LM'?`border:2.5px solid ${t.primary};border-radius:32px;padding:2px`:''}">${avatar(t,p[0],58,p[3])}</div><div class="t12 w500 mt8">${p[0].split(' ').map(w=>w[0]).join('')}</div></div>`).join('')}</div>
    <div class="t13 w700 muted mt16 mb4" style="letter-spacing:1px">ALL CONTACTS</div>
    ${card(t,people.map(p=>listItem(t,{av:avatar(t,p[0],44,p[3]),title:p[1],sub:p[2],chevron:false})).join('<div style="border-top:1px solid '+t.border+'"></div>'))}
  </div></div>`;
});

screen('finpulse-send-amount-13', A, {title:'Send money — amount', pattern:'Checkout', platform:'iOS',
  elements:['Button','Banner'], colors:['#0B1220','#22D3EE','#1E293B','#F8FAFC','#10B981']}, (t)=>{
  return `${statusBar(t)}${iosNav({t,title:'Send money',sub:'Step 2 of 3 · Amount',left:'back',large:false})}
  <div class="scroll"><div class="pad" style="padding-top:8px">
    <div class="row center" style="gap:12px">${avatar(t,'LM',52,'linear-gradient(135deg,#22D3EE,#0E7490)')}<div><div class="t17 w700">Lukas Meyer</div><div class="t13 muted">DE12 ····9912 · Instant</div></div></div>
    <div class="center mt20"><div class="t13 muted w600" style="letter-spacing:1px">YOU SEND</div>
      <div class="t34 w700 mt8" style="font-size:56px;letter-spacing:-2px">€85<span style="color:${t.faint}">.00</span></div>
      <div class="t14 mt8" style="color:${t.accent}">No fees · Arrives in seconds</div></div>
    <div class="mt16">${banner(t,'Balance after transfer: <b>€4,195.50</b>. Still within your weekly budget.','info')}</div>
    <div class="mt8">${keypad(t)}</div>
  </div></div>
  <div style="flex:none;padding:12px 20px 30px">${btn(t,'Continue', 'primary', {iconAfter:icon('chevR',18,t.primaryText)})}</div>`;
});

screen('finpulse-send-confirm-14', A, {title:'Send money — confirm', pattern:'Checkout', platform:'iOS',
  elements:['Card','List Item','Button'], colors:['#0B1220','#22D3EE','#1E293B','#F8FAFC','#F59E0B']}, (t)=>{
  return `${statusBar(t)}${iosNav({t,title:'Send money',sub:'Step 3 of 3 · Review',left:'back',large:false})}
  <div class="scroll"><div class="pad" style="padding-top:8px">
    <div class="center"><div class="t34 w700" style="font-size:52px;letter-spacing:-2px">€85.00</div>
      <div class="row center mt12" style="gap:10px">${avatar(t,'AS',40)}${icon('send',20,t.primary)}${avatar(t,'LM',40,'linear-gradient(135deg,#22D3EE,#0E7490)')}</div>
      <div class="t14 muted mt8">Ava Sharma → Lukas Meyer</div></div>
    <div class="mt20">${card(t,[
      listItem(t,{ic:'send',title:'Recipient',sub:'Lukas Meyer · DE12 ····9912',chevron:false}),
      listItem(t,{ic:'bolt',title:'Speed',sub:'Instant · free',right:`<div class="t14 w700" style="color:${t.accent}">FREE</div>`,chevron:false}),
      listItem(t,{ic:'chat',title:'Message',sub:'“Dinner split 🍝”',chevron:false}),
    ].join('<div style="border-top:1px solid '+t.border+'"></div>'))}
    </div>
    <div class="row center mt16" style="gap:8px">${icon('shield',18,t.accent)}<div class="t13 muted">Protected by FinPulse Shield · 3-D Secure</div></div>
  </div></div>
  <div style="flex:none;padding:12px 20px 30px">${btn(t,'Send €85.00','primary')}<div class="t13 muted center mt12">By sending you agree to the transfer terms</div></div>`;
});

screen('finpulse-send-success-15', A, {title:'Send money — success', pattern:'Checkout', platform:'iOS',
  elements:['Toast','Button','Badge'], colors:['#0B1220','#10B981','#1E293B','#F8FAFC','#22D3EE']}, (t)=>{
  return `${statusBar(t)}<div class="scroll"><div class="pad" style="padding-top:70px">
    <div class="row center" style="width:110px;height:110px;border-radius:55px;background:${t.accent}22;margin:0 auto;position:relative">
      <div class="row center" style="width:84px;height:84px;border-radius:42px;background:${t.accent}">${icon('check',40,'#fff',2.6)}</div></div>
    <div class="t28 w700 center mt24">€85.00 sent</div>
    <div class="t15 muted center mt8" style="line-height:1.6">Lukas Meyer received your transfer<br>instantly · 9:41 AM</div>
    <div class="row center mt16">${badge(t,'+12 CASHBACK PTS','primary')}</div>
    <div class="mt24">${card(t,listItem(t,{av:avatar(t,'LM',44,'linear-gradient(135deg,#22D3EE,#0E7490)'),title:'Lukas Meyer',sub:'DE12 ····9912',right:'<div class="t14 w700" style="color:'+t.accent+'">Delivered</div>',chevron:false}))}</div>
    <div class="mt24">${btn(t,'Done')}<div class="mt12">${btn(t,'Send another','ghost')}</div></div>
  </div></div>${toast(t,'Transfer complete — receipt saved')}`;
});

screen('finpulse-card-form-16', A, {title:'Add card — details', pattern:'Payment Method', platform:'iOS',
  elements:['Text Field','Button','Checkbox'], colors:['#0B1220','#22D3EE','#1E293B','#F8FAFC','#8FA0B8']}, (t)=>{
  return `${statusBar(t)}${iosNav({t,title:'Add card',sub:'Step 1 of 2',left:'x',large:false})}
  <div class="scroll"><div class="pad" style="padding-top:8px">
    <div style="border-radius:18px;padding:20px;background:linear-gradient(135deg,#1B2740,#2B3D66);border:1px dashed ${t.primary}66;margin-bottom:20px">
      <div class="t14 w600" style="color:${t.primary}">NEW CARD</div>
      <div class="t17 w600 mt8" style="letter-spacing:2px;color:${t.faint}">····&nbsp;&nbsp;····&nbsp;&nbsp;····&nbsp;&nbsp;····</div>
      <div class="t13 mt8" style="color:${t.faint}">Card preview updates as you type</div></div>
    ${textField(t,{label:'Card number',value:'5312  4401  8877',icon:'card'})}
    <div class="mt16">${textField(t,{label:'Name on card',value:'AVA SHARMA',icon:'user'})}</div>
    <div class="row mt16" style="gap:12px"><div class="grow">${textField(t,{label:'Expiry',value:'09/29'})}</div><div class="grow">${textField(t,{label:'CVC',value:'',placeholder:'123'})}</div></div>
    <div class="mt16">${checkbox(t,true,'Set as default card','Use for instant top-ups')}</div>
  </div></div>
  <div style="flex:none;padding:12px 20px 30px">${btn(t,'Continue to verification')}</div>`;
});

screen('finpulse-card-verify-17', A, {title:'Add card — verify', pattern:'Payment Method', platform:'iOS',
  elements:['Modal','Button'], colors:['#0B1220','#22D3EE','#1E293B','#F8FAFC','#8FA0B8']}, (t)=>{
  const dimmed=`<div class="scroll" style="opacity:.35;filter:blur(1px)"><div class="pad" style="padding-top:90px">
    ${textField(t,{label:'Card number',value:'5312  4401  8877',icon:'card'})}
    <div class="mt16">${btn(t,'Continue to verification')}</div></div></div>`;
  return `${statusBar(t)}${dimmed}
  ${modal(t,{title:'Verify it\'s you',body:'We sent a 6-digit code to <b>+49 171 ··· 4420</b>. Enter it to link your card.',confirm:'Verify card',cancel:'Resend code'}).replace('<div class="t14 muted center mt8" style="line-height:1.6">','<div class="mt16">'+otpBoxes(t)+'</div><div class="t14 muted center mt16" style="line-height:1.6">')}`;
});

screen('finpulse-card-done-18', A, {title:'Add card — done', pattern:'Payment Method', platform:'iOS',
  elements:['Toast','Card','Button'], colors:['#0B1220','#22D3EE','#1B2740','#F8FAFC','#10B981']}, (t)=>{
  return `${statusBar(t)}${iosNav({t,title:'Payment methods',left:'x',large:false})}
  <div class="scroll"><div class="pad" style="padding-top:12px">
    <div style="border-radius:18px;padding:20px;background:linear-gradient(135deg,#0E7490,#22D3EE);margin-bottom:16px">
      <div class="row between"><div class="t14 w700" style="color:#fff">VISA</div>${icon('check',20,'#fff',2.4)}</div>
      <div class="t17 w600 mt12" style="color:#fff;letter-spacing:1.5px">5312&nbsp;&nbsp;····&nbsp;&nbsp;····&nbsp;&nbsp;8877</div>
      <div class="t13 mt12" style="color:rgba(255,255,255,.8)">Verified · Ready to use</div></div>
    ${card(t,`<div class="row" style="gap:12px">${icon('shield',26,t.accent)}<div><div class="t15 w700">Card linked securely</div><div class="t13 muted mt4">Tokenised with 3-D Secure. Your full number never touches our servers.</div></div></div>`)}
    <div class="mt24">${btn(t,'Back to wallet')}</div>
  </div></div>${toast(t,'Card ending 8877 added successfully')}`;
});

}

// ================= PULSEFIT =================
{ const A='pulsefit', T=()=>THEMES[A];

screen('pulsefit-welcome-01', A, {title:'Welcome', pattern:'Welcome', platform:'iOS',
  elements:['Button','Carousel'], colors:['#0A0F0D','#A3E635','#111714','#F4F7F2','#22D3EE']}, (t)=>{
  return `${statusBar(t)}<div class="scroll"><div class="pad" style="padding-top:44px">
    <div class="row" style="gap:10px">${icon('bolt',26,t.primary)}<div class="t20 w800" style="letter-spacing:-.4px">PulseFit</div></div>
    <div style="margin:28px -20px 0;position:relative;height:300px;overflow:hidden">
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 30%,rgba(163,230,53,.22),transparent 65%)"></div>
      <div class="row center" style="height:100%;gap:14px">
        ${[['dumbbell','Strength'],['flame','HIIT'],['bike','Cardio']].map((w,i)=>`
        <div class="center" style="flex:none;width:150px;padding:22px 10px;border-radius:22px;background:${i===1?t.primary:'#141B16'};border:1px solid ${t.border};${i!==1?'transform:scale(.88);opacity:.75':''}">
          ${icon(w[0],44,i===1?'#1A2E05':t.primary,1.5)}
          <div class="t14 w700 mt12" style="color:${i===1?'#1A2E05':t.text}">${w[1]}</div>
          <div class="t12 mt4" style="color:${i===1?'#3F6212':t.muted}">${['24 plans','18 plans','31 plans'][i]}</div>
        </div>`).join('')}
      </div></div>
    <div class="row center mt12" style="gap:8px">${[0,1,2].map(i=>`<div style="width:${i===1?28:8}px;height:8px;border-radius:4px;background:${i===1?t.primary:'#2A332C'}"></div>`).join('')}</div>
    <div class="t28 w700 center mt20" style="letter-spacing:-.5px;line-height:1.25">Training that adapts<br>to <span style="color:${t.primary}">your body</span></div>
    <div class="t15 muted center mt12" style="line-height:1.6">AI coaching, real-time form feedback,<br>and plans that evolve every week.</div>
    <div class="mt24">${btn(t,'Start free trial')}<div class="mt12">${btn(t,'Log in','ghost')}</div></div>
    <div class="t12 faint center mt16">7 days free · No card required</div>
  </div></div>`;
});

screen('pulsefit-home-02', A, {title:'Home — today\'s workout', pattern:'Home', platform:'iOS',
  elements:['Tab Bar','Card','Chart','Avatar','Button','Progress Bar'], colors:['#0A0F0D','#A3E635','#111714','#F4F7F2','#EC4899']}, (t)=>{
  return `${statusBar(t)}<div class="scroll"><div class="pad" style="padding-top:8px">
    <div class="row between">
      <div class="row" style="gap:12px">${avatar(t,'AR',46,'linear-gradient(135deg,#A3E635,#22D3EE)')}<div><div class="t13 muted">Tuesday, Oct 13</div><div class="t17 w700">Morning, Arjun 💪</div></div></div>
      <div class="row" style="gap:4px">${badge(t,'🔥 12','primary')}</div></div>
    <div class="mt16">${card(t,`<div class="row" style="gap:16px">
      <div style="position:relative">${ring(t,72,104,11)}<div class="center" style="position:absolute;inset:0;top:64px"><div class="t12 w700" style="color:${t.primary}">MOVE</div></div></div>
      <div class="grow"><div class="t15 w700">Daily activity</div>
        <div class="mt8">${[['Move','612 / 850 kcal',72,'#A3E635'],['Exercise','34 / 45 min',76,'#22D3EE'],['Stand','9 / 12 hr',75,'#EC4899']].map(r=>`
        <div class="row between mt8"><div class="t13">${r[0]}</div><div class="t13 w600 muted">${r[1]}</div></div>`).join('')}
      </div></div>`)}
    </div>
    <div class="row between mt20 mb8"><div class="t17 w700">Today's workout</div><div class="t13 w600" style="color:${t.primary}">Week 4 · Day 2</div></div>
    ${card(t,`<div class="row" style="gap:14px">
      <div class="row center" style="width:96px;height:96px;border-radius:18px;background:linear-gradient(135deg,#1c2b12,#3F6212);flex:none">${icon('dumbbell',44,t.primary,1.6)}</div>
      <div class="grow"><div class="t17 w700">Upper Body Power</div>
        <div class="t13 muted mt4">45 min · 8 exercises · Intermediate</div>
        <div class="mt8">${progress(t,60,6)}</div>
        <div class="t12 muted mt4">3 of 5 sessions done this week</div></div></div>
      <div class="mt12">${btn(t,'Start workout','primary',{small:true,iconBefore:icon('play',16,t.primaryText)})}</div>`)}
    <div class="t17 w700 mt20 mb8">Continue</div>
    ${carousel(t,['HIIT Burn 20','Morning Yoga Flow'].map((w,i)=>`
      <div style="flex:none;width:220px;border-radius:18px;background:${t.card};border:1px solid ${t.border};padding:14px">
        <div class="row center" style="height:90px;border-radius:12px;background:${i===0?'linear-gradient(135deg,#431407,#F97316)':'linear-gradient(135deg,#0c2b33,#22D3EE)'}">${icon(i===0?'flame':'heart',36,'#fff',1.6)}</div>
        <div class="t15 w700 mt12">${w}</div><div class="t13 muted mt4">${i===0?'20 min · 320 kcal':'25 min · Recovery'}</div></div>`))}
  </div></div>${tabBar(t,[{icon:'home',label:'Home'},{icon:'dumbbell',label:'Train'},{icon:'chart',label:'Stats'},{icon:'user',label:'You'}],0)}`;
});

screen('pulsefit-stats-03', A, {title:'Activity & stats', pattern:'Activity/Stats', platform:'Android',
  elements:['Segmented Control','Chart','Card'], colors:['#0A0F0D','#A3E635','#111714','#F4F7F2','#22D3EE']}, (t)=>{
  return `${statusBar(t)}${androidBar({t,title:'Your stats',back:false,actions:['cal','dots']})}<div class="scroll"><div class="pad" style="padding-top:4px">
    <div>${segmented(t,['Week','Month','6M'],0)}</div>
    <div class="mt16">${card(t,`
      <div class="row between"><div><div class="t13 muted">ACTIVE CALORIES</div><div class="t28 w700 mt4">4,218 <span class="t15 muted w400">kcal</span></div></div>${badge(t,'+14%','primary')}</div>
      <div class="mt16">${lineChart(t,[2.1,3.4,2.8,4.2,3.6,5.1,4.8,5.6,4.9,6.2,5.8,6.9])}</div>
      <div class="row between mt8"><div class="t12 muted">Mon</div><div class="t12 muted">Wed</div><div class="t12 muted">Fri</div><div class="t12 muted">Sun</div></div>`)}
    </div>
    <div class="row mt16" style="gap:12px">
      ${[['3:42','Avg pace /km','bolt'],['128','Avg HR bpm','heart'],['42.6','VO₂ max','flame']].map(s=>`
      <div class="grow">${card(t,`<div class="center"><div class="row center" style="width:40px;height:40px;border-radius:13px;background:${t.primary}14;margin:0 auto">${icon(s[2],20,t.primary)}</div>
        <div class="t20 w700 mt8">${s[0]}</div><div class="t12 muted mt4">${s[1]}</div></div>`,12)}</div>`).join('')}
    </div>
    <div class="t17 w700 mt20 mb8">Personal records</div>
    ${card(t,[
      listItem(t,{ic:'bolt',title:'Fastest 5K',sub:'12 Oct 2026 · Riverside loop',right:'<div class="t15 w700" style="color:'+t.primary+'">24:18</div>',chevron:false}),
      listItem(t,{ic:'dumbbell',title:'Bench press',sub:'8 Oct 2026 · 5 reps',right:'<div class="t15 w700">92.5 kg</div>',chevron:false}),
    ].join('<div style="border-top:1px solid '+t.border+'"></div>'))}
  </div></div>${androidNav(t,[{icon:'home',label:'Home'},{icon:'dumbbell',label:'Train'},{icon:'chart',label:'Stats'},{icon:'user',label:'You'}],2)}`;
});

screen('pulsefit-calendar-04', A, {title:'Schedule calendar', pattern:'Calendar', platform:'iOS',
  elements:['Date Picker','CalendarGrid','Card','List Item'], colors:['#0A0F0D','#A3E635','#111714','#F4F7F2','#8FA0B8']}, (t)=>{
  const weeks=[['','','','1','2','3','4'],['5','6','7','8','9','10','11'],['12','13','14','15','16','17','18'],['19','20','21','22','23','24','25'],['26','27','28','29','30','31','']];
  return `${statusBar(t)}${iosNav({t,title:'Schedule',sub:'October 2026',left:'back'})}<div class="scroll"><div class="pad">
    ${card(t,calendarGrid(t,weeks,'15'))}
    <div class="t17 w700 mt20 mb8">Thu, Oct 15</div>
    ${card(t,[
      listItem(t,{ic:'dumbbell',title:'Leg Day — Strength',sub:'18:00 · 50 min · with Coach Mia',right:badge(t,'TODAY','primary'),chevron:false}),
      listItem(t,{ic:'heart',title:'Yoga Flow',sub:'Tomorrow · 07:30 · 25 min',chevron:false}),
    ].join('<div style="border-top:1px solid '+t.border+'"></div>'))}
    <div class="mt16">${btn(t,'Book a session','primary',{small:true,iconBefore:icon('plus',16,t.primaryText)})}</div>
  </div></div>${tabBar(t,[{icon:'home',label:'Home'},{icon:'cal',label:'Plan'},{icon:'chart',label:'Stats'},{icon:'user',label:'You'}],1)}`;
});

screen('pulsefit-map-05', A, {title:'Run map', pattern:'Map', platform:'iOS',
  elements:['FAB','Chip','Card','Avatar'], colors:['#0A0F0D','#A3E635','#111714','#F4F7F2','#22D3EE']}, (t)=>{
  return `${statusBar(t)}<div class="scroll" style="position:relative">
    ${mapBase(t,{pins:[{x:15,y:82,icon:'play',label:'Start',c:'#A3E635'},{x:82,y:12,icon:'pin',label:'5.2 km',c:'#EC4899'}]})}
    <div style="position:absolute;top:64px;left:20px;right:20px">
      ${searchBar(t,'Search routes, parks, trails')}
      <div class="mt12">${chips(t,['Nearby','< 5 km','5–10 km','10 km+'],1)}</div></div>
    <div style="position:absolute;left:20px;right:20px;bottom:24px">
      ${card(t,`<div class="row" style="gap:14px">
        <div class="row center" style="width:64px;height:64px;border-radius:18px;background:linear-gradient(135deg,#1c2b12,#65A30D);flex:none">${icon('bike',30,'#1A2E05',1.8)}</div>
        <div class="grow"><div class="t15 w700">Riverside Loop</div><div class="t13 muted mt4">5.2 km · mostly flat · 4.8 ★ (212)</div>
        <div class="row mt8" style="gap:6px">${badge(t,'POPULAR','primary')}</div></div></div>
        <div class="mt12">${btn(t,'Start run','primary',{small:true})}</div>`)}
    </div>
    ${fab(t,'pin')}
  </div>`;
});

screen('pulsefit-search-06', A, {title:'Search exercises', pattern:'Search', platform:'Android',
  elements:['Search Bar','Chip','Carousel','List Item'], colors:['#0A0F0D','#A3E635','#111714','#F4F7F2','#8FA0B8']}, (t)=>{
  return `${statusBar(t)}${androidBar({t,title:'Exercises',back:false,actions:['filter']})}<div class="scroll"><div class="pad" style="padding-top:4px">
    ${searchBar(t,'Search 800+ exercises','kettlebell')}
    <div class="mt12">${chips(t,['All','Chest','Legs','Back','Core','Arms'],2)}</div>
    <div class="t17 w700 mt20 mb8">Featured</div>
    ${carousel(t,[['Goblet Squat','Legs · Dumbbell','#65A30D'],['Deadlift','Back · Barbell','#0E7490'],['Plank','Core · Bodyweight','#7C3AED']].map(e=>`
      <div style="flex:none;width:200px;border-radius:18px;background:${t.card};border:1px solid ${t.border};padding:14px">
        <div class="row center" style="height:110px;border-radius:12px;background:linear-gradient(135deg,${e[2]},#0A0F0D)">${icon('dumbbell',40,'#fff',1.5)}</div>
        <div class="t15 w700 mt12">${e[0]}</div><div class="t13 muted mt4">${e[1]}</div></div>`))}
    <div class="t17 w700 mt20 mb8">Legs · 48 results</div>
    ${card(t,[
      listItem(t,{ic:'dumbbell',title:'Barbell Squat',sub:'4 sets · 8–10 reps · Video guide'}),
      listItem(t,{ic:'dumbbell',title:'Romanian Deadlift',sub:'3 sets · 10–12 reps · Video guide'}),
      listItem(t,{ic:'dumbbell',title:'Walking Lunge',sub:'3 sets · 20 steps · Video guide'}),
    ].join('<div style="border-top:1px solid '+t.border+'"></div>'))}
  </div></div>${androidNav(t,[{icon:'home',label:'Home'},{icon:'search',label:'Explore'},{icon:'chart',label:'Stats'},{icon:'user',label:'You'}],1)}`;
});

screen('pulsefit-paywall-07', A, {title:'Subscription — paywall', pattern:'Subscription', platform:'Android',
  elements:['Button','Accordion','Badge','Card'], colors:['#0A0F0D','#A3E635','#111714','#F4F7F2','#EC4899']}, (t)=>{
  return `${statusBar(t)}<div class="scroll"><div class="pad" style="padding-top:12px">
    <div class="row between"><div></div><div style="padding:8px">${icon('x',24,t.text)}</div></div>
    <div class="center"><div class="row center" style="width:88px;height:88px;border-radius:28px;background:linear-gradient(135deg,#A3E635,#4D7C0F);margin:0 auto">${icon('crown',44,'#1A2E05',1.8)}</div>
      <div class="t28 w700 mt16">PulseFit <span style="color:${t.primary}">Pro</span></div>
      <div class="t15 muted mt8">Unlock the coach that never sleeps.</div></div>
    <div class="mt20" style="position:relative">${card(t,`
      <div class="row between"><div class="t17 w700">Yearly</div>${badge(t,'SAVE 40%','primary')}</div>
      <div class="row between mt8"><div class="t28 w700">€71.99<span class="t15 muted w400">/yr</span></div><div class="t13 muted">€6.00/mo</div></div>
      <div style="position:absolute;inset:-2px;border:2px solid ${t.primary};border-radius:20px;pointer-events:none"></div>`,18)}
    </div>
    <div class="mt12">${card(t,`<div class="row between"><div class="t17 w700">Monthly</div><div class="t20 w700">€9.99<span class="t14 muted w400">/mo</span></div></div>`,18)}</div>
    ${[['AI workout plans','Adaptive programs rebuilt every week'],['Form check','Real-time camera feedback on 40+ lifts'],['Nutrition sync','Meal plans matched to training days']].map(f=>`
      <div class="row mt12" style="gap:12px">${icon('check',20,t.primary,2.4)}<div><div class="t15 w600">${f[0]}</div><div class="t13 muted">${f[1]}</div></div></div>`).join('')}
    <div class="mt20">${btn(t,'Start 7-day free trial')}</div>
    <div class="t17 w700 mt20">Questions</div>
    <div class="mt8">${accordion(t,[
      {q:'Can I cancel anytime?',a:'Yes. Cancel in two taps from Settings — you keep Pro until the end of the billing period.'},
      {q:'Does it work offline?',a:'Download any plan and train without a connection. Stats sync when you are back.'},
      {q:'Is there a student discount?',a:'50% off with a valid student email, verified each year.'}])}</div>
    <div class="t12 faint center mt16 mb8">Recurring billing · Cancel anytime</div>
  </div></div>`;
});

screen('pulsefit-profile-08', A, {title:'Profile', pattern:'Profile', platform:'Android',
  elements:['Avatar','List Item','Chart','Card'], colors:['#0A0F0D','#A3E635','#111714','#F4F7F2','#8FA0B8']}, (t)=>{
  return `${statusBar(t)}${androidBar({t,title:'Profile',back:false,actions:['gear']})}<div class="scroll"><div class="pad" style="padding-top:8px">
    <div class="row" style="gap:16px">${avatar(t,'AR',76,'linear-gradient(135deg,#A3E635,#22D3EE)')}
      <div><div class="t20 w700">Arjun Rao</div><div class="t14 muted mt4">Intermediate · Goal: Build muscle</div>
      <div class="mt8">${btn(t,'Edit profile','soft',{small:true,full:false})}</div></div></div>
    <div class="mt16">${card(t,`<div class="t15 w700 mb8">This week</div><div class="row" style="gap:18px">
      <div style="position:relative">${ring(t,80,92,10)}<div class="center" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div class="t17 w700">4/5</div></div></div>
      <div class="grow">${[['Workouts','4'],['Streak','12 days'],['Minutes','186']].map(s=>`<div class="row between" style="padding:7px 0"><div class="t14 muted">${s[0]}</div><div class="t15 w700">${s[1]}</div></div>`).join('')}</div></div>`)}
    </div>
    <div class="mt16">${card(t,[
      listItem(t,{ic:'trophy' in P?'trophy':'crown',title:'Achievements',sub:'18 badges earned'}),
      listItem(t,{ic:'heart',title:'Health sync',sub:'Apple Health · connected'}),
      listItem(t,{ic:'users' in P?'users':'user',title:'Friends',sub:'Train with 6 friends'}),
    ].join('<div style="border-top:1px solid '+t.border+'"></div>'))}
  </div></div>${androidNav(t,[{icon:'home',label:'Home'},{icon:'dumbbell',label:'Train'},{icon:'chart',label:'Stats'},{icon:'user',label:'You'}],3)}`;
});

screen('pulsefit-settings-09', A, {title:'Settings', pattern:'Settings', platform:'Android',
  elements:['Toggle','Slider','Dropdown','List Item'], colors:['#0A0F0D','#A3E635','#111714','#F4F7F2','#8FA0B8']}, (t)=>{
  const row=(ic,title,control,sub)=>`<div class="row" style="padding:14px 0;gap:12px">
    <div class="row center" style="width:42px;height:42px;border-radius:13px;background:${t.primary}12;flex:none">${icon(ic,21,t.primary)}</div>
    <div class="grow"><div class="t15 w600">${title}</div>${sub?`<div class="t13 muted mt4">${sub}</div>`:''}</div>${control}</div>`;
  return `${statusBar(t)}${androidBar({t,title:'Settings',actions:['dots']})}<div class="scroll"><div class="pad">
    <div class="t13 w700 muted mb8" style="letter-spacing:1px">WORKOUT</div>
    ${card(t,[
      `<div style="padding:14px 0"><div class="row between"><div class="t15 w600">Default intensity</div><div class="t14 w700" style="color:${t.primary}">Moderate</div></div><div class="mt12">${slider(t,55)}</div></div>`,
      `<div style="padding:14px 0"><div class="row between"><div class="t15 w600">Rest timer beep</div></div><div class="mt12">${slider(t,80)}</div></div>`,
    ].join('<div style="border-top:1px solid '+t.border+'"></div>'))}
    <div class="t13 w700 muted mt20 mb8" style="letter-spacing:1px">GENERAL</div>
    ${card(t,[
      row('bell','Workout reminders',toggle(t,true),'Mon–Fri · 6:30 AM'),
      row('bolt','Auto-detect workouts',toggle(t,false),'Use motion sensors'),
      row('globe','Units',`<div class="t15 w600" style="color:${t.primary}">Metric</div>`,''),
    ].join('<div style="border-top:1px solid '+t.border+'"></div>'))}
    <div class="mt16">${dropdown(t,'Voice coach language','English (UK)')}</div>
  </div></div>${androidNav(t,[{icon:'home',label:'Home'},{icon:'dumbbell',label:'Train'},{icon:'chart',label:'Stats'},{icon:'user',label:'You'}],3)}`;
});

screen('pulsefit-notifications-10', A, {title:'Notifications', pattern:'Notifications', platform:'Android',
  elements:['List Item','Badge','Avatar'], colors:['#0A0F0D','#A3E635','#111714','#F4F7F2','#EC4899']}, (t)=>{
  return `${statusBar(t)}${androidBar({t,title:'Notifications',actions:['check']})}<div class="scroll"><div class="pad">
    ${card(t,[
      listItem(t,{av:avatar(t,'MC',44,'linear-gradient(135deg,#EC4899,#7C3AED)'),title:'Coach Mia',sub:'“Great squat depth today! Try 2.5 kg more next set.”',right:'<div class="t12 faint">2m</div>',chevron:false}),
      listItem(t,{ic:'flame',title:'Streak at risk',sub:'Work out today to keep your 12-day streak alive.',right:badge(t,'NEW','primary'),chevron:false}),
      listItem(t,{av:avatar(t,'DK',44,'linear-gradient(135deg,#22D3EE,#0E7490)'),title:'Dev K. beat you',sub:'Dev finished Riverside Loop in 24:02 — 16s faster.',right:'<div class="t12 faint">1h</div>',chevron:false}),
      listItem(t,{ic:'gift',title:'New plan available',sub:'“Marathon Base — 12 weeks” was added to your library.',right:'<div class="t12 faint">3h</div>',chevron:false}),
    ].join('<div style="border-top:1px solid '+t.border+'"></div>'))}
    <div class="center mt20">${btn(t,'Mark all as read','ghost',{small:true,full:false})}</div>
  </div></div>${androidNav(t,[{icon:'home',label:'Home'},{icon:'dumbbell',label:'Train'},{icon:'bell',label:'Inbox'},{icon:'user',label:'You'}],2)}`;
});

screen('pulsefit-empty-11', A, {title:'Empty state — no workouts', pattern:'Empty State', platform:'iOS',
  elements:['Button'], colors:['#0A0F0D','#A3E635','#111714','#F4F7F2','#8FA0B8']}, (t)=>{
  return `${statusBar(t)}${iosNav({t,title:'History',left:'back'})}<div class="scroll">
    ${emptyState(t,{emoji:icon('dumbbell',52,t.primary,1.4),title:'No workouts logged',body:'Your completed sessions will live here with stats, PRs and progress photos. Ready when you are.',action:'Browse plans'})}
  </div>${tabBar(t,[{icon:'home',label:'Home'},{icon:'dumbbell',label:'Train'},{icon:'chart',label:'Stats'},{icon:'user',label:'You'}],1)}`;
});

screen('pulsefit-chat-12', A, {title:'Coach chat', pattern:'Chat', platform:'iOS',
  elements:['Avatar','Button'], colors:['#0A0F0D','#A3E635','#111714','#F4F7F2','#8FA0B8']}, (t)=>{
  return `${statusBar(t)}<div class="row" style="flex:none;padding:8px 20px 4px;gap:12px">
      <div style="padding:8px 0">${icon('back',24,t.text)}</div>
      ${avatar(t,'MC',44,'linear-gradient(135deg,#EC4899,#7C3AED)')}
      <div class="grow"><div class="t17 w700">Coach Mia</div><div class="t13" style="color:${t.primary}">● Online · replies instantly</div></div>
      ${icon('cam',24,t.text)}</div>
    <div class="scroll"><div class="pad" style="padding-top:12px">
      <div class="t12 faint center mb12">Today</div>
      ${chatBubble(t,{me:false,text:'Morning Arjun! I reviewed yesterday\'s deadlift video — your back is rounding on rep 4. Drop to 70 kg and focus on bracing. 💪',time:'8:02'})}
      ${chatBubble(t,{me:true,text:'Got it. Should I still do the accessory work?',time:'8:15'})}
      ${chatBubble(t,{me:false,text:'Yes, but swap barbell rows for chest-supported rows. Less fatigue on the lower back.',time:'8:16'})}
      ${chatBubble(t,{me:false,text:'I\'ve updated today\'s plan accordingly. Tap below to open it 👇',time:'8:16'})}
      <div class="mt8" style="max-width:250px">${card(t,`<div class="row" style="gap:12px">${icon('dumbbell',28,t.primary)}<div><div class="t15 w700">Leg Day — updated</div><div class="t13 muted">50 min · 7 exercises</div></div></div>`,14)}</div>
    </div></div>${composer(t,'Message Coach Mia…')}`;
});

screen('pulsefit-workout-detail-13', A, {title:'Workout detail', pattern:'Search', platform:'iOS',
  elements:['Rating','List Item','Button','Card','Badge'], colors:['#0A0F0D','#A3E635','#111714','#F4F7F2','#F59E0B']}, (t)=>{
  const ex=[['Barbell Squat','4 × 8–10 · 80 kg'],['Romanian Deadlift','3 × 10–12 · 60 kg'],['Walking Lunge','3 × 20 steps · 2×16 kg'],['Leg Curl','3 × 12 · machine'],['Calf Raise','4 × 15 · bodyweight']];
  return `${statusBar(t)}<div class="scroll">
    <div style="position:relative;height:270px;background:linear-gradient(160deg,#1c2b12,#3F6212 60%,#0A0F0D);overflow:hidden">
      <div style="position:absolute;top:56px;left:20px;z-index:2">${icon('back',26,'#fff')}</div>
      <div style="position:absolute;top:56px;right:20px;z-index:2">${icon('heart',26,'#fff')}</div>
      <div class="row center" style="height:100%">${icon('dumbbell',90,'rgba(163,230,53,.9)',1.2)}</div>
      <div style="position:absolute;left:20px;bottom:18px;right:20px">
        <div class="row" style="gap:8px">${badge(t,'STRENGTH','primary')}${badge(t,'INTERMEDIATE','primary')}</div>
        <div class="t28 w700 mt8" style="color:#fff">Leg Day — Strength</div></div></div>
    <div class="pad" style="margin-top:-0px;padding-top:16px">
      <div class="row between">${stars(t,5)}<div class="t14 w600">4.8 <span class="muted w400">(2.1k ratings)</span></div></div>
      <div class="row mt12" style="gap:12px">
        ${[['clock','50 min'],['flame','420 kcal'],['bolt','High intensity']].map(s=>`<div class="grow">${card(t,`<div class="center">${icon(s[0],22,t.primary)}<div class="t13 w600 mt8">${s[1]}</div></div>`,12)}</div>`).join('')}
      </div>
      <div class="t17 w700 mt20 mb8">Exercises · 5</div>
      ${card(t,ex.map((e,i)=>listItem(t,{ic:'dumbbell',title:`<span class="t13 w700" style="color:${t.primary}">${i+1}</span>&nbsp;&nbsp;${e[0]}`,sub:e[1],chevron:false})).join('<div style="border-top:1px solid '+t.border+'"></div>'))}
      <div class="mt16">${btn(t,'Start workout','primary',{iconBefore:icon('play',18,t.primaryText)})}</div>
      <div style="height:8px"></div>
    </div></div>`;
});

screen('pulsefit-workout-preview-14', A, {title:'Exercise preview', pattern:'Search', platform:'iOS',
  elements:['Stepper','Button','Progress Bar','Card'], colors:['#0A0F0D','#A3E635','#111714','#F4F7F2','#8FA0B8']}, (t)=>{
  return `${statusBar(t)}${iosNav({t,title:'Up next',sub:'Exercise 1 of 5',left:'x',large:false})}
  <div class="scroll"><div class="pad">
    <div style="position:relative;height:240px;border-radius:22px;background:linear-gradient(135deg,#16241a,#2A3B22);overflow:hidden">
      <div class="row center" style="height:100%">${icon('dumbbell',70,t.primary,1.3)}</div>
      <div class="row center" style="position:absolute;inset:0"><div class="row center" style="width:72px;height:72px;border-radius:36px;background:rgba(0,0,0,.5);border:1.5px solid rgba(255,255,255,.4)">${icon('play',30,'#fff',2)}</div></div>
      <div class="t12 w700" style="position:absolute;left:16px;bottom:14px;background:rgba(0,0,0,.55);color:#fff;padding:6px 12px;border-radius:10px">▶ 0:42 demo</div></div>
    <div class="t24 w700 mt16">Barbell Squat</div>
    <div class="t14 muted mt8" style="line-height:1.65">Stand with feet shoulder-width apart, bar resting on your upper back. Brace your core, push your hips back and bend your knees until thighs are parallel to the floor. Drive up through your heels.</div>
    <div class="mt16">${card(t,`
      <div class="mb12">${stepper(t,4,'Sets')}</div><div style="border-top:1px solid ${t.border}"></div>
      <div class="mt12">${stepper(t,10,'Reps per set')}</div><div style="border-top:1px solid ${t.border}"></div>
      <div class="mt12">${stepper(t,80,'Weight (kg)')}</div>`)}
    </div>
    <div class="t13 muted mt12 center">90s rest between sets · auto timer</div>
  </div></div>
  <div style="flex:none;padding:12px 20px 30px">${btn(t,'Begin set 1')}</div>`;
});

screen('pulsefit-workout-active-15', A, {title:'Active workout', pattern:'Activity/Stats', platform:'iOS',
  elements:['Chart','Progress Bar','Button'], colors:['#0A0F0D','#A3E635','#111714','#F4F7F2','#EC4899']}, (t)=>{
  return `${statusBar(t)}<div class="scroll"><div class="pad" style="padding-top:16px">
    <div class="row between"><div class="t13 w700" style="color:${t.primary};letter-spacing:1px">● LIVE</div><div class="t13 muted">Set 2 of 4</div></div>
    <div class="center mt12"><div class="t17 w700">Barbell Squat</div>
      <div style="display:flex;justify-content:center;margin-top:16px"><div style="position:relative">${ring(t,64,190,16)}
        <div class="center" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
          <div class="t34 w700" style="font-size:44px;letter-spacing:-1px">8</div><div class="t13 muted w600">REPS LEFT</div></div></div></div></div>
    <div class="row mt20" style="gap:12px">
      ${[['128','❤ BPM'],['2:14','ELAPSED'],['186','KCAL']].map(s=>`<div class="grow">${card(t,`<div class="center"><div class="t20 w700">${s[0]}</div><div class="t12 muted mt4">${s[1]}</div></div>`,12)}</div>`).join('')}
    </div>
    <div class="mt16">${card(t,`<div class="t14 w600 mb8">Heart-rate zone</div>${lineChart(t,[96,104,112,118,126,132,128,136,142,138,145,150])}
      <div class="row between mt8"><div class="t12 muted">Warm-up</div><div class="t12 w700" style="color:${t.primary}">Fat burn</div><div class="t12 muted">Peak</div></div>`,16)}
    </div>
    <div class="row mt20" style="gap:12px">
      <div class="grow">${btn(t,'Pause','soft',{iconBefore:icon('pause',16,t.primary)})}</div>
      <div class="grow">${btn(t,'Complete set', 'primary',{iconBefore:icon('check',16,t.primaryText)})}</div></div>
  </div></div>`;
});

screen('pulsefit-workout-summary-16', A, {title:'Workout summary', pattern:'Activity/Stats', platform:'iOS',
  elements:['Rating','Toast','Button','Card','Chart'], colors:['#0A0F0D','#A3E635','#111714','#F4F7F2','#F59E0B']}, (t)=>{
  return `${statusBar(t)}<div class="scroll"><div class="pad" style="padding-top:40px">
    <div class="row center" style="width:96px;height:96px;border-radius:48px;background:${t.primary}1e;margin:0 auto">${icon('crown',46,t.primary,1.6)}</div>
    <div class="t28 w700 center mt16">Workout complete!</div>
    <div class="t15 muted center mt8">Leg Day — Strength · 48 min</div>
    <div class="row mt20" style="gap:12px">
      ${[['420','kcal'],['3.2t','volume'],['+2','PRs']].map(s=>`<div class="grow">${card(t,`<div class="center"><div class="t24 w700" style="color:${t.primary}">${s[0]}</div><div class="t12 muted mt4">${s[1]}</div></div>`,14)}</div>`).join('')}
    </div>
    <div class="mt16">${card(t,`<div class="t15 w700">How did it feel?</div><div class="mt12 row center" style="gap:6px">${stars(t,0,30)}</div><div class="t13 muted center mt8">Tap to rate</div>`)}</div>
    <div class="mt20">${btn(t,'Save & share')}<div class="mt12">${btn(t,'Back to home','ghost')}</div></div>
  </div></div>${toast(t,'New PR! Squat 82.5 kg × 8 🎉','crown')}`;
});

}

// ================= WANDERLY =================
{ const A='wanderly', T=()=>THEMES[A];

screen('wanderly-home-01', A, {title:'Home — explore', pattern:'Home', platform:'iOS',
  elements:['Tab Bar','Search Bar','Carousel','Card','Avatar'], colors:['#FFF7ED','#EA580C','#FFFFFF','#1C1917','#0F766E']}, (t)=>{
  const dest=(city,country,price,grad,emoji)=>`
    <div style="flex:none;width:230px;border-radius:20px;overflow:hidden;background:${t.card};border:1px solid ${t.border};box-shadow:${t.shadow}">
      <div class="row center" style="height:130px;background:${grad};font-size:52px">${emoji}</div>
      <div style="padding:14px"><div class="t15 w700">${city}</div><div class="t13 muted mt4">${country}</div>
      <div class="row between mt8"><div class="t14 w700" style="color:${t.primary}">from €${price}</div><div class="t12 muted">round trip</div></div></div></div>`;
  return `${statusBar(t)}<div class="scroll"><div class="pad" style="padding-top:8px">
    <div class="row between">
      <div class="row" style="gap:12px">${avatar(t,'SL',46,'linear-gradient(135deg,#EA580C,#F59E0B)')}<div><div class="t13 muted">Where to next,</div><div class="t17 w700">Sofia? ✈️</div></div></div>
      <div style="position:relative;padding:10px">${icon('bell',24,t.text)}<div style="position:absolute;top:8px;right:8px;width:10px;height:10px;border-radius:5px;background:${t.danger};border:2px solid ${t.bg}"></div></div></div>
    <div class="mt16">${searchBar(t,'Search destinations, hotels, flights')}</div>
    <div class="row between mt20 mb8"><div class="t17 w700">Trending now</div><div class="t13 w600" style="color:${t.primary}">See all</div></div>
    </div><div style="padding-left:20px">${carousel(t,[
      dest('Kyoto','Japan','486','linear-gradient(135deg,#FCA5A5,#DC2626)','⛩️'),
      dest('Lisbon','Portugal','89','linear-gradient(135deg,#FDBA74,#EA580C)','🌊'),
      dest('Reykjavik','Iceland','214','linear-gradient(135deg,#99F6E4,#0F766E)','🏔️')])}
    </div><div class="pad">
    <div class="t17 w700 mt20 mb8">Your upcoming trip</div>
    ${card(t,`<div class="row" style="gap:14px">
      <div class="row center" style="width:76px;height:76px;border-radius:18px;background:linear-gradient(135deg,#FDBA74,#EA580C);font-size:34px;flex:none">🇪🇸</div>
      <div class="grow"><div class="t15 w700">Barcelona, Spain</div><div class="t13 muted mt4">Oct 24 – Oct 28 · 2 travelers</div>
      <div class="mt8">${progress(t,82,6)}</div><div class="t12 mt4" style="color:${t.accent}">✓ Flights booked · hotel pending</div></div></div>`)}
  </div></div>${tabBar(t,[{icon:'home',label:'Explore'},{icon:'search',label:'Search'},{icon:'heart',label:'Saved'},{icon:'user',label:'Profile'}],0)}`;
});

screen('wanderly-search-02', A, {title:'Search flights', pattern:'Search', platform:'iOS',
  elements:['Segmented Control','Date Picker','Stepper','Text Field','Button','Chip'], colors:['#FFF7ED','#EA580C','#FFFFFF','#1C1917','#0F766E']}, (t)=>{
  return `${statusBar(t)}${iosNav({t,title:'Find flights',left:'x'})}<div class="scroll"><div class="pad">
    <div class="mt8">${segmented(t,['Round trip','One way','Multi-city'],0)}</div>
    <div class="mt16">${card(t,`
      <div class="row" style="gap:12px">
        <div class="grow">${textField(t,{label:'From',value:'Bremen (BRE)',icon:'pin'})}</div>
        <div class="row center" style="width:40px;height:40px;border-radius:20px;background:${t.primary}14;flex:none;margin-top:22px">${icon('chevD',18,t.primary)}</div>
        <div class="grow">${textField(t,{label:'To',value:'',placeholder:'Where to?'})}</div></div>
      <div class="mt16">${chips(t,['Barcelona','Lisbon','Rome','Athens'],0)}</div>`)}
    </div>
    <div class="t15 w700 mt20 mb8">Dates</div>
    ${dateStrip(t,[['Thu','15'],['Fri','16'],['Sat','17'],['Sun','18'],['Mon','19'],['Tue','20']],0)}
    <div class="mt16">${card(t,`<div class="mb8">${stepper(t,2,'Adults')}</div><div style="border-top:1px solid ${t.border}"></div><div class="mt8">${stepper(t,0,'Children')}</div>`)}
    </div>
    <div class="mt16">${btn(t,'Search 240 flights','primary',{iconBefore:icon('search',18,t.primaryText)})}</div>
  </div></div>${tabBar(t,[{icon:'home',label:'Explore'},{icon:'search',label:'Search'},{icon:'heart',label:'Saved'},{icon:'user',label:'Profile'}],1)}`;
});

screen('wanderly-results-13', A, {title:'Flight results', pattern:'Search', platform:'iOS',
  elements:['Chip','List Item','Dropdown','Card','Badge'], colors:['#FFF7ED','#EA580C','#FFFFFF','#1C1917','#0F766E']}, (t)=>{
  const fl=(dep,arr,dur,air,price,tag)=>`
    <div style="padding:16px 0">
      <div class="row between"><div class="t20 w700">${dep} <span class="t14 muted w400">→</span> ${arr}</div>${tag?badge(t,tag,'primary'):''}</div>
      <div class="t13 muted mt4">${air} · ${dur} · Direct</div>
      <div class="row between mt12"><div class="t24 w700" style="color:${t.primary}">€${price}</div>${btn(t,'Select','primary',{small:true,full:false})}</div>
    </div>`;
  return `${statusBar(t)}${iosNav({t,title:'BRE → BCN',sub:'Fri, Oct 24 · 2 travelers · 18 results',left:'back',large:false})}
  <div class="scroll"><div class="pad" style="padding-top:8px">
    <div class="row between"><div style="flex:1;margin-right:10px">${chips(t,['Filters · 2','Nonstop','Morning'],0)}</div></div>
    <div class="mt8">${dropdown(t,'Sort by','Cheapest first')}</div>
    <div class="mt12">${card(t,[
      fl('07:05','09:35','2h 30m','Wanderly Air','89','CHEAPEST'),
      fl('12:40','15:10','2h 30m','Nordwind','104',''),
      fl('18:20','20:50','2h 30m','Wanderly Air','129','FLEX'),
    ].join('<div style="border-top:1px solid '+t.border+'"></div>'))}
    </div>
    <div class="row center mt16" style="gap:8px">${icon('bell',18,t.primary)}<div class="t14 w600" style="color:${t.primary}">Set price alert for this route</div></div>
  </div></div>`;
});

screen('wanderly-flight-detail-14', A, {title:'Flight detail', pattern:'Search', platform:'iOS',
  elements:['Rating','Card','Button','Badge','List Item'], colors:['#FFF7ED','#EA580C','#FFFFFF','#1C1917','#0F766E']}, (t)=>{
  return `${statusBar(t)}${iosNav({t,title:'Flight WA 214',sub:'Wanderly Air · Airbus A320neo',left:'back',large:false})}
  <div class="scroll"><div class="pad" style="padding-top:8px">
    ${card(t,`
      <div class="row" style="gap:0">
        <div class="grow center"><div class="t24 w700">07:05</div><div class="t13 muted mt4">BRE</div><div class="t12 faint">Bremen</div></div>
        <div class="grow center" style="position:relative"><div class="t12 muted">2h 30m · Direct</div>
          <div style="height:2px;background:${t.border};margin:8px 12px;position:relative"><div style="position:absolute;left:0;top:-4px;width:10px;height:10px;border-radius:5px;background:${t.primary}"></div><div style="position:absolute;right:0;top:-4px;width:10px;height:10px;border-radius:5px;background:${t.primary}"></div></div>
          ${icon('plane',26,t.primary)}</div>
        <div class="grow center"><div class="t24 w700">09:35</div><div class="t13 muted mt4">BCN</div><div class="t12 faint">Barcelona</div></div></div>
      <div class="row between mt16" style="background:${t.surface2};border-radius:12px;padding:12px 14px">
        <div class="row" style="gap:8px">${stars(t,4,15)}<div class="t13 w600">4.6 · 8.2k reviews</div></div>${badge(t,'ON TIME','ok')}</div>`)}
    <div class="t17 w700 mt20 mb8">What's included</div>
    ${card(t,[
      listItem(t,{ic:'bag',title:'Cabin bag + personal item',sub:'Up to 10 kg combined',chevron:false,right:icon('check',18,t.accent)}),
      listItem(t,{ic:'bed',title:'Seat selection',sub:'Standard seat included',chevron:false,right:icon('check',18,t.accent)}),
      listItem(t,{ic:'wifi',title:'Wi-Fi & power',sub:'Free messaging, USB-C at seat',chevron:false,right:icon('check',18,t.accent)}),
    ].join('<div style="border-top:1px solid '+t.border+'"></div>'))}
    <div class="row between mt20"><div><div class="t13 muted">Total for 2 travelers</div><div class="t28 w700">€178.00</div></div>${badge(t,'−12% today','primary')}</div>
  </div></div>
  <div style="flex:none;padding:12px 20px 30px">${btn(t,'Continue to checkout')}</div>`;
});

screen('wanderly-map-03', A, {title:'Destinations map', pattern:'Map', platform:'iOS',
  elements:['Bottom Sheet','Search Bar','Chip','Card'], colors:['#FFF7ED','#EA580C','#FFFFFF','#1C1917','#0F766E']}, (t)=>{
  return `${statusBar(t)}<div class="scroll" style="position:relative">
    ${mapBase(t,{route:false,pins:[{x:30,y:30,icon:'pin',label:'€89',c:'#EA580C'},{x:62,y:48,icon:'pin',label:'€104',c:'#0F766E'},{x:76,y:70,icon:'pin',label:'€129',c:'#EA580C'},{x:45,y:64,icon:'pin',label:'€76',c:'#0F766E'}]})}
    <div style="position:absolute;top:64px;left:20px;right:20px">${searchBar(t,'Where to?')}</div>
    <div style="position:absolute;top:128px;left:20px;right:20px">${chips(t,['Flights','Hotels','Experiences'],0)}</div>
    ${bottomSheet(t,{title:'Lisbon, Portugal',sub:'4.9 ★ · 12k reviews · Best in October',
      body:`<div class="row" style="gap:12px">
        <div class="row center" style="width:110px;height:110px;border-radius:16px;background:linear-gradient(135deg,#FDBA74,#EA580C);font-size:48px;flex:none">🌊</div>
        <div class="grow"><div class="t15 w700">Flights from €89</div><div class="t13 muted mt4">2h 55m direct · 14 hotels from €64/nt</div>
        <div class="t13 mt8" style="color:${t.accent}">☀ 21°C · Perfect beach weather</div></div></div>`,
      cta:btn(t,'Explore Lisbon')})}
  </div>`;
});

screen('wanderly-calendar-04', A, {title:'Trip calendar', pattern:'Calendar', platform:'Android',
  elements:['CalendarGrid','Button','Card','Badge'], colors:['#FFF7ED','#EA580C','#FFFFFF','#1C1917','#0F766E']}, (t)=>{
  const weeks=[['','','','1','2','3','4'],['5','6','7','8','9','10','11'],['12','13','14','15','16','17','18'],['19','20','21','22','23','24','25'],['26','27','28','29','30','31','']];
  return `${statusBar(t)}${androidBar({t,title:'October 2026',actions:['chevL','chevR']})}<div class="scroll"><div class="pad" style="padding-top:4px">
    ${card(t,calendarGrid(t,weeks,'24'))}
    <div class="t17 w700 mt20 mb8">Selected dates</div>
    ${card(t,`<div class="row between"><div><div class="t15 w700">Fri, Oct 24 → Tue, Oct 28</div><div class="t13 muted mt4">4 nights · flexible ±2 days</div></div>${badge(t,'4 NIGHTS','primary')}</div>`)}
    <div class="mt16">${card(t,`<div class="t15 w700 mb8">Price trend</div>${barsChart(t,[120,140,110,190,210,150,130,170,200,230,180,160],80)}
      <div class="t13 mt8" style="color:${t.accent}">✓ Oct 24 is the cheapest departure this month</div>`,16)}
    </div>
  </div></div>
  <div style="flex:none;padding:12px 20px 26px">${btn(t,'Apply dates')}</div>`;
});

screen('wanderly-checkout-05', A, {title:'Booking checkout', pattern:'Checkout', platform:'iOS',
  elements:['Card','List Item','Checkbox','Button','Progress Bar'], colors:['#FFF7ED','#EA580C','#FFFFFF','#1C1917','#0F766E']}, (t)=>{
  return `${statusBar(t)}${iosNav({t,title:'Checkout',sub:'Step 2 of 2 · Payment & travelers',left:'back',large:false})}
  <div class="scroll"><div class="pad" style="padding-top:8px">
    ${progress(t,66,6)}
    <div class="t17 w700 mt16 mb8">Your trip</div>
    ${card(t,`<div class="row" style="gap:14px">
      <div class="row center" style="width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,#FDBA74,#EA580C);font-size:30px;flex:none">🇪🇸</div>
      <div class="grow"><div class="t15 w700">Bremen → Barcelona</div><div class="t13 muted mt4">Fri, Oct 24 · 07:05 · 2 travelers</div></div>
      <div class="t15 w700" style="color:${t.primary}">€178</div></div>`)}
    <div class="t17 w700 mt20 mb8">Travelers</div>
    ${card(t,[
      listItem(t,{av:avatar(t,'SL',44,'linear-gradient(135deg,#EA580C,#F59E0B)'),title:'Sofia Lindqvist',sub:'Adult · Passport ····8821'}),
      listItem(t,{av:avatar(t,'+',44,'linear-gradient(135deg,#0F766E,#14B8A6)'),title:'Add traveler',sub:'Second passenger details',chevron:true}),
    ].join('<div style="border-top:1px solid '+t.border+'"></div>'))}
    <div class="t17 w700 mt20 mb8">Extras</div>
    ${card(t,`<div class="mb8">${checkbox(t,true,'Priority boarding','€12 · board first, extra cabin bag')}</div><div style="border-top:1px solid ${t.border}"></div><div class="mt8">${checkbox(t,false,'Travel insurance','€18 · cancellation + medical')}</div>`)}
    <div class="mt16">${checkbox(t,true,'I accept the fare conditions and privacy policy','')}</div>
  </div></div>
  <div style="flex:none;padding:12px 20px 30px"><div class="row between mb12"><div class="t14 muted">Total incl. taxes</div><div class="t24 w700">€190.00</div></div>${btn(t,'Pay €190.00')}</div>`;
});

screen('wanderly-confirm-15', A, {title:'Booking confirmation', pattern:'Checkout', platform:'iOS',
  elements:['Banner','Button','Card','Badge'], colors:['#FFF7ED','#0F766E','#FFFFFF','#1C1917','#EA580C']}, (t)=>{
  return `${statusBar(t)}<div class="scroll"><div class="pad" style="padding-top:48px">
    <div class="row center" style="width:110px;height:110px;border-radius:55px;background:${t.accent}18;margin:0 auto">
      <div class="row center" style="width:84px;height:84px;border-radius:42px;background:${t.accent}">${icon('check',40,'#fff',2.6)}</div></div>
    <div class="t28 w700 center mt20">You're going to<br>Barcelona! 🎉</div>
    <div class="t15 muted center mt8">Booking <b>WDL-8X42KQ</b> · confirmation<br>sent to sofia@mail.de</div>
    <div class="mt20">${card(t,`
      <div class="row between"><div class="t13 muted w600" style="letter-spacing:1px">BOARDING PASS</div>${badge(t,'CONFIRMED','ok')}</div>
      <div class="row mt12" style="gap:0">
        <div><div class="t24 w700">BRE</div><div class="t13 muted">07:05</div></div>
        <div class="grow center"><div style="border-top:2px dashed ${t.border};margin:0 12px;position:relative"><div style="position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:${t.card};padding:0 8px">${icon('plane',20,t.primary)}</div></div><div class="t12 muted mt8">WA 214 · 2h 30m</div></div>
        <div style="text-align:right"><div class="t24 w700">BCN</div><div class="t13 muted">09:35</div></div></div>
      <div class="row between mt16" style="background:${t.surface2};border-radius:12px;padding:12px 14px">
        <div class="t14 w600">Sofia Lindqvist · Seat 14A</div><div class="t14 w600 muted">Fri, Oct 24</div></div>`)}
    </div>
    <div class="mt16">${banner(t,'Add your hotel in Barcelona — members save an extra <b>10%</b> when bundled.','bed','promo')}</div>
    <div class="mt20">${btn(t,'View my trips')}<div class="mt12">${btn(t,'Back to explore','ghost')}</div></div>
  </div></div>`;
});

screen('wanderly-payment-06', A, {title:'Payment method', pattern:'Payment Method', platform:'Android',
  elements:['Radio','Card','Button','List Item'], colors:['#FFF7ED','#EA580C','#FFFFFF','#1C1917','#0F766E']}, (t)=>{
  const pm=(brand,last,sel,sub)=>`<div style="border-radius:16px;padding:4px 16px;background:${t.card};border:${sel?`2px solid ${t.primary}`:`1px solid ${t.border}`};margin-bottom:12px">
    ${radio(t,sel,`<span class="t15 w700">${brand} ···· ${last}</span>`,`<span class="t13 muted">${sub}</span>`)}</div>`;
  return `${statusBar(t)}${androidBar({t,title:'Payment method',actions:[]})}<div class="scroll"><div class="pad" style="padding-top:8px">
    ${pm('Visa','4021',true,'Expires 09/29 · default')}
    ${pm('Mastercard','8814',false,'Expires 04/28')}
    ${pm('PayPal','sofia@mail.de',false,'Instant · buyer protection')}
    <div class="mt8">${btn(t,'Add new card','ghost',{iconBefore:icon('plus',18,t.primary)})}</div>
    <div class="t17 w700 mt20 mb8">Billing address</div>
    ${card(t,listItem(t,{ic:'pin',title:'Feldstraße 12, 28203 Bremen',sub:'Germany · matches card',chevron:false,right:icon('check',18,t.accent)}))}
  </div></div>
  <div style="flex:none;padding:12px 20px 26px">${btn(t,'Save & continue')}</div>
  ${androidNav(t,[{icon:'home',label:'Explore'},{icon:'search',label:'Search'},{icon:'heart',label:'Saved'},{icon:'user',label:'Profile'}],1)}`;
});

screen('wanderly-chat-07', A, {title:'Support chat', pattern:'Chat', platform:'Android',
  elements:['Avatar','Chip','Card'], colors:['#FFF7ED','#EA580C','#FFFFFF','#1C1917','#0F766E']}, (t)=>{
  return `${statusBar(t)}<div class="row" style="flex:none;padding:8px 20px 4px;gap:12px">
      <div style="padding:8px 0">${icon('back',24,t.text)}</div>
      ${avatar(t,'W',44,'linear-gradient(135deg,#0F766E,#14B8A6)')}
      <div class="grow"><div class="t17 w700">Wanderly Support</div><div class="t13" style="color:${t.accent}">● Online · avg reply 2 min</div></div>
      ${icon('dots',24,t.text)}</div>
    <div class="scroll"><div class="pad" style="padding-top:12px">
      <div class="t12 faint center mb12">Today</div>
      ${chatBubble(t,{me:false,text:'Hi Sofia! 👋 I\'m Nia from Wanderly support. How can I help with booking WDL-8X42KQ?',time:'10:02'})}
      ${chatBubble(t,{me:true,text:'Can I change my return flight to Oct 29?',time:'10:04'})}
      ${chatBubble(t,{me:false,text:'Of course! Moving BCN → BRE to Thu, Oct 29 adds €24 fare difference. Want me to apply it?',time:'10:05'})}
      <div class="mt8 mb12">${chips(t,['Yes, change it','Show options','Talk to agent'],0)}</div>
      ${card(t,`<div class="t14 w600">Quick answers</div><div class="t13 muted mt8" style="line-height:1.7">· Free cancellation within 24h<br>· Baggage allowance by fare<br>· Check-in opens 48h before</div>`,14)}
    </div></div>${composer(t,'Type your message…')}`;
});

screen('wanderly-profile-08', A, {title:'Profile', pattern:'Profile', platform:'Android',
  elements:['Avatar','Badge','List Item','Card','Progress Bar'], colors:['#FFF7ED','#EA580C','#FFFFFF','#1C1917','#0F766E']}, (t)=>{
  return `${statusBar(t)}${androidBar({t,title:'Profile',actions:['edit']})}<div class="scroll"><div class="pad">
    <div class="row" style="gap:16px">${avatar(t,'SL',80,'linear-gradient(135deg,#EA580C,#F59E0B)')}
      <div><div class="t20 w700">Sofia Lindqvist</div><div class="t14 muted mt4">Explorer level 7</div>
      <div class="mt8">${progress(t,68,6)}</div><div class="t12 mt4" style="color:${t.primary}">320 pts to Gold status</div></div></div>
    <div class="row mt16" style="gap:12px">
      ${[['23','Trips'],['14','Countries'],['8.2k','Points']].map(s=>`<div class="grow">${card(t,`<div class="center"><div class="t20 w700" style="color:${t.primary}">${s[0]}</div><div class="t12 muted mt4">${s[1]}</div></div>`,12)}</div>`).join('')}
    </div>
    <div class="mt16">${card(t,[
      listItem(t,{ic:'ticket',title:'My bookings',sub:'2 upcoming · 21 past',right:badge(t,'2','primary'),chevron:false}),
      listItem(t,{ic:'heart',title:'Saved places',sub:'18 destinations · 6 collections'}),
      listItem(t,{ic:'gift',title:'Rewards',sub:'8,200 pts · €41 value'}),
      listItem(t,{ic:'users' in P?'users':'user',title:'Travel buddies',sub:'Invite friends, earn points'}),
    ].join('<div style="border-top:1px solid '+t.border+'"></div>'))}
  </div></div>${androidNav(t,[{icon:'home',label:'Explore'},{icon:'search',label:'Search'},{icon:'heart',label:'Saved'},{icon:'user',label:'Profile'}],3)}`;
});

screen('wanderly-notifications-09', A, {title:'Notifications', pattern:'Notifications', platform:'Android',
  elements:['List Item','Badge','Card'], colors:['#FFF7ED','#EA580C','#FFFFFF','#1C1917','#0F766E']}, (t)=>{
  const n=(emoji,title,body,time,unread)=>`<div class="row" style="padding:14px 0;gap:12px;${unread?`background:${t.primary}0d;margin:0 -20px;padding-left:20px;padding-right:20px;border-radius:14px`:''}">
      <div class="row center" style="width:52px;height:52px;border-radius:16px;background:${t.surface2};font-size:26px;flex:none;border:1px solid ${t.border}">${emoji}</div>
      <div class="grow"><div class="row between"><div class="t15 w600">${title}</div><div class="t12 faint">${time}</div></div>
      <div class="t13 muted mt4" style="line-height:1.5">${body}</div></div>${unread?`<div style="width:9px;height:9px;border-radius:5px;background:${t.primary};flex:none"></div>`:''}</div>`;
  return `${statusBar(t)}${androidBar({t,title:'Notifications',back:false,actions:['check']})}<div class="scroll"><div class="pad" style="padding-top:4px">
    ${n('✈️','Check-in is open','WA 214 to Barcelona departs in 48h. Grab seat 14A now.','2h',true)}
    ${n('💰','Price drop: Lisbon','Round trips BRE → LIS fell to <b>€76</b> (−15%).','5h',true)}
    ${n('🏨','Hotel deal in Barcelona','Hotel Brummell has 3 rooms left at <b>€112/nt</b> for your dates.','Yesterday',false)}
    ${n('🎒','Trip reminder','Packing list for Barcelona is ready — 14 items.','2d',false)}
  </div></div>${androidNav(t,[{icon:'home',label:'Explore'},{icon:'search',label:'Search'},{icon:'bell',label:'Alerts'},{icon:'user',label:'Profile'}],2)}`;
});

screen('wanderly-empty-10', A, {title:'Empty state — no saved trips', pattern:'Empty State', platform:'iOS',
  elements:['Button'], colors:['#FFF7ED','#EA580C','#FFFFFF','#1C1917','#0F766E']}, (t)=>{
  return `${statusBar(t)}${iosNav({t,title:'Saved',left:'back'})}<div class="scroll">
    ${emptyState(t,{emoji:'🧳',title:'No saved trips yet',body:'Tap the heart on any destination, hotel or experience and it will wait for you right here.',action:'Discover destinations'})}
  </div>${tabBar(t,[{icon:'home',label:'Explore'},{icon:'search',label:'Search'},{icon:'heart',label:'Saved'},{icon:'user',label:'Profile'}],2)}`;
});

screen('wanderly-feed-11', A, {title:'Travel stories feed', pattern:'Feed', platform:'iOS',
  elements:['Carousel','Skeleton','Avatar','Card','Badge'], colors:['#FFF7ED','#EA580C','#FFFFFF','#1C1917','#0F766E']}, (t)=>{
  const story=(name,place,likes,grad,emoji)=>`
    <div style="border-radius:22px;overflow:hidden;background:${t.card};border:1px solid ${t.border};box-shadow:${t.shadow};margin-bottom:16px">
      <div class="row" style="padding:14px;gap:12px">${avatar(t,name.split(' ').map(w=>w[0]).join(''),44,grad)}
        <div class="grow"><div class="t15 w700">${name}</div><div class="t13 muted">${place} · 2h ago</div></div>${btn(t,'Follow','ghost',{small:true,full:false})}</div>
      <div class="row center" style="height:220px;background:${grad};font-size:72px">${emoji}</div>
      <div style="padding:14px"><div class="row" style="gap:16px">${icon('heart',24,t.danger)}${icon('chat',24,t.muted)}${icon('send',24,t.muted)}<div class="grow"></div>${icon('ticket',24,t.muted)}</div>
      <div class="t14 w700 mt8">${likes} likes</div><div class="t14 mt4"><b>${name.split(' ')[0]}</b> Three perfect days in ${place.split(',')[0]} — save this itinerary 👇</div></div></div>`;
  return `${statusBar(t)}${iosNav({t,title:'Stories',sub:'From travelers you follow',left:'x'})}<div class="scroll"><div class="pad">
    <div class="mb16">${carousel(t,['Kyoto','Lisbon','Bali','Peru'].map((c,i)=>`
      <div class="center" style="flex:none;width:120px"><div class="row center" style="width:76px;height:76px;border-radius:38px;background:linear-gradient(135deg,#EA580C,#F59E0B);padding:3px;margin:0 auto"><div class="row center" style="width:100%;height:100%;border-radius:34px;background:${t.card};font-size:30px">${['⛩️','🌊','🏝️','🦙'][i]}</div></div><div class="t12 w600 mt8">${c}</div></div>`))}
    </div>
    ${story('Maya Chen','Kyoto, Japan','1,284','linear-gradient(135deg,#FCA5A5,#DC2626)','⛩️')}
    ${story('Tom Becker','Lisbon, Portugal','862','linear-gradient(135deg,#FDBA74,#EA580C)','🌊')}
    <div class="t13 muted center mb8">Loading more stories…</div>
    <div class="mb12">${skeleton(t,80)}</div><div class="mb12">${skeleton(t,80,'82%')}</div>
  </div></div>${tabBar(t,[{icon:'home',label:'Explore'},{icon:'globe',label:'Stories'},{icon:'heart',label:'Saved'},{icon:'user',label:'Profile'}],1)}`;
});

screen('wanderly-settings-12', A, {title:'Settings', pattern:'Settings', platform:'Android',
  elements:['Toggle','Accordion','Dropdown','List Item'], colors:['#FFF7ED','#EA580C','#FFFFFF','#1C1917','#0F766E']}, (t)=>{
  const row=(ic,title,control,sub)=>`<div class="row" style="padding:14px 0;gap:12px">
    <div class="row center" style="width:42px;height:42px;border-radius:13px;background:${t.primary}12;flex:none">${icon(ic,21,t.primary)}</div>
    <div class="grow"><div class="t15 w600">${title}</div>${sub?`<div class="t13 muted mt4">${sub}</div>`:''}</div>${control}</div>`;
  return `${statusBar(t)}${androidBar({t,title:'Settings',actions:['dots']})}<div class="scroll"><div class="pad">
    ${card(t,[
      row('bell','Deal alerts',toggle(t,true),'Price drops on saved routes'),
      row('pin','Nearby suggestions',toggle(t,false),'Use location while traveling'),
      row('globe','Currency',`<div class="t15 w600" style="color:${t.primary}">EUR €</div>`,''),
    ].join('<div style="border-top:1px solid '+t.border+'"></div>'))}
    <div class="mt16">${dropdown(t,'App language','English')}</div>
    <div class="t17 w700 mt20">Help</div>
    <div class="mt8">${accordion(t,[
      {q:'How do price alerts work?',a:'We track your saved routes daily and notify you when fares drop more than 10% or hit a 30-day low.'},
      {q:'Can I book for someone else?',a:'Yes — add travelers at checkout. Their boarding passes appear in their own Wanderly account.'},
      {q:'What is the cancellation policy?',a:'Free cancellation within 24 hours of booking on most fares. Flexible fares stay refundable until departure.'}])}</div>
  </div></div>${androidNav(t,[{icon:'home',label:'Explore'},{icon:'search',label:'Search'},{icon:'heart',label:'Saved'},{icon:'user',label:'Profile'}],3)}`;
});

}

// ================= CRAVE =================
{ const A='crave', T=()=>THEMES[A];

screen('crave-home-01', A, {title:'Home — restaurants', pattern:'Home', platform:'iOS',
  elements:['Tab Bar','Search Bar','Chip','Carousel','Card','Badge'], colors:['#FFFFFF','#F43F5E','#FB7185','#18181B','#F59E0B']}, (t)=>{
  const rest=(name,cuisine,time,rating,grad,emoji)=>`
    <div style="flex:none;width:250px;border-radius:20px;overflow:hidden;background:${t.card};border:1px solid ${t.border};box-shadow:${t.shadow}">
      <div class="row center" style="height:130px;background:${grad};font-size:56px;position:relative">${emoji}
        <div class="t12 w700" style="position:absolute;left:12px;bottom:10px;background:rgba(0,0,0,.6);color:#fff;padding:5px 10px;border-radius:10px">${time}</div></div>
      <div style="padding:14px"><div class="row between"><div class="t15 w700">${name}</div><div class="t13 w700">⭐ ${rating}</div></div>
      <div class="t13 muted mt4">${cuisine}</div></div></div>`;
  return `${statusBar(t)}<div class="scroll"><div class="pad" style="padding-top:8px">
    <div class="row between">
      <div><div class="t13 muted">Deliver to</div><div class="row" style="gap:4px"><div class="t17 w700">Feldstraße 12</div>${icon('chevD',16,t.text)}</div></div>
      <div class="row center" style="width:46px;height:46px;border-radius:23px;background:${t.surface2};border:1px solid ${t.border}">${icon('bag',22,t.text)}</div></div>
    <div class="mt16">${searchBar(t,'Search restaurants, dishes…')}</div>
    <div class="mt12">${chips(t,['All','Pizza','Sushi','Burgers','Indian','Healthy'],0)}</div>
    </div>
    <div class="pad"><div style="margin-top:16px;border-radius:20px;background:linear-gradient(135deg,#F43F5E,#FB7185);padding:20px;position:relative;overflow:hidden">
      <div class="t12 w700" style="color:rgba(255,255,255,.85);letter-spacing:1px">LUNCH RUSH</div>
      <div class="t20 w700 mt4" style="color:#fff">30% off until 2 PM</div>
      <div class="t13 mt4" style="color:rgba(255,255,255,.85)">On 40+ spots near you · code LUNCH30</div>
      <div style="position:absolute;right:-20px;top:-20px;font-size:110px;opacity:.25">🍕</div></div></div>
    <div class="pad"><div class="row between mt20 mb8"><div class="t17 w700">Popular near you</div><div class="t13 w600" style="color:${t.primary}">See all</div></div></div>
    <div style="padding-left:20px">${carousel(t,[
      rest('Bella Napoli','Italian · Pizza','25–35 min','4.8','linear-gradient(135deg,#FDE68A,#F59E0B)','🍕'),
      rest('Sushi Yama','Japanese · Sushi','20–30 min','4.9','linear-gradient(135deg,#FBCFE8,#F43F5E)','🍣'),
      rest('Burger Werk','American · Burgers','15–25 min','4.7','linear-gradient(135deg,#FED7AA,#EA580C)','🍔')])}
    </div><div class="pad">
    <div class="t17 w700 mt20 mb8">Top rated</div>
    ${card(t,[
      listItem(t,{av:'<div class="row center" style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#FDE68A,#F59E0B);font-size:26px;flex:none">🍕</div>',title:'Bella Napoli',sub:'Margherita Pizza · 25–35 min',right:'<div class="t14 w700">⭐ 4.8</div>'}),
      listItem(t,{av:'<div class="row center" style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#FBCFE8,#F43F5E);font-size:26px;flex:none">🍣</div>',title:'Sushi Yama',sub:'Salmon Nigiri Set · 20–30 min',right:'<div class="t14 w700">⭐ 4.9</div>'}),
    ].join('<div style="border-top:1px solid '+t.border+'"></div>'))}
  </div></div>${tabBar(t,[{icon:'home',label:'Home'},{icon:'search',label:'Search'},{icon:'bag',label:'Orders'},{icon:'user',label:'Profile'}],0)}`;
});

screen('crave-search-02', A, {title:'Search food', pattern:'Search', platform:'Android',
  elements:['Search Bar','Chip','List Item','Card'], colors:['#FFFFFF','#F43F5E','#FB7185','#18181B','#71717A']}, (t)=>{
  return `${statusBar(t)}${androidBar({t,title:'Search',back:false,actions:['filter']})}<div class="scroll"><div class="pad" style="padding-top:4px">
    ${searchBar(t,'Dishes, restaurants, cuisines','ramen')}
    <div class="mt12">${chips(t,['Under 30 min','4.5+ rated','Offers','Top rated'],1)}</div>
    <div class="t13 w700 muted mt16 mb8" style="letter-spacing:1px">TRENDING SEARCHES</div>
    <div class="row" style="gap:8px;flex-wrap:wrap">${['🍜 ramen','🥗 poke bowl','🌯 burrito','🍰 tiramisu'].map(s=>`<div class="t14 w500" style="padding:10px 16px;border-radius:20px;background:${t.surface2};border:1px solid ${t.border}">${s}</div>`).join('')}</div>
    <div class="t17 w700 mt20 mb8">Results for “ramen” · 12</div>
    ${card(t,[
      listItem(t,{av:'<div class="row center" style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#FED7AA,#EA580C);font-size:26px;flex:none">🍜</div>',title:'Tonkotsu Ramen',sub:'Ramen Bar Kibo · 20–30 min',right:'<div class="t15 w700">€13.90</div>'}),
      listItem(t,{av:'<div class="row center" style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#FBCFE8,#F43F5E);font-size:26px;flex:none">🍜</div>',title:'Spicy Miso Ramen',sub:'Ramen Bar Kibo · 20–30 min',right:'<div class="t15 w700">€14.50</div>'}),
      listItem(t,{av:'<div class="row center" style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#DDD6FE,#8B5CF6);font-size:26px;flex:none">🍜</div>',title:'Shoyu Ramen',sub:'Tokyo Express · 25–35 min',right:'<div class="t15 w700">€12.90</div>'}),
    ].join('<div style="border-top:1px solid '+t.border+'"></div>'))}
  </div></div>${androidNav(t,[{icon:'home',label:'Home'},{icon:'search',label:'Search'},{icon:'bag',label:'Orders'},{icon:'user',label:'Profile'}],1)}`;
});

screen('crave-restaurant-03', A, {title:'Restaurant detail', pattern:'Search', platform:'Android',
  elements:['Rating','Segmented Control','List Item','Accordion','Card','Badge'], colors:['#FFFFFF','#F43F5E','#FB7185','#18181B','#F59E0B']}, (t)=>{
  const dish=(emoji,name,desc,price)=>`
    <div class="row" style="padding:14px 0;gap:12px">
      <div class="row center" style="width:72px;height:72px;border-radius:16px;background:${t.surface2};font-size:36px;flex:none">${emoji}</div>
      <div class="grow"><div class="t15 w700">${name}</div><div class="t13 muted mt4 ellip">${desc}</div><div class="t15 w700 mt4" style="color:${t.primary}">€${price}</div></div>
      <div class="row center" style="width:34px;height:34px;border-radius:17px;background:${t.primary};flex:none">${icon('plus',18,'#fff',2.4)}</div></div>`;
  return `${statusBar(t)}<div class="scroll">
    <div style="position:relative;height:230px;background:linear-gradient(135deg,#FDE68A,#F59E0B);overflow:hidden">
      <div class="row center" style="height:100%;font-size:110px">🍕</div>
      <div style="position:absolute;top:56px;left:20px;z-index:2"><div class="row center" style="width:40px;height:40px;border-radius:20px;background:rgba(255,255,255,.9)">${icon('back',20,'#18181B')}</div></div>
      <div style="position:absolute;top:56px;right:20px;z-index:2"><div class="row center" style="width:40px;height:40px;border-radius:20px;background:rgba(255,255,255,.9)">${icon('heart',20,'#18181B')}</div></div></div>
    <div class="pad" style="padding-top:16px">
      <div class="row between"><div class="t24 w700">Bella Napoli</div>${badge(t,'OPEN','ok')}</div>
      <div class="row mt8" style="gap:8px">${stars(t,5,15)}<div class="t14 w600">4.8 <span class="muted w400">(1.2k)</span></div><div class="t14 muted">· Italian · 25–35 min</div></div>
      <div class="mt12">${segmented(t,['Popular','Pizza','Pasta','Desserts'],1)}</div>
      <div class="mt8">
        ${dish('🍕','Margherita Pizza','San Marzano tomato, fior di latte, basil','11.90')}
        <div style="border-top:1px solid ${t.border}"></div>
        ${dish('🍕','Diavola','Spicy salami, tomato, mozzarella, honey','13.50')}
        <div style="border-top:1px solid ${t.border}"></div>
        ${dish('🍝','Tagliatelle al Ragù','Slow-cooked beef ragù, parmigiano','14.90')}
      </div>
      <div class="t17 w700 mt16">About</div>
      <div class="mt8">${accordion(t,[{q:'Delivery info',a:'Free delivery over €15 · 25–35 min average · Contactless drop-off available.'},{q:'Allergens',a:'Full allergen list available on request. Kitchen handles gluten, nuts and dairy.'}])}</div>
      <div style="height:90px"></div>
    </div></div>
    <div style="position:absolute;left:20px;right:20px;bottom:30px">${btn(t,'View cart · €25.80','primary',{iconBefore:icon('bag',18,'#fff')})}</div>`;
});

screen('crave-cart-04', A, {title:'Cart', pattern:'Cart', platform:'Android',
  elements:['Stepper','Banner','List Item','Button','Card'], colors:['#FFFFFF','#F43F5E','#FB7185','#18181B','#10B981']}, (t)=>{
  const item=(emoji,name,price,qty)=>`
    <div class="row" style="padding:14px 0;gap:12px">
      <div class="row center" style="width:60px;height:60px;border-radius:14px;background:${t.surface2};font-size:30px;flex:none">${emoji}</div>
      <div class="grow"><div class="t15 w700">${name}</div><div class="t14 w700 mt4" style="color:${t.primary}">€${price}</div></div>
      <div class="row" style="gap:12px;background:${t.surface2};border-radius:20px;padding:6px 8px">
        <div class="row center" style="width:28px;height:28px;border-radius:14px;background:#fff;border:1px solid ${t.border}"><span class="t16 w700" style="color:${t.primary}">−</span></div>
        <div class="t15 w700" style="min-width:18px;text-align:center">${qty}</div>
        <div class="row center" style="width:28px;height:28px;border-radius:14px;background:${t.primary}"><span class="t16 w700" style="color:#fff">+</span></div></div></div>`;
  return `${statusBar(t)}${androidBar({t,title:'Your cart',actions:['dots']})}
  <div class="scroll"><div class="pad" style="padding-top:8px"><div class="t14 muted mb12">Bella Napoli · 25–35 min</div>
    <div class="mb12">${banner(t,'Add <b>€4.20</b> more for <b>free delivery</b> 🎉','bag','promo')}</div>
    ${card(t,[
      item('🍕','Margherita Pizza','11.90',1),
      item('🍝','Tagliatelle al Ragù','14.90',1),
    ].join('<div style="border-top:1px solid '+t.border+'"></div>'))}
    <div class="mt16">${card(t,`
      <div class="row between"><div class="t14 muted">Subtotal</div><div class="t15 w600">€26.80</div></div>
      <div class="row between mt8"><div class="t14 muted">Delivery fee</div><div class="t15 w600">€1.90</div></div>
      <div class="row between mt8"><div class="t14 muted">Service fee</div><div class="t15 w600">€0.99</div></div>
      <div class="row between mt12" style="border-top:1px solid ${t.border};padding-top:12px"><div class="t16 w700">Total</div><div class="t20 w700">€29.69</div></div>`)}
    </div>
    <div class="row mt16" style="gap:10px">${icon('ticket',22,t.primary)}<div class="t14 w600" style="color:${t.primary}">Add promo code</div></div>
  </div></div>
  <div style="flex:none;padding:12px 20px 30px">${btn(t,'Go to checkout · €29.69')}</div>`;
});

screen('crave-checkout-05', A, {title:'Checkout', pattern:'Checkout', platform:'Android',
  elements:['Radio','Card','List Item','Button','Dropdown'], colors:['#FFFFFF','#F43F5E','#FB7185','#18181B','#0F766E']}, (t)=>{
  return `${statusBar(t)}${androidBar({t,title:'Checkout',actions:[]})}<div class="scroll"><div class="pad" style="padding-top:8px">
    <div class="t15 w700 mb8">Delivery address</div>
    ${card(t,listItem(t,{ic:'pin',title:'Feldstraße 12, 28203 Bremen',sub:'Apartment 4 · 2nd floor',chevron:true}))}
    <div class="t15 w700 mt16 mb8">Delivery time</div>
    <div>${segmented(t,['ASAP · 25–35 min','Schedule'],0)}</div>
    <div class="t15 w700 mt16 mb8">Payment</div>
    ${card(t,[
      radio(t,true,'Visa ···· 4021','Expires 09/29',`<div class="t14 w700" style="color:${t.accent}">€29.69</div>`),
      radio(t,false,'Cash on delivery','Pay the courier directly',''),
    ].join('<div style="border-top:1px solid '+t.border+'"></div>'))}
    <div class="mt16">${dropdown(t,'Cutlery preference','No cutlery — save plastic 🌿')}</div>
    <div class="t13 muted mt16" style="line-height:1.6">By placing this order you agree to Crave's terms. The restaurant starts preparing after confirmation.</div>
  </div></div>
  <div style="flex:none;padding:12px 20px 26px">${btn(t,'Place order · €29.69')}</div>`;
});

screen('crave-payment-06', A, {title:'Payment methods', pattern:'Payment Method', platform:'iOS',
  elements:['Radio','Card','Button','List Item'], colors:['#FFFFFF','#F43F5E','#FB7185','#18181B','#71717A']}, (t)=>{
  return `${statusBar(t)}${iosNav({t,title:'Payment',left:'back'})}<div class="scroll"><div class="pad">
    <div class="t15 w700 mb8">Cards</div>
    ${card(t,[
      radio(t,true,'Visa ···· 4021','Ava Sharma · 09/29',badge(t,'DEFAULT','primary')),
      radio(t,false,'Mastercard ···· 8814','Ava Sharma · 04/28',''),
    ].join('<div style="border-top:1px solid '+t.border+'"></div>'))}
    <div class="mt12">${btn(t,'Add new card','ghost',{iconBefore:icon('plus',18,t.primary)})}</div>
    <div class="t15 w700 mt20 mb8">Other</div>
    ${card(t,[
      listItem(t,{ic:'wallet',title:'Crave Pay balance',sub:'€12.40 available',right:'<div class="t14 w700" style="color:'+t.accent+'">Use</div>',chevron:false}),
      listItem(t,{ic:'gift',title:'Gift cards',sub:'2 active · €25.00 total'}),
    ].join('<div style="border-top:1px solid '+t.border+'"></div>'))}
    <div class="row center mt20" style="gap:8px">${icon('shield',18,t.accent)}<div class="t13 muted">Payments encrypted · PCI-DSS compliant</div></div>
  </div></div>${tabBar(t,[{icon:'home',label:'Home'},{icon:'search',label:'Search'},{icon:'bag',label:'Orders'},{icon:'user',label:'Profile'}],3)}`;
});

screen('crave-map-07', A, {title:'Order tracking map', pattern:'Map', platform:'iOS',
  elements:['Bottom Sheet','Progress Bar','Avatar','Card'], colors:['#FFFFFF','#F43F5E','#FB7185','#18181B','#F59E0B']}, (t)=>{
  return `${statusBar(t)}<div class="scroll" style="position:relative">
    ${mapBase(t,{pins:[{x:20,y:78,icon:'pin',label:'You',c:'#18181B'},{x:70,y:22,icon:'food',label:'Bella Napoli',c:'#F43F5E'},{x:44,y:50,icon:'bike',label:'',c:'#F59E0B'}]})}
    <div style="position:absolute;top:64px;left:20px;right:20px">
      ${card(t,`<div class="row between"><div class="t15 w700">Arriving in 12 min</div><div class="t13 w600" style="color:${t.primary}">Live</div></div>
        <div class="mt12">${progress(t,68,8)}</div>
        <div class="row between mt8"><div class="t12 muted">Order confirmed</div><div class="t12 muted">On the way</div><div class="t12 w700" style="color:${t.primary}">Arriving</div></div>`,16)}
    </div>
    ${bottomSheet(t,{title:'Your courier',sub:'Order #CRV-88231 · Bella Napoli',
      body:`<div class="row" style="gap:14px">${avatar(t,'DK',56,'linear-gradient(135deg,#F43F5E,#FB7185)')}
        <div class="grow"><div class="t16 w700">Denis K.</div><div class="row mt4" style="gap:6px">${stars(t,5,13)}<div class="t13 muted">4.9 · 2.3k deliveries</div></div></div>
        <div class="row" style="gap:8px"><div class="row center" style="width:48px;height:48px;border-radius:24px;background:${t.primary}14">${icon('chat',22,t.primary)}</div>
        <div class="row center" style="width:48px;height:48px;border-radius:24px;background:${t.primary};color:#fff;font-size:20px">☎</div></div></div>
        <div class="t13 muted mt12" style="line-height:1.6">“Picked up your order — 2 stops away, see you soon!” · 2 min ago</div>`,
      cta:null})}
  </div>`;
});

screen('crave-chat-08', A, {title:'Courier chat', pattern:'Chat', platform:'iOS',
  elements:['Avatar','Chip'], colors:['#FFFFFF','#F43F5E','#FB7185','#18181B','#71717A']}, (t)=>{
  return `${statusBar(t)}<div class="row" style="flex:none;padding:8px 20px 4px;gap:12px">
      <div style="padding:8px 0">${icon('back',24,t.text)}</div>
      ${avatar(t,'DK',44,'linear-gradient(135deg,#F43F5E,#FB7185)')}
      <div class="grow"><div class="t17 w700">Denis K.</div><div class="t13" style="color:${t.accent}">● Delivering your order</div></div>
      ${icon('dots',24,t.text)}</div>
    <div class="scroll"><div class="pad" style="padding-top:12px">
      <div class="t12 faint center mb12">Today</div>
      ${chatBubble(t,{me:false,text:'Hi! I\'m on my way with your Bella Napoli order 🍕',time:'12:41'})}
      ${chatBubble(t,{me:false,text:'I\'m at Feldstraße — which entrance should I use?',time:'12:52'})}
      ${chatBubble(t,{me:true,text:'Side entrance, I\'ll meet you there!',time:'12:53'})}
      ${chatBubble(t,{me:false,text:'Perfect, 2 minutes away 👍',time:'12:53'})}
      <div class="mt8">${chips(t,['Leave at door','I\'m outside','Call me'],0)}</div>
    </div></div>${composer(t,'Message Denis…')}`;
});

screen('crave-notifications-09', A, {title:'Notifications', pattern:'Notifications', platform:'Android',
  elements:['List Item','Badge','Card'], colors:['#FFFFFF','#F43F5E','#FB7185','#18181B','#71717A']}, (t)=>{
  const n=(emoji,title,body,time,unread)=>`<div class="row" style="padding:14px 0;gap:12px;${unread?`background:${t.primary}0d;margin:0 -20px;padding-left:20px;padding-right:20px;border-radius:14px`:''}">
      <div class="row center" style="width:52px;height:52px;border-radius:16px;background:${t.surface2};font-size:26px;flex:none;border:1px solid ${t.border}">${emoji}</div>
      <div class="grow"><div class="row between"><div class="t15 w600">${title}</div><div class="t12 faint">${time}</div></div>
      <div class="t13 muted mt4" style="line-height:1.5">${body}</div></div>${unread?`<div style="width:9px;height:9px;border-radius:5px;background:${t.primary};flex:none"></div>`:''}</div>`;
  return `${statusBar(t)}${androidBar({t,title:'Notifications',back:false,actions:['check']})}<div class="scroll"><div class="pad" style="padding-top:4px">
    ${n('🛵','Order on its way','Denis picked up your order from <b>Bella Napoli</b>. Arriving in ~12 min.','2m',true)}
    ${n('🎉','Weekend deal','<b>40% off</b> sushi this weekend with code SUSHI40.','1h',true)}
    ${n('⭐','Rate your last order','How was <b>Ramen Bar Kibo</b>? Your review helps the kitchen.','Yesterday',false)}
    ${n('🎁','€10 voucher earned','You unlocked a voucher for 5 orders this month.','2d',false)}
  </div></div>${androidNav(t,[{icon:'home',label:'Home'},{icon:'search',label:'Search'},{icon:'bag',label:'Orders'},{icon:'user',label:'Profile'}],2)}`;
});

screen('crave-profile-10', A, {title:'Profile', pattern:'Profile', platform:'Android',
  elements:['Avatar','List Item','Badge','Card'], colors:['#FFFFFF','#F43F5E','#FB7185','#18181B','#F59E0B']}, (t)=>{
  return `${statusBar(t)}${androidBar({t,title:'Profile',actions:['edit']})}<div class="scroll"><div class="pad">
    <div class="row" style="gap:16px">${avatar(t,'AS',80,'linear-gradient(135deg,#F43F5E,#FB7185)')}
      <div><div class="t20 w700">Ava Sharma</div><div class="t14 muted mt4">Gold member · since 2024</div>
      <div class="mt8">${badge(t,'★ 1,240 PTS','primary')}</div></div></div>
    ${card(t,`<div class="row" style="gap:12px">${icon('gift',26,t.primary)}<div class="grow"><div class="t15 w700">€10 voucher available</div><div class="t13 muted">Expires Oct 31 · min. order €20</div></div><div class="t14 w700" style="color:${t.primary}">Use</div></div>`,16)}
    <div class="mt16">${card(t,[
      listItem(t,{ic:'bag',title:'My orders',sub:'48 orders · €612 spent'}),
      listItem(t,{ic:'pin',title:'Addresses',sub:'Home · Work · 1 more'}),
      listItem(t,{ic:'heart',title:'Favorites',sub:'12 restaurants'}),
      listItem(t,{ic:'ticket',title:'Vouchers',sub:'3 active'}),
    ].join('<div style="border-top:1px solid '+t.border+'"></div>'))}
  </div></div>${androidNav(t,[{icon:'home',label:'Home'},{icon:'search',label:'Search'},{icon:'bag',label:'Orders'},{icon:'user',label:'Profile'}],3)}`;
});

screen('crave-empty-11', A, {title:'Empty state — no orders', pattern:'Empty State', platform:'iOS',
  elements:['Button'], colors:['#FFFFFF','#F43F5E','#FB7185','#18181B','#71717A']}, (t)=>{
  return `${statusBar(t)}${iosNav({t,title:'Orders',left:'back'})}<div class="scroll">
    ${emptyState(t,{emoji:'🍔',title:'No orders yet',body:'Hungry? Your order history will appear here — along with one-tap reorders of your favorites.',action:'Find food near you'})}
  </div>${tabBar(t,[{icon:'home',label:'Home'},{icon:'search',label:'Search'},{icon:'bag',label:'Orders'},{icon:'user',label:'Profile'}],2)}`;
});

screen('crave-stats-12', A, {title:'Order history & stats', pattern:'Activity/Stats', platform:'iOS',
  elements:['Chart','List Item','Segmented Control','Card'], colors:['#FFFFFF','#F43F5E','#FB7185','#18181B','#F59E0B']}, (t)=>{
  return `${statusBar(t)}${iosNav({t,title:'Your year in food',sub:'2026 · 48 orders',left:'back'})}<div class="scroll"><div class="pad">
    <div class="mt8">${segmented(t,['Month','Cuisine','Spending'],2)}</div>
    <div class="mt16">${card(t,`
      <div class="row between"><div><div class="t13 muted">TOTAL SPENT</div><div class="t28 w700 mt4">€612.40</div></div>${badge(t,'TOP 5%','primary')}</div>
      <div class="mt16">${barsChart(t,[30,45,38,62,55,70,48,66,58,74,62,80],110)}</div>
      <div class="row between mt8"><div class="t12 muted">Jan</div><div class="t12 muted">Jun</div><div class="t12 muted">Dec</div></div>`)}
    </div>
    <div class="t17 w700 mt20 mb8">Most ordered</div>
    ${card(t,[
      listItem(t,{av:'<div class="row center" style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#FDE68A,#F59E0B);font-size:26px;flex:none">🍕</div>',title:'Margherita Pizza',sub:'Ordered 9 times · Bella Napoli',right:'<div class="t14 w700">€11.90</div>',chevron:false}),
      listItem(t,{av:'<div class="row center" style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#FED7AA,#EA580C);font-size:26px;flex:none">🍜</div>',title:'Tonkotsu Ramen',sub:'Ordered 7 times · Ramen Bar Kibo',right:'<div class="t14 w700">€13.90</div>',chevron:false}),
    ].join('<div style="border-top:1px solid '+t.border+'"></div>'))}
    <div class="mt16">${btn(t,'Reorder favorites','primary',{small:true})}</div>
  </div></div>${tabBar(t,[{icon:'home',label:'Home'},{icon:'search',label:'Search'},{icon:'bag',label:'Orders'},{icon:'user',label:'Profile'}],2)}`;
});

}

// ================= TEMPO =================
{ const A='tempo', T=()=>THEMES[A];
const track=(t,i,title,artist,dur,grad,playing)=>`
  <div class="row" style="padding:11px 0;gap:12px">
    <div class="row center" style="width:52px;height:52px;border-radius:12px;background:${grad};flex:none;position:relative">
      ${playing?`<div class="row center" style="gap:3px">${[10,16,8,14].map(h=>`<div style="width:4px;height:${h}px;border-radius:2px;background:#fff;animation:none"></div>`).join('')}</div>`:`<span class="t14 w600" style="color:rgba(255,255,255,.85)">${i}</span>`}
    </div>
    <div class="grow" style="min-width:0"><div class="t15 w600 ellip" style="${playing?`color:${t.primary}`:''}">${title}</div><div class="t13 muted ellip mt4">${artist}</div></div>
    ${playing?icon('pause',20,t.primary):''}<div class="t13 muted">${dur}</div>${icon('dots',18,t.faint)}</div>`;

screen('tempo-welcome-01', A, {title:'Welcome', pattern:'Welcome', platform:'iOS',
  elements:['Button','Carousel'], colors:['#12071F','#A855F7','#EC4899','#FAF5FF','#1B0E2C']}, (t)=>{
  return `${statusBar(t)}<div class="scroll"><div class="pad" style="padding-top:60px">
    <div class="center"><div class="row center" style="width:92px;height:92px;border-radius:30px;background:linear-gradient(135deg,#A855F7,#EC4899);margin:0 auto;box-shadow:0 16px 40px rgba(168,85,247,.4)">${icon('music',48,'#fff',1.8)}</div>
      <div class="t28 w700 mt20" style="letter-spacing:-.5px">Tempo</div>
      <div class="t15 muted mt8" style="line-height:1.6">Every song you love.<br>Zero ads. Zero skips limits.</div></div>
    <div class="mt24">${carousel(t,[['Neon Skyline','Midnight Parade','linear-gradient(135deg,#7C3AED,#EC4899)'],['Golden Hour','Sahara Bloom','linear-gradient(135deg,#F59E0B,#EC4899)'],['Deep Blue','Coral Echoes','linear-gradient(135deg,#0EA5E9,#7C3AED)']].map(a=>`
      <div style="flex:none;width:170px"><div class="row center" style="height:170px;border-radius:18px;background:${a[2]}">${icon('music',52,'rgba(255,255,255,.9)',1.4)}</div>
      <div class="t14 w700 mt8">${a[0]}</div><div class="t13 muted">${a[1]}</div></div>`))}
    </div>
    <div class="pad"><div class="mt24">${btn(t,'Try Premium free for 1 month')}</div>
      <div class="mt12">${btn(t,'Continue free','ghost')}</div>
      <div class="t13 muted center mt16">or <span class="w600" style="color:${t.primary}">log in</span></div></div>
  </div></div>`;
});

screen('tempo-home-02', A, {title:'Home', pattern:'Home', platform:'iOS',
  elements:['Tab Bar','Carousel','List Item','Avatar','Card'], colors:['#12071F','#A855F7','#EC4899','#FAF5FF','#1B0E2C']}, (t)=>{
  return `${statusBar(t)}<div class="scroll"><div class="pad" style="padding-top:8px">
    <div class="row between"><div class="t24 w700" style="letter-spacing:-.5px">Good evening</div>
      <div class="row" style="gap:12px">${icon('bell',24,t.text)}${avatar(t,'NK',42,'linear-gradient(135deg,#A855F7,#EC4899)')}</div></div>
    <div class="mt16">${chips(t,['All','Music','Podcasts','Live'],0)}</div>
    <div class="row between mt20 mb8"><div class="t17 w700">Jump back in</div></div>
    </div><div style="padding-left:20px">${carousel(t,[
      ['After Hours Mix','Your weekly blend','linear-gradient(135deg,#7C3AED,#EC4899)','🎧'],
      ['Focus Flow','Deep work beats','linear-gradient(135deg,#0EA5E9,#7C3AED)','🎯'],
      ['Gym Energy','124 BPM club hits','linear-gradient(135deg,#F59E0B,#EF4444)','⚡']].map(a=>`
      <div style="flex:none;width:190px"><div class="row center" style="height:190px;border-radius:18px;background:${a[2]};font-size:56px">${a[3]}</div>
      <div class="t14 w700 mt8">${a[0]}</div><div class="t13 muted">${a[1]}</div></div>`))}
    </div><div class="pad">
    <div class="row between mt20 mb8"><div class="t17 w700">Recently played</div><div class="t13 w600" style="color:${t.primary}">See all</div></div>
    ${card(t,[
      track(t,1,'Blinding Lights','The Weekends','3:20','linear-gradient(135deg,#7C3AED,#EC4899)',true),
      track(t,2,'Levitating','Dua Lipa Tribute','3:23','linear-gradient(135deg,#0EA5E9,#7C3AED)',false),
      track(t,3,'Golden Hour','Sahara Bloom','3:18','linear-gradient(135deg,#F59E0B,#EC4899)',false),
    ].join('<div style="border-top:1px solid '+t.border+'"></div>'))}
    <div style="height:76px"></div>
  </div></div>
  <div style="position:absolute;left:12px;right:12px;bottom:96px;z-index:30">
    <div class="row" style="background:#241539;border:1px solid ${t.border};border-radius:16px;padding:10px 12px;gap:12px;box-shadow:0 12px 30px rgba(0,0,0,.5)">
      <div class="row center" style="width:48px;height:48px;border-radius:10px;background:linear-gradient(135deg,#7C3AED,#EC4899);flex:none">${icon('music',24,'#fff',1.6)}</div>
      <div class="grow"><div class="t14 w700">Blinding Lights</div><div class="t12 muted">The Weekends</div>
        <div class="mt4" style="height:3px;border-radius:2px;background:#3A2A55"><div style="width:64%;height:100%;background:${t.primary};border-radius:2px"></div></div></div>
      ${icon('play',26,t.text)}</div></div>
  ${tabBar(t,[{icon:'home',label:'Home'},{icon:'search',label:'Search'},{icon:'heart',label:'Library'},{icon:'user',label:'Profile'}],0)}`;
});

screen('tempo-search-03', A, {title:'Search music', pattern:'Search', platform:'Android',
  elements:['Search Bar','Chip','List Item','Card'], colors:['#12071F','#A855F7','#EC4899','#FAF5FF','#1B0E2C']}, (t)=>{
  return `${statusBar(t)}${androidBar({t,title:'Search',back:false,actions:['mic']})}<div class="scroll"><div class="pad" style="padding-top:4px">
    ${searchBar(t,'Songs, artists, podcasts','synthwave')}
    <div class="mt12">${chips(t,['Top','Songs','Artists','Albums','Podcasts'],1)}</div>
    <div class="t15 w700 mt20 mb8">Top result</div>
    ${card(t,`<div class="row" style="gap:14px">
      <div class="row center" style="width:88px;height:88px;border-radius:16px;background:linear-gradient(135deg,#0EA5E9,#7C3AED);flex:none">${icon('music',40,'#fff',1.5)}</div>
      <div class="grow"><div class="t17 w700">Synthwave Essentials</div><div class="t13 muted mt4">Playlist · 84 songs</div>
      <div class="mt8">${btn(t,'Play','primary',{small:true,full:false,iconBefore:icon('play',14,t.primaryText)})}</div></div></div>`)}
    <div class="t15 w700 mt20 mb8">Songs</div>
    ${card(t,[
      track(t,1,'Midnight Drive','Neon Coast','4:02','linear-gradient(135deg,#0EA5E9,#7C3AED)',false),
      track(t,2,'Chrome Hearts','Glass Petal','3:47','linear-gradient(135deg,#EC4899,#7C3AED)',false),
      track(t,3,'Nightcall ’84','Vector Seven','5:11','linear-gradient(135deg,#7C3AED,#312E81)',false),
    ].join('<div style="border-top:1px solid '+t.border+'"></div>'))}
  </div></div>${androidNav(t,[{icon:'home',label:'Home'},{icon:'search',label:'Search'},{icon:'heart',label:'Library'},{icon:'user',label:'Profile'}],1)}`;
});

screen('tempo-feed-04', A, {title:'New releases feed', pattern:'Feed', platform:'Android',
  elements:['Carousel','Card','Avatar','Badge'], colors:['#12071F','#A855F7','#EC4899','#FAF5FF','#1B0E2C']}, (t)=>{
  const rel=(title,artist,grad,emoji,tag)=>`
    <div style="border-radius:20px;overflow:hidden;background:${t.card};border:1px solid ${t.border};margin-bottom:16px">
      <div class="row center" style="height:180px;background:${grad};font-size:64px;position:relative">${emoji}
        ${tag?`<div class="t12 w700" style="position:absolute;top:12px;left:12px;background:rgba(0,0,0,.55);color:#fff;padding:6px 12px;border-radius:12px">${tag}</div>`:''}</div>
      <div style="padding:14px"><div class="row between"><div><div class="t16 w700">${title}</div><div class="t13 muted mt4">${artist} · Album · 12 tracks</div></div>
      <div class="row center" style="width:52px;height:52px;border-radius:26px;background:${t.primary};flex:none">${icon('play',22,t.primaryText)}</div></div></div></div>`;
  return `${statusBar(t)}${androidBar({t,title:'New releases',actions:['search','dots']})}<div class="scroll"><div class="pad"><div class="t14 muted mb8">Friday drops · updated weekly</div>
    ${rel('Neon Skyline','Midnight Parade','linear-gradient(135deg,#7C3AED,#EC4899)','🌃','NEW')}
    ${rel('Salt & Static','Coral Echoes','linear-gradient(135deg,#0EA5E9,#14B8A6)','🌊','')}
    <div class="t17 w700 mt8 mb8">More this week</div>
    ${carousel(t,[['Velvet Static','Nova Rae','linear-gradient(135deg,#F59E0B,#EC4899)'],['Paper Moons','Elif Aydin','linear-gradient(135deg,#8B5CF6,#312E81)']].map(a=>`
      <div style="flex:none;width:160px"><div class="row center" style="height:160px;border-radius:16px;background:${a[2]}">${icon('music',44,'rgba(255,255,255,.9)',1.4)}</div>
      <div class="t14 w700 mt8">${a[0]}</div><div class="t13 muted">${a[1]}</div></div>`))}
  </div></div>${androidNav(t,[{icon:'home',label:'Home'},{icon:'search',label:'Search'},{icon:'heart',label:'Library'},{icon:'user',label:'Profile'}],0)}`;
});

screen('tempo-now-playing-05', A, {title:'Now playing', pattern:'Feed', platform:'iOS',
  elements:['Progress Bar','Slider','Button'], colors:['#12071F','#A855F7','#EC4899','#FAF5FF','#1B0E2C']}, (t)=>{
  return `${statusBar(t)}<div class="scroll"><div class="pad" style="padding-top:8px">
    <div class="row between"><div style="padding:10px">${icon('chevD',26,t.text)}</div>
      <div class="center"><div class="t12 muted w600" style="letter-spacing:1px">PLAYING FROM PLAYLIST</div><div class="t14 w700 mt4">After Hours Mix</div></div>
      <div style="padding:10px">${icon('dots',24,t.text)}</div></div>
    <div class="row center" style="margin-top:18px">
      <div style="width:300px;height:300px;border-radius:28px;background:linear-gradient(135deg,#7C3AED,#EC4899);box-shadow:0 24px 60px rgba(168,85,247,.45);position:relative;overflow:hidden">
        <div class="row center" style="height:100%">${icon('music',110,'rgba(255,255,255,.92)',1.2)}</div>
        <div class="t12 w700" style="position:absolute;bottom:16px;left:16px;background:rgba(0,0,0,.5);color:#fff;padding:6px 12px;border-radius:10px">SYNTH POP · 2026</div></div></div>
    <div class="row between mt24"><div><div class="t24 w700">Blinding Lights</div><div class="t15 muted mt4">The Weekends</div></div>
      <div class="row" style="gap:14px">${icon('heart',26,t.danger)}${icon('plus',26,t.text)}</div></div>
    <div class="mt16">${progress(t,64,5)}<div class="row between mt8"><div class="t12 muted">2:05</div><div class="t12 muted">3:20</div></div></div>
    <div class="row center mt12" style="gap:34px">
      ${icon('chevL',30,t.text)}<div class="row center" style="width:76px;height:76px;border-radius:38px;background:#fff">${icon('pause',32,'#12071F',2.2)}</div>${icon('chevR',30,t.text)}</div>
    <div class="row mt20" style="gap:12px">${icon('dots',20,t.faint)}<div class="grow">${slider(t,70)}</div>${icon('mic',20,t.faint)}</div>
  </div></div>`;
});

screen('tempo-playlist-06', A, {title:'Playlist detail', pattern:'Feed', platform:'Android',
  elements:['FAB','List Item','Card','Badge','Avatar'], colors:['#12071F','#A855F7','#EC4899','#FAF5FF','#1B0E2C']}, (t)=>{
  return `${statusBar(t)}<div class="scroll" style="position:relative">
    <div style="padding:70px 20px 0;background:linear-gradient(180deg,rgba(168,85,247,.35),transparent);">
      <div class="row" style="gap:16px">
        <div class="row center" style="width:130px;height:130px;border-radius:20px;background:linear-gradient(135deg,#A855F7,#EC4899);flex:none;box-shadow:0 16px 40px rgba(168,85,247,.4)">${icon('music',56,'#fff',1.5)}</div>
        <div><div class="t12 w700" style="color:${t.primary};letter-spacing:1px">PLAYLIST</div>
          <div class="t24 w700 mt4" style="letter-spacing:-.5px">Gym Energy</div>
          <div class="t13 muted mt4">Nina K. · 48 songs · 2h 51m</div>
          <div class="row mt8" style="gap:6px">${badge(t,'PUBLIC','primary')}</div></div></div>
      <div class="row mt16" style="gap:10px"><div class="grow">${btn(t,'Shuffle play','primary',{small:true,iconBefore:icon('play',15,t.primaryText)})}</div>
        <div class="row center" style="width:46px;height:46px;border-radius:23px;border:1.5px solid ${t.border}">${icon('heart',20,t.text)}</div>
        <div class="row center" style="width:46px;height:46px;border-radius:23px;border:1.5px solid ${t.border}">${icon('dots',20,t.text)}</div></div>
    </div>
    <div class="pad mt16">
    ${card(t,[
      track(t,1,'Power','Kanye West Tribute Band','3:42','linear-gradient(135deg,#F59E0B,#EF4444)',true),
      track(t,2,'Titanium','Iron Vocals','4:05','linear-gradient(135deg,#7C3AED,#312E81)',false),
      track(t,3,'Can\'t Hold Us','Brass Collective','4:18','linear-gradient(135deg,#0EA5E9,#7C3AED)',false),
      track(t,4,'Lose Yourself','Mic Masters','5:26','linear-gradient(135deg,#EC4899,#7C3AED)',false),
    ].join('<div style="border-top:1px solid '+t.border+'"></div>'))}
    <div style="height:100px"></div></div>
    ${fab(t,'play')}
  </div>
  ${androidBar({t,title:'',back:true,actions:['search','dots']}).replace('flex:none;height:64px','position:absolute;top:44px;left:0;right:0;flex:none;height:64px;background:transparent')}`;
});

screen('tempo-paywall-07', A, {title:'Subscription — paywall', pattern:'Paywall', platform:'iOS',
  elements:['Button','Accordion','Badge','Card'], colors:['#12071F','#A855F7','#EC4899','#FAF5FF','#1B0E2C']}, (t)=>{
  return `${statusBar(t)}<div class="scroll"><div class="pad" style="padding-top:12px">
    <div class="row between"><div></div><div style="padding:8px">${icon('x',24,t.text)}</div></div>
    <div class="center"><div class="t28 w700">Hear everything.<br><span style="background:linear-gradient(90deg,#A855F7,#EC4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Ad-free.</span></div>
      <div class="t15 muted mt8">Tempo Premium · 1 month free, then €10.99/mo</div></div>
    <div class="mt20">${card(t,`
      <div class="row" style="gap:12px">${icon('check',22,t.primary,2.4)}<div><div class="t15 w700">No ads, unlimited skips</div><div class="t13 muted">Play any song, anytime</div></div></div>
      <div class="row mt12" style="gap:12px">${icon('check',22,t.primary,2.4)}<div><div class="t15 w700">Offline downloads</div><div class="t13 muted">10,000 songs per device</div></div></div>
      <div class="row mt12" style="gap:12px">${icon('check',22,t.primary,2.4)}<div><div class="t15 w700">HiFi audio</div><div class="t13 muted">Lossless 24-bit sound</div></div></div>`,18)}
    </div>
    <div class="mt20">${btn(t,'Try free for 1 month')}</div>
    <div class="t13 muted center mt12">Then €10.99/month · Cancel anytime</div>
    <div class="t17 w700 mt20">FAQ</div>
    <div class="mt8">${accordion(t,[
      {q:'What happens after the trial?',a:'You are charged €10.99/month unless you cancel. We remind you 3 days before the trial ends.'},
      {q:'Can I share with family?',a:'The Family plan covers 6 accounts for €17.99/month, each with its own library.'},
      {q:'Is there a student plan?',a:'Yes — €5.49/month with verification, including the same Premium features.'}])}</div>
  </div></div>`;
});

screen('tempo-profile-08', A, {title:'Profile', pattern:'Profile', platform:'Android',
  elements:['Avatar','Chart','List Item','Card','Badge'], colors:['#12071F','#A855F7','#EC4899','#FAF5FF','#1B0E2C']}, (t)=>{
  return `${statusBar(t)}${androidBar({t,title:'Profile',actions:['edit']})}<div class="scroll"><div class="pad">
    <div class="row" style="gap:16px">${avatar(t,'NK',80,'linear-gradient(135deg,#A855F7,#EC4899)')}
      <div><div class="t20 w700">Nina Kaur</div><div class="t14 muted mt4">@ninahears · 1.2k followers</div>
      <div class="mt8">${badge(t,'PREMIUM','primary')}</div></div></div>
    <div class="mt16">${card(t,`<div class="t15 w700 mb8">Listening this week</div>
      <div class="row" style="gap:18px"><div>${donut(t,[{v:45,c:'#A855F7'},{v:30,c:'#EC4899'},{v:25,c:'#0EA5E9'}],110)}</div>
      <div class="grow">${[['Pop','18h 20m','#A855F7'],['Hip-hop','11h 05m','#EC4899'],['Jazz','9h 40m','#0EA5E9']].map(g=>`
        <div class="row mt8" style="gap:8px"><div style="width:10px;height:10px;border-radius:5px;background:${g[2]}"></div><div class="t14 w600 grow">${g[0]}</div><div class="t13 muted">${g[1]}</div></div>`).join('')}</div></div>
      <div class="t13 mt12" style="color:${t.primary}">32h total · top 2% of listeners 🏆</div>`,16)}
    </div>
    <div class="t17 w700 mt20 mb8">Playlists · 12</div>
    ${card(t,[
      listItem(t,{av:'<div class="row center" style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#F59E0B,#EF4444);flex:none">'+icon('music',22,'#fff',1.6)+'</div>',title:'Gym Energy',sub:'48 songs · by you'}),
      listItem(t,{av:'<div class="row center" style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#0EA5E9,#7C3AED);flex:none">'+icon('music',22,'#fff',1.6)+'</div>',title:'Focus Flow',sub:'112 songs · by you'}),
    ].join('<div style="border-top:1px solid '+t.border+'"></div>'))}
  </div></div>${androidNav(t,[{icon:'home',label:'Home'},{icon:'search',label:'Search'},{icon:'heart',label:'Library'},{icon:'user',label:'Profile'}],3)}`;
});

screen('tempo-settings-09', A, {title:'Settings', pattern:'Settings', platform:'Android',
  elements:['Toggle','Dropdown','List Item','Slider'], colors:['#12071F','#A855F7','#EC4899','#FAF5FF','#1B0E2C']}, (t)=>{
  const row=(ic,title,control,sub)=>`<div class="row" style="padding:14px 0;gap:12px">
    <div class="row center" style="width:42px;height:42px;border-radius:13px;background:${t.primary}14;flex:none">${icon(ic,21,t.primary)}</div>
    <div class="grow"><div class="t15 w600">${title}</div>${sub?`<div class="t13 muted mt4">${sub}</div>`:''}</div>${control}</div>`;
  return `${statusBar(t)}${androidBar({t,title:'Settings',actions:[]})}<div class="scroll"><div class="pad" style="padding-top:4px">
    <div class="t13 w700 muted mb8" style="letter-spacing:1px">PLAYBACK</div>
    ${card(t,[
      `<div style="padding:14px 0"><div class="row between"><div class="t15 w600">Crossfade</div><div class="t14 w700" style="color:${t.primary}">6s</div></div><div class="mt12">${slider(t,50)}</div></div>`,
      row('bolt','Gapless playback',toggle(t,true),'No silence between tracks'),
      row('wifi','Download over Wi-Fi only',toggle(t,true),'Save mobile data'),
    ].join('<div style="border-top:1px solid '+t.border+'"></div>'))}
    <div class="t13 w700 muted mt20 mb8" style="letter-spacing:1px">ACCOUNT</div>
    ${card(t,[
      row('bell','New release alerts',toggle(t,true),'Artists you follow'),
      row('user','Private session',toggle(t,false),'Hide listening activity'),
    ].join('<div style="border-top:1px solid '+t.border+'"></div>'))}
    <div class="mt16">${dropdown(t,'Audio quality','Very high · 320 kbps')}</div>
  </div></div>${androidNav(t,[{icon:'home',label:'Home'},{icon:'search',label:'Search'},{icon:'heart',label:'Library'},{icon:'user',label:'Profile'}],3)}`;
});

screen('tempo-notifications-10', A, {title:'Notifications', pattern:'Notifications', platform:'Android',
  elements:['List Item','Avatar','Card'], colors:['#12071F','#A855F7','#EC4899','#FAF5FF','#1B0E2C']}, (t)=>{
  return `${statusBar(t)}${androidBar({t,title:'Notifications',actions:['check']})}<div class="scroll"><div class="pad">
    ${card(t,[
      listItem(t,{av:'<div class="row center" style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#7C3AED,#EC4899);font-size:24px;flex:none">🌃</div>',title:'New album: Neon Skyline',sub:'Midnight Parade just dropped 12 tracks.',right:'<div class="t12 faint">1h</div>',chevron:false}),
      listItem(t,{av:avatar(t,'JR',44,'linear-gradient(135deg,#0EA5E9,#7C3AED)'),title:'Jonas shared a playlist',sub:'“Roadtrip ’26” · 32 songs · for you',right:'<div class="t12 faint">3h</div>',chevron:false}),
      listItem(t,{av:'<div class="row center" style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#F59E0B,#EC4899);font-size:24px;flex:none">🎫</div>',title:'Presale: Sahara Bloom',sub:'Live in Hamburg, Nov 28 · fans first.',right:'<div class="t12 faint">1d</div>',chevron:false}),
    ].join('<div style="border-top:1px solid '+t.border+'"></div>'))}
  </div></div>${androidNav(t,[{icon:'home',label:'Home'},{icon:'search',label:'Search'},{icon:'bell',label:'Inbox'},{icon:'user',label:'Profile'}],2)}`;
});

screen('tempo-empty-11', A, {title:'Empty state — no liked songs', pattern:'Empty State', platform:'iOS',
  elements:['Button'], colors:['#12071F','#A855F7','#EC4899','#FAF5FF','#1B0E2C']}, (t)=>{
  return `${statusBar(t)}${iosNav({t,title:'Liked songs',left:'back'})}<div class="scroll">
    ${emptyState(t,{emoji:icon('heart',52,t.primary,1.4),title:'No liked songs yet',body:'Tap the heart on any track and it will be saved here — your personal greatest-hits collection.',action:'Discover music'})}
  </div>${tabBar(t,[{icon:'home',label:'Home'},{icon:'search',label:'Search'},{icon:'heart',label:'Library'},{icon:'user',label:'Profile'}],2)}`;
});

screen('tempo-chat-12', A, {title:'Share with friends chat', pattern:'Chat', platform:'Android',
  elements:['Avatar','Card'], colors:['#12071F','#A855F7','#EC4899','#FAF5FF','#1B0E2C']}, (t)=>{
  return `${statusBar(t)}<div class="row" style="flex:none;padding:8px 20px 4px;gap:12px">
      <div style="padding:8px 0">${icon('back',24,t.text)}</div>
      ${avatar(t,'JR',44,'linear-gradient(135deg,#0EA5E9,#7C3AED)')}
      <div class="grow"><div class="t17 w700">Jonas R.</div><div class="t13" style="color:${t.primary}">● Listening now</div></div>
      ${icon('dots',24,t.text)}</div>
    <div class="scroll"><div class="pad" style="padding-top:12px">
      <div class="t12 faint center mb12">Today</div>
      ${chatBubble(t,{me:false,text:'You HAVE to hear this one 🎧',time:'18:02'})}
      <div style="max-width:270px;margin-bottom:10px">${card(t,`<div class="row" style="gap:12px">
        <div class="row center" style="width:56px;height:56px;border-radius:12px;background:linear-gradient(135deg,#7C3AED,#EC4899);flex:none">${icon('music',26,'#fff',1.6)}</div>
        <div class="grow"><div class="t14 w700">Midnight Drive</div><div class="t13 muted">Neon Coast</div></div>
        <div class="row center" style="width:40px;height:40px;border-radius:20px;background:${t.primary};flex:none">${icon('play',18,t.primaryText)}</div></div>`,14)}</div>
      ${chatBubble(t,{me:true,text:'Instant add to Gym Energy 🔥',time:'18:05'})}
      ${chatBubble(t,{me:false,text:'Knew you\'d like it. Blend playlist updated btw!',time:'18:06'})}
    </div></div>${composer(t,'Message Jonas…')}`;
});

screen('tempo-playlist-new-13', A, {title:'New playlist', pattern:'Feed', platform:'iOS',
  elements:['Text Field','Button','Card'], colors:['#12071F','#A855F7','#EC4899','#FAF5FF','#1B0E2C']}, (t)=>{
  return `${statusBar(t)}${iosNav({t,title:'New playlist',left:'x',large:false})}
  <div class="scroll"><div class="pad" style="padding-top:8px">
    <div class="row center" style="height:190px">
      <div class="row center" style="width:170px;height:170px;border-radius:24px;background:linear-gradient(135deg,#2A1B45,#1B0E2C);border:2px dashed ${t.faint}">
        <div class="center">${icon('cam',34,t.faint)}<div class="t13 w600 mt8" style="color:${t.muted}">Add cover</div></div></div></div>
    <div class="mt20">${textField(t,{label:'Playlist name',value:'Autumn Drives 🍂',icon:'edit'})}</div>
    <div class="mt16">${textField(t,{label:'Description (optional)',value:'',placeholder:'What is this playlist for?'})}</div>
    <div class="mt16">${card(t,`<div class="row between"><div><div class="t15 w700">Make public</div><div class="t13 muted mt4">Anyone can find and follow it</div></div>${toggle(t,true)}</div>`,16)}
    </div>
    <div class="t13 muted mt16 center" style="line-height:1.6">You can add songs right after creating it.</div>
  </div></div>
  <div style="flex:none;padding:12px 20px 30px">${btn(t,'Create playlist')}</div>`;
});

screen('tempo-playlist-add-14', A, {title:'Add songs to playlist', pattern:'Search', platform:'iOS',
  elements:['Search Bar','Checkbox','List Item','Button','Card'], colors:['#12071F','#A855F7','#EC4899','#FAF5FF','#1B0E2C']}, (t)=>{
  const srow=(checked,i,title,artist,dur,grad)=>`
    <div class="row" style="padding:11px 0;gap:12px">
      <div class="row center" style="width:24px;height:24px;border-radius:8px;flex:none;${checked?`background:${t.primary}`:`border:2px solid ${t.faint}`}">${checked?icon('check',14,t.primaryText,3):''}</div>
      <div class="row center" style="width:52px;height:52px;border-radius:12px;background:${grad};flex:none"><span class="t14 w600" style="color:rgba(255,255,255,.85)">${i}</span></div>
      <div class="grow" style="min-width:0"><div class="t15 w600 ellip">${title}</div><div class="t13 muted ellip mt4">${artist}</div></div>
      <div class="t13 muted">${dur}</div></div>`;
  return `${statusBar(t)}${iosNav({t,title:'Add songs',sub:'Autumn Drives 🍂 · 3 selected',left:'back',large:false})}
  <div class="scroll"><div class="pad" style="padding-top:8px">
    ${searchBar(t,'Search to add songs')}
    <div class="t15 w700 mt16 mb8">Suggested for this playlist</div>
    ${card(t,[
      srow(true,1,'Golden Hour','Sahara Bloom','3:18','linear-gradient(135deg,#F59E0B,#EC4899)'),
      srow(true,2,'Paper Moons','Elif Aydin','4:02','linear-gradient(135deg,#8B5CF6,#312E81)'),
      srow(true,3,'Salt Air','Coral Echoes','3:44','linear-gradient(135deg,#0EA5E9,#14B8A6)'),
      srow(false,4,'Velvet Static','Nova Rae','3:29','linear-gradient(135deg,#EC4899,#7C3AED)'),
      srow(false,5,'Amber Lines','Glass Petal','4:11','linear-gradient(135deg,#F59E0B,#92400E)'),
    ].join('<div style="border-top:1px solid '+t.border+'"></div>'))}
  </div></div>
  <div style="flex:none;padding:12px 20px 30px">${btn(t,'Add 3 songs')}</div>`;
});

}

// ================= runner =================
function stripText(html){
  return html.replace(/<script[\s\S]*?<\/script>/g,' ').replace(/<style[\s\S]*?<\/style>/g,' ')
    .replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&')
    .replace(/\s+/g,' ').trim().slice(0,1200);
}
function pageHTML(t, body){
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=390">
  <style>${baseCSS(t)}</style></head><body><div class="phone">${body}</div></body></html>`;
}
async function main(){
  const onlyArg = process.argv.find(a=>a.startsWith('--only='));
  const only = onlyArg ? onlyArg.split('=')[1] : null;
  const samplesOnly = process.argv.includes('--samples');
  let list = SCREENS;
  if (samplesOnly) list = SCREENS.filter(s=>['finpulse-home-03','pulsefit-home-02','wanderly-home-01'].includes(s.id));
  else if (only) list = SCREENS.filter(s=>s.id.includes(only));
  console.log(`Rendering ${list.length} screens…`);

  const browser = await puppeteer.launch({headless:true, args:['--no-sandbox','--disable-dev-shm-usage']});
  const page = await browser.newPage();
  await page.setViewport({width:390, height:844, deviceScaleFactor:2});
  const errors = [];
  page.on('pageerror', e=>errors.push(e.message));
  page.on('console', m=>{ if(m.type()==='error') errors.push(m.text()); });

  const meta = [];
  const elCov = {}, patCov = {};
  let ios=0, android=0;
  for (const s of list){
    const t = THEMES[s.app];
    const body = s.build(t);
    const html = pageHTML(t, body);
    try {
      await page.setContent(html, {waitUntil:'domcontentloaded', timeout:15000});
      await new Promise(r=>setTimeout(r, 350));
      const fname = `${s.id}.png`;
      await page.screenshot({path:path.join(OUT, fname)});
    } catch(e){ errors.push(`${s.id}: ${e.message}`); }
    const text = stripText(body);
    const popularity = 40 + Math.floor(rand()*59);
    meta.push({id:s.id, app_id:s.app, app_name:NAMES[s.app], title:s.title, pattern:s.pattern,
      elements:s.elements, platform:s.platform, category:CATS[s.app], colors:s.colors,
      tokens:{bg:t.bg, surface:t.card, primary:t.primary, text:t.text, muted:t.muted, radius:t.radius, font:t.font},
      text, image:`assets/screens/${s.id}.png`, width:390, height:844, popularity, created:'2026-10-15'});
    s.elements.forEach(e=>{ elCov[e]=(elCov[e]||0)+1; });
    patCov[s.pattern]=(patCov[s.pattern]||0)+1;
    if (s.platform==='iOS') ios++; else android++;
  }
  await browser.close();
  fs.writeFileSync(path.join(ROOT,'tmp/screens-meta.json'), JSON.stringify(meta,null,1));

  console.log('\n=== PLATFORM MIX ==='); console.log(`iOS: ${ios}  Android: ${android}`);
  console.log('\n=== ELEMENT COVERAGE ===');
  const needEl=['Button','Card','Tab Bar','Bottom Sheet','Modal','Search Bar','Carousel','Toggle','Slider','Progress Bar','Avatar','Badge','Chip','FAB','Segmented Control','List Item','Text Field','Checkbox','Radio','Dropdown','Date Picker','Chart','Skeleton','Toast','Banner','Accordion','Stepper','Rating'];
  needEl.forEach(e=>console.log(`${elCov[e]?'✓':'✗ MISSING'} ${e}: ${elCov[e]||0}`));
  console.log('\n=== PATTERN COVERAGE ===');
  const needPat=['Onboarding','Welcome','Login','Home','Feed','Search','Profile','Settings','Notifications','Wallet','Payment Method','Checkout','Cart','Subscription','Paywall','Empty State','Error State','Calendar','Map','Chat','Activity/Stats'];
  needPat.forEach(p=>console.log(`${patCov[p]?'✓':'✗ MISSING'} ${p}: ${patCov[p]||0}`));
  const missingEl=needEl.filter(e=>!elCov[e]), missingPat=needPat.filter(p=>!patCov[p]);
  console.log('\n=== ERRORS ==='); console.log(errors.length? errors.slice(0,10) : 'none');
  console.log(`\nScreens rendered: ${list.length} | missing elements: ${missingEl.join(',')||'none'} | missing patterns: ${missingPat.join(',')||'none'}`);
}
if (require.main===module) main().catch(e=>{console.error(e);process.exit(1);});
