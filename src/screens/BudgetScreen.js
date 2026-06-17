// BudgetScreen — Bütçe / monthly spend + trend. Presentation only (mock copy).
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, font, money } from '../theme/tokens';
import { Screen, Card, Header, Pill } from '../components/ui';
import { Icon } from '../components/icons';
import Food from '../components/Food';

// mock display copy
const BUDGET = {
  spent: 1240,
  limit: 2000,
  trend: [
    { m: 'Kas', v: 0.62 }, { m: 'Ara', v: 0.78 }, { m: 'Oca', v: 0.54 },
    { m: 'Şub', v: 0.7 }, { m: 'Mar', v: 0.46 }, { m: 'Nis', v: 0.62 },
  ],
};

export default function BudgetScreen({ navigation }) {
  const { spent, limit, trend } = BUDGET;
  const pct = Math.round((spent / limit) * 100);
  const maxV = Math.max(...trend.map((t) => t.v));

  return (
    <Screen>
      <Header title="Bütçe" onBell={() => navigation.navigate('Deals')} />

      {/* spend summary */}
      <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
        <Text style={s.summaryLabel}>Bu ay harcama özeti</Text>
        <View style={s.amountRow}>
          <Text style={s.amount}>{money(spent)}</Text>
          <Text style={s.amountLimit}>/ {money(limit)}</Text>
        </View>
        <Text style={s.pctLabel}>%{pct} kullanıldı</Text>
        <View style={s.track}>
          <LinearGradient colors={[T.blue, '#5C8BFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.trackFill, { width: `${pct}%` }]} />
        </View>
      </View>

      {/* trend chart (dark navy) */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
        <LinearGradient colors={['#0C2C5C', '#061B3A']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={s.chartCard}>
          <View style={s.chartHead}>
            <Text style={s.chartTitle}>Harcama trendi</Text>
            <Pill bg="rgba(255,255,255,0.12)" fg="rgba(255,255,255,0.85)">Son 6 ay</Pill>
          </View>
          <View style={s.bars}>
            {trend.map((t, i) => {
              const last = i === trend.length - 1;
              return (
                <View key={i} style={s.barCol}>
                  <View style={s.barTrack}>
                    {last ? (
                      <LinearGradient colors={['#5C8BFF', T.blue]} style={[s.bar, { height: `${(t.v / maxV) * 100}%` }]} />
                    ) : (
                      <View style={[s.bar, { height: `${(t.v / maxV) * 100}%`, backgroundColor: 'rgba(255,255,255,0.16)' }]} />
                    )}
                  </View>
                  <Text style={[s.barLabel, { color: last ? '#fff' : 'rgba(255,255,255,0.45)' }]}>{t.m}</Text>
                </View>
              );
            })}
          </View>
        </LinearGradient>
      </View>

      {/* monthly budget editor */}
      <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
        <Card style={s.editorRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.editorLabel}>Aylık bütçe</Text>
            <Text style={s.editorValue}>{money(limit)}</Text>
          </View>
          <Pressable style={s.editBtn}>
            <Icon name="edit" s={15} c={T.blue} />
            <Text style={s.editBtnText}>Bütçeyi düzenle</Text>
          </Pressable>
        </Card>
      </View>

      {/* find within budget */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
        <Card onPress={() => navigation.navigate('Compare')} style={s.findRow}>
          <View style={s.findIcon}><Food name="receipt" s={30} /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.findTitle}>Bütçene uygun yemekler bul</Text>
            <Text style={s.findSub}>{money(limit - spent)} altındaki seçenekleri keşfet</Text>
          </View>
          <Icon name="chevR" s={19} c={T.faint} sw={2.2} />
        </Card>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  summaryLabel: { fontSize: 13.5, fontFamily: font.bold, color: T.sub },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 8 },
  amount: { fontSize: 38, fontFamily: font.extrabold, color: T.ink, letterSpacing: -1.1 },
  amountLimit: { fontSize: 16, fontFamily: font.bold, color: T.faint },
  pctLabel: { fontSize: 12.5, fontFamily: font.bold, color: T.sub, marginTop: 10 },
  track: { height: 9, borderRadius: 999, backgroundColor: T.line, marginTop: 8, overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 999 },

  chartCard: { borderRadius: 22, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 16 },
  chartHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  chartTitle: { fontSize: 15, fontFamily: font.extrabold, color: '#fff' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 120, gap: 12 },
  barCol: { flex: 1, alignItems: 'center', gap: 9, height: '100%', justifyContent: 'flex-end' },
  barTrack: { width: '100%', maxWidth: 26, height: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 7 },
  barLabel: { fontSize: 11, fontFamily: font.bold },

  editorRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  editorLabel: { fontSize: 12.5, fontFamily: font.bold, color: T.sub },
  editorValue: { fontSize: 24, fontFamily: font.extrabold, color: T.ink, letterSpacing: -0.4, marginTop: 3 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: T.blueSoft, paddingVertical: 11, paddingHorizontal: 16, borderRadius: 13 },
  editBtnText: { color: T.blue, fontFamily: font.extrabold, fontSize: 13.5 },

  findRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  findIcon: { width: 46, height: 46, borderRadius: 13, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' },
  findTitle: { fontSize: 15, fontFamily: font.extrabold, color: T.ink },
  findSub: { fontSize: 12.5, color: T.sub, marginTop: 2, fontFamily: font.semibold },
});
