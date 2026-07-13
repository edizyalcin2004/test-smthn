// MenuScreen — navy/gold rebuild, wired live. Reads /menu and builds a basket
// in Compare-level state. Continuous scroll with one section per REAL backend
// category; the category chips scroll-spy the list (tap → jump to section).
// The bottom bar goes to the Basket review screen — comparing happens there.
// No item customization: the backend prices flat items, so tapping + adds one
// unit; quantities are adjusted on the Basket screen. No invented options.
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
import { getMenu } from '../../api/client';
import { useCompare } from '../CompareScreen';

const SPY_OFFSET = 70; // px below the chips where a section counts as "current"

export default function MenuScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { restaurant: ctxRestaurant, setRestaurant, basket, setQty } = useCompare();
  const restaurant = route.params?.restaurant ?? ctxRestaurant;

  // Reconcile Compare-level restaurant with whatever we navigated in with
  // (covers both Search picks and CodeSheet deep-links). Resets basket on change.
  useEffect(() => {
    if (restaurant && (!ctxRestaurant || ctxRestaurant.id !== restaurant.id)) {
      setRestaurant(restaurant);
    }
  }, [restaurant, ctxRestaurant, setRestaurant]);

  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [tab, setTab]         = useState(null);
  const [fav, setFav]         = useState(false);
  const mounted               = useRef(true);
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

  // One section per real category, in backend order.
  const sections = useMemo(() => {
    const order = [];
    const byCat = new Map();
    for (const it of items) {
      const c = it.category || 'Diğer';
      if (!byCat.has(c)) { byCat.set(c, []); order.push(c); }
      byCat.get(c).push(it);
    }
    return order.map((c) => ({ cat: c, items: byCat.get(c) }));
  }, [items]);
  useEffect(() => { if (sections.length && !tab) setTab(sections[0].cat); }, [sections, tab]);

  // scroll-spy plumbing
  const scrollRef      = useRef(null);
  const sectionY       = useRef({});           // cat -> content y
  const clickScrolling = useRef(false);
  const spyTimer       = useRef(null);

  const onScroll = useCallback((e) => {
    if (clickScrolling.current) return;
    const y = e.nativeEvent.contentOffset.y + SPY_OFFSET;
    let cur = sections[0]?.cat;
    for (const sec of sections) {
      const top = sectionY.current[sec.cat];
      if (top != null && top <= y) cur = sec.cat;
    }
    if (cur) setTab(cur);
  }, [sections]);

  const jumpTo = useCallback((cat) => {
    setTab(cat);
    const y = sectionY.current[cat];
    if (scrollRef.current && y != null) {
      clickScrolling.current = true;
      scrollRef.current.scrollTo({ y: Math.max(0, y - 10), animated: true });
      clearTimeout(spyTimer.current);
      spyTimer.current = setTimeout(() => { clickScrolling.current = false; }, 500);
    }
  }, []);
  useEffect(() => () => clearTimeout(spyTimer.current), []);

  const basketLines = useMemo(() => Object.values(basket), [basket]);
  const count = useMemo(() => basketLines.reduce((a, { qty }) => a + qty, 0), [basketLines]);
  const total = useMemo(
    () => basketLines.reduce((sum, { item, qty }) => sum + Number(item.price || 0) * qty, 0),
    [basketLines],
  );

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

      {/* category chips (scroll-spy) */}
      {!loading && !error && sections.length > 0 ? (
        <View style={s.tabsWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsRow}>
            {sections.map(({ cat }) => {
              const active = cat === tab;
              return (
                <Pressable key={cat} onPress={() => jumpTo(cat)} style={[s.tab, active && s.tabActive]}>
                  <Text style={[s.tabText, active && s.tabTextActive]} numberOfLines={1}>{cat}</Text>
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
          ref={scrollRef}
          onScroll={onScroll}
          scrollEventThrottle={32}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: count ? 160 : 110 }}
        >
          {sections.map((sec) => (
            <View key={sec.cat} onLayout={(e) => { sectionY.current[sec.cat] = e.nativeEvent.layout.y; }}>
              <View style={s.secHead}>
                <Text style={s.secTitle}>{sec.cat}</Text>
                <Text style={s.secCount}>{sec.items.length} ürün</Text>
                <View style={s.secRule} />
              </View>
              {sec.items.map((it) => {
                const qty = basket[it.id]?.qty ?? 0;
                const active = qty > 0;
                return (
                  <Pressable
                    key={String(it.id)}
                    onPress={() => setQty(it, qty + 1)}
                    style={({ pressed }) => [s.itemCard, active && s.itemCardActive, pressed && s.itemPressed]}
                  >
                    <View style={s.thumb}>
                      <Food name={foodIconFor(it.name, it.category)} s={44} />
                      {qty > 0 ? (
                        <View style={s.thumbBadge}><Text style={s.thumbBadgeText}>{qty}</Text></View>
                      ) : null}
                    </View>
                    <View style={s.itemMeta}>
                      <Text style={s.itemName} numberOfLines={2}>{it.name}</Text>
                      {it.price != null ? <Text style={s.itemPrice}>{money(it.price)}</Text> : null}
                    </View>
                    <View style={s.addBtn}><Icon name="plus" s={19} c="#fff" sw={2.6} /></View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}

      {error && !loading && items.length > 0 ? <Text style={s.errBanner}>{error}</Text> : null}

      {/* bottom basket bar → review */}
      {count > 0 && !loading ? (
        <View style={[s.barWrap, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            onPress={() => navigation.navigate('Basket')}
            style={({ pressed }) => [s.bar, pressed && s.barDim]}
          >
            <View style={s.barLeft}>
              <View style={s.barCount}><Text style={s.barCountText}>{count}</Text></View>
              <Text style={s.barLabel}>ürün · Sepeti incele</Text>
            </View>
            <Text style={s.barTotal}>{money(total)}</Text>
          </Pressable>
        </View>
      ) : null}
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

  secHead:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 16, paddingBottom: 12, paddingHorizontal: 2 },
  secTitle:   { fontSize: 17, fontFamily: font.extrabold, color: T.ink, letterSpacing: -0.2 },
  secCount:   { fontSize: 12, fontFamily: font.bold, color: T.faint },
  secRule:    { flex: 1, height: 1, backgroundColor: T.line },

  itemCard:   {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    backgroundColor: T.white, borderRadius: 18, padding: 13, marginBottom: 11,
    borderWidth: 1, borderColor: T.line,
  },
  itemCardActive: { borderWidth: 1.5, borderColor: T.blue },
  itemPressed:    { opacity: 0.75 },
  thumb:      { width: 62, height: 62, borderRadius: 15, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' },
  thumbBadge: {
    position: 'absolute', top: -6, right: -6, minWidth: 20, height: 20, paddingHorizontal: 5,
    borderRadius: 999, backgroundColor: T.blue, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: T.white,
  },
  thumbBadgeText: { fontSize: 11, fontFamily: font.extrabold, color: '#fff' },
  itemMeta:   { flex: 1, minWidth: 0 },
  itemName:   { fontSize: 14.5, fontFamily: font.extrabold, color: T.ink, lineHeight: 19 },
  itemPrice:  { fontSize: 14, fontFamily: font.extrabold, color: T.ink, marginTop: 7 },
  addBtn:     { width: 34, height: 34, borderRadius: 11, backgroundColor: T.blue, alignItems: 'center', justifyContent: 'center' },

  barWrap:    { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
  bar:        { backgroundColor: T.navy, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  barDim:     { opacity: 0.9 },
  barLeft:    { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  barCount:   { minWidth: 24, height: 24, borderRadius: 8, backgroundColor: T.blue, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  barCountText: { fontSize: 13, fontFamily: font.extrabold, color: '#fff' },
  barLabel:   { fontSize: 15, fontFamily: font.extrabold, color: '#fff', flexShrink: 1 },
  barTotal:   { fontSize: 17, fontFamily: font.extrabold, color: '#fff' },
});
