import React from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorButton from '@/components/watercolor/WatercolorButton';

type Props = NativeStackScreenProps<RootStackParamList, 'RatingRequest'>;

interface Testimonial {
  id: string;
  name: string;
  username: string;
  stars: number;
  text: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Michael Stevens',
    username: '@michaels',
    stars: 5,
    text: "Unscroller has been a lifesaver for me. The progress tracking and motivational notifications have kept me on track. I haven't mindlessly scrolled in 3 months and feel more in control of my life.",
  },
  {
    id: '2',
    name: 'Tony Coleman',
    username: '@tcoleman23',
    stars: 5,
    text: "I was skeptical at first, but Unscroller's approach has helped me resist the urge to endless scroll. The community support is amazing!",
  },
];

export default function RatingRequestScreen({ navigation }: Props) {
  const { height } = useWindowDimensions();
  const isCompact = height < 720;

  const handleNext = () => {
    navigation.navigate('NotificationPermission');
  };

  const handleRate = () => {
    // TODO: Open app store rating
    navigation.navigate('NotificationPermission');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

      <View style={[styles.header, isCompact && styles.headerCompact]}>
        <Text style={styles.headerTitle}>Rate Unscroller</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Give us a rating</Text>

        <View style={styles.starsContainer}>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map(star => (
              <Text key={star} style={styles.star}>
                ⭐
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.socialProof}>
          <Text style={styles.socialProofText}>This app was designed for people like you.</Text>
          <View style={styles.avatars}>
            {Array.from({ length: 3 }).map((_, idx) => (
              <View key={idx} style={styles.avatar}>
                <Text style={styles.avatarText}>👤</Text>
              </View>
            ))}
            <Text style={styles.peopleCount}>+ 1,000,000 people</Text>
          </View>
        </View>

        <View style={styles.testimonialsContainer}>
          {TESTIMONIALS.map(testimonial => (
            <View key={testimonial.id} style={styles.testimonialCard}>
              <View style={styles.testimonialHeader}>
                <View style={styles.testimonialAvatar}>
                  <Text style={styles.testimonialAvatarText}>
                    {testimonial.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')}
                  </Text>
                </View>
                <View style={styles.testimonialInfo}>
                  <Text style={styles.testimonialName}>{testimonial.name}</Text>
                  <Text style={styles.testimonialUsername}>{testimonial.username}</Text>
                </View>
                <View style={styles.testimonialStars}>
                  {Array.from({ length: testimonial.stars }).map((_, i) => (
                    <Text key={i} style={styles.testimonialStar}>
                      ⭐
                    </Text>
                  ))}
                </View>
              </View>
              <Text style={styles.testimonialText}>{testimonial.text}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: SPACING.space_7 }} />
      </ScrollView>

      <View style={styles.bottomContainer}>
        <WatercolorButton color="yellow" onPress={handleRate}>
          <Text style={styles.buttonText}>Rate Unscroller</Text>
        </WatercolorButton>
        <WatercolorButton color="yellow" onPress={handleNext}>
          <Text style={styles.buttonText}>Skip for now</Text>
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
    alignItems: 'center',
  },
  headerCompact: {
    paddingTop: SPACING.space_5,
  },
  headerTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    color: '#1f2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.space_5,
    gap: SPACING.space_5,
  },
  title: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 32,
    color: '#1f2937',
    textAlign: 'center',
  },
  starsContainer: {
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    gap: SPACING.space_2,
  },
  star: {
    fontSize: 32,
  },
  socialProof: {
    alignItems: 'center',
    gap: SPACING.space_3,
  },
  socialProofText: {
    ...TYPOGRAPHY.Body,
    fontSize: 16,
    color: '#1f2937',
    textAlign: 'center',
    maxWidth: 280,
  },
  avatars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fffef9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#1f2937',
  },
  avatarText: {
    fontSize: 20,
  },
  peopleCount: {
    ...TYPOGRAPHY.Subtext,
    color: '#475569',
    marginLeft: SPACING.space_2,
  },
  testimonialsContainer: {
    gap: SPACING.space_4,
    marginTop: SPACING.space_6,
  },
  testimonialCard: {
    backgroundColor: '#fffef9',
    borderRadius: 16,
    padding: SPACING.space_4,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    gap: SPACING.space_3,
  },
  testimonialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_3,
  },
  testimonialAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fdfbf7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#1f2937',
  },
  testimonialAvatarText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testimonialInfo: {
    flex: 1,
    gap: SPACING.space_1,
  },
  testimonialName: {
    ...TYPOGRAPHY.Body,
    fontSize: 16,
    color: '#1f2937',
  },
  testimonialUsername: {
    ...TYPOGRAPHY.Subtext,
    color: '#475569',
  },
  testimonialStars: {
    flexDirection: 'row',
    gap: 2,
  },
  testimonialStar: {
    fontSize: 16,
  },
  testimonialText: {
    ...TYPOGRAPHY.Body,
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  bottomContainer: {
    paddingHorizontal: SPACING.space_5,
    paddingBottom: SPACING.space_6,
    paddingTop: SPACING.space_3,
    gap: SPACING.space_3,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fdfbf7',
  },
  buttonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
});
