import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { PrimaryButton } from '@/features/onboarding/components/PrimaryButton';
import {
  followUser,
  getUserProfile,
  unfollowUser,
  uploadAvatar,
  UserProfileResponse,
} from '@/services/messageService';
import { RootStackParamList } from '@/navigation/AppNavigator';

const AVATAR_SIZE = 96;

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString();
};

const UserProfileScreen: React.FC<Props> = ({ navigation, route }) => {
  const { userId } = route.params;
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const data = await getUserProfile(userId);
      setProfile(data);
    } catch (error) {
      Alert.alert('Unable to load profile', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const handleFollowToggle = async () => {
    if (!profile) return;
    try {
      if (profile.relationships.isFollowing) {
        await unfollowUser(profile.profile.id);
      } else {
        await followUser(profile.profile.id);
      }
      loadProfile();
    } catch (error) {
      Alert.alert('Unable to update follow', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const handleMessage = () => {
    if (!profile) return;
    navigation.navigate('DirectMessageThread', {
      partnerId: profile.profile.id,
      partnerName: profile.profile.full_name || profile.profile.username || 'Creator',
      avatar: profile.profile.avatar_url || null,
    });
  };

  const handleChangeAvatar = async () => {
    if (!profile?.relationships.isSelf) return;
    try {
      setUploadingAvatar(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        base64: true,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.length || !result.assets[0].base64) {
        setUploadingAvatar(false);
        return;
      }
      const asset = result.assets[0];
      await uploadAvatar(asset.base64, asset.mimeType || 'image/jpeg');
      loadProfile();
    } catch (error) {
      Alert.alert('Upload failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const posts = useMemo(() => {
    if (!profile) return [];
    return [
      ...profile.partnershipPosts.map(post => ({
        id: `partner-${post.id}`,
        type: 'partnership' as const,
        title: post.headline,
        subtitle: post.project_summary,
        timestamp: post.updated_at,
        meta: `${post.applications_count} applicants`,
      })),
      ...profile.buildProjects.map(project => ({
        id: `build-${project.id}`,
        type: 'build' as const,
        title: project.title,
        subtitle: project.summary,
        timestamp: project.created_at,
        meta: `${project.followers_count} followers`,
      })),
    ];
  }, [profile]);

  if (loading && !profile) {
    return (
      <ScreenWrapper contentStyle={styles.loaderWrapper}>
        <ActivityIndicator color={COLORS.ACCENT_GRADIENT_START} />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper contentStyle={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.TEXT_PRIMARY} />}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCard}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={handleChangeAvatar} disabled={!profile?.relationships.isSelf}>
            {profile?.profile.avatar_url ? (
              <Image source={{ uri: profile.profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarEmoji}>😊</Text>
              </View>
            )}
            {profile?.relationships.isSelf ? (
              <Text style={styles.avatarHint}>{uploadingAvatar ? 'Uploading…' : 'Change photo'}</Text>
            ) : null}
          </TouchableOpacity>
          <Text style={styles.name}>{profile?.profile.full_name || profile?.profile.username || 'Creator'}</Text>
          {profile?.profile.username ? <Text style={styles.username}>@{profile.profile.username}</Text> : null}
          {profile?.profile.bio ? <Text style={styles.bio}>{profile.profile.bio}</Text> : null}
          {profile?.profile.current_project ? (
            <Text style={styles.currentProject}>🚀 Building {profile.profile.current_project}</Text>
          ) : null}
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{profile?.profile.current_streak ?? 0}</Text>
              <Text style={styles.statLabel}>Day streak</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{profile?.stats.followers ?? 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{profile?.stats.following ?? 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            {!profile?.relationships.isSelf ? (
              <PrimaryButton
                style={styles.actionButton}
                title={profile?.relationships.isFollowing ? 'Following' : 'Follow'}
                onPress={handleFollowToggle}
              />
            ) : null}
            {!profile?.relationships.isSelf ? (
              <TouchableOpacity style={styles.secondaryAction} onPress={handleMessage}>
                <Text style={styles.secondaryActionText}>Message</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Posts & Builds</Text>
          <Text style={styles.sectionSubtitle}>Tap a card to view the thread.</Text>
        </View>

        {posts.length === 0 ? (
          <Text style={styles.emptyText}>Nothing shared yet.</Text>
        ) : (
          posts.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.postCard}
              activeOpacity={0.85}
              onPress={() =>
                item.type === 'build'
                  ? navigation.navigate('BuildProjectThread', {
                      projectId: item.id.replace('build-', ''),
                    })
                  : navigation.navigate('CollaborationHub', { initialTab: 'partnerships' })
              }
            >
              <Text style={styles.postType}>{item.type === 'build' ? 'Build in Public' : 'Partnership'}</Text>
              <Text style={styles.postTitle}>{item.title}</Text>
              <Text style={styles.postSubtitle}>{item.subtitle}</Text>
              <View style={styles.postFooter}>
                <Text style={styles.postMeta}>{item.meta}</Text>
                <Text style={styles.postTimestamp}>{formatDate(item.timestamp)}</Text>
              </View>
            </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.space_5,
    paddingBottom: SPACING.space_7,
    gap: SPACING.space_4,
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
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  avatarWrapper: {
    alignItems: 'center',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: COLORS.BACKGROUND_MAIN,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  avatarHint: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.space_1,
  },
  name: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
  },
  username: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  bio: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  currentProject: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.ACCENT_GRADIENT_START,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: SPACING.space_2,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.H4,
    color: COLORS.TEXT_PRIMARY,
  },
  statLabel: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.space_3,
    width: '100%',
    marginTop: SPACING.space_3,
  },
  actionButton: {
    flex: 1,
  },
  secondaryAction: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_2,
  },
  secondaryActionText: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    ...TYPOGRAPHY.H4,
    color: COLORS.TEXT_PRIMARY,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  emptyText: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  postCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    padding: SPACING.space_4,
    gap: SPACING.space_1,
  },
  postType: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  postTitle: {
    ...TYPOGRAPHY.H4,
    color: COLORS.TEXT_PRIMARY,
  },
  postSubtitle: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_PRIMARY,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.space_2,
  },
  postMeta: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  postTimestamp: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
});

export default UserProfileScreen;
