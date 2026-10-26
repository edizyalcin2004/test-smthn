// MenuScreen — Doybi redesign PR 2 (design 03), wired live. Reads /menu and builds a basket
// in Compare-level state. Continuous scroll with one section per REAL backend
// category; the category chips scroll-spy the list (tap → jump to section).
// The bottom bar goes to the Basket review screen — comparing happens there.
// Verified option trees configure the first item; subsequent additions reuse
// that configuration. Unknown option data never falls back to a base-price comparison.
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet, Alert, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, font, money } from '../../theme/tokens';
import { RoundBtn, Chip, Title, PrimaryButton } from '../../components/ui';
import { FoodArt, Mascot, foodType } from '../../components/Art';
import { Icon } from '../../components/icons';
import { getMenu, getItemOptions } from '../../api/client';
import OptionSheet from '../../components/OptionSheet';
import { useCompare } from '../CompareScreen';

const SPY_OFFSET = 80;  // px below the chips where a section counts as "current"

export default function MenuScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
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
  const mounted               = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  // T-028: first add of an item with options opens the option sheet.
  const [sheet, setSheet]     = useState(null);   // {item, tree}
  const [busyId, setBusyId]   = useState(null);
  const optionCache           = useRef({});
  const addItem = useCallback(async (it, qty) => {
    if (qty > 0) { setQty(it, qty + 1); return; }         // same configuration again
    setBusyId(it.id);
    let tree = optionCache.current[it.id];
    try {
      if (!tree) tree = optionCache.current[it.id] = await getItemOptions(it.id);
    } catch { tree = { status: 'options_unavailable' }; }
    if (!mounted.current) return;
    setBusyId(null);
    if (tree.status === 'configurable' && tree.groups?.length) setSheet({ item: it, tree });
    else if (tree.status === 'no_options') setQty(it, 1, null);
    else Alert.alert('Seçenekler doğrulanamıyor', 'Bu ürünün güncel seçenekleri doğrulanamadığı için toplam fiyatını karşılaştıramıyoruz. Lütfen başka bir ürün seç veya daha sonra tekrar dene.');
  }, [setQty]);

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
  const listY          = useRef(0);            // y of the section list in the scroll content
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
      scrollRef.current.scrollTo({ y: Math.max(0, y - 62), animated: true }); // clear the sticky chips
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

  const art = foodType(`${restaurant?.name ?? ''} ${restaurant?.cuisine_type ?? ''}`);
  const bannerW = width - 36;

  return (
    <View style={s.root}>
      {/* header */}
      <View style={[s.header, { paddingTop: insets.top + 4 }]}>
        <RoundBtn onPress={() => navigation.goBack()} size={44} accessibilityLabel="Geri"><Icon name="back" s={20} c={T.ink} /></RoundBtn>
        <Text style={s.headTitle}>Menü</Text>
        <RoundBtn onPress={() => count && navigation.navigate('Basket')} size={44} badge={count > 0}><Icon name="bag" s={20} c={T.ink} /></RoundBtn>
      </View>

      {loading ? (
        <View style={s.center}><Mascot pose="deal-search" size={110} /><Text style={s.stateTitle}>Menü yükleniyor…</Text><ActivityIndicator color={T.ink} style={{ marginTop: 10 }} /></View>
      ) : error && items.length === 0 ? (
        <View style={s.center}>
          <Mascot pose="no-results" size={110} />
          <Text style={s.stateTitle}>Menü şu an yüklenemedi.</Text>
          <Text style={s.stateText}>Bağlantını kontrol edip tekrar dene.</Text>
          <PrimaryButton onPress={load} style={s.stateBtn}>Tekrar dene</PrimaryButton>
        </View>
      ) : items.length === 0 ? (
        <View style={s.center}><Mascot pose="no-results" size={110} /><Text style={s.stateTitle}>Bu restoranın menüsü henüz yok.</Text></View>
      ) : (
        <ScrollView
          ref={scrollRef}
          onScroll={onScroll}
          scrollEventThrottle={32}
          stickyHeaderIndices={[1]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: count ? 170 : 110 }}
        >
          <View style={s.top}>
            <FoodArt type={art} size={bannerW} height={Math.round(bannerW * 0.36)} round={false} radius={20} />
            <View style={s.nameRow}>
              <Title accent="Menünü seç." style={s.name}>{restaurant?.name ?? 'Menü'}</Title>
              {count > 0 ? <View style={s.countPill}><Text style={s.countPillText}>{count} ürün</Text></View> : null}
            </View>
            <Text style={s.priceNote}>Listedeki fiyat bir platformda son görülen fiyattır; her platformun toplamı karşılaştırmada ayrı hesaplanır.</Text>
          </View>

          {/* category chips (scroll-spy), sticky under the header */}
          <View style={s.tabsWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsRow}>
              {sections.map(({ cat }) => <Chip key={cat} label={cat} active={cat === tab} onPress={() => jumpTo(cat)} />)}
            </ScrollView>
          </View>

          <View onLayout={(e) => { listY.current = e.nativeEvent.layout.y; }} style={{ paddingHorizontal: 18 }}>
            {sections.map((sec) => (
              <View key={sec.cat} onLayout={(e) => { sectionY.current[sec.cat] = listY.current + e.nativeEvent.layout.y; }}>
                <Text style={s.secTitle}>{sec.cat}</Text>
                {sec.items.map((it) => {
                  const qty = basket[it.id]?.qty ?? 0;
                  return (
                    <View key={String(it.id)} style={s.item}>
                      <View style={s.itemMeta}>
                        <Text style={s.itemName} numberOfLines={2}>{it.name}</Text>
                        {it.price != null ? <Text style={s.itemPrice}>{money(it.price)}</Text> : null}
                        {basket[it.id]?.options?.summary ? <Text style={s.itemOpts} numberOfLines={2}>{basket[it.id].options.summary}</Text> : null}
                      </View>
                      <View style={s.thumb}>
                        <FoodArt type={foodType(`${it.name} ${it.category ?? ''}`, art)} size={96} round={false} radius={14} />
                        {qty > 0 ? (
                          <View style={s.stepper}>
                            <Pressable hitSlop={6} onPress={() => setQty(it, qty - 1)} style={s.stepBtn} accessibilityLabel={`${it.name} azalt`}><Icon name="minus" s={16} c={T.ink} /></Pressable>
                            <Text style={s.stepQty}>{qty}</Text>
                            <Pressable hitSlop={6} onPress={() => addItem(it, qty)} style={s.stepBtn} accessibilityLabel={`${it.name} artır`}><Icon name="plus" s={16} c={T.ink} /></Pressable>
                          </View>
                        ) : (
                          <Pressable onPress={() => addItem(it, 0)} disabled={busyId === it.id} style={s.addBtn} accessibilityLabel={`${it.name} ekle`}>
                            {busyId === it.id ? <ActivityIndicator color="#fff" size="small" /> : <Icon name="plus" s={20} c="#fff" sw={2.2} />}
                          </Pressable>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {error && !loading && items.length > 0 ? <Text style={s.errBanner}>{error}</Text> : null}

      {sheet ? (
        <OptionSheet item={sheet.item} tree={sheet.tree} onClose={() => setSheet(null)}
          onSave={(opts) => { setQty(sheet.item, 1, opts); setSheet(null); }} />
      ) : null}

      {/* bottom basket bar -> review */}
      {count > 0 && !loading ? (
        <View style={[s.barWrap, { paddingBottom: insets.bottom + 12 }]}>
          <View style={s.barInfo}>
            <Text style={s.barLabel}>Sepetim</Text>
            <Text style={s.barLabel}>{count} ürün · {money(total)}</Text>
          </View>
          <PrimaryButton onPress={() => navigation.navigate('Basket')}>Sepeti incele</PrimaryButton>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: T.bg },

  header:     { paddingHorizontal: 18, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headTitle:  { fontSize: 17, fontFamily: font.bold, color: T.ink, letterSpacing: -0.3 },

  top:        { paddingHorizontal: 18, paddingTop: 6 },
  nameRow:    { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginTop: 18 },
  name:       { flexShrink: 1, fontFamily: font.bold, letterSpacing: -1.3 },
  countPill:  { backgroundColor: T.yellow, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 11, marginTop: 6 },
  countPillText: { fontSize: 12.5, fontFamily: font.semibold, color: T.ink },
  priceNote:  { fontSize: 12, fontFamily: font.regular, color: T.sub, marginTop: 8, lineHeight: 17 },

  tabsWrap:   { backgroundColor: T.bg, paddingVertical: 12 },
  tabsRow:    { paddingHorizontal: 18, gap: 8 },

  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  stateTitle: { fontSize: 19, fontFamily: font.medium, color: T.ink, marginTop: 14, textAlign: 'center', letterSpacing: -0.4 },
  stateText:  { fontSize: 13.5, fontFamily: font.regular, color: T.sub, marginTop: 6, textAlign: 'center' },
  stateBtn:   { marginTop: 18, width: 'auto', paddingHorizontal: 26 },
  errBanner:  { fontSize: 12.5, fontFamily: font.semibold, color: T.red, textAlign: 'center', paddingHorizontal: 20, paddingBottom: 6 },

  secTitle:   { fontSize: 13, fontFamily: font.semibold, color: T.sub, letterSpacing: 1.2, textTransform: 'uppercase', paddingTop: 14, paddingBottom: 4 },
  item:       { flexDirection: 'row', gap: 16, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: T.line },
  itemMeta:   { flex: 1, minWidth: 0 },
  itemName:   { fontSize: 16, fontFamily: font.bold, color: T.ink, lineHeight: 21, letterSpacing: -0.3 },
  itemPrice:  { fontSize: 15, fontFamily: font.semibold, color: T.ink, marginTop: 8 },
  itemOpts:   { fontSize: 12, fontFamily: font.regular, color: T.sub, marginTop: 6 },
  thumb:      { width: 96, height: 96 },
  addBtn:     { position: 'absolute', right: -6, bottom: -8, width: 38, height: 38, borderRadius: 19, backgroundColor: T.ink,
                alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: T.bg },
  stepper:    { position: 'absolute', left: -10, right: -6, bottom: -10, height: 38, borderRadius: 19, backgroundColor: T.white,
                borderWidth: 1, borderColor: T.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6 },
  stepBtn:    { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  stepQty:    { fontSize: 15, fontFamily: font.bold, color: T.ink },

  barWrap:    { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 18, paddingTop: 12, backgroundColor: T.bg, borderTopWidth: 1, borderTopColor: T.line },
  barInfo:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  barLabel:   { fontSize: 14, fontFamily: font.regular, color: T.ink },
});
