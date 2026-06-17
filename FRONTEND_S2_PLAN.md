# FRONTEND SESSION 2 — PLAN (Phase 0 gate)

Wire the navy/gold architecture to **live** data: Search → Menu → Results, plus
rebuilt Hub and Deals, plus a shared CodeSheet. McDonald's + Burger King ONLY.
No mock data, no backend changes, no `client.js` data-logic changes.

This is the plan only. Nothing is implemented until you reply **"go"**.

---

## 0. Ground truth I verified before planning

- **`src/api/client.js` already encodes every never-mislead rule.** I will NOT
  touch its data logic. The contracts that drive this plan:
  - `compareBasket(restaurantId, items)` → **array of platforms, pre-sorted by
    effective total ascending**. Each platform: `{platform:{id,name,hex_color},
    items:[{name, price|null, found}], total, best_code|null, total_after_code|null}`.
  - A `found:false` item has `price:null` and is **excluded from that platform's
    total**. Must be shown as "bulunamadı", never as a number.
  - `best_code` is non-null **only when the backend verified every condition**.
    `total_after_code` is the real price paid. `usage_limit:"once_per_user"`
    still auto-applies but its caveat MUST be shown. `first_order`, free-text
    limits, `requires_membership`, and `item_scoped` are **never auto-applied** —
    badge/caveat only.
  - `getDiscountCodes(restaurantId?)` → codes with `code` (""=codeless),
    `title`, `discount_type:"fixed"|"percentage"`, `discount_value`,
    `minimum_order|null`, `expiry_date`, `item_scoped`, `requires_membership`,
    `usage_limit`, `platform{name,hex_color}`, `restaurant_id`.
- **The honesty bug is already latent.** `MenuScreen.js` `ResultsView` stamps
  `EN UCUZ` on `i===0` unconditionally. Burger King is Yemeksepeti-only, so
  `/compare-basket` returns ONE row → today that lone price would be badged a
  "winner" with a rank number. The rebuild fixes this.
- **UI primitives exist** in `src/components/ui.js` (`Screen, Card, Pill,
  Eyebrow, SectionHead, PrimaryButton, RoundBtn, Header, Brand`) and
  `src/components/icons.js` (`Icon`), `src/components/Food.js`. `Brand` is
  prop-driven (`{bg, fg, short}`) — no fake brand data baked in. All colors via
  `T`/`font`/`money` from `theme/tokens.js`. I will never hardcode hex.
- **Current Compare flow** is a stack navigator (`CompareScreen.js`:
  Search → Menu) with Results rendered *inline inside* MenuScreen and basket in
  MenuScreen-local state. This session lifts basket to Compare-level state and
  promotes Results to its own screen.

---

## (a) Results rendering spec — BOTH cases

`/compare-basket` returns the ranked array `rows`. Before rendering I split the
rows into **comparable** vs **incomplete**:

- A row is **comparable** only if every basket item was `found` on that platform
  (`row.items.every(it => it.found)`). A row missing any item is **incomplete** —
  its total is apples-to-oranges and it can NEVER be the "winner" or anchor a
  savings claim.
- `comparable = rows.filter(allFound)`, `incomplete = rows.filter(!allFound)`.
- The win/savings logic keys off **`comparable.length`**, not `rows.length`.

### Case A — Multi-platform (≥2 comparable rows) — e.g. McDonald's
- Render comparable rows cheapest-first (already sorted by backend; I re-sort
  defensively after filtering).
- **Winner = comparable[0].** Show:
  - rank pill `1`, `Brand` tile (from `platform.hex_color`), platform name.
  - green `EN UCUZ` `Pill`, green-bordered/elevated card (design winner style,
    `T.green`).
  - price = `total_after_code ?? total`. If a code applied, strikethrough `total`
    above it (reuse the shipped strikethrough pattern).
- **Savings line (the gated claim):** shown ONLY on the winner, ONLY when
  `comparable.length >= 2`. Value = `max(comparableTotals) − winnerEffectiveTotal`
  using each row's **effective** total (`total_after_code ?? total`). Label:
  **"En pahalı platforma göre ₺X tasarruf"** (honest "vs the most expensive"
  framing — not an invented or per-code number). If the delta is 0 (all equal),
  suppress the savings line entirely.
- Non-winner comparable rows: rank pill `2..n`, neutral card, effective price,
  code line if `best_code` present, no badge, no savings line.
- Per-row code line: if `best_code` → bolt + `best_code.code` (or
  `"Kampanya: "+title` when codeless) + "uygulandı" + `−₺(total−total_after_code)`,
  tappable → opens **CodeSheet** for that code. `usage_limit` caveat rendered
  beneath (`once_per_user` → "kullanıcı başına 1 kez", etc.). No `best_code` →
  "Kod yok" muted.
- Incomplete rows (see (b)) render in a separate, clearly-labeled block BELOW
  the ranked list — never interleaved, never ranked, never badged.

### Case B — Single-platform (exactly 1 comparable row) — e.g. Burger King
This is the gated design. Render **one neutral price card**:
- `Brand` tile + platform name + effective price (`total_after_code ?? total`,
  with strikethrough `total` only if a code applied).
- Code line / `usage_limit` caveat exactly as in Case A (codes are honest even
  for a single platform).
- **SUPPRESSED:** no rank number, no `EN UCUZ` badge, no winner card styling, no
  savings line, no "cheapest" language.
- A neutral one-liner above the card sets expectation:
  **"Bu restoran tek platformda satılıyor — karşılaştırılacak başka fiyat yok."**
- `comparable.length === 0` (every platform missing items, or no rows): no price
  card; show the incomplete block (b) + a neutral "Fiyat bulunamadı" empty state.

I will implement Case A/B as a single branch on `comparable.length`
(`0 | 1 | ≥2`) so there is exactly one code path and no way to "fall through"
into a fabricated badge.

## (b) Missing-per-platform-price handling ("bulunamadı")

- Within ANY rendered platform card, each basket line lists per the shipped
  rule: `found && price!=null` → "Name: ₺X", else **"Name: bu platformda
  bulunamadı"**. Missing items never contribute a number.
- A platform with ≥1 missing item is **incomplete** (see (a)): excluded from
  ranking/winner/savings, shown in a separate block titled e.g.
  **"Bazı ürünler bulunamadı"** with a caveat
  **"{n} ürün bulunamadı — toplam karşılaştırmaya dahil edilmedi"** and NO
  effective-price headline (so its truncated total can't read as "cheapest").
- This preserves and strengthens the shipped `ResultsView` behavior (which
  showed "bulunamadı" but still ranked incomplete platforms — the rebuild stops
  ranking them).

## (c) How codes surface — Results + CodeSheet

**Auto-applied (reflected in the price):** ONLY `best_code` from
`/compare-basket` (backend already verified all conditions; includes
`once_per_user` with caveat). Shown as the per-row "uygulandı" line + struck
original price. The app never computes a discount itself.

**Badge / informational only (NOT applied to any total):** everything from
`/discount-codes` — and within Results, any `best_code` carrying a
display-only condition shows its caveat. Conditions surfaced, never silently
applied: `requires_membership` (e.g. "YS Pro üyeliği gerekir"), `item_scoped`
("yalnızca belirli ürünlerde"), `usage_limit` (`first_order` →
"ilk siparişe özel"; `once_per_user` → "kullanıcı başına 1 kez"; free text shown
verbatim).

**CodeSheet** (shared bottom-sheet overlay, opened from Results row, Hub code
row, Deals card). Maps live `/discount-codes` fields → design rows:
- header: `Brand` (platform `hex_color`) + `code` (mono) or `title` if codeless,
  + platform name, + discount pill: `fixed` → `money(discount_value)` indirim;
  `percentage` → `%{discount_value} indirim`.
- rows: **Min. sipariş** = `minimum_order!=null ? money : "Yok"`; **Bitiş**
  = formatted `expiry_date`; **Kullanım** = `usage_limit` humanized or "Sınırsız".
- **Açıklama**: assembled from the real conditions present
  (`requires_membership`, `item_scoped`, `usage_limit`) — no fabricated terms;
  if none, a neutral honest line.
- actions: **Kodu kopyala** via `expo-clipboard` → "Kopyalandı" (hidden when
  `code===""`). **Restoranı karşılaştır** ONLY if `restaurant_id` resolves to
  McDonald's or BK (jumps to that restaurant's Menu); otherwise hidden. Close.

Brand tiles get color from the live `platform.hex_color`; a tiny
`platformBrand(platform)` helper derives a short label (YS / TY / GY / McD) and
passes `bg=hex_color`. This carries real platform identity only — no fake
restaurant/brand data, no `data.jsx` import.

## (d) Screen-by-screen translation order

Order is dependency-driven (CodeSheet is a dependency of Results/Hub/Deals, so it
lands as shared infra before its consumers — this is the one deviation from the
GOAL's listed order, and it's why):

0. **Shared infra** — `platformBrand` helper; lift `{restaurant, basket, setQty,
   results}` to Compare-level state (small `CompareContext` in `CompareScreen.js`,
   add a `Results` route to the stack); **CodeSheet** as an app-level overlay
   (a `CodeSheetProvider` + single `Modal` mounted at App root exposing
   `openCode(code)`), so Hub, Deals, and Results all share one sheet.
1. **Search** — fetch `/restaurants` (via existing client), **filter to
   McDonald's + Burger King only** (Komagene excluded per scope), render
   design's "Yakındaki restoranlar" list; client-side filter on type. Cuisines
   grid **deferred/omitted** (its data is mock and would imply restaurants we
   don't carry). Tap → set restaurant + reset basket → Menu.
2. **Menu** — design layout (`Food` tiles, steppers, running-total compare bar)
   over live `/menu`. Basket reads/writes Compare-level state. Compare bar runs
   `compareBasket`, then navigates to Results with the ranked payload (keeps the
   spinner on the button, avoids a double fetch).
3. **Results** — the (a)/(b)/(c) spec above. The honesty-critical screen.
4. **Hub** — design layout; navy compare hero → Compare tab/Search; **Günün
   Kodları stays LIVE**: `getDiscountCodes()` (no restaurant filter), sort by
   `expiry_date` ascending, take **top 5 soonest-expiring** (NOT by
   discount_value). Code row → `openCode` (CodeSheet).
5. **Deals** — design "Aktif kodlar" feed: `getDiscountCodes()`, sorted
   soonest-expiry, each card → `openCode`. NOTE: this rebuild **replaces** the
   old Bang-for-Buck/Özel-Menüler Deals screen; bundle/Bang-for-Buck is not in
   the new design and is dropped here (flagging for your awareness — say so if
   you want it preserved elsewhere).

After each screen: confirm it renders in the iOS Simulator (`npx expo start`,
press `i`), append progress to `NOTES.md`, commit, move on.

---

## Scope guards I will hold
McD + BK only · no other restaurant/platform stubbed · no backend / `client.js`
data-logic / scraper changes · no `data.jsx` or any mock import · Budget/Account
left presentation-only · no promo/bundle/conditional pricing · Simulator
confirmation only (physical-iPhone acceptance is yours).

## Open decisions for your call (defaults chosen, change if you disagree)
1. **Savings framing** — default: "En pahalı platforma göre ₺X tasarruf"
   (vs most expensive comparable). Alternative: vs 2nd-cheapest. I recommend
   the "vs most expensive" max-delta because it's the honest ceiling.
2. **Incomplete platforms** — default: shown in a separate non-ranked block.
   Alternative: hidden entirely. I recommend showing them (transparency).
3. **Cuisines grid on Search** — default: omitted (mock data). Alternative:
   decorative non-navigating tiles.
4. **Deals Bang-for-Buck** — default: dropped (not in new design). Confirm.

Reply **"go"** to start at step 0.
