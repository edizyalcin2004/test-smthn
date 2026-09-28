// CompareScreen — stack wrapper (Search → Menu → Basket → Results) plus
// Compare-level state. Basket + ranked results live here so they survive
// navigating Menu → Basket → Results → back. Switching restaurant resets
// the basket.
import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { track } from '../lib/telemetry';
import SearchScreen  from './compare/SearchScreen';
import MenuScreen    from './compare/MenuScreen';
import BasketScreen  from './compare/BasketScreen';
import ResultsScreen from './compare/ResultsScreen';

const Stack = createNativeStackNavigator();

const CompareContext = createContext(null);
export const useCompare = () => useContext(CompareContext);

export default function CompareScreen() {
  const [restaurant, setRestaurantState] = useState(null);
  const [basket, setBasket]               = useState({}); // { [itemId]: { item, qty } }
  const [results, setResults]             = useState(null);
  const [compareId, setCompareId]         = useState(null);
  const restaurantRef                     = useRef(null);

  // Setting a different restaurant clears the basket + stale results.
  const setRestaurant = useCallback((r) => {
    if (restaurantRef.current?.id !== r?.id) {
      setBasket({});
      setResults(null);
    }
    restaurantRef.current = r;
    setRestaurantState(r);
  }, []);

  const setQty = useCallback((item, qty) => {
    setBasket((prev) => {
      const before = prev[item.id]?.qty ?? 0;
      if (qty !== before && restaurantRef.current?.id) {
        track({ event_name: 'basket_edit', restaurant_id: restaurantRef.current.id,
                menu_item_id: item.id, delta: qty > before ? 1 : -1 });
      }
      const next = { ...prev };
      if (qty <= 0) delete next[item.id];
      else next[item.id] = { item, qty };
      return next;
    });
  }, []);

  const clearBasket = useCallback(() => { setBasket({}); setResults(null); }, []);

  return (
    <CompareContext.Provider value={{ restaurant, setRestaurant, basket, setQty, clearBasket, results, setResults, compareId, setCompareId }}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="Search"  component={SearchScreen} />
        <Stack.Screen name="Menu"    component={MenuScreen} />
        <Stack.Screen name="Basket"  component={BasketScreen} />
        <Stack.Screen name="Results" component={ResultsScreen} />
      </Stack.Navigator>
    </CompareContext.Provider>
  );
}
