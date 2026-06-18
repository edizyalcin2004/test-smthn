// SearchScreen — navy/gold rebuild, wired live.
// Lists the in-scope restaurants (McDonald's + Burger King) from /restaurants;
// the search box filters that list client-side. No fabricated ratings — the
// backend returns none, so we show a chevron instead.
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { T, font } from '../../theme/tokens';
import { Screen, Card, Header, SectionHead, Brand, RoundBtn } from '../../components/ui';
import { Icon } from '../../components/icons';
import Food from '../../components/Food';
import { restaurantBrand } from '../../lib/brand';
import { getRestaurants } from '../../api/client';

// Scope guard: McDonald's + Burger King only (Komagene and anything else hidden).
const inScope = (r) => {
  const n = String(r?.name || '').toLowerCase();
  return n.includes('mcdonald') || n.includes('burger king');
};

// Decorative glyph for a real cuisine_type label (no invented cuisines).
const cuisineFood = (c) => {
  const n = String(c).toLowerCase();
  if (n.includes('tavuk') || n.includes('chicken')) return 'chicken';
  if (n.includes('pizza'))   return 'pizza';
  if (n.includes('döner') || n.includes('doner')) return 'wrap';
  if (n.includes('tatlı') || n.includes('dessert')) return 'donut';
  if (n.includes('kahve') || n.includes('coffee'))  return 'coffee';
  return 'burger'; // burger / fast food
};

export default function SearchScreen({ navigation }) {
  const [all, setAll]         = useState([]);
  const [q, setQ]             = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const mounted               = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRestaurants();
      if (mounted.current) setAll((data || []).filter(inScope));
    } catch {
      if (mounted.current) setError('Restoranlar yüklenemedi. Bağlantını kontrol et.');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return all;
    return all.filter((r) =>
      String(r.name).toLowerCase().includes(needle) ||
      String(r.cuisine_type || '').toLowerCase().includes(needle));
  }, [all, q]);

  // Distinct real cuisine_type values from in-scope restaurants — no invented
  // categories. McD + BK both report "Fast Food", so this yields one tile.
  const cuisines = useMemo(() => {
    const seen = new Map();
    for (const r of all) {
      const c = r.cuisine_type;
      if (c && !seen.has(c)) seen.set(c, cuisineFood(c));
    }
    return [...seen.entries()].map(([label, food]) => ({ label, food }));
  }, [all]);

  const pick = useCallback((r) => navigation.navigate('Menu', { restaurant: r }), [navigation]);

  return (
    <Screen>
      <Header title="Restoran veya mutfak ara" />

      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Icon name="search" s={19} c={T.faint} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Restoran, yemek veya mutfak…"
            placeholderTextColor={T.faint}
            style={s.input}
            autoCorrect={false}
            returnKeyType="search"
          />
          {q.length > 0 ? (
            <Pressable hitSlop={8} onPress={() => setQ('')}><Icon name="x" s={16} c={T.faint} /></Pressable>
          ) : null}
        </View>
        <RoundBtn size={48} bg={T.white} style={s.filterBtn}><Icon name="filter" s={20} c={T.ink} /></RoundBtn>
      </View>

      <View style={s.section}>
        <SectionHead title="Yakındaki restoranlar" />
        {loading ? (
          <Card style={s.stateCard}><ActivityIndicator color={T.blue} /></Card>
        ) : error ? (
          <Card style={s.stateCard}>
            <Text style={s.errText}>{error}</Text>
            <Pressable onPress={load} style={s.retry}><Text style={s.retryText}>Tekrar dene</Text></Pressable>
          </Card>
        ) : list.length === 0 ? (
          <Card style={s.stateCard}><Text style={s.empty}>Sonuç bulunamadı</Text></Card>
        ) : (
          <Card pad={0}>
            {list.map((r, i) => (
              <Pressable
                key={String(r.id)}
                onPress={() => pick(r)}
                style={({ pressed }) => [s.row, i ? s.rowBorder : null, pressed && s.rowPressed]}
              >
                <Brand brand={restaurantBrand(r)} size={46} radius={13} />
                <View style={s.rowMeta}>
                  <Text style={s.rowName} numberOfLines={1}>{r.name}</Text>
                  {r.cuisine_type ? <Text style={s.rowSub} numberOfLines={1}>{r.cuisine_type}</Text> : null}
                </View>
                <Icon name="chevR" s={18} c={T.faint} sw={2.2} />
              </Pressable>
            ))}
          </Card>
        )}
      </View>

      {!loading && !error && cuisines.length > 0 ? (
        <View style={s.section}>
          <SectionHead title="Mutfaklar" />
          <View style={s.cuisineGrid}>
            {cuisines.map((c) => (
              <View key={c.label} style={s.cuisineTile}>
                <View style={s.cuisineIcon}><Food name={c.food} s={34} /></View>
                <Text style={s.cuisineLabel} numberOfLines={1}>{c.label}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  searchRow:  { paddingHorizontal: 20, paddingTop: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchBox:  {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: T.white, borderRadius: 14, paddingHorizontal: 14,
    borderWidth: 1, borderColor: T.line2,
  },
  filterBtn:  { borderRadius: 14 },
  input:      { flex: 1, fontFamily: font.semibold, fontSize: 14, color: T.ink, paddingVertical: 13 },

  section:    { paddingHorizontal: 20, paddingTop: 24 },

  row:        { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13, paddingHorizontal: 16 },
  rowBorder:  { borderTopWidth: 1, borderTopColor: T.line },
  rowPressed: { opacity: 0.6 },
  rowMeta:    { flex: 1, minWidth: 0 },
  rowName:    { fontSize: 15, fontFamily: font.extrabold, color: T.ink },
  rowSub:     { fontSize: 12.5, fontFamily: font.semibold, color: T.sub, marginTop: 2 },

  cuisineGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cuisineTile:  { width: '22%', alignItems: 'center' },
  cuisineIcon:  { width: '100%', aspectRatio: 1, backgroundColor: T.white, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.line },
  cuisineLabel: { fontSize: 11.5, fontFamily: font.bold, color: T.sub, marginTop: 8 },

  stateCard:  { alignItems: 'center', paddingVertical: 28 },
  empty:      { fontSize: 13.5, fontFamily: font.semibold, color: T.faint },
  errText:    { fontSize: 13.5, fontFamily: font.semibold, color: T.coral, textAlign: 'center' },
  retry:      { marginTop: 12, paddingVertical: 8, paddingHorizontal: 18 },
  retryText:  { fontSize: 14, fontFamily: font.bold, color: T.blue },
});
