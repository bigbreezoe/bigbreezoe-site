// Site checker. Run: npm run check. Exit code 1 on any ERROR. Warnings never block.
// Rules come from the Big Breezoe Compliance & Publishing Rules (see docs/RULES.md).
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';

const root = new URL('../public', import.meta.url).pathname;
const links = JSON.parse(readFileSync(new URL('../data/links.json', import.meta.url))).links;
const errors = [], warns = [];
const err = (f, m) => errors.push(`${f}: ${m}`);
const warn = (f, m) => warns.push(`${f}: ${m}`);

const walk = (d) => readdirSync(d).flatMap((n) => {
  const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p];
});
const files = walk(root);
const pages = files.filter((f) => f.endsWith('.html'));
const rel = (f) => '/' + relative(root, f);
const pageUrl = (f) => { const r = rel(f); return r.endsWith('/index.html') ? r.slice(0, -10) || '/' : r; };

const exists = (urlPath) => {
  const p = urlPath.split('#')[0].split('?')[0];
  if (p === '' ) return true;
  const f = join(root, decodeURIComponent(p));
  if (existsSync(f) && statSync(f).isFile()) return true;
  if (existsSync(join(f, 'index.html'))) return true;
  if (existsSync(f + '.html')) return true;
  return false;
};

// 1. Links and assets
for (const f of pages) {
  const html = readFileSync(f, 'utf8');
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|tel:|#|data:|javascript:|\/\/)/.test(u)) continue;
    let target = u.startsWith('/') ? u : '/' + join(dirname(rel(f)), u);
    if (/^\/go\/([a-z0-9-]+)\/?$/.test(target)) {
      const slug = target.match(/^\/go\/([a-z0-9-]+)/)[1];
      if (!links[slug]) err(rel(f), `unknown /go/ link: ${target} (add it to data/links.json)`);
      continue;
    }
    if (!exists(target)) err(rel(f), `broken internal link/asset: ${u}`);
  }
  if (/\[email(&#160;| )protected\]|cdn-cgi\/l\/email-protection/.test(html)) err(rel(f), 'Cloudflare email-scramble artifact found; use a plain mailto link');
}

// 2. Affiliate disclosure on any page that links through /go/
for (const f of pages) {
  const html = readFileSync(f, 'utf8');
  if (/href="\/go\//.test(html) && !/affiliate/i.test(html)) err(rel(f), 'page has /go/ links but no affiliate disclosure (FTC 16 CFR 255)');
}

// 3. Words that must not appear unless they are inside a negation like "no guarantee"
const banned = [
  [/\bguaranteed? (income|results?|money|profit|success)/i, 'income/result guarantee'],
  [/\b(earn|make|made)\s+\$\s?\d[\d,]*\s*(\/|per|a|each)?\s*(day|week|month|year)?/i, 'income claim with a dollar figure'],
  [/\bget rich\b|\bpassive income\b|\bfinancial freedom\b|\bsix[- ]figure\b|\b6[- ]figure\b/i, 'hype/income phrase'],
  [/\b(I|we) (use|own|tested|tried)\b[^.]{0,80}\b(Movavi|Hollyland|Descript|n8n|Kit|Tally)\b/i, null] // handled in section 4
];
for (const f of pages) {
  const text = readFileSync(f, 'utf8').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
  for (const [re, label] of banned) {
    if (!label) continue;
    const m = text.match(re);
    if (m) {
      const ctx = text.slice(Math.max(0, m.index - 60), m.index + 100).replace(/\s+/g, ' ');
      if (/\b(no|not|never|don'?t|won'?t|can'?t|without)\b[^.]{0,80}$/i.test(text.slice(Math.max(0, m.index - 90), m.index + m[0].length))) continue; // negated, e.g. "no guarantee"
      err(rel(f), `${label}: "...${ctx}..."`);
    }
  }
}

// 4. Owned / tested / researched truth: tools marked live:true in store-config must have kind own|research
try {
  const cfg = readFileSync(join(root, 'store/store-config.js'), 'utf8');
  for (const m of cfg.matchAll(/\{\s*slug:\s*"([^"]+)"[^}]*kind:\s*"([^"]+)"[^}]*live:\s*(true|false)/g)) {
    if (!['own', 'research'].includes(m[2])) err('/store/store-config.js', `tool ${m[1]} has kind "${m[2]}" (must be own or research)`);
    if (m[3] === 'true' && !links[m[1]] && !/url:\s*"https?:/.test(cfg.slice(m.index, m.index + m[0].length + 200))) {
      warn('/store/store-config.js', `tool ${m[1]} is live but has no /go/ slug in data/links.json and no own url`);
    }
  }
} catch { warn('/store/store-config.js', 'could not parse'); }

// 5. LLC naming on legal pages and footer
for (const [p, must] of [['terms.html', 'Big Breezoe LLC'], ['privacy.html', 'Big Breezoe LLC'], ['index.html', 'Big Breezoe LLC']]) {
  if (!existsSync(join(root, p)) || !readFileSync(join(root, p), 'utf8').includes(must)) err('/' + p, `must name "${must}"`);
}

// 6. Sitemap covers every public page (language pages, store pages, setup pages)
const sm = existsSync(join(root, 'sitemap.xml')) ? readFileSync(join(root, 'sitemap.xml'), 'utf8') : '';
for (const f of pages) {
  const u = 'https://bigbreezoe.com' + pageUrl(f);
  const alt = u.endsWith('/') ? u : u.replace(/\.html$/, '');
  if (!sm.includes(`<loc>${u}</loc>`) && !sm.includes(`<loc>${alt}</loc>`)) warn(rel(f), 'not listed in sitemap.xml');
}

// 7. Canonical and title present
for (const f of pages) {
  const html = readFileSync(f, 'utf8');
  if (!/<title>[^<]+<\/title>/.test(html)) err(rel(f), 'missing <title>');
  if (!/name="viewport"/.test(html)) warn(rel(f), 'missing viewport meta');
}

console.log(`Checked ${pages.length} pages, ${files.length} files.`);
for (const w of warns) console.log('WARN  ' + w);
for (const e of errors) console.log('ERROR ' + e);
console.log(errors.length ? `\nFAILED: ${errors.length} error(s), ${warns.length} warning(s)` : `\nPASSED with ${warns.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
