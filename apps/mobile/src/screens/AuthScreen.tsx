import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, useWindowDimensions, StatusBar, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { supabase, isSupabaseConfigured } from '@/services/supabase';
import { useAppStore } from '@/store';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';
import { signInWithApple, signInWithGoogle } from '@/services/authProviders';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { PrimaryButton } from '@/features/onboarding/components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

export default function AuthScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'apple' | 'google' | null>(null);
  const { setUser, setOnboardingCompleted } = useAppStore();
  const { height } = useWindowDimensions();
  const isCompact = height < 720;

  const completeAuthBypass = (fallbackEmail?: string) => {
    const resolvedEmail = (fallbackEmail && fallbackEmail.trim()) || 'tester@unscroller.dev';
    setUser({
      id: 'dev-user',
      email: resolvedEmail,
    });
    setOnboardingCompleted(true);
    navigation.replace('Home');
  };

  const handleMagicLink = async () => {
    const sanitizedEmail = email.trim().toLowerCase();

    console.log('[AuthScreen] Magic link submission started', {
      rawEmailLength: email.length,
      sanitizedEmail,
      timestamp: new Date().toISOString(),
    });

    if (!sanitizedEmail) {
      console.warn('[AuthScreen] Magic link blocked: empty email input');
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    if (!isSupabaseConfigured()) {
      console.warn('[AuthScreen] Supabase not configured; bypassing magic link for testing');
      completeAuthBypass(sanitizedEmail);
      return;
    }

    setLoading(true);
    try {
      const client = supabase;
      if (!client) {
        console.error('[AuthScreen] Magic link blocked: Supabase client missing');
        throw new Error('Supabase not available');
      }

      console.log('[AuthScreen] Calling signInWithOtp', { sanitizedEmail });

      const { data, error } = await client.auth.signInWithOtp({ email: sanitizedEmail });

      if (data) {
        console.log('[AuthScreen] signInWithOtp response payload', {
          hasUser: Boolean((data as { user?: unknown }).user),
          hasSession: Boolean((data as { session?: unknown }).session),
          timestamp: new Date().toISOString(),
          raw: data,
        });
      }
      
      if (error) throw error;
      
      console.log('[AuthScreen] Magic link sent successfully', { sanitizedEmail });
      Alert.alert(
        'Check your email',
        'We sent you a magic link to sign in. Check your inbox and click the link.',
        [{ text: 'OK' }]
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Something went wrong sending the link.';
      console.error('[AuthScreen] Magic link failed', { sanitizedEmail: email.trim(), error });
      Alert.alert('Error', message);
    } finally {
      console.log('[AuthScreen] Magic link submission finished');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (socialLoading) {
      return;
    }

    try {
      setSocialLoading('google');
      if (!isSupabaseConfigured()) {
        console.warn('[AuthScreen] Supabase not configured; bypassing Google sign-in for testing');
        completeAuthBypass('google@unscroller.dev');
        return;
      }
      const user = await signInWithGoogle();
      if (user) {
        setUser({
          id: user.id,
          email: user.email || '',
        });
        navigation.replace('Home');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in with Google right now.';
      Alert.alert('Sign in failed', message);
    } finally {
      setSocialLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    if (socialLoading) {
      return;
    }

    try {
      setSocialLoading('apple');
      if (!isSupabaseConfigured()) {
        console.warn('[AuthScreen] Supabase not configured; bypassing Apple sign-in for testing');
        completeAuthBypass('apple@unscroller.dev');
        return;
      }
      const user = await signInWithApple();
      if (user) {
        setUser({
          id: user.id,
          email: user.email || '',
        });
        navigation.replace('Home');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in with Apple right now.';
      Alert.alert('Sign in failed', message);
    } finally {
      setSocialLoading(null);
    }
  };

  // Listen for auth state changes
  React.useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    const client = supabase;
    if (!client) {
      return;
    }

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <ScreenWrapper contentStyle={[styles.safeArea, isCompact && styles.safeAreaCompact]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, isCompact && styles.scrollContentCompact]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.formBlock}>
          <Text style={styles.heroTitle}>Let’s sync your progress</Text>
          <Text style={styles.heroSubtitle}>Sign in to save your stats, your plan, and your recovery journey.</Text>
          <Text style={styles.title}>Sign In</Text>
          <Text style={styles.subtitle}>Enter your email to get started</Text>

          <View style={styles.formCard}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={COLORS.TEXT_SECONDARY}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <PrimaryButton
              title={loading ? 'Sending…' : 'Send Magic Link'}
              onPress={handleMagicLink}
              disabled={loading}
              style={styles.primaryButton}
            />
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialStack}>
            <TouchableOpacity
              style={[styles.socialButton, socialLoading === 'apple' && styles.socialButtonDisabled]}
              onPress={handleAppleSignIn}
              disabled={socialLoading === 'apple'}
              activeOpacity={0.85}
            >
              <Text style={styles.socialButtonText}>
                {socialLoading === 'apple' ? 'Signing in…' : ' Continue with Apple'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, styles.socialButtonGoogle, socialLoading === 'google' && styles.socialButtonDisabled]}
              onPress={handleGoogleSignIn}
              disabled={socialLoading === 'google'}
              activeOpacity={0.85}
            >
              <Text style={[styles.socialButtonText, styles.socialButtonTextGoogle]}>
                {socialLoading === 'google' ? 'Signing in…' : 'G Continue with Google'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.disclaimer}>Independent browser. We never post on your behalf.</Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: SPACING.space_5,
    paddingTop: SPACING.space_6,
    paddingBottom: SPACING.space_5,
  },
  safeAreaCompact: {
    paddingTop: SPACING.space_4,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: SPACING.space_5,
  },
  scrollContentCompact: {
    justifyContent: 'flex-start',
    paddingBottom: SPACING.space_4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  backIcon: {
    fontSize: 18,
    color: COLORS.TEXT_PRIMARY,
  },
  headerSpacer: {
    width: 40,
  },
  formBlock: {
    gap: SPACING.space_4,
  },
  formCard: {
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: 18,
    padding: SPACING.space_4,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    gap: SPACING.space_3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  title: {
    ...TYPOGRAPHY.H2,
    color: COLORS.TEXT_PRIMARY,
  },
  subtitle: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
  },
  heroTitle: {
    ...TYPOGRAPHY.H1,
    color: COLORS.TEXT_PRIMARY,
  },
  heroSubtitle: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
  },
  input: {
    backgroundColor: '#FFFFFF',
    color: COLORS.TEXT_PRIMARY,
    paddingVertical: SPACING.space_3,
    paddingHorizontal: SPACING.space_3,
    borderRadius: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
  },
  primaryButton: {
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.GLASS_BORDER,
  },
  dividerLabel: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  socialStack: {
    gap: SPACING.space_3,
  },
  socialButton: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingVertical: SPACING.space_3,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  socialButtonDisabled: {
    opacity: 0.6,
  },
  socialButtonGoogle: {
    borderColor: 'rgba(77, 161, 255, 0.35)',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  socialButtonTextGoogle: {
    color: COLORS.ACCENT_GRADIENT_START,
  },
  disclaimer: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
});
