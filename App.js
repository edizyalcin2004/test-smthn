import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HubScreen     from './src/screens/HubScreen';
import CompareScreen from './src/screens/CompareScreen';
import BudgetScreen  from './src/screens/BudgetScreen';
import DealsScreen   from './src/screens/DealsScreen';
import AccountScreen from './src/screens/AccountScreen';
import ProScreen     from './src/screens/ProScreen';
import TabBar        from './src/navigation/TabBar';
import { CodeSheetProvider } from './src/components/CodeSheet';

SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();
const AccountStack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

// Account tab hosts a stack so Pryce Pro can be pushed from Account.
function AccountStackScreen() {
  return (
    <AccountStack.Navigator screenOptions={{ headerShown: false }}>
      <AccountStack.Screen name="AccountHome" component={AccountScreen} />
      <AccountStack.Screen name="Pro" component={ProScreen} />
    </AccountStack.Navigator>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_800ExtraBold,
    Inter_400Regular,
    Inter_600SemiBold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <CodeSheetProvider navigationRef={navigationRef}>
          <Tab.Navigator
            initialRouteName="Hub"
            tabBar={(props) => <TabBar {...props} />}
            screenOptions={{ headerShown: false }}
          >
            {/* Hub sits at the CENTRE (position 3 of 5). initialRouteName keeps
                the app landing on Hub regardless of its position in this list. */}
            <Tab.Screen name="Compare" component={CompareScreen} />
            <Tab.Screen name="Budget"  component={BudgetScreen} />
            <Tab.Screen name="Hub"     component={HubScreen} />
            <Tab.Screen name="Deals"   component={DealsScreen} />
            <Tab.Screen name="Account" component={AccountStackScreen} />
          </Tab.Navigator>
        </CodeSheetProvider>
      </NavigationContainer>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
