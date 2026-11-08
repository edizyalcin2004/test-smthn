# Doybi on the App Store — what's ready, what Ediz clicks

Bundle ID `com.doybi.app` (same as the Android package; permanent once the
first build is uploaded). iPhone only (`supportsTablet: false`), so no iPad
screenshots are needed.

## Ready in code (2026-11-08)

- `app.json` iOS block: bundle id, `buildNumber` 1,
  `ITSAppUsesNonExemptEncryption: false` (the app only uses HTTPS, so Apple's
  export-compliance question is answered in the build and won't block
  TestFlight), and a privacy manifest declaring the system APIs React Native /
  AsyncStorage use (UserDefaults CA92.1, file timestamps C617.1, boot time
  35F9.1, disk space E174.1), no tracking.
- `eas.json`: `production` builds iOS too; `submit.production.ios` is ready
  for `eas submit` (fills in after the first login).
- Listing text, keywords, screenshots (6.9", 1320×2868) and 1024 icon:
  `docs/STORE_LISTING.md`, `store/`.
- Privacy policy and support pages are live (URLs in STORE_LISTING.md).
- `npx expo-doctor`: 18/18 checks pass. App tests: 21/21.

## Ediz's clicks, in order

1. https://developer.apple.com/programs/enroll → enroll as an **individual**
   ($99/year, needs Apple ID with two-factor + ID check; can take 1–2 days).
2. On the Mac, in the app folder: `npx eas-cli login`, then
   `npx eas-cli build -p ios --profile production`. EAS asks to log in to
   your Apple account once and creates the certificates itself. Say yes to
   everything it offers to generate.
3. `npx eas-cli submit -p ios --latest` → the build goes to App Store Connect
   and appears in **TestFlight** after Apple processes it (~15–30 min).
4. TestFlight → Internal testing → add yourself → install on your iPhone and
   try every tab (same checklist as Android in PLAY_LAUNCH.md).
5. App Store Connect → the app → fill the listing from STORE_LISTING.md, upload
   the 5 screenshots from `store/screenshots/ios-6.9/`, pick the build, answer
   the forms below → **Submit for Review**. Review is usually 1–3 days.

## Forms — answers to paste

**App Review information → Notes** (sign-in not required):

> No account or login is needed. Doybi compares the total price of the same
> restaurant basket across Turkish food-delivery platforms (Trendyol Yemek,
> Yemeksepeti, Migros Yemek, Tıklagelsin and the restaurant's own website).
> To test: tap "Karşılaştır", choose Burger King, tap + on Whopper®, choose
> "Peynir İstemiyorum", tap "Sepete ekle", add one more item, then "Sepeti
> incele" → "Fiyatları karşılaştır". Results rank platforms by basket total
> (delivery fee excluded) with public discount codes applied. "Restoranı aç"
> opens the platform's own public page in Safari or its app; Doybi takes no
> orders or payments and is not affiliated with any platform. Prices come from
> public pages and refresh every two days. The app is in Turkish.

**App Privacy** (true to `src/content/privacy.js`):
- Do you or your partners collect data? **Yes.**
- Data types collected, all **Not linked to the user**, **Not used for
  tracking**:
  - Usage Data → **Product Interaction** — purposes: Analytics, App
    Functionality.
  - Search History — purposes: Analytics, App Functionality.
  - Purchases → **Purchase History** (only the total a user types after
    answering "Evet" to the order question) — purpose: Analytics.
- Nothing else: no contact info, location, identifiers, diagnostics.
- Result Apple shows: "Data Not Linked to You".

**Age rating:** answer "None" to every question → **4+**.
**Content rights:** "Does your app contain, show, or access third-party
content?" → **Yes**, and confirm you have the rights: it shows menu names and
prices read from public pages (no photos — all food art is our own).
**Pricing:** Free, all countries or Turkey only (Turkey recommended for now).
**Export compliance:** already answered by the build (`false`).

## Known review risks, and our answer

- **Guideline 5.2 (third-party brands):** no platform logos anywhere, names
  appear as plain text, "not affiliated" line is in the description. Keep it
  that way.
- **Guideline 4.2 (minimum functionality):** native comparison flow, option
  sheet, codes, deals — not a web wrapper.
- **Guideline 2.3.7 (keywords):** no other brands in keywords (checked).
- **Backend must be up during review** — Railway is always on; no action.
