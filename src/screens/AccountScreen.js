// AccountScreen — Hesabım. Pryce has no accounts yet, so this screen shows
// only what is true today: no sign-up, what stays on the phone, real order
// stats from on-device history, the privacy notice and the app version.
// No fake profile, points, Pro price or settings rows (honesty crux).
import { useCallback, useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, font, money } from '../theme/tokens';
import { Screen, Card, Header, Pill } from '../components/ui';
import { Icon, Spark } from '../components/icons';
import { loadOrders } from '../lib/orders';
import { summarize } from '../lib/savings';
import appJson from '../../app.json';

const mascot = require('../../assets/mascot.png');
const VERSION = String(appJson?.expo?.version ?? '');

export default function AccountScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  useFocusEffect(useCallback(() => { loadOrders().then(setOrders); }, []));
  const sv = summarize(orders, Date.now());
  const toBudget = () => navigation.getParent()?.navigate('Budget');

  const tiles = [
    { icon: 'bag', value: String(sv.count), label: 'Onaylanan\nsipariş', c: T.blue, bg: T.blueSoft },
    { icon: 'spark', value: money(Math.round(sv.total)), label: 'Toplam\ntasarruf', c: T.gold, bg: T.cream },
  ];

  return (
    <Screen>
      <Header title="Hesabım" />

      {/* no-account hero (navy) */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <LinearGradient colors={['#0C2C5C', '#061B3A']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={s.hero}>
          <Spark s={14} style={s.sparkA} />
          <Spark s={10} o={0.7} style={s.sparkB} />
          <Image source={mascot} style={s.heroMascot} resizeMode="contain" />
          <View style={{ maxWidth: '68%' }}>
            <Text style={s.heroTitle}>Hesap gerekmez</Text>
            <Text style={s.heroSub}>Pryce'ı kayıt olmadan kullanıyorsun. Sipariş geçmişin ve tasarrufun yalnızca bu telefonda tutulur.</Text>
          </View>
        </LinearGradient>
      </View>

      {/* real, on-device stats */}
      <View style={s.tiles}>
        {tiles.map((t) => (
          <Card key={t.label} pad={13} onPress={toBudget} style={{ flex: 1, gap: 9 }}>
            <View style={[s.tileIcon, { backgroundColor: t.bg }]}><Icon name={t.icon} s={18} c={t.c} /></View>
            <Text style={s.tileNum}>{t.value}</Text>
            <Text style={s.tileLabel}>{t.label}</Text>
          </Card>
        ))}
      </View>

      {/* coming later — stated as not available, no price, no button */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
        <Card style={s.soonRow}>
          <View style={s.soonIcon}><Icon name="crown" s={20} c={T.amber} /></View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.soonTitle}>Hesap, Pryce Points ve Pro</Text>
            <Text style={s.soonSub}>Henüz yok. Hazır olduğunda burada göreceksin.</Text>
          </View>
          <Pill bg={T.cream} fg={T.gold}>Yakında</Pill>
        </Card>
      </View>

      {/* settings: only rows that do something */}
      <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
        <Card pad={0}>
          <Pressable style={s.settingRow} onPress={() => navigation.navigate('Privacy')}>
            <Icon name="help" s={20} c={T.ink} />
            <Text style={s.settingLabel}>Gizlilik</Text>
            <Icon name="chevR" s={18} c={T.faint} sw={2.2} />
          </Pressable>
        </Card>
        {VERSION ? <Text style={s.version}>Pryce · Sürüm {VERSION}</Text> : null}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: { borderRadius: 22, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 22, overflow: 'hidden' },
  sparkA: { position: 'absolute', left: '60%', top: '20%' },
  sparkB: { position: 'absolute', left: '80%', top: '50%' },
  heroMascot: { position: 'absolute', right: -8, bottom: -10, width: 96, height: 96 },
  heroTitle: { color: '#fff', fontSize: 20, fontFamily: font.extrabold, letterSpacing: -0.4 },
  heroSub: { color: 'rgba(255,255,255,0.72)', fontSize: 13, fontFamily: font.semibold, marginTop: 6, lineHeight: 19 },

  tiles: { paddingHorizontal: 20, paddingTop: 14, flexDirection: 'row', gap: 11 },
  tileIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tileNum: { fontSize: 22, fontFamily: font.extrabold, color: T.ink, letterSpacing: -0.4 },
  tileLabel: { fontSize: 11, color: T.sub, fontFamily: font.semibold, lineHeight: 14 },

  soonRow: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  soonIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: T.navy, alignItems: 'center', justifyContent: 'center' },
  soonTitle: { fontSize: 14.5, fontFamily: font.extrabold, color: T.ink },
  soonSub: { fontSize: 12, color: T.sub, marginTop: 2, fontFamily: font.semibold, lineHeight: 16 },

  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15, paddingHorizontal: 16 },
  settingLabel: { flex: 1, fontSize: 14.5, fontFamily: font.bold, color: T.ink },
  version: { textAlign: 'center', marginTop: 16, fontSize: 12, color: T.faint, fontFamily: font.semibold },
});
