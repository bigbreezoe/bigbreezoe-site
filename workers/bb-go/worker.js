// bb-go: counts /go/<slug> link clicks, then serves the redirect.
// Any error in counting is swallowed; a link never breaks because of the counter.
// Redirects that replace the site's own _redirects entry (same as the old Cloudflare rule: 302, query string dropped).
const OVERRIDES = { 'dji-mic-3': 'https://www.dji.com/mic-3' };
const SLUG = /^\/go\/([a-z0-9][a-z0-9-]{0,39})\/?$/;
const BOT = /bot|crawl|spider|preview|slurp|curl|wget|python|axios|node|n8n|java|go-http|okhttp|headless|monitor|uptime|check|fetch|scan|facebookexternalhit|embedly|whatsapp|telegram|discord|slack/i;

function refHost(ref) {
  try { return ref ? new URL(ref).hostname.replace(/^www\./, '').slice(0, 60) : 'direct'; }
  catch (e) { return 'direct'; }
}

export function classify(request) {
  const ua = request.headers.get('user-agent') || '';
  if (request.method !== 'GET') return 'other';
  if (!/^Mozilla\//.test(ua)) return 'other';
  if (BOT.test(ua)) return 'other';
  return 'human';
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const m = SLUG.exec(url.pathname);
    let response;
    if (m && OVERRIDES[m[1]] && (request.method === 'GET' || request.method === 'HEAD')) {
      response = new Response(null, { status: 302, headers: { location: OVERRIDES[m[1]] } });
    } else {
      response = await fetch(request, { redirect: 'manual' });
    }
    if (m) {
      try {
        if (env.GO_CLICKS && typeof env.GO_CLICKS.writeDataPoint === 'function') {
          env.GO_CLICKS.writeDataPoint({
            indexes: [m[1]],
            blobs: [m[1], String(response.status), classify(request), refHost(request.headers.get('referer'))],
            doubles: [1],
          });
        }
      } catch (e) { /* counting failure must never break a link */ }
    }
    return response;
  },
};
