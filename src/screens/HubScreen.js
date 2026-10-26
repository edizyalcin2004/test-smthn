// HubScreen — Keşfet (redesign PR 4, design 01), wired live.
// Food shortcuts open the restaurant list pre-filtered; the two restaurants
// sold on the most platforms are shown first; "Günün kodları" lists the
// soonest-expiring live codes (an urgency order, never a "best discount" rank).
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet, useWindowDimensions } from 'react-native';
import { PressScale } from '../lib/motion';
import { T, font, money } from '../theme/tokens';
import { Screen, Title, PrimaryButton } from '../components/ui';
import { Icon } from '../components/icons';
import { FoodArt, Mascot, foodType } from '../components/Art';
import { getDiscountCodes, getRestaurants } from '../api/client';
import { useCodeSheet } from '../components/CodeSheet';

const RETIRED = new Set(['Getir Yemek']);
const FOODS = [['burger', 'Burger'], ['pizza', 'Pizza'], ['chicken', 'Tavuk'], ['wrap', 'Dürüm']];
const num = (v) => Number(v ?? 0);
const discountText = (c) =>
  c.discount_type === 'percentage' ? `%${num(c.discount_value)} indirim` : `${money(num(c.discount_value))} indirim`;

function timeLeft(expiry) {
  if (!expiry) return null;
  const ms = new Date(expiry).getTime() - Date.now();
  if (isNaN(ms)) return null;
  if (ms <= 0) return 'Süresi doldu';
  const days = Math.floor(ms / 86400000);
  if (days >= 1) return `${days} gün kaldı`;
  const hrs = Math.floor(ms / 3600000);
  return hrs >= 1 ? `${hrs} saat kaldı` : `${Math.max(1, Math.floor(ms / 60000))} dk kaldı`;
}

export default function HubScreen({ navigation }) {
  const { openCode } = useCodeSheet();
  const { width } = useWindowDimensions();
  const cardW = Math.floor((width - 40 - 12) / 2);
  const [codes, setCodes]     = useState([]);
  const [rests, setRests]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const mounted               = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [c, r] = await Promise.all([getDiscountCodes(), getRestaurants()]);
      if (!mounted.current) return;
      setCodes((c || []).filter((x) => !RETIRED.has(x.platform?.name)));
      setRests((r || []).filter((x) => x.slug !== 'komagene').map((x) => {
        const names = new Set();
        for (const it of x.menu_items || []) for (const p of it.prices || []) if (p.platform?.name && !RETIRED.has(p.platform.name)) names.add(p.platform.name);
        return { ...x, platformCount: names.size };
      }).sort((a, b) => b.platformCount - a.platformCount || a.name.localeCompare(b.name, 'tr')));
    } catch {
      if (mounted.current) setError(true);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const top = useMemo(() => {
    const ts = (c) => { const d = c.expiry_date ? new Date(c.expiry_date).getTime() : NaN; return isNaN(d) ? Infinity : d; };
    return [...codes].sort((a, b) => ts(a) - ts(b)).slice(0, 5);
  }, [codes]);

  const toSearch = (params) => navigation.navigate('Compare', { screen: 'Search', params });
  const toMenu = (r) => navigation.navigate('Compare', { screen: 'Menu', params: { restaurant: r }, initial: false });

  return (
    <Screen>
      <View style={s.head}>
        <Title accent="çekiyor?">Canın ne</Title>
        <Text style={s.lead}>Seç, karşılaştır, doy.</Text>
      </View>

      <Pressable onPress={() => toSearch({ type: 'all', focus: Date.now() })} style={s.searchBox} accessibilityRole="search">
        <Icon name="search" s={20} c={T.ink} />
        <Text style={s.searchText}>Restoran veya mutfak ara</Text>
      </Pressable>

      <View style={s.foods}>
        {FOODS.map(([type, label]) => (
          <PressScale key={type} onPress={() => toSearch({ type, focus: Date.now() })} style={s.food} accessibilityRole="button" accessibilityLabel={label}>
            <FoodArt type={type} size={62} />
            <Text style={s.foodLabel}>{label}</Text>
          </PressScale>
        ))}
      </View>

      <View style={s.section}>
        <SectionHead title="Restoranları keşfet" onAll={() => toSearch({ type: 'all', focus: Date.now() })} />
        {loading ? (
          <View style={s.state}><ActivityIndicator color={T.ink} /></View>
        ) : error ? (
          <View style={s.state}>
            <Mascot pose="no-results" size={96} />
            <Text style={s.stateTitle}>Veriler şu an yüklenemedi.</Text>
            <PrimaryButton onPress={load} style={s.stateBtn}>Tekrar dene</PrimaryButton>
          </View>
        ) : (
          <View style={s.grid}>
            {rests.slice(0, 2).map((r) => (
              <PressScale key={String(r.id)} onPress={() => toMenu(r)} style={[s.card, { width: cardW }]} accessibilityRole="button">
                <FoodArt type={foodType(`${r.name} ${r.cuisine_type || ''}`)} size={cardW} height={Math.round(cardW * 0.62)} round={false} radius={0} />
                <View style={s.cardBody}>
                  <Text style={s.cardName} numberOfLines={1}>{r.name}</Text>
                  <View style={s.cardFoot}>
                    <Text style={s.cardSub}>{r.platformCount > 1 ? `${r.platformCount} platform` : 'Menüyü incele'}</Text>
                    <Icon name="arrow" s={16} c={T.ink} />
                  </View>
                </View>
              </PressScale>
            ))}
          </View>
        )}
      </View>

      <PressScale onPress={() => toSearch({ type: 'all', focus: Date.now() })} style={s.callout} accessibilityRole="button">
        <View style={{ flex: 1 }}>
          <Text style={s.calloutEyebrow}>AYNI LEZZET, FARKLI FİYATLAR</Text>
          <Title accent="karşılaştır." style={s.calloutTitle}>Önce</Title>
          <View style={s.calloutLink}>
            <Text style={s.calloutLinkText}>Menüleri keşfet</Text>
            <Icon name="arrow" s={16} c={T.ink} />
          </View>
        </View>
        <Mascot pose="deal-search" size={120} />
      </PressScale>

      <View style={s.section}>
        <SectionHead title="Günün kodları" onAll={() => navigation.navigate('Deals')} />
        {loading ? null : top.length === 0 ? (
          <Text style={s.empty}>{error ? '' : 'Şu an aktif kod yok.'}</Text>
        ) : top.map((c) => (
          <PressScale key={String(c.id)} onPress={() => openCode(c)} style={s.code} accessibilityRole="button">
            <View style={s.codeIcon}><Icon name="tag" s={20} c={T.ink} /></View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.codeText} numberOfLines={1}>{c.code || c.title}</Text>
              <Text style={s.codeSub} numberOfLines={1}>{c.platform?.name} · {discountText(c)}</Text>
            </View>
            {timeLeft(c.expiry_date) ? <Text style={s.codeLeft}>{timeLeft(c.expiry_date)}</Text> : null}
          </PressScale>
        ))}
      </View>
    </Screen>
  );
}

function SectionHead({ title, onAll }) {
  return (
    <View style={s.sectionHead}>
      <Text style={s.sectionTitle}>{title}</Text>
      <Pressable onPress={onAll} style={s.all} hitSlop={8}>
        <Text style={s.allText}>Tümü</Text>
        <Icon name="arrow" s={16} c={T.ink} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  head:        { paddingHorizontal: 20, paddingTop: 10 },
  lead:        { fontSize: 14, fontFamily: font.regular, color: T.sub, marginTop: 8 },
  searchBox:   { marginHorizontal: 20, marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#EDEDE6', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 15 },
  searchText:  { fontSize: 15, fontFamily: font.regular, color: T.sub },
  foods:       { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 28, marginTop: 18 },
  food:        { alignItems: 'center', gap: 8 },
  foodLabel:   { fontSize: 13, fontFamily: font.semibold, color: T.ink },

  section:     { paddingHorizontal: 20, marginTop: 26 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle:{ fontSize: 19, fontFamily: font.bold, color: T.ink, letterSpacing: -0.5 },
  all:         { flexDirection: 'row', alignItems: 'center', gap: 6 },
  allText:     { fontSize: 13.5, fontFamily: font.regular, color: T.ink },

  grid:        { flexDirection: 'row', justifyContent: 'space-between' },
  card:        { backgroundColor: T.white, borderRadius: 16, borderWidth: 1, borderColor: T.line, overflow: 'hidden' },
  cardBody:    { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12 },
  cardName:    { fontSize: 15, fontFamily: font.bold, color: T.ink, letterSpacing: -0.3 },
  cardFoot:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 },
  cardSub:     { fontSize: 12.5, fontFamily: font.regular, color: T.sub },

  callout:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1E6DA', borderRadius: 22, padding: 20, marginHorizontal: 20, marginTop: 20, overflow: 'hidden' },
  calloutEyebrow: { fontSize: 9.5, fontFamily: font.semibold, color: T.sub, letterSpacing: 1.6 },
  calloutTitle:   { fontSize: 28, lineHeight: 32, marginTop: 8 },
  calloutLink:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  calloutLinkText:{ fontSize: 13.5, fontFamily: font.medium, color: T.ink },

  code:        { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: T.white, borderRadius: 16, borderWidth: 1, borderColor: T.line, padding: 14, marginBottom: 10 },
  codeIcon:    { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF0C5', alignItems: 'center', justifyContent: 'center' },
  codeText:    { fontSize: 15, fontFamily: font.bold, color: T.ink },
  codeSub:     { fontSize: 12, fontFamily: font.regular, color: T.sub, marginTop: 2 },
  codeLeft:    { fontSize: 12, fontFamily: font.regular, color: T.sub },

  state:       { alignItems: 'center', paddingVertical: 20 },
  stateTitle:  { fontSize: 16, fontFamily: font.medium, color: T.ink, marginTop: 10 },
  stateBtn:    { marginTop: 14, width: 'auto', paddingHorizontal: 24 },
  empty:       { fontSize: 13.5, fontFamily: font.regular, color: T.sub },
});
