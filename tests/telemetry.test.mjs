import assert from 'node:assert/strict';
import { test } from 'node:test';

// pure helpers only (the module imports react-native, so re-declare the maths it exports)
const src = (await import('node:fs')).readFileSync(new URL('../src/lib/telemetry.js', import.meta.url), 'utf8');
const pick = (name) => src.match(new RegExp(`export function ${name}[\\s\\S]*?\\n}`))[0].replace('export ', '');
const DAY = 864e5;
const { weekKey, daysBucket } = new Function('DAY', `${pick('weekKey')}\n${pick('daysBucket')}\nreturn { weekKey, daysBucket };`)(DAY);

test('days since first use buckets', () => {
  const t0 = Date.UTC(2026, 8, 1);
  assert.equal(daysBucket(t0, t0 + 3600e3), '0');
  assert.equal(daysBucket(t0, t0 + 5 * DAY), '1-7');
  assert.equal(daysBucket(t0, t0 + 10 * DAY), '8-14');
  assert.equal(daysBucket(t0, t0 + 20 * DAY), '15-30');
  assert.equal(daysBucket(t0, t0 + 60 * DAY), '30+');
});

test('same week, next week', () => {
  const wed = new Date(2026, 8, 30, 12).getTime(), sun = new Date(2026, 9, 4, 20).getTime(), mon = new Date(2026, 9, 5, 9).getTime();
  assert.equal(weekKey(wed), weekKey(sun));
  assert.notEqual(weekKey(sun), weekKey(mon));
});

test('ids are random hex, never derived from anything', () => {
  assert.match(src, /Math\.random/);
  assert.doesNotMatch(src, /getUniqueId|advertisingId|IDFA|expo-location|getCurrentPositionAsync/);
});
