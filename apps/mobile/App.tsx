import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import AppNavigator from './src/navigation/AppNavigator';
import { PolicyService } from './src/services/policy';
import { useBlockingStore } from './src/features/blocking/blockingStore';
import { isExpoGo } from './src/utils/isExpoGo';
import { patchExpoGoStatusBar } from './src/utils/patchExpoGoStatusBar';

const queryClient = new QueryClient();

export default function App() {
  const authorizeBlocking = useBlockingStore(state => state.authorize);
  const [fontsLoaded] = useFonts({
    'PatrickHand-Regular': require('./assets/fonts/PatrickHand-Regular.ttf'),
    'AmaticSC-Regular': require('./assets/fonts/AmaticSC-Regular.ttf'),
  });

  // Prevent Expo Go from crashing when screens try to set status bar style.
  patchExpoGoStatusBar();

  useEffect(() => {
    // Initialize on mount
    init();
  }, []);

  const init = async () => {
    try {
      // Fetch latest policy
      await PolicyService.fetchPolicy();
      await authorizeBlocking();
    } catch (error) {
      console.error('Failed to initialize:', error);
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        {!isExpoGo && (
          <StatusBar 
            animated={true}
            barStyle="dark-content" 
            backgroundColor="#fdfbf7"
            hidden={false}
          />
        )}
        <AppNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
