# Doybi — store listing text (copy-paste ready)

Written 2026-11-08. Every claim here must stay true to the app; change it in
the same commit as the feature it describes. Counts checked with `wc -m`
(limits: Play title 30 / short 80 / full 4000; App Store name 30 /
subtitle 30 / promo 170 / keywords 100 bytes / description 4000).

Rules followed: no "live" or "real-time" price claims (prices refresh every
two days); no "cheapest guaranteed"; delivery fee is excluded and says so;
no affiliation implied; App Store keywords carry no other company's
trademark (Apple guideline 2.3.7). Platform names appear only where the app
itself names them, as plain text.

---

## Google Play (Turkish, primary language)

**App name (≤30):**
Doybi: Yemek Fiyat Karşılaştır

**Short description (≤80):**
Aynı yemek sepetini platformlar arasında karşılaştır, kodlarla daha az öde.

**Full description:**

Aynı sepet, farklı fiyatlar. Hangisi daha uygun?

Doybi, aynı restorandan aynı ürünleri yemek siparişi platformlarında ayrı
ayrı fiyatlar ve sepet toplamlarını yan yana gösterir. Restoranını seç,
ürünlerini ekle, "Fiyatları karşılaştır"a dokun.

NELER YAPAR
• Sepet karşılaştırması: Trendyol Yemek, Yemeksepeti, Migros Yemek,
  Tıklagelsin ve restoranın kendi sitesindeki fiyatları tek ekranda görürsün.
• Seçenekler dahil: menü boyu, içecek, ekstra malzeme gibi seçimleri bir kez
  yaparsın; her platform kendi fiyatıyla hesaplanır. Aynı seçenekleri
  doğrulayamadığımız platformu "karşılaştırılamıyor" diye ayrı gösteririz,
  tahmin etmeyiz.
• İndirim kodları: herkese açık kampanya kodlarını toplar, sepetine
  uyanı toplama uygular. Kodu tek dokunuşla kopyalarsın.
• Özel menüler: yalnızca tek bir platformda satılan menüleri Fırsatlar
  sekmesinde bulursun.
• Tasarruf: siparişini tamamladığını onayladığında ne kadar tasarruf ettiğini
  kaydeder.

DÜRÜST OLDUĞUMUZ YERLER
• Fiyatlar platformların herkese açık sayfalarından okunur ve iki günde bir
  yenilenir; anlık değildir. Siparişten önce platformdaki fiyatı kontrol et.
• Toplamlara teslimat ücreti dahil değildir.
• Bir ürün bir platformda bulunamazsa o platformun toplamını göstermeyiz;
  eksik sepetle sıralama yapmayız.
• Doybi sipariş almaz, ödeme almaz. "Restoranı aç" seni platformun kendi
  sayfasına götürür; sepet aktarılmaz.

HESAP GEREKMEZ
Üyelik yok, giriş yok. Adını, telefonunu, konumunu ya da reklam kimliğini
toplamayız.

Şu an İstanbul'da (Kadıköy ve Ataşehir çevresi) 37 restoranla çalışıyoruz;
yenilerini ekliyoruz.

Doybi hiçbir yemek siparişi platformuyla bağlantılı değildir. Adı geçen marka
ve platform adları sahiplerine aittir.

**Category:** Food & Drink · **Tags:** Food delivery, Price comparison
**Contact email:** (new support address — pending)
**Website:** https://pryce-backend-production.up.railway.app/support
**Privacy policy:** https://pryce-backend-production.up.railway.app/privacy

### English translation (optional second listing)

**Name:** Doybi: Food Price Compare
**Short:** Compare the same food basket across delivery apps and pay less with codes.
**Full:** Use the Turkish text above translated one-to-one; keep every
"honest" line.

---

## App Store (Turkish primary)

**Name (≤30):** Doybi
**Subtitle (≤30):** Yemek sepetini karşılaştır
**Promotional text (≤170):**
Aynı restorandan aynı sepet, her platformda ayrı fiyat. Doybi toplamları yan
yana gösterir ve uygun indirim kodunu uygular.
**Keywords (≤100 bytes, no trademarks):**
yemek,sipariş,fiyat,karşılaştır,indirim,kod,kupon,sepet,burger,pizza,tasarruf
**Description:** same as the Google Play full description above.
**Category:** Food & Drink (primary), Shopping (secondary)
**Support URL:** https://pryce-backend-production.up.railway.app/support
**Privacy Policy URL:** https://pryce-backend-production.up.railway.app/privacy
**Copyright:** 2026 Ediz Yalçın

---

## Screenshots and graphics (in `store/`)

| File | Use |
|---|---|
| `store/screenshots/ios-6.9/*.png` (1320×2868) | App Store iPhone 6.9" — Apple scales these to every other iPhone size |
| `store/screenshots/android/*.png` (1080×2160) | Google Play phone screenshots |
| `store/graphics/play-feature-1024x500.png` | Play feature graphic |
| `store/graphics/play-icon-512.png` | Play app icon |
| `store/graphics/appstore-icon-1024.png` | App Store icon (no transparency) |

Order: 1 Keşfet → 2 Menü → 3 Seçenekler → 4 Karşılaştırma sonucu → 5 Fırsatlar.
All five are the real app with real data (2026-11-08): the result screen is a
real Burger King comparison (Whopper®, Double Whopper®, Chicken Royale®):
Trendyol ₺1.135 with a ₺200 code, Tıklagelsin ₺1.310, Migros ₺1.335. No
mock data. `supportsTablet` is off, so no iPad screenshots are needed.
