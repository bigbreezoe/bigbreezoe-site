// Generates public/_redirects from data/links.json. Run: npm run redirects
import { readFileSync, writeFileSync } from 'node:fs';
const d = JSON.parse(readFileSync(new URL('../data/links.json', import.meta.url)));
const lines = [
  '# GENERATED from data/links.json by scripts/build-redirects.mjs. Do not edit by hand.',
  '# Every affiliate link goes through /go/<slug>. The bb-go Worker counts clicks, then serves these.'
];
for (const [slug, v] of Object.entries(d.links)) lines.push(`/go/${slug}  ${v.to}  302`);
for (const [legacy, slug] of Object.entries(d.legacy || {})) {
  if (d.links[slug]) lines.push(`/${legacy}  ${d.links[slug].to}  302`);
}
writeFileSync(new URL('../public/_redirects', import.meta.url), lines.join('\n') + '\n');
console.log(`wrote public/_redirects (${Object.keys(d.links).length} links)`);
