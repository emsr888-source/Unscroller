import React from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';

type Props = NativeStackScreenProps<RootStackParamList, 'Resources'>;

const RESOURCES = [
  { id: 1, category: 'Articles', icon: '📝', items: [
    { title: 'The Science of Dopamine', time: '5 min read' },
    { title: 'Building in Public', time: '7 min read' },
  ]},
  { id: 2, category: 'Videos', icon: '🎥', items: [
    { title: 'Creator Mindset Masterclass', time: '15 min' },
    { title: 'Deep Work Explained', time: '10 min' },
  ]},
  { id: 3, category: 'Tools', icon: '🛠️', items: [
    { title: 'Focus Timer', time: 'Tool' },
    { title: 'Habit Tracker', time: 'Tool' },
  ]},
];

export default function ResourcesScreen({ navigation }: Props) {
  return (
    <ScreenWrapper>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />
      
      <View style={styles.stars}>
        {Array.from({ length: 50 }).map((_, i) => (
          <View key={i} style={[styles.star, { left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, opacity: Math.random() * 0.5 + 0.3 }]} />
        ))}
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={10}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Resources</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.heroSection}>
          <Text style={styles.heroIcon}>📚</Text>
          <Text style={styles.heroTitle}>Learn & Grow</Text>
          <Text style={styles.heroSubtitle}>Tools and content to support your journey</Text>
        </View>

        {RESOURCES.map(category => (
          <View key={category.id} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={styles.categoryTitle}>{category.category}</Text>
            </View>
            {category.items.map((item, idx) => (
              <TouchableOpacity key={idx} style={styles.resourceCard} activeOpacity={0.9}>
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceTitle}>{item.title}</Text>
                  <Text style={styles.resourceTime}>{item.time}</Text>
                </View>
                <Text style={styles.arrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  stars: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  star: { position: 'absolute', width: 2, height: 2, backgroundColor: COLORS.ACCENT_GRADIENT_START, borderRadius: 1 },
  scrollView: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_5,
    paddingTop: SPACING.space_6,
    paddingBottom: SPACING.space_3,
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
  backIcon: { fontSize: 22, color: COLORS.TEXT_PRIMARY },
  headerTitle: { ...TYPOGRAPHY.H2, color: COLORS.TEXT_PRIMARY },
  placeholder: { width: 40 },
  heroSection: {
    alignItems: 'center',
    paddingVertical: SPACING.space_5,
    paddingHorizontal: SPACING.space_5,
    gap: SPACING.space_2,
  },
  heroIcon: { fontSize: 48, marginBottom: SPACING.space_1 },
  heroTitle: { ...TYPOGRAPHY.H1, color: COLORS.TEXT_PRIMARY, textAlign: 'center' },
  heroSubtitle: { ...TYPOGRAPHY.Body, color: COLORS.TEXT_SECONDARY, textAlign: 'center' },
  categorySection: { paddingHorizontal: SPACING.space_5, marginBottom: SPACING.space_5 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.space_2, marginBottom: SPACING.space_3 },
  categoryIcon: { fontSize: 24 },
  categoryTitle: { ...TYPOGRAPHY.H3, color: COLORS.TEXT_PRIMARY },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: 12,
    padding: SPACING.space_4,
    marginBottom: SPACING.space_3,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  resourceInfo: { flex: 1 },
  resourceTitle: { ...TYPOGRAPHY.Body, color: COLORS.TEXT_PRIMARY, fontFamily: 'Inter-SemiBold', marginBottom: SPACING.space_1 },
  resourceTime: { ...TYPOGRAPHY.Subtext, color: COLORS.TEXT_SECONDARY },
  arrow: { fontSize: 18, color: COLORS.TEXT_SECONDARY },
  bottomSpacing: { height: SPACING.space_6 },
});
