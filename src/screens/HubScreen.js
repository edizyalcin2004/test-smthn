import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator,
  StyleSheet, Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radii } from '../theme/tokens';
import { getMenuItems, getDiscountCodes } from '../api/client';

const PLATFORM_COLORS = {
  'Yemeksepeti':              '#D6001C',
  'Trendyol Yemek':          '#FF6000',
  'Getir Yemek':             '#5D3EB2',
  "McDonald's Türkiye Direct":'#FFC72C',
};

// Hub is a discovery surface, so it previews a handful of live codes rather
// than the full feed (that lives on DealsScreen).
const CODE_PREVIEW_COUNT = 5;

function fmt(val) {
  return Number(val).toFixed(2).replace('.', ',');
}

function platformColor(platformName, fallback) {
  return PLATFORM_COLORS[platformName] || fallback || '#999';
}

// "₺100 indirim" / "%15 indirim" — null for unknown discount types (shown
// without an amount rather than guessing).
function discountLabel(dc) {
  const val = Number(dc.discount_value);
  if (!val || isNaN(val)) return null;
  const amount = Number.isInteger(val) ? String(val) : fmt(val);
  if (dc.discount_type === 'percentage') return `%${amount} indirim`;
  if (dc.discount_type === 'fixed') return `₺${amount} indirim`;
  return null;
}

// Display text for a usage limit; known keys get fixed Turkish labels,
// anything else is an admin-entered note rendered as-is.
function usageLimitLabel(u) {
  if (!u) return null;
  if (u === 'once_per_user') return 'Kullanıcı başına 1';
  if (u === 'first_order') return 'İlk siparişe özel';
  return u;
}

// Curated preview for "Günün Kodları": soonest-expiring first (an honest
// urgency framing, NOT a "best discount" ranking — we never compare a fixed
// ₺ code against a % code). Codes without an expiry date sort to the end.
function previewCodes(codes) {
  return [...codes]
    .sort((a, b) => {
      const ax = a.expiry_date ? new Date(a.expiry_date).getTime() : Infinity;
      const bx = b.expiry_date ? new Date(b.expiry_date).getTime() : Infinity;
      return ax - bx;
    })
    .slice(0, CODE_PREVIEW_COUNT);
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
  const color      = platformColor(dc.platform?.name, dc.platform?.hex_color);
  const hasCode    = !!dc.code;
  const label      = discountLabel(dc);
  const minOrder   = dc.minimum_order != null ? `Min. ₺${fmt(dc.minimum_order)}` : null;
  const limitLabel = usageLimitLabel(dc.usage_limit);

  return (
    <View style={[s.codeCard, { borderLeftColor: color }]}>
      <View style={s.codeLeft}>
        <View style={[s.codePlatformPill, { backgroundColor: color }]}>
          <Text style={s.codePlatformText}>{dc.platform?.name}</Text>
        </View>
        {dc.restaurantName && <Text style={s.codeRestaurant}>{dc.restaurantName}</Text>}
        {hasCode ? (
          <Text style={s.codeString}>{dc.code}</Text>
        ) : (
          <Text style={s.codeTitle}>{dc.title}</Text>
        )}
        {(dc.requires_membership || limitLabel) && (
          <View style={s.codeBadgeRow}>
            {dc.requires_membership && (
              <View style={s.memberBadge}>
                <Text style={s.memberBadgeText}>{dc.requires_membership}</Text>
              </View>
            )}
            {limitLabel && (
              <View style={s.limitBadge}>
                <Text style={s.limitBadgeText}>{limitLabel}</Text>
              </View>
            )}
          </View>
        )}
        {dc.item_scoped && (
          <Text style={s.codeScoped}>Belirli ürünlerde geçerli</Text>
        )}
      </View>
      <View style={s.codeRight}>
        {label && <Text style={s.codeLabel}>{label}</Text>}
        {minOrder && <Text style={s.codeDetail}>{minOrder}</Text>}
        {hasCode && (
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
        )}
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function HubScreen({ navigation }) {
  const [items, setItems]     = useState([]);
  const [codes, setCodes]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [copied, setCopied]   = useState(null);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      // Codes are nice-to-have — a failure there degrades to an empty list
      // instead of blocking the whole screen.
      const [menuData, codesData] = await Promise.all([
        getMenuItems(),
        getDiscountCodes().catch(() => []),
      ]);
      setItems(menuData);
      setCodes(codesData);
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

  // /discount-codes only carries restaurant_id, so resolve display names from
  // the menu-items we already loaded. restaurant_id null = platform-wide.
  const restaurantNameById = {};
  for (const it of items) {
    if (it.restaurant?.id != null) restaurantNameById[it.restaurant.id] = it.restaurant.name;
  }
  const topCodes = previewCodes(codes).map(dc => ({
    ...dc,
    restaurantName: dc.restaurant_id == null
      ? 'Tüm restoranlar'
      : (restaurantNameById[dc.restaurant_id] ?? null),
  }));

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

        {topCodes.length > 0 ? (
          topCodes.map(dc => (
            <CodeCard key={dc.id} dc={dc} copied={copied} onCopy={copyCode} />
          ))
        ) : (
          <Text style={s.emptyText}>Şu anda aktif kod bulunamadı.</Text>
        )}

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
  codeTitle:        { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.textPrimary, lineHeight: 19 },

  codeScoped:      { fontFamily: fonts.bodyReg, fontSize: 11, color: '#b26a00', marginTop: 4 },
  codeBadgeRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  memberBadge:     { backgroundColor: '#ede7f6', borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 2 },
  memberBadgeText: { fontFamily: fonts.bodySemi, fontSize: 11, color: '#5D3EB2' },
  limitBadge:      { backgroundColor: '#fff3e0', borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 2 },
  limitBadgeText:  { fontFamily: fonts.bodySemi, fontSize: 11, color: '#b26a00' },

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
