import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { challengesServiceDB as challengesService, Leaderboard } from '@/services/challengesService.database';
import { AnimationStagger } from '@/constants/design';
import { SPACING } from '@/core/theme/spacing';
import { SafeAreaView } from 'react-native-safe-area-context';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';

type Props = NativeStackScreenProps<RootStackParamList, 'Leaderboard'>;

type MetricType = 'time_saved' | 'focus_hours' | 'streak_days';
type PeriodType = 'daily' | 'weekly' | 'monthly' | 'all_time';

export default function LeaderboardScreen({ navigation }: Props) {
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('time_saved');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('weekly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedMetric, selectedPeriod]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await challengesService.getLeaderboard(selectedMetric, selectedPeriod);
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      // Use mock data for demonstration
      const mockData: Leaderboard = {
        id: 'mock-leaderboard',
        period: selectedPeriod,
        metric: selectedMetric,
        entries: [
          { userId: '1', username: 'Alex Johnson', avatar: '🎯', rank: 1, score: 127, isCurrentUser: false, isFriend: false },
          { userId: '2', username: 'Sarah Chen', avatar: '⚡', rank: 2, score: 98, isCurrentUser: false, isFriend: true },
          { userId: '3', username: 'Mike Rodriguez', avatar: '🚀', rank: 3, score: 85, isCurrentUser: false, isFriend: false },
          { userId: '4', username: 'Emma Wilson', avatar: '🌟', rank: 4, score: 72, isCurrentUser: true, isFriend: false },
          { userId: '5', username: 'James Taylor', avatar: '💪', rank: 5, score: 68, isCurrentUser: false, isFriend: true },
          { userId: '6', username: 'Olivia Brown', avatar: '🎨', rank: 6, score: 61, isCurrentUser: false, isFriend: false },
          { userId: '7', username: 'Daniel Kim', avatar: '🔥', rank: 7, score: 55, isCurrentUser: false, isFriend: false },
          { userId: '8', username: 'Sophia Martinez', avatar: '✨', rank: 8, score: 49, isCurrentUser: false, isFriend: true },
          { userId: '9', username: 'Liam Anderson', avatar: '🎯', rank: 9, score: 44, isCurrentUser: false, isFriend: false },
          { userId: '10', username: 'Ava Thompson', avatar: '🌈', rank: 10, score: 38, isCurrentUser: false, isFriend: false },
          { userId: '11', username: 'Noah Garcia', avatar: '🏆', rank: 11, score: 35, isCurrentUser: false, isFriend: false },
          { userId: '12', username: 'Isabella Lee', avatar: '💎', rank: 12, score: 31, isCurrentUser: false, isFriend: false },
          { userId: '13', username: 'Mason White', avatar: '🎪', rank: 13, score: 28, isCurrentUser: false, isFriend: true },
          { userId: '14', username: 'Mia Harris', avatar: '🌺', rank: 14, score: 25, isCurrentUser: false, isFriend: false },
          { userId: '15', username: 'Ethan Clark', avatar: '⚙️', rank: 15, score: 22, isCurrentUser: false, isFriend: false },
        ],
      };
      setLeaderboard(mockData);
    } finally {
      setLoading(false);
    }
  };

  const getMetricLabel = (metric: MetricType): string => {
    switch (metric) {
      case 'time_saved': return 'Time Saved';
      case 'focus_hours': return 'Focus Hours';
      case 'streak_days': return 'Streak Days';
    }
  };

  const getMetricUnit = (metric: MetricType, score: number): string => {
    switch (metric) {
      case 'time_saved': return `${score}h`;
      case 'focus_hours': return `${score}h`;
      case 'streak_days': return `${score} days`;
    }
  };

  const getRankColor = (rank: number): string => {
    if (rank === 1) return 'rgba(14, 165, 233, 0.15)';
    if (rank === 2) return 'rgba(14, 165, 233, 0.1)';
    if (rank === 3) return 'rgba(14, 165, 233, 0.05)';
    return '#fff';
  };

  const getRankEmoji = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={10} activeOpacity={0.9}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroIcon}>🏆</Text>
          <Text style={styles.heroTitle}>Top Performers</Text>
          <Text style={styles.heroSubtitle}>See how you rank against others</Text>
        </View>

        {/* Metric Selector */}
        <View style={styles.selectorSection}>
          <Text style={styles.selectorLabel}>Metric</Text>
          <View style={styles.selectorButtons}>
            {(['time_saved', 'focus_hours', 'streak_days'] as MetricType[]).map((metric) => (
              <TouchableOpacity
                key={metric}
                style={[
                  styles.selectorButton,
                  selectedMetric === metric && styles.selectorButtonActive,
                ]}
                onPress={() => setSelectedMetric(metric)}
                activeOpacity={0.9}
              >
                <Text
                  style={[
                    styles.selectorButtonText,
                    selectedMetric === metric && styles.selectorButtonTextActive,
                  ]}
                >
                  {getMetricLabel(metric)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Period Selector */}
        <View style={styles.selectorSection}>
          <Text style={styles.selectorLabel}>Time Period</Text>
          <View style={styles.selectorButtons}>
            {(['daily', 'weekly', 'monthly', 'all-time'] as PeriodType[]).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.selectorButton,
                  selectedPeriod === period && styles.selectorButtonActive,
                ]}
                onPress={() => setSelectedPeriod(period)}
                activeOpacity={0.9}
              >
                <Text
                  style={[
                    styles.selectorButtonText,
                    selectedPeriod === period && styles.selectorButtonTextActive,
                  ]}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Leaderboard */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0ea5e9" />
            <Text style={styles.loadingText}>Loading rankings...</Text>
          </View>
        ) : leaderboard ? (
          <View style={styles.leaderboardContainer}>
            {/* Top 3 Podium */}
            {leaderboard.entries.slice(0, 3).length === 3 && (
              <View style={styles.podium}>
                {/* 2nd Place */}
                <Animated.View
                  entering={FadeInDown.delay(1 * AnimationStagger.card)}
                  style={styles.podiumSlot}
                >
                  <View style={[styles.podiumCard, styles.podiumSecond]}>
                    <Text style={styles.podiumAvatar}>
                      {leaderboard.entries[1].avatar || '👤'}
                    </Text>
                    <Text style={styles.podiumName}>{leaderboard.entries[1].username}</Text>
                    <Text style={styles.podiumRank}>🥈</Text>
                    <Text style={styles.podiumScore}>
                      {getMetricUnit(selectedMetric, leaderboard.entries[1].score)}
                    </Text>
                  </View>
                </Animated.View>

                {/* 1st Place */}
                <Animated.View
                  entering={FadeInDown.delay(0 * AnimationStagger.card)}
                  style={styles.podiumSlot}
                >
                  <View style={[styles.podiumCard, styles.podiumFirst]}>
                    <View style={styles.crownContainer}>
                      <Text style={styles.crown}>👑</Text>
                    </View>
                    <Text style={styles.podiumAvatar}>
                      {leaderboard.entries[0].avatar || '👤'}
                    </Text>
                    <Text style={styles.podiumName}>{leaderboard.entries[0].username}</Text>
                    <Text style={styles.podiumRank}>🥇</Text>
                    <Text style={styles.podiumScore}>
                      {getMetricUnit(selectedMetric, leaderboard.entries[0].score)}
                    </Text>
                  </View>
                </Animated.View>

                {/* 3rd Place */}
                <Animated.View
                  entering={FadeInDown.delay(2 * AnimationStagger.card)}
                  style={styles.podiumSlot}
                >
                  <View style={[styles.podiumCard, styles.podiumThird]}>
                    <Text style={styles.podiumAvatar}>
                      {leaderboard.entries[2].avatar || '👤'}
                    </Text>
                    <Text style={styles.podiumName}>{leaderboard.entries[2].username}</Text>
                    <Text style={styles.podiumRank}>🥉</Text>
                    <Text style={styles.podiumScore}>
                      {getMetricUnit(selectedMetric, leaderboard.entries[2].score)}
                    </Text>
                  </View>
                </Animated.View>
              </View>
            )}

            {/* Full Rankings */}
            <View style={styles.rankingsList}>
              {leaderboard.entries.map((entry, index) => (
                <Animated.View
                  key={entry.userId}
                  entering={FadeInDown.delay((index + 3) * AnimationStagger.list)}
                >
                  <View
                    style={[
                      styles.rankingCard,
                      entry.isCurrentUser && styles.rankingCardCurrent,
                      entry.isFriend && styles.rankingCardFriend,
                    ]}
                  >
                    <View style={styles.rankingLeft}>
                      <View
                        style={[
                          styles.rankBadge,
                          { backgroundColor: getRankColor(entry.rank) },
                        ]}
                      >
                        <Text style={styles.rankText}>{getRankEmoji(entry.rank)}</Text>
                      </View>
                      <Text style={styles.rankingAvatar}>{entry.avatar || '👤'}</Text>
                      <View style={styles.rankingInfo}>
                        <Text style={styles.rankingName}>
                          {entry.username}
                          {entry.isCurrentUser && ' (You)'}
                        </Text>
                        {entry.isFriend && (
                          <Text style={styles.friendBadge}>👥 Friend</Text>
                        )}
                      </View>
                    </View>
                    <Text style={styles.rankingScore}>
                      {getMetricUnit(selectedMetric, entry.score)}
                    </Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏆</Text>
            <Text style={styles.emptyTitle}>No Rankings Yet</Text>
            <Text style={styles.emptyText}>Start tracking your progress to appear on the leaderboard!</Text>
          </View>
        )}

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
    backgroundColor: '#fdfbf7',
  },
  safeAreaCompact: {
    // Compact layout adjustments
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_4,
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
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.space_4,
    paddingBottom: SPACING.space_6,
    gap: SPACING.space_2,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  heroIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  heroTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 26,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  selectorSection: {
    marginBottom: SPACING.space_2,
  },
  selectorLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: SPACING.space_2,
    textAlign: 'center',
  },
  selectorButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  selectorButton: {
    backgroundColor: '#fff',
    paddingHorizontal: SPACING.space_4,
    paddingVertical: SPACING.space_3,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#1f2937',
  },
  selectorButtonActive: {
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderColor: '#0ea5e9',
  },
  selectorButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
  },
  selectorButtonTextActive: {
    color: '#1f2937',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_6,
  },
  loadingText: {
    fontFamily: 'PatrickHand-Regular',
    color: '#64748b',
    fontSize: 16,
    marginTop: SPACING.space_2,
  },
  leaderboardContainer: {
    paddingHorizontal: 24,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 32,
    gap: 8,
  },
  podiumSlot: {
    flex: 1,
    alignItems: 'center',
  },
  podiumCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1f2937',
    position: 'relative',
  },
  podiumFirst: {
    minHeight: 180,
    borderColor: '#0ea5e9',
    backgroundColor: 'rgba(14, 165, 233, 0.05)',
  },
  podiumSecond: {
    minHeight: 160,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
  },
  podiumThird: {
    minHeight: 140,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
  },
  crownContainer: {
    position: 'absolute',
    top: -20,
  },
  crown: {
    fontSize: 24,
  },
  podiumAvatar: {
    fontSize: 32,
    marginBottom: 8,
  },
  podiumName: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  podiumRank: {
    fontSize: 24,
    marginBottom: 4,
  },
  podiumScore: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    fontWeight: '700',
    color: '#0ea5e9',
  },
  rankingsList: {
    gap: 12,
  },
  rankingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#1f2937',
  },
  rankingCardCurrent: {
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderColor: '#0ea5e9',
    borderWidth: 2,
  },
  rankingCardFriend: {
    backgroundColor: 'rgba(14, 165, 233, 0.05)',
    borderColor: '#0ea5e9',
  },
  rankingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  rankText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  rankingAvatar: {
    fontSize: 24,
  },
  rankingInfo: {
    flex: 1,
  },
  rankingName: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  friendBadge: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 12,
    color: '#0ea5e9',
  },
  rankingScore: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    fontWeight: '700',
    color: '#0ea5e9',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomSpacing: {
    height: SPACING.space_6,
  },
});
