// AccountScreen — Hesabım + Pryce Points + Pro upsell + settings.
// Presentation only (mock copy). New navy/gold design.
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, font } from '../theme/tokens';
import { Screen, Card, Header } from '../components/ui';
import { Icon, Spark } from '../components/icons';

const mascot = require('../../assets/mascot.png');

// mock display copy
const USER = { name: 'Kathryn Murphy', first: 'Kathryn', email: 'kathryn.murphy@email.com', points: 2540, savedBaskets: 12, pastOrders: 28, alerts: 3 };

export default function AccountScreen({ navigation }) {
  const tiles = [
    { icon: 'basket', n: USER.savedBaskets, label: 'Kaydedilen\nsepet', c: T.blue, bg: T.blueSoft },
    { icon: 'bag', n: USER.pastOrders, label: 'Geçmiş\nsipariş', c: '#7A5AF1', bg: '#EFEBFC' },
    { icon: 'alert', n: USER.alerts, label: 'Aktif\nuyarı', c: T.gold, bg: T.cream },
  ];
  const settings = [
    { icon: 'card', label: 'Ödeme yöntemleri' },
    { icon: 'pin', label: 'Adreslerim' },
    { icon: 'help', label: 'Yardım & Destek' },
    { icon: 'gear', label: 'Ayarlar' },
  ];
  const goPro = () => navigation.navigate('Pro');

  return (
    <Screen>
      <Header title="Hesabım" onBell={() => navigation.navigate('Deals')} />

      {/* profile */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <Card style={s.row}>
          <LinearGradient colors={['#FFD27A', '#F5A524']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.avatar}>
            <Text style={s.avatarText}>{USER.first[0]}</Text>
          </LinearGradient>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.name}>{USER.name}</Text>
            <Text style={s.email} numberOfLines={1}>{USER.email}</Text>
          </View>
          <Pressable style={s.editProfile}>
            <Text style={s.editProfileText}>Profili düzenle</Text>
            <Icon name="chevR" s={13} c={T.blue} sw={2.4} />
          </Pressable>
        </Card>
      </View>

      {/* Pryce Points (navy hero) */}
      <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
        <Pressable onPress={goPro}>
          <LinearGradient colors={['#0C2C5C', '#061B3A']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={s.hero}>
            <Spark s={14} style={s.sparkA} />
            <Spark s={10} o={0.7} style={s.sparkB} />
            <Image source={mascot} style={s.heroMascot} resizeMode="contain" />
            <View style={s.heroRow}>
              <Icon name="spark" s={15} c={T.amber} sw={0} />
              <Text style={s.heroLabel}>Pryce Points</Text>
            </View>
            <Text style={s.heroNumber}>{USER.points.toLocaleString('tr-TR')}</Text>
            <Text style={s.heroSub}>puanın var</Text>
            <View style={s.heroBtn}>
              <Text style={s.heroBtnText}>Ödülleri gör</Text>
              <Icon name="chevR" s={14} c="#fff" sw={2.4} />
            </View>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Pro upsell (cream) */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
        <Pressable onPress={goPro}>
          <LinearGradient colors={['#FFF6E4', '#FCEBCF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.6 }} style={s.upsell}>
            <View style={s.upsellIcon}><Icon name="crown" s={22} c={T.amber} /></View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.upsellTitle}>Pryce Pro'ya yükselt</Text>
              <Text style={s.upsellSub}>Özel avantajları aç, her gün daha fazla tasarruf et.</Text>
            </View>
            <Icon name="chevR" s={19} c={T.gold} sw={2.2} />
          </LinearGradient>
        </Pressable>
      </View>

      {/* stat tiles */}
      <View style={s.tiles}>
        {tiles.map((t, i) => (
          <Card key={i} pad={13} style={{ flex: 1, gap: 9 }}>
            <View style={[s.tileIcon, { backgroundColor: t.bg }]}><Icon name={t.icon} s={18} c={t.c} /></View>
            <Text style={s.tileNum}>{t.n}</Text>
            <Text style={s.tileLabel}>{t.label}</Text>
          </Card>
        ))}
      </View>

      {/* settings */}
      <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
        <Card pad={0}>
          {settings.map((item, i) => (
            <View key={i} style={[s.settingRow, i ? { borderTopWidth: 1, borderTopColor: T.line } : null]}>
              <Icon name={item.icon} s={20} c={T.ink} />
              <Text style={s.settingLabel}>{item.label}</Text>
              <Icon name="chevR" s={18} c={T.faint} sw={2.2} />
            </View>
          ))}
        </Card>
        <Text style={s.version}>Pryce · Sürüm 2.4.0</Text>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 52, height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontFamily: font.extrabold, fontSize: 19 },
  name: { fontSize: 16.5, fontFamily: font.extrabold, color: T.ink },
  email: { fontSize: 12.5, color: T.sub, marginTop: 2, fontFamily: font.semibold },
  editProfile: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editProfileText: { color: T.blue, fontSize: 13, fontFamily: font.bold },

  hero: { borderRadius: 22, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 22, overflow: 'hidden' },
  sparkA: { position: 'absolute', left: '60%', top: '20%' },
  sparkB: { position: 'absolute', left: '80%', top: '50%' },
  heroMascot: { position: 'absolute', right: -8, bottom: -10, width: 96, height: 96 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroLabel: { fontSize: 13, fontFamily: font.bold, color: 'rgba(255,255,255,0.85)' },
  heroNumber: { color: '#fff', fontSize: 36, fontFamily: font.extrabold, letterSpacing: -1, marginTop: 10 },
  heroSub: { color: 'rgba(255,255,255,0.65)', fontSize: 13.5, fontFamily: font.semibold, marginTop: 1 },
  heroBtn: { marginTop: 16, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.14)', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 7 },
  heroBtnText: { color: '#fff', fontSize: 13, fontFamily: font.extrabold },

  upsell: { borderRadius: 18, paddingVertical: 15, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 13 },
  upsellIcon: { width: 44, height: 44, borderRadius: 13, backgroundColor: T.navy, alignItems: 'center', justifyContent: 'center' },
  upsellTitle: { fontSize: 15, fontFamily: font.extrabold, color: T.ink },
  upsellSub: { fontSize: 12, color: T.gold, marginTop: 2, fontFamily: font.bold, lineHeight: 16 },

  tiles: { paddingHorizontal: 20, paddingTop: 14, flexDirection: 'row', gap: 11 },
  tileIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tileNum: { fontSize: 22, fontFamily: font.extrabold, color: T.ink, letterSpacing: -0.4 },
  tileLabel: { fontSize: 11, color: T.sub, fontFamily: font.semibold, lineHeight: 14 },

  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15, paddingHorizontal: 16 },
  settingLabel: { flex: 1, fontSize: 14.5, fontFamily: font.bold, color: T.ink },
  version: { textAlign: 'center', marginTop: 16, fontSize: 12, color: T.faint, fontFamily: font.semibold },
});
