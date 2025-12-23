import { create } from 'zustand';
import { createSafeStorage } from '../lib/safeStorage';
import { User, Subscription } from '@/types';

interface AppState {
  user: User | null;
  subscription: Subscription | null;
  isAuthenticated: boolean;
  hasActiveSubscription: boolean;
  hasCompletedOnboarding: boolean;
  policyBypassEnabled: boolean;
  lastScrollTimestamp: string | null;
  tenantId: string;
  profileGoal: string;

  setUser: (user: User | null) => void;
  setSubscription: (subscription: Subscription | null) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  logout: () => void;
  setPolicyBypassEnabled: (enabled: boolean) => void;
  setLastScrollTimestamp: (timestamp: string | null) => void;
  setTenantId: (tenantId: string) => void;
  setProfileGoal: (goal: string) => void;
}

const blockerOverrideStorage = createSafeStorage('policy-override');

const setStorageValue = (key: string, value: string) => {
  blockerOverrideStorage.set(key, value);
};

const getStorageValue = (key: string) => blockerOverrideStorage.getString(key);

const getStoredPolicyBypass = () => {
  try {
    const value = getStorageValue('policyBypassEnabled');
    return value === 'true';
  } catch (error) {
    console.warn('[Store] Failed to read policy bypass flag:', error);
    return false;
  }
};

export const useAppStore = create<AppState>(set => ({
  user: null,
  subscription: null,
  isAuthenticated: false,
  hasActiveSubscription: false,
  hasCompletedOnboarding: false,
  policyBypassEnabled: getStoredPolicyBypass(),
  lastScrollTimestamp: null,
  tenantId: 'default',
  profileGoal: '',

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

  setOnboardingCompleted: completed =>
    set({
      hasCompletedOnboarding: completed,
    }),

  logout: () =>
    set({
      user: null,
      subscription: null,
      isAuthenticated: false,
      hasActiveSubscription: false,
      hasCompletedOnboarding: false,
      policyBypassEnabled: false,
    }),

  setPolicyBypassEnabled: enabled => {
    try {
      setStorageValue('policyBypassEnabled', enabled ? 'true' : 'false');
    } catch (error) {
      console.warn('[Store] Failed to persist policy bypass flag:', error);
    }

    set({ policyBypassEnabled: enabled });
  },

  setLastScrollTimestamp: timestamp => {
    set({ lastScrollTimestamp: timestamp });
  },

  setTenantId: tenantId => {
    set({ tenantId });
  },

  setProfileGoal: goal => {
    set({ profileGoal: goal });
  },
}));
