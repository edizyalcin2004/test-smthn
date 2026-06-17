# Compare-flow wiring notes (2026-06-10)

## STEP 0 audit — state before this change

**CompareScreen.js** — pure stack navigator (Search → Menu), no data logic.

**SearchScreen.js** — already fetched `GET /search` inline (debounced 400ms).
No dummy data. Problems found:
- No `res.ok` check, no timeout; guessed shape `data.restaurants ?? data`
- Read `r.cuisine` — field doesn't exist (API returns `cuisine_type`)
- Error state had no retry affordance; no empty-results state (silent null)
- Race: a slow stale response could overwrite a newer query's results

**MenuScreen.js** — already fetched `GET /menu` + `POST /compare-basket`
inline. No dummy data. Problems found:
- No `res.ok` check, no timeout; guessed shapes (`data.items ?? data`,
  `data.platforms ?? data`)
- Rendered `item.description` — `/menu` never returns that field
- Rendered `p.delivery_fee` — backend never returns that field
- **Data-correctness bug:** ResultsView rendered every basket item as
  `Number(it.price).toFixed(2)` — a missing item (`price: null,
  found: false`) displayed as **₺0.00**
- Menu error state said "go back and try again" — no retry button

**State management:** all local component state (useState). Basket lives in
MenuScreen as `{ [itemId]: { item, qty } }`. No context/redux. Restaurant is
passed via navigation params. Kept as-is.

**Dummy data:** grep over the compare flow found none. Hub/Deals hardcoded
data untouched per scope.

## Live API shapes (verified by curl, 2026-06-10)

`GET /search?q=mcd` → bare array:
```json
[{ "id": 1, "name": "McDonald's", "cuisine_type": "Fast Food", "logo_url": null }]
```
- Case-insensitive (ilike): "mcd", "MCD" both match.
- **`q=mcdonalds` returns `[]`** — DB name "McDonald's" contains an
  apostrophe; ilike can't bridge punctuation. Frontend workaround (see
  below). Proper fix is backend-side normalized search — deferred, out of
  scope this session.

`GET /menu?restaurant_id=1` → bare array, 170 items (McDonald's):
```json
{ "id": 42, "name": "2'li Spicy McCrispy™ Menü", "category": "Cazip Teklifler",
  "price": "675.00", "image_url": "/Files/Product/Menus/WEB1_1362.jpg" }
```
- Keys exactly: `id, name, category, price, image_url`. No `description`.
- `price` is a **string**. No null prices observed in /menu.
- 19 categories with Turkish names (e.g. "İçecekler", "Atıştırmalıklar").

`POST /compare-basket` body `{restaurant_id, items: [{id, name, qty}]}` →
bare array, **already sorted by total ascending**:
```json
[{ "platform": { "id": 1, "name": "McDonald's Türkiye Direct", "hex_color": "#FFC72C" },
   "items": [{ "name": "Big Mac® Menü", "price": "450.00", "found": true },
             { "name": "Çıtır Soğan (12 Adet)", "price": null, "found": false }],
   "total": "940.00" }]
```
- `total` is a string; accounts for qty server-side (450×2 + 40 = 940 ✓).
- Missing item on a platform → `price: null, found: false`, and its price is
  **excluded from that platform's total** — totals across platforms are not
  like-for-like when availability differs. UI must surface this.

## What changed

- New `src/api/client.js`: single `API_BASE_URL`, 12s AbortController
  timeout, throws on non-2xx, returns parsed JSON.
  `searchRestaurants(q)` / `getMenu(restaurantId)` /
  `compareBasket(restaurantId, items)`.
- `searchRestaurants` punctuation fallback: if the exact query returns `[]`,
  re-query with the first 3 chars and filter client-side by
  punctuation-stripped containment, so "mcdonalds" finds "McDonald's".
- SearchScreen: uses client, `cuisine_type`, stale-response guard, error
  state with **Try again**, explicit "no results" empty state.
- MenuScreen: uses client, dropped phantom `description`/`delivery_fee`
  renders, menu error state has **Try again**, results render `found: false`
  items as "bulunamadı" (never a number) plus a per-platform caveat that
  missing items are excluded from that total.
- Zero visual/design changes beyond the new error/empty/unavailable texts.

---

# Frontend Session 2 — navy/gold rebuild wired live (2026-06-18)

Plan: `FRONTEND_S2_PLAN.md`. Order: 0 infra → Search → Menu → Results → Hub →
Deals. McD + BK only. Live via `src/api/client.js`. No mock imports.

## Step 0 — shared infra ✅
- `expo-clipboard@~8.0.8` installed (CodeSheet copy action).
- `client.js`: added thin `getRestaurants()` wrapper for GET /restaurants
  (additive only — no existing data logic touched).
- `src/lib/brand.js`: `platformBrand` (bg from live `hex_color`, auto-contrast
  fg), `restaurantBrand` (neutral navy tile), `shortLabel`. No fake brand data.
- `src/components/CodeSheet.js`: `CodeSheetProvider` + `useCodeSheet()` →
  app-level bottom-sheet Modal. Maps live /discount-codes fields; humanizes
  discount/usage/expiry; Açıklama built only from real conditions
  (requires_membership, item_scoped, usage_limit); copy via expo-clipboard;
  "Restoranı karşılaştır" resolves restaurant_id via cached /restaurants and
  deep-links to Compare→Menu (hidden if it can't resolve / id is null).
- `App.js`: `navigationRef` + `CodeSheetProvider` inside NavigationContainer
  around the Tab.Navigator.
- **Refinement vs plan:** basket-lift to Compare-level state + Results route
  deferred to Step 2 (Menu rebuild) — same edit surface; keeps the working
  Compare flow intact between commits instead of half-migrating now.
- Verified: iOS bundle builds (HTTP 200, 7.1 MB), app runs in Simulator, no
  red-screen, no visible regression (CodeSheet renders only when opened).
