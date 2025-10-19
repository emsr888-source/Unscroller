import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppNavigator from './src/navigation/AppNavigator';
import { PolicyService } from './src/services/policy';
import { SubscriptionService } from './src/services/subscription';
import { useAppStore } from './src/store';

const queryClient = new QueryClient();

export default function App() {
  const { user, setSubscription } = useAppStore();

  useEffect(() => {
    // Initialize on mount
    init();
  }, []);

  useEffect(() => {
    // Initialize subscription service when user is set
    if (user) {
      SubscriptionService.initialize(user.id);
      checkSubscription();
    }
  }, [user]);

  const init = async () => {
    try {
      // Fetch latest policy
      await PolicyService.fetchPolicy();
    } catch (error) {
      console.error('Failed to initialize:', error);
    }
  };

  const checkSubscription = async () => {
    try {
      const hasSubscription = await SubscriptionService.checkStatus();
      if (hasSubscription) {
        setSubscription({
          status: 'active',
          platform: 'ios',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    } catch (error) {
      console.error('Failed to check subscription:', error);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar barStyle="light-content" />
      <AppNavigator />
    </QueryClientProvider>
  );
}
