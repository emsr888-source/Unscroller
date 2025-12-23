import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, useWindowDimensions, Linking, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';

export type DisclosuresScreenProps = NativeStackScreenProps<RootStackParamList, 'Disclosures'>;

const SUPPORT_EMAIL = 'support@unscroller.app';
const PRIVACY_URL = 'https://unscroller.app/privacy';
const DELETION_URL = 'https://unscroller.app/support/delete-account';
const TERMS_URL = 'https://unscroller.app/terms';

const sections = [
  {
    title: 'Filtering & Safe Browsing',
    body: [
      'Unscroller filters distracting feeds inside our own WebViews ONLY. We never modify Safari, Chrome, or other apps on your device.',
      'Allow / block rules are powered by an on-device policy (stored in "policy.json"). Updates ship over the air and can be refreshed from Settings → Policy.',
    ],
  },
  {
    title: 'Provider Controls',
    body: [
      'Launch Instagram, X, YouTube, TikTok, or Facebook via the Home quick actions. We start you on productive surfaces (DMs, subscriptions, creator tools).',
      'Use Settings → Screen Time Shields to block native social apps. You stay signed in, but the distracting feeds stay out of reach.',
    ],
  },
  {
    title: 'Billing & Subscriptions',
    body: [
      'Creator Mode is sold via in-app purchases processed by Apple App Store (iOS) or Google Play Billing (Android).',
      'Manage or restore an active plan from Settings → Account Management. Your subscription renews automatically until cancelled.',
    ],
  },
  {
    title: 'Data & Privacy',
    body: [
      'We collect authentication details, usage analytics, and optional journal / goal entries to power insights. Data lives in Supabase (encrypted at rest).',
      'Delete your account any time: Settings → Account Management → Delete Account. You can also request deletion on the web.',
    ],
  },
  {
    title: 'Help & Support',
    body: [
      `Email us at ${SUPPORT_EMAIL} for product or billing questions.`,
      'Report bugs, request refunds, or appeal moderation decisions through the in-app support form or community moderation queue.',
    ],
  },
];

export default function DisclosuresScreen({ navigation }: DisclosuresScreenProps) {
  const { height, width } = useWindowDimensions();
  const isCompact = height < 720;

  const stars = useMemo(
    () =>
      Array.from({ length: 40 }, (_, index) => ({
        id: `star-${index}`,
        left: Math.random() * Math.max(width, 1),
        top: Math.random() * Math.max(height, 1),
        opacity: Math.random() * 0.4 + 0.2,
      })),
    [height, width],
  );

  const renderedSections = useMemo(
    () =>
      sections.map(section => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.body.map(paragraph => (
            <Text key={paragraph} style={styles.sectionBody}>
              {paragraph}
            </Text>
          ))}
        </View>
      )),
    [],
  );

  return (
    <ScreenWrapper contentStyle={[styles.safeArea, isCompact && styles.safeAreaCompact]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />

      <View style={styles.stars}>
        {stars.map(star => (
          <View
            key={star.id}
            style={[
              styles.star,
              {
                left: star.left,
                top: star.top,
                opacity: star.opacity,
              },
            ]}
          />
        ))}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.9} hitSlop={10}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Disclosures & Support</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.introCard}>
          <Text style={styles.introTitle}>How Unscroller Works</Text>
          <Text style={styles.introBody}>
            We build focus tools for creators. Below is a quick reference for what we filter, what we collect, and how to
            reach us if something looks off.
          </Text>
          <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Settings')} activeOpacity={0.9}>
            <Text style={styles.linkText}>Back to Settings</Text>
          </TouchableOpacity>
        </View>

        {renderedSections}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal Links</Text>
          <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Info')} activeOpacity={0.9}>
            <Text style={styles.linkRowText}>In-App Info & Tutorials</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Support')} activeOpacity={0.9}>
            <Text style={styles.linkRowText}>Contact Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('ProviderWebView', { providerId: 'instagram' })} activeOpacity={0.9}>
            <Text style={styles.linkRowText}>Provider Guidance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Settings')} activeOpacity={0.9}>
            <Text style={styles.linkRowSubText}>Manage Subscription</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL(PRIVACY_URL)} activeOpacity={0.9}>
            <Text style={styles.linkRowText}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL(TERMS_URL)} activeOpacity={0.9}>
            <Text style={styles.linkRowText}>Terms of Use</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL(DELETION_URL)} activeOpacity={0.9}>
            <Text style={styles.linkRowText}>Deletion Support</Text>
          </TouchableOpacity>
          <Text style={styles.sectionBody}>Support Email: {SUPPORT_EMAIL}</Text>
          <Text style={styles.sectionBody}>Need a quick summary? We filter feeds, never your DMs.</Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_MAIN,
  },
  safeAreaCompact: {
    paddingTop: SPACING.space_2,
  },
  stars: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.ACCENT_GRADIENT_START,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.space_5,
    paddingBottom: SPACING.space_6,
    paddingTop: SPACING.space_4,
    gap: SPACING.space_4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.space_1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backIcon: {
    fontSize: 26,
    color: COLORS.TEXT_PRIMARY,
  },
  headerTitle: {
    ...TYPOGRAPHY.H2,
    color: COLORS.TEXT_PRIMARY,
  },
  headerSpacer: {
    width: 40,
  },
  introCard: {
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: SPACING.space_4,
    padding: SPACING.space_4,
    marginBottom: SPACING.space_2,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  introTitle: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.space_2,
  },
  introBody: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
  linkButton: {
    marginTop: SPACING.space_3,
    alignSelf: 'flex-start',
  },
  linkText: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.ACCENT_GRADIENT_START,
    textDecorationLine: 'underline',
  },
  section: {
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: SPACING.space_4,
    padding: SPACING.space_4,
    marginBottom: SPACING.space_3,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    gap: SPACING.space_2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
  },
  sectionBody: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
  linkRow: {
    paddingVertical: SPACING.space_2,
  },
  linkRowText: {
    ...TYPOGRAPHY.Body,
    color: COLORS.ACCENT_GRADIENT_START,
    textDecorationLine: 'underline',
  },
  linkRowSubText: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
  },
});
