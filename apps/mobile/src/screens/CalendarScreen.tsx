import React from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, useWindowDimensions, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';

type Props = NativeStackScreenProps<RootStackParamList, 'Calendar'>;

export default function CalendarScreen({ navigation }: Props) {
  const { height } = useWindowDimensions();
  const isCompact = height < 720;
  const currentMonth = 'November 2024';
  const days = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    completed: i < 20 ? Math.random() > 0.3 : false,
  }));

  return (
    <ScreenWrapper contentStyle={isCompact ? styles.safeAreaCompact : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />
      
      <View style={styles.stars}>
        {Array.from({ length: 50 }).map((_, i) => (
          <View key={i} style={[styles.star, { left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, opacity: Math.random() * 0.5 + 0.3 }]} />
        ))}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={10}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Calendar</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>20</Text>
            <Text style={styles.statLabel}>Days This Month</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>67%</Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </View>
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity style={styles.navButton} activeOpacity={0.8}>
              <Text style={styles.navArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{currentMonth}</Text>
            <TouchableOpacity style={styles.navButton} activeOpacity={0.8}>
              <Text style={styles.navArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekDays}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <Text key={i} style={styles.weekDay}>{d}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {days.map(({ day, completed }) => (
              <View key={day} style={[styles.dayCell, completed && styles.dayCellCompleted]}>
                <Text style={[styles.dayNumber, completed && styles.dayNumberCompleted]}>{day}</Text>
                {completed && <View style={styles.checkDot} />}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.legendCard}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#8a2be2' }]} />
            <Text style={styles.legendText}>Completed</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />
            <Text style={styles.legendText}>Incomplete</Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safeAreaCompact: {
    // Compact layout adjustments
  },
  stars: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: COLORS.ACCENT_GRADIENT_START,
    borderRadius: 1,
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
    paddingHorizontal: SPACING.space_5,
    paddingTop: SPACING.space_4,
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
  backIcon: {
    fontSize: 28,
    color: COLORS.TEXT_PRIMARY,
  },
  headerTitle: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
  },
  placeholder: {
    width: 40,
  },
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: SPACING.space_5,
    marginBottom: SPACING.space_5,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: 18,
    padding: SPACING.space_5,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.ACCENT_GRADIENT_START,
    marginBottom: SPACING.space_1,
  },
  statLabel: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: COLORS.GLASS_BORDER,
  },
  calendarCard: {
    marginHorizontal: SPACING.space_5,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: 18,
    padding: SPACING.space_5,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    marginBottom: SPACING.space_5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_5,
  },
  navArrow: {
    fontSize: 24,
    color: COLORS.TEXT_PRIMARY,
    paddingHorizontal: SPACING.space_2,
  },
  navButton: {
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
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  monthTitle: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.space_3,
  },
  weekDay: {
    width: 40,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.space_2,
    borderRadius: 8,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  dayCellCompleted: {
    backgroundColor: 'rgba(77, 161, 255, 0.18)',
    borderColor: 'rgba(77, 161, 255, 0.4)',
  },
  dayNumber: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 2,
  },
  dayNumberCompleted: {
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
  checkDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.SUCCESS_GREEN,
  },
  legendCard: {
    flexDirection: 'row',
    marginHorizontal: SPACING.space_5,
    gap: SPACING.space_5,
    justifyContent: 'center',
    paddingVertical: SPACING.space_3,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  bottomSpacing: {
    height: SPACING.space_6,
  },
});
