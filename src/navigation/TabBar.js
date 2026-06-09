import { useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radii, shadows } from '../theme/tokens';

const TAB_ICONS = {
  Hub:     { active: 'home',      inactive: 'home-outline' },
  Compare: { active: 'scale',     inactive: 'scale-outline' },
  Budget:  { active: 'wallet',    inactive: 'wallet-outline' },
  Deals:   { active: 'pricetag', inactive: 'pricetag-outline' },
  Account: { active: 'person',    inactive: 'person-outline' },
};

function TabItem({ route, isFocused, descriptor, onPress, onLongPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const { options } = descriptor;
  const label = options.tabBarLabel ?? options.title ?? route.name;
  const icons = TAB_ICONS[route.name];

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 50, bounciness: 0 }).start();

  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();

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
      <Animated.View style={[s.item, isFocused && s.itemActive, { transform: [{ scale }] }]}>
        <Ionicons
          name={isFocused ? icons.active : icons.inactive}
          size={22}
          color={isFocused ? colors.tabActiveLabel : colors.tabInactiveIcon}
        />
        <Text style={[s.label, isFocused ? s.labelActive : s.labelInactive]} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export default function TabBar({ state, descriptors, navigation, insets }) {
  return (
    <View style={[s.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
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
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.tabBarTop,
    borderTopRightRadius: radii.tabBarTop,
    paddingTop: 10,
    paddingHorizontal: 8,
    ...shadows.tabBar,
  },
  pressable: {
    flex: 1,
    alignItems: 'center',
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    minWidth: 60,
  },
  itemActive: {
    backgroundColor: colors.tabActivePill,
  },
  label: {
    fontSize: 11,
    marginTop: 3,
  },
  labelActive: {
    fontFamily: fonts.bodySemi,
    color: colors.tabActiveLabel,
  },
  labelInactive: {
    fontFamily: fonts.bodyReg,
    color: colors.tabInactiveIcon,
  },
});
