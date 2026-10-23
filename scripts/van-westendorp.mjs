// Van Westendorp Price Sensitivity Meter: turns survey answers into the four price points.
//
//   node scripts/van-westendorp.mjs answers.csv
//   node scripts/van-westendorp.mjs answers.csv --step 1      (price grid step, default 0.5)
//
// answers.csv: one row per respondent, header row required, four dollar amounts per row:
//   too_cheap,cheap,expensive,too_expensive
// The four questions, in this order of meaning (cheapest to dearest):
//   too_cheap      At what price would you think it is so cheap that you doubt its quality?
//   cheap          At what price would you call it a bargain, a great buy for the money?
//   expensive      At what price would it start to feel expensive, but you would still consider it?
//   too_expensive  At what price would it be too expensive to consider at all?
// Rows that are not too_cheap <= cheap <= expensive <= too_expensive are reported and dropped.
//
// Curves (shares of respondents, 0 to 1), p = a price on the grid:
//   TC(p) too cheap      = share with too_cheap      >= p   (falls as p rises)
//   NC(p) not cheap      = share with cheap          <  p   (rises)
//   NE(p) not expensive  = share with expensive      >  p   (falls)
//   TE(p) too expensive  = share with too_expensive  <= p   (rises)
// Price points (where a falling curve meets a rising curve):
//   PMC  point of marginal cheapness      TC x NC     below this, price starts to cost you credibility
//   OPP  optimal price point              TC x TE     fewest people rejecting on price either side
//   IPP  indifference price point         NC x NE     as many call it cheap as call it expensive
//   PME  point of marginal expensiveness  NE x TE     above this, price starts to cost you buyers
// Acceptable range = PMC to PME. This measures how a price feels, not whether people will buy at it.

import { readFileSync } from 'node:fs';

export function parseCsv(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error('The file needs a header row and at least one answer row.');
  const head = lines[0].toLowerCase().split(',').map((h) => h.trim());
  const idx = ['too_cheap', 'cheap', 'expensive', 'too_expensive'].map((k) => head.indexOf(k));
  if (idx.some((i) => i < 0)) throw new Error('Header must contain: too_cheap,cheap,expensive,too_expensive');
  const rows = [];
  const dropped = [];
  lines.slice(1).forEach((line, n) => {
    const cells = line.split(',').map((c) => Number(c.replace(/[$\s]/g, '')));
    const r = idx.map((i) => cells[i]);
    const ok = r.every(Number.isFinite) && r[0] <= r[1] && r[1] <= r[2] && r[2] <= r[3] && r[0] >= 0;
    if (ok) rows.push({ tc: r[0], c: r[1], e: r[2], te: r[3] });
    else dropped.push(n + 2); // 1-based file line number
  });
  return { rows, dropped };
}

const share = (rows, test) => rows.filter(test).length / rows.length;

export function analyse(rows, step = 0.5) {
  if (!rows.length) throw new Error('No usable rows.');
  const lo = Math.min(...rows.map((r) => r.tc));
  const hi = Math.max(...rows.map((r) => r.te));
  const grid = [];
  for (let p = Math.floor(lo / step) * step; p <= hi + step; p += step) grid.push(Number(p.toFixed(6)));

  const curves = grid.map((p) => ({
    p,
    TC: share(rows, (r) => r.tc >= p),
    NC: share(rows, (r) => r.c < p),
    NE: share(rows, (r) => r.e > p),
    TE: share(rows, (r) => r.te <= p),
  }));

  // First grid point where the rising curve reaches the falling one, linearly interpolated with the point before it.
  function cross(rising, falling) {
    for (let i = 1; i < curves.length; i++) {
      const a = curves[i - 1];
      const b = curves[i];
      const d0 = a[rising] - a[falling];
      const d1 = b[rising] - b[falling];
      if (d0 < 0 && d1 >= 0) {
        const t = d0 === d1 ? 0 : -d0 / (d1 - d0);
        return Number((a.p + t * (b.p - a.p)).toFixed(2));
      }
      if (d0 === 0 && i === 1) return a.p;
    }
    return null;
  }

  return {
    n: rows.length,
    PMC: cross('NC', 'TC'),
    OPP: cross('TE', 'TC'),
    IPP: cross('NC', 'NE'),
    PME: cross('TE', 'NE'),
  };
}

// Run as a script, not when imported by a test.
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith('--'));
  const stepAt = args.indexOf('--step');
  const step = stepAt >= 0 ? Number(args[stepAt + 1]) : 0.5;
  if (!file || !(step > 0)) {
    console.error('Usage: node scripts/van-westendorp.mjs answers.csv [--step 0.5]');
    process.exit(1);
  }
  try {
    const { rows, dropped } = parseCsv(readFileSync(file, 'utf8'));
    if (dropped.length) console.log(`Dropped ${dropped.length} row(s) that were not in order (file lines: ${dropped.join(', ')}).`);
    const r = analyse(rows, step);
    const show = (v) => (v === null ? 'no crossing found' : `$${v}`);
    console.log(`Respondents used: ${r.n}${r.n < 30 ? '  (under 30: treat as a rough guide only)' : ''}`);
    console.log(`PMC  marginal cheapness      ${show(r.PMC)}`);
    console.log(`OPP  optimal price point     ${show(r.OPP)}`);
    console.log(`IPP  indifference price      ${show(r.IPP)}`);
    console.log(`PME  marginal expensiveness  ${show(r.PME)}`);
    if (r.PMC !== null && r.PME !== null) console.log(`Acceptable range: ${show(r.PMC)} to ${show(r.PME)}`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
