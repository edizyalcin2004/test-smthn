// CodeSheet.js — app-level discount-code bottom sheet, shared by Hub, Deals,
// and Results. Maps LIVE /discount-codes fields straight through; never invents
// a discount or hides a condition.
//
//   const { openCode } = useCodeSheet();   // anywhere under <CodeSheetProvider>
//   openCode(codeObject);
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { T, font, money } from '../theme/tokens';
import { Icon } from './icons';
import { Brand, Pill } from './ui';
import { platformBrand } from '../lib/brand';
import { getRestaurants } from '../api/client';

const CodeSheetContext = createContext({ openCode: () => {} });
export const useCodeSheet = () => useContext(CodeSheetContext);

export function CodeSheetProvider({ children, navigationRef }) {
  const [code, setCode] = useState(null);
  const restaurantsRef = useRef(null); // cached /restaurants for the compare CTA

  const openCode = useCallback((c) => setCode(c), []);
  const close    = useCallback(() => setCode(null), []);

  // Resolve restaurant_id → {id, name} so "Restoranı karşılaştır" can deep-link.
  // Returns null on any failure so the CTA simply stays hidden.
  const resolveRestaurant = useCallback(async (id) => {
    if (id == null) return null;
    if (!restaurantsRef.current) {
      try { restaurantsRef.current = await getRestaurants(); }
      catch { restaurantsRef.current = []; }
    }
    return restaurantsRef.current.find((r) => r.id === id) || null;
  }, []);

  return (
    <CodeSheetContext.Provider value={{ openCode }}>
      {children}
      <CodeSheet code={code} onClose={close} navigationRef={navigationRef} resolveRestaurant={resolveRestaurant} />
    </CodeSheetContext.Provider>
  );
}

// ── condition / value humanizers (display-only; mirror client.js contract) ──
function discountText(c) {
  if (!c) return '';
  return c.discount_type === 'percentage'
    ? `%${c.discount_value} indirim`
    : `${money(c.discount_value)} indirim`;
}

function usageHuman(u) {
  if (!u) return 'Sınırsız';
  if (u === 'once_per_user') return 'Kullanıcı başına 1 kez';
  if (u === 'first_order')   return 'İlk siparişe özel';
  return String(u);
}

function formatExpiry(s) {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return String(s);
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Açıklama lines built only from conditions actually present on the code.
function buildTerms(c) {
  if (!c) return [];
  const terms = [];
  if (c.requires_membership) terms.push(`${c.requires_membership} üyeliği gerekir.`);
  if (c.item_scoped)         terms.push('Yalnızca belirli ürünlerde geçerli.');
  if (c.usage_limit === 'first_order')        terms.push('İlk siparişe özel.');
  else if (c.usage_limit === 'once_per_user') terms.push('Kullanıcı başına 1 kez kullanılabilir.');
  else if (c.usage_limit)                     terms.push(String(c.usage_limit));
  if (!terms.length) terms.push('Ek koşul belirtilmemiş.');
  return terms;
}

function CodeSheet({ code, onClose, navigationRef, resolveRestaurant }) {
  const insets = useSafeAreaInsets();
  const [copied, setCopied]         = useState(false);
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    setCopied(false);
    setRestaurant(null);
    if (!code || code.restaurant_id == null) return;
    let alive = true;
    resolveRestaurant(code.restaurant_id).then((r) => { if (alive) setRestaurant(r); });
    return () => { alive = false; };
  }, [code, resolveRestaurant]);

  const visible = !!code;
  const brand   = platformBrand(code?.platform);
  const hasCode = !!(code && code.code);

  const copy = useCallback(async () => {
    if (!code?.code) return;
    await Clipboard.setStringAsync(code.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [code]);

  const goCompare = useCallback(() => {
    if (!restaurant || !navigationRef?.current) return;
    onClose();
    navigationRef.current.navigate('Compare', { screen: 'Menu', params: { restaurant } });
  }, [restaurant, navigationRef, onClose]);

  const rows = code ? [
    { k: 'Min. sipariş',  v: code.minimum_order != null ? money(code.minimum_order) : 'Yok' },
    { k: 'Bitiş tarihi',  v: formatExpiry(code.expiry_date) },
    { k: 'Kullanım',      v: usageHuman(code.usage_limit) },
  ] : [];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={st.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[st.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={st.grabber} />
          {code && (
            <>
              <View style={st.headerRow}>
                <Brand brand={brand} size={50} radius={14} />
                <View style={{ flex: 1 }}>
                  <Text style={st.codeText} numberOfLines={1}>{code.code || code.title}</Text>
                  <Text style={st.platformName} numberOfLines={1}>{code.platform?.name}</Text>
                </View>
                <Pill bg={T.cream} fg={T.gold} textStyle={st.discountPillText}>{discountText(code)}</Pill>
              </View>

              <View style={st.rows}>
                {rows.map((r) => (
                  <View key={r.k} style={st.row}>
                    <Text style={st.rowKey}>{r.k}</Text>
                    <Text style={st.rowVal}>{r.v}</Text>
                  </View>
                ))}
              </View>

              <Text style={st.termsLabel}>AÇIKLAMA</Text>
              <Text style={st.terms}>{buildTerms(code).join(' ')}</Text>

              <View style={st.actions}>
                {hasCode && (
                  <Pressable onPress={copy} style={[st.btn, { backgroundColor: copied ? T.green : T.blue }]}>
                    <Icon name={copied ? 'check' : 'copy'} s={18} c="#fff" sw={copied ? 2.4 : 1.9} />
                    <Text style={st.btnText}>{copied ? 'Kopyalandı' : 'Kodu kopyala'}</Text>
                  </Pressable>
                )}
                {restaurant && (
                  <Pressable onPress={goCompare} style={[st.btn, { backgroundColor: T.bg }]}>
                    <Text style={[st.btnText, { color: T.ink }]}>Restoranı karşılaştır</Text>
                  </Pressable>
                )}
                <Pressable onPress={onClose} style={st.closeBtn}>
                  <Text style={st.closeText}>Kapat</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  root:        { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(6,27,58,0.45)' },
  sheet:       { backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 10 },
  grabber:     { width: 40, height: 5, borderRadius: 999, backgroundColor: T.line2, alignSelf: 'center', marginBottom: 18 },

  headerRow:   { flexDirection: 'row', alignItems: 'center', gap: 13 },
  codeText:    { fontSize: 19, fontFamily: font.extrabold, color: T.ink, letterSpacing: 0.2 },
  platformName:{ fontSize: 13, fontFamily: font.semibold, color: T.sub, marginTop: 1 },
  discountPillText: { fontSize: 13, fontFamily: font.extrabold },

  rows:        { marginTop: 18 },
  row:         { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.line },
  rowKey:      { fontSize: 13.5, fontFamily: font.semibold, color: T.sub },
  rowVal:      { fontSize: 13.5, fontFamily: font.extrabold, color: T.ink },

  termsLabel:  { fontSize: 11, fontFamily: font.extrabold, color: T.faint, letterSpacing: 1.2, marginTop: 16, marginBottom: 6 },
  terms:       { fontSize: 12.5, fontFamily: font.medium, color: T.sub, lineHeight: 20 },

  actions:     { marginTop: 20, gap: 10 },
  btn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, paddingVertical: 15 },
  btnText:     { fontSize: 15.5, fontFamily: font.extrabold, color: '#fff' },
  closeBtn:    { alignItems: 'center', paddingVertical: 8 },
  closeText:   { fontSize: 14.5, fontFamily: font.bold, color: T.sub },
});
