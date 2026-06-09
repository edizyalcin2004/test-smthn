import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme/tokens';

export default function BudgetScreen() {
  return (
    <View style={s.container}>
      <Text style={s.title}>Budget</Text>
      <Text style={s.sub}>Coming soon</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  title:     { fontFamily: fonts.headline, fontSize: 32, color: colors.textPrimary, marginBottom: 8 },
  sub:       { fontFamily: fonts.bodyReg, fontSize: 16, color: colors.textSecondary },
});
