// HubScreen — navy/gold rebuild. Compare hero → Search; "Günün Kodları" stays
// LIVE: top-5 soonest-expiring discount codes from /discount-codes, each opening
// the shared CodeSheet. Codes are sorted by expiry (NOT by discount_value) — an
// honest urgency framing, never a "best discount" ranking.
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, Pressable, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { T, font } from '../theme/tokens';
import { Screen, Card, Header, SectionHead, Brand } from '../components/ui';
import { Icon, Spark } from '../components/icons';
import { platformBrand } from '../lib/brand';
import { getDiscountCodes } from '../api/client';
import { useCodeSheet } from '../components/CodeSheet';

const mascot = require('../../assets/mascot.png');

const discountText = (c) =>
  c.discount_type === 'percentage' ? `%${c.discount_value} indirim` : `₺${c.discount_value} indirim`;

function timeLeft(expiry) {
  if (!expiry) return null;
  const d = new Date(expiry);
  if (isNaN(d.getTime())) return null;
  const ms = d.getTime() - Date.now();
  if (ms <= 0) return 'Doldu';
  const days = Math.floor(ms / 86400000);
  if (days >= 1) return `${days} gün`;
  const hrs = Math.floor(ms / 3600000);
  if (hrs >= 1) return `${hrs} saat`;
  return `${Math.max(1, Math.floor(ms / 60000))} dk`;
}

export default function HubScreen({ navigation }) {
  const { openCode } = useCodeSheet();
  const [codes, setCodes]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const mounted               = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDiscountCodes(); // all restaurants + platform-wide
      if (mounted.current) setCodes(data || []);
    } catch {
      if (mounted.current) setError('Kodlar yüklenemedi.');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  // Soonest-expiring first; codes without an expiry sink to the bottom. Top 5.
  const top = useMemo(() => {
    const ts = (c) => {
      const d = c.expiry_date ? new Date(c.expiry_date).getTime() : NaN;
      return isNaN(d) ? Infinity : d;
    };
    return [...codes].sort((a, b) => ts(a) - ts(b)).slice(0, 5);
  }, [codes]);

  return (
    <Screen>
      <Header
        title="Merhaba 👋"
        sub="Bugün ne yemek istersin?"
        onBell={() => navigation.navigate('Deals')}
      />

      {/* compare hero */}
      <View style={s.heroWrap}>
        <Pressable onPress={() => navigation.navigate('Compare', { screen: 'Search' })} style={s.hero}>
          <Spark s={16} style={s.spark1} />
          <Spark s={10} o={0.7} style={s.spark2} />
          <Spark s={12} o={0.6} style={s.spark3} />
          <Image source={mascot} style={s.mascot} resizeMode="contain" />
          <View style={s.heroBody}>
            <Text style={s.heroTitle}>Fiyat karşılaştırması başlat</Text>
            <Text style={s.heroSub}>Restoran veya mutfak seç,{'\n'}en iyi fiyatı bulalım.</Text>
            <View style={s.heroCta}>
              <Text style={s.heroCtaText}>Karşılaştırmaya başla</Text>
              <Icon name="chevR" s={16} c="#fff" sw={2.4} />
            </View>
          </View>
        </Pressable>
      </View>

      {/* Günün Kodları */}
      <View style={s.section}>
        <SectionHead title="Günün Kodları" action="Tümünü gör" onAction={() => navigation.navigate('Deals')} />
        {loading ? (
          <Card style={s.stateCard}><ActivityIndicator color={T.blue} /></Card>
        ) : error ? (
          <Card style={s.stateCard}>
            <Text style={s.errText}>{error}</Text>
            <Pressable onPress={load} style={s.retry}><Text style={s.retryText}>Tekrar dene</Text></Pressable>
          </Card>
        ) : top.length === 0 ? (
          <Card style={s.stateCard}><Text style={s.empty}>Şu an aktif kod yok</Text></Card>
        ) : (
          <Card pad={0}>
            {top.map((c, i) => {
              const left = timeLeft(c.expiry_date);
              return (
                <Pressable
                  key={String(c.id)}
                  onPress={() => openCode(c)}
                  style={({ pressed }) => [s.codeRow, i ? s.codeBorder : null, pressed && s.pressed]}
                >
                  <Brand brand={platformBrand(c.platform)} size={42} radius={12} />
                  <View style={s.codeMeta}>
                    <Text style={s.codeText} numberOfLines={1}>{c.code || c.title}</Text>
                    <Text style={s.codeDesc} numberOfLines={1}>{discountText(c)}</Text>
                  </View>
                  {left ? (
                    <View style={s.left}>
                      <Icon name="clock" s={13} c={T.faint} />
                      <Text style={s.leftText}>{left}</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </Card>
        )}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  heroWrap:  { paddingHorizontal: 20, paddingTop: 8 },
  hero:      { borderRadius: 22, padding: 22, overflow: 'hidden', backgroundColor: T.navy },
  spark1:    { position: 'absolute', left: '58%', top: 20 },
  spark2:    { position: 'absolute', left: '80%', top: 50 },
  spark3:    { position: 'absolute', left: '68%', top: 90 },
  mascot:    { position: 'absolute', right: -14, bottom: -18, width: 132, height: 132 },
  heroBody:  { maxWidth: '74%' },
  heroTitle: { color: '#fff', fontSize: 20, fontFamily: font.extrabold, letterSpacing: -0.4, lineHeight: 25 },
  heroSub:   { color: 'rgba(255,255,255,0.7)', fontSize: 13.5, marginTop: 7, lineHeight: 19, fontFamily: font.medium },
  heroCta:   { marginTop: 18, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: T.blue, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 14 },
  heroCtaText: { color: '#fff', fontSize: 14, fontFamily: font.extrabold },

  section:   { paddingHorizontal: 20, paddingTop: 26 },

  codeRow:   { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14, paddingHorizontal: 16 },
  codeBorder:{ borderTopWidth: 1, borderTopColor: T.line },
  pressed:   { opacity: 0.6 },
  codeMeta:  { flex: 1, minWidth: 0 },
  codeText:  { fontSize: 14.5, fontFamily: font.extrabold, color: T.ink, letterSpacing: 0.3 },
  codeDesc:  { fontSize: 12.5, fontFamily: font.bold, color: T.green, marginTop: 2 },
  left:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  leftText:  { fontSize: 12.5, fontFamily: font.bold, color: T.faint },

  stateCard: { alignItems: 'center', paddingVertical: 26 },
  empty:     { fontSize: 13.5, fontFamily: font.semibold, color: T.faint },
  errText:   { fontSize: 13.5, fontFamily: font.semibold, color: T.coral },
  retry:     { marginTop: 12, paddingVertical: 8, paddingHorizontal: 18 },
  retryText: { fontSize: 14, fontFamily: font.bold, color: T.blue },
});
