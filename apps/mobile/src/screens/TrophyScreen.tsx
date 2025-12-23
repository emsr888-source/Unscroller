import React from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { AnimationStagger } from '@/constants/design';
import { SPACING } from '@/core/theme/spacing';
import { SafeAreaView } from 'react-native-safe-area-context';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';

type Props = NativeStackScreenProps<RootStackParamList, 'Trophy'>;

const TROPHIES = [
  { id: 1, icon: '🏆', title: '7 Days Strong', description: 'Complete 7-day streak', unlocked: true },
  { id: 2, icon: '🎯', title: 'First Build', description: 'Ship your first creation', unlocked: true },
  { id: 3, icon: '⚡', title: 'Focus Master', description: '10 focus sessions', unlocked: true },
  { id: 4, icon: '🚀', title: '30 Days', description: '30-day creator streak', unlocked: false },
  { id: 5, icon: '💎', title: '90 Days', description: '90-day transformation', unlocked: false },
  { id: 6, icon: '👑', title: 'Creator King', description: '365-day journey', unlocked: false },
];

export default function TrophyScreen({ navigation }: Props) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={10}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Achievements</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Unlocked</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>6</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>50%</Text>
            <Text style={styles.statLabel}>Progress</Text>
          </View>
        </View>

        {/* Trophy List */}
        <View style={styles.trophyList}>
          {TROPHIES.map((trophy, index) => (
            <Animated.View
              key={trophy.id}
              entering={FadeInDown.delay(index * AnimationStagger.card)}
              style={[
                styles.trophyCard,
                !trophy.unlocked && styles.trophyCardLocked,
              ]}
            >
              <View style={styles.trophyIcon}>
                <Text style={[
                  styles.trophyEmoji,
                  !trophy.unlocked && styles.trophyEmojiLocked,
                ]}>
                  {trophy.icon}
                </Text>
              </View>
              <View style={styles.trophyContent}>
                <Text style={[
                  styles.trophyTitle,
                  !trophy.unlocked && styles.trophyTitleLocked,
                ]}>
                  {trophy.title}
                </Text>
                <Text style={styles.trophyDescription}>
                  {trophy.description}
                </Text>
              </View>
              {trophy.unlocked && (
                <View style={styles.unlockedBadge}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              )}
            </Animated.View>
          ))}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.space_6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_4,
    paddingTop: SPACING.space_4,
    paddingBottom: SPACING.space_4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
  },
  backIcon: {
    fontSize: 26,
    color: '#1f2937',
  },
  headerTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  placeholder: {
    width: 28,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: SPACING.space_4,
    marginBottom: SPACING.space_4,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: SPACING.space_5,
    borderWidth: 2,
    borderColor: '#1f2937',
  },
  statItem: {
    alignItems: 'center',
    gap: SPACING.space_1,
  },
  statNumber: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 32,
    fontWeight: '700',
    color: '#0ea5e9',
  },
  statLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#64748b',
  },
  divider: {
    width: 1,
    backgroundColor: '#d4d4d8',
  },
  trophyList: {
    paddingHorizontal: SPACING.space_4,
    gap: SPACING.space_3,
  },
  trophyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderRadius: 18,
    padding: SPACING.space_4,
    borderWidth: 2,
    borderColor: '#0ea5e9',
    gap: SPACING.space_3,
  },
  trophyCardLocked: {
    backgroundColor: '#fff',
    borderColor: '#d4d4d8',
  },
  trophyIcon: {
    // No additional margin needed with gap
  },
  trophyEmoji: {
    fontSize: 48,
  },
  trophyEmojiLocked: {
    opacity: 0.3,
  },
  trophyContent: {
    flex: 1,
    gap: SPACING.space_1,
  },
  trophyTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  trophyTitleLocked: {
    color: '#94a3b8',
  },
  trophyDescription: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#64748b',
  },
  unlockedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 16,
    color: '#000',
    fontWeight: '700',
  },
  bottomSpacing: {
    height: SPACING.space_6,
  },
});
