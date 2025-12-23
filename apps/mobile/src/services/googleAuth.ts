import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Buffer } from 'buffer';
import { Platform } from 'react-native';
import { CONFIG } from '@/config/environment';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
};

const generateRandomString = (length = 32) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
};

interface GoogleIdTokenPayload {
  sub?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
}

export interface GoogleAuthResult {
  idToken: string;
  user: {
    id: string;
    email: string;
    name?: string;
    given_name?: string;
    family_name?: string;
  };
}

const decodeJwtPayload = (token: string): GoogleIdTokenPayload => {
  try {
    const [, payloadSegment] = token.split('.');
    if (!payloadSegment) {
      return {};
    }

    const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const decoded = (globalThis.atob
      ? globalThis.atob(padded)
      : Buffer.from(padded, 'base64').toString('utf-8')) as string;

    return JSON.parse(decoded);
  } catch (error) {
    console.warn('[GoogleSignIn] Failed to decode id token payload', error);
    return {};
  }
};

export const signOutGoogle = async () => {
  // With expo-auth-session the browser session is ephemeral; no explicit sign-out required.
  return Promise.resolve();
};

export const signInWithGoogle = async (): Promise<GoogleAuthResult | null> => {
  if (!CONFIG.GOOGLE_WEB_CLIENT_ID) {
    throw new Error('Google web client ID is not configured.');
  }

  const redirectUri = AuthSession.makeRedirectUri({
    useProxy: Platform.OS !== 'web',
  });

  const state = generateRandomString(16);
  const nonce = generateRandomString(32);

  const authUrl = `${GOOGLE_DISCOVERY.authorizationEndpoint}?${new URLSearchParams({
    client_id: CONFIG.GOOGLE_WEB_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'id_token',
    scope: 'openid profile email',
    prompt: 'select_account',
    nonce,
    state,
  }).toString()}`;

  const result = await AuthSession.startAsync({ authUrl, returnUrl: redirectUri });

  if (result.type === 'dismiss' || result.type === 'cancel') {
    return null;
  }

  if (result.type !== 'success' || !result.params?.id_token) {
    throw new Error('Google sign-in failed. Please try again.');
  }

  const idToken = String(result.params.id_token);
  const payload = decodeJwtPayload(idToken);

  return {
    idToken,
    user: {
      id: payload.sub ?? '',
      email: payload.email ?? '',
      name: payload.name,
      given_name: payload.given_name,
      family_name: payload.family_name,
    },
  };
};
