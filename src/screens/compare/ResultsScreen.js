// ResultsScreen — the honesty-critical screen (redesign PR 2, design 07).
//
// /compare-basket returns platforms pre-sorted by effective total ascending.
// We split them into:
//   comparable — every basket item was found (totals are like-for-like)
//   incomplete — ≥1 item missing (total is truncated, NOT comparable)
// The winner badge + savings claim key off comparable.length, never the raw
// row count, so:
//   ≥2 comparable → EN DÜŞÜK tag + "₺X less than the next option" (never vs
//                   the most expensive) + "+₺gap" on the others
//    1 comparable → one neutral card, no tag/gap/savings
//    0 comparable → no winner, only the incomplete block + empty note
// Incomplete platforms are shown separately, never ranked, never badged, and
// never with a headline price (a truncated total must not read as "cheapest").
// No delivery/ETA is shown — the backend returns none, so we invent none.
import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Linking, Alert } from 'react-native';
import { PressScale, Reveal } from '../../lib/motion';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, font, money } from '../../theme/tokens';
import { RoundBtn, Title } from '../../components/ui';
import { FoodArt, Mascot, foodType } from '../../components/Art';
import { Icon } from '../../components/icons';
import { useCompare } from '../CompareScreen';
import { useCodeSheet } from '../../components/CodeSheet';
import { buildPending } from '../../lib/savings';
import { savePending, clearPending } from '../../lib/orders';
import { safeOrderURL } from '../../lib/orderLinks';
import { track } from '../../lib/telemetry';

const num = (v) => Number(v ?? 0);
const hasCode = (p) => p.total_after_code != null && p.best_code != null;
const effective = (p) => num(hasCode(p) ? p.total_after_code : p.total);
const allFound = (p) => (p.items ?? []).length > 0 && p.items.every((it) => it.found);

// T-028: why an item could not be priced with the chosen options on a platform.
const lineText = (it) => it.found && it.price != null
  ? `${it.name}: ${money(it.price)}`
  : it.options_status && it.options_status !== 'priced'
    ? `${it.name}: bu seçeneklerle karşılaştırılamıyor`
    : `${it.name}: bu platformda bulunamadı`;

function usageCaveat(u) {
  if (u === 'once_per_user') return 'Kullanıcı başına 1 kez';
  if (u === 'first_order')   return 'İlk siparişe özel';
  return u ? String(u) : null;
}

export default function ResultsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { restaurant, results, basket, compareId } = useCompare();
  const { openCode } = useCodeSheet();

  const rows = results ?? [];
  const itemCount = Object.values(basket).reduce((a, { qty }) => a + qty, 0);

  const comparable = rows.filter(allFound).slice().sort((a, b) => effective(a) - effective(b));
  const incomplete = rows.filter((p) => !allFound(p));
  const isMulti  = comparable.length >= 2;
  const isSingle = comparable.length === 1;
  const cheapest = comparable.length ? effective(comparable[0]) : null;

  const [selectedId, setSelectedId] = useState(comparable[0]?.platform.id ?? null);
  const selected = comparable.find((p) => p.platform.id === selectedId) ?? comparable[0] ?? null;

  const openRowCode = (p) =>
    openCode({ ...p.best_code, platform: p.platform, restaurant_id: restaurant?.id });

  // D-030: remember what they are about to order, then hand off to the
  // platform. The return popup (OrderCheck) asks whether they finished.
  const orderOn = async (p) => {
    const url = safeOrderURL(p.order_url);
    if (!url) return;
    await savePending(buildPending({ restaurant, basket, chosen: p, comparable, now: Date.now(), compareId }));
    if (compareId) {
      const rank = comparable.findIndex((x) => x.platform.id === p.platform.id) + 1;
      track({ event_name: 'handoff', compare_id: compareId, restaurant_id: restaurant.id,
              platform_id: p.platform.id, rank: rank || null, was_cheapest: effective(p) <= cheapest,
              gap_tl: String(Math.max(0, Math.round((effective(p) - cheapest) * 100) / 100)),
              link_kind: p.order_link_kind ?? null });
    }
    try { await Linking.openURL(url); }
    catch {
      await clearPending();
      Alert.alert('Bağlantı açılamadı', 'Lütfen platformu kendi uygulamasından aç.');
    }
  };

  const art = foodType(`${restaurant?.name ?? ''} ${restaurant?.cuisine_type ?? ''}`);
  const unavailable = Object.values(basket).filter((l) => l.options?.unavailable);
  const canOrder = selected && safeOrderURL(selected.order_url);

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 4 }]}>
        <RoundBtn onPress={() => navigation.goBack()} size={44} accessibilityLabel="Geri"><Icon name="back" s={20} c={T.ink} /></RoundBtn>
        <Text style={s.headTitle}>Karşılaştırma</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { paddingBottom: canOrder ? 200 : 110 }]}>
        <Title accent="Hangisi daha uygun?">Aynı sepet.</Title>

        <View style={s.summary}>
          <FoodArt type={art} size={64} round={false} radius={14} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.summaryName} numberOfLines={1}>{restaurant?.name ?? ''}</Text>
            <Text style={s.summarySub}>{itemCount} ürün</Text>
            <Pressable onPress={() => navigation.goBack()} style={s.editRow} hitSlop={6}>
              <Text style={s.editText}>Sepeti düzenle</Text>
              <Icon name="edit" s={14} c={T.ink} />
            </Pressable>
          </View>
        </View>

        {unavailable.length ? (
          <Text style={s.note}>
            {unavailable.map((l) => l.item.name).join(', ')}: güncel seçenek verisi yok, seçeneksiz (temel) fiyatla karşılaştırıldı — seçtiğin ekler fiyatı değiştirebilir.
          </Text>
        ) : null}

        <Text style={s.sectionTitle}>Platform fiyatları</Text>
        <Text style={s.eyebrow}>SEPET TOPLAMI · TESLİMAT ÜCRETİ HARİÇ</Text>

        {isSingle ? <Text style={s.note}>Bu sepet için yalnızca bir platformda tüm ürünleri bulduk; sıralama yapılamaz.</Text> : null}

        {comparable.map((p, i) => {
          const winner = isMulti && effective(p) === cheapest;
          const next = comparable.find((x) => effective(x) > cheapest);
          return (
            <Reveal key={String(p.platform.id)} index={i}>
            <PlatformRow
              p={p}
              count={itemCount}
              selected={selected?.platform.id === p.platform.id}
              onSelect={() => setSelectedId(p.platform.id)}
              winner={winner}
              gap={isMulti && !winner ? effective(p) - cheapest : 0}
              lead={winner && next ? effective(next) - cheapest : 0}
              onCode={() => openRowCode(p)}
            />
            </Reveal>
          );
        })}

        {comparable.length === 0 ? (
          <View style={s.emptyState}>
            <Mascot pose="no-results" size={110} />
            <Text style={s.emptyTitle}>
              {rows.length === 0 ? 'Sonuç bulunamadı.' : 'Bu sepetin tamamını hiçbir platformda bulamadık.'}
            </Text>
            <Text style={s.emptyText}>Eksik ürünleri sepetten çıkarıp tekrar karşılaştırabilirsin.</Text>
          </View>
        ) : null}

        {incomplete.length > 0 ? (
          <View style={s.incompleteWrap}>
            <Text style={s.eyebrow}>BAZI ÜRÜNLER BULUNAMADI · SIRALAMAYA DAHİL DEĞİL</Text>
            {incomplete.map((p) => <IncompleteCard key={String(p.platform.id)} p={p} />)}
          </View>
        ) : null}
      </ScrollView>

      {canOrder ? (
        <View style={[s.barWrap, { paddingBottom: insets.bottom + 12 }]}>
          <View style={s.barInfo}>
            <View style={{ flexShrink: 1 }}>
              <Text style={s.barName} numberOfLines={1}>{selected.platform.name}</Text>
              <Text style={s.barSub}>Sepet toplamı</Text>
            </View>
            <Text style={s.barPrice}>{money(effective(selected))}</Text>
          </View>
          <PressScale onPress={() => orderOn(selected)} style={s.bar} accessibilityRole="link">
            <Text style={s.barLabel}>{selected.order_link_kind === 'restaurant' ? 'Restoranı aç' : 'Platformu aç'}</Text>
            <Icon name="arrow" s={18} c="#fff" />
          </PressScale>
          <Text style={s.barNote}>Sepet aktarılmaz; ürünleri platformda seçersin.</Text>
        </View>
      ) : null}
    </View>
  );
}

function PlatformRow({ p, count, selected, onSelect, winner, gap, lead, onCode }) {
  const [open, setOpen] = useState(false);
  const coded   = hasCode(p);
  const codeOff = coded ? num(p.total) - num(p.total_after_code) : 0;
  const caveat  = coded ? usageCaveat(p.best_code.usage_limit) : null;
  return (
    <Pressable onPress={onSelect} style={[s.row, selected && s.rowSel]} accessibilityRole="radio" accessibilityState={{ selected }}>
      {winner ? (
        <View style={s.winTag}><Icon name="tag" s={13} c={T.ink} /><Text style={s.winTagText}>EN DÜŞÜK</Text></View>
      ) : null}
      <View style={s.rowTop}>
        <View style={[s.radio, selected && s.radioOn]}>{selected ? <View style={s.radioDot} /> : null}</View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.rowName} numberOfLines={1}>{p.platform.name}</Text>
          <Text style={s.rowSub}>{count} ürün · aynı sepet</Text>
        </View>
        <View style={s.priceCol}>
          {coded ? <Text style={s.struck}>{money(p.total)}</Text> : null}
          <Text style={s.price}>{money(effective(p))}</Text>
          {gap > 0 ? <Text style={s.gap}>+{money(Math.round(gap * 100) / 100)}</Text> : null}
        </View>
      </View>
      {selected ? (
        <View style={s.rowMore}>
          {lead > 0 ? <Text style={s.lead}>Sonraki seçeneğe göre {money(Math.round(lead * 100) / 100)} daha düşük.</Text> : null}
          {coded ? (
            <Pressable onPress={onCode} style={s.codeRow} hitSlop={6}>
              <Icon name="tag" s={14} c={T.green} />
              <Text style={s.codeText}>{p.best_code.code || p.best_code.title} uygulandı · −{money(codeOff)}</Text>
              <Icon name="chevR" s={12} c={T.sub} sw={2.2} />
            </Pressable>
          ) : null}
          {caveat ? <Text style={s.caveat}>{caveat}</Text> : null}
          <Pressable onPress={() => setOpen((o) => !o)} style={s.linesToggle} hitSlop={6}>
            <Text style={s.linesToggleText}>Ürünleri incele</Text>
            <Icon name="chevD" s={15} c={T.green} />
          </Pressable>
          {open ? (p.items ?? []).map((it, j) => <Text key={String(j)} style={s.line}>{lineText(it)}</Text>) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

function IncompleteCard({ p }) {
  const missing = (p.items ?? []).filter((it) => !it.found).length;
  const optMissing = (p.items ?? []).filter((it) => !it.found && it.options_status && it.options_status !== 'priced').length;
  return (
    <View style={s.incCard}>
      <View style={s.incTop}>
        <Text style={s.incName} numberOfLines={1}>{p.platform.name}</Text>
        <Text style={s.incDash}>—</Text>
      </View>
      {(p.items ?? []).filter((it) => !it.found).map((it, j) => (
        <Text key={String(j)} style={s.line}>{lineText(it)}</Text>
      ))}
      <Text style={s.incCaveat}>
        {optMissing ? `${optMissing} ürün bu seçeneklerle karşılaştırılamıyor` : `${missing} ürün bulunamadı`}; toplam gösterilmez.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: T.bg },
  header:    { paddingHorizontal: 18, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headTitle: { fontSize: 17, fontFamily: font.bold, color: T.ink, letterSpacing: -0.3 },
  scroll:    { paddingHorizontal: 20, paddingTop: 8 },

  summary:     { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#F1E6DA', borderRadius: 20, padding: 14, marginTop: 20 },
  summaryName: { fontSize: 16, fontFamily: font.bold, color: T.ink },
  summarySub:  { fontSize: 13, fontFamily: font.regular, color: T.sub, marginTop: 3 },
  editRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  editText:    { fontSize: 13, fontFamily: font.medium, color: T.ink },

  note:        { fontSize: 13, fontFamily: font.regular, color: T.ink, backgroundColor: T.sage, borderRadius: 14, padding: 14, marginTop: 14, lineHeight: 19 },
  sectionTitle:{ fontSize: 19, fontFamily: font.bold, color: T.ink, letterSpacing: -0.5, marginTop: 26 },
  eyebrow:     { fontSize: 10, fontFamily: font.semibold, color: T.sub, letterSpacing: 1.6, marginTop: 8, marginBottom: 12 },

  row:       { backgroundColor: T.white, borderRadius: 18, borderWidth: 1, borderColor: T.line, padding: 16, marginBottom: 12, overflow: 'hidden' },
  rowSel:    { borderColor: T.ink, borderWidth: 1.5 },
  winTag:    { position: 'absolute', top: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: T.yellow,
               paddingVertical: 5, paddingHorizontal: 10, borderBottomLeftRadius: 12 },
  winTagText:{ fontSize: 10.5, fontFamily: font.semibold, color: T.ink, letterSpacing: 0.8 },
  rowTop:    { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 6 },
  radio:     { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: T.faint, alignItems: 'center', justifyContent: 'center' },
  radioOn:   { borderColor: T.ink, backgroundColor: T.ink },
  radioDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  rowName:   { fontSize: 16, fontFamily: font.bold, color: T.ink, letterSpacing: -0.3 },
  rowSub:    { fontSize: 12.5, fontFamily: font.regular, color: T.sub, marginTop: 3 },
  priceCol:  { alignItems: 'flex-end' },
  struck:    { fontSize: 12, fontFamily: font.regular, color: T.faint, textDecorationLine: 'line-through' },
  price:     { fontSize: 21, fontFamily: font.bold, color: T.ink, letterSpacing: -0.6 },
  gap:       { fontSize: 12.5, fontFamily: font.regular, color: T.sub, marginTop: 2 },

  rowMore:   { marginLeft: 36, marginTop: 12, gap: 6 },
  lead:      { fontSize: 13, fontFamily: font.medium, color: T.green },
  codeRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  codeText:  { fontSize: 12.5, fontFamily: font.semibold, color: T.green, flexShrink: 1 },
  caveat:    { fontSize: 12, fontFamily: font.regular, color: T.sub },
  linesToggle:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  linesToggleText: { fontSize: 13, fontFamily: font.medium, color: T.green },
  line:      { fontSize: 12.5, fontFamily: font.regular, color: T.sub, lineHeight: 18 },

  emptyState:{ alignItems: 'center', paddingVertical: 20 },
  emptyTitle:{ fontSize: 18, fontFamily: font.medium, color: T.ink, textAlign: 'center', marginTop: 12 },
  emptyText: { fontSize: 13, fontFamily: font.regular, color: T.sub, textAlign: 'center', marginTop: 6 },

  incompleteWrap: { marginTop: 14 },
  incCard:   { backgroundColor: 'transparent', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: T.line, borderStyle: 'dashed', gap: 4 },
  incTop:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  incName:   { fontSize: 15, fontFamily: font.bold, color: T.sub, flexShrink: 1 },
  incDash:   { fontSize: 18, fontFamily: font.bold, color: T.faint },
  incCaveat: { fontSize: 12, fontFamily: font.medium, color: T.red, marginTop: 4 },

  barWrap:   { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: T.bg, borderTopWidth: 1, borderTopColor: T.line },
  barInfo:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 10 },
  barName:   { fontSize: 15, fontFamily: font.medium, color: T.ink },
  barSub:    { fontSize: 11.5, fontFamily: font.regular, color: T.sub, marginTop: 1 },
  barPrice:  { fontSize: 22, fontFamily: font.bold, color: T.ink, letterSpacing: -0.6 },
  bar:       { backgroundColor: T.ink, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  barLabel:  { fontSize: 16, fontFamily: font.bold, color: '#fff' },
  barNote:   { fontSize: 11.5, fontFamily: font.regular, color: T.sub, textAlign: 'center', marginTop: 8 },
});
