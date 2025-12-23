export type ProviderId = 'instagram' | 'x' | 'youtube' | 'tiktok' | 'facebook';

export interface Provider {
  id: ProviderId;
  name: string;
  icon: string;
  color: string;
}

export interface User {
  id: string;
  email: string;
  fullName?: string | null;
  subscription?: Subscription;
}

export interface Subscription {
  status: 'active' | 'expired' | 'trial';
  platform: 'ios' | 'android' | 'stripe';
  expiresAt: string;
}

export interface QuickAction {
  id: string;
  label: string;
  url: string;
  icon: string;
}
