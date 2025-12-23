import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import {
  BuildProject,
  BuildUpdate,
  followBuildProject,
  getBuildProject,
  likeBuildUpdate,
  unfollowBuildProject,
  unlikeBuildUpdate,
} from '@/services/communityService';
import { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'BuildProjectThread'>;

const formatDate = (iso: string) => new Date(iso).toLocaleString();

const BuildProjectThreadScreen: React.FC<Props> = ({ navigation, route }) => {
  const { projectId, initialProject } = route.params;
  const [project, setProject] = useState<BuildProject | null>(initialProject || null);
  const [loading, setLoading] = useState(!initialProject);
  const [refreshing, setRefreshing] = useState(false);

  const loadProject = useCallback(async () => {
    try {
      const data = await getBuildProject(projectId);
      setProject(data);
    } catch (error) {
      Alert.alert('Unable to load thread', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadProject();
  };

  const handleToggleFollow = async () => {
    if (!project) return;
    try {
      if (project.is_following) {
        await unfollowBuildProject(project.id);
      } else {
        await followBuildProject(project.id);
      }
      loadProject();
    } catch (error) {
      Alert.alert('Unable to update follow', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const handleLikeToggle = async (update: BuildUpdate) => {
    try {
      if (update.liked_by_user) {
        await unlikeBuildUpdate(update.id);
      } else {
        await likeBuildUpdate(update.id);
      }
      loadProject();
    } catch (error) {
      Alert.alert('Unable to update like', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const openUpdateThread = (update: BuildUpdate) => {
    navigation.navigate('BuildUpdateThread', {
      updateId: update.id,
      projectId: project?.id,
      initialProject: project || undefined,
      initialUpdate: update,
    });
  };

  if (loading && !project) {
    return (
      <ScreenWrapper contentStyle={styles.loaderWrapper}>
        <ActivityIndicator color={COLORS.ACCENT_GRADIENT_START} />
      </ScreenWrapper>
    );
  }

  if (!project) {
    return (
      <ScreenWrapper contentStyle={styles.loaderWrapper}>
        <Text style={styles.errorText}>Project unavailable.</Text>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper contentStyle={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl tintColor={COLORS.TEXT_PRIMARY} refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCard}>
          <Text style={styles.projectTitle}>{project.title}</Text>
          <Text style={styles.projectSummary}>{project.summary}</Text>
          {project.goal ? <Text style={styles.projectGoal}>🎯 Goal: {project.goal}</Text> : null}
          {project.tags?.length ? <Text style={styles.projectTags}>Tags: {project.tags.join(', ')}</Text> : null}
          <View style={styles.projectMeta}>
            <Text style={styles.projectMetaText}>Followers · {project.followers_count}</Text>
            <Text style={styles.projectMetaText}>Started · {formatDate(project.created_at)}</Text>
          </View>
          <TouchableOpacity style={styles.ownerRow} onPress={() => navigation.navigate('UserProfile', { userId: project.owner.id })}>
            <Text style={styles.ownerName}>{project.owner.full_name || project.owner.username || 'Creator'}</Text>
            <Text style={styles.ownerHandle}>@{project.owner.username || project.owner.id.substring(0, 6)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.followChip} onPress={handleToggleFollow}>
            <Text style={styles.followChipText}>{project.is_following ? 'Following' : 'Follow project'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Thread</Text>

        {project.updates.length === 0 ? (
          <Text style={styles.emptyState}>No updates yet. Stay tuned!</Text>
        ) : (
          project.updates.map(update => (
            <View key={update.id} style={styles.updateCard}>
              <View style={styles.updateHeader}>
                <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: update.author.id })}>
                  <Text style={styles.updateAuthor}>{update.author.full_name || update.author.username || 'Creator'}</Text>
                </TouchableOpacity>
                <Text style={styles.timestamp}>{formatDate(update.created_at)}</Text>
              </View>
              <Text style={styles.updateContent}>{update.content}</Text>
              {typeof update.progress_percent === 'number' ? (
                <Text style={styles.updateMeta}>Progress: {update.progress_percent}%</Text>
              ) : null}
              {update.milestone ? <Text style={styles.updateMeta}>Milestone: {update.milestone}</Text> : null}
              <View style={styles.updateActions}>
                <TouchableOpacity onPress={() => handleLikeToggle(update)}>
                  <Text style={[styles.actionText, update.liked_by_user && styles.actionTextActive]}>❤️ {update.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openUpdateThread(update)}>
                  <Text style={styles.actionText}>💬 {update.comments.length}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
  content: {
    padding: SPACING.space_5,
    gap: SPACING.space_4,
    paddingBottom: SPACING.space_7,
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
  headerCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    padding: SPACING.space_5,
    gap: SPACING.space_2,
  },
  projectTitle: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
  },
  projectSummary: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_PRIMARY,
  },
  projectGoal: {
    ...TYPOGRAPHY.Body,
    color: COLORS.ACCENT_GRADIENT_START,
  },
  projectTags: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  projectMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  projectMetaText: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_2,
    marginTop: SPACING.space_1,
  },
  ownerName: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
  ownerHandle: {
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
  sectionLabel: {
    ...TYPOGRAPHY.H4,
    color: COLORS.TEXT_PRIMARY,
  },
  emptyState: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
  },
  updateCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    padding: SPACING.space_4,
    gap: SPACING.space_1,
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
});

export default BuildProjectThreadScreen;
