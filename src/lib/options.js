// Pure selection logic shared by the editor and tests. IDs remain platform-native.
export function descendants(choice) {
  return (choice.child_groups || []).flatMap(g => g.choices.flatMap(c => [c.id, ...descendants(c)]));
}
export function toggleChoice(selected, group, choice) {
  const next = new Set(selected);
  if (next.has(choice.id)) {
    [choice.id, ...descendants(choice)].forEach(id => next.delete(id));
  } else {
    if (!choice.available) return selected;
    if (group.max_select === 1) group.choices.forEach(c => {
      [c.id, ...descendants(c)].forEach(id => next.delete(id));
    });
    else if (group.choices.filter(c => next.has(c.id)).length >= group.max_select) return selected;
    next.add(choice.id);
  }
  return [...next];
}
export function selectionError(groups, selected) {
  const ids = new Set(selected), active = new Set();
  function walk(forest) {
    for (const g of forest) {
      if (g.shown === false) return `${g.name}: şu anda doğrulanamıyor`;
      const chosen = g.choices.filter(c => ids.has(c.id));
      if (chosen.length < g.min_select || (!chosen.length && !g.may_skip_without_input)) return `${g.name}: seçim gerekli`;
      if (chosen.length > g.max_select) return `${g.name}: en fazla ${g.max_select} seçim`;
      for (const c of chosen) {
        active.add(c.id);
        if (!c.available) return `${c.name}: şu anda doğrulanamıyor`;
        const error = walk(c.child_groups || []);
        if (error) return error;
      }
    }
    return null;
  }
  const error = walk(groups);
  return error || (selected.some(id => !active.has(id)) ? 'Seçenekleri yeniden seç' : null);
}
export function comparable(row) {
  return row.available === true && row.total != null && row.items?.length > 0 &&
    row.items.every(it => it.found && it.price != null);
}
export function basketRequest(lines) {
  return lines.map(({ item, qty, sourceConfiguration }) => ({
    id: item.id, name: item.name, qty,
    ...(sourceConfiguration ? { source_configuration: sourceConfiguration } : {}),
  }));
}
