// BasketScreen — "Sepetin" review step between Menu and Results.
// Lines are REAL menu items with a quantity (no customization — the backend
// prices flat items, so there is nothing to edit; Düzenle from the design is
// deliberately omitted). Çoğalt bumps qty, Kaldır removes the line.
// POSTs /compare-basket from here and navigates to Results.
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, font, money } from '../../theme/tokens';
import { Card, RoundBtn } from '../../components/ui';
import { Icon } from '../../components/icons';
import Food from '../../components/Food';
import { foodIconFor } from '../../lib/foodIcon';
import { compareBasket } from '../../api/client';
import { useCompare } from '../CompareScreen';

export default function BasketScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { restaurant, basket, setQty, setResults } = useCompare();
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
    setComparing(true);
    setError(null);
    try {
      // Response is already ranked by effective total ascending.
      const ranked = await compareBasket(
        restaurant.id,
        lines.map(({ item, qty }) => ({ id: item.id, name: item.name, qty })),
      );
      if (!mounted.current) return;
      setResults(ranked);
      navigation.navigate('Results');
    } catch {
      if (mounted.current) setError('Karşılaştırma başarısız. Bağlantını kontrol edip tekrar dene.');
    } finally {
      if (mounted.current) setComparing(false);
    }
  }, [lines, restaurant, navigation, setResults]);

  return (
    <View style={s.root}>
      {/* header */}
      <View style={[s.header, { paddingTop: insets.top + 4 }]}>
        <RoundBtn onPress={() => navigation.goBack()} size={40}><Icon name="back" s={20} c={T.ink} /></RoundBtn>
        <View style={{ flexShrink: 1 }}>
          <Text style={s.title}>Sepetin</Text>
          <Text style={s.sub} numberOfLines={1}>{restaurant?.name ?? ''} · {count} ürün</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 6, paddingBottom: lines.length ? 160 : 40 }}
      >
        {lines.length === 0 ? (
          <View style={s.emptyWrap}>
            <Text style={s.emptyTitle}>Sepetin boş</Text>
            <Text style={s.emptyDesc}>Menüden ürün ekleyerek karşılaştırmaya başla.</Text>
            <Pressable onPress={() => navigation.goBack()} style={s.emptyBtn}>
              <Text style={s.emptyBtnText}>Menüye dön</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {lines.map(({ item, qty }) => (
              <Card key={String(item.id)} pad={0} style={s.lineCard}>
                <View style={s.lineBody}>
                  <View style={s.thumb}>
                    <Food name={foodIconFor(item.name, item.category)} s={40} />
                    {qty > 1 ? (
                      <View style={s.thumbBadge}><Text style={s.thumbBadgeText}>{qty}</Text></View>
                    ) : null}
                  </View>
                  <View style={s.lineMeta}>
                    <View style={s.lineTop}>
                      <Text style={s.lineName} numberOfLines={2}>{item.name}</Text>
                      <Text style={s.linePrice}>{money(Number(item.price || 0) * qty)}</Text>
                    </View>
                    <Text style={s.lineSub} numberOfLines={1}>
                      {qty > 1 ? `${qty} × ${money(item.price)}` : (item.category || '')}
                    </Text>
                  </View>
                </View>
                {/* actions */}
                <View style={s.actions}>
                  <ActBtn icon="copy" label="Çoğalt" onPress={() => setQty(item, qty + 1)} />
                  <View style={s.actRule} />
                  <ActBtn icon="minus" label="Azalt" onPress={() => setQty(item, qty - 1)} disabled={qty <= 1} />
                  <View style={s.actRule} />
                  <ActBtn icon="x" label="Kaldır" onPress={() => setQty(item, 0)} danger />
                </View>
              </Card>
            ))}

            {/* honesty note — final price is computed in the comparison */}
            <View style={s.noteRow}>
              <Icon name="alert" s={14} c={T.faint} />
              <Text style={s.noteText}>Nihai fiyat platform ve kodlara göre karşılaştırmada hesaplanır.</Text>
            </View>

            {error ? <Text style={s.errText}>{error}</Text> : null}
          </View>
        )}
      </ScrollView>

      {/* sticky compare CTA */}
      {lines.length > 0 ? (
        <View style={[s.barWrap, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            onPress={compare}
            disabled={comparing}
            style={({ pressed }) => [s.bar, (pressed || comparing) && s.barDim]}
          >
            <View style={s.barLeft}>
              <Icon name="search" s={18} c="#fff" />
              <Text style={s.barLabel}>Fiyatları karşılaştır</Text>
            </View>
            {comparing ? <ActivityIndicator color="#fff" /> : <Text style={s.barTotal}>{money(subtotal)}</Text>}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function ActBtn({ icon, label, onPress, danger, disabled }) {
  const c = danger ? T.red : T.sub;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [s.actBtn, (pressed || disabled) && { opacity: disabled ? 0.35 : 0.6 }]}
    >
      <Icon name={icon} s={16} c={c} sw={2.2} />
      <Text style={[s.actText, { color: c }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: T.bg },

  header: { paddingHorizontal: 18, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  title:  { fontSize: 21, fontFamily: font.extrabold, color: T.ink, letterSpacing: -0.4 },
  sub:    { fontSize: 12.5, fontFamily: font.semibold, color: T.sub, marginTop: 2 },

  emptyWrap:    { paddingTop: 60, paddingHorizontal: 20, alignItems: 'center' },
  emptyTitle:   { fontSize: 16, fontFamily: font.extrabold, color: T.ink },
  emptyDesc:    { fontSize: 13, fontFamily: font.medium, color: T.sub, marginTop: 6, textAlign: 'center' },
  emptyBtn:     { marginTop: 18, backgroundColor: T.blueSoft, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 13 },
  emptyBtnText: { fontSize: 14, fontFamily: font.extrabold, color: T.blue },

  lineCard: { overflow: 'hidden' },
  lineBody: { flexDirection: 'row', gap: 13, paddingHorizontal: 16, paddingTop: 15, paddingBottom: 14 },
  thumb:    { width: 54, height: 54, borderRadius: 14, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' },
  thumbBadge: {
    position: 'absolute', top: -6, right: -6, minWidth: 20, height: 20, paddingHorizontal: 5,
    borderRadius: 999, backgroundColor: T.blue, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: T.white,
  },
  thumbBadgeText: { fontSize: 11, fontFamily: font.extrabold, color: '#fff' },
  lineMeta: { flex: 1, minWidth: 0 },
  lineTop:  { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  lineName: { flex: 1, minWidth: 0, fontSize: 15, fontFamily: font.extrabold, color: T.ink, lineHeight: 20 },
  linePrice:{ fontSize: 15, fontFamily: font.extrabold, color: T.ink, flexShrink: 0 },
  lineSub:  { fontSize: 12.5, fontFamily: font.semibold, color: T.sub, marginTop: 3 },

  actions:  { flexDirection: 'row', alignItems: 'stretch', borderTopWidth: 1, borderTopColor: T.line },
  actBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 12, paddingHorizontal: 8 },
  actText:  { fontSize: 13, fontFamily: font.bold },
  actRule:  { width: 1, backgroundColor: T.line },

  noteRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 2, paddingVertical: 4 },
  noteText: { flex: 1, fontSize: 12, fontFamily: font.semibold, color: T.faint },
  errText:  { fontSize: 13, fontFamily: font.semibold, color: T.coral, textAlign: 'center', marginTop: 4 },

  barWrap:  { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
  bar:      { backgroundColor: T.navy, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  barDim:   { opacity: 0.9 },
  barLeft:  { flexDirection: 'row', alignItems: 'center', gap: 9, flexShrink: 1 },
  barLabel: { fontSize: 15, fontFamily: font.extrabold, color: '#fff' },
  barTotal: { fontSize: 15, fontFamily: font.extrabold, color: '#fff' },
});
