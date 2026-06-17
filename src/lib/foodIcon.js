// foodIcon.js — pick a decorative Food glyph for a menu item from its name /
// category. Purely cosmetic: it never affects price, availability, or any
// compare logic, so a wrong guess only changes a thumbnail. Neutral fallback.
const RULES = [
  [/(içecek|kola|cola|ayran|su\b|fanta|sprite|soda|şalgam|limonata)/, 'drink'],
  [/(kahve|coffee|latte|cappucc|americano|espresso|mocha)/,           'coffee'],
  [/(patates|fries|soğan halka|onion ring)/,                          'fries'],
  [/(tavuk|chicken|mccrispy|nugget|kanat|wing|tender|çıtır)/,         'chicken'],
  [/(balık|fish|filet-o-fish|filetofish)/,                            'fish'],
  [/(dondurma|mcflurry|sundae|ice ?cream|külah)/,                     'ice-cream'],
  [/(kurabiye|cookie|brownie)/,                                       'cookie'],
  [/(donut|donat)/,                                                   'donut'],
  [/(pasta|cake|kek|tatlı|sufle|muffin)/,                             'cake'],
  [/(salata|salad)/,                                                  'salad'],
  [/(wrap|dürüm|durum)/,                                              'wrap'],
  [/(sandviç|sandwich|toast)/,                                        'sandwich'],
  [/(çorba|soup)/,                                                    'soup'],
  [/(pizza)/,                                                         'pizza'],
  [/(sushi)/,                                                         'sushi'],
  [/(taco|burrito|quesadilla)/,                                       'taco'],
  [/(sos|sauce|ketçap|mayonez|dip)/,                                  'hot-sauce'],
  [/(menü|menu|combo)/,                                               'burger-menu'],
  [/(burger|big mac|whopper|king|köfte|hamburger|cheeseburger)/,      'burger'],
];

export function foodIconFor(name = '', category = '') {
  const hay = `${name} ${category}`.toLowerCase();
  for (const [re, icon] of RULES) if (re.test(hay)) return icon;
  return 'burger'; // neutral fallback for a burger-chain MVP
}
