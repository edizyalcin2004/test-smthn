// Art.js — the Doybi design's two image families (redesign PR 1, 2026-10-25).
//
// Mascot: the five approved poses, each tied to a screen situation (design
// README "Mascot screen mapping"). Never in comparison/price rows.
// FoodArt: the original generic food illustration sheet (2x2: burger, pizza,
// chicken, wrap). It is NOT a photo of any restaurant's product, and no
// scraped food photography is used anywhere.
import { View, Image } from 'react-native';
import { T } from '../theme/tokens';

const POSES = {
  'no-results':      require('../../assets/mascot/no-results.png'),      // empty search / no offers
  'empty-basket':    require('../../assets/mascot/empty-basket.png'),    // empty basket / getting started
  'deal-search':     require('../../assets/mascot/deal-search.png'),     // discovery / comparison / loading
  'discount-code':   require('../../assets/mascot/discount-code.png'),   // codes
  'savings-success': require('../../assets/mascot/savings-success.png'), // savings summary / code applied
};
const RATIO = { 'no-results': 421 / 520, 'empty-basket': 455 / 520, 'deal-search': 478 / 520, 'discount-code': 464 / 520, 'savings-success': 472 / 520 };

export function Mascot({ pose = 'deal-search', size = 120, style }) {
  const src = POSES[pose] || POSES['deal-search'];
  return <Image source={src} style={[{ width: size * (RATIO[pose] || 0.9), height: size }, style]} resizeMode="contain" accessible={false} />;
}

const SHEET = require('../../assets/food-grid.jpg');
const CELL = { burger: [0, 0], pizza: [1, 0], chicken: [0, 1], wrap: [1, 1] };

// round (default) or rounded-square crop of one sheet cell
export function FoodArt({ type = 'burger', size = 60, round = true, radius = 16, style }) {
  const [cx, cy] = CELL[type] || CELL.burger;
  return (
    <View
      accessible
      accessibilityLabel="Temsili yemek görseli"
      style={[{ width: size, height: size, borderRadius: round ? size / 2 : radius, overflow: 'hidden', backgroundColor: T.cream }, style]}
    >
      <Image source={SHEET} style={{ width: size * 2, height: size * 2, marginLeft: -cx * size, marginTop: -cy * size }} />
    </View>
  );
}

// item/restaurant name -> sheet cell (same rule as the web app)
export function foodType(name = '', fallback = 'burger') {
  const n = name.toLocaleLowerCase('tr-TR');
  if (/pizza|pizzetta/.test(n)) return 'pizza';
  if (/tavuk|chicken|nugget|kanat|wings|crispy|tenders/.test(n)) return 'chicken';
  if (/dürüm|döner|wrap|köfte|iskender|lavaş/.test(n)) return 'wrap';
  if (/burger|whopper|mac|king/.test(n)) return 'burger';
  return fallback;
}
