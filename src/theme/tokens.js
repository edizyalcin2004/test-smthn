import { Platform } from 'react-native';

export const colors = {
  primary:       '#006566',
  background:    '#f8fafa',
  surface:       '#ffffff',
  textPrimary:   '#1a1a2e',
  textSecondary: '#8a8a9a',
};

export const fonts = {
  headline: 'Manrope_800ExtraBold',
  bodyReg:  'Inter_400Regular',
  bodySemi: 'Inter_600SemiBold',
};

export const radii = {
  pill:      999,
  tabBarTop: 24,
  button:    999,
};

export const shadows = {
  tabBar: Platform.select({
    ios: {
      shadowColor:   '#000',
      shadowOffset:  { width: 0, height: -2 },
      shadowOpacity: 0.06,
      shadowRadius:  8,
    },
    android: { elevation: 8 },
    default: {},
  }),
};
