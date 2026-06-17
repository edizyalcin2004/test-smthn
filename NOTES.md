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

## Step 1 — Search rebuild ✅
- `compare/SearchScreen.js` rebuilt in navy/gold. Fetches `getRestaurants()`,
  filters to McDonald's + Burger King (`inScope`), renders "Yakındaki
  restoranlar" Card list with `restaurantBrand` tiles + cuisine_type.
- Search box filters the list client-side (name/cuisine). Loading / error
  (+Tekrar dene) / "Sonuç bulunamadı" states.
- No fabricated ratings (backend returns none) → chevron instead of stars.
- Cuisines grid omitted (its data is mock; out of scope).
- Still `navigation.navigate('Menu', { restaurant })` — compatible with current
  stack + CodeSheet deep-link. Basket-lift comes in Step 2.
- Verified in Simulator: shows McD + BK only (Komagene correctly excluded),
  live data. Screenshot confirmed. (Temp `initialRouteName="Compare"` used to
  view the tab, then reverted.)

## Step 2 — Menu rebuild + Compare-level state + Results route ✅
- `CompareScreen.js`: added `CompareContext` / `useCompare()` holding
  `{restaurant, setRestaurant, basket, setQty, clearBasket, results, setResults}`.
  `setRestaurant` resets basket + results when the restaurant id changes.
  Added `Results` route to the stack.
- `compare/MenuScreen.js`: navy/gold rebuild over live `/menu`. Category tabs
  (Tümü + live categories), `Food` thumbnails via `lib/foodIcon.js` (cosmetic
  only — never touches price/availability), steppers writing to Compare-level
  basket, running-total navy compare bar → `compareBasket` → navigate Results.
  Loading/error(+retry)/empty states. Menu reconciles route-param restaurant
  into context (covers Search picks AND CodeSheet deep-links).
- `compare/ResultsScreen.js`: **interim minimal HONEST renderer** — neutral
  platform cards, effective price (`total_after_code ?? total`), per-item
  "bulunamadı", code line. NO winner badge / NO savings yet (full single-vs-
  multi spec is Step 3). Reads context results/restaurant/basket.
- `lib/foodIcon.js`: name/category → decorative Food glyph, neutral fallback.
- Verified in Simulator with REAL data (temp seed + initialRoute, reverted):
  Menu shows live McDonald's menu/tabs/icons/prices; Results shows 3 platforms
  (McD/Trendyol/Yemeksepeti) with correct per-item bulunamadı and auto-contrast
  brand tiles. Real-data note: "Efsane İkili" item isn't found on ANY platform —
  good incomplete-row case for Step 3 to handle (comparable rows only).

## Step 3 — Results honesty spec ✅ (the gated screen)
- `compare/ResultsScreen.js` fully rebuilt. Splits rows into **comparable**
  (every item found → like-for-like totals) vs **incomplete** (≥1 missing).
  Winner/savings key off `comparable.length`, never raw row count:
  - **≥2 comparable** → ranked cheapest-first; rank 1 = green EN UCUZ winner
    card; savings = `max(comparable effective) − winner effective`, label
    "En pahalı platforma göre ₺X tasarruf" (suppressed if 0).
  - **1 comparable** → one neutral card; NO rank/badge/savings; blue note
    "Bu restoran tek platformda satılıyor…".
  - **0 comparable** → no winner; only the incomplete block + empty note.
- **Incomplete platforms** render in a separate "BAZI ÜRÜNLER BULUNAMADI" block,
  never ranked/badged, NO headline price, with "{n} ürün bulunamadı — toplam
  karşılaştırmaya dahil edilmedi" caveat. (A truncated total can't read as
  cheapest.)
- Per-row code: only `best_code` (auto-applied by backend) → bolt + code/title
  "uygulandı" + −₺delta, struck original price, `usage_limit` caveat. Tapping
  opens the shared CodeSheet enriched with `platform` + `restaurant_id`. No
  code → "Kod yok". No fabricated delivery/ETA (backend returns none).
- Verified BOTH cases in Simulator with REAL backend data (temp seed, reverted):
  - **Multi (McD, items 20-21):** winner McD ₺880 green EN UCUZ, savings ₺20 vs
    Trendyol ₺900; Yemeksepeti correctly DEMOTED to incomplete block (missing
    1 item, its partial ₺500 not ranked). ✓
  - **Single (BK, items 0-1):** Yemeksepeti-only → lone neutral ₺660 card, note
    shown, no rank/badge/savings. ✓ Honesty crux resolved.
- Probed backend to source cases: `/compare-basket` McD start 0=3 comparable,
  20=2 comparable+1 incomplete; BK=1 platform always (Yemeksepeti-only).
- **Compare flow (Search→Menu→Results) now fully rebuilt + wired.** Next: Hub.
