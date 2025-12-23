import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Share,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { getCommunityChallenge, CommunityChallengeDefinition } from '@/constants/communityChallenges';
import {
  challengesServiceDB as challengesService,
  Challenge,
  ChallengeFeedPost,
  ChallengeSharePayload,
} from '@/services/challengesService.database';
import { supabase } from '@/services/supabase';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';
import { PrimaryButton } from '@/features/onboarding/components/PrimaryButton';
import { useAppStore } from '@/store';

const DEFAULT_ACCENT = COLORS.ACCENT_GRADIENT_START;

const STATUS_MESSAGES: Record<string, string> = {
  idle: '',
  joining: 'Joining challenge…',
  joined: 'You’re in! The challenge has been added to your dashboard.',
  requiresAuth: 'Sign in to join challenges and track your progress.',
  error: 'Something went wrong. Please try again later.',
};

type Props = NativeStackScreenProps<RootStackParamList, 'ChallengeDetail'>;
type JoinState = 'idle' | 'joining' | 'joined' | 'requiresAuth' | 'error';
type ChallengeLike = CommunityChallengeDefinition | Challenge;

const isCommunityChallenge = (input: ChallengeLike | null): input is CommunityChallengeDefinition =>
  !!input && Array.isArray((input as CommunityChallengeDefinition).focusAreas);

const formatDate = (value: Date) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(value);

const formatDuration = (challenge: ChallengeLike): string => {
  if (isCommunityChallenge(challenge)) {
    return challenge.timeCommitment;
  }
  return `${formatDate(challenge.duration.start)} → ${formatDate(challenge.duration.end)}`;
};

const formatReward = (challenge: ChallengeLike): string => {
  if (isCommunityChallenge(challenge)) {
    return challenge.streakBoost;
  }
  if (challenge.reward.type === 'xp') {
    return `+${challenge.reward.value} XP`;
  }
  if (challenge.reward.type === 'badge') {
    return `🏆 ${challenge.reward.value}`;
  }
  return challenge.reward.value;
};

export default function ChallengeDetailScreen({ navigation, route }: Props) {
  const { challengeId, initialChallenge } = route.params;
  const communityChallenge = useMemo(() => getCommunityChallenge(challengeId), [challengeId]);
  const [dbChallenge, setDbChallenge] = useState<Challenge | null>(initialChallenge ?? null);
  const [joinState, setJoinState] = useState<JoinState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [feedPosts, setFeedPosts] = useState<ChallengeFeedPost[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [newPostBody, setNewPostBody] = useState('');
  const [postingUpdate, setPostingUpdate] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [sharePayload, setSharePayload] = useState<ChallengeSharePayload | null>(null);
  const tenantId = useAppStore(state => state.tenantId);

  const challenge: ChallengeLike | null = dbChallenge ?? communityChallenge ?? null;
  const resolvedId = challenge?.id ?? challengeId;

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    let mounted = true;
    async function bootstrapAuth() {
      if (!supabase) {
        if (mounted) {
          setDemoMode(true);
          setUserId('dev_user_maya');
        }
        return;
      }
      const { data } = await supabase.auth.getUser();
      if (mounted) {
        if (data?.user) {
          setUserId(data.user.id);
          setDemoMode(false);
        } else {
          setDemoMode(true);
        }
      }
    }
    bootstrapAuth();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (dbChallenge || !supabase) {
      return;
    }
    let mounted = true;
    async function loadChallenge() {
      const remote = await challengesService.getChallengeById(challengeId);
      if (mounted && remote) {
        setDbChallenge(remote);
      }
    }
    loadChallenge();
    return () => {
      mounted = false;
    };
  }, [challengeId, dbChallenge]);

  useEffect(() => {
    if (!resolvedId) {
      return;
    }
    let mounted = true;
    async function hydrateExtras() {
      setFeedLoading(true);
      try {
        const [feed, share] = await Promise.all([
          challengesService.getChallengeFeed(resolvedId),
          challengesService.getSharePayload(resolvedId),
        ]);
        if (mounted) {
          setFeedPosts(feed);
          setSharePayload(share);
        }
      } finally {
        if (mounted) {
          setFeedLoading(false);
        }
      }
    }
    hydrateExtras();
    return () => {
      mounted = false;
    };
  }, [resolvedId]);

  const infoSections = useMemo(() => {
    if (!challenge) {
      return [];
    }
    if (isCommunityChallenge(challenge)) {
      return [
        { title: 'Daily Actions', items: challenge.dailyActions },
        { title: 'Weekly Wins', items: challenge.weeklyWins },
        { title: 'Success Metrics', items: challenge.successMetrics },
      ];
    }
    return [
      { title: 'Daily Commitments', items: challenge.dailyCommitments ?? [] },
      { title: 'Weekly Commitments', items: challenge.weeklyCommitments ?? [] },
      { title: 'Success Metrics', items: challenge.successMetrics ?? [] },
    ];
  }, [challenge]);

  const handleJoinChallenge = useCallback(async () => {
    if (!challenge) {
      return;
    }

    if (demoMode || !supabase) {
      setJoinState('joined');
      setErrorMessage('Preview mode – progress will not be saved.');
      navigation.navigate('ChallengeProgress', { challengeId: resolvedId });
      return;
    }

    try {
      setJoinState('joining');
      setErrorMessage(null);

      let activeUserId = userId;
      if (!activeUserId) {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          activeUserId = data.user.id;
          setUserId(data.user.id);
        } else {
          setJoinState('requiresAuth');
          setErrorMessage('Create an account or log in to join challenges.');
          return;
        }
      }

      const success = await challengesService.joinChallenge(activeUserId, resolvedId);
      if (success) {
        setJoinState('joined');
        navigation.navigate('ChallengeProgress', { challengeId: resolvedId });
      } else {
        setJoinState('error');
        setErrorMessage('Unable to join this challenge right now.');
      }
    } catch (error) {
      console.error('[ChallengeDetail] join failed', error);
      setJoinState('error');
      setErrorMessage(error instanceof Error ? error.message : STATUS_MESSAGES.error);
    }
  }, [challenge, demoMode, navigation, resolvedId, userId]);

  const handleShare = useCallback(async () => {
    if (!resolvedId) {
      return;
    }
    let payload = sharePayload;
    if ((!payload || !payload.imageUrl) && tenantId) {
      try {
        const refreshed = await challengesService.generateShareAsset(resolvedId, tenantId);
        if (refreshed) {
          setSharePayload(refreshed);
          payload = refreshed;
        }
      } catch (error) {
        console.warn('[ChallengeDetail] refresh share asset failed', error);
      }
    }

    if (!payload) {
      payload = {
        shareUrl: `https://unscroller.app/challenges/${resolvedId}`,
        caption: `Join me in “${challenge?.title ?? 'this challenge'}” on Unscroller!`,
      };
    }

    try {
      await Share.share({
        message: `${payload.caption} ${payload.shareUrl}`,
        url: payload.imageUrl,
      });
    } catch (shareError) {
      console.warn('[ChallengeDetail] share error', shareError);
    }
  }, [challenge?.title, resolvedId, sharePayload, tenantId]);

  const handlePostToFeed = useCallback(async () => {
    if (!resolvedId) {
      return;
    }
    setPostError(null);
    if (!newPostBody.trim()) {
      setPostError('Write a quick update before posting.');
      return;
    }
    if (!userId) {
      setPostError('Sign in to cheer inside the feed.');
      return;
    }
    try {
      setPostingUpdate(true);
      const post = await challengesService.postToChallengeFeed(resolvedId, userId, newPostBody.trim());
      if (post) {
        setFeedPosts(prev => [post, ...prev]);
        setNewPostBody('');
      } else {
        setPostError('Could not send that update. Try again.');
      }
    } catch (error) {
      console.error('[ChallengeDetail] post feed error', error);
      setPostError('Something glitched. Try again.');
    } finally {
      setPostingUpdate(false);
    }
  }, [newPostBody, resolvedId, userId]);

  if (!challenge) {
    return (
      <ScreenWrapper contentStyle={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />
        <View style={styles.missingContainer}>
          <Text style={styles.missingTitle}>Challenge unavailable</Text>
          <Text style={styles.missingSubtitle}>
            We couldn’t find that challenge. Please go back and try a different one.
          </Text>
          <PrimaryButton title="Go Back" style={styles.backButton} onPress={() => navigation.goBack()} />
        </View>
      </ScreenWrapper>
    );
  }

  const accent = isCommunityChallenge(challenge) ? challenge.theme.accent : DEFAULT_ACCENT;
  const focusChips = isCommunityChallenge(challenge)
    ? challenge.focusAreas
    : (challenge.dailyCommitments ?? []).slice(0, 3);

  return (
    <ScreenWrapper contentStyle={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton} activeOpacity={0.9} hitSlop={10}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={[styles.difficultyTag, { borderColor: accent }]}>
            <Text style={[styles.difficultyText, { color: accent }]}>
              {isCommunityChallenge(challenge)
                ? challenge.difficulty
                : (challenge.privacy ?? 'public').replace('_', ' ')}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>{challenge.title}</Text>
        <Text style={styles.subtitle}>{challenge.description}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Participants</Text>
            <Text style={styles.metaValue}>{challenge.participants.toLocaleString()}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{isCommunityChallenge(challenge) ? 'Completion' : 'Duration'}</Text>
            <Text style={styles.metaValue}>
              {isCommunityChallenge(challenge) ? `${challenge.completion}%` : formatDuration(challenge)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{isCommunityChallenge(challenge) ? 'Boost' : 'Reward'}</Text>
            <Text style={[styles.metaValue, { color: accent }]}>{formatReward(challenge)}</Text>
          </View>
        </View>

        {focusChips.length ? (
          <View style={styles.focusChipsRow}>
            {focusChips.map(area => (
              <View key={area} style={[styles.focusChip, { borderColor: accent }]}>
                <Text style={[styles.focusChipText, { color: accent }]}>{area}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {infoSections
          .filter(section => section.items.length)
          .map(section => (
            <View key={section.title} style={styles.infoCard}>
              <Text style={styles.sectionLabel}>{section.title}</Text>
              {section.items.map(item => (
                <View key={item} style={styles.bulletRow}>
                  <Text style={[styles.bulletIcon, { color: accent }]}>•</Text>
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          ))}

        <View style={styles.feedCard}>
          <Text style={styles.sectionLabel}>Challenge Feed</Text>
          <Text style={styles.sectionValue}>Push each other and share receipts.</Text>
          <View style={styles.feedComposer}>
            <TextInput
              style={styles.feedInput}
              placeholder="Drop a win, invite, or habit receipt…"
              placeholderTextColor="#94a3b8"
              multiline
              value={newPostBody}
              onChangeText={setNewPostBody}
            />
            <TouchableOpacity
              style={[styles.feedButton, postingUpdate && styles.feedButtonDisabled]}
              onPress={handlePostToFeed}
              disabled={postingUpdate}
            >
              {postingUpdate ? <ActivityIndicator color="#fff" /> : <Text style={styles.feedButtonText}>Push</Text>}
            </TouchableOpacity>
          </View>
          {postError ? <Text style={styles.errorText}>{postError}</Text> : null}
          {feedLoading ? (
            <View style={styles.feedLoadingRow}>
              <ActivityIndicator color={accent} />
              <Text style={[styles.loaderText, { color: accent }]}>Loading feed…</Text>
            </View>
          ) : feedPosts.length ? (
            feedPosts.map(post => (
              <View key={post.id} style={styles.feedPost}>
                <View style={styles.feedPostHeader}>
                  <Text style={styles.feedPostAuthor}>{post.authorName}</Text>
                  <Text style={styles.feedPostDate}>{new Date(post.createdAt).toLocaleString()}</Text>
                </View>
                <Text style={styles.feedPostBody}>{post.body}</Text>
                {Object.keys(post.reactions ?? {}).length ? (
                  <View style={styles.reactionsRow}>
                    {Object.entries(post.reactions).map(([emoji, count]) => (
                      <View key={emoji} style={styles.reactionChip}>
                        <Text style={styles.reactionText}>
                          {emoji} {count}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={styles.sectionValue}>No posts yet. Be the first to hype the squad.</Text>
          )}
        </View>

        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>Ready to commit?</Text>
          <Text style={styles.footerSubtitle}>
            Join now to add this challenge to your dashboard and earn the streak boost when you finish.
          </Text>
          {demoMode && (
            <Text style={styles.demoBanner}>You’re viewing a demo. Sign in to save challenge progress.</Text>
          )}

          {joinState === 'joining' && (
            <View style={styles.loaderRow}>
              <ActivityIndicator color={accent} />
              <Text style={[styles.loaderText, { color: accent }]}>{STATUS_MESSAGES.joining}</Text>
            </View>
          )}

          {errorMessage && joinState !== 'joining' && (
            <Text style={styles.errorText}>{errorMessage}</Text>
          )}

          {joinState === 'joined' ? (
            <View style={styles.joinedActions}>
              <PrimaryButton
                title="Track Progress"
                style={[styles.joinedButton, { backgroundColor: accent }]}
                onPress={() => navigation.navigate('ChallengeProgress', { challengeId: resolvedId })}
                textStyle={styles.joinedButtonText}
              />
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('Community', { initialTab: 'Challenges' })}
                activeOpacity={0.9}
              >
                <Text style={styles.secondaryButtonText}>Back to Challenges</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <PrimaryButton
              title="Join Challenge"
              style={[styles.joinButton, { backgroundColor: accent }]}
              onPress={handleJoinChallenge}
              disabled={joinState === 'joining'}
              textStyle={styles.joinButtonText}
            />
          )}

          <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.9}>
            <Text style={styles.shareButtonText}>{sharePayload ? 'Share challenge' : 'Copy invite link'}</Text>
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.space_5,
    paddingBottom: SPACING.space_6,
    paddingTop: SPACING.space_4,
    gap: SPACING.space_4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
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
  difficultyTag: {
    borderRadius: 999,
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_1,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
  },
  difficultyText: {
    ...TYPOGRAPHY.Subtext,
    letterSpacing: 0.4,
  },
  title: {
    ...TYPOGRAPHY.H1,
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.space_2,
  },
  subtitle: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    gap: SPACING.space_4,
    marginTop: SPACING.space_2,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  metaValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  focusChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.space_2,
  },
  focusChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_1,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  focusChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: 18,
    padding: SPACING.space_4,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    gap: SPACING.space_2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionValue: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.space_2,
  },
  bulletIcon: {
    fontSize: 18,
    color: COLORS.ACCENT_GRADIENT_START,
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 20,
  },
  feedCard: {
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: 18,
    padding: SPACING.space_4,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    gap: SPACING.space_3,
  },
  feedComposer: {
    borderWidth: 1.4,
    borderColor: COLORS.GLASS_BORDER,
    borderRadius: 18,
    backgroundColor: '#fff',
    padding: SPACING.space_3,
    gap: SPACING.space_2,
  },
  feedInput: {
    minHeight: 80,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  feedButton: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.ACCENT_GRADIENT_START,
    paddingHorizontal: SPACING.space_4,
    paddingVertical: SPACING.space_1,
    borderRadius: 16,
  },
  feedButtonDisabled: {
    opacity: 0.6,
  },
  feedButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  feedLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  feedPost: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    padding: SPACING.space_3,
    gap: SPACING.space_2,
    backgroundColor: '#fff',
  },
  feedPostHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedPostAuthor: {
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  feedPostDate: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  feedPostBody: {
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 20,
  },
  reactionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.space_1,
  },
  reactionChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    paddingHorizontal: SPACING.space_2,
    paddingVertical: SPACING.space_1,
    backgroundColor: COLORS.BACKGROUND_MAIN,
  },
  reactionText: {
    fontSize: 12,
    color: COLORS.TEXT_PRIMARY,
  },
  footerCard: {
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: 20,
    padding: SPACING.space_5,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    gap: SPACING.space_3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  footerTitle: {
    ...TYPOGRAPHY.H2,
    color: COLORS.TEXT_PRIMARY,
  },
  footerSubtitle: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  demoBanner: {
    marginTop: SPACING.space_1,
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  loaderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#b42318',
    fontSize: 14,
  },
  joinedActions: {
    gap: SPACING.space_3,
  },
  joinButton: {
    height: 54,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.BACKGROUND_MAIN,
  },
  joinedButton: {
    height: 54,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinedButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.BACKGROUND_MAIN,
  },
  secondaryButton: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  shareButton: {
    marginTop: SPACING.space_3,
    borderWidth: 1.4,
    borderColor: COLORS.TEXT_PRIMARY,
    borderRadius: 16,
    paddingVertical: SPACING.space_2,
    alignItems: 'center',
  },
  shareButtonText: {
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  missingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.space_5,
    gap: SPACING.space_3,
  },
  missingTitle: {
    ...TYPOGRAPHY.H2,
    color: COLORS.TEXT_PRIMARY,
  },
  missingSubtitle: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: SPACING.space_5,
    paddingVertical: SPACING.space_3,
    borderRadius: 999,
  },
});
