import { Platform } from 'react-native';

// ── NEW navy/gold design system (ported from design-ref ui.jsx `T`) ──
// Pinned exact hexes. Use `T` for all new-design screens/components.
export const T = {
  // core
  navy:     '#061B3A',
  navy2:    '#0B2348',
  navySoft: '#13315C',
  ink:      '#0B1F3D',
  blue:     '#2F66FF',
  blueSoft: '#EAF1FF',
  blueSoft2:'#F0F5FF',
  amber:    '#FFC857',
  gold:     '#F5A524',
  orange:   '#FF7A1A',
  cajun:    '#EE9B2E', // Cajun Corner tile accent (warm orange wordmark outline)
  coral:    '#FF5A4E',
  red:      '#E94235',
  green:    '#2BAE66',
  greenSoft:'#E4F7EC',
  mint:     '#BFEFD2',
  cream:    '#FFF3DA',
  paper:    '#F6E4BE',
  // neutrals
  bg:       '#F6F8FC',
  white:    '#FFFFFF',
  line:     '#EAEEF5',
  line2:    '#E2E8F2',
  sub:      '#6B7793',
  faint:    '#9AA6BE',
  gray:     '#D9E2F2',
};

// Plus Jakarta Sans (loaded in App.js). All design weights are available.
export const font = {
  regular:   'PlusJakartaSans_400Regular',
  medium:    'PlusJakartaSans_500Medium',
  semibold:  'PlusJakartaSans_600SemiBold',
  bold:      'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
};

export const TL = '₺';
export const money = (n) => TL + Number(n).toLocaleString('tr-TR');

// ── LEGACY tokens (kept intact — wired screens Hub/Compare/Deals/Menu/Search
// import these; do not remove). ──
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
