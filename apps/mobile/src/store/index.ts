import { create } from 'zustand';
import { User, Subscription } from '@/types';

interface AppState {
  user: User | null;
  subscription: Subscription | null;
  isAuthenticated: boolean;
  hasActiveSubscription: boolean;
  
  setUser: (user: User | null) => void;
  setSubscription: (subscription: Subscription | null) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>(set => ({
  user: null,
  subscription: null,
  isAuthenticated: false,
  hasActiveSubscription: false,

  setUser: user =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setSubscription: subscription =>
    set({
      subscription,
      hasActiveSubscription: subscription?.status === 'active' || subscription?.status === 'trial',
    }),

  logout: () =>
    set({
      user: null,
      subscription: null,
      isAuthenticated: false,
      hasActiveSubscription: false,
    }),
}));
