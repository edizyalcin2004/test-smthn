import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildPending, summarize, pendingState, itemsLine, PENDING_MAX_AGE_MS } from '../src/lib/savings.js';

const P = (id, total, after = null) => ({ platform: { id, name: `P${id}` }, total: String(total),
  best_code: after != null ? { code: 'X' } : null, total_after_code: after != null ? String(after) : null });
const basket = { 1: { item: { name: 'Big Mac' }, qty: 2 }, 2: { item: { name: 'Patates' }, qty: 1 } };
const now = Date.UTC(2026, 8, 28, 7, 0);

test('saved = most expensive minus what was paid, code-adjusted', () => {
  const comparable = [P(1, 240, 200), P(2, 260), P(3, 300)];
  const p = buildPending({ restaurant: { id: 9, name: "McDonald's" }, basket, chosen: comparable[0], comparable, now });
  assert.equal(p.paid, 200); assert.equal(p.mostExpensive, 300); assert.equal(p.saved, 100);
  assert.equal(p.codeSaved, 40); assert.equal(p.wasCheapest, true);
  assert.deepEqual(p.items, [{ name: 'Big Mac', qty: 2 }, { name: 'Patates', qty: 1 }]);
});

test('single platform saves nothing; ordering a pricier platform is not cheapest', () => {
  const one = [P(1, 250)];
  assert.equal(buildPending({ restaurant: {}, basket, chosen: one[0], comparable: one, now }).saved, 0);
  const two = [P(1, 200), P(2, 260)];
  const p = buildPending({ restaurant: {}, basket, chosen: two[1], comparable: two, now });
  assert.equal(p.saved, 0); assert.equal(p.wasCheapest, false);
});

test('pending is asked after 15s, dropped after 48h', () => {
  assert.equal(pendingState(null, now), 'none');
  assert.equal(pendingState({ at: now - 5000 }, now), 'wait');
  assert.equal(pendingState({ at: now - 60000 }, now), 'ask');
  assert.equal(pendingState({ at: now - PENDING_MAX_AGE_MS - 1 }, now), 'expired');
});

test('summary uses only confirmed orders', () => {
  const o = (at, saved, codeSaved = 0, wasCheapest = true, n = 2) =>
    ({ at, saved, codeSaved, wasCheapest, platformsCompared: n });
  const s = summarize([o(now, 100, 40), o(now - 40 * 864e5, 50, 0, false), o(now, 0, 0, true, 1)], now);
  assert.equal(s.count, 3); assert.equal(s.total, 150); assert.equal(s.thisMonth, 100);
  assert.equal(s.avgPerOrder, 50); assert.equal(s.cheapestRate, 50);
  assert.deepEqual(s.sources, { price: 110, code: 40 });
  assert.equal(s.trend.length, 6); assert.equal(s.trend[5].v, 100); assert.equal(s.trend[4].v, 50);
  assert.equal(summarize([], now).cheapestRate, null);
});

test('items line', () => {
  assert.equal(itemsLine([{ name: 'Big Mac', qty: 2 }, { name: 'Patates', qty: 1 }, { name: 'Kola', qty: 1 }]),
    '2× Big Mac, Patates +1');
});
