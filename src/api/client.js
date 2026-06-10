// Single shared API client for the Pryce backend. All compare-flow network
// traffic goes through here — no inline fetch() in screens.

export const API_BASE_URL = 'https://pryce-backend-production.up.railway.app';

const DEFAULT_TIMEOUT_MS = 12000;

async function request(path, { method = 'GET', body, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`API ${res.status} ${method} ${path}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Strip apostrophes/spaces/punctuation so "mcdonalds" can match "McDonald's".
const normalizeName = (s) => String(s).toLowerCase().replace(/['’`´\-._\s]/g, '');

// GET /search?q= — bare array of {id, name, cuisine_type, logo_url}.
// Backend matching is plain ilike, which can't bridge punctuation (the DB
// name "McDonald's" never matches the query "mcdonalds"). When the exact
// query comes back empty, retry with a short prefix and filter client-side
// on punctuation-stripped containment. Proper fix is backend-side
// normalized search; this stays until then.
export async function searchRestaurants(q) {
  const query = q.trim();
  if (!query) return [];
  const results = await request(`/search?q=${encodeURIComponent(query)}`);
  if (results.length > 0 || query.length <= 3) return results;
  const fallback = await request(`/search?q=${encodeURIComponent(query.slice(0, 3))}`);
  const target = normalizeName(query);
  return fallback.filter((r) => normalizeName(r.name).includes(target));
}

// GET /menu?restaurant_id= — bare array of
// {id, name, category, price: "string", image_url}. No description field.
export function getMenu(restaurantId) {
  return request(`/menu?restaurant_id=${restaurantId}`);
}

// POST /compare-basket — items: [{id, name, qty}]. Returns a bare array
// already sorted by total ascending:
// {platform: {id, name, hex_color}, items: [{name, price|null, found}], total: "string"}
// A found:false item's price is null AND excluded from that platform's
// total — callers must surface it as unavailable, never as a number.
export function compareBasket(restaurantId, items) {
  return request('/compare-basket', {
    method: 'POST',
    body: { restaurant_id: restaurantId, items },
  });
}
