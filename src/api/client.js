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

// GET /restaurants — all restaurants with nested menu + prices. Callers here
// only read the top-level identity fields {id, name, cuisine_type, logo_url,
// slug}; the nested menu is ignored. Thin wrapper — no data logic.
export function getRestaurants() {
  return request('/restaurants');
}

// GET /menu?restaurant_id= — bare array of
// {id, name, category, price: "string", image_url}. No description field.
export function getMenu(restaurantId) {
  return request(`/menu?restaurant_id=${restaurantId}`);
}

// POST /compare-basket — items: [{id, name, qty}]. Returns a bare array
// sorted by effective price ascending (code-adjusted total when a code
// applies, raw total otherwise):
// {platform: {id, name, hex_color}, items: [{name, price|null, found}],
//  total: "string",
//  best_code: {code, title, discount_type, discount_value, minimum_order,
//              usage_limit} | null,
//  total_after_code: "string" | null}
// best_code.usage_limit is non-null only for "once_per_user" (the code still
// applies — any user qualifies once — but the caveat MUST be shown).
// "first_order" and free-text limits are never auto-applied backend-side.
// A found:false item's price is null AND excluded from that platform's
// total — callers must surface it as unavailable, never as a number.
// best_code is null unless EVERY condition is verifiably met backend-side;
// callers must never invent or estimate a discount themselves.
export function compareBasket(restaurantId, items) {
  return request('/compare-basket', {
    method: 'POST',
    body: { restaurant_id: restaurantId, items },
  });
}

// GET /menu-items — all items with nested restaurant + per-platform prices:
// {id, name, category, description, restaurant: {id, name},
//  prices: [{platform: {name, hex_color}, price: "string", old_price}]}
export function getMenuItems() {
  return request('/menu-items');
}

// GET /discount-codes?restaurant_id= — latest terms per code, expired
// hidden by backend. Platform-wide codes (restaurant_id null) are included
// under a restaurant filter:
// {id, platform: {id, name, hex_color}, restaurant_id, code: "" for
//  codeless campaigns, title, discount_type: "fixed"|"percentage",
//  discount_value: "string", minimum_order: "string"|null,
//  expiry_date, item_scoped, requires_membership: "YS Pro"|null,
//  usage_limit: "once_per_user"|"first_order"|free text|null, scraped_at}
// item_scoped:true means the discount only applies to specific products —
// show it, but never present it as guaranteed for an arbitrary basket.
// requires_membership and usage_limit are display-only conditions: always
// surface them so the user knows whether they qualify.
export function getDiscountCodes(restaurantId) {
  const query = restaurantId != null ? `?restaurant_id=${restaurantId}` : '';
  return request(`/discount-codes${query}`);
}

// GET /special-deals — platform-EXCLUSIVE special-menu bundles, grouped by
// restaurant+platform. Bare array of:
// {restaurant_id, restaurant_name, platform: {id, name, hex_color},
//  items: [{id, name, category, price: "string", scraped_at}]}
// Each bundle lives on ONE platform at ONE price — never compared, no cheapest
// claim. The platform identity (badge colour + label) comes from the nested
// platform object; never parse it from the item name. Render only what's
// returned — no fabricated photos/ratings/savings.
export function getSpecialDeals() {
  return request('/special-deals');
}
