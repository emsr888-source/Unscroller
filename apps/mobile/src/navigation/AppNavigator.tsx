import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppStore } from '@/store';

// Screens
import WelcomeScreen from '@/screens/WelcomeScreen';
import AuthScreen from '@/screens/AuthScreen';
import PaywallScreen from '@/screens/PaywallScreen';
import HomeScreen from '@/screens/HomeScreen';
import ProviderWebViewScreen from '@/screens/ProviderWebViewScreen';
import SettingsScreen from '@/screens/SettingsScreen';

export type RootStackParamList = {
  Welcome: undefined;
  Auth: undefined;
  Paywall: undefined;
  Home: undefined;
  ProviderWebView: { providerId: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isAuthenticated, hasActiveSubscription } = useAppStore();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        ) : !hasActiveSubscription ? (
          <Stack.Screen name="Paywall" component={PaywallScreen} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="ProviderWebView" component={ProviderWebViewScreen} />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                headerShown: true,
                title: 'Settings',
                presentation: 'modal',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
