// motion.js — the Doybi redesign's motion (PR 5/5), built on React Native's
// own Animated API (no new dependency). Three rules from the design:
//   1. every animation ends (no loops),
//   2. prices and comparison rows never move after they settle,
//   3. "Reduce motion" in the phone's accessibility settings turns it all off.
import { useEffect, useRef, useState } from 'react';
import { Animated, AccessibilityInfo, Easing, Pressable } from 'react-native';

const EASE = Easing.bezier(0.3, 0.1, 0.25, 1);

// true when the user asked the OS for less motion (re-reads on change)
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then((v) => { if (alive) setReduced(!!v); }).catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v) => setReduced(!!v));
    return () => { alive = false; sub?.remove?.(); };
  }, []);
  return reduced;
}

// Pressable that dips to 97.5% while held (design: `:active { scale(.975) }`).
export function PressScale({ style, children, disabled, onPressIn, onPressOut, ...rest }) {
  const scale = useRef(new Animated.Value(1)).current;
  const reduced = useReducedMotion();
  const to = (v) => { if (!reduced) Animated.timing(scale, { toValue: v, duration: 120, easing: EASE, useNativeDriver: true }).start(); };
  return (
    <Pressable
      disabled={disabled}
      onPressIn={(e) => { to(0.975); onPressIn?.(e); }}
      onPressOut={(e) => { to(1); onPressOut?.(e); }}
      {...rest}
    >
      {(state) => (
        <Animated.View style={[typeof style === 'function' ? style(state) : style, { transform: [{ scale }] }]}>
          {typeof children === 'function' ? children(state) : children}
        </Animated.View>
      )}
    </Pressable>
  );
}

// Fade + 8px rise when a block first appears; `index` staggers lists (capped
// so a long list never makes the user wait).
export function Reveal({ index = 0, style, children }) {
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) { v.setValue(1); return; }
    Animated.timing(v, { toValue: 1, duration: 320, delay: Math.min(index, 6) * 45, easing: EASE, useNativeDriver: true }).start();
  }, [reduced, index, v]);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

// One short mascot gesture per pose (design mascot-motion.js), played once.
const GESTURES = {
  'deal-search':     { ms: 900, x: [0, -5, 5, 0], y: [0, 0, 0, 0], r: [0, -5, 4, 0] },
  'empty-basket':    { ms: 650, x: [0, 0, 0, 0], y: [0, -5, 0, 0], r: [0, -4, 3, 0] },
  'no-results':      { ms: 650, x: [0, 0, 0, 0], y: [0, 0, 0, 0], r: [0, -4, 0, 0] },
  'discount-code':   { ms: 650, x: [0, 0, 0, 0], y: [0, 0, 0, 0], r: [0, 4, -3, 0] },
  'savings-success': { ms: 700, x: [0, 0, 0, 0], y: [0, -12, 0, 0], r: [0, -4, 2, 0] },
};

export function useGesture(pose, enabled = true) {
  const reduced = useReducedMotion();
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!enabled || reduced) return undefined;
    t.setValue(0);
    const a = Animated.timing(t, { toValue: 1, duration: (GESTURES[pose] || GESTURES['empty-basket']).ms, delay: 250, easing: EASE, useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [pose, enabled, reduced, t]);
  const g = GESTURES[pose] || GESTURES['empty-basket'];
  const at = (vals, unit = '') => t.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: unit ? vals.map((v) => `${v}${unit}`) : vals });
  return [{ translateX: at(g.x) }, { translateY: at(g.y) }, { rotate: at(g.r, 'deg') }];
}
