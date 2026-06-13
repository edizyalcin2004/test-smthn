import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator,
  StyleSheet, Clipboard, TextInput, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radii, shadows } from '../theme/tokens';
import { getMenuItems, getDiscountCodes } from '../api/client';

const PLATFORM_ORDER = ['Yemeksepeti', 'Trendyol Yemek', 'Getir Yemek', "McDonald's Türkiye Direct"];
const PLATFORM_COLORS = {
  'Yemeksepeti':              '#D6001C',
  'Trendyol Yemek':          '#FF6000',
  'Getir Yemek':             '#5D3EB2',
  "McDonald's Türkiye Direct":'#FFC72C',
};

const POPULAR = ["McDonald's", 'Komagene', 'Burger King'];

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

function calcBangForBuck(items) {
  const results = [];
  const exclusives = items.filter(i => i.category === 'Özel Menüler' && i.description);

  for (const bundle of exclusives) {
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
  return results.slice(0, 4);
}

// ── Sub-components ──────────────────────────────────────────────────────────

function DealCard({ item }) {
  const entry       = item.prices?.[0];
  const pName       = entry?.platform?.name ?? '';
  const pColor      = platformColor(pName, entry?.platform?.hex_color);
  const hasDiscount = entry?.old_price != null && Number(entry.old_price) > Number(entry.price);
  const saving      = hasDiscount
    ? (Number(entry.old_price) - Number(entry.price)).toFixed(2).replace('.', ',')
    : null;
  const components = item.description ? item.description.split(' + ').map(c => c.trim()).filter(Boolean) : [];

  return (
    <View style={s.dealCard}>
      <View style={s.dealLeft}>
        <View style={[s.platformPill, { backgroundColor: pColor }]}>
          <Text style={s.platformPillText}>{pName}</Text>
        </View>
        <Text style={s.dealName}>{item.name}</Text>
        {hasDiscount && (
          <Text style={s.dealOldPrice}>₺{fmt(entry.old_price)}</Text>
        )}
        <Text style={s.dealPrice}>₺{fmt(entry?.price ?? 0)}</Text>
        {saving && (
          <View style={s.savingsBadge}>
            <Text style={s.savingsText}>₺{saving} tasarruf</Text>
          </View>
        )}
      </View>
      {components.length > 0 && (
        <View style={s.dealRight}>
          <Text style={s.dealRightTitle}>İçindekiler</Text>
          {components.map((comp, i) => (
            <Text key={i} style={s.dealComponent}>· {comp}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

function CodeCard({ dc, restaurantName, copied, onCopy }) {
  const color   = platformColor(dc.platform?.name, dc.platform?.hex_color);
  const hasCode = !!dc.code;
  const label   = discountLabel(dc);
  const minOrder = dc.minimum_order != null ? `Min. ₺${fmt(dc.minimum_order)}` : null;
  const limitLabel = usageLimitLabel(dc.usage_limit);

  return (
    <View style={[s.codeCard, { borderLeftColor: color }]}>
      <View style={s.codeLeft}>
        <Text style={s.codePlatform}>{dc.platform?.name}</Text>
        <Text style={s.codeRestaurant}>{restaurantName}</Text>
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
          <Pressable style={[s.copyBtn, { borderColor: colors.primary }]} onPress={() => onCopy(dc.code)}>
            {copied === dc.code ? (
              <Text style={[s.copyBtnText, { color: colors.primary }]}>Kopyalandı!</Text>
            ) : (
              <View style={s.copyRow}>
                <Ionicons name="copy-outline" size={13} color={colors.primary} />
                <Text style={[s.copyBtnText, { color: colors.primary }]}> Kopyala</Text>
              </View>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ── Main screen ─────────────────────────────────────────────────────────────

export default function DealsScreen() {
  const [items, setItems]                 = useState([]);
  const [allCodes, setAllCodes]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [error, setError]                 = useState(null);
  const [query, setQuery]                 = useState('');
  const [selectedRestaurant, setSelected] = useState(null);
  const [copied, setCopied]               = useState(null);
  const debounceRef                       = useRef(null);

  // Derive restaurant list from items
  const restaurants = [...new Map(items.map(i => [i.restaurant?.id, i.restaurant])).values()]
    .filter(Boolean);

  // Dropdown suggestions (only when no restaurant selected)
  const suggestions = query.length > 0 && !selectedRestaurant
    ? restaurants
        .filter(r => r.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3)
    : [];

  // isRefresh drives the pull-to-refresh spinner instead of the full-screen
  // loader — same single fetch path either way.
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      // Codes are nice-to-have — a failure there degrades to an empty list
      // instead of blocking the whole screen.
      const [menuData, codesData] = await Promise.all([
        getMenuItems(),
        getDiscountCodes().catch(() => []),
      ]);
      setItems(menuData);
      setAllCodes(codesData);
    } catch {
      setError('Veriler yüklenemedi. Lütfen tekrar deneyin.');
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(() => fetchData(true), [fetchData]);

  function handleQueryChange(text) {
    setQuery(text);
    setSelected(null);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // auto-select if exactly one match
      const matches = restaurants.filter(r =>
        r.name.toLowerCase().includes(text.toLowerCase())
      );
      if (matches.length === 1) selectRestaurant(matches[0]);
    }, 300);
  }

  function selectRestaurant(restaurant) {
    setSelected(restaurant);
    setQuery(restaurant.name);
  }

  function clearSelection() {
    setSelected(null);
    setQuery('');
  }

  function copyCode(code) {
    Clipboard.setString(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  }

  // Build platform sections for selected restaurant
  function buildPlatformSections(restaurant) {
    const exclusives = items.filter(
      i => i.restaurant?.id === restaurant.id && i.category === 'Özel Menüler'
    );
    // Group by platform name
    const byPlatform = {};
    for (const item of exclusives) {
      for (const priceEntry of (item.prices ?? [])) {
        const pName = priceEntry.platform?.name;
        if (!pName) continue;
        // Attach only this price entry to a copy of the item
        if (!byPlatform[pName]) byPlatform[pName] = [];
        byPlatform[pName].push({ ...item, prices: [priceEntry] });
      }
    }
    // Return in preferred order, then any remaining
    const ordered = [
      ...PLATFORM_ORDER.filter(p => byPlatform[p]),
      ...Object.keys(byPlatform).filter(p => !PLATFORM_ORDER.includes(p)),
    ];
    return ordered.map(pName => ({ pName, cards: byPlatform[pName] }));
  }

  // ── Render ─────────────────────────────────────────────────────────────────

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

  const sections  = selectedRestaurant ? buildPlatformSections(selectedRestaurant) : [];
  // restaurant_id null = platform-wide code, valid for every restaurant
  const codes     = selectedRestaurant
    ? allCodes.filter(
        dc => dc.restaurant_id === selectedRestaurant.id || dc.restaurant_id == null
      )
    : [];

  return (
    <SafeAreaView edges={['top']} style={s.safeArea}>
      {/* ── Fixed top: header + search bar ──────────────────────────────── */}
      <Text style={s.header}>Fırsatlar</Text>

      <View style={s.searchWrap}>
        <View style={s.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} style={s.searchIcon} />
          <TextInput
            style={s.searchInput}
            placeholder="Restoran ara…"
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={handleQueryChange}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={clearSelection} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Dropdown suggestions */}
        {suggestions.length > 0 && (
          <View style={s.dropdown}>
            {suggestions.map((r, i) => (
              <Pressable
                key={r.id}
                style={[s.dropdownItem, i < suggestions.length - 1 && s.dropdownDivider]}
                onPress={() => selectRestaurant(r)}
              >
                <Ionicons name="restaurant-outline" size={14} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <Text style={s.dropdownText}>{r.name}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* ── Scrollable body ──────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >

        {!selectedRestaurant ? (
          /* ── Default state ──────────────────────────────────────────── */
          <>
            <Text style={s.sectionLabel}>POPÜLER</Text>
            <View style={s.chipsRow}>
              {POPULAR.map(name => {
                const restaurant = restaurants.find(r => r.name === name);
                return (
                  <Pressable
                    key={name}
                    style={s.chip}
                    onPress={() => restaurant && selectRestaurant(restaurant)}
                  >
                    <Text style={s.chipText}>{name}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={s.hint}>Bir restoran seç veya ara</Text>

            <Text style={s.bfbSectionLabel}>EN İYİ FIRSATLAR</Text>
            {loading ? (
              [0, 1, 2].map(i => <View key={i} style={s.bfbSkeleton} />)
            ) : (
              calcBangForBuck(items).map((r, idx) => {
                const pColor = platformColor(r.platformName, r.platformHex);
                return (
                  <Pressable
                    key={`${r.id}-${idx}`}
                    style={s.bfbCard}
                    onPress={() => {
                      const rest = restaurants.find(res => res.id === r.restaurant?.id);
                      if (rest) selectRestaurant(rest);
                    }}
                  >
                    <View style={s.bfbTopRow}>
                      <View style={[s.bfbPlatformPill, { backgroundColor: pColor }]}>
                        <Text style={s.bfbPlatformText}>{r.platformName}</Text>
                      </View>
                      <View style={s.bfbSavingsBadge}>
                        <Text style={s.bfbSavingsText}>₺{fmt(r.savings)} tasarruf · %{r.savingsPct} daha ucuz</Text>
                      </View>
                    </View>
                    <Text style={s.bfbName}>{r.name}</Text>
                    <View style={s.bfbBottomRow}>
                      <Text style={s.bfbPrice}>₺{fmt(r.bundlePrice)}</Text>
                      <Text style={s.bfbIndividual}>Ayrı alsan: ₺{fmt(r.individualSum)}</Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </>
        ) : (
          /* ── Deals view ─────────────────────────────────────────────── */
          <>
            {/* Back link */}
            <Pressable style={s.backLink} onPress={clearSelection}>
              <Ionicons name="chevron-back" size={14} color={colors.primary} />
              <Text style={s.backText}>Tüm restoranlar</Text>
            </Pressable>

            <Text style={s.restaurantTitle}>{selectedRestaurant.name}</Text>
            <Text style={s.restaurantSub}>Platform fırsatları</Text>

            {/* Platform sections */}
            {sections.length > 0 ? sections.map(({ pName, cards }) => {
              const pColor = platformColor(pName, null);
              return (
                <View key={pName} style={{ marginTop: 20 }}>
                  <View style={[s.platformHeader, { backgroundColor: pColor + '18' }]}>
                    <View style={[s.platformBar, { backgroundColor: pColor }]} />
                    <Text style={s.platformHeaderText}>{pName}</Text>
                  </View>
                  {cards.map(item => <DealCard key={`${item.id}-${pName}`} item={item} />)}
                </View>
              );
            }) : (
              <Text style={s.emptyText}>Bu restoran için özel menü bulunamadı.</Text>
            )}

            {/* Discount codes */}
            {codes.length > 0 && (
              <>
                <View style={{ marginTop: 28, marginBottom: 12, paddingHorizontal: 20 }}>
                  <Text style={s.sectionLabel}>İNDİRİM KODLARI</Text>
                </View>
                {codes.map(dc => (
                  <CodeCard
                    key={dc.id}
                    dc={dc}
                    restaurantName={dc.restaurant_id == null ? 'Tüm restoranlar' : selectedRestaurant.name}
                    copied={copied}
                    onCopy={copyCode}
                  />
                ))}
              </>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  scroll:   { paddingBottom: 16 },

  errorText: { fontFamily: fonts.bodyReg, fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginBottom: 16 },
  retryBtn:  { borderRadius: radii.pill, borderWidth: 1, borderColor: colors.primary, paddingHorizontal: 20, paddingVertical: 8 },
  retryText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.primary },

  header: { fontFamily: fonts.headline, fontSize: 28, color: colors.textPrimary, paddingHorizontal: 20, paddingTop: 10, marginBottom: 8 },

  // Search bar
  searchWrap:  { paddingHorizontal: 16, marginBottom: 4, zIndex: 10 },
  searchBar:   {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radii.pill,
    paddingHorizontal: 14, paddingVertical: 10,
    ...shadows.tabBar,
  },
  searchIcon:  { marginRight: 8 },
  searchInput: { flex: 1, fontFamily: fonts.bodyReg, fontSize: 15, color: colors.textPrimary, padding: 0 },

  // Dropdown
  dropdown:      {
    backgroundColor: colors.surface, borderRadius: 16, marginTop: 6,
    ...shadows.tabBar, overflow: 'hidden',
  },
  dropdownItem:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13 },
  dropdownDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  dropdownText:  { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.textPrimary },

  // Default state
  sectionLabel: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textSecondary, letterSpacing: 0.8, paddingHorizontal: 20, marginTop: 20, marginBottom: 12 },
  chipsRow:     { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 10 },
  chip:         {
    backgroundColor: colors.surface, borderRadius: radii.pill,
    paddingHorizontal: 16, paddingVertical: 9,
    borderWidth: 1, borderColor: '#e0e5e5',
    ...shadows.tabBar,
  },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.textPrimary },
  hint:     { fontFamily: fonts.bodyReg, fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 32, paddingHorizontal: 40 },

  // Deals view
  backLink:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 14, marginBottom: 4 },
  backText:         { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primary },
  restaurantTitle:  { fontFamily: fonts.headline, fontSize: 22, color: colors.textPrimary, paddingHorizontal: 20, marginTop: 8 },
  restaurantSub:    { fontFamily: fonts.bodyReg, fontSize: 14, color: colors.textSecondary, paddingHorizontal: 20, marginTop: 3 },
  emptyText:        { fontFamily: fonts.bodyReg, fontSize: 14, color: colors.textSecondary, paddingHorizontal: 20, marginTop: 20 },

  // Platform section header
  platformHeader:     { flexDirection: 'row', alignItems: 'center', borderRadius: 10, marginHorizontal: 16, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10 },
  platformBar:        { width: 4, height: 20, borderRadius: 2, marginRight: 10 },
  platformHeaderText: { fontFamily: fonts.bodySemi, fontSize: 17, color: colors.textPrimary },

  // Deal cards (full-width, two-column)
  hScroll:  { paddingHorizontal: 20, gap: 12, paddingBottom: 4 },
  dealCard: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    marginHorizontal: 16, marginBottom: 12, ...shadows.tabBar,
  },
  dealLeft:       { flex: 1, marginRight: 12 },
  dealRight:      { width: 130, justifyContent: 'center' },
  dealRightTitle: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.textSecondary, marginBottom: 6 },
  dealComponent:  { fontFamily: fonts.bodyReg, fontSize: 13, color: colors.textPrimary, lineHeight: 22 },
  platformPill:     { alignSelf: 'flex-start', borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 3 },
  platformPillText: { fontFamily: fonts.bodySemi, fontSize: 10, color: '#fff' },
  dealName:         { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.textPrimary, marginTop: 8 },
  dealOldPrice:     { fontFamily: fonts.bodyReg, fontSize: 12, color: colors.textSecondary, textDecorationLine: 'line-through', marginTop: 4 },
  dealPrice:        { fontFamily: fonts.headline, fontSize: 22, color: colors.primary, marginTop: 2 },
  savingsBadge:     { alignSelf: 'flex-start', backgroundColor: '#e8f5e9', borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 2, marginTop: 6 },
  savingsText:      { fontFamily: fonts.bodySemi, fontSize: 11, color: '#2e7d32' },

  // Bang for Buck section
  bfbSectionLabel: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textSecondary, letterSpacing: 0.8, paddingHorizontal: 20, marginTop: 24, marginBottom: 12 },
  bfbSkeleton:     { borderRadius: 16, height: 80, backgroundColor: '#f0f0f0', marginHorizontal: 16, marginBottom: 10 },
  bfbCard:         { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 10 },
  bfbTopRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bfbPlatformPill: { borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 3 },
  bfbPlatformText: { fontFamily: fonts.bodySemi, fontSize: 10, color: '#fff' },
  bfbSavingsBadge: { backgroundColor: '#e8f5e9', borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  bfbSavingsText:  { fontFamily: fonts.bodySemi, fontSize: 12, color: '#2e7d32' },
  bfbName:         { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.textPrimary, marginTop: 8 },
  bfbBottomRow:    { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 6 },
  bfbPrice:        { fontFamily: fonts.headline, fontSize: 22, color: colors.primary },
  bfbIndividual:   { fontFamily: fonts.bodyReg, fontSize: 12, color: colors.textSecondary },

  // Discount code cards
  codeCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: 16,
    marginHorizontal: 20, marginBottom: 10, padding: 14,
    borderLeftWidth: 4, ...shadows.tabBar,
  },
  codeLeft:       { flex: 1, marginRight: 12 },
  codePlatform:   { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textPrimary },
  codeRestaurant: { fontFamily: fonts.bodyReg, fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  codeString:     { fontFamily: 'Courier', fontSize: 16, fontWeight: '700', color: colors.textPrimary, letterSpacing: 1 },
  codeTitle:      { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.textPrimary, lineHeight: 19 },
  codeScoped:     { fontFamily: fonts.bodyReg, fontSize: 11, color: '#b26a00', marginTop: 4 },
  codeBadgeRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  memberBadge:    { backgroundColor: '#ede7f6', borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 2 },
  memberBadgeText:{ fontFamily: fonts.bodySemi, fontSize: 11, color: '#5D3EB2' },
  limitBadge:     { backgroundColor: '#fff3e0', borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 2 },
  limitBadgeText: { fontFamily: fonts.bodySemi, fontSize: 11, color: '#b26a00' },
  codeRight:      { alignItems: 'flex-end', gap: 4 },
  codeLabel:      { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.primary },
  codeDetail:     { fontFamily: fonts.bodyReg, fontSize: 12, color: colors.textSecondary },
  copyBtn:        { borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 6, marginTop: 4 },
  copyRow:        { flexDirection: 'row', alignItems: 'center' },
  copyBtnText:    { fontFamily: fonts.bodySemi, fontSize: 12 },
});
