// OrderCheck — the "did you finish your order?" popup (D-030). When the user
// comes back to Pryce after we opened a platform for them, ask once: Yes
// records the order and its savings on this phone; No drops it. A small
// checkbox records whether our prices matched what they saw.
import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, Modal, AppState, StyleSheet } from 'react-native';
import { T, font, money } from '../theme/tokens';
import { Icon } from './icons';
import { loadPending, clearPending, confirmOrder } from '../lib/orders';
import { pendingState, itemsLine } from '../lib/savings';

export default function OrderCheck({ onConfirmed }) {
  const [pending, setPending] = useState(null);
  const [accurate, setAccurate] = useState(false);
  const busy = useRef(false);

  const check = useCallback(async () => {
    const p = await loadPending();
    const st = pendingState(p, Date.now());
    if (st === 'expired') { await clearPending(); return; }
    if (st === 'ask') { setAccurate(false); setPending(p); }
  }, []);

  useEffect(() => {
    check();
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') check(); });
    return () => sub.remove();
  }, [check]);

  const answer = async (yes) => {
    if (busy.current || !pending) return;
    busy.current = true;
    try {
      if (yes) { await confirmOrder(pending, { accurate }); onConfirmed?.(); }
      else await clearPending();
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
          {p.saved > 0 ? <Text style={s.saved}>En pahalı seçeneğe göre {money(p.saved)} daha az</Text> : null}

          <View style={s.buttons}>
            <Pressable style={[s.btn, s.no]} onPress={() => answer(false)} accessibilityRole="button">
              <Text style={s.noText}>Hayır</Text>
            </Pressable>
            <Pressable style={[s.btn, s.yes]} onPress={() => answer(true)} accessibilityRole="button">
              <Text style={s.yesText}>Evet</Text>
            </Pressable>
          </View>

          <Pressable style={s.checkRow} onPress={() => setAccurate((v) => !v)}
            accessibilityRole="checkbox" accessibilityState={{ checked: accurate }} hitSlop={8}>
            <View style={[s.box, accurate && s.boxOn]}>
              {accurate ? <Icon name="check" s={11} c="#fff" sw={3} /> : null}
            </View>
            <Text style={s.checkText}>Fiyatlar uygulamadakiyle aynıydı</Text>
          </Pressable>
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
  checkRow:{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, alignSelf: 'center' },
  box:     { width: 16, height: 16, borderRadius: 4, borderWidth: 1.5, borderColor: T.faint, alignItems: 'center', justifyContent: 'center' },
  boxOn:   { backgroundColor: T.green, borderColor: T.green },
  checkText: { fontSize: 12, fontFamily: font.semibold, color: T.sub },
});
