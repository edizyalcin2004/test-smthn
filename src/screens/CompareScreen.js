// CompareScreen — stack wrapper (Search → Menu → Results) plus Compare-level
// state. Basket + ranked results live here so they survive navigating
// Menu → Results → back. Switching restaurant resets the basket.
import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SearchScreen  from './compare/SearchScreen';
import MenuScreen    from './compare/MenuScreen';
import ResultsScreen from './compare/ResultsScreen';

const Stack = createNativeStackNavigator();

const CompareContext = createContext(null);
export const useCompare = () => useContext(CompareContext);

export default function CompareScreen() {
  const [restaurant, setRestaurantState] = useState(null);
  const [basket, setBasket]               = useState({}); // { [itemId]: { item, qty } }
  const [results, setResults]             = useState(null);
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
      const next = { ...prev };
      if (qty <= 0) delete next[item.id];
      else next[item.id] = { item, qty };
      return next;
    });
  }, []);

  const clearBasket = useCallback(() => { setBasket({}); setResults(null); }, []);

  return (
    <CompareContext.Provider value={{ restaurant, setRestaurant, basket, setQty, clearBasket, results, setResults }}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="Search"  component={SearchScreen} />
        <Stack.Screen name="Menu"    component={MenuScreen} />
        <Stack.Screen name="Results" component={ResultsScreen} />
      </Stack.Navigator>
    </CompareContext.Provider>
  );
}
