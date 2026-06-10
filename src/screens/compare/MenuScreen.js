import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, SectionList, Pressable, ScrollView,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radii, shadows } from '../../theme/tokens';
import { getMenu, compareBasket } from '../../api/client';

export default function MenuScreen({ route, navigation }) {
  const { restaurant } = route.params;

  const [sections, setSections]   = useState([]);
  const [basket, setBasket]       = useState({});
  const [loading, setLoading]     = useState(true);
  const [comparing, setComparing] = useState(false);
  const [results, setResults]     = useState(null);
  const [error, setError]         = useState(null);
  const mounted                   = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const loadMenu = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await getMenu(restaurant.id);
      if (mounted.current) setSections(groupByCategory(items));
    } catch {
      if (mounted.current) setError('Could not load menu. Check your connection.');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [restaurant.id]);

  useEffect(() => { loadMenu(); }, [loadMenu]);

  const addItem = useCallback((item) => {
    setBasket(prev => ({
      ...prev,
      [item.id]: { item, qty: (prev[item.id]?.qty ?? 0) + 1 },
    }));
  }, []);

  const removeItem = useCallback((id) => {
    setBasket(prev => {
      if ((prev[id]?.qty ?? 0) <= 1) { const n = { ...prev }; delete n[id]; return n; }
      return { ...prev, [id]: { ...prev[id], qty: prev[id].qty - 1 } };
    });
  }, []);

  const basketLines = useMemo(() => Object.values(basket), [basket]);
  const basketCount = useMemo(() => basketLines.reduce((s, { qty }) => s + qty, 0), [basketLines]);

  const findBestPrice = useCallback(async () => {
    if (!basketLines.length) return;
    setComparing(true);
    setError(null);
    try {
      // Response is already ranked by total ascending — rendered as returned.
      const ranked = await compareBasket(
        restaurant.id,
        basketLines.map(({ item, qty }) => ({ id: item.id, name: item.name, qty })),
      );
      if (mounted.current) setResults(ranked);
    } catch {
      if (mounted.current) setError('Comparison failed. Check your connection and try again.');
    } finally {
      if (mounted.current) setComparing(false);
    }
  }, [basketLines, restaurant.id]);

  const resetResults = useCallback(() => {
    setResults(null);
    setBasket({});
  }, []);

  if (results) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <Pressable onPress={resetResults} hitSlop={10} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </Pressable>
          <Text style={s.headerTitle} numberOfLines={1}>Results</Text>
        </View>
        <ResultsView results={results} onReset={resetResults} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={s.headerTitle} numberOfLines={1}>{restaurant.name}</Text>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error && sections.length === 0 ? (
        <View style={s.center}>
          <Text style={s.errorText}>{error}</Text>
          <Pressable style={s.retryBtn} onPress={loadMenu}>
            <Text style={s.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : sections.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyText}>No menu items found</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[s.listPad, basketCount > 0 && s.listPadBasket]}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={s.sectionHeader}>{title}</Text>
          )}
          renderItem={({ item }) => {
            const qty = basket[item.id]?.qty ?? 0;
            return (
              <View style={s.menuCard}>
                <View style={s.menuMeta}>
                  <Text style={s.menuName}>{item.name}</Text>
                  {item.price != null ? (
                    <Text style={s.menuPrice}>₺{Number(item.price).toFixed(2)}</Text>
                  ) : null}
                </View>
                <View style={s.menuControls}>
                  {qty > 0 && (
                    <>
                      <Pressable style={s.qtyBtn} hitSlop={6} onPress={() => removeItem(item.id)}>
                        <Ionicons name="remove" size={18} color={colors.primary} />
                      </Pressable>
                      <Text style={s.qtyLabel}>{qty}</Text>
                    </>
                  )}
                  <Pressable style={s.addBtn} hitSlop={6} onPress={() => addItem(item)}>
                    <Ionicons name="add" size={20} color="#fff" />
                  </Pressable>
                </View>
              </View>
            );
          }}
          SectionSeparatorComponent={() => <View style={{ height: 4 }} />}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}

      {error && !loading && sections.length > 0 ? <Text style={s.errorBanner}>{error}</Text> : null}

      {basketCount > 0 && !loading && (
        <View style={s.basketBar}>
          <View style={s.basketMeta}>
            <Text style={s.basketCount}>{basketCount} item{basketCount !== 1 ? 's' : ''}</Text>
            <Text style={s.basketSummary} numberOfLines={1}>
              {basketLines.map(({ item, qty }) => `${item.name}${qty > 1 ? ` ×${qty}` : ''}`).join(', ')}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [s.cta, pressed && s.ctaPressed, comparing && s.ctaDim]}
            onPress={findBestPrice}
            disabled={comparing}
          >
            {comparing
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={s.ctaText}>Find Best Price</Text>
            }
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

function ResultsView({ results, onReset }) {
  return (
    <ScrollView contentContainerStyle={s.listPad}>
      <Text style={s.resultsHeading}>Best prices found</Text>
      {results.map((p, i) => {
        const missing = (p.items ?? []).filter((it) => !it.found).length;
        return (
          <View key={String(p.platform.id)} style={[s.platformCard, i === 0 && s.platformCardWin]}>
            {i === 0 && <Text style={s.winBadge}>EN UCUZ</Text>}
            <View style={s.platformRow}>
              <Text style={[s.platformName, i === 0 && s.onWin]}>
                {p.platform.name}
              </Text>
              <Text style={[s.platformTotal, i === 0 && s.onWin]}>
                ₺{Number(p.total).toFixed(2)}
              </Text>
            </View>
            {(p.items ?? []).map((it, j) => (
              <Text key={String(j)} style={[s.platformDetail, i === 0 && s.onWinSub]}>
                {it.found && it.price != null
                  ? `${it.name}: ₺${Number(it.price).toFixed(2)}`
                  : `${it.name}: bu platformda bulunamadı`}
              </Text>
            ))}
            {missing > 0 && (
              <Text style={[s.platformCaveat, i === 0 && s.onWinSub]}>
                {missing} ürün bulunamadı — toplama dahil değil
              </Text>
            )}
          </View>
        );
      })}
      <Pressable style={s.resetBtn} onPress={onReset}>
        <Text style={s.resetText}>Yeni karşılaştırma başlat</Text>
      </Pressable>
    </ScrollView>
  );
}

function groupByCategory(items) {
  const map = new Map();
  for (const item of items) {
    const cat = item.category ?? 'Diğer';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push(item);
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.background },

  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 },
  backBtn:     { marginRight: 6, padding: 2 },
  headerTitle: { fontFamily: fonts.headline, fontSize: 22, color: colors.textPrimary, flex: 1 },

  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontFamily: fonts.bodyReg, fontSize: 15, color: colors.textSecondary, textAlign: 'center' },
  errorText: { fontFamily: fonts.bodyReg, fontSize: 14, color: '#c62828', textAlign: 'center' },
  errorBanner: { fontFamily: fonts.bodyReg, fontSize: 13, color: '#c62828', textAlign: 'center', paddingHorizontal: 20, paddingBottom: 6 },
  retryBtn:  { marginTop: 14, paddingVertical: 10, paddingHorizontal: 22, borderRadius: radii.pill, backgroundColor: colors.surface },
  retryText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.primary },

  listPad:       { padding: 16, paddingBottom: 32 },
  listPadBasket: { paddingBottom: 120 },

  sectionHeader: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 8 },

  menuCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, padding: 16 },
  menuMeta:     { flex: 1, marginRight: 12 },
  menuName:     { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.textPrimary },
  menuPrice:    { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.primary, marginTop: 6 },
  menuControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn:       { width: 32, height: 32, borderRadius: radii.pill, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  qtyLabel:     { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.textPrimary, minWidth: 16, textAlign: 'center' },
  addBtn:       { width: 36, height: 36, borderRadius: radii.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },

  basketBar:     {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 20,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    ...shadows.tabBar,
  },
  basketMeta:    { flex: 1, marginRight: 12 },
  basketCount:   { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.textPrimary },
  basketSummary: { fontFamily: fonts.bodyReg, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  cta:           { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 13, borderRadius: radii.button, minWidth: 148, alignItems: 'center' },
  ctaPressed:    { opacity: 0.85 },
  ctaDim:        { opacity: 0.55 },
  ctaText:       { fontFamily: fonts.bodySemi, fontSize: 15, color: '#fff' },

  resultsHeading:    { fontFamily: fonts.headline, fontSize: 22, color: colors.textPrimary, marginBottom: 16 },
  platformCard:      { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 10 },
  platformCardWin:   { backgroundColor: colors.primary },
  winBadge:          { fontFamily: fonts.bodySemi, fontSize: 10, color: 'rgba(255,255,255,0.75)', letterSpacing: 1, marginBottom: 6 },
  platformRow:       { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  platformName:      { fontFamily: fonts.bodySemi, fontSize: 17, color: colors.textPrimary },
  platformTotal:     { fontFamily: fonts.headline, fontSize: 24, color: colors.textPrimary },
  onWin:             { color: '#fff' },
  platformDetail:    { fontFamily: fonts.bodyReg, fontSize: 13, color: colors.textSecondary, marginTop: 5 },
  platformCaveat:    { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary, marginTop: 8 },
  onWinSub:          { color: 'rgba(255,255,255,0.75)' },

  resetBtn:   { alignSelf: 'center', marginTop: 20, paddingVertical: 12, paddingHorizontal: 24 },
  resetText:  { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.primary },
});
