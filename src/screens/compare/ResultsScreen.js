// ResultsScreen — the honesty-critical screen.
//
// /compare-basket returns platforms pre-sorted by effective total ascending.
// We split them into:
//   comparable — every basket item was found (totals are like-for-like)
//   incomplete — ≥1 item missing (total is truncated, NOT comparable)
// The winner badge + savings claim key off comparable.length, never the raw
// row count, so:
//   ≥2 comparable → rank + EN UCUZ + "vs most expensive" savings
//    1 comparable → one neutral card, no rank/badge/savings
//    0 comparable → no winner, only the incomplete block + empty note
// Incomplete platforms are shown separately, never ranked, never badged, and
// never with a headline price (a truncated total must not read as "cheapest").
// No delivery/ETA is shown — the backend returns none, so we invent none.
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, font, money } from '../../theme/tokens';
import { RoundBtn, Brand, Pill } from '../../components/ui';
import { Icon } from '../../components/icons';
import { platformBrand } from '../../lib/brand';
import { useCompare } from '../CompareScreen';
import { useCodeSheet } from '../../components/CodeSheet';

const num = (v) => Number(v ?? 0);
const hasCode = (p) => p.total_after_code != null && p.best_code != null;
const effective = (p) => num(hasCode(p) ? p.total_after_code : p.total);
const allFound = (p) => (p.items ?? []).length > 0 && p.items.every((it) => it.found);

function usageCaveat(u) {
  if (u === 'once_per_user') return 'Kullanıcı başına 1 kez';
  if (u === 'first_order')   return 'İlk siparişe özel';
  return u ? String(u) : null;
}

export default function ResultsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { restaurant, results, basket } = useCompare();
  const { openCode } = useCodeSheet();

  const rows = results ?? [];
  const itemCount = Object.values(basket).reduce((a, { qty }) => a + qty, 0);

  const comparable = rows.filter(allFound).slice().sort((a, b) => effective(a) - effective(b));
  const incomplete = rows.filter((p) => !allFound(p));
  const isMulti  = comparable.length >= 2;
  const isSingle = comparable.length === 1;

  // Open the shared CodeSheet for a row's auto-applied code, enriched with the
  // platform + restaurant so the sheet can render its tile and compare CTA.
  const openRowCode = (p) =>
    openCode({ ...p.best_code, platform: p.platform, restaurant_id: restaurant?.id });

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 4 }]}>
        <RoundBtn onPress={() => navigation.goBack()} size={40}><Icon name="back" s={20} c={T.ink} /></RoundBtn>
        <View style={{ flexShrink: 1 }}>
          <Text style={s.title} numberOfLines={1}>Karşılaştırma sonuçları</Text>
          <Text style={s.sub} numberOfLines={1}>{itemCount} ürün · {restaurant?.name ?? '1 restoran'}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {isSingle ? (
          <Text style={s.note}>
            Bu restoran tek platformda satılıyor — karşılaştırılacak başka fiyat yok.
          </Text>
        ) : null}

        {/* comparable platforms */}
        {comparable.map((p, i) => (
          <PlatformCard
            key={String(p.platform.id)}
            p={p}
            rank={isMulti ? i + 1 : null}
            winner={isMulti && i === 0}
            onCode={() => openRowCode(p)}
          />
        ))}

        {/* nothing comparable to rank */}
        {comparable.length === 0 ? (
          <Text style={s.empty}>
            {rows.length === 0
              ? 'Sonuç bulunamadı.'
              : 'Sepetteki ürünler için karşılaştırılabilir fiyat bulunamadı.'}
          </Text>
        ) : null}

        {/* incomplete platforms — shown, never ranked */}
        {incomplete.length > 0 ? (
          <View style={s.incompleteWrap}>
            <Text style={s.incompleteHead}>Bazı ürünler bulunamadı</Text>
            {incomplete.map((p) => <IncompleteCard key={String(p.platform.id)} p={p} />)}
          </View>
        ) : null}

        {/* Filtrele & Sırala (design element; sort/filter not yet wired) */}
        {rows.length > 0 ? (
          <Pressable style={s.filterBtn} onPress={() => {}}>
            <Icon name="filter" s={18} c="#fff" />
            <Text style={s.filterText}>Filtrele &amp; Sırala</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

function PlatformCard({ p, rank, winner, onCode }) {
  const brand   = platformBrand(p.platform);
  const coded   = hasCode(p);
  const codeOff = coded ? num(p.total) - num(p.total_after_code) : 0;
  const caveat  = coded ? usageCaveat(p.best_code.usage_limit) : null;

  return (
    <View style={[s.card, winner && s.cardWin]}>
      <View style={s.cardTop}>
        {rank != null ? (
          <View style={[s.rank, winner && s.rankWin]}>
            <Text style={[s.rankText, winner && s.rankTextWin]}>{rank}</Text>
          </View>
        ) : null}
        <Brand brand={brand} size={40} radius={12} />
        <View style={s.meta}>
          <View style={s.nameRow}>
            <Text style={s.platform} numberOfLines={1}>{p.platform.name}</Text>
            {winner ? <Pill bg={T.greenSoft} fg={T.green} textStyle={s.winPillText}>EN UCUZ</Pill> : null}
          </View>
          {coded ? (
            <Pressable onPress={onCode} style={s.codeRow} hitSlop={6}>
              <Icon name="bolt" s={12} c={T.green} sw={0} />
              <Text style={s.codeText}>{p.best_code.code || `Kampanya: ${p.best_code.title}`}</Text>
              <Text style={s.codeApplied}>uygulandı</Text>
              <Icon name="chevR" s={12} c={T.faint} sw={2.4} />
            </Pressable>
          ) : (
            <Text style={s.noCode}>Kod yok</Text>
          )}
          {caveat ? <Text style={s.caveat}>· {caveat}</Text> : null}
        </View>
        <View style={s.priceCol}>
          {coded ? <Text style={s.struck}>{money(p.total)}</Text> : null}
          <Text style={[s.price, winner && s.priceWin]}>{money(effective(p))}</Text>
          {coded ? <Text style={s.off}>−{money(codeOff)}</Text> : null}
        </View>
      </View>

      <View style={s.lines}>
        {(p.items ?? []).map((it, j) => (
          <Text key={String(j)} style={s.line}>
            {it.found && it.price != null
              ? `${it.name}: ${money(it.price)}`
              : `${it.name}: bu platformda bulunamadı`}
          </Text>
        ))}
      </View>
    </View>
  );
}

function IncompleteCard({ p }) {
  const brand   = platformBrand(p.platform);
  const missing = (p.items ?? []).filter((it) => !it.found).length;
  return (
    <View style={s.incCard}>
      <View style={s.incTop}>
        <Brand brand={brand} size={34} radius={11} />
        <Text style={s.incName} numberOfLines={1}>{p.platform.name}</Text>
      </View>
      {(p.items ?? []).map((it, j) => (
        <Text key={String(j)} style={s.line}>
          {it.found && it.price != null
            ? `${it.name}: ${money(it.price)}`
            : `${it.name}: bu platformda bulunamadı`}
        </Text>
      ))}
      <Text style={s.incCaveat}>{missing} ürün bulunamadı — toplam karşılaştırmaya dahil edilmedi</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: T.bg },
  header:  { paddingHorizontal: 18, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  title:   { fontSize: 21, fontFamily: font.extrabold, color: T.ink, letterSpacing: -0.4 },
  sub:     { fontSize: 12.5, fontFamily: font.semibold, color: T.sub, marginTop: 2 },
  scroll:  { padding: 18, paddingBottom: 110 },

  note:    { fontSize: 13, fontFamily: font.semibold, color: T.sub, backgroundColor: T.blueSoft2, borderRadius: 14, padding: 14, marginBottom: 14, lineHeight: 19 },
  empty:   { fontSize: 14, fontFamily: font.semibold, color: T.faint, textAlign: 'center', marginTop: 24 },

  card:    { backgroundColor: T.white, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: T.line },
  cardWin: { borderWidth: 2, borderColor: T.green },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rank:    { width: 26, height: 26, borderRadius: 999, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' },
  rankWin: { backgroundColor: T.green },
  rankText:{ fontSize: 13, fontFamily: font.extrabold, color: T.faint },
  rankTextWin: { color: '#fff' },

  meta:    { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  platform:{ fontSize: 15, fontFamily: font.extrabold, color: T.ink, flexShrink: 1 },
  winPillText: { fontSize: 10.5, fontFamily: font.extrabold },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  codeText:{ fontSize: 12, fontFamily: font.bold, color: T.green },
  codeApplied: { fontSize: 12, fontFamily: font.semibold, color: T.sub },
  noCode:  { fontSize: 12, fontFamily: font.semibold, color: T.faint, marginTop: 5 },
  caveat:  { fontSize: 11.5, fontFamily: font.semibold, color: T.sub, marginTop: 3 },

  priceCol:{ alignItems: 'flex-end' },
  struck:  { fontSize: 12.5, fontFamily: font.medium, color: T.faint, textDecorationLine: 'line-through' },
  price:   { fontSize: 19, fontFamily: font.extrabold, color: T.ink, letterSpacing: -0.3 },
  priceWin:{ color: T.green },
  off:     { fontSize: 12, fontFamily: font.bold, color: T.green, marginTop: 1 },

  lines:   { marginTop: 12, paddingTop: 11, borderTopWidth: 1, borderTopColor: T.line, gap: 4 },
  line:    { fontSize: 13, fontFamily: font.medium, color: T.sub },

  incompleteWrap: { marginTop: 10 },
  incompleteHead: { fontSize: 13, fontFamily: font.extrabold, color: T.faint, letterSpacing: 0.4, marginBottom: 10, textTransform: 'uppercase' },
  incCard: { backgroundColor: T.white, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: T.line, gap: 4 },
  incTop:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  incName: { fontSize: 14, fontFamily: font.bold, color: T.sub, flexShrink: 1 },
  incCaveat: { fontSize: 11.5, fontFamily: font.bold, color: T.coral, marginTop: 6 },

  filterBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: T.navy, borderRadius: 16, paddingVertical: 15, marginTop: 6 },
  filterText: { fontSize: 15, fontFamily: font.extrabold, color: '#fff' },
});
