import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { sha256 } from '@noble/hashes/sha256';
import { supabase } from './supabase';
import { signInWithGoogle as signInWithGoogleNative } from './googleAuth';

const NONCE_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._';

const toHex = (buffer: Uint8Array) =>
  Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

const generateRandomNonce = (length = 32) => {
  let result = '';
  for (let i = 0; i < length; i += 1) {
    const randomIndex = Math.floor(Math.random() * NONCE_CHARSET.length);
    result += NONCE_CHARSET[randomIndex];
  }
  return result;
};

export async function signInWithGoogle(): Promise<{ id: string; email: string; fullName?: string } | null> {
  if (!supabase) {
    throw new Error('Authentication is not available in this build.');
  }

  const result = await signInWithGoogleNative();

  if (!result) {
    return null;
  }

  const { idToken, user } = result;

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });

  if (error) {
    throw new Error(error.message);
  }

  const resolvedEmail = data.user?.email ?? user.email;
  const resolvedFullName =
    (data.user?.user_metadata?.full_name ?? user.name ?? [user.given_name, user.family_name].filter(Boolean).join(' ').trim()) || undefined;

  if (data.user) {
    return {
      id: data.user.id,
      email: resolvedEmail,
      fullName: resolvedFullName,
    };
  }

  return {
    id: user.id,
    email: resolvedEmail,
    fullName: resolvedFullName,
  };
}

const isAppleSignInSupported = async () => Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync());

const performAppleRequest = async (rawNonce: string) => {
  const hashedNonce = toHex(sha256(rawNonce));
  return AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
    ],
    nonce: hashedNonce,
  });
};

export async function signInWithApple() {
  if (!supabase) {
    throw new Error('Authentication is not available in this build.');
  }

  if (!(await isAppleSignInSupported())) {
    throw new Error('Sign in with Apple is only available on supported iOS devices.');
  }

  const rawNonce = generateRandomNonce();
  const response = await performAppleRequest(rawNonce);

  const { identityToken, email, fullName, user } = response;

  if (!identityToken) {
    throw new Error('Apple Sign-In failed. Please try again.');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: identityToken,
    nonce: rawNonce,
  });

  if (error) {
    throw new Error(error.message);
  }

  const resolvedUser = data.user ?? null;

  if (resolvedUser) {
    return {
      ...resolvedUser,
      email: resolvedUser.email ?? email ?? undefined,
      user_metadata: {
        ...resolvedUser.user_metadata,
        full_name: `${fullName?.givenName ?? ''} ${fullName?.familyName ?? ''}`.trim() || undefined,
        apple_user: user,
      },
    };
  }

  return null;
}
