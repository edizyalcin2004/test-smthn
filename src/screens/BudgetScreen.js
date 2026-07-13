// BudgetScreen — "Tasarruf" / how much you saved with Pryce.
// Presentation only (mock copy, same class as the previous Bütçe build):
// no savings tracking exists backend-side yet, so every number here is
// display copy — flagged, never presented as live data elsewhere.
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { T, font, money } from '../theme/tokens';
import { Screen, Card, Header, Pill, SectionHead } from '../components/ui';
import { Icon, Spark } from '../components/icons';
import Food from '../components/Food';
import { restaurantTile } from '../lib/brand';

const mascot = require('../../assets/mascot.png');

// mock display copy
const SAVINGS = {
  month: 'Haziran',
  thisMonth: 200,
  total: 1340,
  cheapestRate: 100,
  avgPerOrder: 11,
  trend: [
    { m: 'Oca', v: 95 }, { m: 'Şub', v: 130 }, { m: 'Mar', v: 110 },
    { m: 'Nis', v: 165 }, { m: 'May', v: 175 }, { m: 'Haz', v: 200 },
  ],
  sources: [
    { id: 'compare',  label: 'Fiyat karşılaştırma', amt: 92, color: '#3D5AF1' },
    { id: 'codes',    label: 'İndirim kodları',     amt: 78, color: '#F5A524' },
    { id: 'delivery', label: 'Teslimat ücreti',     amt: 30, color: '#2BAE66' },
  ],
  recent: [
    { id: 'r1', name: 'Big Mac Menü',          restaurant: "McDonald's",   saved: 35, vs: 'en pahalı platform', date: '18 Haz' },
    { id: 'r2', name: 'Whopper® Menü',         restaurant: 'Burger King',  saved: 28, vs: 'YEMEKSEPETI50 kodu', date: '15 Haz' },
    { id: 'r3', name: 'Chicken Sandwich Menü', restaurant: 'Popeyes',      saved: 22, vs: 'ücretsiz teslimat',  date: '12 Haz' },
    { id: 'r4', name: "Domino's Orta Pizza",   restaurant: "Domino's Pizza", saved: 19, vs: 'en pahalı platform', date: '9 Haz' },
  ],
};

// trend line geometry (viewBox units)
const W = 300, H = 96;

export default function BudgetScreen({ navigation }) {
  const sv = SAVINGS;
  const maxV = Math.max(...sv.trend.map((t) => t.v));
  const sourceTotal = sv.sources.reduce((a, b) => a + b.amt, 0);
  const n = sv.trend.length;
  const pts = sv.trend.map((t, i) => [(i / (n - 1)) * W, H - (t.v / maxV) * (H - 14) - 6]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = `M0 ${H} L${pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L')} L${W} ${H} Z`;

  return (
    <Screen>
      <Header title="Tasarruf" onBell={() => navigation.navigate('Deals')} />

      {/* hero — saved this month */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <LinearGradient colors={['#0C2C5C', '#061B3A']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={s.hero}>
          <Spark s={15} style={{ position: 'absolute', left: '56%', top: '20%' }} />
          <Spark s={10} o={0.7} style={{ position: 'absolute', left: '78%', top: '44%' }} />
          <Spark s={11} o={0.6} style={{ position: 'absolute', left: '66%', top: '70%' }} />
          <Image source={mascot} style={s.heroMascot} resizeMode="contain" />
          <View style={{ maxWidth: '72%' }}>
            <View style={s.heroEyebrow}>
              <Icon name="spark" s={14} c={T.amber} sw={0} />
              <Text style={s.heroEyebrowText}>{sv.month} ayında Pryce ile</Text>
            </View>
            <View style={s.heroAmountRow}>
              <Text style={s.heroTL}>₺</Text>
              <Text style={s.heroAmount}>{sv.thisMonth}</Text>
            </View>
            <Text style={s.heroSub}>tasarruf ettin 🎉</Text>
            <View style={s.heroBadge}>
              <Icon name="check" s={13} c="#5FE0A0" sw={3} />
              <Text style={s.heroBadgeText}>Her siparişte en ucuzu bulduk</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* stat tiles */}
      <View style={s.tileRow}>
        {[
          { n: money(sv.total),       label: 'Toplam\ntasarruf', c: T.green },
          { n: '%' + sv.cheapestRate, label: 'En ucuzu\nbulma',  c: T.blue },
          { n: money(sv.avgPerOrder), label: 'Sipariş\nbaşına',  c: T.gold },
        ].map((t, i) => (
          <Card key={String(i)} pad={13} style={s.tile}>
            <Text style={[s.tileN, { color: t.c }]}>{t.n}</Text>
            <Text style={s.tileLabel}>{t.label}</Text>
          </Card>
        ))}
      </View>

      {/* savings trend */}
      <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
        <Card>
          <View style={s.trendHead}>
            <Text style={s.cardTitle}>Tasarruf trendi</Text>
            <Pill bg={T.greenSoft} fg={T.green} textStyle={s.trendPillText}>
              <Icon name="spark" s={11} c={T.green} sw={0} />
              <Text style={[s.trendPillText, { color: T.green }]}>Yükselişte</Text>
            </Pill>
          </View>
          <Text style={s.cardSub}>Son 6 ay · aylık tasarruf</Text>
          <View>
            <Svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
              <Defs>
                <SvgGradient id="savg" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={T.green} stopOpacity="0.22" />
                  <Stop offset="1" stopColor={T.green} stopOpacity="0" />
                </SvgGradient>
              </Defs>
              <Path d={area} fill="url(#savg)" />
              <Path d={line} fill="none" stroke={T.green} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
              {pts.map((p, i) => {
                const last = i === pts.length - 1;
                return (
                  <Circle
                    key={String(i)}
                    cx={p[0]} cy={p[1]} r={last ? 5.5 : 3.5}
                    fill={last ? T.green : '#fff'}
                    stroke={T.green} strokeWidth={last ? 3 : 2.4}
                  />
                );
              })}
            </Svg>
            <View style={s.trendTag}><Text style={s.trendTagText}>{money(sv.thisMonth)}</Text></View>
          </View>
          <View style={s.trendMonths}>
            {sv.trend.map((t, i) => (
              <Text key={t.m} style={[s.trendMonth, i === sv.trend.length - 1 && { color: T.ink }]}>{t.m}</Text>
            ))}
          </View>
        </Card>
      </View>

      {/* where savings came from */}
      <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
        <Card>
          <Text style={s.cardTitle}>Tasarruf nereden geldi?</Text>
          <Text style={s.cardSub}>Bu ay · {money(sv.thisMonth)}</Text>
          <View style={s.stackBar}>
            {sv.sources.map((src) => (
              <View key={src.id} style={{ flex: src.amt / sourceTotal, backgroundColor: src.color, borderRadius: 4 }} />
            ))}
          </View>
          <View style={{ marginTop: 14, gap: 11 }}>
            {sv.sources.map((src) => (
              <View key={src.id} style={s.srcRow}>
                <View style={[s.srcDot, { backgroundColor: src.color }]} />
                <Text style={s.srcLabel}>{src.label}</Text>
                <Text style={s.srcAmt}>{money(src.amt)}</Text>
              </View>
            ))}
          </View>
        </Card>
      </View>

      {/* recent savings */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
        <SectionHead title="Son tasarruflar" />
        <Card pad={0}>
          {sv.recent.map((r, i) => {
            const tile = restaurantTile({ name: r.restaurant });
            return (
              <View key={r.id} style={[s.recentRow, i ? s.recentBorder : null]}>
                <View style={[s.recentTile, { backgroundColor: tile.bg }]}><Food name={tile.food} s={26} /></View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.recentName} numberOfLines={1}>{r.name}</Text>
                  <Text style={s.recentSub} numberOfLines={1}>{r.vs} · {r.date}</Text>
                </View>
                <View style={s.recentSaved}>
                  <Icon name="minus" s={13} c={T.green} sw={3} />
                  <Text style={s.recentSavedText}>{money(r.saved)}</Text>
                </View>
              </View>
            );
          })}
        </Card>
      </View>

      {/* CTA */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <Card onPress={() => navigation.navigate('Compare')} style={s.cta}>
          <View style={s.ctaIcon}><Icon name="search" s={22} c={T.blue} /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.ctaTitle}>Tasarrufa devam et</Text>
            <Text style={s.ctaSub}>Yeni bir sipariş karşılaştır</Text>
          </View>
          <Icon name="chevR" s={19} c={T.blue} sw={2.2} />
        </Card>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  hero:        { borderRadius: 24, paddingVertical: 22, paddingHorizontal: 20, overflow: 'hidden' },
  heroMascot:  { position: 'absolute', right: -14, bottom: -16, width: 122, height: 122 },
  heroEyebrow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroEyebrowText: { fontSize: 12.5, fontFamily: font.bold, color: 'rgba(255,255,255,0.82)' },
  heroAmountRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 10 },
  heroTL:      { fontSize: 13, fontFamily: font.bold, color: T.amber, marginBottom: 8 },
  heroAmount:  { fontSize: 46, fontFamily: font.extrabold, color: '#fff', letterSpacing: -1.4, lineHeight: 48 },
  heroSub:     { fontSize: 14, fontFamily: font.bold, color: 'rgba(255,255,255,0.72)', marginTop: 6 },
  heroBadge:   {
    marginTop: 14, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(43,174,102,0.18)', borderWidth: 1, borderColor: 'rgba(43,174,102,0.35)',
    borderRadius: 10, paddingVertical: 6, paddingHorizontal: 11,
  },
  heroBadgeText: { fontSize: 11.5, fontFamily: font.extrabold, color: '#7BE9B0' },

  tileRow:   { paddingHorizontal: 20, paddingTop: 14, flexDirection: 'row', gap: 11 },
  tile:      { flex: 1, gap: 6 },
  tileN:     { fontSize: 21, fontFamily: font.extrabold, letterSpacing: -0.4 },
  tileLabel: { fontSize: 11, fontFamily: font.semibold, color: T.sub, lineHeight: 14 },

  cardTitle: { fontSize: 15, fontFamily: font.extrabold, color: T.ink },
  cardSub:   { fontSize: 12, fontFamily: font.semibold, color: T.sub, marginTop: 3, marginBottom: 14 },

  trendHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  trendPillText: { fontSize: 11, fontFamily: font.bold },
  trendTag:  { position: 'absolute', right: 0, top: -6, backgroundColor: T.navy, borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8 },
  trendTagText: { fontSize: 11.5, fontFamily: font.extrabold, color: '#fff' },
  trendMonths: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  trendMonth:  { fontSize: 10.5, fontFamily: font.bold, color: T.faint },

  stackBar: { flexDirection: 'row', height: 12, borderRadius: 999, overflow: 'hidden', gap: 3 },
  srcRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  srcDot:   { width: 10, height: 10, borderRadius: 999 },
  srcLabel: { flex: 1, fontSize: 13.5, fontFamily: font.semibold, color: T.ink },
  srcAmt:   { fontSize: 13.5, fontFamily: font.extrabold, color: T.ink },

  recentRow:    { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13, paddingHorizontal: 16 },
  recentBorder: { borderTopWidth: 1, borderTopColor: T.line },
  recentTile:   { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  recentName:   { fontSize: 14, fontFamily: font.extrabold, color: T.ink },
  recentSub:    { fontSize: 12, fontFamily: font.semibold, color: T.sub, marginTop: 2 },
  recentSaved:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  recentSavedText: { fontSize: 14, fontFamily: font.extrabold, color: T.green },

  cta:      { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: T.blueSoft2 },
  ctaIcon:  { width: 46, height: 46, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  ctaTitle: { fontSize: 15, fontFamily: font.extrabold, color: T.ink },
  ctaSub:   { fontSize: 12.5, fontFamily: font.semibold, color: T.sub, marginTop: 2 },
});
