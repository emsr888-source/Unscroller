import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Image, useWindowDimensions, Alert, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useAppStore } from '@/store';
import { signInWithApple, signInWithGoogle } from '@/services/authProviders';
import { useOnboardingAssessment } from '@/store/onboardingAssessment';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import FocusAwareStatusBar from '@/components/FocusAwareStatusBar';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorCard from '@/components/watercolor/WatercolorCard';
import WatercolorButton from '@/components/watercolor/WatercolorButton';
import logoImage from '../../../../icon.png';

const appleLogo = {
  uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/120px-Apple_logo_black.svg.png',
};

const googleLogo = {
  uri: 'https://img.icons8.com/color/48/google-logo.png',
};

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingWelcome'>;

export default function OnboardingWelcomeScreen({ navigation }: Props) {
  const [isReady, setIsReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const { height } = useWindowDimensions();
  const isCompact = height < 720;
  const { setUser } = useAppStore();
  const { setFirstName } = useOnboardingAssessment();
  const [socialLoading, setSocialLoading] = useState<'apple' | 'google' | null>(null);

  const captureFirstName = useCallback(
    (fullName?: string | null, fallbackEmail?: string) => {
      const trimmed = fullName?.trim();
      if (trimmed) {
        setFirstName(trimmed.split(' ')[0]);
        return;
      }
      if (fallbackEmail) {
        const prefix = fallbackEmail.split('@')[0]?.trim();
        if (prefix) {
          setFirstName(prefix);
        }
      }
    },
    [setFirstName],
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setTimeout(() => setIsReady(true), 200);
      }
    });
  }, [fadeAnim, scaleAnim, slideAnim]);

  const handleAppleSignIn = async () => {
    if (socialLoading) {
      return;
    }

    try {
      setSocialLoading('apple');
      const user = await signInWithApple();

      if (user) {
        setUser({
          id: user.id,
          email: user.email || '',
          fullName: user.user_metadata?.full_name,
        });
        captureFirstName(user.user_metadata?.full_name, user.email ?? undefined);
        navigation.replace('OnboardingProfileCard');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in with Apple right now.';
      Alert.alert('Sign in failed', message);
    } finally {
      setSocialLoading(null);
    }
  };

  const handleGoogleSignIn = async () => {
    if (socialLoading) {
      return;
    }

    try {
      setSocialLoading('google');
      const user = await signInWithGoogle();
      if (user) {
        setUser({
          id: user.id,
          email: user.email || '',
          fullName: user.fullName,
        });
        captureFirstName(user.fullName, user.email ?? undefined);
        navigation.replace('OnboardingProfileCard');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in with Google right now.';
      Alert.alert('Sign in failed', message);
    } finally {
      setSocialLoading(null);
    }
  };

  const handleSkip = () => {
    navigation.navigate('OnboardingName');
  };

  return (
    <View style={styles.root}>
      <FocusAwareStatusBar animated={true} barStyle="dark-content" backgroundColor="#fdfbf7" hidden={false} />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

        {/* Back button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
          disabled={!isReady}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          {/* Logo */}
          <Animated.Image
            source={logoImage}
            resizeMode="contain"
            style={[
              styles.logoImage,
              isCompact && styles.logoImageCompact,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          />

          {/* Content Card */}
          <Animated.View
            style={[
              styles.cardWrapper,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <WatercolorCard 
              style={[styles.card, isCompact && styles.cardCompact]} 
              backgroundColor="#fffef9"
              padding={isCompact ? SPACING.space_4 : SPACING.space_5}
            >
              <View style={styles.textBlock}>
                <Text style={styles.title}>
                  Stop Scrolling,{'\n'}
                  Start Building
                </Text>
                <Text style={styles.subtitle}>
                  Break free from endless feeds and reclaim your time.
                  Turn mindless scrolling into focused creating.
                </Text>
              </View>

              <View style={styles.buttonsContainer}>
                {/* Sign in buttons */}
                <TouchableOpacity 
                  style={[styles.button, (!isReady || socialLoading === 'apple') && styles.buttonDisabled]}
                  onPress={handleAppleSignIn}
                  disabled={!isReady || socialLoading === 'apple'}
                  activeOpacity={0.85}
                >
                  <View style={styles.buttonSurface}>
                    <Image source={appleLogo} style={styles.appleIcon} />
                    <Text style={styles.buttonText}>
                      {socialLoading === 'apple' ? 'Signing in…' : 'Continue with Apple'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.button, (!isReady || socialLoading === 'google') && styles.buttonDisabled]}
                  onPress={handleGoogleSignIn}
                  disabled={!isReady || socialLoading === 'google'}
                  activeOpacity={0.85}
                >
                  <View style={styles.buttonSurface}>
                    <Image source={googleLogo} style={styles.googleIcon} />
                    <Text style={styles.buttonText}>
                      {socialLoading === 'google' ? 'Signing in…' : 'Continue with Google'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <WatercolorButton
                  color="yellow"
                  onPress={isReady ? handleSkip : undefined}
                  style={[styles.skipButton, !isReady && styles.buttonDisabled]}
                >
                  <Text style={styles.skipButtonText}>Skip for now</Text>
                </WatercolorButton>
              </View>

              <View style={styles.bottomSection}>
                <Text style={styles.trustText}>Join thousands breaking the scroll cycle.</Text>
              </View>
            </WatercolorCard>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fdfbf7',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#fdfbf7',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.space_4,
    paddingTop: SPACING.space_4,
    justifyContent: 'flex-start',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.2,
    borderColor: '#1f2937',
    marginBottom: SPACING.space_3,
  },
  backButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    color: '#1f2937',
  },
  logoImage: {
    width: 240,
    height: 240,
    alignSelf: 'center',
    marginBottom: SPACING.space_6,
  },
  logoImageCompact: {
    width: 180,
    height: 180,
    marginBottom: SPACING.space_5,
  },
  cardWrapper: {
    width: '100%',
    flex: 1,
  },
  card: {
    gap: SPACING.space_4,
  },
  cardCompact: {
    gap: SPACING.space_3,
  },
  textBlock: {
    gap: SPACING.space_2,
  },
  title: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 32,
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: SPACING.space_2,
    lineHeight: 40,
  },
  subtitle: {
    ...TYPOGRAPHY.Body,
    fontSize: 18,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 26,
  },
  button: {
    height: 56,
    borderRadius: 24,
    marginBottom: SPACING.space_3,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonSurface: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.space_2,
  },
  buttonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  appleIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  googleIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  buttonsContainer: {
    width: '100%',
  },
  skipButton: {
    marginTop: SPACING.space_2,
  },
  skipButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  trustText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
  },
  bottomSection: {
    marginTop: SPACING.space_3,
    alignItems: 'center',
  },
});
