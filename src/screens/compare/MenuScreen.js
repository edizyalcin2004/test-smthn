// MenuScreen — navy/gold rebuild, wired live. Reads /menu, builds a basket in
// Compare-level state, then POSTs /compare-basket and navigates to Results.
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, font, money } from '../../theme/tokens';
import { RoundBtn } from '../../components/ui';
import { Icon } from '../../components/icons';
import Food from '../../components/Food';
import { foodIconFor } from '../../lib/foodIcon';
import { getMenu, compareBasket } from '../../api/client';
import { useCompare } from '../CompareScreen';

const ALL = 'Tümü';

export default function MenuScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { restaurant: ctxRestaurant, setRestaurant, basket, setQty, setResults } = useCompare();
  const restaurant = route.params?.restaurant ?? ctxRestaurant;

  // Reconcile Compare-level restaurant with whatever we navigated in with
  // (covers both Search picks and CodeSheet deep-links). Resets basket on change.
  useEffect(() => {
    if (restaurant && (!ctxRestaurant || ctxRestaurant.id !== restaurant.id)) {
      setRestaurant(restaurant);
    }
  }, [restaurant, ctxRestaurant, setRestaurant]);

  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [comparing, setComparing] = useState(false);
  const [tab, setTab]           = useState(ALL);
  const [fav, setFav]           = useState(false);
  const mounted                 = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const load = useCallback(async () => {
    if (!restaurant) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getMenu(restaurant.id);
      if (mounted.current) setItems(data || []);
    } catch {
      if (mounted.current) setError('Menü yüklenemedi. Bağlantını kontrol et.');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [restaurant]);
  useEffect(() => { load(); }, [load]);

  const tabs = useMemo(() => {
    const cats = [];
    for (const it of items) {
      const c = it.category || 'Diğer';
      if (!cats.includes(c)) cats.push(c);
    }
    return [ALL, ...cats];
  }, [items]);

  const visible = useMemo(
    () => (tab === ALL ? items : items.filter((it) => (it.category || 'Diğer') === tab)),
    [items, tab],
  );

  const basketLines = useMemo(() => Object.values(basket), [basket]);
  const count = useMemo(() => basketLines.reduce((a, { qty }) => a + qty, 0), [basketLines]);
  const total = useMemo(
    () => basketLines.reduce((sum, { item, qty }) => sum + Number(item.price || 0) * qty, 0),
    [basketLines],
  );

  const compare = useCallback(async () => {
    if (!basketLines.length || !restaurant) return;
    setComparing(true);
    setError(null);
    try {
      // Response is already ranked by effective total ascending.
      const ranked = await compareBasket(
        restaurant.id,
        basketLines.map(({ item, qty }) => ({ id: item.id, name: item.name, qty })),
      );
      if (!mounted.current) return;
      setResults(ranked);
      navigation.navigate('Results');
    } catch {
      if (mounted.current) setError('Karşılaştırma başarısız. Bağlantını kontrol edip tekrar dene.');
    } finally {
      if (mounted.current) setComparing(false);
    }
  }, [basketLines, restaurant, navigation, setResults]);

  return (
    <View style={s.root}>
      {/* header */}
      <View style={[s.header, { paddingTop: insets.top + 4 }]}>
        <View style={s.headerLeft}>
          <RoundBtn onPress={() => navigation.goBack()} size={40}><Icon name="back" s={20} c={T.ink} /></RoundBtn>
          <Text style={s.title} numberOfLines={1}>{restaurant?.name ?? 'Menü'}</Text>
        </View>
        <RoundBtn onPress={() => setFav((f) => !f)} size={40}>
          <Icon name="heart" s={20} c={fav ? T.coral : T.ink} sw={fav ? 0 : 1.9} />
        </RoundBtn>
      </View>

      {/* category tabs */}
      {!loading && !error && items.length > 0 ? (
        <View style={s.tabsWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsRow}>
            {tabs.map((t) => {
              const active = t === tab;
              return (
                <Pressable key={t} onPress={() => setTab(t)} style={[s.tab, active && s.tabActive]}>
                  <Text style={[s.tabText, active && s.tabTextActive]} numberOfLines={1}>{t}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={T.blue} /></View>
      ) : error && items.length === 0 ? (
        <View style={s.center}>
          <Text style={s.errText}>{error}</Text>
          <Pressable onPress={load} style={s.retry}><Text style={s.retryText}>Tekrar dene</Text></Pressable>
        </View>
      ) : items.length === 0 ? (
        <View style={s.center}><Text style={s.empty}>Menü bulunamadı</Text></View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: count ? 160 : 110 }}
        >
          {visible.map((it, i) => {
            const qty = basket[it.id]?.qty ?? 0;
            return (
              <View key={String(it.id)} style={[s.itemRow, i < visible.length - 1 && s.itemBorder]}>
                <View style={s.thumb}><Food name={foodIconFor(it.name, it.category)} s={42} /></View>
                <View style={s.itemMeta}>
                  <Text style={s.itemName} numberOfLines={2}>{it.name}</Text>
                  {it.price != null ? <Text style={s.itemPrice}>{money(it.price)}</Text> : null}
                </View>
                <Stepper
                  qty={qty}
                  onMinus={() => setQty(it, qty - 1)}
                  onPlus={() => setQty(it, qty + 1)}
                />
              </View>
            );
          })}
        </ScrollView>
      )}

      {error && !loading && items.length > 0 ? <Text style={s.errBanner}>{error}</Text> : null}

      {/* compare bar */}
      {count > 0 && !loading ? (
        <View style={[s.barWrap, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            onPress={compare}
            disabled={comparing}
            style={({ pressed }) => [s.bar, (pressed || comparing) && s.barDim]}
          >
            <View style={s.barLeft}>
              <View style={s.barCount}><Text style={s.barCountText}>{count}</Text></View>
              <Text style={s.barLabel}>ürün · Sepeti karşılaştır</Text>
            </View>
            {comparing ? <ActivityIndicator color="#fff" /> : <Text style={s.barTotal}>{money(total)}</Text>}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function Stepper({ qty, onMinus, onPlus }) {
  if (qty === 0) {
    return (
      <Pressable onPress={onPlus} style={s.addBtn} hitSlop={6}>
        <Icon name="plus" s={18} c={T.blue} sw={2.4} />
      </Pressable>
    );
  }
  return (
    <View style={s.stepper}>
      <Pressable onPress={onMinus} style={s.stepMinus} hitSlop={6}><Icon name="minus" s={16} c={T.ink} sw={2.4} /></Pressable>
      <Text style={s.stepQty}>{qty}</Text>
      <Pressable onPress={onPlus} style={s.stepPlus} hitSlop={6}><Icon name="plus" s={16} c="#fff" sw={2.4} /></Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: T.bg },

  header:     { paddingHorizontal: 18, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  title:      { fontSize: 20, fontFamily: font.extrabold, color: T.ink, letterSpacing: -0.4, flexShrink: 1 },

  tabsWrap:   { paddingBottom: 12 },
  tabsRow:    { paddingHorizontal: 18, gap: 8 },
  tab:        { paddingVertical: 9, paddingHorizontal: 16, borderRadius: 999, backgroundColor: T.white, borderWidth: 1, borderColor: T.line2 },
  tabActive:  { backgroundColor: T.navy, borderColor: T.navy },
  tabText:    { fontSize: 13, fontFamily: font.bold, color: T.sub },
  tabTextActive: { color: '#fff' },

  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  empty:      { fontSize: 14, fontFamily: font.semibold, color: T.faint },
  errText:    { fontSize: 14, fontFamily: font.semibold, color: T.coral, textAlign: 'center' },
  errBanner:  { fontSize: 12.5, fontFamily: font.semibold, color: T.coral, textAlign: 'center', paddingHorizontal: 20, paddingBottom: 6 },
  retry:      { marginTop: 14, paddingVertical: 10, paddingHorizontal: 22 },
  retryText:  { fontSize: 14, fontFamily: font.bold, color: T.blue },

  itemRow:    { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: T.line },
  thumb:      { width: 60, height: 60, borderRadius: 15, backgroundColor: T.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.line },
  itemMeta:   { flex: 1, minWidth: 0 },
  itemName:   { fontSize: 14.5, fontFamily: font.extrabold, color: T.ink, lineHeight: 19 },
  itemPrice:  { fontSize: 14.5, fontFamily: font.extrabold, color: T.ink, marginTop: 6 },

  addBtn:     { width: 34, height: 34, borderRadius: 11, backgroundColor: T.blueSoft, alignItems: 'center', justifyContent: 'center' },
  stepper:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: T.white, borderRadius: 11, padding: 3, borderWidth: 1, borderColor: T.line },
  stepMinus:  { width: 30, height: 30, borderRadius: 9, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' },
  stepQty:    { minWidth: 22, textAlign: 'center', fontSize: 14.5, fontFamily: font.extrabold, color: T.ink },
  stepPlus:   { width: 30, height: 30, borderRadius: 9, backgroundColor: T.blue, alignItems: 'center', justifyContent: 'center' },

  barWrap:    { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
  bar:        { backgroundColor: T.navy, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  barDim:     { opacity: 0.9 },
  barLeft:    { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  barCount:   { minWidth: 24, height: 24, borderRadius: 8, backgroundColor: T.blue, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  barCountText: { fontSize: 13, fontFamily: font.extrabold, color: '#fff' },
  barLabel:   { fontSize: 15, fontFamily: font.extrabold, color: '#fff', flexShrink: 1 },
  barTotal:   { fontSize: 17, fontFamily: font.extrabold, color: '#fff' },
});
