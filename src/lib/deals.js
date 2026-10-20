// Compare with the cheapest backend-matched alternative, at kuruş precision.
// Missing/invalid prices must never turn into a free or equal-price offer.
const cents = (value) => {
  if (value == null || value === '' || typeof value === 'boolean') return null;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? Math.round(price * 100) : null;
};

export function compareElsewhere(bundle) {
  const here = cents(bundle.price);
  const rows = Array.isArray(bundle.elsewhere)
    ? bundle.elsewhere.filter((row) => row?.platform?.id != null
      && row.platform.name && cents(row.price) != null)
    : [];
  if (here == null || !rows.length) return { rows: [], diff: null };
  const best = Math.min(...rows.map((row) => cents(row.price)));
  return { rows, diff: (best - here) / 100 };
}
