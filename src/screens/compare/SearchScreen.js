import { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, Pressable,
  ActivityIndicator, StyleSheet, Platform, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radii } from '../../theme/tokens';

const API = 'https://pryce-backend-production.up.railway.app';

export default function SearchScreen({ navigation }) {
  const [query, setQuery]             = useState('');
  const [results, setResults]         = useState([]);
  const [searching, setSearching]     = useState(false);
  const [error, setError]             = useState(null);
  const debounce                      = useRef(null);

  const onChangeText = useCallback((text) => {
    setQuery(text);
    setError(null);
    clearTimeout(debounce.current);
    if (!text.trim()) { setResults([]); return; }
    debounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res  = await fetch(`${API}/search?q=${encodeURIComponent(text)}`);
        const data = await res.json();
        setResults(data.restaurants ?? data ?? []);
      } catch { setError('Search failed. Check your connection.'); setResults([]); }
      finally  { setSearching(false); }
    }, 400);
  }, []);

  const pickRestaurant = useCallback((r) => {
    navigation.navigate('Menu', { restaurant: r });
  }, [navigation]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Text style={s.title}>Compare</Text>

      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} style={s.icon} />
          <TextInput
            style={s.input}
            placeholder="Search restaurant…"
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={onChangeText}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searching
            ? <ActivityIndicator size="small" color={colors.primary} />
            : query.length > 0
              ? (
                <Pressable hitSlop={8} onPress={() => { setQuery(''); setResults([]); }}>
                  <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                </Pressable>
              )
              : null
          }
        </View>
      </View>

      {error ? <Text style={s.error}>{error}</Text> : null}

      {results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(r, i) => String(r.id ?? i)}
          contentContainerStyle={s.listPad}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item: r }) => (
            <Pressable style={({ pressed }) => [s.row, pressed && s.rowPressed]} onPress={() => pickRestaurant(r)}>
              <View style={s.rowIcon}>
                <Ionicons name="restaurant-outline" size={20} color={colors.primary} />
              </View>
              <View style={s.rowMeta}>
                <Text style={s.rowName}>{r.name}</Text>
                {r.cuisine ? <Text style={s.rowSub}>{r.cuisine}</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={s.sep} />}
        />
      ) : !searching && query.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="scale-outline" size={52} color={colors.textSecondary} style={{ opacity: 0.3 }} />
          <Text style={s.emptyText}>Search for a restaurant{'\n'}to compare prices</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: colors.background },
  title:      { fontFamily: fonts.headline, fontSize: 28, color: colors.textPrimary, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6 },

  searchWrap: { paddingHorizontal: 16, paddingBottom: 10 },
  searchBox:  {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 11 : 7,
  },
  icon:       { marginRight: 8 },
  input:      { flex: 1, fontFamily: fonts.bodyReg, fontSize: 15, color: colors.textPrimary },

  listPad:    { paddingHorizontal: 16 },
  row:        { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, padding: 14 },
  rowPressed: { opacity: 0.7 },
  rowIcon:    { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowMeta:    { flex: 1 },
  rowName:    { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.textPrimary },
  rowSub:     { fontFamily: fonts.bodyReg, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  sep:        { height: 8 },

  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText:  { fontFamily: fonts.bodyReg, fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginTop: 14, lineHeight: 22 },
  error:      { fontFamily: fonts.bodyReg, fontSize: 13, color: '#c62828', textAlign: 'center', paddingBottom: 8 },
});
