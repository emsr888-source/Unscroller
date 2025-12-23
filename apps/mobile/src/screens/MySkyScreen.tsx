import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  Modal,
  ActivityIndicator,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { RootStackParamList } from '@/navigation/AppNavigator';
import { ConstellationSky, getUniverseStage } from '@/components/ConstellationSky';
import {
  constellationServiceDB as constellationService,
  Star,
  Constellation,
  SkyState,
} from '@/services/constellationService.database';
import { supabase } from '@/services/supabase';
import { AnimationStagger } from '@/constants/design';
import { SPACING } from '@/core/theme/spacing';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorCard from '@/components/watercolor/WatercolorCard';
import WatercolorButton from '@/components/watercolor/WatercolorButton';

type Props = NativeStackScreenProps<RootStackParamList, 'MySky'>;

export default function MySkyScreen({ navigation }: Props) {
  const [skyState, setSkyState] = useState<SkyState | null>(null);
  const [selectedStar, setSelectedStar] = useState<Star | null>(null);
  const [todayStats, setTodayStats] = useState({ starsEarned: 0, constellationProgress: 'Loading...' });
  const [loading, setLoading] = useState(true);
  const { height } = useWindowDimensions();
  const isCompact = height < 720;
  const skyHeight = Math.max(height * 0.45, 340);
  const universeStage = useMemo(() => (skyState ? getUniverseStage(skyState) : null), [skyState]);

  useEffect(() => {
    loadSkyData();
  }, []);

  async function loadSkyData() {
    try {
      if (!supabase) {
        applyPlaceholder();
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        applyPlaceholder();
        return;
      }

      const [sky, stats] = await Promise.all([
        constellationService.getSkyState(user.id),
        constellationService.getTodayStats(user.id)
      ]);

      setSkyState(sky);
      setTodayStats(stats);
      setLoading(false);
    } catch (error) {
      console.error('Error loading sky data:', error);
      applyPlaceholder();
    }
  }

  function applyPlaceholder() {
    const placeholderSky: SkyState = {
      totalStars: 8,
      constellations: [
        {
          type: 'deep_work',
          name: 'Deep Work',
          description: 'Stay locked in on meaningful projects.',
          icon: '🎯',
          stars: [],
          progress: 45,
          completed: false,
          totalStarsNeeded: 12,
        },
        {
          type: 'better_sleep',
          name: 'Better Sleep',
          description: 'Wind down and protect your rest.',
          icon: '🌙',
          stars: [],
          progress: 60,
          completed: false,
          totalStarsNeeded: 10,
        },
        {
          type: 'self_confidence',
          name: 'Self-Confidence',
          description: 'Celebrate the small wins.',
          icon: '✨',
          stars: [],
          progress: 100,
          completed: true,
          completionDate: new Date(),
          totalStarsNeeded: 8,
        },
      ] as Constellation[],
      currentStreak: 4,
      longestStreak: 12,
      skyTheme: 'default',
      hasAurora: false,
      hasShootingStars: true,
      cloudCover: 0.1,
      lastUpdated: new Date(),
    };

    setSkyState(placeholderSky);
    setTodayStats({ starsEarned: 2, constellationProgress: 'Preview mode – sign in to see your actual sky.' });
    setLoading(false);
  }

  const handleStarPress = (star: Star) => {
    setSelectedStar(star);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  if (loading || !skyState) {
    return (
      <View style={styles.loadingRoot}>
        <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
        <WatercolorBackdrop />
        <SafeAreaView style={[styles.safeArea, styles.centered]} edges={['top', 'bottom']}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loadingText}>Loading your sky...</Text>
        </SafeAreaView>
      </View>
    );
  }

  const energyPercent = Math.round((universeStage?.energy ?? 0) * 100);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
      <WatercolorBackdrop />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, isCompact && styles.contentCompact]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.9} style={styles.iconButton}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>My Sky</Text>
              <Text style={styles.headerSubtitle}>
                {`${skyState.totalStars} ${skyState.totalStars === 1 ? 'star' : 'stars'} collected`}
              </Text>
            </View>
            {universeStage ? (
              <View style={styles.stageBadge}>
                <Text style={styles.stageBadgeText}>Stage {universeStage.level + 1}</Text>
              </View>
            ) : (
              <View style={styles.iconGhost} />
            )}
          </View>

          <WatercolorCard style={styles.skyCard} padding={SPACING.space_3} backgroundColor="#fffef7">
            <View style={styles.skySummaryRow}>
              <Text style={styles.skySummaryLabel}>Tonight’s constellation</Text>
              <Text style={styles.skySummaryValue}>
                {todayStats.starsEarned} {todayStats.starsEarned === 1 ? 'star' : 'stars'} today
              </Text>
            </View>
            <GestureHandlerRootView style={[styles.skyCanvas, { height: skyHeight }]}>
              <ConstellationSky skyState={skyState} onStarPress={handleStarPress} compact={isCompact} enableGestures={true} />
            </GestureHandlerRootView>
          </WatercolorCard>

          {universeStage ? (
            <WatercolorCard style={styles.stageCard} padding={SPACING.space_3} backgroundColor="#fff">
              <Text style={styles.stageLabel}>{universeStage.label}</Text>
              <Text style={styles.stageDescription}>{universeStage.description}</Text>

              <View style={styles.stageStatsRow}>
                <View style={styles.stageStat}>
                  <Text style={styles.stageStatNumber}>{skyState.totalStars}</Text>
                  <Text style={styles.stageStatLabel}>Total stars</Text>
                </View>
                <View style={styles.stageDivider} />
                <View style={styles.stageStat}>
                  <Text style={styles.stageStatNumber}>{universeStage.completedConstellations}</Text>
                  <Text style={styles.stageStatLabel}>Constellations</Text>
                </View>
              </View>

              <View style={styles.energyMeter}>
                <View style={styles.energyTrack}>
                  <View
                    style={[
                      styles.energyFill,
                      {
                        width: `${Math.min(Math.max(energyPercent, 6), 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.energyLabel}>Universe energy {energyPercent}%</Text>
              </View>
            </WatercolorCard>
          ) : null}

          <WatercolorCard style={styles.todayCard} padding={SPACING.space_3} backgroundColor="#fff">
            <View style={styles.todayIconBubble}>
              <Text style={styles.todayIcon}>✨</Text>
            </View>
            <View style={styles.todayText}>
              <Text style={styles.todayTitle}>
                {todayStats.starsEarned} {todayStats.starsEarned === 1 ? 'star' : 'stars'} today
              </Text>
              <Text style={styles.todaySubtitle}>{todayStats.constellationProgress}</Text>
            </View>
          </WatercolorCard>

          <View style={styles.constellationsHeader}>
            <Text style={styles.sectionTitle}>Your constellations</Text>
          </View>

          {skyState.constellations.map((constellation, index) => (
            <Animated.View key={constellation.type} entering={FadeInDown.delay(index * AnimationStagger.list)}>
              <ConstellationCard constellation={constellation} />
            </Animated.View>
          ))}

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {selectedStar ? (
          <Modal visible transparent animationType="fade" onRequestClose={() => setSelectedStar(null)}>
            <View style={styles.modalOverlay}>
              <WatercolorCard style={styles.modalCard} padding={SPACING.space_4} backgroundColor="#fff">
                <Text style={styles.modalStarIcon}>
                  {selectedStar.size === 'large' ? '⭐' : selectedStar.size === 'medium' ? '🌟' : '✨'}
                </Text>
                <Text style={styles.modalTitle}>{selectedStar.action}</Text>
                <View style={styles.modalDetails}>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Type</Text>
                    <Text style={styles.modalDetailValue}>
                      {selectedStar.type.replace('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase())}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Constellation</Text>
                    <Text style={styles.modalDetailValue}>{selectedStar.constellationId}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Earned</Text>
                    <Text style={styles.modalDetailValue}>{formatDate(selectedStar.timestamp)}</Text>
                  </View>
                </View>
                <WatercolorButton color="blue" onPress={() => setSelectedStar(null)} style={styles.modalButton}>
                  <Text style={styles.modalButtonText}>Close</Text>
                </WatercolorButton>
              </WatercolorCard>
            </View>
          </Modal>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

/**
 * Constellation Progress Card
 */
function ConstellationCard({ constellation }: { constellation: Constellation }) {
  const isComplete = constellation.completed;
  const completionCopy =
    isComplete && constellation.completionDate
      ? `Completed ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
          constellation.completionDate
        )}`
      : null;

  return (
    <WatercolorCard
      padding={SPACING.space_3}
      backgroundColor={isComplete ? '#f0fdf4' : '#fff'}
      style={[styles.constellationCard, isComplete && styles.constellationCardComplete]}
    >
      <View style={styles.constellationHeader}>
        <View style={styles.constellationIconBubble}>
          <Text style={styles.constellationIcon}>{constellation.icon}</Text>
        </View>
        <View style={styles.constellationHeading}>
          <Text style={styles.constellationTitle}>{constellation.name}</Text>
          <Text style={styles.constellationDescription}>{constellation.description}</Text>
        </View>
        {isComplete ? (
          <View style={styles.completeBadge}>
            <Text style={styles.completeBadgeText}>✓</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(Math.max(constellation.progress, 4), 100)}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {constellation.stars.length}/{constellation.totalStarsNeeded} stars
        </Text>
      </View>

      {completionCopy ? <Text style={styles.completionDate}>{completionCopy}</Text> : null}
    </WatercolorCard>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fdfbf7',
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: '#fdfbf7',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.space_4,
    paddingBottom: SPACING.space_6,
    paddingTop: SPACING.space_3,
    gap: SPACING.space_4,
  },
  contentCompact: {
    paddingHorizontal: SPACING.space_3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGhost: {
    width: 44,
    height: 44,
  },
  backIcon: {
    fontSize: 26,
    color: '#1f2937',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: SPACING.space_3,
  },
  headerTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 34,
    color: '#1f2937',
    lineHeight: 34,
  },
  headerSubtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
    marginTop: -4,
  },
  stageBadge: {
    minWidth: 88,
    alignItems: 'center',
    paddingHorizontal: SPACING.space_2,
    paddingVertical: SPACING.space_1,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#dbeafe',
  },
  stageBadgeText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#1f2937',
  },
  skyCard: {
    gap: SPACING.space_3,
  },
  skySummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skySummaryLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  skySummaryValue: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  skyCanvas: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1.4,
    borderColor: '#1f2937',
    overflow: 'hidden',
    backgroundColor: '#050214',
  },
  stageCard: {
    gap: SPACING.space_2,
  },
  stageLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    color: '#1f2937',
  },
  stageDescription: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
    lineHeight: 22,
  },
  stageStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_3,
  },
  stageStat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  stageStatNumber: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 28,
    color: '#1f2937',
  },
  stageStatLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#475569',
  },
  stageDivider: {
    width: 1,
    height: 48,
    backgroundColor: 'rgba(15,23,42,0.15)',
  },
  energyMeter: {
    gap: SPACING.space_1,
  },
  energyTrack: {
    height: 10,
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  energyFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#fde047',
  },
  energyLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#1f2937',
  },
  todayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_3,
  },
  todayIconBubble: {
    width: 56,
    height: 56,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayIcon: {
    fontSize: 28,
  },
  todayText: {
    flex: 1,
  },
  todayTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    color: '#1f2937',
  },
  todaySubtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  constellationsHeader: {},
  sectionTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    color: '#1f2937',
  },
  bottomSpacing: {
    height: SPACING.space_6,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.space_2,
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#475569',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.space_4,
  },
  modalCard: {
    width: '100%',
    gap: SPACING.space_3,
  },
  modalStarIcon: {
    fontSize: 48,
    textAlign: 'center',
  },
  modalTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    color: '#1f2937',
    textAlign: 'center',
  },
  modalDetails: {
    gap: SPACING.space_1,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalDetailLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#64748b',
  },
  modalDetailValue: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  modalButton: {
    marginTop: SPACING.space_1,
  },
  modalButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  constellationCard: {
    marginBottom: SPACING.space_3,
    gap: SPACING.space_2,
  },
  constellationCardComplete: {
    borderColor: '#16a34a',
  },
  constellationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_3,
  },
  constellationIconBubble: {
    width: 54,
    height: 54,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  constellationIcon: {
    fontSize: 28,
  },
  constellationHeading: {
    flex: 1,
    gap: 2,
  },
  constellationTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 22,
    color: '#1f2937',
  },
  constellationDescription: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 15,
    color: '#475569',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  progressBar: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#34d399',
  },
  progressText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  completionDate: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 15,
    color: '#166534',
  },
  completeBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#bbf7d0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeBadgeText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
});
