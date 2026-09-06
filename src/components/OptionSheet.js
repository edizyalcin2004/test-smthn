import { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { getItemOptions } from '../api/client';
import { T, font, money } from '../theme/tokens';
import { toggleChoice, selectionError } from '../lib/options';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OptionSheet({ line, onClose, onSave }) {
  const insets = useSafeAreaInsets();
  const [trees, setTrees] = useState([]), [platform, setPlatform] = useState(null);
  const [selected, setSelected] = useState([]), [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(null); setTrees([]); setPlatform(null); setSelected([]);
    getItemOptions(line.item.id).then(data => {
      if (!active) return;
      setTrees(data);
      const usable = data.filter(t => t.available);
      const source = usable.find(t => t.platform.id === line.sourceConfiguration?.platform_id) || usable[0];
      setPlatform(source?.platform.id ?? null);
      setSelected(source?.platform.id === line.sourceConfiguration?.platform_id ? line.sourceConfiguration.option_item_ids : []);
    }).catch(() => { if (active) setError('Seçenekler yüklenemedi. Tekrar dene.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [line.item.id]);
  const tree = trees.find(t => t.platform.id === platform);
  const invalid = tree ? selectionError(tree.groups, selected) : 'Güncel seçenekler henüz doğrulanamadı.';
  function renderGroups(groups, depth = 0) {
    return groups.map(group => group.shown === false ? <Text key={group.id} style={s.error}>{group.name}: şu anda doğrulanamıyor</Text> : <View key={group.id} style={{ marginLeft: depth * 10, marginTop: 16 }}>
      <Text style={s.group}>{group.name}</Text>
      <Text style={s.hint}>{group.may_skip_without_input ? 'İsteğe bağlı' : 'Seçim gerekli'} · En fazla {group.max_select}</Text>
      {group.choices.map(choice => <View key={choice.id}>
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected.includes(choice.id), disabled: !choice.available }}
          disabled={!choice.available} onPress={() => setSelected(prev => toggleChoice(prev, group, choice))}
          style={[s.choice, selected.includes(choice.id) && s.checked, !choice.available && { opacity: 0.45 }]}>
          <Text style={s.choiceText}>{selected.includes(choice.id) ? '✓ ' : ''}{choice.display_name || choice.name}</Text>
          <Text style={s.hint}>{choice.available && choice.delta != null ? `${Number(choice.delta) > 0 ? '+' : ''}${money(choice.delta)}` : 'Doğrulanamıyor'}</Text>
        </Pressable>
        {selected.includes(choice.id) ? renderGroups(choice.child_groups || [], depth + 1) : null}
      </View>)}
    </View>);
  }
  return <Modal visible animationType="slide" onRequestClose={onClose}>
    <View style={[s.root, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      <Pressable accessibilityRole="button" onPress={onClose}><Text style={s.close}>Kapat</Text></Pressable>
      <Text style={s.title}>{line.item.name}</Text>
      <Text style={s.hint}>Bir kez seç. Yalnızca aynı seçenekleri doğrulayabildiğimiz platformları karşılaştırırız.</Text>
      {loading ? <ActivityIndicator style={{ marginTop: 24 }} /> : <>
        <ScrollView style={{ marginTop: 12 }}>
          <Text style={s.hint}>Seçenekleri gösterilen platform</Text>
          <View style={s.platforms}>{trees.filter(t => t.available).map(t => <Pressable key={t.platform.id}
            onPress={() => { setPlatform(t.platform.id); setSelected([]); }} style={[s.choice, t.platform.id === platform && s.checked]}>
            <Text style={s.choiceText}>{t.platform.name}</Text>
          </Pressable>)}</View>
          {tree?.coverage_status === 'no_options' ? <Text style={s.hint}>Bu üründe ek seçenek yok.</Text> : null}
          {tree ? renderGroups(tree.groups) : null}
          <Text accessibilityLiveRegion="polite" style={s.error}>{error || invalid || ''}</Text>
        </ScrollView>
        <Pressable accessibilityRole="button" disabled={!!invalid || !tree} style={[s.save, invalid && { opacity: 0.4 }]}
          onPress={() => onSave({ platform_id: platform, option_item_ids: selected },
            tree.groups.flatMap(function names(g) { return g.choices.filter(c => selected.includes(c.id))
              .flatMap(c => [c.display_name || c.name, ...(c.child_groups || []).flatMap(names)]); }).join(', '))}>
          <Text style={s.saveText}>Seçenekleri kaydet</Text>
        </Pressable>
      </>}
    </View>
  </Modal>;
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg, padding: 22, paddingTop: 58, paddingBottom: 35 },
  close: { color: T.sub, fontFamily: font.bold, marginBottom: 18 },
  title: { color: T.ink, fontFamily: font.extrabold, fontSize: 22, marginBottom: 8 },
  hint: { color: T.sub, fontSize: 12, lineHeight: 18 }, group: { color: T.ink, fontFamily: font.bold, fontSize: 16 },
  platforms: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  choice: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: T.line, marginTop: 6, backgroundColor: T.white },
  checked: { borderColor: T.green, borderWidth: 2 }, choiceText: { color: T.ink, fontFamily: font.semibold },
  error: { color: T.coral, marginTop: 18, marginBottom: 20 },
  save: { backgroundColor: T.navy, padding: 16, borderRadius: 14, alignItems: 'center' },
  saveText: { color: '#fff', fontFamily: font.bold, fontSize: 16 },
});
