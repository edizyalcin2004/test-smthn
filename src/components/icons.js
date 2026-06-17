// icons.js — line icons, tab icons, star + spark, ported from design-ref icons.jsx
// to react-native-svg.
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { T } from '../theme/tokens';

// ── generic stroke line icons ──
// Each entry is a render fn (color, strokeWidth) => svg children.
const PATHS = {
  bell: (c, sw) => (
    <>
      <Path d="M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6z" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 19a2 2 0 004 0" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  search: (c, sw) => (
    <>
      <Circle cx="11" cy="11" r="7" stroke={c} strokeWidth={sw} />
      <Path d="M20 20l-3.4-3.4" stroke={c} strokeWidth={sw} strokeLinecap="round" />
    </>
  ),
  filter: (c, sw) => <Path d="M4 6h16M7 12h10M10 18h4" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />,
  back: (c, sw) => <Path d="M15 5l-7 7 7 7" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />,
  chevR: (c, sw) => <Path d="M9 5l7 7-7 7" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />,
  chevD: (c, sw) => <Path d="M6 9l6 6 6-6" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />,
  plus: (c, sw) => <Path d="M12 5v14M5 12h14" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />,
  minus: (c, sw) => <Path d="M5 12h14" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />,
  heart: (c, sw) => <Path d="M12 20s-7-4.4-7-9.3A4 4 0 0112 8a4 4 0 017 2.7C19 15.6 12 20 12 20z" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />,
  check: (c, sw) => <Path d="M5 12.5l4.5 4.5L19 6.5" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />,
  copy: (c, sw) => (
    <>
      <Rect x="9" y="9" width="11" height="11" rx="2.6" stroke={c} strokeWidth={sw} />
      <Path d="M5 15V6a2 2 0 012-2h9" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  x: (c, sw) => <Path d="M6 6l12 12M18 6L6 18" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />,
  bolt: (c, sw) => <Path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />,
  clock: (c, sw) => (
    <>
      <Circle cx="12" cy="12" r="8.5" stroke={c} strokeWidth={sw} />
      <Path d="M12 7.5V12l3 1.8" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  crown: (c, sw) => (
    <>
      <Path d="M4 8l3.5 3L12 5l4.5 6L20 8l-1.5 9h-13L4 8z" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5.5 20h13" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  card: (c, sw) => (
    <>
      <Rect x="3" y="5.5" width="18" height="13" rx="2.4" stroke={c} strokeWidth={sw} />
      <Path d="M3 10h18M7 14.5h4" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  pin: (c, sw) => (
    <>
      <Path d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="10" r="2.4" stroke={c} strokeWidth={sw} />
    </>
  ),
  help: (c, sw) => (
    <>
      <Circle cx="12" cy="12" r="8.6" stroke={c} strokeWidth={sw} />
      <Path d="M9.6 9.4a2.4 2.4 0 014.7.7c0 1.7-2.3 2-2.3 3.4" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="16.6" r="0.6" fill={c} />
    </>
  ),
  gear: (c, sw) => (
    <>
      <Circle cx="12" cy="12" r="3.1" stroke={c} strokeWidth={sw} />
      <Path d="M19.4 13.5a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V20a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H4a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H12a1.7 1.7 0 001-1.5V4a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V12a1.7 1.7 0 001.5 1H20a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  edit: (c, sw) => (
    <>
      <Path d="M12 20h9" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  bag: (c, sw) => (
    <>
      <Path d="M6 8h12l.8 11a1.8 1.8 0 01-1.8 2H7a1.8 1.8 0 01-1.8-2L6 8z" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8.5 8V6.5a3.5 3.5 0 017 0V8" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  basket: (c, sw) => (
    <>
      <Path d="M5 9h14l-1.1 9.2a2 2 0 01-2 1.8H8.1a2 2 0 01-2-1.8L5 9z" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8.6 9l2-5M15.4 9l-2-5M3.5 9h17" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  truck: (c, sw) => (
    <>
      <Path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="7" cy="18" r="1.6" stroke={c} strokeWidth={sw} />
      <Circle cx="17.5" cy="18" r="1.6" stroke={c} strokeWidth={sw} />
    </>
  ),
  alert: (c, sw) => (
    <>
      <Circle cx="12" cy="12" r="9" stroke={c} strokeWidth={sw} />
      <Path d="M12 8v5M12 16h.01" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  spark: (c, sw) => <Path d="M12 3l1.6 5L19 9.6 13.6 11 12 16l-1.6-5L5 9.6 10.4 8 12 3z" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />,
  // simple bar-chart (used for the Pro "smart budget" feature; design referenced a 'budget' glyph)
  chart: (c, sw) => (
    <>
      <Rect x="4" y="12" width="3.6" height="7.5" rx="1.2" stroke={c} strokeWidth={sw} strokeLinejoin="round" />
      <Rect x="10.2" y="7" width="3.6" height="12.5" rx="1.2" stroke={c} strokeWidth={sw} strokeLinejoin="round" />
      <Rect x="16.4" y="4" width="3.6" height="15.5" rx="1.2" stroke={c} strokeWidth={sw} strokeLinejoin="round" />
    </>
  ),
};

export function Icon({ name, s = 22, c = T.ink, sw = 1.9 }) {
  const render = PATHS[name] || PATHS.x;
  // Some icons (spark with sw=0, gear) intentionally render filled when sw small;
  // keep behaviour: when sw is 0 we fill instead of stroke.
  const filled = sw === 0;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill={filled ? c : 'none'}>
      {filled ? renderFilled(name, c) : render(c, sw)}
    </Svg>
  );
}

// A few icons are used filled (sw=0) in the design (e.g. spark accent, crown).
function renderFilled(name, c) {
  switch (name) {
    case 'spark':
      return <Path d="M12 3l1.6 5L19 9.6 13.6 11 12 16l-1.6-5L5 9.6 10.4 8 12 3z" fill={c} />;
    case 'crown':
      return <Path d="M4 8l3.5 3L12 5l4.5 6L20 8l-1.5 9h-13L4 8z" fill={c} />;
    default: {
      const render = PATHS[name] || PATHS.x;
      return render(c, 1.9);
    }
  }
}

// filled star (rating)
export function Star({ s = 14, c = T.amber }) {
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill={c}>
      <Path d="M12 2.4l2.6 5.6 6 .7-4.4 4.1 1.2 5.9L12 16l-5.4 2.7 1.2-5.9L3.4 8.7l6-.7L12 2.4z" />
    </Svg>
  );
}

// tiny sparkle for hero cards (absolute-positioned by caller via wrapper)
export function Spark({ s = 14, o = 0.9, style }) {
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="#fff" style={[{ opacity: o }, style]}>
      <Path d="M12 2l1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2z" />
    </Svg>
  );
}

// ── tab bar icons (filled when active) ──
export function TabIcon({ name, active }) {
  const c = active ? T.blue : 'rgba(255,255,255,0.55)';
  const s = 23;
  const sw = 1.9;
  const wrap = (children) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill={active ? c : 'none'} stroke={active ? 'none' : c} strokeWidth={active ? 0 : sw} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </Svg>
  );
  switch (name) {
    case 'home':
      return wrap(active
        ? <Path d="M3 11.3L12 3.5l9 7.8V20a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-8.7z" />
        : <>
            <Path d="M4 11.5L12 4.5l8 7" />
            <Path d="M5.5 10.3V20h13V10.3" />
            <Path d="M9.5 20v-6h5v6" />
          </>);
    case 'compare':
      return wrap(active
        ? <Path d="M5 4h14a1 1 0 011 1v9a1 1 0 01-1 1H9.5L5.5 19a.6.6 0 01-1-.4V5a1 1 0 011-1z" />
        : <>
            <Path d="M5 4.8h14a1 1 0 011 1V14a1 1 0 01-1 1H9.6L5.6 18.4V5.8a1 1 0 011-1z" />
            <Path d="M9 9h6M9 12h4" />
          </>);
    case 'budget':
      return wrap(
        <>
          <Rect x="4" y="12" width="3.6" height="7.5" rx="1.2" />
          <Rect x="10.2" y="7" width="3.6" height="12.5" rx="1.2" />
          <Rect x="16.4" y="4" width="3.6" height="15.5" rx="1.2" />
        </>);
    case 'deals':
      return wrap(active
        ? <Path d="M12.4 3H6a2.4 2.4 0 00-2.4 2.4V12a2 2 0 00.6 1.4l7 7a2 2 0 002.8 0l5.6-5.6a2 2 0 000-2.8l-7-7A2 2 0 0012.4 3zM8 9.2a1.4 1.4 0 110-2.8 1.4 1.4 0 010 2.8z" />
        : <>
            <Path d="M12.4 3.6H6.2A2.2 2.2 0 004 5.8V12a2 2 0 00.6 1.4l7 7a2 2 0 002.8 0l5.6-5.6a2 2 0 000-2.8l-7-7a2 2 0 00-1.6-.6z" />
            <Circle cx="8" cy="8" r="1.3" fill={c} stroke="none" />
          </>);
    case 'account':
      return wrap(active
        ? <>
            <Circle cx="12" cy="12" r="9.5" />
            <Circle cx="12" cy="9.6" r="3.4" fill={T.navy2} />
            <Path d="M5.8 19.2a6.5 6.5 0 0112.4 0z" fill={T.navy2} />
          </>
        : <>
            <Circle cx="12" cy="12" r="9" />
            <Circle cx="12" cy="9.6" r="3.1" />
            <Path d="M6.4 18.5a6 6 0 0111.2 0" />
          </>);
    default:
      return wrap(<Circle cx="12" cy="12" r="8" />);
  }
}
