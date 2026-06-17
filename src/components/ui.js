// ui.js — shared RN primitives ported from design-ref ui.jsx.
// Build once, reuse across new-design screens.
import { Children, isValidElement } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, font } from '../theme/tokens';
import { Icon } from './icons';

// soft card shadow (≈ design's layered box-shadow)
const cardShadow = Platform.select({
  ios: { shadowColor: T.ink, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 16 },
  android: { elevation: 3 },
  default: {},
});

// ── scrollable screen body (design `Body`): pads bottom for the floating tab bar ──
export function Screen({ children, pad = true, style, contentStyle }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[{ flex: 1, backgroundColor: T.bg }, style]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          { paddingTop: insets.top + 4, paddingBottom: pad ? 110 : 24 },
          contentStyle,
        ]}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function Card({ children, style, onPress, pad = 16 }) {
  const Cmp = onPress ? Pressable : View;
  return (
    <Cmp onPress={onPress} style={[{ backgroundColor: T.white, borderRadius: 20, padding: pad }, cardShadow, style]}>
      {children}
    </Cmp>
  );
}

export function Pill({ children, bg = T.bg, fg = T.sub, style, textStyle }) {
  return (
    <View style={[s.pill, { backgroundColor: bg }, style]}>
      {Children.map(children, (ch) =>
        typeof ch === 'string' || typeof ch === 'number'
          ? <Text style={[s.pillText, { color: fg }, textStyle]}>{ch}</Text>
          : ch
      )}
    </View>
  );
}

export function Eyebrow({ children, color = T.faint, style }) {
  return <Text style={[s.eyebrow, { color }, style]}>{children}</Text>;
}

export function SectionHead({ title, action, onAction, style }) {
  return (
    <View style={[s.sectionHead, style]}>
      <Text style={s.sectionTitle}>{title}</Text>
      {action ? (
        <Text onPress={onAction} style={s.sectionAction}>{action}</Text>
      ) : null}
    </View>
  );
}

export function PrimaryButton({ children, onPress, bg = T.blue, fg = '#fff', style, textStyle }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.primaryBtn, { backgroundColor: bg, opacity: pressed ? 0.92 : 1 }, style]}>
      <Text style={[s.primaryBtnText, { color: fg }, textStyle]}>{children}</Text>
    </Pressable>
  );
}

export function RoundBtn({ children, onPress, size = 42, badge, bg = T.white, style }) {
  return (
    <Pressable onPress={onPress} style={[s.roundBtn, { width: size, height: size, backgroundColor: bg }, style]}>
      {children}
      {badge ? <View style={s.badge} /> : null}
    </Pressable>
  );
}

// page header: big title + optional back + optional bell/right
export function Header({ title, sub, onBell, bellBadge = true, right, back, onBack }) {
  return (
    <View style={s.header}>
      <View style={s.headerLeft}>
        {back ? (
          <RoundBtn onPress={onBack} size={40}><Icon name="back" s={20} c={T.ink} /></RoundBtn>
        ) : null}
        <View style={{ flexShrink: 1 }}>
          <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>
          {sub ? <Text style={s.headerSub}>{sub}</Text> : null}
        </View>
      </View>
      {right !== undefined
        ? right
        : (onBell !== undefined ? (
            <RoundBtn onPress={onBell} badge={bellBadge}><Icon name="bell" s={20} c={T.ink} /></RoundBtn>
          ) : null)}
    </View>
  );
}

// ── platform / restaurant brand tile (prop-driven; no hardcoded brand data
// so this stays free of any fake-restaurant content). ──
export function Brand({ brand, size = 44, radius = 13 }) {
  if (!brand) return null;
  return (
    <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: brand.bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {brand.short ? (
        <Text style={{ color: brand.fg, fontFamily: font.extrabold, fontSize: size * 0.36 }}>{brand.short}</Text>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, paddingVertical: 4, paddingHorizontal: 9, borderRadius: 8 },
  pillText: { fontSize: 11.5, fontFamily: font.bold, lineHeight: 14 },
  eyebrow: { fontSize: 11, fontFamily: font.extrabold, letterSpacing: 1.3, textTransform: 'uppercase' },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontFamily: font.extrabold, color: T.ink, letterSpacing: -0.2 },
  sectionAction: { fontSize: 13, fontFamily: font.bold, color: T.blue },
  primaryBtn: { width: '100%', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { fontFamily: font.extrabold, fontSize: 16, letterSpacing: -0.2 },
  roundBtn: {
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: T.ink, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.16, shadowRadius: 8 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  badge: { position: 'absolute', top: -3, right: -3, width: 9, height: 9, borderRadius: 999, backgroundColor: T.coral, borderWidth: 2, borderColor: T.bg },
  header: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 8, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  headerTitle: { fontSize: 25, fontFamily: font.extrabold, color: T.ink, letterSpacing: -0.5 },
  headerSub: { fontSize: 13.5, color: T.sub, marginTop: 3, fontFamily: font.semibold },
});
