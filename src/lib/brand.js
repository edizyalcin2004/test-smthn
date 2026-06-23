// brand.js — derive Brand-tile props from LIVE backend data only.
// Platform tiles use the real platform identity colour (backend hex_color);
// restaurant tiles use a neutral navy tile (backend gives no colour). No fake
// brand/restaurant data lives here — short labels are derived from names.
import { T } from '../theme/tokens';

// Short tile label. Known platforms/restaurants get a recognisable acronym;
// anything else falls back to initials so nothing breaks if data expands.
export function shortLabel(name = '') {
  const n = String(name).toLowerCase();
  if (n.includes('yemeksepeti')) return 'YS';
  if (n.includes('trendyol'))    return 'TY';
  if (n.includes('getir'))       return 'GY';
  if (n.includes('mcdonald'))    return 'McD';
  if (n.includes('burger king')) return 'BK';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

// Pick black/white text for legibility on an arbitrary brand colour.
function readableFg(hex) {
  if (typeof hex !== 'string' || hex[0] !== '#' || hex.length < 7) return '#fff';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? T.ink : '#fff';
}

// platform: { name, hex_color } from /compare-basket or /discount-codes.
export function platformBrand(platform) {
  if (!platform) return { bg: T.navy, fg: '#fff', short: '?' };
  const bg = platform.hex_color || T.navy;
  return { bg, fg: readableFg(bg), short: shortLabel(platform.name) };
}

// restaurant: { name } from /restaurants or /search.
export function restaurantBrand(restaurant) {
  if (!restaurant) return { bg: T.navy, fg: '#fff', short: '?' };
  return { bg: T.navy, fg: '#fff', short: shortLabel(restaurant.name) };
}

// Per-restaurant tile style: a brand-evoking colour + a food glyph from the
// swapped icon set. NOT a logo (logos are an IP risk) — just a coloured icon
// tile. Only the two REAL in-scope restaurants have entries; anything else
// gets a neutral navy fallback so nothing breaks if data expands.
// Colours are brand-evoking defaults — Ediz can swap to palette tokens.
const RESTAURANT_TILES = [
  { match: 'mcdonald',    bg: '#DA291C',  food: 'burger' },  // McDonald's red
  { match: 'burger king', bg: '#1B2A4A',  food: 'burger' },  // BK navy
  { match: 'cajun',       bg: T.cajun,    food: 'chicken' }, // Cajun Corner — chicken glyph (NOT a logo), warm-orange token
];
export function restaurantTile(restaurant) {
  const n = String(restaurant?.name || '').toLowerCase();
  const hit = RESTAURANT_TILES.find((t) => n.includes(t.match));
  if (hit) return { bg: hit.bg, food: hit.food };
  return { bg: T.navy, food: 'delivery-bag' };
}
