// BudgetScreen — "Tasarruf" (redesign PR 4, designs 14/21): what the user
// saved with Doybi (D-030). Every number comes from orders the user CONFIRMED
// in the return popup (OrderCheck), stored on this phone only. Saved = average
// of the other complete platforms minus what they paid (D-031). With no
// confirmed order the screen says so; an estimate is never shown as a saving.
import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { T, font, money, serif } from '../theme/tokens';
import { Screen, Title, PrimaryButton } from '../components/ui';
import { Icon } from '../components/icons';
import { FoodArt, Mascot, foodType } from '../components/Art';
import { loadOrders } from '../lib/orders';
import { summarize, itemsLine } from '../lib/savings';

const SRC = [
  { id: 'price', label: 'Platformlar arası fiyat farkı', color: T.green },
  { id: 'code',  label: 'Otomatik uygulanan kodlar',     color: T.yellow },
];
const dateTR = (t) => new Date(t).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
const tl = (n) => money(Math.round(n * 100) / 100);

const W = 300, H = 110, MAX_POINTS = 8;

export default function BudgetScreen({ navigation }) {
  const [orders, setOrders] = useState(null);
  useFocusEffect(useCallback(() => { loadOrders().then(setOrders); }, []));
  if (orders === null) return <Screen />;
  const sv = summarize(orders, Date.now());
  if (!sv.count) return <EmptyBudget navigation={navigation} />;

  // Cumulative saving over the last confirmed orders (oldest -> newest).
  const last = orders.slice().sort((a, b) => a.at - b.at).slice(-MAX_POINTS);
  const before = sv.total - last.reduce((a, o) => a + o.saved, 0);
  const cum = [before];
  for (const o of last) cum.push(cum[cum.length - 1] + o.saved);
  const lo = Math.min(...cum), hi = Math.max(...cum), span = Math.max(1, hi - lo);
  const pts = cum.map((v, i) => [(i / (cum.length - 1)) * W, H - 8 - ((v - lo) / span) * (H - 20)]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = `${line} L${W} ${H} L0 ${H} Z`;

  const sources = SRC.map((x) => ({ ...x, amt: sv.sources[x.id] })).filter((x) => x.amt > 0);
  const sourceTotal = sources.reduce((a, b) => a + b.amt, 0);

  return (
    <Screen>
      <View style={s.head}>
        <Title accent="birikir.">İyi seçimler</Title>
        <Text style={s.lead}>Onayladığın siparişlerin özeti. Yalnızca bu telefonda tutulur.</Text>
      </View>

      <View style={s.hero}>
        <View style={{ flex: 1 }}>
          <Text style={s.heroEyebrow}>TOPLAM TASARRUF</Text>
          <Text style={s.heroAmount} adjustsFontSizeToFit numberOfLines={1}>{tl(sv.total)}</Text>
          <Text style={s.heroAccent}>Az az, güzel bir fark.</Text>
          <Text style={s.heroSub}>Diğer platformların ortalamasına göre.</Text>
        </View>
        <Mascot pose="savings-success" size={128} />
      </View>

      <View style={s.tiles}>
        <Tile n={String(sv.count)} label={'Onaylanan\nsipariş'} />
        <Tile n={tl(sv.avgPerOrder)} label={'Sipariş başına\nortalama'} />
        <Tile n={tl(sv.thisMonth)} label={`${sv.month}\ntasarrufu`} />
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Tasarrufun gelişimi</Text>
        <View style={s.card}>
          <View style={s.cardHead}>
            <Text style={s.eyebrow}>SON {last.length} SİPARİŞ</Text>
            <View style={s.pill}><Text style={s.pillText}>Birikimli</Text></View>
          </View>
          <Svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
            {[0.25, 0.6].map((f) => <Line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke={T.line} strokeWidth={1} />)}
            <Path d={area} fill={T.sage} />
            <Path d={line} fill="none" stroke={T.green} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx={pts[pts.length - 1][0] - 4} cy={pts[pts.length - 1][1]} r={4.5} fill={T.green} />
          </Svg>
          <View style={s.axis}>
            <Text style={s.axisText}>{before > 0 ? 'Önce' : 'Başlangıç'}</Text>
            <Text style={s.axisText}>{dateTR(last[last.length - 1].at)}</Text>
          </View>
          {sv.cheapestRate != null ? (
            <Text style={s.cardNote}>Karşılaştırdığın siparişlerin %{sv.cheapestRate}'ini en uygun platformdan verdin.</Text>
          ) : null}
        </View>
      </View>

      {sourceTotal > 0 ? (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Tasarruf nereden geldi?</Text>
          <View style={s.card}>
            <View style={s.stackBar}>
              {sources.map((src) => <View key={src.id} style={{ flex: src.amt / sourceTotal, backgroundColor: src.color }} />)}
            </View>
            <View style={{ marginTop: 14, gap: 11 }}>
              {sources.map((src) => (
                <View key={src.id} style={s.srcRow}>
                  <View style={[s.srcDot, { backgroundColor: src.color }]} />
                  <Text style={s.srcLabel}>{src.label}</Text>
                  <Text style={s.srcAmt}>{tl(src.amt)}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ) : null}

      <View style={s.section}>
        <Text style={s.sectionTitle}>Son siparişler</Text>
        {sv.recent.map((r) => (
          <View key={r.id} style={s.recentRow}>
            <FoodArt type={foodType(`${r.restaurant.name} ${itemsLine(r.items)}`)} size={50} round={false} radius={12} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.recentName} numberOfLines={1}>{r.restaurant.name}</Text>
              <Text style={s.recentSub} numberOfLines={1}>{r.platform.name} · {dateTR(r.at)} · {tl(r.paid)}</Text>
            </View>
            <Text style={[s.recentSaved, r.saved <= 0 && { color: T.sub }]}>{r.saved > 0 ? `−${tl(r.saved)}` : '—'}</Text>
          </View>
        ))}
      </View>

      <View style={s.section}>
        <PrimaryButton onPress={() => navigation.navigate('Compare')}>Yeni bir sepet karşılaştır</PrimaryButton>
      </View>
    </Screen>
  );
}

function Tile({ n, label }) {
  return (
    <View style={s.tile}>
      <Text style={s.tileN} adjustsFontSizeToFit numberOfLines={1}>{n}</Text>
      <Text style={s.tileLabel}>{label}</Text>
    </View>
  );
}

function EmptyBudget({ navigation }) {
  return (
    <Screen>
      <View style={s.empty}>
        <Mascot pose="empty-basket" size={190} />
        <Title accent="senden gelsin." style={s.emptyTitle}>İlk güzel fark</Title>
        <Text style={s.emptyText}>Siparişini tamamlayıp ödediğin tutarı onayladığında tasarrufun burada birikir.</Text>
        <PrimaryButton onPress={() => navigation.navigate('Compare')} style={s.emptyBtn}>Karşılaştırmaya başla</PrimaryButton>
        <View style={s.note}>
          <Icon name="help" s={15} c={T.sub} />
          <Text style={s.noteText}>Henüz onaylanmış sipariş yok. Tahmini tasarrufu gerçekleşmiş gibi göstermiyoruz.</Text>
        </View>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  head:        { paddingHorizontal: 20, paddingTop: 10 },
  lead:        { fontSize: 14, fontFamily: font.regular, color: T.sub, marginTop: 8 },

  hero:        { marginHorizontal: 20, marginTop: 20, backgroundColor: T.navy, borderRadius: 24, padding: 22, flexDirection: 'row', alignItems: 'center', gap: 8, overflow: 'hidden' },
  heroEyebrow: { fontSize: 10, fontFamily: font.semibold, color: 'rgba(255,255,255,0.75)', letterSpacing: 1.8 },
  heroAmount:  { fontSize: 40, fontFamily: font.medium, color: '#fff', letterSpacing: -1.6, marginTop: 12 },
  heroAccent:  { fontSize: 17, fontFamily: serif, fontStyle: 'italic', color: T.yellow, marginTop: 4 },
  heroSub:     { fontSize: 12, fontFamily: font.regular, color: 'rgba(255,255,255,0.8)', marginTop: 8 },

  tiles:       { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 14 },
  tile:        { flex: 1, backgroundColor: T.white, borderRadius: 16, borderWidth: 1, borderColor: T.line, padding: 12 },
  tileN:       { fontSize: 18, fontFamily: font.bold, color: T.ink, letterSpacing: -0.5 },
  tileLabel:   { fontSize: 11.5, fontFamily: font.regular, color: T.sub, marginTop: 6, lineHeight: 15 },

  section:     { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle:{ fontSize: 19, fontFamily: font.bold, color: T.ink, letterSpacing: -0.5, marginBottom: 12 },
  card:        { backgroundColor: T.white, borderRadius: 20, borderWidth: 1, borderColor: T.line, padding: 16 },
  cardHead:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  eyebrow:     { fontSize: 10, fontFamily: font.semibold, color: T.sub, letterSpacing: 1.6 },
  pill:        { backgroundColor: '#EFEEE7', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  pillText:    { fontSize: 11.5, fontFamily: font.regular, color: T.sub },
  axis:        { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  axisText:    { fontSize: 11.5, fontFamily: font.regular, color: T.sub },
  cardNote:    { fontSize: 12.5, fontFamily: font.regular, color: T.ink, marginTop: 12 },

  stackBar:    { flexDirection: 'row', height: 12, borderRadius: 999, overflow: 'hidden', gap: 3 },
  srcRow:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  srcDot:      { width: 10, height: 10, borderRadius: 5 },
  srcLabel:    { flex: 1, fontSize: 13.5, fontFamily: font.regular, color: T.ink },
  srcAmt:      { fontSize: 13.5, fontFamily: font.semibold, color: T.ink },

  recentRow:   { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.line },
  recentName:  { fontSize: 15, fontFamily: font.bold, color: T.ink, letterSpacing: -0.3 },
  recentSub:   { fontSize: 12.5, fontFamily: font.regular, color: T.sub, marginTop: 3 },
  recentSaved: { fontSize: 15, fontFamily: font.semibold, color: T.green },

  empty:       { alignItems: 'center', paddingHorizontal: 28, paddingTop: 40 },
  emptyTitle:  { textAlign: 'center', marginTop: 20 },
  emptyText:   { fontSize: 14, fontFamily: font.regular, color: T.sub, textAlign: 'center', marginTop: 12, lineHeight: 21 },
  emptyBtn:    { marginTop: 24 },
  note:        { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 28 },
  noteText:    { flex: 1, fontSize: 12, fontFamily: font.regular, color: T.sub, lineHeight: 17 },
});
