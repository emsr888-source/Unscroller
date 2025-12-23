import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import {
  blockUser,
  BuildProject,
  BuildUpdate,
  BuildUpdateComment,
  commentOnBuildUpdate,
  followBuildProject,
  getBuildUpdateThread,
  likeBuildUpdate,
  reportBuildUpdate,
  unfollowBuildProject,
  unlikeBuildUpdate,
} from '@/services/communityService';

const formatDate = (iso: string) => new Date(iso).toLocaleString();

const getDisplayName = (profile?: { full_name?: string | null; username?: string | null }) => {
  if (!profile) return 'Creator';
  return profile.full_name || profile.username || 'Creator';
};

type Props = NativeStackScreenProps<RootStackParamList, 'BuildUpdateThread'>;

const BuildUpdateThreadScreen: React.FC<Props> = ({ navigation, route }) => {
  const { updateId, initialProject, initialUpdate } = route.params;
  const [project, setProject] = useState<BuildProject | null>(initialProject || null);
  const [update, setUpdate] = useState<BuildUpdate | null>(initialUpdate || null);
  const [loading, setLoading] = useState(!initialUpdate);
  const [refreshing, setRefreshing] = useState(false);
  const [commentValue, setCommentValue] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const loadThread = useCallback(async () => {
    try {
      const data = await getBuildUpdateThread(updateId);
      setProject(data.project);
      setUpdate(data.update);
    } catch (error) {
      Alert.alert('Unable to load update', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [updateId]);

  useEffect(() => {
    if (!initialUpdate) {
      loadThread();
    }
  }, [loadThread, initialUpdate]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadThread();
  };

  const handleToggleFollow = async () => {
    if (!project) return;
    try {
      if (project.is_following) {
        await unfollowBuildProject(project.id);
      } else {
        await followBuildProject(project.id);
      }
      loadThread();
    } catch (error) {
      Alert.alert('Unable to update follow', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const handleLikeToggle = async () => {
    if (!update) return;
    try {
      if (update.liked_by_user) {
        await unlikeBuildUpdate(update.id);
      } else {
        await likeBuildUpdate(update.id);
      }
      loadThread();
    } catch (error) {
      Alert.alert('Unable to update like', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const handleReportOrBlock = (targetUserId: string) => {
    Alert.alert('Keep the community safe', 'Choose an action', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report update',
        onPress: async () => {
          try {
            await reportBuildUpdate(updateId, 'inappropriate');
            Alert.alert('Reported', 'Thanks for helping us moderate.');
          } catch (error) {
            Alert.alert('Unable to report', error instanceof Error ? error.message : 'Please try again.');
          }
        },
      },
      {
        text: 'Block user',
        style: 'destructive',
        onPress: async () => {
          try {
            await blockUser(targetUserId);
            Alert.alert('User blocked', 'They can no longer interact with you.');
          } catch (error) {
            Alert.alert('Unable to block user', error instanceof Error ? error.message : 'Please try again.');
          }
        },
      },
    ]);
  };

  const handleSubmitComment = async () => {
    if (!update || !commentValue.trim()) return;
    setSubmittingComment(true);
    try {
      const comment = await commentOnBuildUpdate(update.id, commentValue.trim());
      setUpdate(prev => (prev ? { ...prev, comments: [...prev.comments, comment as BuildUpdateComment] } : prev));
      setCommentValue('');
    } catch (error) {
      Alert.alert('Unable to comment', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const comments = useMemo(() => update?.comments ?? [], [update]);

  if (loading && (!project || !update)) {
    return (
      <ScreenWrapper contentStyle={styles.loaderWrapper}>
        <ActivityIndicator color={COLORS.ACCENT_GRADIENT_START} />
      </ScreenWrapper>
    );
  }

  if (!project || !update) {
    return (
      <ScreenWrapper contentStyle={styles.loaderWrapper}>
        <Text style={styles.errorText}>Update unavailable.</Text>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper contentStyle={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl tintColor={COLORS.TEXT_PRIMARY} refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Update Thread</Text>
          <TouchableOpacity style={styles.blockButton} onPress={() => handleReportOrBlock(update.author.id)}>
            <Text style={styles.blockText}>⋯</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.projectCard}>
          <Text style={styles.projectLabel}>Project</Text>
          <Text style={styles.projectTitle}>{project.title}</Text>
          <Text style={styles.projectSummary}>{project.summary}</Text>
          {project.goal ? <Text style={styles.projectMeta}>🎯 {project.goal}</Text> : null}
          {project.tags?.length ? <Text style={styles.projectMeta}># {project.tags.join(', ')}</Text> : null}
          <View style={styles.metaRow}>
            <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: project.owner.id })}>
              <Text style={styles.ownerName}>{getDisplayName(project.owner)}</Text>
            </TouchableOpacity>
            <Text style={styles.followers}>{project.followers_count} followers</Text>
          </View>
          <TouchableOpacity style={styles.followChip} onPress={handleToggleFollow}>
            <Text style={styles.followChipText}>{project.is_following ? 'Following' : 'Follow project'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.updateCard}>
          <View style={styles.updateHeader}>
            <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: update.author.id })}>
              <Text style={styles.updateAuthor}>{getDisplayName(update.author)}</Text>
            </TouchableOpacity>
            <Text style={styles.timestamp}>{formatDate(update.created_at)}</Text>
          </View>
          <Text style={styles.updateContent}>{update.content}</Text>
          {typeof update.progress_percent === 'number' ? <Text style={styles.updateMeta}>Progress: {update.progress_percent}%</Text> : null}
          {update.milestone ? <Text style={styles.updateMeta}>Milestone: {update.milestone}</Text> : null}
          <View style={styles.updateActions}>
            <TouchableOpacity onPress={handleLikeToggle}>
              <Text style={[styles.actionText, update.liked_by_user && styles.actionTextActive]}>❤️ {update.likes}</Text>
            </TouchableOpacity>
            <Text style={styles.actionText}>💬 {comments.length}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Comments</Text>
        </View>

        {comments.length === 0 ? (
          <Text style={styles.emptyText}>No comments yet. Start the conversation!</Text>
        ) : (
          comments.map(comment => (
            <View key={comment.id} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentAuthor}>{getDisplayName(comment.author)}</Text>
                <Text style={styles.commentTimestamp}>{formatDate(comment.created_at)}</Text>
              </View>
              <Text style={styles.commentBody}>{comment.content}</Text>
            </View>
          ))
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          style={styles.composerInput}
          placeholder="Share your thoughts"
          placeholderTextColor={COLORS.TEXT_SECONDARY}
          value={commentValue}
          onChangeText={setCommentValue}
        />
        <TouchableOpacity
          style={[styles.composerButton, (!commentValue.trim() || submittingComment) && styles.composerButtonDisabled]}
          disabled={!commentValue.trim() || submittingComment}
          onPress={handleSubmitComment}
        >
          {submittingComment ? <ActivityIndicator color={COLORS.BACKGROUND_MAIN} size="small" /> : <Text style={styles.composerButtonText}>Send</Text>}
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_MAIN,
  },
  loaderWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.BACKGROUND_MAIN,
  },
  errorText: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.space_5,
    paddingBottom: SPACING.space_7,
    gap: SPACING.space_4,
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
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: COLORS.TEXT_PRIMARY,
  },
  headerTitle: {
    ...TYPOGRAPHY.H4,
    color: COLORS.TEXT_PRIMARY,
  },
  blockButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockText: {
    fontSize: 18,
    color: COLORS.TEXT_PRIMARY,
  },
  projectCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    padding: SPACING.space_5,
    gap: SPACING.space_2,
  },
  projectLabel: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    textTransform: 'uppercase',
  },
  projectTitle: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
  },
  projectSummary: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_PRIMARY,
  },
  projectMeta: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ownerName: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
  followers: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  followChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.space_4,
    paddingVertical: SPACING.space_1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.ACCENT_GRADIENT_START,
  },
  followChipText: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.ACCENT_GRADIENT_START,
    fontWeight: '600',
  },
  updateCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    padding: SPACING.space_5,
    gap: SPACING.space_2,
  },
  updateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  updateAuthor: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
  timestamp: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  updateContent: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_PRIMARY,
  },
  updateMeta: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  updateActions: {
    flexDirection: 'row',
    gap: SPACING.space_4,
    marginTop: SPACING.space_2,
  },
  actionText: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  actionTextActive: {
    color: COLORS.ACCENT_GRADIENT_START,
    fontWeight: '600',
  },
  sectionHeader: {
    marginTop: SPACING.space_2,
  },
  sectionTitle: {
    ...TYPOGRAPHY.H4,
    color: COLORS.TEXT_PRIMARY,
  },
  emptyText: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
  },
  commentCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    padding: SPACING.space_4,
    gap: SPACING.space_1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  commentAuthor: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
  commentTimestamp: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  commentBody: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_PRIMARY,
  },
  bottomSpacer: {
    height: SPACING.space_7,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_3,
    padding: SPACING.space_4,
    borderTopWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    backgroundColor: COLORS.BACKGROUND_MAIN,
  },
  composerInput: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: 20,
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_2,
    color: COLORS.TEXT_PRIMARY,
  },
  composerButton: {
    paddingHorizontal: SPACING.space_4,
    paddingVertical: SPACING.space_2,
    borderRadius: 999,
    backgroundColor: COLORS.ACCENT_GRADIENT_START,
  },
  composerButtonDisabled: {
    backgroundColor: 'rgba(77,161,255,0.4)',
  },
  composerButtonText: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.BACKGROUND_MAIN,
    fontWeight: '600',
  },
});

export default BuildUpdateThreadScreen;
