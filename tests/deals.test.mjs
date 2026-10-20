import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compareElsewhere } from '../src/lib/deals.js';

const row = (price, id = 1) => ({ platform: { id, name: `Platform ${id}` }, price });

test('compares against the cheapest alternative regardless of ordering', () => {
  const elsewhere = [row('390.00'), row('380.00', 2)];
  assert.deepEqual(compareElsewhere({ price: '310.00', elsewhere }), { rows: elsewhere, diff: 70 });
  assert.equal(compareElsewhere({ price: '400.00', elsewhere }).diff, -20);
});

test('preserves kuruş differences and exact ties', () => {
  assert.equal(compareElsewhere({ price: '249.90', elsewhere: [row('250.00')] }).diff, 0.1);
  assert.equal(compareElsewhere({ price: '250.00', elsewhere: [row('249.99')] }).diff, -0.01);
  assert.equal(compareElsewhere({ price: '250.00', elsewhere: [row(250)] }).diff, 0);
});

test('absent or invalid comparisons never produce a saving or tie', () => {
  for (const elsewhere of [undefined, [], {}, [row(null)], [row('bad')], [null]]) {
    assert.deepEqual(compareElsewhere({ price: '250', elsewhere }), { rows: [], diff: null });
  }
  assert.deepEqual(compareElsewhere({ price: null, elsewhere: [row(250)] }), { rows: [], diff: null });
  const valid = row('260', 2);
  assert.deepEqual(compareElsewhere({ price: '250', elsewhere: [row(-10), valid] }), { rows: [valid], diff: 10 });
});
