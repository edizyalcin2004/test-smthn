// BasketScreen — "Sepetin hazır mı?" (design 06), between Menu and Results.
// Lines are REAL menu items with a quantity and, where verified, chosen options.
// Düzenle from the design is omitted: re-choosing options happens by removing
// the line and adding it again from the menu.
// POSTs /compare-basket from here and navigates to Results.
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, font, money } from '../../theme/tokens';
import { RoundBtn, Title, PrimaryButton } from '../../components/ui';
import { FoodArt, Mascot, foodType } from '../../components/Art';
import { Icon } from '../../components/icons';
import { randomId, compareContext } from '../../lib/telemetry';
import { basketProblem } from '../../lib/options';
import { compareBasket } from '../../api/client';
import { useCompare } from '../CompareScreen';

export default function BasketScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { restaurant, basket, setQty, setResults, setCompareId } = useCompare();
  const [comparing, setComparing] = useState(false);
  const [error, setError]         = useState(null);
  const mounted                   = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const lines = useMemo(() => Object.values(basket), [basket]);
  const count = useMemo(() => lines.reduce((a, { qty }) => a + qty, 0), [lines]);
  const subtotal = useMemo(
    () => lines.reduce((sum, { item, qty }) => sum + Number(item.price || 0) * qty, 0),
    [lines],
  );

  const compare = useCallback(async () => {
    if (!lines.length || !restaurant) return;
    const issue = basketProblem(lines);
    if (issue) { setError(issue); return; }
    setComparing(true);
    setError(null);
    try {
      // Response is already ranked by effective total ascending.
      const compareId = randomId();
      const ranked = await compareBasket(
        restaurant.id,
        lines.map(({ item, qty, options }) => ({
          id: item.id, name: item.name, qty,
          ...(options?.platform_id ? { options: { platform_id: options.platform_id, choices: options.choices } } : {}),
        })),
        { compare_id: compareId, client: await compareContext() },
      );
      if (!mounted.current) return;
      setResults(ranked);
      setCompareId(compareId);
      navigation.navigate('Results');
    } catch {
      if (mounted.current) setError('Karşılaştırma başarısız. Bağlantını kontrol edip tekrar dene.');
    } finally {
      if (mounted.current) setComparing(false);
    }
  }, [lines, restaurant, navigation, setResults, setCompareId]);

  const art = foodType(`${restaurant?.name ?? ''} ${restaurant?.cuisine_type ?? ''}`);

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 4 }]}>
        <RoundBtn onPress={() => navigation.goBack()} size={44} accessibilityLabel="Geri"><Icon name="back" s={20} c={T.ink} /></RoundBtn>
        <Text style={s.headTitle}>Sepetim</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: lines.length ? 170 : 40 }}
      >
        {lines.length === 0 ? (
          <View style={s.emptyWrap}>
            <Mascot pose="empty-basket" size={150} />
            <Text style={s.emptyTitle}>Sepetin henüz boş.</Text>
            <Text style={s.emptyDesc}>Menüden birkaç ürün ekle, aynı sepeti her platformda karşılaştıralım.</Text>
            <PrimaryButton onPress={() => navigation.goBack()} style={s.emptyBtn}>Menüye dön</PrimaryButton>
          </View>
        ) : (
          <>
            <Title accent="hazır mı?">Sepetin</Title>
            <Text style={s.sub} numberOfLines={1}>{restaurant?.name ?? ''} · {count} ürün</Text>

            <View style={s.list}>
              {lines.map(({ item, qty, options }) => (
                <View key={String(item.id)} style={s.line}>
                  <FoodArt type={foodType(`${item.name} ${item.category ?? ''}`, art)} size={70} round={false} radius={14} />
                  <View style={s.lineMeta}>
                    <Text style={s.lineName} numberOfLines={2}>{item.name}</Text>
                    <Text style={s.lineSub} numberOfLines={2}>
                      {options?.summary || (qty > 1 ? `${qty} × ${money(item.price)}` : money(Number(item.price || 0)))}
                    </Text>
                    <View style={s.lineActions}>
                      <View style={s.stepper}>
                        <Pressable hitSlop={6} onPress={() => setQty(item, qty - 1)} disabled={qty <= 1} style={[s.stepBtn, qty <= 1 && { opacity: 0.3 }]} accessibilityLabel={`${item.name} azalt`}><Icon name="minus" s={16} c={T.ink} /></Pressable>
                        <Text style={s.stepQty}>{qty}</Text>
                        <Pressable hitSlop={6} onPress={() => setQty(item, qty + 1)} style={s.stepBtn} accessibilityLabel={`${item.name} artır`}><Icon name="plus" s={16} c={T.ink} /></Pressable>
                      </View>
                      <Pressable hitSlop={8} onPress={() => setQty(item, 0)} accessibilityLabel={`${item.name} kaldır`}><Icon name="trash" s={20} c={T.red} sw={1.7} /></Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <Pressable onPress={() => navigation.goBack()} style={s.addMore} accessibilityRole="button">
              <Text style={s.addMoreText}>Başka ürün ekle</Text>
              <Icon name="plus" s={17} c={T.ink} />
            </Pressable>

            <View style={s.callout}>
              <View style={{ flex: 1 }}>
                <Text style={s.calloutTitle}>Aynı sepeti karşılaştır.</Text>
                <Text style={s.calloutText}>Her platformda yalnızca bu ürünlerin hepsini bulduğumuz toplamları yan yana koyarız.</Text>
              </View>
              <Mascot pose="deal-search" size={96} />
            </View>

            {error ? <Text style={s.errText}>{error}</Text> : null}
          </>
        )}
      </ScrollView>

      {lines.length > 0 ? (
        <View style={[s.barWrap, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            onPress={compare}
            disabled={comparing}
            style={({ pressed }) => [s.bar, (pressed || comparing) && { opacity: 0.9 }]}
            accessibilityRole="button"
          >
            {comparing ? <ActivityIndicator color="#fff" /> : <Text style={s.barLabel}>Fiyatları karşılaştır</Text>}
          </Pressable>
          <Text style={s.barNote}>Siparişini seçtiğin platformda tamamlarsın. Teslimat ücreti hariç.</Text>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: T.bg },
  header:    { paddingHorizontal: 18, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headTitle: { fontSize: 17, fontFamily: font.bold, color: T.ink, letterSpacing: -0.3 },
  sub:       { fontSize: 14, fontFamily: font.regular, color: T.sub, marginTop: 8 },

  emptyWrap:  { paddingTop: 50, paddingHorizontal: 16, alignItems: 'center' },
  emptyTitle: { fontSize: 24, fontFamily: font.medium, color: T.ink, marginTop: 18, letterSpacing: -0.6 },
  emptyDesc:  { fontSize: 14, fontFamily: font.regular, color: T.sub, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  emptyBtn:   { marginTop: 20, width: 'auto', paddingHorizontal: 28 },

  list:       { marginTop: 18 },
  line:       { flexDirection: 'row', gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: T.line },
  lineMeta:   { flex: 1, minWidth: 0 },
  lineName:   { fontSize: 15.5, fontFamily: font.bold, color: T.ink, letterSpacing: -0.3, lineHeight: 20 },
  lineSub:    { fontSize: 12.5, fontFamily: font.regular, color: T.sub, marginTop: 4 },
  lineActions:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  stepper:    { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: T.line, backgroundColor: T.white, borderRadius: 999, paddingHorizontal: 8, height: 38 },
  stepBtn:    { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  stepQty:    { fontSize: 15, fontFamily: font.bold, color: T.ink, minWidth: 14, textAlign: 'center' },

  addMore:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 16 },
  addMoreText:{ fontSize: 14, fontFamily: font.medium, color: T.ink },

  callout:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EAE8E0', borderRadius: 20, padding: 18, marginTop: 10 },
  calloutTitle: { fontSize: 17, fontFamily: font.bold, color: T.ink, letterSpacing: -0.4 },
  calloutText:  { fontSize: 13, fontFamily: font.regular, color: T.sub, marginTop: 6, lineHeight: 18 },
  errText:      { fontSize: 13, fontFamily: font.semibold, color: T.red, textAlign: 'center', marginTop: 14 },

  barWrap:   { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: T.bg, borderTopWidth: 1, borderTopColor: T.line },
  bar:       { backgroundColor: T.ink, borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  barLabel:  { fontSize: 16, fontFamily: font.bold, color: '#fff' },
  barNote:   { fontSize: 11.5, fontFamily: font.regular, color: T.sub, textAlign: 'center', marginTop: 8 },
});
