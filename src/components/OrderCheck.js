// OrderCheck — the "did you finish your order?" popup (D-030). When the user
// comes back to Pryce after we opened a platform for them, ask once: Yes
// records the order and its savings on this phone; No drops it. A small
// pair of options records whether our prices matched what they saw; that
// answer goes to the backend anonymously (POST /order-feedback).
import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, Modal, AppState, StyleSheet, TextInput } from 'react-native';
import { T, font, money } from '../theme/tokens';
import { Icon } from './icons';
import { loadPending, clearPending, confirmOrder, declineOrder } from '../lib/orders';
import { pendingState, itemsLine, parsePaid } from '../lib/savings';

const REASONS = [['item_price', 'Ürün fiyatı'], ['fee', 'Teslimat/hizmet ücreti'], ['code', 'Kod çalışmadı'],
  ['unavailable', 'Ürün yoktu'], ['other', 'Diğer']];

export default function OrderCheck({ onConfirmed }) {
  const [pending, setPending] = useState(null);
  const [matched, setMatched] = useState(null); // true | false | null
  const [reason, setReason] = useState(null);
  const [paidText, setPaidText] = useState('');
  const [paidEdited, setPaidEdited] = useState(false);
  const busy = useRef(false);

  const check = useCallback(async () => {
    const p = await loadPending();
    const st = pendingState(p, Date.now());
    if (st === 'expired') { await clearPending(); return; }
    if (st === 'ask') { setMatched(null); setReason(null); setPaidText(Number(p.paid).toFixed(2)); setPaidEdited(false); setPending(p); }
  }, []);

  useEffect(() => {
    check();
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') check(); });
    return () => sub.remove();
  }, [check]);

  const answer = async (yes) => {
    if (busy.current || !pending || (yes && (parsePaid(paidText) === null || (matched === false && !paidEdited)))) return;
    busy.current = true;
    try {
      if (yes) { await confirmOrder(pending, { matched, reason, paid: paidText }); onConfirmed?.(); }
      else await declineOrder(pending);
    } finally { busy.current = false; setPending(null); }
  };

  if (!pending) return null;
  const p = pending;
  return (
    <Modal transparent animationType="fade" visible onRequestClose={() => setPending(null)}>
      <View style={s.scrim}>
        <View style={s.sheet}>
          <Text style={s.title}>Siparişini tamamladın mı?</Text>
          <Text style={s.body}>
            {[p.restaurant.name, itemsLine(p.items)].filter(Boolean).join(' · ')}
          </Text>
          <Text style={s.body}>
            {p.platform.name} · {money(p.paid)}
            {p.wasCheapest && p.platformsCompared >= 2 ? <Text> · en iyi <Text style={s.gold}>Pryce</Text> ile</Text> : null}
          </Text>
          <Text style={s.checkText}>Tasarruf, onayladığın tutarla diğer platformların karşılaştırılan fiyatlarına göre hesaplanır.</Text>

          <Text style={[s.checkText, { marginTop: 14 }]}>Ödediğin tutar (₺)</Text>
          <TextInput value={paidText} onChangeText={(v) => { setPaidText(v); setPaidEdited(true); }}
            keyboardType="decimal-pad" accessibilityLabel="Ödediğin tutar" maxLength={9}
            style={{ borderWidth: 1, borderColor: T.faint, borderRadius: 10, padding: 10, marginTop: 6 }} />
          {matched === false && !paidEdited ? <Text style={s.checkText}>Lütfen gerçekten ödediğin tutarı gir.</Text> : null}
          <View style={s.buttons}>
            <Pressable style={[s.btn, s.no]} onPress={() => answer(false)} accessibilityRole="button">
              <Text style={s.noText}>Hayır</Text>
            </Pressable>
            <Pressable disabled={parsePaid(paidText) === null || (matched === false && !paidEdited)} style={[s.btn, s.yes]} onPress={() => answer(true)} accessibilityRole="button">
              <Text style={s.yesText}>Evet</Text>
            </Pressable>
          </View>

          <View style={s.checkRow}>
            {[[true, 'Fiyatlar doğruydu'], [false, 'Fiyat farklıydı']].map(([v, label]) => (
              <Pressable key={label} onPress={() => setMatched((m) => (m === v ? null : v))} hitSlop={6}
                accessibilityRole="radio" accessibilityState={{ checked: matched === v }} style={s.opt}>
                <View style={[s.box, matched === v && (v ? s.boxOn : s.boxBad)]}>
                  {matched === v ? <Icon name="check" s={11} c="#fff" sw={3} /> : null}
                </View>
                <Text style={s.checkText}>{label}</Text>
              </Pressable>
            ))}
          </View>
          {matched === false ? (
            <View style={s.reasons}>
              {REASONS.map(([k, label]) => (
                <Pressable key={k} onPress={() => setReason((r) => (r === k ? null : k))}
                  style={[s.chip, reason === k && s.chipOn]} accessibilityRole="radio"
                  accessibilityState={{ checked: reason === k }}>
                  <Text style={[s.chipText, reason === k && s.chipTextOn]}>{label}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  scrim:   { flex: 1, backgroundColor: 'rgba(6,27,58,0.55)', justifyContent: 'center', padding: 24 },
  sheet:   { backgroundColor: '#fff', borderRadius: 22, padding: 22 },
  title:   { fontSize: 19, fontFamily: font.extrabold, color: T.ink, marginBottom: 10 },
  body:    { fontSize: 14, fontFamily: font.semibold, color: T.sub, lineHeight: 20 },
  gold:    { fontFamily: font.extrabold, color: T.gold },
  saved:   { fontSize: 13, fontFamily: font.bold, color: T.green, marginTop: 8 },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 18 },
  btn:     { flex: 1, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  no:      { backgroundColor: T.bg },
  noText:  { fontSize: 15, fontFamily: font.extrabold, color: T.sub },
  yes:     { backgroundColor: T.gold },
  yesText: { fontSize: 15, fontFamily: font.extrabold, color: T.navy },
  checkRow:{ flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 14 },
  opt:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  boxBad:  { backgroundColor: '#E5484D', borderColor: '#E5484D' },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 10 },
  chip:    { borderRadius: 999, borderWidth: 1, borderColor: T.faint, paddingVertical: 5, paddingHorizontal: 10 },
  chipOn:  { backgroundColor: T.navy, borderColor: T.navy },
  chipText:{ fontSize: 11.5, fontFamily: font.semibold, color: T.sub },
  chipTextOn: { color: '#fff' },
  box:     { width: 16, height: 16, borderRadius: 4, borderWidth: 1.5, borderColor: T.faint, alignItems: 'center', justifyContent: 'center' },
  boxOn:   { backgroundColor: T.green, borderColor: T.green },
  checkText: { fontSize: 12, fontFamily: font.semibold, color: T.sub },
});
