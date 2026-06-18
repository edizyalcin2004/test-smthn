// DealsScreen — navy/gold rebuild. "Aktif kodlar" feed: ALL live discount codes
// sorted soonest-expiry first, each card opens the shared CodeSheet. Replaces
// the old Bang-for-Buck / platform-sections screen (not in the new design).
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, Pressable, ActivityIndicator, RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, font, money } from '../theme/tokens';
import { Card, Header, Pill, Brand } from '../components/ui';
import { Icon } from '../components/icons';
import { platformBrand } from '../lib/brand';
import { getDiscountCodes } from '../api/client';
import { useCodeSheet } from '../components/CodeSheet';

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

export default function DealsScreen() {
  const insets = useSafeAreaInsets();
  const { openCode } = useCodeSheet();
  const [codes, setCodes]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState(null);
  const mounted                   = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const load = useCallback(async (isRefresh) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const data = await getDiscountCodes();
      if (mounted.current) setCodes(data || []);
    } catch {
      if (mounted.current) setError('Kodlar yüklenemedi. Bağlantını kontrol et.');
    } finally {
      if (mounted.current) { setLoading(false); setRefreshing(false); }
    }
  }, []);
  useEffect(() => { load(false); }, [load]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(true); }, [load]);

  const sorted = useMemo(() => {
    const ts = (c) => {
      const d = c.expiry_date ? new Date(c.expiry_date).getTime() : NaN;
      return isNaN(d) ? Infinity : d;
    };
    return [...codes].sort((a, b) => ts(a) - ts(b));
  }, [codes]);

  return (
    <View style={[s.root, { paddingTop: insets.top + 4 }]}>
      <Header title="Aktif kodlar" sub="Süresi en yakına göre" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.blue} />}
      >
        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={T.blue} /></View>
        ) : error ? (
          <View style={s.center}>
            <Text style={s.errText}>{error}</Text>
            <Pressable onPress={() => load(false)} style={s.retry}><Text style={s.retryText}>Tekrar dene</Text></Pressable>
          </View>
        ) : sorted.length === 0 ? (
          <View style={s.center}><Text style={s.empty}>Şu an aktif kod yok</Text></View>
        ) : (
          sorted.map((c) => {
            const left = timeLeft(c.expiry_date);
            return (
              <Card key={String(c.id)} pad={15} onPress={() => openCode(c)} style={s.card}>
                <Brand brand={platformBrand(c.platform)} size={48} radius={14} />
                <View style={s.meta}>
                  <Text style={s.code} numberOfLines={1}>{c.code || c.title}</Text>
                  <Text style={s.sub} numberOfLines={1}>{c.platform?.name} · {discountText(c)}</Text>
                  <View style={s.pills}>
                    {c.minimum_order != null ? (
                      <Pill bg={T.bg} fg={T.sub} textStyle={s.pillText}>Min. {money(c.minimum_order)}</Pill>
                    ) : null}
                    {left ? (
                      <Pill bg={T.bg} fg={T.sub} textStyle={s.pillText}>
                        <Icon name="clock" s={12} c={T.faint} />
                        <Text style={s.pillText}>{left}</Text>
                      </Pill>
                    ) : null}
                  </View>
                </View>
                <Icon name="chevR" s={19} c={T.faint} sw={2.2} />
              </Card>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: T.bg },
  scroll:    { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 110 },

  card:      { flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 12 },
  meta:      { flex: 1, minWidth: 0 },
  code:      { fontSize: 15, fontFamily: font.extrabold, color: T.ink, letterSpacing: 0.3 },
  sub:       { fontSize: 12.5, fontFamily: font.semibold, color: T.sub, marginTop: 2 },
  pills:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 9 },
  pillText:  { fontSize: 11, fontFamily: font.bold, color: T.sub },

  center:    { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  empty:     { fontSize: 14, fontFamily: font.semibold, color: T.faint },
  errText:   { fontSize: 14, fontFamily: font.semibold, color: T.coral, textAlign: 'center' },
  retry:     { marginTop: 14, paddingVertical: 10, paddingHorizontal: 22 },
  retryText: { fontSize: 14, fontFamily: font.bold, color: T.blue },
});
