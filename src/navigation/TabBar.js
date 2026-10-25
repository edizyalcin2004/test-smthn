import { useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet, Platform } from 'react-native';
import { T, font } from '../theme/tokens';
import { TabIcon } from '../components/icons';

// route name -> design tab-icon glyph
const TAB_ICONS = {
  Hub:     'home',
  Compare: 'compare',
  Budget:  'budget',
  Deals:   'deals',
  Account: 'account',
};
// Doybi design labels (Turkish), by route name.
const TAB_LABELS = {
  Hub:     'Keşfet',
  Compare: 'Karşılaştır',
  Deals:   'Fırsatlar',
  Budget:  'Tasarruf',
  Account: 'Hesabım',
};

function TabItem({ route, isFocused, descriptor, onPress, onLongPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const { options } = descriptor;
  const label = options.tabBarLabel ?? TAB_LABELS[route.name] ?? options.title ?? route.name;
  const iconName = TAB_ICONS[route.name] ?? 'home';

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 6 }).start();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      style={s.pressable}
    >
      <Animated.View style={[s.item, { transform: [{ scale }] }]}>
        <TabIcon name={iconName} active={isFocused} />
        <Text style={[s.label, isFocused ? s.labelActive : s.labelInactive]} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export default function TabBar({ state, descriptors, navigation, insets }) {
  return (
    <View style={[s.outer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={s.pill}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const descriptor = descriptors[route.key];

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate({ name: route.name, merge: true });
            }
          };
          const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });

          return (
            <TabItem
              key={route.key}
              route={route}
              isFocused={isFocused}
              descriptor={descriptor}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  outer: {
    backgroundColor: T.bg,
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  pill: {
    backgroundColor: T.navy,
    borderRadius: 23,
    paddingHorizontal: 8,
    paddingTop: 11,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: T.navy, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 18 },
      android: { elevation: 12 },
      default: {},
    }),
  },
  pressable: { flex: 1, alignItems: 'center' },
  item: { alignItems: 'center', justifyContent: 'center', paddingVertical: 2, paddingHorizontal: 6, gap: 4 },
  label: { fontSize: 10.5, marginTop: 1 },
  labelActive: { fontFamily: font.semibold, color: '#fff' },
  labelInactive: { fontFamily: font.medium, color: '#AEBBC2' },
});
