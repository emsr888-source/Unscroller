import React, { useCallback, useEffect, useState } from 'react';
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
  respondToBuddyRequest,
  sendBuddyRequest,
  unfollowUser,
  uploadAvatar,
  UserProfileResponse,
} from '@/services/messageService';
import { RootStackParamList } from '@/navigation/AppNavigator';
import WatercolorCard from '@/components/watercolor/WatercolorCard';
import { ProfileHubSections, buildProfileSections, HubSectionViewModel } from '@/screens/profile/ProfileHubSections';

const AVATAR_SIZE = 96;

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;

const UserProfileScreen: React.FC<Props> = ({ navigation, route }) => {
  const { userId } = route.params;
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [hubSections, setHubSections] = useState<HubSectionViewModel[]>([]);
  const [buddyActionLoading, setBuddyActionLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const data = await getUserProfile(userId);
      setProfile(data);
      setHubSections(buildProfileSections(data));
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
    if (!profile.relationships.isBuddy) {
      Alert.alert('Buddies only', 'You can only message people who have accepted your buddy request.');
      return;
    }
    navigation.navigate('DirectMessageThread', {
      partnerId: profile.profile.id,
      partnerName: profile.profile.full_name || profile.profile.username || 'Creator',
      avatar: profile.profile.avatar_url || null,
    });
  };

  const handleSendBuddyRequest = async () => {
    if (!profile) return;
    setBuddyActionLoading(true);
    try {
      await sendBuddyRequest(profile.profile.id);
      await loadProfile();
    } catch (error) {
      Alert.alert('Unable to send request', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBuddyActionLoading(false);
    }
  };

  const handleRespondToBuddyRequest = async (action: 'accept' | 'decline') => {
    if (!profile?.relationships.buddyRequestId) return;
    setBuddyActionLoading(true);
    try {
      await respondToBuddyRequest(profile.relationships.buddyRequestId, action);
      await loadProfile();
    } catch (error) {
      Alert.alert('Unable to update request', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBuddyActionLoading(false);
    }
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

  const focusGoal = profile?.profile.focus_goal?.trim();
  const buddyRequestStatus = profile?.relationships.buddyRequestStatus;
  const buddyRequestDirection = profile?.relationships.buddyRequestDirection;
  const canMessage = profile?.relationships.isBuddy;

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

        <WatercolorCard style={styles.headerCard} backgroundColor={COLORS.BACKGROUND_ELEVATED}>
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
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{profile?.stats.buddies ?? 0}</Text>
              <Text style={styles.statLabel}>Buddies</Text>
            </View>
          </View>

          {!profile?.relationships.isSelf ? (
            <View style={styles.actionsRow}>
              <PrimaryButton
                style={styles.actionButton}
                title={profile?.relationships.isFollowing ? 'Following' : 'Follow'}
                onPress={handleFollowToggle}
              />
              <TouchableOpacity
                style={[styles.secondaryAction, !canMessage && styles.secondaryActionDisabled]}
                onPress={handleMessage}
                disabled={!canMessage}
              >
                <Text style={[styles.secondaryActionText, !canMessage && styles.secondaryActionTextDisabled]}>
                  {canMessage ? 'Message' : 'Buddies only'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </WatercolorCard>

        {focusGoal ? (
          <WatercolorCard style={styles.focusCard} backgroundColor="#fff">
            <Text style={styles.sectionTitle}>30-day focus</Text>
            <Text style={styles.focusText}>{focusGoal}</Text>
          </WatercolorCard>
        ) : null}

        {!profile?.relationships.isSelf ? (
          <WatercolorCard style={styles.buddyCard} backgroundColor="#fff">
            <Text style={styles.sectionTitle}>Buddy status</Text>
            {profile?.relationships.isBuddy ? (
              <Text style={styles.buddyStatusText}>🌟 You’re buddies. Keep each other accountable!</Text>
            ) : buddyRequestStatus === 'pending' ? (
              buddyRequestDirection === 'incoming' ? (
                <View style={styles.buddyActionsRow}>
                  <Text style={styles.buddyStatusText}>This user wants to buddy up.</Text>
                  <View style={styles.buddyButtons}>
                    <TouchableOpacity
                      style={[styles.secondaryAction, styles.acceptButton]}
                      onPress={() => handleRespondToBuddyRequest('accept')}
                      disabled={buddyActionLoading}
                    >
                      <Text style={styles.secondaryActionText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.secondaryAction, styles.declineButton]}
                      onPress={() => handleRespondToBuddyRequest('decline')}
                      disabled={buddyActionLoading}
                    >
                      <Text style={styles.secondaryActionText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <Text style={styles.buddyStatusText}>Request sent. Waiting for them to accept.</Text>
              )
            ) : (
              <PrimaryButton
                title={buddyActionLoading ? 'Sending…' : 'Send buddy request'}
                onPress={handleSendBuddyRequest}
                disabled={buddyActionLoading}
              />
            )}
          </WatercolorCard>
        ) : null}

        {hubSections.length ? <ProfileHubSections sections={hubSections} navigation={navigation} /> : null}
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
  sectionTitle: {
    ...TYPOGRAPHY.H4,
    color: COLORS.TEXT_PRIMARY,
  },
  focusCard: {
    gap: SPACING.space_2,
  },
  focusText: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_PRIMARY,
  },
  buddyCard: {
    gap: SPACING.space_2,
  },
  buddyStatusText: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_PRIMARY,
  },
  buddyActionsRow: {
    gap: SPACING.space_2,
  },
  buddyButtons: {
    flexDirection: 'row',
    gap: SPACING.space_2,
  },
  secondaryActionDisabled: {
    opacity: 0.5,
  },
  secondaryActionTextDisabled: {
    color: COLORS.TEXT_SECONDARY,
  },
  acceptButton: {
    flex: 1,
    borderColor: '#16a34a',
  },
  declineButton: {
    flex: 1,
    borderColor: '#f87171',
  },
});

export default UserProfileScreen;
