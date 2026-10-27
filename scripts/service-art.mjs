// Builds one image per one-off job for /store/ (public/media/services/<key>.webp, 640x400).
// Each image restates the job's own description from store-config.js; it adds no new promise.
// Run: node scripts/service-art.mjs   (uses the installed Chrome through playwright-core, and ffmpeg on PATH for WebP)
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repo = fileURLToPath(new URL('..', import.meta.url));
const out = join(repo, 'public/media/services');
mkdirSync(out, { recursive: true });
const font = (f) => pathToFileURL(join(repo, 'public/fonts', f)).href;
const wordmark = readFileSync(join(repo, 'partials/wordmark.svg'), 'utf8').replace('<svg ', '<svg fill="#F0A840" ');

// Icons: simple strokes in the brand colors. G = gold, C = cream.
const G = '#F0A840', C = '#F2EFE9', D = 'rgba(242,239,233,.28)';
const s = (body) => `<svg viewBox="0 0 200 200" width="200" height="200" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="6">${body}</svg>`;
const ART = {
  'session-60': {
    eyebrow: 'Working session · 60 min', head: ['We work on', 'what\'s next,', 'live.'], gold: 2,
    icon: s(`<rect x="18" y="34" width="164" height="108" rx="10" stroke="${C}"/><path d="M80 166h40M100 142v24" stroke="${C}"/><circle cx="100" cy="88" r="30" stroke="${G}"/><path d="M100 72v16l11 8" stroke="${G}"/>`),
  },
  'quick-fix': {
    eyebrow: 'Quick fix · 30 min', head: ['One problem,', 'fixed live.'], gold: 1,
    icon: s(`<rect x="14" y="96" width="92" height="48" rx="24" stroke="${C}"/><rect x="88" y="96" width="92" height="48" rx="24" stroke="${C}"/><circle cx="150" cy="52" r="28" stroke="${G}"/><path d="M137 52l9 9 18-19" stroke="${G}"/><path d="M60 64l-10-16M84 58l2-18" stroke="${G}"/>`),
  },
  'intake-form': {
    eyebrow: 'Intake form + auto-reply', head: ['Every answer', 'saved. Every', 'person replied to.'], gold: 2,
    icon: s(`<rect x="18" y="30" width="70" height="92" rx="8" stroke="${C}"/><path d="M32 54h42M32 74h42M32 94h26" stroke="${D}"/><path d="M96 76h22l-8-8M118 76l-8 8" stroke="${G}"/><rect x="126" y="44" width="58" height="64" rx="6" stroke="${C}"/><path d="M126 66h58M126 86h58M155 44v64" stroke="${D}"/><rect x="72" y="136" width="70" height="44" rx="6" stroke="${G}"/><path d="M72 140l35 22 35-22" stroke="${G}"/>`),
  },
  'booking-page': {
    eyebrow: 'Booking page', head: ['People book', 'your calls', 'on your calendar.'], gold: 2,
    icon: s(`<rect x="26" y="40" width="148" height="136" rx="12" stroke="${C}"/><path d="M26 78h148M62 24v30M138 24v30" stroke="${C}"/><path d="M58 104h18M92 104h18M126 104h18M58 140h18M92 140h18" stroke="${D}"/><path d="M122 138l12 12 24-26" stroke="${G}"/>`),
  },
  'email-welcome': {
    eyebrow: 'Email list + welcome emails', head: ['A sign-up form', 'and 3 welcome', 'emails, drafted.'], gold: 2,
    icon: s(`<rect x="46" y="40" width="120" height="80" rx="8" stroke="${D}"/><rect x="34" y="62" width="120" height="80" rx="8" stroke="${D}"/><rect x="22" y="84" width="120" height="80" rx="8" stroke="${C}"/><path d="M22 90l60 40 60-40" stroke="${G}"/><circle cx="166" cy="146" r="20" stroke="${G}"/><path d="M166 136v20M156 146h20" stroke="${G}"/>`),
  },
  'follow-up': {
    eyebrow: 'Follow-up automation', head: ['A reminder before,', 'a next step', 'after.'], gold: 2,
    icon: s(`<path d="M70 118V86a30 30 0 0 1 60 0v32l12 16H58z" stroke="${C}"/><path d="M90 150a10 10 0 0 0 20 0" stroke="${C}"/><path d="M28 70a76 76 0 0 1 22-36M172 70a76 76 0 0 0-22-36" stroke="${G}"/><path d="M40 176h120" stroke="${D}"/><circle cx="40" cy="176" r="7" fill="${G}" stroke="none"/><circle cx="160" cy="176" r="7" fill="${G}" stroke="none"/>`),
  },
  'one-page-site': {
    eyebrow: 'One-page website', head: ['A fast site', 'on your own', 'domain.'], gold: 2,
    icon: s(`<rect x="16" y="32" width="168" height="136" rx="12" stroke="${C}"/><path d="M16 60h168" stroke="${C}"/><circle cx="34" cy="46" r="4" fill="${D}" stroke="none"/><circle cx="48" cy="46" r="4" fill="${D}" stroke="none"/><rect x="66" y="40" width="104" height="12" rx="6" stroke="${G}" stroke-width="4"/><path d="M40 88h80M40 108h120M40 128h60" stroke="${D}"/><rect x="40" y="142" width="54" height="14" rx="7" stroke="${G}" stroke-width="4"/>`),
  },
  'video-edit': {
    eyebrow: 'Video or podcast edit', head: ['One episode', 'edited, plus', '3 Shorts.'], gold: 2,
    icon: s(`<rect x="14" y="30" width="120" height="72" rx="8" stroke="${C}"/><path d="M64 52v28l22-14z" stroke="${G}"/><path d="M14 122h120" stroke="${D}"/><path d="M40 114v16M80 114v16M112 114v16" stroke="${G}"/><rect x="146" y="30" width="38" height="66" rx="6" stroke="${G}"/><rect x="146" y="104" width="38" height="66" rx="6" stroke="${G}"/><rect x="104" y="140" width="34" height="40" rx="6" stroke="${G}"/>`),
  },
  'shorts-pack': {
    eyebrow: 'Shorts pack', head: ['5 vertical Shorts', 'with captions,', 'from one video.'], gold: 0,
    icon: s(`<rect x="40" y="18" width="120" height="58" rx="8" stroke="${C}"/><path d="M92 36v22l18-11z" stroke="${C}"/><path d="M100 84v16" stroke="${G}"/>${[0, 1, 2, 3, 4].map((i) => `<rect x="${12 + i * 38}" y="108" width="24" height="56" rx="5" stroke="${G}" stroke-width="5"/><path d="M${17 + i * 38} 152h14" stroke="${C}" stroke-width="4"/>`).join('')}`),
  },
};

const html = (a) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Archivo;font-weight:400 900;src:url(${font('archivo-latin.woff2')}) format('woff2')}
@font-face{font-family:Mono;font-weight:400 600;src:url(${font('jetbrains-mono-latin.woff2')}) format('woff2')}
*{margin:0;box-sizing:border-box}
body{width:640px;height:400px;background:#0B0D10;color:${C};font-family:Archivo,sans-serif;position:relative;overflow:hidden;
 background-image:linear-gradient(rgba(242,239,233,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(242,239,233,.035) 1px,transparent 1px);background-size:32px 32px}
.glow{position:absolute;right:-60px;top:40px;width:360px;height:320px;border-radius:50%;background:radial-gradient(ellipse at center,rgba(240,168,64,.16),transparent 66%)}
.wm{position:absolute;left:40px;top:36px;width:150px}
.wm svg{width:150px;height:auto;display:block}
.txt{position:absolute;left:40px;bottom:44px;width:340px}
.eb{font-family:Mono,monospace;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:${G};margin-bottom:14px}
h1{font-size:36px;line-height:1.04;font-weight:900;letter-spacing:-.025em}
h1 .g{color:${G}}
.ic{position:absolute;right:44px;top:100px}
</style></head><body><div class="glow"></div><div class="wm">${wordmark}</div>
<div class="ic">${a.icon}</div>
<div class="txt"><p class="eb">${a.eyebrow}</p><h1>${a.head.map((l, i) => (i === a.gold ? `<span class="g">${l}</span>` : l)).join('<br>')}</h1></div>
</body></html>`;

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 640, height: 400 }, deviceScaleFactor: 1 });
for (const [key, a] of Object.entries(ART)) {
  await page.setContent(html(a), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const png = join(out, key + '.png');
  await page.screenshot({ path: png });
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', png, '-c:v', 'libwebp', '-quality', '82', join(out, key + '.webp')]);
  unlinkSync(png);
  console.log('built', key);
}
await browser.close();
