// DealsScreen — "Fırsatlar" (redesign PR 3, designs 11/13/20), wired live.
//   Kodlar       — live discount codes, soonest expiry first; each opens the
//                  shared CodeSheet with its full conditions.
//   Özel menüler — platform-EXCLUSIVE bundles from /special-deals. Single
//                  platform, single price. The only comparison shown is the
//                  backend's own `elsewhere` list (the same menu matched on
//                  another platform); without it there is no "cheaper" claim.
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, Pressable, ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Linking, Alert, useWindowDimensions } from 'react-native';
import { PressScale, Reveal } from '../lib/motion';
import { groupCodes } from '../lib/codeGroups';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, font, money } from '../theme/tokens';
import { Title, Segmented, Chip, PrimaryButton } from '../components/ui';
import { Icon } from '../components/icons';
import { FoodArt, Mascot, foodType } from '../components/Art';
import { getDiscountCodes, getSpecialDeals } from '../api/client';
import { useCodeSheet } from '../components/CodeSheet';
import { safeOrderURL } from '../lib/orderLinks';

const RETIRED = new Set(['Getir Yemek']);
const num = (v) => Number(v ?? 0);

const discountText = (c) =>
  c.discount_type === 'percentage' ? `%${num(c.discount_value)} indirim` : `${money(num(c.discount_value))} indirim`;

function timeLeft(expiry) {
  if (!expiry) return null;
  const d = new Date(expiry);
  if (isNaN(d.getTime())) return null;
  const ms = d.getTime() - Date.now();
  if (ms <= 0) return 'Süresi doldu';
  const days = Math.floor(ms / 86400000);
  if (days >= 1) return `${days} gün kaldı`;
  const hrs = Math.floor(ms / 3600000);
  if (hrs >= 1) return `${hrs} saat kaldı`;
  return `${Math.max(1, Math.floor(ms / 60000))} dk kaldı`;
}

// Who can use it — shown on the card so nobody is surprised at checkout.
function eligibility(c) {
  if (c.usage_limit === 'first_order') return 'İlk siparişe özel';
  if (c.requires_membership) return 'Üyelik gerekir';
  if (c.usage_limit === 'once_per_user') return 'Kişi başı 1 kez';
  if (c.usage_limit && c.usage_limit !== 'unlimited') return String(c.usage_limit); // e.g. Migros "Koşullar platformda"
  return null;
}

export default function DealsScreen() {
  const insets = useSafeAreaInsets();
  const { openCode } = useCodeSheet();
  const [seg, setSeg]               = useState('menuler');
  const [codes, setCodes]           = useState([]);
  const [special, setSpecial]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState(false);
  const mounted                     = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const load = useCallback(async (isRefresh) => {
    if (!isRefresh) setLoading(true);
    setError(false);
    try {
      const [c, sp] = await Promise.all([getDiscountCodes(), getSpecialDeals()]);
      if (mounted.current) { setCodes(c || []); setSpecial(sp || []); }
    } catch {
      if (mounted.current) setError(true);
    } finally {
      if (mounted.current) { setLoading(false); setRefreshing(false); }
    }
  }, []);
  useEffect(() => { load(false); }, [load]);
  const onRefresh = useCallback(() => { setRefreshing(true); load(true); }, [load]);

  const sortedCodes = useMemo(() => {
    const ts = (c) => { const d = c.expiry_date ? new Date(c.expiry_date).getTime() : NaN; return isNaN(d) ? Infinity : d; };
    return codes.filter((c) => !RETIRED.has(c.platform?.name)).sort((a, b) => ts(a) - ts(b));
  }, [codes]);

  // One card per bundle; each carries its restaurant, platform and link.
  const bundles = useMemo(() => special
    .filter((g) => !RETIRED.has(g.platform?.name))
    .flatMap((g) => (g.items || []).map((it) => ({ ...it, restaurant_id: g.restaurant_id, restaurant_name: g.restaurant_name, platform: g.platform, order_url: g.order_url }))),
  [special]);

  const isCodes = seg === 'kodlar';

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.ink} />}
      >
        <View style={s.head}>
          {isCodes ? <Title accent="avantaj.">Biraz daha</Title> : <Title accent="fırsat var.">Menüde</Title>}
          <Text style={s.lead}>{isCodes ? 'Önce koşulları incele, sonra seçimini yap.' : 'Yalnızca tek bir platformda bulunan özel menüler.'}</Text>
          <Segmented
            style={s.seg}
            value={seg}
            onChange={setSeg}
            options={[{ value: 'kodlar', label: 'Kodlar' }, { value: 'menuler', label: 'Özel menüler' }]}
          />
        </View>

        {loading ? (
          <View style={s.state}><Mascot pose="deal-search" size={110} /><Text style={s.stateTitle}>Fırsatlar yükleniyor…</Text><ActivityIndicator color={T.ink} style={{ marginTop: 10 }} /></View>
        ) : error ? (
          <View style={s.state}>
            <Mascot pose="no-results" size={110} />
            <Text style={s.stateTitle}>Fırsatlar şu an yüklenemedi.</Text>
            <Text style={s.stateText}>Bağlantını kontrol edip tekrar dene.</Text>
            <PrimaryButton onPress={() => load(false)} style={s.stateBtn}>Tekrar dene</PrimaryButton>
          </View>
        ) : isCodes ? (
          <CodesView codes={sortedCodes} openCode={openCode} />
        ) : (
          <SpecialMenusView bundles={bundles} onCodes={() => setSeg('kodlar')} />
        )}
      </ScrollView>
    </View>
  );
}

function CodesView({ codes, openCode }) {
  // Migros store coupons alone can be a few hundred cards, so the list gets
  // platform chips (built from live data) like Özel menüler.
  const [plat, setPlat] = useState('Tümü');
  const plats = useMemo(() => ['Tümü', ...new Set(codes.map((c) => c.platform?.name).filter(Boolean))], [codes]);
  const shown = plat === 'Tümü' ? codes : codes.filter((c) => c.platform?.name === plat);
  return (
    <View style={s.body}>
      <View style={s.callout}>
        <View style={{ flex: 1 }}>
          <Text style={s.calloutTitle}>Küçük kod, güzel fark.</Text>
          <Text style={s.calloutText}>Kodun restoran ve sepet koşullarına uyduğundan emin ol.</Text>
        </View>
        <Mascot pose="discount-code" size={104} />
      </View>

      <Text style={s.sectionTitle}>Kodları keşfet</Text>
      {plats.length > 2 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.codeChips}>
          {plats.map((p) => <Chip key={p} label={p} active={plat === p} onPress={() => setPlat(p)} />)}
        </ScrollView>
      ) : null}
      {shown.length === 0 ? (
        <View style={s.state}>
          <Mascot pose="no-results" size={100} />
          <Text style={s.stateTitle}>Şu an aktif kod yok.</Text>
          <Text style={s.stateText}>Platformlar yeni kod yayınladığında burada göreceksin.</Text>
        </View>
      ) : groupCodes(shown).map((g) => <CodeGroupCard key={g.key} g={g} openCode={openCode} />)}
      <Note>Kodlar platformların herkese açık kampanya sayfalarından okunur. Son geçerlilik her zaman platformda kontrol edilir.</Note>
    </View>
  );
}

function CodeGroupCard({ g, openCode }) {
  const [open, setOpen] = useState(false);
  const c = g.kind === 'restaurant' ? g.best : g.code;
  const left = timeLeft(c.expiry_date);
  const who = eligibility(c);
  const title = g.kind === 'restaurant' ? (c.restaurant_name || c.title) : (c.code || c.title);
  const sub = g.kind === 'campaign'
    ? `${c.platform?.name} · ${g.places.length} restoranda`
    : g.kind === 'restaurant'
      ? [c.platform?.name, c.title].filter(Boolean).join(' · ')
      : [c.restaurant_name, c.platform?.name, discountText(c)].filter(Boolean).join(' · ');
  const more = g.kind === 'campaign' ? g.places.length : g.kind === 'restaurant' ? g.others.length : 0;
  const onPress = g.kind === 'code' || more === 0 ? () => openCode(c) : () => setOpen((o) => !o);
  return (
    <PressScale onPress={onPress} style={s.codeCard} accessibilityRole="button" accessibilityState={{ expanded: open }}>
      <View style={s.codeTop}>
        <View style={s.codeIcon}><Icon name="tag" s={22} c={T.ink} /></View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.code} numberOfLines={2}>{title}</Text>
          <Text style={s.codeSub} numberOfLines={1}>{sub}</Text>
        </View>
        <Icon name={more ? 'chevD' : 'chevR'} s={18} c={T.ink} sw={1.9} />
      </View>
      {open && g.kind === 'campaign' ? (
        <View style={s.groupList}>
          <Text style={s.groupText}>{g.places.join(' · ')}</Text>
          <Pressable onPress={() => openCode(c)} hitSlop={6}><Text style={s.groupLink}>Koşulları gör</Text></Pressable>
        </View>
      ) : null}
      {open && g.kind === 'restaurant' ? (
        <View style={s.groupList}>
          {[g.best, ...g.others].map((o) => (
            <Pressable key={String(o.id)} onPress={() => openCode(o)} style={s.groupRow} hitSlop={4}>
              <Text style={s.groupText} numberOfLines={1}>{o.title}</Text>
              <Text style={s.groupMeta}>{eligibility(o) || ''}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <View style={s.codeFoot}>
        <Text style={s.codeFootText}>
          {g.kind === 'restaurant' && more ? `${more + 1} kupon` : c.minimum_order != null ? `Min. ${money(num(c.minimum_order))}` : 'Alt limit yok'}
        </Text>
        <Text style={s.codeFootText} numberOfLines={1}>{[who, left].filter(Boolean).join(' · ')}</Text>
      </View>
    </PressScale>
  );
}

function SpecialMenusView({ bundles, onCodes }) {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const [plat, setPlat] = useState('Tümü');
  const plats = useMemo(() => ['Tümü', ...new Set(bundles.map((b) => b.platform?.name).filter(Boolean))], [bundles]);
  const shown = plat === 'Tümü' ? bundles : bundles.filter((b) => b.platform?.name === plat);

  if (bundles.length === 0) {
    return (
      <View style={s.state}>
        <Mascot pose="no-results" size={120} />
        <Text style={s.stateTitle}>Şu an özel menü yok.</Text>
        <Text style={s.stateText}>Restoranlar platforma özel menü eklediğinde burada göreceksin.</Text>
        <PrimaryButton onPress={onCodes} bg={T.white} fg={T.ink} style={[s.stateBtn, s.ghost]}>Kodlara göz at</PrimaryButton>
        <Pressable onPress={() => navigation.navigate('Compare')} style={{ marginTop: 14 }}><Text style={s.link}>Restoranları keşfet</Text></Pressable>
      </View>
    );
  }

  const artW = width - 40 - 34;
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
        {plats.map((p) => <Chip key={p} label={p} active={plat === p} onPress={() => setPlat(p)} />)}
      </ScrollView>
      <View style={s.body}>
        {shown.map((b, i) => <Reveal key={`${b.platform?.id}-${b.id}`} index={i}><BundleCard b={b} artW={artW} /></Reveal>)}
        <Note>Fiyatlar platformun herkese açık sayfasında son görülen fiyattır. Teslimat ücreti hariç.</Note>
      </View>
    </View>
  );
}

function BundleCard({ b, artW }) {
  const url = safeOrderURL(b.order_url);
  const elsewhere = (b.elsewhere || []).filter((e) => !RETIRED.has(e.platform?.name));
  const cheaperBy = elsewhere.length ? Math.min(...elsewhere.map((e) => num(e.price))) - num(b.price) : 0;
  const open = async () => {
    try { await Linking.openURL(url); }
    catch { Alert.alert('Bağlantı açılamadı', 'Lütfen platformu kendi uygulamasından aç.'); }
  };
  return (
    <View style={s.bundle}>
      <FoodArt type={foodType(`${b.name} ${b.restaurant_name}`)} size={artW} height={Math.round(artW * 0.42)} round={false} radius={16} />
      <Text style={s.bundleEyebrow} numberOfLines={1}>{String(b.restaurant_name).toLocaleUpperCase('tr-TR')} · ÖZEL MENÜ</Text>
      <View style={s.bundleRow}>
        <Text style={s.bundleName}>{b.name}</Text>
        <Text style={s.bundlePrice}>{money(num(b.price))}</Text>
      </View>
      <Text style={s.bundleSub}>{b.platform?.name} özel menüsü</Text>

      {elsewhere.length ? (
        <View style={s.elsewhere}>
          <Text style={s.elsewhereTitle}>Aynı menü diğer platformlarda</Text>
          {elsewhere.map((e) => (
            <View key={String(e.platform?.id)} style={s.elsewhereRow}>
              <Text style={s.elsewhereName}>{e.platform?.name}</Text>
              <Text style={s.elsewherePrice}>{money(num(e.price))}</Text>
            </View>
          ))}
          {cheaperBy > 0 ? <Text style={s.cheaper}>Burada {money(Math.round(cheaperBy * 100) / 100)} daha ucuz</Text> : null}
        </View>
      ) : null}

      <View style={s.bundleFoot}>
        <Text style={s.bundleFootText}>Bu menü yalnızca {b.platform?.name}'de</Text>
        {url ? (
          <Pressable onPress={open} style={s.goRow} accessibilityRole="link" hitSlop={6}>
            <Text style={s.goText}>Platformda incele</Text>
            <Icon name="arrow" s={17} c={T.ink} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function Note({ children }) {
  return (
    <View style={s.note}>
      <Icon name="help" s={15} c={T.sub} />
      <Text style={s.noteText}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  head:        { paddingHorizontal: 20, paddingTop: 10 },
  lead:        { fontSize: 14, fontFamily: font.regular, color: T.sub, marginTop: 8 },
  seg:         { marginTop: 20 },
  chips:       { paddingHorizontal: 20, paddingTop: 16, gap: 8 },
  body:        { paddingHorizontal: 20, paddingTop: 16 },

  callout:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EAE8E0', borderRadius: 20, padding: 18 },
  calloutTitle: { fontSize: 18, fontFamily: font.bold, color: T.ink, letterSpacing: -0.5 },
  calloutText:  { fontSize: 13, fontFamily: font.regular, color: T.sub, marginTop: 6, lineHeight: 18 },
  sectionTitle: { fontSize: 19, fontFamily: font.bold, color: T.ink, letterSpacing: -0.5, marginTop: 26, marginBottom: 14 },
  codeChips:    { gap: 8, paddingBottom: 14 },
  groupList:    { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  groupRow:     { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  groupText:    { flexShrink: 1, fontSize: 13, fontFamily: font.regular, color: T.ink, lineHeight: 19 },
  groupMeta:    { fontSize: 12, fontFamily: font.regular, color: T.sub },
  groupLink:    { fontSize: 13, fontFamily: font.medium, color: T.ink, textDecorationLine: 'underline' },

  codeCard:     { backgroundColor: T.white, borderRadius: 18, borderWidth: 1, borderColor: T.line, marginBottom: 12, overflow: 'hidden' },
  codeTop:      { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  codeIcon:     { width: 44, height: 44, borderRadius: 13, backgroundColor: '#FFF0C5', alignItems: 'center', justifyContent: 'center' },
  code:         { fontSize: 17, fontFamily: font.bold, color: T.ink, letterSpacing: 0.2 },
  codeSub:      { fontSize: 12.5, fontFamily: font.regular, color: T.sub, marginTop: 3 },
  codeFoot:     { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingHorizontal: 16, paddingVertical: 11, borderTopWidth: 1, borderTopColor: T.line, borderStyle: 'dashed' },
  codeFootText: { fontSize: 12, fontFamily: font.regular, color: T.sub, flexShrink: 1 },

  bundle:        { backgroundColor: T.white, borderRadius: 20, borderWidth: 1, borderColor: T.line, padding: 16, marginBottom: 14 },
  bundleEyebrow: { fontSize: 10, fontFamily: font.semibold, color: T.sub, letterSpacing: 1.6, marginTop: 16 },
  bundleRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginTop: 6 },
  bundleName:    { flex: 1, fontSize: 17, fontFamily: font.bold, color: T.ink, letterSpacing: -0.4, lineHeight: 22 },
  bundlePrice:   { fontSize: 22, fontFamily: font.bold, color: T.ink, letterSpacing: -0.6 },
  bundleSub:     { fontSize: 13, fontFamily: font.regular, color: T.sub, marginTop: 4 },
  elsewhere:     { backgroundColor: '#F0EFE8', borderRadius: 14, padding: 14, marginTop: 14, gap: 8 },
  elsewhereTitle:{ fontSize: 13, fontFamily: font.semibold, color: T.ink },
  elsewhereRow:  { flexDirection: 'row', justifyContent: 'space-between' },
  elsewhereName: { fontSize: 13, fontFamily: font.regular, color: T.ink },
  elsewherePrice:{ fontSize: 13, fontFamily: font.semibold, color: T.ink },
  cheaper:       { fontSize: 13, fontFamily: font.medium, color: T.green },
  bundleFoot:    { borderTopWidth: 1, borderTopColor: T.line, marginTop: 14, paddingTop: 12, gap: 8 },
  bundleFootText:{ fontSize: 11.5, fontFamily: font.regular, color: T.sub },
  goRow:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  goText:        { fontSize: 14, fontFamily: font.medium, color: T.ink },

  state:       { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20 },
  stateTitle:  { fontSize: 19, fontFamily: font.medium, color: T.ink, marginTop: 14, textAlign: 'center', letterSpacing: -0.4 },
  stateText:   { fontSize: 13.5, fontFamily: font.regular, color: T.sub, marginTop: 6, textAlign: 'center' },
  stateBtn:    { marginTop: 18, width: 'auto', paddingHorizontal: 26 },
  ghost:       { borderWidth: 1, borderColor: T.line },
  link:        { fontSize: 13.5, fontFamily: font.medium, color: T.ink, textDecorationLine: 'underline' },

  note:        { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 8 },
  noteText:    { flex: 1, fontSize: 12, fontFamily: font.regular, color: T.sub, lineHeight: 17 },
});
