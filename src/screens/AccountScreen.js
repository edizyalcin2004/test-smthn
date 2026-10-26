// AccountScreen — Hesabım (redesign PR 4, design 15). Doybi has no accounts,
// so this screen shows only what is true today: no sign-up, what stays on the
// phone, real on-device order stats, history, privacy, help and the version.
// No fake profile, points, Pro or settings rows (honesty crux; founder ruling
// 2026-10-25: no Settings screen, no Pro screen).
import { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { T, font, money } from '../theme/tokens';
import { Screen, Title } from '../components/ui';
import { Icon } from '../components/icons';
import { Mascot } from '../components/Art';
import { loadOrders } from '../lib/orders';
import { summarize } from '../lib/savings';
import { API_BASE_URL } from '../api/client';
import appJson from '../../app.json';

const VERSION = String(appJson?.expo?.version ?? '');

export default function AccountScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  useFocusEffect(useCallback(() => { loadOrders().then(setOrders); }, []));
  const sv = summarize(orders, Date.now());
  const toBudget = () => navigation.getParent()?.navigate('Budget');

  const rows = [
    { icon: 'bag', title: 'Sipariş geçmişi', sub: sv.count ? `${sv.count} onaylı sipariş · ${money(Math.round(sv.total))} tasarruf` : 'Henüz onaylı sipariş yok', onPress: toBudget },
    { icon: 'help', title: 'Gizlilik', sub: 'Neyi kaydediyoruz, neyi kaydetmiyoruz', onPress: () => navigation.navigate('Privacy') },
    { icon: 'alert', title: 'Yardım & destek', sub: 'Nasıl çalıştığını öğren', onPress: () => Linking.openURL(`${API_BASE_URL}/support`).catch(() => {}) },
  ];

  return (
    <Screen>
      <View style={s.head}>
        <Title accent="Doybi'n.">Senin</Title>
      </View>

      <View style={s.callout}>
        <View style={{ flex: 1 }}>
          <Text style={s.calloutTitle}>Hesap gerekmez.</Text>
          <Text style={s.calloutText}>Kayıt olmadan kullanıyorsun. Sipariş geçmişin ve tasarrufun yalnızca bu telefonda tutulur.</Text>
          <Pressable onPress={toBudget} style={s.calloutLink} hitSlop={6}>
            <Text style={s.calloutLinkText}>Tasarrufuma bak</Text>
            <Icon name="arrow" s={16} c={T.ink} />
          </Pressable>
        </View>
        <Mascot pose="empty-basket" size={104} />
      </View>

      <View style={s.list}>
        {rows.map((r) => (
          <Pressable key={r.title} onPress={r.onPress} style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]} accessibilityRole="button">
            <View style={s.rowIcon}><Icon name={r.icon} s={21} c={T.ink} /></View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.rowTitle}>{r.title}</Text>
              <Text style={s.rowSub} numberOfLines={1}>{r.sub}</Text>
            </View>
            <Icon name="chevR" s={18} c={T.ink} />
          </Pressable>
        ))}
      </View>

      <View style={s.note}>
        <Icon name="help" s={15} c={T.sub} />
        <Text style={s.noteText}>Doybi sipariş almaz, ödeme yöntemi veya teslimat adresi istemez. Siparişi seçtiğin platformda verirsin.</Text>
      </View>
      {VERSION ? <Text style={s.version}>Doybi · Sürüm {VERSION}</Text> : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  head:        { paddingHorizontal: 20, paddingTop: 10 },
  callout:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F1E6DA', borderRadius: 22, padding: 20, marginHorizontal: 20, marginTop: 22 },
  calloutTitle:{ fontSize: 19, fontFamily: font.bold, color: T.ink, letterSpacing: -0.5 },
  calloutText: { fontSize: 13, fontFamily: font.regular, color: T.sub, marginTop: 6, lineHeight: 19 },
  calloutLink: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  calloutLinkText: { fontSize: 14, fontFamily: font.medium, color: T.ink },

  list:        { paddingHorizontal: 20, marginTop: 14 },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: T.line },
  rowIcon:     { width: 46, height: 46, borderRadius: 14, backgroundColor: '#ECEEE6', alignItems: 'center', justifyContent: 'center' },
  rowTitle:    { fontSize: 16, fontFamily: font.bold, color: T.ink, letterSpacing: -0.3 },
  rowSub:      { fontSize: 12.5, fontFamily: font.regular, color: T.sub, marginTop: 3 },

  note:        { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 20, marginTop: 18 },
  noteText:    { flex: 1, fontSize: 12, fontFamily: font.regular, color: T.sub, lineHeight: 17 },
  version:     { textAlign: 'center', marginTop: 20, fontSize: 12, color: T.faint, fontFamily: font.regular },
});
