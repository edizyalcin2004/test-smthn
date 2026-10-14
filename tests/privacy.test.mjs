import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// The privacy notice (src/content/privacy.js) describes what leaves the phone.
// These tests freeze that list: adding an event, a field or a client flag
// fails here until the notice is revisited in the same change.
const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), 'utf8');
const walk = (d) => readdirSync(join(root, d)).flatMap((f) => {
  const p = join(d, f);
  return statSync(join(root, p)).isDirectory() ? walk(p) : p.endsWith('.js') ? [p] : [];
});
const appSrc = ['App.js', ...walk('src')].map((p) => [p, read(p)]);
const privacy = read('src/content/privacy.js');

test('the tracked app events are exactly the ones the notice describes', () => {
  const names = new Set();
  for (const [, s] of appSrc) for (const m of s.matchAll(/event_name:\s*'([a-z_]+)'/g)) names.add(m[1]);
  assert.deepEqual([...names].sort(), ['basket_edit', 'handoff', 'restaurant_view', 'search']);
  for (const phrase of ['Restoran araması', 'restoran görüntüleme', 'sepete ürün ekleme', 'platforma geçiş'])
    assert.ok(privacy.includes(phrase), phrase);
});

test('the client context is exactly the four disclosed fields', () => {
  const t = read('src/lib/telemetry.js');
  const keys = [...t.matchAll(/\b(app_version|os|days_bucket|first_compare_this_week|[a-z_]+_id)\s*:/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(keys)].sort(), ['app_version', 'days_bucket', 'first_compare_this_week', 'os', 'session_id']);
  assert.ok(!/AsyncStorage\.setItem\([^)]*SESSION/.test(t), 'session id must never be persisted');
});

test('order feedback sends only the disclosed fields', () => {
  const o = read('src/lib/orders.js');
  const sent = [...o.matchAll(/postOrderFeedback\(\{([\s\S]*?)\}\)/g)].flatMap((m) =>
    [...m[1].matchAll(/([a-z_]+)\s*:/g)].map((x) => x[1]));
  assert.deepEqual([...new Set(sent)].sort(),
    ['compare_id', 'items', 'mismatch_reason', 'ordered', 'paid', 'platform_id', 'prices_matched', 'restaurant_id']);
});

test('no mock account copy survives', () => {
  for (const [p, s] of appSrc) {
    for (const bad of ['Kathryn', 'Ödeme yöntemleri', 'Adreslerim', 'Sürüm 2.4.0', 'USER_POINTS', "navigate('Pro')"])
      assert.ok(!s.includes(bad), `${p} still contains ${bad}`);
  }
});

test('controller details are never a visible placeholder', () => {
  assert.match(privacy, /export const CONTROLLER = null;/);
  const screen = read('src/screens/PrivacyScreen.js');
  assert.ok(screen.includes('CONTROLLER ?'), 'screen must branch on a missing controller');
  // No visible "[fill me in]" text in any string literal of the notice or screen.
  assert.ok(!/'[^'\n]*\[[^'\n]*'/.test(screen + privacy), 'no [placeholder] text');
});
