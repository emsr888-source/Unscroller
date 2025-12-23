import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { challengesServiceDB as challengesService, Challenge } from '@/services/challengesService.database';
import { supabase } from '@/services/supabase';
import { AnimationStagger } from '@/constants/design';
import { SPACING } from '@/core/theme/spacing';
import { SafeAreaView } from 'react-native-safe-area-context';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorCard from '@/components/watercolor/WatercolorCard';
import WatercolorButton from '@/components/watercolor/WatercolorButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Challenges'>;

export default function ChallengesScreen({ navigation }: Props) {
  const { height } = useWindowDimensions();
  const isCompact = height < 720;
  const [userId, setUserId] = useState<string | null>(null);
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [availableChallenges, setAvailableChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initUser() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
        loadChallenges(data.user.id);
      } else {
        setLoading(false);
      }
    }

    initUser();
  }, []);

  const loadChallenges = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      const [active, available] = await Promise.all([
        challengesService.getActiveChallenges(uid),
        challengesService.getAvailableChallenges(uid),
      ]);
      setActiveChallenges(active);
      setAvailableChallenges(available);
    } catch (error) {
      console.warn('[Challenges] Failed to load', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleJoinChallenge = useCallback(
    async (challengeId: string) => {
      if (!userId) {
        navigation.navigate('Journal'); // placeholder to encourage auth? Instead show alert? keep simple?
        return;
      }

      const success = await challengesService.joinChallenge(userId, challengeId);
      if (success) {
        loadChallenges(userId);
      }
    },
    [loadChallenges, navigation, userId],
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, isCompact && styles.scrollCompact]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={10}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Challenges</Text>
            <TouchableOpacity style={styles.createButton} onPress={() => navigation.navigate('ChallengeCreate')} activeOpacity={0.9}>
              <Text style={styles.createButtonText}>+ Create</Text>
            </TouchableOpacity>
          </View>

          <WatercolorCard style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              <Text style={styles.heroIcon}>🎯</Text>
            </View>
            <Text style={styles.heroTitle}>Take on creator challenges</Text>
            <Text style={styles.heroSubtitle}>Earn XP, lock healthy habits, and unlock new watercolors as you progress.</Text>
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{activeChallenges.length}</Text>
                <Text style={styles.heroStatLabel}>active</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{availableChallenges.length}</Text>
                <Text style={styles.heroStatLabel}>available</Text>
              </View>
            </View>
          </WatercolorCard>

          {loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color="#94a3b8" />
              <Text style={styles.loadingText}>Fetching challenges…</Text>
            </View>
          ) : (
            <>
              {activeChallenges.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Your streaks</Text>
                  <View style={styles.cardStack}>
                    {activeChallenges.map((challenge, index) => (
                      <Animated.View
                        key={challenge.id}
                        entering={FadeInDown.delay(index * AnimationStagger.card)}
                        style={styles.cardWrapper}
                      >
                        <WatercolorCard style={styles.challengeCard}>
                          <View style={styles.challengeHeader}>
                            <View style={styles.challengeTag}>
                              <Text style={styles.challengeTagText}>
                                {challenge.type === 'community' ? '👥 Community' : '⭐ Personal'}
                              </Text>
                            </View>
                            <Text style={styles.rewardText}>{challenge.reward.type === 'xp' ? `+${challenge.reward.value} XP` : '🏆 Badge'}</Text>
                          </View>
                          <Text style={styles.challengeTitle}>{challenge.title}</Text>
                          <Text style={styles.challengeDescription}>{challenge.description}</Text>

                          <View style={styles.progressRow}>
                            <View style={styles.progressBar}>
                              <View style={[styles.progressFill, { width: `${challenge.progress ?? 0}%` }]} />
                            </View>
                            <Text style={styles.progressLabel}>{challenge.progress ?? 0}%</Text>
                          </View>
                          {challenge.completed ? (
                            <Text style={styles.challengeHint}>✅ Completed — log your wins to keep the streak alive.</Text>
                          ) : (
                            <Text style={styles.challengeHint}>Keep momentum steady to unlock the reward.</Text>
                          )}
                        </WatercolorCard>
                      </Animated.View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {availableChallenges.length ? 'Available to join' : "You're in every live challenge"}
                </Text>
                <View style={styles.cardStack}>
                  {availableChallenges.length ? (
                    availableChallenges.map((challenge, index) => (
                      <Animated.View
                        key={challenge.id}
                        entering={FadeInDown.delay((activeChallenges.length + index) * AnimationStagger.card)}
                        style={styles.cardWrapper}
                      >
                        <WatercolorCard style={styles.availableCard}>
                          <View style={styles.availableHeader}>
                            <View style={styles.challengeTag}>
                              <Text style={styles.challengeTagText}>
                                {challenge.type === 'community' ? '👥 Community' : '⭐ Personal'}
                              </Text>
                            </View>
                            <Text style={styles.participantsText}>
                              {challenge.participants.toLocaleString()} joined
                            </Text>
                          </View>
                          <Text style={styles.challengeTitle}>{challenge.title}</Text>
                          <Text style={styles.challengeDescription}>{challenge.description}</Text>
                          <WatercolorButton color="yellow" onPress={() => handleJoinChallenge(challenge.id)}>
                            <Text style={styles.joinLabel}>Join challenge</Text>
                          </WatercolorButton>
                        </WatercolorCard>
                      </Animated.View>
                    ))
                  ) : (
                    <WatercolorCard style={styles.emptyCard}>
                      <Text style={styles.emptyIcon}>✨</Text>
                      <Text style={styles.emptyTitle}>All caught up</Text>
                      <Text style={styles.emptySubtitle}>Check back soon for fresh drops from the community.</Text>
                    </WatercolorCard>
                  )}
                </View>
              </View>
            </>
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
  scrollCompact: {
    paddingHorizontal: SPACING.space_3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.4,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 4,
  },
  backIcon: {
    fontSize: 26,
    color: '#1f2937',
  },
  headerTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 30,
    color: '#1f2937',
  },
  createButton: {
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_1,
    borderRadius: 18,
    borderWidth: 1.4,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
  },
  createButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  heroCard: {
    gap: SPACING.space_3,
  },
  heroIconWrap: {
    alignSelf: 'flex-start',
    padding: SPACING.space_2,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#1f2937',
  },
  heroIcon: {
    fontSize: 30,
  },
  heroTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    color: '#1f2937',
  },
  heroSubtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_3,
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 26,
    color: '#1f2937',
  },
  heroStatLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroStatDivider: {
    width: 1,
    height: 38,
    backgroundColor: '#d4d4d8',
  },
  loadingState: {
    alignItems: 'center',
    gap: SPACING.space_2,
    paddingVertical: SPACING.space_6,
  },
  loadingText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  section: {
    gap: SPACING.space_3,
  },
  sectionTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    color: '#1f2937',
  },
  cardStack: {
    gap: SPACING.space_3,
  },
  cardWrapper: {
    flex: 1,
  },
  challengeCard: {
    gap: SPACING.space_2,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeTag: {
    paddingHorizontal: SPACING.space_2,
    paddingVertical: SPACING.space_1,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
  },
  challengeTagText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#1f2937',
  },
  rewardText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#16a34a',
  },
  challengeTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    color: '#1f2937',
  },
  challengeDescription: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  progressBar: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#4f46e5',
  },
  progressLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  challengeHint: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#94a3b8',
  },
  availableCard: {
    gap: SPACING.space_3,
  },
  availableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  availableInfo: {
    flex: 1,
    gap: SPACING.space_1,
  },
  participantsText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#94a3b8',
  },
  joinLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  emptyCard: {
    alignItems: 'center',
    gap: SPACING.space_1,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    color: '#1f2937',
  },
  emptySubtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: SPACING.space_6,
  },
});
