# PRYCE — AI Tech Lead Handoff

Food delivery price comparison super-app for Turkey. One basket, every platform, cheapest checkout. The Skyscanner of food delivery.

**Founder:** Ediz Yalçın, Istanbul, non-technical. I paste and run. No fluff.
**AI role:** Write all code, make architecture decisions, push back when wrong.

---

## CURRENT STATUS

**Active task:** Deals tab functional with dummy data. Next: Hub tab.

---

## STACK — LOCKED

```
Frontend        React Native / Expo (NOT PWA)
Backend         Python / FastAPI
Database        PostgreSQL
Backend host    Railway → https://pryce-backend-production.up.railway.app
Scraping        Playwright (already in use) + browser-use (next)
AI layer        Claude API
Version control GitHub
IDE             Cursor Pro
Terminal        Claude Code + claude-mem
Testing         Expo Go on iPhone (scan QR)
Distribution    TestFlight → App Store
Python          Always use python3 (not python) to run scripts
```

---

## FILE LOCATIONS

```
~/dev/pryce-backend/   Backend (FastAPI)
~/dev/pryce-app/       Frontend (Expo)
```

---

## BACKEND — KEY FILES

```
main.py               All routes, Pydantic schemas, create_all on startup
database.py           engine/session/Base/get_db/check_db_connection
models.py             All ORM models
seed_dummy_data.py    Populates DB with McDonald's, Komagene, Burger King dummy data
run_scraper.py        CLI to invoke Komagene scraper (proof of concept)
scrapers/
  base.py             httpx client, random UA, retry logic
  komagene.py         Playwright + 3-strategy extractor (WORKING, POC only)
  mcdonalds.py        Playwright + tRPC API interception (WRITTEN, NOT WORKING)
  trendyol.py         Playwright + HTML extraction targeting Komagene (WRITTEN)
  yemeksepeti.py      Playwright + API interception + fallbacks (WRITTEN)
```

---

## BACKEND — ENDPOINTS

| Method | Path | Description |
|---|---|---|
| GET | `/health` | DB connectivity check |
| GET | `/restaurants` | All restaurants with full menu + prices |
| GET | `/menu-items` | All menu items sorted by lowest price |
| GET | `/menu?restaurant_id=` | Menu for one restaurant |
| GET | `/search?q=` | Restaurant search (ilike) |
| POST | `/compare-basket` | Item names → total cost per platform ranked |
| POST | `/reset-db` | Drop + recreate all tables |

---

## BACKEND — CONVENTIONS

- Always set `response.headers["Content-Type"] = "application/json; charset=utf-8"` (Turkish chars)
- Import `Base`, `engine`, `SessionLocal`, `get_db` from `database.py`
- Import models from `models.py`
- Use `selectinload` for eager-loading to avoid N+1

---

## DATABASE SCHEMA

```
platforms         id, name, hex_color, logo_url
restaurants       id, name, slug, is_chain, logo_url, cuisine_type,
                  city, address, latitude, longitude
menu_items        id, restaurant_id, name, category, description, image_url
platform_prices   id, menu_item_id, platform_id, price, old_price, scraped_at
discount_codes    id, platform_id, restaurant_id, code, discount_type,
                  discount_value, minimum_order, expiry_date, scraped_at
```

Note: `special_deals`, `users`, `receipts` tables are in the product vision
but NOT yet in models.py.

---

## DUMMY DATA (seed_dummy_data.py)

Current seed state (reset + reseed to restore):
- 4 platforms: McDonald's Türkiye Direct, Trendyol Yemek, Yemeksepeti, Getir Yemek
- 3 restaurants: McDonald's, Komagene, Burger King
- 41 menu items (regular + Özel Menüler category)
- 127 platform prices (prices vary per platform, Direct only for McDonald's)
- 6 discount codes
- Özel Menüler items have description field with bundle contents e.g. "Big Mac + Büyük Boy Patates + Büyük Kola"
- Some items have old_price set to simulate discounts

To reseed: `curl -X POST https://pryce-backend-production.up.railway.app/reset-db && python3 seed_dummy_data.py`

---

## SCRAPER STATUS

| komagene.py    | komagene.com.tr direct              | ✅ Working (POC)    |
| trendyol.py    | tgoyemek.com (Komagene listing)     | ✅ Working (POC)    |
| yemeksepeti.py | yemeksepeti.com (Komagene listing)  | ✅ Working (POC)    |
| mcdonalds.py   | siparis.mcdonalds.com.tr            | ❌ Not working      |

**MVP restaurant target: McDonald's Turkey**
Komagene was proof of concept. McDonald's is the real MVP target because it
has a dedicated order site (siparis.mcdonalds.com.tr) and compares across
its own app, Trendyol Yemek, and Yemeksepeti.

**Blocker:** McDonald's site resisted Playwright-only scraping.
**Solution pending:** browser-use repo for browser-agent approach (not yet installed).

---

## FRONTEND — KEY FILES

```
~/dev/pryce-app/
  App.js                      Entry point
  src/
    navigation/TabBar.js      Custom animated tab bar (DONE)
    theme/tokens.js           Design tokens
    screens/
      HubScreen.js            Tab 1 — stub
      CompareScreen.js        Tab 2 — DONE (stack navigator wrapper)
      BudgetScreen.js         Tab 3 — stub
      DealsScreen.js          Tab 4 — DONE
      AccountScreen.js        Tab 5 — stub
    screens/compare/
      SearchScreen.js         Compare sub-screen — DONE
      MenuScreen.js           Compare sub-screen — DONE
```

TabBar is fully built with animations, active pill, Ionicons.

---

## SCREEN STATUS

```
Compare   DONE — Search → Menu → Basket → Results, all wired to backend
Deals     DONE — Search-driven, platform sections (Özel Menüler), Bang for Buck
                 default screen, discount codes with copy button
Hub       stub
Budget    stub
Account   stub
```

---

## DEALS TAB — ARCHITECTURE

- Fetches /menu-items once on mount, all filtering is client-side
- Default state: Popular chips (McDonald's / Komagene / Burger King) + En İyi Fırsatlar (Bang for Buck)
- Bang for Buck: finds Özel Menüler items, compares bundle price vs sum of individual components, ranks by savings %
- Selected state: platform sections in order (Yemeksepeti → Trendyol → Getir → Direct), each with full-width two-column card (price left, bundle contents right) + discount codes below
- Discount codes: hardcoded 6 entries, filtered by selected restaurant, copy to clipboard with "Kopyalandı!" toast

---

## DESIGN SYSTEM

```
Primary         #00464f  deep teal
Surface         #f9f9f9  off-white
Yemeksepeti     #D6001C  red
Trendyol        #FF6000  orange
Getir           #5D3EB2  purple
Tikla Gelsin    #00B894  green
McDonald's      #FFC72C  yellow
Headlines       Manrope extrabold tight tracking
Body            Inter medium
Icons           Ionicons (frontend) / Material Symbols Outlined (design spec)
Cards           rounded-xl shadow rgba(0,70,79,0.06)
Buttons         rounded-full active:scale-95
Bottom nav      rounded-t-[3rem] backdrop-blur, active: teal pill scale-110
```

Design reference: Google Stitch HTML screens (8 screens, stitch_compare_search.zip in pryce-app root).

---

## BUILD SEQUENCE

```
✅ DONE
  FastAPI + PostgreSQL on Railway
  All endpoints working
  Komagene scraper (proof of concept)
  5-tab navigation shell
  Dummy data seed (McDonald's, Komagene, Burger King across 4 platforms)
  Compare tab — full flow (Search → Menu → Basket → Results)
  Deals tab — search-driven, platform deals, Bang for Buck, discount codes

🔄 ACTIVE
  Hub tab

⏭ NEXT
  Budget tab
  Account tab (static)
  McDonald's scraper via browser-use
  Replace dummy data with real scraped data

⏳ LATER
  Discount code scraping + auto-apply
  Deep links + clipboard copy
  UI matches Stitch designs
  TestFlight beta
  Receipt Hack (Phase 2)
```

---

## PLATFORM STRATEGY

```
MVP Phase 1   McDonald's across 3 platforms
              (Direct site, Trendyol Yemek, Yemeksepeti)
Phase 2       Expand to more restaurants, add Getir
Phase 3       Official API partnerships at scale
```

---

## PRODUCT VISION (for context, not immediate build)

```
5 tabs:
  Hub      Discovery. Bang for Buck widget. Best discount codes.
  Compare  Search → menu → basket → Find Best Price → ranked
           platforms with codes applied → deep link + code copied
  Budget   Input ₺ → filters → results
  Deals    Platform-exclusive deals feed
  Account  Profile, Pryce Points, saved baskets

Unique features:
  Discount codes   Auto-detected, auto-applied
  Gel-Al           Pickup = cheaper + less CO2
  Too-Good-To-Go   Surplus meals, discounted
  Receipt Hack     Upload receipt → Pryce Points (Phase 2)
```

---

## REVENUE MODEL

```
1  Affiliate fees      1-2% per routed order
2  Promoted placement  Platforms bid for top widget
3  Pryce Pro           ₺49/month power users
4  B2B data            Pricing intelligence sold to chains, funds, FMCG
```

---

## MARKET CONTEXT

```
Turkey 2024     $1.9B food delivery
Turkey 2033     $5.8B (11.7% CAGR)
Gap             Zero equivalent in Turkey, Europe, or US
Moat            Cross-platform price history compounds daily
```

---

## HOW WE WORK

```
Claude.ai     Architecture, planning, prompt design for Claude Code
Claude Code   Execution, direct file edits, terminal commands
Workflow      Claude.ai → prompt → Claude Code → paste output back → iterate
claude-mem    Persists Claude Code session memory across terminal sessions
One task per conversation in this Project.
Each convo: state the task → get Claude Code prompt → execute → paste output back → iterate.
```

If starting in Claude Code: claude-mem will inject terminal session history.

If starting in Claude.ai: paste `find ~/dev/pryce-backend -not -path '*/.git/*' | sort` and key file contents to reconstruct state.
Claude Code sessions must be chunked into small loops:
1. Read files only → paste output to Claude.ai
2. Write one script or fix → run it → paste output
3. Fix one thing at a time → confirm working → next fix
4. Never combine read + write + fix + save in one prompt
Each Claude Code prompt should do ONE thing. Max 2-3 files read per session.
Token budget: target 5-8% per task, 25%+ means the prompt was too big.

---

## FOUNDER PRINCIPLES

```
Build right not fast
UI must feel premium — Apple meets Uber Eats
Discount code logic non-negotiable
McDonald's is MVP restaurant target
Price history is the moat
Consumer always on our side
Done beats perfect after foundation is solid
```

---

## WHEN TO UPDATE THIS FILE

Update PRYCE_CONTEXT.md in Claude.ai Project Knowledge when:
- Hosting provider changes
- MVP restaurant target changes
- A scraper is confirmed working end-to-end
- Major architecture decision is made
- Build sequence phase completes

At the start of each Claude.ai convo, check if any of the above happened
in the last session and prompt Ediz to update if needed.

## CLAUDE CODE — AGENTS RULE

Use /agents (Architect → Writer → Reviewer) when a mistake is expensive:
✅ New scraper from scratch
✅ Any change to main.py or database.py
✅ Full feature touching frontend + backend + DB
✅ Discount code logic
✅ Anything going to TestFlight / production

Just prompt normally for:
❌ Fixing a broken selector
❌ Adding a single endpoint
❌ Debugging terminal errors
❌ One-off test scripts

Claude.ai will flag "use agents for this one" or "just paste directly" at the top of every Claude Code prompt.
