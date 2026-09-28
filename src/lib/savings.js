// Pure savings math for the order handoff (D-030). No storage, no clock of
// its own — every function takes what it needs, so it is unit-testable.
//
// "Saved" = the most expensive complete platform total minus what the user
// actually paid on the platform they ordered from (code-adjusted when a
// verified code applied). Only counts when at least two platforms had a
// complete basket: with one platform there is nothing to have saved against.

const num = (v) => Number(v ?? 0);
export const effective = (p) =>
  num(p.total_after_code != null && p.best_code != null ? p.total_after_code : p.total);

export function buildPending({ restaurant, basket, chosen, comparable, now }) {
  const totals = comparable.map(effective);
  const paid = effective(chosen);
  const mostExpensive = totals.length ? Math.max(...totals) : paid;
  const counted = comparable.length >= 2;
  return {
    id: `${now}-${chosen.platform.id}`,
    at: now,
    restaurant: { id: restaurant?.id ?? null, name: restaurant?.name ?? '' },
    platform: { id: chosen.platform.id, name: chosen.platform.name, hex_color: chosen.platform.hex_color ?? null },
    items: Object.values(basket).map(({ item, qty }) => ({ name: item.name, qty })),
    paid,
    listTotal: num(chosen.total),
    codeSaved: Math.max(0, num(chosen.total) - paid),
    mostExpensive,
    platformsCompared: comparable.length,
    wasCheapest: totals.length > 0 && paid <= Math.min(...totals),
    saved: counted ? Math.max(0, mostExpensive - paid) : 0,
  };
}

export function itemsLine(items, max = 2) {
  const parts = items.map((i) => (i.qty > 1 ? `${i.qty}× ${i.name}` : i.name));
  return parts.length > max ? `${parts.slice(0, max).join(', ')} +${parts.length - max}` : parts.join(', ');
}

// A pending handoff is asked about once the user comes back, for up to 48h.
export const PENDING_MAX_AGE_MS = 48 * 3600 * 1000;
export const PENDING_MIN_AGE_MS = 15 * 1000;
export function pendingState(pending, now) {
  if (!pending) return 'none';
  const age = now - pending.at;
  if (age > PENDING_MAX_AGE_MS) return 'expired';
  return age >= PENDING_MIN_AGE_MS ? 'ask' : 'wait';
}

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const MONTHS_LONG = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

// orders: confirmed orders ({...pending, confirmedAt, accurate}). now: ms.
export function summarize(orders, now) {
  const d = new Date(now);
  const ym = (t) => { const x = new Date(t); return x.getFullYear() * 12 + x.getMonth(); };
  const cur = d.getFullYear() * 12 + d.getMonth();
  const total = orders.reduce((a, o) => a + o.saved, 0);
  const thisMonth = orders.filter((o) => ym(o.at) === cur).reduce((a, o) => a + o.saved, 0);
  const compared = orders.filter((o) => o.platformsCompared >= 2);
  const trend = [];
  for (let k = 5; k >= 0; k -= 1) {
    const m = cur - k;
    trend.push({ m: MONTHS[((m % 12) + 12) % 12], v: orders.filter((o) => ym(o.at) === m).reduce((a, o) => a + o.saved, 0) });
  }
  const codeSaved = orders.reduce((a, o) => a + Math.min(o.codeSaved, o.saved), 0);
  return {
    month: MONTHS_LONG[d.getMonth()],
    count: orders.length,
    total,
    thisMonth,
    avgPerOrder: orders.length ? Math.round(total / orders.length) : 0,
    cheapestRate: compared.length ? Math.round((100 * compared.filter((o) => o.wasCheapest).length) / compared.length) : null,
    trend,
    sources: { price: total - codeSaved, code: codeSaved },
    recent: orders.slice().sort((a, b) => b.at - a.at).slice(0, 6),
  };
}
