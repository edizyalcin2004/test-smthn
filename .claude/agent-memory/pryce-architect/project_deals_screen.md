---
name: project-deals-screen
description: DealsScreen architecture: data-fetching, Bang for Buck, platform sections, discount code format
metadata:
  type: project
---

DealsScreen is the reference implementation for the Pryce app's data-fetching and UI patterns.

Data fetching:
- Fetches GET /menu-items (no params) on mount via useCallback-wrapped async function inside useEffect
- Pattern: useState for items/loading/error, setLoading(true) at start, setLoading(false) in finally, setError(Turkish string) in catch
- No React Query, no SWR, no Zustand

Bang for Buck algorithm:
- Filters items where category === "Özel Menüler" AND description is truthy
- Parses description by splitting on " + " (space-plus-space delimiter)
- For each component name: exact name match + same restaurant.id + same platform.name as prices[0]
- savings = individualSum - bundlePrice
- savingsPct = Math.round((savings / individualSum) * 100)
- Skips bundles where savingsPct <= 0
- DealsScreen returns top 4; HubScreen returns top 5
- Algorithm is defined locally in each screen file (duplicated, not shared)

Discount codes:
- Hardcoded DISCOUNT_CODES array (6 items), duplicated in both HubScreen and DealsScreen
- Fields: platform (string), color (hex), restaurant (string), code (string), label (string), detail (string)
- No backend endpoint for discount codes
- HubScreen shows top 3 by parseCodeValue(label) — extracts integer after % or TL amount
- DealsScreen filters codes by selectedRestaurant.name or 'Tüm restoranlar'

Navigation:
- DealsScreen takes no navigation prop (signature: `export default function DealsScreen()`)
- HubScreen takes navigation prop and calls navigation.navigate('Compare') from the CTA card

Platform color map (in DealsScreen, not in tokens):
- Yemeksepeti: #D6001C
- Trendyol Yemek: #FF6000
- Getir Yemek: #5D3EB2
- McDonald's Türkiye Direct: #FFC72C

**Why:** Read from source files 2026-05-26. Accurate as of that date.
**How to apply:** Use as the canonical reference when planning any new data-fetching screen or Bang for Buck extension.
