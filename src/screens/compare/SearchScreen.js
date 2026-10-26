// SearchScreen — Doybi redesign PR 2 (design 02 "Bir lezzet bulalım").
// Lists every restaurant /restaurants returns (the backend already hides inert
// and still-onboarding ones), most-covered first. Search and the food chips
// filter client-side. Food art is our own generic illustration, never a
// restaurant's product photo; no ratings are shown because none exist.
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { T, font } from '../../theme/tokens';
import { Screen, Chip, Title, PrimaryButton } from '../../components/ui';
import { Icon } from '../../components/icons';
import { FoodArt, Mascot, foodType } from '../../components/Art';
import { getRestaurants } from '../../api/client';
import { track } from '../../lib/telemetry';

// Platforms no longer scraped; their old rows must not count as coverage.
const RETIRED = new Set(['Getir Yemek']);
// Never shown even if a stale build of the backend returns it (inert POC).
const HIDDEN_SLUGS = new Set(['komagene']);

const CHIPS = [
  { value: 'all', label: 'Tümü' },
  { value: 'burger', label: 'Burger' },
  { value: 'pizza', label: 'Pizza' },
  { value: 'chicken', label: 'Tavuk' },
  { value: 'wrap', label: 'Dürüm' },
];

const fold = (v) => String(v || '').toLocaleLowerCase('tr-TR');

export default function SearchScreen({ navigation, route }) {
  const [all, setAll]         = useState([]);
  const [q, setQ]             = useState('');
  const [type, setType]       = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  // Keşfet's food shortcuts open this list pre-filtered (`focus` makes a repeat
  // tap on the same shortcut apply again).
  useEffect(() => {
    const t = route?.params?.type;
    if (t && CHIPS.some((c) => c.value === t)) { setType(t); setQ(''); }
  }, [route?.params?.type, route?.params?.focus]);
  const mounted               = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);
  const cardW = Math.floor((useWindowDimensions().width - 40 - 12) / 2);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRestaurants();
      const rows = (data || []).filter((r) => !HIDDEN_SLUGS.has(r.slug)).map((r) => {
        const names = new Set();
        for (const it of r.menu_items || []) for (const p of it.prices || []) {
          if (p.platform?.name && !RETIRED.has(p.platform.name)) names.add(p.platform.name);
        }
        return { ...r, platformCount: names.size, food: foodType(`${r.name} ${r.cuisine_type || ''}`) };
      }).sort((a, b) => b.platformCount - a.platformCount || a.name.localeCompare(b.name, 'tr'));
      if (mounted.current) setAll(rows);
    } catch {
      if (mounted.current) setError(true);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const list = useMemo(() => {
    const needle = fold(q.trim());
    return all.filter((r) =>
      (type === 'all' || r.food === type) &&
      (!needle || fold(r.name).includes(needle) || fold(r.cuisine_type).includes(needle)));
  }, [all, q, type]);

  const pick = useCallback((r) => {
    track({ event_name: 'restaurant_view', restaurant_id: r.id, source: 'search' });
    navigation.navigate('Menu', { restaurant: r });
  }, [navigation]);

  // T-027: a settled search (1.5s after typing stops); zero results = unserved demand.
  useEffect(() => {
    const needle = q.trim();
    if (needle.length < 2 || loading) return undefined;
    const t = setTimeout(() => track({ event_name: 'search', query: needle.slice(0, 80), result_count: list.length }), 1500);
    return () => clearTimeout(t);
  }, [q, list.length, loading]);

  const clear = () => { setQ(''); setType('all'); };

  return (
    <Screen>
      <View style={s.head}>
        <Title accent="bulalım.">Bir lezzet</Title>
        <Text style={s.lead}>Restoranını seç, platform fiyatlarını karşılaştır.</Text>
      </View>

      <View style={s.searchBox}>
        <Icon name="search" s={20} c={T.ink} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Restoran veya mutfak ara"
          placeholderTextColor={T.sub}
          style={s.input}
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Restoran ara"
        />
        {q.length > 0 ? (
          <Pressable hitSlop={10} onPress={() => setQ('')} accessibilityLabel="Aramayı temizle"><Icon name="x" s={16} c={T.sub} /></Pressable>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
        {CHIPS.map((c) => <Chip key={c.value} label={c.label} active={type === c.value} onPress={() => setType(c.value)} />)}
      </ScrollView>

      <View style={s.section}>
        <View style={s.sectionHead}>
          <Text style={s.sectionTitle}>Restoranlar</Text>
          {!loading && !error ? <Text style={s.sectionCount}>{list.length}</Text> : null}
        </View>

        {loading ? (
          <View style={s.state}><Mascot pose="deal-search" size={110} /><Text style={s.stateTitle}>Restoranlar yükleniyor…</Text><ActivityIndicator color={T.ink} style={{ marginTop: 10 }} /></View>
        ) : error ? (
          <View style={s.state}>
            <Mascot pose="no-results" size={110} />
            <Text style={s.stateTitle}>Restoranlar şu an yüklenemedi.</Text>
            <Text style={s.stateText}>Bağlantını kontrol edip tekrar dene.</Text>
            <PrimaryButton onPress={load} style={s.stateBtn}>Tekrar dene</PrimaryButton>
          </View>
        ) : list.length === 0 ? (
          <View style={s.state}>
            <Mascot pose="no-results" size={110} />
            <Text style={s.stateTitle}>Bununla eşleşen restoran yok.</Text>
            <Text style={s.stateText}>Başka bir ad dene ya da filtreyi kaldır.</Text>
            <PrimaryButton onPress={clear} bg={T.white} fg={T.ink} style={[s.stateBtn, s.ghost]}>Filtreleri temizle</PrimaryButton>
          </View>
        ) : (
          <View style={s.grid}>
            {list.map((r) => (
              <Pressable
                key={String(r.id)}
                onPress={() => pick(r)}
                style={({ pressed }) => [s.card, { width: cardW }, pressed && { opacity: 0.85 }]}
                accessibilityRole="button"
                accessibilityLabel={`${r.name}, ${r.platformCount} platform`}
              >
                <FoodArt type={r.food} size={cardW} height={Math.round(cardW * 0.62)} round={false} radius={0} />
                <View style={s.cardBody}>
                  <Text style={s.cardName} numberOfLines={1}>{r.name}</Text>
                  <View style={s.cardFoot}>
                    <Text style={s.cardSub} numberOfLines={1}>
                      {r.platformCount > 1 ? `${r.platformCount} platform` : 'Menüyü incele'}
                    </Text>
                    <Icon name="arrow" s={16} c={T.ink} sw={1.8} />
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
        {!loading && !error && list.length ? (
          <View style={s.note}>
            <Icon name="help" s={15} c={T.sub} />
            <Text style={s.noteText}>Görseller temsilidir. Fiyatlar platformların herkese açık sayfalarından okunur.</Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  head:        { paddingHorizontal: 20, paddingTop: 10 },
  lead:        { fontSize: 14, fontFamily: font.regular, color: T.sub, marginTop: 8 },
  searchBox:   { marginHorizontal: 20, marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 12,
                 backgroundColor: '#EDEDE6', borderRadius: 16, paddingHorizontal: 16 },
  input:       { flex: 1, fontFamily: font.regular, fontSize: 15, color: T.ink, paddingVertical: 14 },
  chips:       { paddingHorizontal: 20, paddingTop: 16, gap: 8 },

  section:     { paddingHorizontal: 20, paddingTop: 26 },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle:{ fontSize: 19, fontFamily: font.bold, color: T.ink, letterSpacing: -0.5 },
  sectionCount:{ fontSize: 12, fontFamily: font.medium, color: T.sub },

  grid:        { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  card:        { backgroundColor: T.white, borderRadius: 16, borderWidth: 1, borderColor: T.line, overflow: 'hidden' },
  cardBody:    { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12 },
  cardName:    { fontSize: 15, fontFamily: font.bold, color: T.ink, letterSpacing: -0.3 },
  cardFoot:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 },
  cardSub:     { fontSize: 12.5, fontFamily: font.regular, color: T.sub, flexShrink: 1 },

  state:       { alignItems: 'center', paddingVertical: 26, paddingHorizontal: 10 },
  stateTitle:  { fontSize: 19, fontFamily: font.medium, color: T.ink, marginTop: 14, textAlign: 'center', letterSpacing: -0.4 },
  stateText:   { fontSize: 13.5, fontFamily: font.regular, color: T.sub, marginTop: 6, textAlign: 'center' },
  stateBtn:    { marginTop: 18, width: 'auto', paddingHorizontal: 26 },
  ghost:       { borderWidth: 1, borderColor: T.line },

  note:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18 },
  noteText:    { flex: 1, fontSize: 12, fontFamily: font.regular, color: T.sub, lineHeight: 17 },
});
