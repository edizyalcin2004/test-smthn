// Gizlilik bildirimi metni — DRAFT, lawyer review pending before public launch.
// Every sentence here must stay true to what the code does. When telemetry,
// /events, /order-feedback or compare_events change, update this file in the
// same commit (tests/privacy.test.mjs pins the facts it can check).
//
// CONTROLLER stays null until the founder decides who the data controller is
// (person or company) and which contact address to publish; while null the
// screen says so instead of showing a placeholder.
export const CONTROLLER = null; // e.g. { name: '...', contact: '...' }

export const UPDATED = '25 Ekim 2026';

export const SECTIONS = [
  {
    title: 'Kısaca',
    body: [
      'Doybi hesap açmadan çalışır. Adın, e-postan, telefon numaran, konumun, reklam kimliğin ya da cihaz kimliğin toplanmaz.',
      'Sunucuya giden her şey kimliksizdir: seni tanıyan bir kod taşımaz.',
    ],
  },
  {
    title: 'Yalnızca telefonunda kalanlar',
    body: [
      'Onayladığın siparişlerin listesi ve tasarruf hesabın.',
      'Doybi\'yi ilk kullandığın gün ve bu hafta karşılaştırma yapıp yapmadığın. Sunucuya bunların kendisi değil, yalnızca bir aralık ("1-7 gün" gibi) ve evet/hayır bilgisi gider.',
      'Kopyaladığın indirim kodları telefonunun panosuna gider, bize gelmez.',
    ],
  },
  {
    title: 'Fiyat karşılaştırması',
    body: [
      'Sepetindeki ürünler, fiyatları hesaplamak için sunucuya gönderilir.',
      'Her karşılaştırmada gösterdiğimiz sonuç kaydedilir: restoran, ürün adedi ve her platform için toplam ve indirimli tutar, kaçıncı sırada olduğu, kod uygulanıp uygulanmadığı, en ucuza farkı ve kullandığımız en eski fiyatın yaşı. Hangi ürünleri seçtiğin bu kayıtlara yazılmaz.',
      'Her karşılaştırma rastgele bir karşılaştırma kodu alır. Bu kod, aynı karşılaştırmanın platforma geçişini ve sipariş sonrası cevabını birbirine bağlar; seni ya da telefonunu tanımlamaz.',
    ],
  },
  {
    title: 'Kullanım bilgisi',
    body: [
      'Restoran araması, restoran görüntüleme, sepete ürün ekleme ya da çıkarma ve bir platforma geçiş (kaçıncı sıradaki platformu seçtiğin, en ucuzu olup olmadığı, fiyat farkı) kaydedilir.',
      'Arama metni küçük harfe çevrilir ve harf dışı karakterler atılır. Beş ya da daha fazla rakam içeren aramalar (telefon, sipariş numarası gibi) hiç kaydedilmez.',
      'Uygulama her açılışta rastgele bir oturum kodu üretir; bu kod telefonda saklanmaz ve uygulama kapanınca kaybolur. Yanında uygulama sürümü, işletim sistemi (iOS ya da Android) ve kullanım süresi aralığı gider. Zaman dakikaya yuvarlanır.',
    ],
  },
  {
    title: 'Sipariş sonrası soru',
    body: [
      'Bir platforma geçip döndüğünde siparişi tamamlayıp tamamlamadığını sorarız. Cevap vermek zorunda değilsin.',
      '"Evet" dersen restoran, platform, ürünler ve adetleri, ödediğini yazdığın tutar, fiyatların uyuşup uyuşmadığı ve uyuşmadıysa listeden seçtiğin sebep kaydedilir. Zaman saate yuvarlanır.',
      '"Hayır" dersen yalnızca o geçişin siparişe dönüşmediği kaydedilir; sepet ya da tutar gönderilmez.',
    ],
  },
  {
    title: 'IP adresi ve sunucu',
    body: [
      'Doybi veritabanına IP adresi yazılmaz.',
      'Kötüye kullanımı önlemek için sunucu, bir IP adresinden gelen istekleri yalnızca bellekte ve en fazla bir saat sayar; bu sayım kaydedilmez ve sunucu yeniden başlayınca silinir.',
      'Sunucumuz Railway üzerinde, Türkiye dışında çalışır. Her internet hizmetinde olduğu gibi barındırma sağlayıcısı, bağlantı kayıtlarında IP adresini kısa süreli işleyebilir.',
    ],
  },
  {
    title: 'Ne için kullanıyoruz',
    body: [
      'Fiyatları karşılaştırmak, gösterdiğimiz fiyatların doğruluğunu ölçmek ve uygulamayı geliştirmek için.',
      'Kişiye inmeyen, toplu istatistikler hazırlamak için (örneğin platformlar arası ortalama fiyat farkı). Tek tek kayıtlar kimseye satılmaz ya da verilmez.',
    ],
  },
  {
    title: 'Platforma geçtiğinde',
    body: [
      'Bir platformun sayfasını açtığında Doybi o platforma senin hakkında bir bilgi göndermez. Orada yaptıkların o platformun kendi gizlilik politikasına tabidir.',
    ],
  },
  {
    title: 'Silme ve hakların',
    body: [
      'Telefonundaki tüm Doybi verilerini uygulamayı silerek silebilirsin.',
      'Sunucudaki kayıtlar seni tanıyan bir kod taşımadığı için sana bağlanamaz; bu yüzden kişiye özel bulunup silinemezler.',
      'KVKK madde 11 kapsamındaki soruların ve başvuruların için aşağıdaki iletişim bilgisini kullanabilirsin.',
    ],
  },
];
