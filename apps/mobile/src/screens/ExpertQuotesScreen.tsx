import React, { useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, Image, ImageSourcePropType } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorButton from '@/components/watercolor/WatercolorButton';
import WatercolorCard from '@/components/watercolor/WatercolorCard';

type Props = NativeStackScreenProps<RootStackParamList, 'ExpertQuotes'>;

interface Quote {
  id: string;
  author: string;
  credential: string;
  title: string;
  quote: string;
  verified: boolean;
  photo?: ImageSourcePropType;
}

const EXPERT_PHOTOS: Record<string, ImageSourcePropType> = {
  haidt: require('../../../../experts/johnhaidt.jpg'),
  newport: require('../../../../experts/calnewport.jpg'),
  harris: require('../../../../experts/tristanharris.jpg'),
  twenge: require('../../../../experts/jeantwenge.jpg'),
};

const EXPERT_QUOTES: Quote[] = [
  {
    id: 'haidt',
    author: 'Jonathan Haidt',
    credential: 'Social psychologist, author of “The Anxious Generation”',
    title: 'The irony of social media',
    quote:
      '“This is the great irony of social media: the more you immerse yourself in it, the more lonely and depressed you become.”',
    verified: true,
    photo: EXPERT_PHOTOS.haidt,
  },
  {
    id: 'newport',
    author: 'Cal Newport',
    credential: 'Computer scientist, author of Digital Minimalism',
    title: 'Humans aren’t built for constant connection',
    quote: '“Simply put, humans are not wired to be constantly wired.”',
    verified: true,
    photo: EXPERT_PHOTOS.newport,
  },
  {
    id: 'harris',
    author: 'Tristan Harris',
    credential: 'Co-founder, Center for Humane Technology',
    title: 'Your attention can be mined',
    quote:
      '“Our attention can be mined. We are more profitable to a corporation if we’re staring at a screen than if we’re spending that time living our life in a rich way.”',
    verified: true,
    photo: EXPERT_PHOTOS.harris,
  },
  {
    id: 'twenge-time',
    author: 'Jean Twenge',
    credential: 'Psychologist, author of iGen',
    title: 'Screen time and depression',
    quote:
      '“Young people who report spending the most time on their phones, 5–7 hours, are also twice as likely to report being depressed as those who spend less time.”\n\n“Significant effects on both mental health and sleep time appear after two or more hours a day on electronic devices.”',
    verified: true,
    photo: EXPERT_PHOTOS.twenge,
  },
];

export default function ExpertQuotesScreen({ navigation }: Props) {
  const initials = useMemo(
    () =>
      EXPERT_QUOTES.reduce<Record<string, string>>((acc, quote) => {
        if (!quote.photo) {
          acc[quote.id] = quote.author
            .split(' ')
            .map(n => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
        }
        return acc;
      }, {}),
    []
  );

  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, SPACING.space_1);

  const handleContinue = () => {
    navigation.navigate('RecoveryGraph');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

      <View style={styles.header}>
        <Text style={styles.badge}>Verified insights</Text>
        <Text style={styles.headerTitle}>Success stories & expert voices</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.quotesContainer}>
          {EXPERT_QUOTES.map(quote => (
            <WatercolorCard key={quote.id} style={styles.quoteCard}>
              <View style={styles.quoteHeader}>
                <View style={styles.avatar}>
                  {quote.photo ? (
                    <Image source={quote.photo} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>{initials[quote.id]}</Text>
                  )}
                </View>
                <View style={styles.authorInfo}>
                  <View style={styles.authorNameRow}>
                    <Text style={styles.authorName}>{quote.author}</Text>
                    {quote.verified && <Text style={styles.verifiedBadge}>✓</Text>}
                  </View>
                  <Text style={styles.credential}>{quote.credential}</Text>
                </View>
              </View>

              <View style={styles.quoteContent}>
                <Text style={styles.quoteTitle}>{quote.title}</Text>
                <Text style={styles.quoteText}>{quote.quote}</Text>
              </View>
            </WatercolorCard>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.bottomContainer, { paddingBottom: bottomPadding }]}>
        <WatercolorButton color="yellow" onPress={handleContinue}>
          <Text style={styles.buttonText}>Continue</Text>
        </WatercolorButton>
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
  },
  header: {
    paddingTop: SPACING.space_6,
    paddingHorizontal: SPACING.space_5,
    paddingBottom: SPACING.space_3,
    gap: SPACING.space_1,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_1,
    backgroundColor: '#fef3c7',
    color: '#1f2937',
    borderRadius: 12,
    ...TYPOGRAPHY.Subtext,
    fontSize: 14,
  },
  headerTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 28,
    color: '#1f2937',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.space_5,
    paddingBottom: SPACING.space_3,
  },
  quotesContainer: {
    gap: SPACING.space_3,
  },
  quoteCard: {
    padding: SPACING.space_4,
    gap: SPACING.space_2,
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_3,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fdfbf7',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: '#1f2937',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    color: '#1f2937',
    fontSize: 16,
    ...TYPOGRAPHY.Subtext,
  },
  authorInfo: {
    flex: 1,
    gap: 2,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_1,
  },
  authorName: {
    ...TYPOGRAPHY.Body,
    fontSize: 18,
    color: '#1f2937',
  },
  verifiedBadge: {
    color: '#fbbf24',
    fontSize: 16,
  },
  credential: {
    ...TYPOGRAPHY.Subtext,
    color: '#475569',
  },
  quoteContent: {
    gap: SPACING.space_1,
  },
  quoteTitle: {
    ...TYPOGRAPHY.Body,
    fontSize: 20,
    color: '#1f2937',
  },
  quoteText: {
    ...TYPOGRAPHY.Body,
    fontSize: 16,
    color: '#475569',
    lineHeight: 22,
  },
  bottomContainer: {
    paddingHorizontal: SPACING.space_5,
    paddingTop: 0,
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
});
