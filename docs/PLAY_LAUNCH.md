# Doybi on Google Play — what's ready, what Ediz clicks

Package `com.doybi.app` (permanent). Personal developer account → Google
requires a **closed test with ≥12 testers opted in for 14 days in a row**
before production access
(https://support.google.com/googleplay/android-developer/answer/14151465).

## Ready in code (2026-10-25)

- Honest Account screen (no fake profile/points/Pro price), in-app Gizlilik.
- No scraped photos anywhere: only our mascot and our own icons.
- Every button does something. Deals "Uygulamaya git" opens the verified
  platform link; dead bell/filter buttons removed.
- Order links: https links to the platform (opens the platform app if
  installed, else the browser). No basket is transferred.
- Privacy: https://pryce-backend-production.up.railway.app/privacy
- Support: https://pryce-backend-production.up.railway.app/support
  (both live once backend PR #64 is merged; contact email still missing)
- Icon, adaptive icon, splash: mascot on navy.
- `eas.json`: `preview` = installable APK, `production` = .aab for Play.

## Still missing before submitting

1. **Support email** → send it to Claude; it goes on both pages and the listing.
2. **Real Android phone test** of the preview APK (every tab, a comparison,
   "Restoranı aç", Deals "Uygulamaya git", Hesabım → Gizlilik).
3. **Store graphics**: 512×512 icon (Claude has one), 1024×500 feature
   graphic, at least 2 phone screenshots.

## Ediz's clicks, in order

1. https://play.google.com/console → create a **personal** developer account
   ($25, ID verification, can take a few days).
2. On the Mac, in the app folder: `npx eas-cli login` (free Expo account),
   then `npx eas-cli build -p android --profile preview` → install the APK on
   an Android phone and try everything.
3. `npx eas-cli build -p android --profile production` → download the `.aab`.
4. Play Console → Create app: name **Doybi**, Turkish, App, Free.
5. Testing → Closed testing → create track → upload the `.aab` → add testers
   (a list of ≥12 Gmail addresses) → send them the opt-in link. They must
   install and **stay opted in 14 days**; ask them to open it a few times.
6. Fill the forms below. After 14 days: Dashboard → Apply for production.

## Forms — answers to paste

**App access:** All functionality is available without special access.

**Review note** (App content → App access → instructions, or release notes):

> Doybi compares the total price of the same restaurant basket across Turkish
> food-delivery platforms (Trendyol Yemek, Yemeksepeti, Migros Yemek,
> Tıklagelsin, and the restaurant's own site). No login or account is needed.
> To test: open the "Compare" tab, pick McDonald's, add 2–3 items, tap
> "Fiyatları karşılaştır". The result ranks platforms by basket total (delivery
> fee excluded) with discount codes applied; "Restoranı aç" / "Platformu aç"
> opens that platform's own page. Doybi does not take orders or payments
> and is not affiliated with any platform; prices are read from public pages
> and refreshed twice a week. Internet connection required.

**Ads:** No ads.

**Content rating:** questionnaire → category "Utility, productivity,
communication, or other"; answer No to everything → rated for everyone.

**Target audience:** 18 and over (keeps the app out of the Families program).

**Data safety** (true to `src/content/privacy.js`):
- Does the app collect or share user data? **Yes, collects; does not share.**
- Collected types:
  - App activity → **App interactions** and **In-app search history**:
    collected, not shared, *not* linked to the user's identity, optional? No
    (automatic), purpose **Analytics, App functionality**.
  - Financial info → **Purchase history** (the total a user types in after
    ordering, only if they answer "Evet"): optional, not linked to identity,
    purpose **Analytics**.
- Data encrypted in transit: **Yes** (HTTPS).
- Users can request deletion: **No** — records carry no identifier, so they
  cannot be found per person; on-phone data is deleted with the app. (No
  accounts exist, so Google's account-deletion rule does not apply.)
- No location, contacts, photos, device or advertising IDs, no personal info.

**Privacy policy URL:** `/privacy` above. **Category:** Food & Drink.
**Contact email:** the new support address.

## Before production (not before the closed test)

- Lawyer review of the privacy text (T-013) and a named data controller.
- Data refresh: prices update twice a week; the listing must not promise
  "live" prices.
