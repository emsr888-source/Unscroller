import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, useWindowDimensions, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { SPACING } from '@/core/theme/spacing';
import { useAppStore } from '@/store';
import { SafeAreaView } from 'react-native-safe-area-context';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorCard from '@/components/watercolor/WatercolorCard';

type Props = NativeStackScreenProps<RootStackParamList, 'Progress'>;

const TIMEFRAMES = ['Week', 'Month', 'Year', 'All'];

export default function ProgressScreen({ navigation }: Props) {
  const { height } = useWindowDimensions();
  const isCompact = height < 720;
  const [selectedTimeframe, setSelectedTimeframe] = useState('Week');
  const { setOnboardingCompleted } = useAppStore();

  const handleDevSkip = () => {
    if (!__DEV__) {
      return;
    }
    setOnboardingCompleted(true);
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  // Mock data
  const stats = {
    scrollFreeHours: 48,
    creationMinutes: 420,
    focusSessions: 12,
    streakDays: 7,
  };

  const weekData = [
    { day: 'M', hours: 6, completed: true },
    { day: 'T', hours: 8, completed: true },
    { day: 'W', hours: 7, completed: true },
    { day: 'T', hours: 0, completed: false },
    { day: 'F', hours: 9, completed: true },
    { day: 'S', hours: 10, completed: true },
    { day: 'S', hours: 8, completed: true },
  ];

  const maxHours = Math.max(...weekData.map(d => d.hours));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            isCompact && styles.scrollContentCompact,
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={10}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Progress</Text>
            <View style={styles.headerSpacer}>
              {__DEV__ && (
                <TouchableOpacity style={styles.devSkipButton} onPress={handleDevSkip} activeOpacity={0.85}>
                  <Text style={styles.devSkipText}>Skip</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.timeframeSelector}>
            {TIMEFRAMES.map(timeframe => {
              const active = selectedTimeframe === timeframe;
              return (
                <TouchableOpacity
                  key={timeframe}
                  style={[styles.timeframeChip, active && styles.timeframeChipActive]}
                  onPress={() => setSelectedTimeframe(timeframe)}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.timeframeText, active && styles.timeframeTextActive]}>
                    {timeframe}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <WatercolorCard style={styles.statCard}>
            <View style={styles.statsGrid}>
              <StatCard label="Scroll-Free" value={`${stats.scrollFreeHours}h`} />
              <StatCard label="Creating" value={`${stats.creationMinutes}m`} />
              <StatCard label="Focus Sessions" value={`${stats.focusSessions}`} />
              <StatCard label="Day Streak" value={`${stats.streakDays}`} />
            </View>
          </WatercolorCard>

          <WatercolorCard>
            <Text style={styles.sectionHeadline}>Daily Progress</Text>
            <View style={styles.chart}>
              {weekData.map((data, index) => (
                <View key={index} style={styles.chartBar}>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${(data.hours / maxHours) * 100}%`,
                          backgroundColor: data.completed ? '#93c5fd' : 'rgba(148, 163, 184, 0.3)',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{data.day}</Text>
                  <Text style={styles.barValue}>{data.hours}h</Text>
                </View>
              ))}
            </View>
          </WatercolorCard>

          <WatercolorCard>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeadline}>Recent Achievements</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Trophy')} hitSlop={8}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.achievementsList}>
              <AchievementRow icon="🏆" title="7 Days Strong" subtitle="2 days ago" />
              <AchievementRow icon="🎯" title="First Build" subtitle="5 days ago" />
            </View>
          </WatercolorCard>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.statCard}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const AchievementRow = ({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) => (
  <View style={styles.achievementRow}>
    <View style={styles.achievementIconWrap}>
      <Text style={styles.achievementIcon}>{icon}</Text>
    </View>
    <View style={styles.achievementCopy}>
      <Text style={styles.achievementTitle}>{title}</Text>
      <Text style={styles.achievementSubtitle}>{subtitle}</Text>
    </View>
  </View>
);

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
    paddingHorizontal: SPACING.space_4,
    paddingBottom: SPACING.space_6,
    paddingTop: SPACING.space_3,
    gap: SPACING.space_4,
  },
  scrollContentCompact: {
    paddingHorizontal: SPACING.space_3,
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
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.4,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  backIcon: {
    fontSize: 26,
    color: '#1f2937',
  },
  headerTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 28,
    color: '#1f2937',
  },
  headerSpacer: {
    minWidth: 64,
    alignItems: 'flex-end',
  },
  devSkipButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  devSkipText: {
    fontFamily: 'PatrickHand-Regular',
    color: '#1f2937',
  },
  timeframeSelector: {
    flexDirection: 'row',
    gap: SPACING.space_2,
  },
  timeframeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.4,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 4,
  },
  timeframeChipActive: {
    backgroundColor: '#fde68a',
  },
  timeframeText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  timeframeTextActive: {
    color: '#1f2937',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.space_3,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    borderRadius: 22,
    borderWidth: 1.6,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    padding: SPACING.space_4,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  statValue: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 28,
    color: '#1f2937',
    marginBottom: SPACING.space_1,
  },
  statLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  chartCard: {
    borderRadius: 26,
    borderWidth: 1.6,
    borderColor: '#1f2937',
    padding: SPACING.space_4,
    backgroundColor: '#fff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  barContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '80%',
  },
  barFill: {
    width: '100%',
    borderRadius: 8,
    minHeight: 6,
  },
  barLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#475569',
  },
  barValue: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 12,
    color: '#94a3b8',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_2,
  },
  sectionHeadline: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    color: '#1f2937',
  },
  seeAll: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#dc2626',
  },
  achievementsCard: {
    borderRadius: 26,
    borderWidth: 1.6,
    borderColor: '#1f2937',
    padding: SPACING.space_4,
    backgroundColor: '#fff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  achievementsList: {
    gap: SPACING.space_2,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_3,
    paddingVertical: SPACING.space_2,
  },
  achievementIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.4,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementIcon: {
    fontSize: 26,
  },
  achievementCopy: {
    flex: 1,
  },
  achievementTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  achievementSubtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#94a3b8',
  },
  bottomSpacer: {
    height: SPACING.space_5,
  },
});
