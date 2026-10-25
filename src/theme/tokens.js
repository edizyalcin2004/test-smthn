import { Platform } from 'react-native';

// ── Doybi design system (redesign PR 1, 2026-10-25) ──
export const T = {
  // core — Doybi design (Codex, approved Oct 2026): ivory canvas, deep navy
  // type, yellow highlight, sage/peach support. Key NAMES are kept so every
  // screen recolours from here; values follow the design's CSS variables.
  navy:     '#0A2741',
  navy2:    '#12324F',
  navySoft: '#1E405F',
  ink:      '#0A2741',
  blue:     '#0A2741', // the design has no royal blue: links/actions are ink
  blueSoft: '#E5EBE0', // sage
  blueSoft2:'#EFEEE7',
  amber:    '#FFC439', // design yellow
  gold:     '#9A6B12', // readable gold text on light surfaces
  orange:   '#E9823A',
  cajun:    '#EE9B2E', // Cajun Corner tile accent (warm orange wordmark outline)
  // restaurant tile accents — brand-EVOKING colours only, never logos (IP-safe)
  popeyes:       '#FF7D00', // saturated orange
  kofteciYusuf:  '#A31621', // deep crimson
  tavukDunyasi:  '#E2001A', // bright red
  ustaDonerci:   '#8C5A2B', // bronze / döner warmth
  maydonozDoner: '#2F9E44', // maydonoz = parsley → green
  dominos:       '#006491', // deep blue
  pizzaBulls:    '#262A33', // charcoal
  coral:    '#E2674F',
  red:      '#C8432F',
  green:    '#35634F', // design green
  greenSoft:'#E5EBE0', // sage
  mint:     '#CFDCCB',
  cream:    '#FFF0C5', // yellow-tinted panel (coupon/highlight)
  paper:    '#F0E8D8',
  peach:    '#F8DFC9',
  sage:     '#E5EBE0',
  yellow:   '#FFC439',
  // neutrals
  bg:       '#F7F5EF', // ivory canvas
  white:    '#FFFEFA', // card surface
  line:     '#E6E4DC',
  line2:    '#DFDFD4',
  sub:      '#78817F',
  faint:    '#A3A8A0',
  gray:     '#E6E4DC',
};

// Short serif accents ("Hangisi *daha uygun?*") — the design uses Georgia
// italic; this is the platform's built-in serif, no extra font download.
export const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });

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
