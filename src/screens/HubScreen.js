import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator,
  StyleSheet, Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radii } from '../theme/tokens';

const API = 'https://pryce-backend-production.up.railway.app';

const DISCOUNT_CODES = [
  { platform: 'Trendyol Yemek', color: '#FF6000', restaurant: "McDonald's", code: 'MCTREND15',  label: '%15 indirim', detail: 'Min. ₺150', discount_value: 15 },
  { platform: 'Yemeksepeti',    color: '#D6001C', restaurant: "McDonald's", code: 'MCYEMEK10',  label: '%10 indirim', detail: 'Min. ₺100', discount_value: 10 },
  { platform: 'Getir Yemek',    color: '#5D3EB2', restaurant: "McDonald's", code: 'GETIRMAC20', label: '₺20 indirim', detail: 'Min. ₺200', discount_value: 20 },
  { platform: 'Trendyol Yemek', color: '#FF6000', restaurant: 'Komagene',   code: 'KOMATREND',  label: '%10 indirim', detail: 'Min. ₺150', discount_value: 10 },
  { platform: 'Yemeksepeti',    color: '#D6001C', restaurant: 'Burger King', code: 'BKYEMEK15',  label: '%15 indirim', detail: 'Min. ₺150', discount_value: 15 },
  { platform: 'Trendyol Yemek', color: '#FF6000', restaurant: 'Tüm restoranlar', code: 'TREND5TL', label: '₺5 indirim', detail: 'Min. ₺50', discount_value: 5 },
];

const TOP_CODES = [...DISCOUNT_CODES]
  .sort((a, b) => b.discount_value - a.discount_value)
  .slice(0, 3);

function fmt(val) {
  return Number(val).toFixed(2).replace('.', ',');
}

function calcBangForBuck(items) {
  const results = [];
  const exclusives = items.filter(i => i.category === 'Özel Menüler' && i.description);

  for (const bundle of exclusives) {
    if (!bundle.restaurant?.id) continue;

    const priceEntry = bundle.prices?.[0];
    if (!priceEntry) continue;
    const bundlePrice = Number(priceEntry.price);
    if (!bundlePrice || isNaN(bundlePrice)) continue;

    const platformName = priceEntry.platform?.name;
    const platformHex  = priceEntry.platform?.hex_color;

    const components = bundle.description.split(' + ').map(c => c.trim()).filter(Boolean);
    if (components.length === 0) continue;

    let individualSum = 0;
    let valid = true;

    for (const componentName of components) {
      const match = items.find(
        i => i.name === componentName &&
          i.restaurant?.id === bundle.restaurant?.id &&
          i.prices?.some(p => p.platform?.name === platformName)
      );
      if (!match) { valid = false; break; }
      const matchPrice = match.prices.find(p => p.platform?.name === platformName);
      if (!matchPrice) { valid = false; break; }
      individualSum += Number(matchPrice.price);
    }

    if (!valid || individualSum <= 0) continue;

    const savings    = individualSum - bundlePrice;
    const savingsPct = Math.round((savings / individualSum) * 100);

    if (savingsPct <= 0) continue;

    results.push({
      id: bundle.id, name: bundle.name, restaurant: bundle.restaurant,
      bundlePrice, individualSum, savings, savingsPct, platformName, platformHex,
    });
  }

  results.sort((a, b) => b.savingsPct - a.savingsPct);
  return results.slice(0, 5);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BfbCard({ result }) {
  const pColor = result.platformHex || '#999';
  return (
    <View style={s.bfbCard}>
      <View style={[s.bfbBorder, { backgroundColor: pColor }]} />
      <View style={s.bfbContent}>
        <View style={s.bfbTopRow}>
          <View style={[s.platformPill, { backgroundColor: pColor }]}>
            <Text style={s.platformPillText}>{result.platformName}</Text>
          </View>
          <View style={s.savingsBadge}>
            <Text style={s.savingsText}>%{result.savingsPct} tasarruf</Text>
          </View>
        </View>
        <Text style={s.bfbName} numberOfLines={2}>{result.name}</Text>
        <Text style={s.bfbRestaurant}>{result.restaurant?.name}</Text>
        <View style={s.bfbPriceRow}>
          <Text style={s.bfbPrice}>₺{fmt(result.bundlePrice)}</Text>
          <Text style={s.bfbSavingsAmt}>₺{fmt(result.savings)} tasarruf</Text>
        </View>
      </View>
    </View>
  );
}

function CodeCard({ dc, copied, onCopy }) {
  return (
    <View style={[s.codeCard, { borderLeftColor: dc.color }]}>
      <View style={s.codeLeft}>
        <View style={[s.codePlatformPill, { backgroundColor: dc.color }]}>
          <Text style={s.codePlatformText}>{dc.platform}</Text>
        </View>
        <Text style={s.codeRestaurant}>{dc.restaurant}</Text>
        <Text style={s.codeString}>{dc.code}</Text>
      </View>
      <View style={s.codeRight}>
        <Text style={s.codeLabel}>{dc.label}</Text>
        <Text style={s.codeDetail}>{dc.detail}</Text>
        <Pressable style={s.copyBtn} onPress={() => onCopy(dc.code)}>
          {copied === dc.code ? (
            <Text style={s.copyBtnText}>Kopyalandı!</Text>
          ) : (
            <View style={s.copyRow}>
              <Ionicons name="copy-outline" size={13} color={colors.primary} />
              <Text style={s.copyBtnText}> Kopyala</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function HubScreen({ navigation }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [copied, setCopied]   = useState(null);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/menu-items`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(data);
    } catch {
      setError('Veriler yüklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function copyCode(code) {
    Clipboard.setString(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  }

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={s.safeArea}>
        <View style={s.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView edges={['top']} style={s.safeArea}>
        <View style={s.centered}>
          <Text style={s.errorText}>{error}</Text>
          <Pressable onPress={fetchData} style={s.retryBtn}>
            <Text style={s.retryText}>Tekrar Dene</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const bfbResults = calcBangForBuck(items);

  return (
    <SafeAreaView edges={['top']} style={s.safeArea}>
      <Text style={s.wordmark}>Pryce</Text>
      <Text style={s.subtitle}>En iyi fırsatlar, bir arada.</Text>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Quick Compare CTA */}
        <Pressable
          style={s.ctaCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Compare')}
        >
          <Text style={s.ctaText}>Sepetini karşılaştır →</Text>
        </Pressable>

        {/* Bang for Buck section */}
        <Text style={s.sectionLabel}>💥 En İyi Fırsatlar</Text>

        {bfbResults.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.hScroll}
          >
            {bfbResults.map((result, idx) => (
              <BfbCard key={`${result.id}-${idx}`} result={result} />
            ))}
          </ScrollView>
        ) : (
          <Text style={s.emptyText}>Şu anda öne çıkan fırsat bulunamadı.</Text>
        )}

        {/* Discount codes section */}
        <Text style={s.sectionLabel}>🎟 Günün Kodları</Text>

        {TOP_CODES.map((dc, idx) => (
          <CodeCard key={idx} dc={dc} copied={copied} onCopy={copyCode} />
        ))}

        <View style={s.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safeArea:     { flex: 1, backgroundColor: colors.background },
  centered:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  scroll:       { paddingBottom: 32 },
  bottomSpacer: { height: 24 },

  wordmark: {
    fontFamily: fonts.headline,
    fontSize: 32,
    color: colors.primary,
    letterSpacing: -1,
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: fonts.bodyReg,
    fontSize: 14,
    color: colors.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  errorText: {
    fontFamily: fonts.bodyReg,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  retryText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.primary },

  // CTA card
  ctaCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    marginHorizontal: 20,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: 'rgba(0,70,79,0.06)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 28,
  },
  ctaText: {
    fontFamily: fonts.headline,
    fontSize: 17,
    color: '#ffffff',
    letterSpacing: -0.5,
  },

  // Section labels
  sectionLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 14,
    marginTop: 4,
  },

  // Bang for Buck horizontal scroll
  hScroll: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 4,
    marginBottom: 28,
  },

  bfbCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    width: 220,
    overflow: 'hidden',
    shadowColor: 'rgba(0,70,79,0.06)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  bfbBorder:  { width: 4 },
  bfbContent: { flex: 1, padding: 14 },
  bfbTopRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },

  platformPill:     { borderRadius: radii.pill, paddingHorizontal: 7, paddingVertical: 3 },
  platformPillText: { fontFamily: fonts.bodySemi, fontSize: 9, color: '#ffffff' },

  savingsBadge: {
    backgroundColor: '#e8f5e9',
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  savingsText: { fontFamily: fonts.bodySemi, fontSize: 11, color: '#2e7d32' },

  bfbName:       { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.textPrimary, lineHeight: 20, marginBottom: 2 },
  bfbRestaurant: { fontFamily: fonts.bodyReg, fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
  bfbPriceRow:   { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  bfbPrice:      { fontFamily: fonts.headline, fontSize: 20, color: colors.primary, letterSpacing: -0.5 },
  bfbSavingsAmt: { fontFamily: fonts.bodyReg, fontSize: 11, color: '#2e7d32' },

  emptyText: {
    fontFamily: fonts.bodyReg,
    fontSize: 14,
    color: colors.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 28,
  },

  // Discount code cards
  codeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: 'rgba(0,70,79,0.06)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
  codeLeft:  { flex: 1, marginRight: 12 },
  codeRight: { alignItems: 'flex-end', gap: 4 },

  codePlatformPill: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 4,
  },
  codePlatformText: { fontFamily: fonts.bodySemi, fontSize: 10, color: '#ffffff' },
  codeRestaurant:   { fontFamily: fonts.bodyReg, fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  codeString:       { fontFamily: 'Courier', fontSize: 15, fontWeight: '700', color: colors.textPrimary, letterSpacing: 1 },

  codeLabel:  { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.primary },
  codeDetail: { fontFamily: fonts.bodyReg, fontSize: 12, color: colors.textSecondary },

  copyBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  copyRow:     { flexDirection: 'row', alignItems: 'center' },
  copyBtnText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.primary },
});
