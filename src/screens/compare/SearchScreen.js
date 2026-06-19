// SearchScreen — navy/gold rebuild, wired live.
// Lists the in-scope restaurants (McDonald's + Burger King) from /restaurants;
// the search box filters that list client-side. No fabricated ratings — the
// backend returns none, so we show a chevron instead.
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { T, font } from '../../theme/tokens';
import { Screen, Card, Header, SectionHead, RoundBtn } from '../../components/ui';
import { Icon } from '../../components/icons';
import Food from '../../components/Food';
import { restaurantTile } from '../../lib/brand';
import { getRestaurants } from '../../api/client';

// Scope guard: McDonald's + Burger King only (Komagene and anything else hidden).
const inScope = (r) => {
  const n = String(r?.name || '').toLowerCase();
  return n.includes('mcdonald') || n.includes('burger king');
};

// Glyph for a REAL menu_items.category label. Returns null for promo/combo
// categories (Menüler, Coca-Cola Fırsat Menüleri, Happy Meal, Çocuk Menüleri…)
// that have no clean food type — those are skipped, never shown as junk tiles.
// Every glyph maps to a corrected icon from the swapped set (Fix 1).
const categoryFood = (c) => {
  const n = String(c).toLowerCase();
  if (n.includes('burger'))                          return 'burger';
  if (n.includes('dürüm') || n.includes('durum') || n.includes('wrap')) return 'wrap';
  if (n.includes('tavuk') || n.includes('chicken') || n.includes('nugget')) return 'chicken';
  if (n.includes('pizza'))                           return 'pizza';
  if (n.includes('kahve') || n.includes('coffee'))   return 'coffee';
  if (n.includes('çecek') || n.includes('icecek'))   return 'drink'; // İçecekler (Turkish İ→dotted i, match on çecek)
  if (n.includes('dondurma') || n.includes('ice'))   return 'ice-cream';
  if (n.includes('tatlı') || n.includes('tatli') || n.includes('dessert')) return 'cake';
  if (n.includes('sos'))                             return 'hot-sauce';
  if (n.includes('patates') || n.includes('atıştır') || n.includes('atistir') || n.includes('yan ürün') || n.includes('yan urun')) return 'fries';
  if (n.includes('salata') || n.includes('salad'))   return 'salad';
  if (n.includes('çorba') || n.includes('corba') || n.includes('soup')) return 'soup';
  if (n.includes('balık') || n.includes('balik') || n.includes('fish')) return 'fish';
  return null; // promo / combo / generic "Menüler" — no clean food type
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

  // Real menu_items.category values from in-scope restaurants, mapped to food
  // glyphs and deduped by glyph (one tile per food type; first real category
  // label that maps to it wins). Promo/combo categories that don't map to a
  // clean food type are skipped — no invented categories, no junk tiles.
  const categories = useMemo(() => {
    const byGlyph = new Map(); // glyph -> first real label
    for (const r of all) {
      for (const it of r.menu_items || []) {
        const food = categoryFood(it.category);
        if (food && !byGlyph.has(food)) byGlyph.set(food, it.category);
      }
    }
    return [...byGlyph.entries()].map(([food, label]) => ({ label, food }));
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
                {(() => { const t = restaurantTile(r); return (
                  <View style={[s.rTile, { backgroundColor: t.bg }]}><Food name={t.food} s={28} /></View>
                ); })()}
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

      {!loading && !error && categories.length > 0 ? (
        <View style={s.section}>
          <SectionHead title="Kategoriler" />
          <View style={s.cuisineGrid}>
            {categories.map((c) => (
              <View key={c.food} style={s.cuisineTile}>
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

  rTile:      { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
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
