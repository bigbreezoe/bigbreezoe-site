import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv, analyse } from '../scripts/van-westendorp.mjs';

// Synthetic respondents only: thresholds spread evenly around known anchors. These test the maths, not any real price.
function synthetic() {
  let seed = 1;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let csv = 'too_cheap,cheap,expensive,too_expensive\n';
  for (let i = 0; i < 200; i++) {
    const b = 10 + rnd() * 20;
    csv += [b * 0.4, b * 0.7, b * 1.2, b * 1.7].map((x) => x.toFixed(2)).join(',') + '\n';
  }
  return csv;
}

test('the four price points come out in the expected order', () => {
  const { rows, dropped } = parseCsv(synthetic());
  assert.equal(dropped.length, 0);
  const r = analyse(rows);
  assert.equal(r.n, 200);
  assert.ok(r.PMC < r.OPP && r.OPP < r.IPP && r.IPP < r.PME, JSON.stringify(r));
});

test('rows whose answers are out of order are dropped and reported by file line', () => {
  const { rows, dropped } = parseCsv('too_cheap,cheap,expensive,too_expensive\n5,10,20,40\n30,10,20,40\n$6,$12,$24,$50\n');
  assert.equal(rows.length, 2);
  assert.deepEqual(dropped, [3]);
});

test('a missing column is an error, not a silent zero', () => {
  assert.throws(() => parseCsv('too_cheap,cheap,expensive\n1,2,3\n'), /Header must contain/);
});
