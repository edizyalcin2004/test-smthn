import assert from 'node:assert/strict';
import { test } from 'node:test';
import { visibleGroups, toggle, problem, summary } from '../src/lib/options.js';

const groups = [
  { id: 1, name: 'Sandviç', min: 1, max: 1, parent_option_id: null, options: [{ id: 10, name: 'Tavuk' }, { id: 11, name: 'XL' }] },
  { id: 2, name: 'Çıkar', min: 0, max: 2, parent_option_id: 10, options: [{ id: 20, name: 'Mayonez' }, { id: 21, name: 'Turşu' }, { id: 22, name: 'Soğan' }] },
  { id: 3, name: 'İçecek', min: 1, max: 1, parent_option_id: null, options: [{ id: 30, name: 'Kola' }, { id: 31, name: 'Ayran' }] },
];

test('nested groups appear only under the chosen option', () => {
  assert.deepEqual(visibleGroups(groups, []).map((g) => g.id), [1, 3]);
  assert.deepEqual(visibleGroups(groups, [10]).map((g) => g.id), [1, 2, 3]);
});

test('single choice swaps and drops nested picks; multi respects max', () => {
  let s = toggle(groups, [], groups[0], 10);
  s = toggle(groups, s, groups[1], 20);
  s = toggle(groups, s, groups[1], 21);
  assert.deepEqual(toggle(groups, s, groups[1], 22), s);          // max 2
  assert.deepEqual(toggle(groups, s, groups[0], 11), [11]);       // swap sandwich: removals under Tavuk go
});

test('problems and summary', () => {
  assert.equal(problem(groups, []), 'Sandviç: bir seçim yap');
  assert.equal(problem(groups, [10]), 'İçecek: bir seçim yap');
  assert.equal(problem(groups, [10, 20, 30]), null);
  assert.equal(summary(groups, [10, 20, 30]), 'Tavuk, Mayonez, Kola');
});

const { basketProblem } = await import('../src/lib/options.js');
test('unverified options and duplicate configurations cannot silently use base prices', () => {
  assert.ok(basketProblem([{ item:{name:'Burger'}, options:{unavailable:true} }]));
  assert.ok(basketProblem([{ item:{name:'Burger'}, options:{platform_id:1} }, { item:{name:'burger'}, options:{platform_id:1} }]));
  assert.equal(basketProblem([{ item:{name:'Burger'}, qty:2, options:{platform_id:1,choices:[1]} }]), null);
});
