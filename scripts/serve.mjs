// Tiny local preview server (no dependencies). Run: npm run preview  -> http://localhost:8788
// Behaves like Cloudflare Pages where it matters for checking the site: /go/ redirects from public/_redirects,
// /page serves page.html, unknown paths get public/404.html with a 404, and video supports range requests.
// Pages Functions (/api/...) do not run here; use wrangler pages dev for those.
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../public', import.meta.url));
const types = { '.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.xml':'application/xml','.txt':'text/plain','.webp':'image/webp','.avif':'image/avif','.mp4':'video/mp4','.webm':'video/webm','.json':'application/json','.pdf':'application/pdf' };

const redirects = existsSync(join(root, '_redirects'))
  ? readFileSync(join(root, '_redirects'), 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => l.split(/\s+/))
  : [];
const isFile = (f) => existsSync(f) && statSync(f).isFile();

createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const rule = redirects.find(([from]) => from === p || from === p.replace(/\/$/, ''));
  if (rule) { res.writeHead(Number(rule[2] || 302), { location: rule[1] }); return res.end(); }

  let f = join(root, p);
  if (isFile(f)) { /* exact file */ }
  else if (isFile(join(f, 'index.html'))) f = join(f, 'index.html');
  else if (isFile(f.replace(/[\\/]$/, '') + '.html')) f = f.replace(/[\\/]$/, '') + '.html';
  else f = null;
  if (f && !(f === root || f.startsWith(root + sep))) f = null;
  if (!f) { res.writeHead(404, { 'content-type': types['.html'] }); return res.end(readFileSync(join(root, '404.html'))); }

  const type = types[extname(f)] || 'application/octet-stream';
  const size = statSync(f).size;
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (range && /^(video|audio)\//.test(type)) {
    const start = range[1] ? Number(range[1]) : 0, end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    res.writeHead(206, { 'content-type': type, 'content-range': `bytes ${start}-${end}/${size}`, 'accept-ranges': 'bytes', 'content-length': end - start + 1 });
    return res.end(readFileSync(f).subarray(start, end + 1));
  }
  res.writeHead(200, { 'content-type': type, 'accept-ranges': 'bytes' });
  res.end(readFileSync(f));
}).listen(8788, '127.0.0.1', () => console.log('Preview: http://localhost:8788'));
