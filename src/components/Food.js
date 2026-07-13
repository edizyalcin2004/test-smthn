// Food.js — colorful food/illustration icons. SVG files in assets/icons are
// imported as components via react-native-svg-transformer (see metro.config.js).
import BurgerMenu from '../../assets/icons/burger-menu.svg';
import Burger from '../../assets/icons/burger.svg';
import Cake from '../../assets/icons/cake.svg';
import Chicken from '../../assets/icons/chicken.svg';
import ChickenMenu from '../../assets/icons/chicken-menu.svg';
import Coffee from '../../assets/icons/coffee.svg';
import Cookie from '../../assets/icons/cookie.svg';
import DeliveryBag from '../../assets/icons/delivery-bag.svg';
import DiscountTag from '../../assets/icons/discount-tag.svg';
import Donut from '../../assets/icons/donut.svg';
import Drink from '../../assets/icons/drink.svg';
import Fish from '../../assets/icons/fish.svg';
import Fries from '../../assets/icons/fries.svg';
import HotSauce from '../../assets/icons/hot-sauce.svg';
import IceCream from '../../assets/icons/ice-cream.svg';
import Pizza from '../../assets/icons/pizza.svg';
import PizzaMenu from '../../assets/icons/pizza-menu.svg';
import Receipt from '../../assets/icons/receipt.svg';
import Salad from '../../assets/icons/salad.svg';
import Sandwich from '../../assets/icons/sandwich.svg';
import Soup from '../../assets/icons/soup.svg';
import Sushi from '../../assets/icons/sushi.svg';
import Taco from '../../assets/icons/taco.svg';
import Wrap from '../../assets/icons/wrap.svg';
import WrapMenu from '../../assets/icons/wrap-menu.svg';

const MAP = {
  'burger-menu': BurgerMenu,
  burger: Burger,
  cake: Cake,
  chicken: Chicken,
  'chicken-menu': ChickenMenu,
  coffee: Coffee,
  cookie: Cookie,
  'delivery-bag': DeliveryBag,
  'discount-tag': DiscountTag,
  donut: Donut,
  drink: Drink,
  fish: Fish,
  fries: Fries,
  'hot-sauce': HotSauce,
  'ice-cream': IceCream,
  pizza: Pizza,
  'pizza-menu': PizzaMenu,
  receipt: Receipt,
  salad: Salad,
  sandwich: Sandwich,
  soup: Soup,
  sushi: Sushi,
  taco: Taco,
  wrap: Wrap,
  'wrap-menu': WrapMenu,
};

export default function Food({ name, s = 40, style }) {
  const Cmp = MAP[name];
  if (!Cmp) return null;
  return <Cmp width={s} height={s} style={style} />;
}
