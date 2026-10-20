// Stamps the shared head, header and footer into every English page, so no page drifts from the design system.
// Run: npm run layout (writes) or node scripts/layout.mjs --check (exit 1 if any page is out of date).
// Each page marks the spots with <!--bb:head--><!--/bb:head-->, <!--bb:header--><!--/bb:header--> and <!--bb:footer--><!--/bb:footer-->.
// The translated pages (es, fr, hi, zh) keep their own layout and are skipped.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const base = fileURLToPath(new URL('..', import.meta.url));
const pub = join(base, 'public');
const read = (p) => readFileSync(join(base, p), 'utf8').replace(/\r\n/g, '\n').trim();
// Line endings are ignored, so a Windows checkout (CRLF) and a Unix one (LF) get the same stamp.
const lf = (s) => s.replace(/\r\n/g, '\n');
const hash = (p) => createHash('sha256').update(lf(readFileSync(join(pub, p), 'utf8'))).digest('hex').slice(0, 10);
const check = process.argv.includes('--check');

const wordmark = read('partials/wordmark.svg');
const parts = {
  head: read('partials/head.html').replace('{{css}}', hash('assets/bb.css')).replace('{{js}}', hash('assets/bb.js')),
  header: read('partials/header.html').replaceAll('{{wordmark}}', wordmark),
  footer: read('partials/footer.html').replaceAll('{{wordmark}}', wordmark),
  signup: read('partials/signup.html'),
};
const OPTIONAL = new Set(['signup']); // stamped only on pages that carry the marker

const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const skip = /^(es|fr|hi|zh)\//;
let changed = 0, missing = [];
for (const f of walk(pub).filter((f) => f.endsWith('.html'))) {
  const rel = relative(pub, f).replace(/\\/g, '/');
  if (skip.test(rel)) continue;
  const url = '/' + rel.replace(/index\.html$/, '');
  const raw = readFileSync(f, 'utf8');
  const crlf = raw.includes('\r\n');
  let html = lf(raw);
  const before = html;
  for (const [name, body] of Object.entries(parts)) {
    const re = new RegExp(`<!--bb:${name}-->[\\s\\S]*?<!--/bb:${name}-->`);
    if (!re.test(html)) { if (!OPTIONAL.has(name)) missing.push(`${rel} (${name})`); continue; }
    // Mark the link for the page you are on.
    const cur = name === 'header' ? body.replace(new RegExp(`(<nav class="bb-nav"[^]*?)<a href="${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`), `$1<a href="${url}" aria-current="page">`) : body;
    html = html.replace(re, () => `<!--bb:${name}-->\n${cur}\n<!--/bb:${name}-->`);
  }
  html = html.replace(/\/store\/store-config\.js\?v=[^"]*/g, '/store/store-config.js?v=' + hash('store/store-config.js'));
  if (html !== before) { changed++; if (!check) writeFileSync(f, crlf ? html.replace(/\n/g, '\r\n') : html); else console.log('out of date: ' + rel); }
}
if (missing.length) { console.log('Pages missing a layout marker:\n  ' + missing.join('\n  ')); process.exit(1); }
if (check && changed) { console.log(`\n${changed} page(s) out of date. Run: npm run layout`); process.exit(1); }
console.log(check ? 'Layout: every page is current.' : `Layout: ${changed} page(s) updated.`);
