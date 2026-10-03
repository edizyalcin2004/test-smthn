// Pure helpers for configuring an item on the reference option tree (T-028).
// groups: [{id, name, min, max, parent_option_id, options: [{id, name}]}]

export const childrenOf = (groups, parentId) => groups.filter((g) => (g.parent_option_id ?? null) === parentId);

// Groups the user can currently see: top level, plus children of chosen options.
export function visibleGroups(groups, selected) {
  const out = [];
  const walk = (parent) => {
    for (const g of childrenOf(groups, parent)) {
      out.push(g);
      for (const o of g.options) if (selected.includes(o.id)) walk(o.id);
    }
  };
  walk(null);
  return out;
}

function descendantsOf(groups, optionId) {
  const ids = [];
  for (const g of childrenOf(groups, optionId)) for (const o of g.options) ids.push(o.id, ...descendantsOf(groups, o.id));
  return ids;
}

// Tap an option: single-choice groups swap, multi-choice groups toggle up to max.
// Deselecting an option also drops every choice nested under it.
export function toggle(groups, selected, group, optionId) {
  const inGroup = group.options.map((o) => o.id);
  const drop = (ids, id) => ids.filter((x) => x !== id && !descendantsOf(groups, id).includes(x));
  if (selected.includes(optionId)) return drop(selected, optionId);
  let next = selected;
  if (group.max === 1) {
    for (const id of inGroup) {
      if (next.includes(id)) next = drop(next, id);
    }
  } else if (inGroup.filter((id) => next.includes(id)).length >= group.max) {
    return selected;
  }
  return [...next, optionId];
}

// First problem with the configuration, or null when it is complete.
export function problem(groups, selected) {
  for (const g of visibleGroups(groups, selected)) {
    const n = g.options.filter((o) => selected.includes(o.id)).length;
    if (n < g.min) return g.min === 1 ? `${g.name}: bir seçim yap` : `${g.name}: en az ${g.min} seçim yap`;
    if (n > g.max) return `${g.name}: en fazla ${g.max} seçim`;
  }
  return null;
}

export function summary(groups, selected) {
  return visibleGroups(groups, selected)
    .flatMap((g) => g.options.filter((o) => selected.includes(o.id)).map((o) => o.name))
    .join(', ');
}

// No base-price fallback for a configuration whose options could not be verified.
export function basketProblem(lines) {
  if (lines.some((l) => l.options?.unavailable)) return 'Bazı ürünlerin seçenekleri doğrulanamıyor. Bu ürünleri sepetten çıkarıp tekrar eklemeyi dene.';
  const names = lines.map((l) => l.item.name.toLowerCase());
  if (lines.some((l) => l.options?.platform_id && names.filter((n) => n === l.item.name.toLowerCase()).length > 1))
    return 'Aynı ürünün farklı yapılandırmaları tek sepette henüz desteklenmiyor.';
  return null;
}
