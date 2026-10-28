import assert from 'node:assert/strict';
import { test } from 'node:test';
import { groupCodes } from '../src/lib/codeGroups.js';

const mig = { id: 5, name: 'Migros Yemek' }, tgo = { id: 2, name: 'Trendyol Yemek' };
let id = 0;
const C = (rest, value, min, extra = {}) => ({ id: ++id, platform: mig, code: '', restaurant_name: rest,
  title: `${value} TL İndirim (${min} TL ve üzeri)`, discount_type: 'fixed', discount_value: String(value),
  minimum_order: String(min), usage_limit: 'Koşullar platformda', ...extra });

test('same coupon at 3+ restaurants becomes one campaign; nothing is lost', () => {
  const codes = [C('A', 300, 850), C('B', 300, 850), C('C', 300, 850), C('A', 150, 425), C('A', 250, 625),
                 { id: 99, platform: tgo, code: 'DABA', title: 'x', discount_value: '200', expiry_date: '2030-01-01' }];
  const g = groupCodes(codes);
  assert.deepEqual(g.map((x) => x.kind), ['code', 'campaign', 'restaurant']);
  assert.deepEqual(g[1].places, ['A', 'B', 'C']);
  assert.equal(g[2].best.discount_value, '250');            // best first
  assert.equal(g[2].others.length, 1);
  const shown = 1 + 3 + 1 + g[2].others.length;               // every input still reachable
  assert.equal(shown, codes.length);
});

test('a coupon at only two restaurants stays with each restaurant', () => {
  const g = groupCodes([C('A', 300, 850), C('B', 300, 850)]);
  assert.deepEqual(g.map((x) => x.kind), ['restaurant', 'restaurant']);
});

test('different limits are never merged (first-order vs open)', () => {
  const g = groupCodes([C('A', 300, 450), C('B', 300, 450), C('C', 300, 450, { usage_limit: 'first_order' })]);
  assert.ok(g.every((x) => x.kind === 'restaurant'));
});
