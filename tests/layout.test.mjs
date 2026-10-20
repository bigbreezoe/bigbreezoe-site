import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const base = fileURLToPath(new URL('..', import.meta.url));
const pub = join(base, 'public');
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const pages = walk(pub).filter((f) => f.endsWith('.html')).map((f) => [relative(pub, f).replace(/\\/g, '/'), readFileSync(f, 'utf8')]);
const english = pages.filter(([rel]) => !/^(es|fr|hi|zh)\//.test(rel));

test('every English page carries the current shared head, header and footer', () => {
  const out = execFileSync(process.execPath, [join(base, 'scripts/layout.mjs'), '--check'], { encoding: 'utf8' });
  assert.match(out, /every page is current/);
});

test('every English page uses the one stylesheet and no inline style blocks', () => {
  for (const [rel, html] of english) {
    assert.match(html, /<link rel="stylesheet" href="\/assets\/bb\.css\?v=[0-9a-f]+">/, rel);
    assert.doesNotMatch(html, /<style[\s>]/, `${rel} has its own <style> block`);
    assert.doesNotMatch(html, /polish\.css/, rel);
  }
});

test('bigbreezoe.com is never typed as text in the header or footer, only drawn as the wordmark', () => {
  for (const [rel, html] of english) {
    const chrome = (html.match(/<!--bb:header-->[\s\S]*?<!--\/bb:header-->/) || [''])[0] + (html.match(/<!--bb:footer-->[\s\S]*?<!--\/bb:footer-->/) || [''])[0];
    assert.match(chrome, /class="wordmark"/, rel);
    assert.doesNotMatch(chrome.replace(/<[^>]+>/g, ' '), /(^|[^@\w.])bigbreezoe\.com/i, rel);
    assert.doesNotMatch(chrome.replace(/<[^>]+>/g, ' '), /BIG BREEZOE/, rel);
  }
});

test('the hero video stays under its 2.5 MB budget and every clip ships MP4, WebM and a poster', () => {
  for (const name of ['hero-loop', 'ep3-teaser', 'how-buying', 'gear-lanes']) {
    for (const ext of ['mp4', 'webm', 'webp', 'avif']) assert.ok(statSync(join(pub, 'media', `${name}.${ext}`)).size > 0, `${name}.${ext}`);
  }
  for (const ext of ['mp4', 'webm']) assert.ok(statSync(join(pub, 'media', `hero-loop.${ext}`)).size < 2.5e6, `hero-loop.${ext}`);
});

test('the shared script stays small and needs no library', () => {
  const js = statSync(join(pub, 'assets/bb.js')).size;
  assert.ok(js < 15 * 1024, `bb.js is ${js} bytes`);
});

test('every Buy now link in the store config is a live Stripe link', () => {
  const cfg = readFileSync(join(pub, 'store/store-config.js'), 'utf8');
  const links = [...cfg.matchAll(/(?:buy|site):\s*"(https?:[^"]+)"/g)].map((m) => m[1]);
  assert.ok(links.length >= 10, `found ${links.length} buy links`);
  for (const u of links) {
    assert.match(u, /^https:\/\/buy\.stripe\.com\/[A-Za-z0-9]+$/, u);
    assert.doesNotMatch(u, /test_/, u);
  }
});

test('no public file links to the invite-only offers', () => {
  for (const [rel, html] of pages) {
    assert.doesNotMatch(html, /href="[^"]*(getting-started|the-basics|full-playbook)[^"]*"/i, rel);
  }
});
