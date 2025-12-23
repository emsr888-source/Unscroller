import React from 'react';
import { View, Text, StyleSheet, StatusBar, useWindowDimensions, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../core/theme/colors';
import { TYPOGRAPHY } from '../core/theme/typography';
import { SPACING } from '../core/theme/spacing';
import { BRANDING } from '../assets/branding';
import { PrimaryButton } from '../features/onboarding/components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  const { height } = useWindowDimensions();
  const isCompact = height < 720;

  return (
    <LinearGradient colors={['rgba(238,237,230,0.94)', 'rgba(238,237,230,0.86)']} style={styles.container}>
      <ImageBackground
        source={BRANDING.background}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
        imageStyle={styles.backgroundImage}
        blurRadius={2}
        accessibilityIgnoresInvertColors
      />
      <StatusBar barStyle="dark-content" translucent={false} backgroundColor={COLORS.BACKGROUND_MAIN} />
      <SafeAreaView style={[styles.safeArea, isCompact && styles.safeAreaCompact]} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.logoRow}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoInitial}>U</Text>
          </View>
          <View>
            <Text style={styles.title}>Unscroller</Text>
            <Text style={styles.subtitle}>Distraction-Free Social Browser</Text>
          </View>
        </View>
        <Text style={styles.description}>
          Post, DM, and manage your social profiles—{'\n'}
          without feeds, Reels, Shorts, or Spotlight.
        </Text>

        <View style={styles.providers}>
          <Text style={styles.providersText}>
            Instagram • X • YouTube • TikTok{'\n'}
            Facebook • Snapchat
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton title="Get Started" onPress={() => navigation.navigate('Auth')} style={styles.primaryButton} />

        <Text style={styles.disclaimer}>
          Independent browser. Not affiliated with any social platform.
        </Text>
      </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 0.9,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: SPACING.space_5,
    paddingTop: SPACING.space_6,
    paddingBottom: SPACING.space_6,
  },
  safeAreaCompact: {
    paddingTop: SPACING.space_4,
    paddingBottom: SPACING.space_4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: SPACING.space_5,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_3,
  },
  logoCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(77, 161, 255, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(77, 161, 255, 0.28)',
  },
  logoInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  title: {
    ...TYPOGRAPHY.H1,
    color: COLORS.TEXT_PRIMARY,
    textTransform: 'none',
  },
  subtitle: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.space_1,
  },
  description: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.space_5,
  },
  providers: {
    padding: SPACING.space_4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  providersText: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    gap: SPACING.space_3,
  },
  primaryButton: {
    width: '100%',
  },
  disclaimer: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 18,
  },
});
