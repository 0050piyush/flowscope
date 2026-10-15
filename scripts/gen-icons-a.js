#!/usr/bin/env node
/* Flowscope slice A — app icon generator (512x512) */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'site/assets/apps');
fs.mkdirSync(OUT, { recursive: true });

const ICONS = [
  { id:'finpulse', letter:'F', bg:'linear-gradient(135deg,#0B1220 0%,#164E63 60%,#22D3EE 130%)', accent:'#22D3EE', glyph:'<path d="M13 2L4 14h6l-1 8 9-12h-6z"/>' },
  { id:'pulsefit', letter:'P', bg:'linear-gradient(135deg,#0A0F0D 0%,#1A2E05 60%,#65A30D 130%)', accent:'#A3E635', glyph:'<path d="M7 8v8M17 8v8M4 10v4M20 10v4M7 12h10"/>' },
  { id:'wanderly', letter:'W', bg:'linear-gradient(135deg,#7C2D12 0%,#EA580C 65%,#FBBF24 130%)', accent:'#FFF7ED', glyph:'<path d="M10 20l-1.5-4.5L4 14l-1-2 6-1L14 4l2-1 1 7 5 3-1 2-4.5.5z"/>' },
  { id:'crave',    letter:'C', bg:'linear-gradient(135deg,#881337 0%,#F43F5E 65%,#FB7185 130%)', accent:'#FFFFFF', glyph:'<path d="M7 3v8M4 3v4a3 3 0 0 0 6 0V3M7 11v10M17 3c-2 2-3 5-3 8h3v10M17 11h4"/>' },
  { id:'tempo',    letter:'T', bg:'linear-gradient(135deg,#12071F 0%,#4C1D95 60%,#A855F7 130%)', accent:'#EC4899', glyph:'<path d="M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM9 18V4l12-2v13M9 6l12-2"/>' },
];

async function main(){
  const browser = await puppeteer.launch({headless:true, args:['--no-sandbox','--disable-dev-shm-usage']});
  const page = await browser.newPage();
  await page.setViewport({width:512, height:512, deviceScaleFactor:1});
  for (const ic of ICONS){
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{width:512px;height:512px;display:flex;align-items:center;justify-content:center;background:transparent;font-family:system-ui,sans-serif}
      .tile{width:512px;height:512px;border-radius:116px;background:${ic.bg};position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center}
      .tile::before{content:'';position:absolute;width:640px;height:640px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.22),transparent 65%);top:-180px;right:-160px}
      .tile::after{content:'';position:absolute;width:340px;height:340px;border-radius:50%;border:44px solid rgba(255,255,255,.10);bottom:-120px;left:-100px}
      .letter{font-size:250px;font-weight:800;color:#fff;letter-spacing:-12px;position:relative;z-index:2;text-shadow:0 12px 44px rgba(0,0,0,.35)}
      .glyph{position:absolute;bottom:64px;right:64px;z-index:2;opacity:.92}
    </style></head><body><div class="tile"><div class="letter">${ic.letter}</div>
      <svg class="glyph" width="84" height="84" viewBox="0 0 24 24" fill="none" stroke="${ic.accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ic.glyph}</svg>
    </div></body></html>`;
    await page.setContent(html, {waitUntil:'domcontentloaded'});
    await new Promise(r=>setTimeout(r,200));
    await page.screenshot({path:path.join(OUT, `${ic.id}.png`), omitBackground:true});
    console.log('icon:', ic.id);
  }
  await browser.close();
}
if (require.main===module) main().catch(e=>{console.error(e);process.exit(1);});
