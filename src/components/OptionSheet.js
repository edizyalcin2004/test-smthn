// OptionSheet (T-028): configure an item once, on the reference platform's
// option tree. No prices are shown here on purpose — option prices differ
// per platform, and the comparison prices each platform itself.
import { useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, font } from '../theme/tokens';
import { Icon } from './icons';
import { visibleGroups, toggle, problem, summary } from '../lib/options';

export default function OptionSheet({ item, tree, initial = [], onClose, onSave }) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(initial);
  const groups = tree.groups;
  const err = problem(groups, selected);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} transparent>
      <View style={s.scrim}>
        <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={s.head}>
            <Text style={s.title} numberOfLines={2}>{item.name}</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Kapat">
              <Icon name="x" s={20} c={T.sub} />
            </Pressable>
          </View>
          <Text style={s.note}>
            Bir kez seç; her platformu kendi fiyatıyla hesaplarız. Aynı seçenekleri doğrulayamadığımız platformlar
            "karşılaştırılamıyor" olarak gösterilir.
          </Text>
          <ScrollView style={{ maxHeight: 460 }} contentContainerStyle={{ paddingBottom: 8 }}>
            {visibleGroups(groups, selected).map((g) => {
              const nested = g.parent_option_id != null;
              return (
                <View key={String(g.id)} style={[s.group, nested && s.nested]}>
                  <Text style={s.gname}>{g.name}</Text>
                  <Text style={s.ghint}>
                    {g.min > 0 ? (g.min === 1 && g.max === 1 ? 'Bir seçim yap' : `En az ${g.min}`) : 'İsteğe bağlı'}
                    {g.max > 1 ? ` · en fazla ${g.max}` : ''}
                  </Text>
                  <View style={s.opts}>
                    {g.options.map((o) => {
                      const on = selected.includes(o.id);
                      return (
                        <Pressable key={String(o.id)} onPress={() => setSelected((cur) => toggle(groups, cur, g, o.id))}
                          style={[s.opt, on && s.optOn]} accessibilityRole={g.max === 1 ? 'radio' : 'checkbox'}
                          accessibilityState={{ checked: on }}>
                          <Text style={[s.optText, on && s.optTextOn]}>{o.name}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </ScrollView>
          <Text style={s.err} accessibilityLiveRegion="polite">{err || ' '}</Text>
          <Pressable disabled={!!err} style={[s.save, err && { opacity: 0.4 }]} accessibilityRole="button"
            onPress={() => onSave({ platform_id: tree.reference_platform.id, choices: selected,
                                    summary: summary(groups, selected) })}>
            <Text style={s.saveText}>Sepete ekle</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  scrim:   { flex: 1, backgroundColor: 'rgba(6,27,58,0.45)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '88%' },
  head:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title:   { flex: 1, fontSize: 19, fontFamily: font.extrabold, color: T.ink },
  note:    { fontSize: 12, fontFamily: font.semibold, color: T.sub, marginTop: 6, marginBottom: 6, lineHeight: 17 },
  group:   { marginTop: 14 },
  nested:  { marginLeft: 12, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: T.bg },
  gname:   { fontSize: 14.5, fontFamily: font.extrabold, color: T.ink },
  ghint:   { fontSize: 11.5, fontFamily: font.semibold, color: T.faint, marginTop: 2 },
  opts:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  opt:     { borderRadius: 12, borderWidth: 1.5, borderColor: '#E3E8F2', paddingVertical: 9, paddingHorizontal: 12, backgroundColor: '#fff' },
  optOn:   { borderColor: T.navy, backgroundColor: T.navy },
  optText: { fontSize: 13, fontFamily: font.semibold, color: T.ink },
  optTextOn: { color: '#fff' },
  err:     { fontSize: 12, fontFamily: font.bold, color: '#E5484D', marginTop: 8, minHeight: 16 },
  save:    { backgroundColor: T.gold, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  saveText:{ fontSize: 15, fontFamily: font.extrabold, color: T.navy },
});
