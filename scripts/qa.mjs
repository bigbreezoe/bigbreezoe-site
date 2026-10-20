// Site walk-through. Opens every public page at 390 px and 1440 px, checks every link, clicks every button,
// saves a full-page screenshot of each page, and lists any 404, failed request or console error.
// Run: npm run qa             (starts the local preview on :8788 if it is not already running)
//      npm run qa -- --base https://preview.bigbreezoe1.pages.dev
// Uses the Chrome already installed on this machine (playwright-core, no browser download).
// It never submits a form and never completes a checkout: Stripe links are only loaded to see that they answer.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('..', import.meta.url));
const pub = join(repo, 'public');
const out = join(repo, 'qa');
const argBase = process.argv.indexOf('--base');
const BASE = (argBase > 0 ? process.argv[argBase + 1] : 'http://localhost:8788').replace(/\/$/, '');
const HIDDEN = /^\/(checkout|booked|upload|store\/audio-kit\/download)\//;

const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const pages = walk(pub).filter((f) => f.endsWith('.html'))
  .map((f) => '/' + relative(pub, f).replace(/\\/g, '/').replace(/index\.html$/, '').replace(/\.html$/, '.html'))
  .filter((u) => !HIDDEN.test(u) && u !== '/404.html').sort();

async function up(url) { try { const r = await fetch(url); return r.ok; } catch { return false; } }
let server = null;
if (BASE.startsWith('http://localhost') && !(await up(BASE + '/'))) {
  server = spawn(process.execPath, [join(repo, 'scripts/serve.mjs')], { stdio: 'ignore' });
  for (let i = 0; i < 40 && !(await up(BASE + '/')); i++) await new Promise((r) => setTimeout(r, 150));
}

const problems = [];
const note = (page, vp, kind, detail) => problems.push({ page, vp, kind, detail });
const linkCache = new Map();
async function checkLink(href) {
  if (linkCache.has(href)) return linkCache.get(href);
  let res;
  try {
    const r = await fetch(href, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (bigbreezoe.com link check)' } });
    res = r.status;
  } catch (e) { res = 'network: ' + e.message; }
  linkCache.set(href, res);
  return res;
}

mkdirSync(join(out, 'screens'), { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const VPS = [{ name: '390', width: 390, height: 844, mobile: true }, { name: '1440', width: 1440, height: 900, mobile: false }];
const counts = { pages: 0, links: 0, buttons: 0 };

for (const vp of VPS) {
  // Reduced motion so every block is fully shown in the screenshot; the motion pass below checks the animated path.
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.mobile, hasTouch: vp.mobile, reducedMotion: 'reduce', deviceScaleFactor: 1 });
  for (const path of pages) {
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
    page.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(BASE)) note(path, vp.name, 'http ' + r.status(), r.url()); });
    page.on('requestfailed', (r) => { if (r.url().startsWith(BASE)) note(path, vp.name, 'request failed', r.url() + ' ' + (r.failure() || {}).errorText); });
    const resp = await page.goto(BASE + path, { waitUntil: 'networkidle' });
    if (!resp || resp.status() >= 400) note(path, vp.name, 'page status', resp ? resp.status() : 'none');
    counts.pages++;

    const sw = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (sw > 0) note(path, vp.name, 'sideways scroll', sw + 'px');

    const name = (path === '/' ? 'home' : path.replace(/^\/|\/$/g, '').replace(/[\/.]/g, '_'));
    await page.screenshot({ path: join(out, 'screens', `${vp.name}-${name}.png`), fullPage: true });

    // Every link: internal links must answer 200, external ones must not be broken.
    const hrefs = await page.$$eval('a[href]', (as) => [...new Set(as.map((a) => a.href))]);
    for (const h of hrefs) {
      if (/^(mailto|tel|javascript):/.test(h) || h.includes('#') && h.split('#')[0] === page.url().split('#')[0]) continue;
      if (vp.name !== '390' && !h.startsWith(BASE)) continue; // external links once is enough
      counts.links++;
      let target = h, external = !h.startsWith(BASE);
      if (h.startsWith(BASE + '/go/')) {
        // A /go/ link must redirect; where it lands is an outside site and is checked like one.
        const r = await fetch(h, { redirect: 'manual' });
        if (![301, 302, 307, 308].includes(r.status) || !r.headers.get('location')) { note(path, vp.name, 'broken /go/ link', `${h} -> ${r.status}`); continue; }
        target = r.headers.get('location'); external = true;
      }
      const st = await checkLink(external ? target : target.split('#')[0]);
      if (typeof st !== 'number' || (external ? st >= 400 && ![401, 403, 405, 429, 999].includes(st) : st !== 200)) note(path, vp.name, external ? 'external link' : 'broken link', `${h} -> ${target === h ? '' : target + ' '}${st}`);
      if (external && /buy\.stripe\.com\/test_/.test(h)) note(path, vp.name, 'test Stripe link', h);
    }

    // Every button: click it and watch for errors. Submit buttons are skipped so no form is ever sent.
    const buttons = await page.$$('button:not([type=submit]):not(.formkit-submit), summary');
    for (const b of buttons) {
      if (!(await b.isVisible())) continue;
      counts.buttons++;
      try { await b.scrollIntoViewIfNeeded(); await b.click({ timeout: 3000 }); await page.waitForTimeout(150); } catch (e) { note(path, vp.name, 'button click', (await b.textContent() || '').trim().slice(0, 40) + ': ' + e.message.split('\n')[0]); }
    }
    for (const e of errs) note(path, vp.name, 'console error', e);
    await page.close();
  }
  await ctx.close();
}

// Motion pass: the home page with motion on, scrolled to the bottom, so every reveal and clip has run.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const page = await ctx.newPage();
  const errs = []; page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); }); page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  for (let y = 0; y < 30; y++) { await page.mouse.wheel(0, 600); await page.waitForTimeout(120); }
  await page.waitForTimeout(900);
  const hidden = await page.$$eval('[data-rv]', (els) => els.filter((e) => getComputedStyle(e).opacity !== '1').length);
  if (hidden) note('/', 'motion', 'reveal never finished', hidden + ' block(s)');
  for (const e of errs) note('/', 'motion', 'console error', e);
  await ctx.close();
}

// Hidden pages: without a token or a real paid session they must show the 404 page, never offer content.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  for (const p of ['/checkout/', '/booked/', '/upload/', '/store/audio-kit/download/?s=cs_live_fake']) {
    const page = await ctx.newPage();
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const t = await page.title();
    if (!/not found/i.test(t)) note(p, 'hidden', 'did not show the 404 page', t);
    await page.close();
  }
  await ctx.close();
}

await browser.close();
if (server) server.kill();

const lines = [`# Site walk-through`, ``, `Base: ${BASE}`, `Checked ${counts.pages} page loads, ${counts.links} link checks, ${counts.buttons} button clicks. Screenshots: qa/screens/.`, ``];
if (!problems.length) lines.push('No problems found.');
else { lines.push(`| Page | Viewport | Problem | Detail |`, `|---|---|---|---|`); for (const p of problems) lines.push(`| ${p.page} | ${p.vp} | ${p.kind} | ${String(p.detail).replace(/\|/g, '\\|')} |`); }
writeFileSync(join(out, 'report.md'), lines.join('\n') + '\n');
console.log(lines.join('\n'));
process.exit(problems.length ? 1 : 0);
