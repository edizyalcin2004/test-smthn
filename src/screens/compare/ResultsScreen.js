// ResultsScreen — STEP 2 minimal honest renderer. Shows the ranked platforms
// as neutral cards with effective price and per-item "bulunamadı". No winner
// badge, no savings claim, no single-vs-multi logic yet — that full spec lands
// in Step 3. Kept honest so this interim state can never mislead.
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, font, money } from '../../theme/tokens';
import { RoundBtn, Brand } from '../../components/ui';
import { Icon } from '../../components/icons';
import { platformBrand } from '../../lib/brand';
import { useCompare } from '../CompareScreen';

const effectiveTotal = (p) =>
  p.total_after_code != null && p.best_code != null ? p.total_after_code : p.total;

export default function ResultsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { restaurant, results, basket } = useCompare();
  const rows = results || [];
  const itemCount = Object.values(basket).reduce((a, { qty }) => a + qty, 0);

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 4 }]}>
        <RoundBtn onPress={() => navigation.goBack()} size={40}><Icon name="back" s={20} c={T.ink} /></RoundBtn>
        <View>
          <Text style={s.title}>Karşılaştırma sonuçları</Text>
          <Text style={s.sub}>{itemCount} ürün · {restaurant?.name ?? '1 restoran'}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {rows.map((p) => {
          const hasCode = p.total_after_code != null && p.best_code != null;
          return (
            <View key={String(p.platform.id)} style={s.card}>
              <View style={s.cardTop}>
                <Brand brand={platformBrand(p.platform)} size={40} radius={12} />
                <Text style={s.platform} numberOfLines={1}>{p.platform.name}</Text>
                <Text style={s.total}>{money(effectiveTotal(p))}</Text>
              </View>
              {(p.items ?? []).map((it, j) => (
                <Text key={String(j)} style={s.line}>
                  {it.found && it.price != null
                    ? `${it.name}: ${money(it.price)}`
                    : `${it.name}: bu platformda bulunamadı`}
                </Text>
              ))}
              {hasCode ? <Text style={s.code}>Kod: {p.best_code.code || p.best_code.title}</Text> : null}
            </View>
          );
        })}
        {rows.length === 0 ? <Text style={s.empty}>Sonuç bulunamadı</Text> : null}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:     { flex: 1, backgroundColor: T.bg },
  header:   { paddingHorizontal: 18, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  title:    { fontSize: 21, fontFamily: font.extrabold, color: T.ink, letterSpacing: -0.4 },
  sub:      { fontSize: 12.5, fontFamily: font.semibold, color: T.sub, marginTop: 2 },
  scroll:   { padding: 18, paddingBottom: 110 },
  card:     { backgroundColor: T.white, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: T.line },
  cardTop:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  platform: { flex: 1, fontSize: 15, fontFamily: font.extrabold, color: T.ink },
  total:    { fontSize: 19, fontFamily: font.extrabold, color: T.ink },
  line:     { fontSize: 13, fontFamily: font.medium, color: T.sub, marginTop: 4 },
  code:     { fontSize: 12.5, fontFamily: font.bold, color: T.green, marginTop: 8 },
  empty:    { fontSize: 14, fontFamily: font.semibold, color: T.faint, textAlign: 'center', marginTop: 40 },
});
