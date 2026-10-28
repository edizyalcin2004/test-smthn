// codeGroups.js — how the Kodlar list is laid out (2026-10-28). Display only:
// no code is added, removed or changed, and nothing here touches comparison.
//
//   code        a real code to copy (Trendyol etc.) — one card each, as before
//   campaign    the same code-less coupon (same platform, terms and limit) at
//               CAMPAIGN_MIN or more restaurants — one card, lists the places
//   restaurant  the remaining code-less coupons of one restaurant — one card,
//               best coupon first, the others behind a tap
export const CAMPAIGN_MIN = 3;

const num = (v) => Number(v ?? 0);
const ts = (c) => { const t = c.expiry_date ? new Date(c.expiry_date).getTime() : NaN; return Number.isNaN(t) ? Infinity : t; };
// bigger saving first; on a tie, the easier minimum first
const better = (a, b) => num(b.discount_value) - num(a.discount_value) || num(a.minimum_order) - num(b.minimum_order);

export function groupCodes(codes) {
  const real = [], loose = [];
  for (const c of codes || []) (c.code ? real : loose).push(c);

  const byTerms = new Map();
  for (const c of loose) {
    const k = [c.platform?.name, c.title, c.usage_limit, num(c.discount_value), num(c.minimum_order), c.discount_type].join('|');
    if (!byTerms.has(k)) byTerms.set(k, []);
    byTerms.get(k).push(c);
  }
  const campaigns = [], rest = [];
  for (const list of byTerms.values()) {
    const places = [...new Set(list.map((c) => c.restaurant_name || 'Tüm restoranlar'))];
    if (places.length >= CAMPAIGN_MIN) campaigns.push({ kind: 'campaign', key: `c:${list[0].id}`, code: list[0], places: places.sort((a, b) => a.localeCompare(b, 'tr')) });
    else rest.push(...list);
  }

  const byPlace = new Map();
  for (const c of rest) {
    const k = `${c.platform?.name}|${c.restaurant_name || ''}`;
    if (!byPlace.has(k)) byPlace.set(k, []);
    byPlace.get(k).push(c);
  }
  const restaurants = [...byPlace.values()].map((list) => {
    const sorted = list.slice().sort(better);
    return { kind: 'restaurant', key: `r:${sorted[0].id}`, best: sorted[0], others: sorted.slice(1) };
  });

  return [
    ...real.sort((a, b) => ts(a) - ts(b)).map((c) => ({ kind: 'code', key: `k:${c.id}`, code: c })),
    ...campaigns.sort((a, b) => b.places.length - a.places.length || better(a.code, b.code)),
    ...restaurants.sort((a, b) => String(a.best.restaurant_name).localeCompare(String(b.best.restaurant_name), 'tr')),
  ];
}
