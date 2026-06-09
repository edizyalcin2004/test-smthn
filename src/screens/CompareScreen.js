import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SearchScreen from './compare/SearchScreen';
import MenuScreen   from './compare/MenuScreen';

const Stack = createNativeStackNavigator();

export default function CompareScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Menu"   component={MenuScreen} />
    </Stack.Navigator>
  );
}
