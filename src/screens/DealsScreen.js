// DealsScreen — "Fırsatlar" with a segmented toggle [ Kodlar | Özel Menüler ].
//   Kodlar       — live discount codes (soonest-expiry first), each opens the
//                  shared CodeSheet. Unchanged behaviour.
//   Özel Menüler — platform-EXCLUSIVE special-menu bundles from /special-deals,
//                  grouped by restaurant. Single platform, single price, honest:
//                  NO winner badge, NO savings, NO strikethrough, NO ratings.
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, TextInput, Pressable, Image, ActivityIndicator, RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { T, font, money } from '../theme/tokens';
import { Card, Header, Pill, Brand } from '../components/ui';
import { Icon } from '../components/icons';
import Food from '../components/Food';
import { platformBrand, restaurantTile } from '../lib/brand';
import { getDiscountCodes, getSpecialDeals } from '../api/client';
import { useCodeSheet } from '../components/CodeSheet';

// MVP scope: McDonald's + Burger King only (Komagene and anything else hidden),
// matching the Search tab. toLocaleLowerCase('tr') keeps İ/ı casing honest.
const inScope = (name) => {
  const n = String(name).toLocaleLowerCase('tr');
  return n.includes('mcdonald') || n.includes('burger king');
};

// Normalise a live platform name ("Trendyol Yemek") to a stable filter key.
const platformKey = (name = '') => {
  const n = String(name).toLocaleLowerCase('tr');
  if (n.includes('yemeksepeti')) return 'yemeksepeti';
  if (n.includes('trendyol'))    return 'trendyol';
  if (n.includes('getir'))       return 'getir';
  return n;
};

// Static platform filter options (kept incl. Getir as forward-looking UI).
// Dot colour is pulled from LIVE platform hex_color where present, never hardcoded.
const SM_PLATFORMS = [
  { id: 'all',         label: 'Tümü' },
  { id: 'yemeksepeti', label: 'Yemeksepeti' },
  { id: 'trendyol',    label: 'Trendyol' },
  { id: 'getir',       label: 'Getir' },
];

const discountText = (c) =>
  c.discount_type === 'percentage' ? `%${c.discount_value} indirim` : `₺${c.discount_value} indirim`;

function timeLeft(expiry) {
  if (!expiry) return null;
  const d = new Date(expiry);
  if (isNaN(d.getTime())) return null;
  const ms = d.getTime() - Date.now();
  if (ms <= 0) return 'Doldu';
  const days = Math.floor(ms / 86400000);
  if (days >= 1) return `${days} gün`;
  const hrs = Math.floor(ms / 3600000);
  if (hrs >= 1) return `${hrs} saat`;
  return `${Math.max(1, Math.floor(ms / 60000))} dk`;
}

export default function DealsScreen() {
  const insets = useSafeAreaInsets();
  const { openCode } = useCodeSheet();
  const [seg, setSeg] = useState('menuler'); // ref default: Özel Menüler first
  const [codes, setCodes]           = useState([]);
  const [special, setSpecial]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState(null);
  const mounted                     = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const load = useCallback(async (isRefresh) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const [c, sp] = await Promise.all([getDiscountCodes(), getSpecialDeals()]);
      if (mounted.current) { setCodes(c || []); setSpecial(sp || []); }
    } catch {
      if (mounted.current) setError('Fırsatlar yüklenemedi. Bağlantını kontrol et.');
    } finally {
      if (mounted.current) { setLoading(false); setRefreshing(false); }
    }
  }, []);
  useEffect(() => { load(false); }, [load]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(true); }, [load]);

  const sortedCodes = useMemo(() => {
    const ts = (c) => {
      const d = c.expiry_date ? new Date(c.expiry_date).getTime() : NaN;
      return isNaN(d) ? Infinity : d;
    };
    return [...codes].sort((a, b) => ts(a) - ts(b));
  }, [codes]);

  // Flatten /special-deals (groups are restaurant+platform) into one group per
  // in-scope restaurant; each bundle carries its own platform object.
  const restaurantGroups = useMemo(() => {
    const byId = new Map();
    for (const g of special) {
      if (!inScope(g.restaurant_name)) continue;
      let entry = byId.get(g.restaurant_id);
      if (!entry) {
        entry = { restaurant_id: g.restaurant_id, restaurant_name: g.restaurant_name, bundles: [] };
        byId.set(g.restaurant_id, entry);
      }
      for (const it of g.items || []) entry.bundles.push({ ...it, platform: g.platform });
    }
    return [...byId.values()];
  }, [special]);

  return (
    <View style={[s.root, { paddingTop: insets.top + 4 }]}>
      <Header title="Fırsatlar" onBell={() => {}} bellBadge={false} />
      <View style={s.segWrap}>
        <Segmented
          value={seg}
          onChange={setSeg}
          options={[{ id: 'kodlar', label: 'Kodlar' }, { id: 'menuler', label: 'Özel Menüler' }]}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.blue} />}
      >
        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={T.blue} /></View>
        ) : error ? (
          <View style={s.center}>
            <Text style={s.errText}>{error}</Text>
            <Pressable onPress={() => load(false)} style={s.retry}><Text style={s.retryText}>Tekrar dene</Text></Pressable>
          </View>
        ) : seg === 'kodlar' ? (
          <CodesView codes={sortedCodes} openCode={openCode} />
        ) : (
          <SpecialMenusView groups={restaurantGroups} />
        )}
      </ScrollView>
    </View>
  );
}

// ── KODLAR segment — live discount codes (unchanged behaviour) ──
function CodesView({ codes, openCode }) {
  if (codes.length === 0) {
    return <View style={s.center}><Text style={s.empty}>Şu an aktif kod yok</Text></View>;
  }
  return (
    <View style={s.segBody}>
      <Text style={s.hint}>Süresi en yakına göre</Text>
      {codes.map((c) => {
        const left = timeLeft(c.expiry_date);
        return (
          <Card key={String(c.id)} pad={15} onPress={() => openCode(c)} style={s.codeCard}>
            <Brand brand={platformBrand(c.platform)} size={48} radius={14} />
            <View style={s.codeMeta}>
              <Text style={s.code} numberOfLines={1}>{c.code || c.title}</Text>
              <Text style={s.codeSub} numberOfLines={1}>{c.platform?.name} · {discountText(c)}</Text>
              <View style={s.pills}>
                {c.minimum_order != null ? (
                  <Pill bg={T.bg} fg={T.sub} textStyle={s.pillText}>Min. {money(c.minimum_order)}</Pill>
                ) : null}
                {left ? (
                  <Pill bg={T.bg} fg={T.sub} textStyle={s.pillText}>
                    <Icon name="clock" s={12} c={T.faint} />
                    <Text style={s.pillText}>{left}</Text>
                  </Pill>
                ) : null}
              </View>
            </View>
            <Icon name="chevR" s={19} c={T.faint} sw={2.2} />
          </Card>
        );
      })}
    </View>
  );
}

// ── ÖZEL MENÜLER segment — platform-exclusive bundles, grouped by restaurant ──
function SpecialMenusView({ groups }) {
  const navigation = useNavigation();
  const [q, setQ] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [plat, setPlat] = useState('all');
  const [cat, setCat] = useState('all');

  // Platform chip dot colours come from live hex_color (Getir absent → no dot).
  const platHex = useMemo(() => {
    const m = {};
    for (const g of groups) for (const b of g.bundles) {
      const k = platformKey(b.platform?.name);
      if (b.platform?.hex_color && !m[k]) m[k] = b.platform.hex_color;
    }
    return m;
  }, [groups]);
  const platformOptions = useMemo(
    () => SM_PLATFORMS.map((o) => ({ ...o, color: o.id !== 'all' ? platHex[o.id] || null : null })),
    [platHex],
  );

  // Kategori options built dynamically from the distinct category values that
  // are ACTUALLY present in the live bundles — every chip maps to real data.
  const catOptions = useMemo(() => {
    const seen = [];
    for (const g of groups) for (const b of g.bundles) {
      if (b.category && !seen.includes(b.category)) seen.push(b.category);
    }
    return [{ id: 'all', label: 'Tüm kategoriler' }, ...seen.map((c) => ({ id: c, label: c }))];
  }, [groups]);

  const ql = q.trim().toLocaleLowerCase('tr');
  const filtered = useMemo(() => groups.map((g) => {
    const bundles = g.bundles.filter((b) => {
      if (plat !== 'all' && platformKey(b.platform?.name) !== plat) return false;
      if (cat !== 'all' && b.category !== cat) return false;
      if (ql && !(
        String(g.restaurant_name).toLocaleLowerCase('tr').includes(ql) ||
        String(b.name).toLocaleLowerCase('tr').includes(ql)
      )) return false;
      return true;
    });
    return { ...g, bundles };
  }).filter((g) => g.bundles.length > 0), [groups, plat, cat, ql]);

  const activeFilters = (plat !== 'all' ? 1 : 0) + (cat !== 'all' ? 1 : 0);
  const clearAll = () => { setQ(''); setPlat('all'); setCat('all'); };

  // No live bundles at all → the honest empty state.
  if (groups.length === 0) {
    return (
      <View style={s.emptyWrap}>
        <Image source={require('../../assets/mascot.png')} style={s.mascot} resizeMode="contain" />
        <Text style={s.emptyTitle}>Şu an özel menü yok</Text>
        <Text style={s.emptyDesc}>Restoranlar platforma özel menüler eklediğinde burada göreceksin. Bu sırada kodlara göz at.</Text>
        <Pressable onPress={() => navigation.navigate('Compare')} style={s.emptyBtn}>
          <Text style={s.emptyBtnText}>Restoranları keşfet</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={s.smBody}>
      {/* search + filter toggle */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Icon name="search" s={19} c={T.faint} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Restoran veya menü ara…"
            placeholderTextColor={T.faint}
            style={s.searchInput}
            autoCorrect={false}
            returnKeyType="search"
          />
          {q.length > 0 ? (
            <Pressable hitSlop={8} onPress={() => setQ('')}><Icon name="x" s={16} c={T.faint} /></Pressable>
          ) : null}
        </View>
        <Pressable
          onPress={() => setShowFilters((v) => !v)}
          style={[s.filterBtn, { backgroundColor: showFilters || activeFilters ? T.navy : T.white }]}
        >
          <Icon name="filter" s={20} c={showFilters || activeFilters ? '#fff' : T.ink} />
          {activeFilters ? <View style={s.filterBadge} /> : null}
        </Pressable>
      </View>

      {/* filter panel */}
      {showFilters ? (
        <View style={s.filterPanel}>
          <FilterRow label="Platform" options={platformOptions} value={plat} onPick={setPlat} platform />
          <View style={{ height: 12 }} />
          <FilterRow label="Kategori" options={catOptions} value={cat} onPick={setCat} />
        </View>
      ) : null}

      <Text style={s.smIntro}>
        Yalnızca tek bir platformda bulunan özel menüler. <Text style={s.smIntroFaint}>Nereden alacağını rozet gösterir.</Text>
      </Text>

      {filtered.length === 0 ? (
        <View style={s.noResult}>
          <Text style={s.noResultTitle}>Sonuç bulunamadı</Text>
          <Text style={s.noResultSub}>Arama veya filtreleri değiştirmeyi dene.</Text>
          <Pressable onPress={clearAll} style={s.clearBtn}><Text style={s.clearBtnText}>Filtreleri temizle</Text></Pressable>
        </View>
      ) : (
        <View style={{ gap: 26 }}>
          {filtered.map((g) => {
            const tile = restaurantTile({ name: g.restaurant_name });
            const food = tile.food;
            return (
              <View key={String(g.restaurant_id)}>
                <View style={s.groupHead}>
                  <View style={[s.groupTile, { backgroundColor: tile.bg }]}><Food name={food} s={22} /></View>
                  <Text style={s.groupName} numberOfLines={1}>{g.restaurant_name}</Text>
                  <Text style={s.groupCount}>{g.bundles.length} özel menü</Text>
                </View>
                <View style={{ gap: 12 }}>
                  {g.bundles.map((b) => <BundleCard key={String(b.id)} bundle={b} food={food} />)}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function FilterRow({ label, options, value, onPick, platform }) {
  return (
    <View>
      <Text style={s.filterLabel}>{label}</Text>
      <View style={s.chipWrap}>
        {options.map((o) => {
          const on = value === o.id;
          const dot = platform && o.id !== 'all' ? o.color : null;
          return (
            <Pressable key={o.id} onPress={() => onPick(o.id)} style={[s.chip, on && s.chipOn]}>
              {dot ? <View style={[s.chipDot, { backgroundColor: dot }]} /> : null}
              <Text style={[s.chipText, on ? s.chipTextOn : s.chipTextOff]} numberOfLines={1}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function BundleCard({ bundle, food }) {
  const b = platformBrand(bundle.platform);
  return (
    <Card pad={0} style={s.bundleCard}>
      <View style={s.bundleBody}>
        {/* platform badge + plain price (no comparison, no savings) */}
        <View style={s.bundleTop}>
          <PlatformBadge platform={bundle.platform} />
          <Text style={s.bundlePrice}>{money(bundle.price)}</Text>
        </View>
        <View style={s.bundleNameRow}>
          <View style={s.bundleFoodTile}><Food name={food} s={34} /></View>
          <Text style={s.bundleName}>{bundle.name}</Text>
        </View>
      </View>
      {/* exclusivity footer */}
      <View style={s.bundleFooter}>
        <View style={[s.checkDot, { backgroundColor: b.bg }]}><Icon name="check" s={11} c="#fff" sw={3.2} /></View>
        <Text style={s.footerText}>Yalnızca <Text style={[s.footerStrong, { color: b.bg }]}>{bundle.platform?.name}</Text>'de</Text>
      </View>
    </Card>
  );
}

// prominent platform badge — colour + label come straight from the live platform
function PlatformBadge({ platform }) {
  const b = platformBrand(platform);
  return (
    <View style={[s.platBadge, { backgroundColor: b.bg }]}>
      <View style={s.platShort}><Text style={[s.platShortText, { color: b.fg }]}>{b.short}</Text></View>
      <Text style={[s.platName, { color: b.fg }]} numberOfLines={1}>{platform?.name}</Text>
    </View>
  );
}

// ── segmented control ──
function Segmented({ value, onChange, options }) {
  return (
    <View style={s.seg}>
      {options.map((o) => {
        const on = value === o.id;
        return (
          <Pressable key={o.id} onPress={() => onChange(o.id)} style={[s.segBtn, on && s.segBtnOn]}>
            <Text style={[s.segLabel, on ? s.segLabelOn : s.segLabelOff]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: T.bg },
  scroll:    { paddingBottom: 110 },
  segWrap:   { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 4 },
  segBody:   { paddingHorizontal: 20, paddingTop: 12 },
  smBody:    { paddingHorizontal: 20, paddingTop: 12 },

  // segmented
  seg:        { flexDirection: 'row', backgroundColor: T.white, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: T.line2 },
  segBtn:     { flex: 1, paddingVertical: 11, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  segBtnOn:   { backgroundColor: T.navy },
  segLabel:   { fontSize: 14, fontFamily: font.extrabold, letterSpacing: -0.14 },
  segLabelOn: { color: '#fff' },
  segLabelOff:{ color: T.sub },

  // codes
  hint:      { fontSize: 12.5, fontFamily: font.bold, color: T.faint, marginBottom: 12, paddingLeft: 2 },
  codeCard:  { flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 12 },
  codeMeta:  { flex: 1, minWidth: 0 },
  code:      { fontSize: 15, fontFamily: font.extrabold, color: T.ink, letterSpacing: 0.3 },
  codeSub:   { fontSize: 12.5, fontFamily: font.semibold, color: T.sub, marginTop: 2 },
  pills:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 9 },
  pillText:  { fontSize: 11, fontFamily: font.bold, color: T.sub },

  // search + filter
  searchRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchBox:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: T.white, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: T.line2 },
  searchInput: { flex: 1, fontFamily: font.semibold, fontSize: 14, color: T.ink, paddingVertical: 13 },
  filterBtn:   { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  filterBadge: { position: 'absolute', top: 8, right: 8, width: 9, height: 9, borderRadius: 999, backgroundColor: T.coral, borderWidth: 2, borderColor: T.white },

  filterPanel: { marginTop: 12, backgroundColor: T.white, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: T.line },
  filterLabel: { fontSize: 11, fontFamily: font.extrabold, letterSpacing: 1.3, textTransform: 'uppercase', color: T.faint, marginBottom: 9 },
  chipWrap:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:        { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 8, paddingHorizontal: 13, borderRadius: 999, backgroundColor: T.bg },
  chipOn:      { backgroundColor: T.navy },
  chipDot:     { width: 9, height: 9, borderRadius: 999 },
  chipText:    { fontSize: 13, fontFamily: font.bold },
  chipTextOn:  { color: '#fff' },
  chipTextOff: { color: T.sub },

  smIntro:      { fontSize: 12.5, fontFamily: font.semibold, color: T.sub, marginVertical: 16, paddingLeft: 2, lineHeight: 18 },
  smIntroFaint: { color: T.faint },

  // restaurant group
  groupHead:  { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 12, paddingLeft: 2 },
  groupTile:  { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  groupName:  { fontSize: 16, fontFamily: font.extrabold, color: T.ink, letterSpacing: -0.16, flexShrink: 1 },
  groupCount: { fontSize: 12, fontFamily: font.bold, color: T.faint, marginLeft: 'auto' },

  // bundle card
  bundleCard:     { padding: 0, overflow: 'hidden' },
  bundleBody:     { paddingHorizontal: 16, paddingTop: 15, paddingBottom: 14 },
  bundleTop:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  bundlePrice:    { fontSize: 21, fontFamily: font.extrabold, color: T.ink, letterSpacing: -0.4 },
  bundleNameRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 13 },
  bundleFoodTile: { width: 46, height: 46, borderRadius: 13, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' },
  bundleName:     { flex: 1, minWidth: 0, fontSize: 14.5, fontFamily: font.bold, color: T.ink, lineHeight: 19, letterSpacing: -0.14, paddingTop: 2 },
  bundleFooter:   { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: T.bg, borderTopWidth: 1, borderTopColor: T.line },
  checkDot:       { width: 18, height: 18, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  footerText:     { fontSize: 12, fontFamily: font.bold, color: T.sub },
  footerStrong:   { fontFamily: font.extrabold },

  // platform badge
  platBadge:     { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 10, paddingVertical: 7, paddingLeft: 8, paddingRight: 12, alignSelf: 'flex-start', flexShrink: 1 },
  platShort:     { width: 20, height: 20, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  platShortText: { fontSize: 10, fontFamily: font.extrabold },
  platName:      { fontSize: 13, fontFamily: font.extrabold, letterSpacing: -0.13, flexShrink: 1 },

  // states
  center:    { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  empty:     { fontSize: 14, fontFamily: font.semibold, color: T.faint },
  errText:   { fontSize: 14, fontFamily: font.semibold, color: T.coral, textAlign: 'center' },
  retry:     { marginTop: 14, paddingVertical: 10, paddingHorizontal: 22 },
  retryText: { fontSize: 14, fontFamily: font.bold, color: T.blue },

  noResult:      { paddingTop: 36, alignItems: 'center' },
  noResultTitle: { fontSize: 15, fontFamily: font.extrabold, color: T.ink },
  noResultSub:   { fontSize: 13, fontFamily: font.semibold, color: T.sub, marginTop: 6 },
  clearBtn:      { marginTop: 16, backgroundColor: T.blueSoft, paddingVertical: 11, paddingHorizontal: 18, borderRadius: 12 },
  clearBtnText:  { fontSize: 13.5, fontFamily: font.extrabold, color: T.blue },

  emptyWrap:    { paddingTop: 56, paddingHorizontal: 36, alignItems: 'center' },
  mascot:       { width: 104, height: 104, marginBottom: 22 },
  emptyTitle:   { fontSize: 18, fontFamily: font.extrabold, color: T.ink, letterSpacing: -0.18 },
  emptyDesc:    { fontSize: 13.5, fontFamily: font.semibold, color: T.sub, marginTop: 8, lineHeight: 20, textAlign: 'center', maxWidth: 250 },
  emptyBtn:     { marginTop: 22, backgroundColor: T.blueSoft, paddingVertical: 13, paddingHorizontal: 22, borderRadius: 14 },
  emptyBtnText: { fontSize: 14, fontFamily: font.extrabold, color: T.blue },
});
