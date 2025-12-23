import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { SPACING } from '@/core/theme/spacing';
import { SafeAreaView } from 'react-native-safe-area-context';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorCard from '@/components/watercolor/WatercolorCard';
import { useAppStore } from '@/store';
import { getUserProfile, updateFocusGoal, uploadAvatar, UserProfileResponse } from '@/services/messageService';
import { supabase } from '@/services/supabase';
import { ProfileHubSections, buildProfileSections, HubSectionViewModel } from '@/screens/profile/ProfileHubSections';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const { profileGoal, setProfileGoal } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('Alex Builder');
  const [bio, setBio] = useState('Building my dreams, one day at a time');
  const [currentProject, setCurrentProject] = useState('Mobile App');
  const [selectedAvatar, setSelectedAvatar] = useState('👨‍💻');
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileResponse | null>(null);
  const [hubSections, setHubSections] = useState<HubSectionViewModel[]>([]);
  const [focusGoalInput, setFocusGoalInput] = useState(profileGoal ?? '');
  const [loading, setLoading] = useState(true);
  const [savingGoal, setSavingGoal] = useState(false);

  const avatarOptions = ['👨‍💻', '👩‍💻', '🚀', '🎯', '⚡', '🔥', '💎', '🌟', '🎨', '🏆', '💪', '🧠'];

  const loadUserProfile = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setProfileData(null);
        return;
      }

      const response = await getUserProfile(user.id);
      setProfileData(response);
      setProfileImageUri(response.profile.avatar_url || null);
      setName(response.profile.full_name || 'Creator');
      setBio(response.profile.bio || '');
      setCurrentProject(response.profile.current_project || 'Focus project');
      setHubSections(buildProfileSections(response));

      const focusGoalValue = response.profile.focus_goal ?? '';
      setFocusGoalInput(focusGoalValue);
      setProfileGoal(focusGoalValue);
    } catch (error) {
      Alert.alert('Unable to load profile', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [setProfileGoal]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const displayGoal = useMemo(() => (profileGoal?.trim() ? profileGoal.trim() : ''), [profileGoal]);
  const hasUnsavedGoalChanges = useMemo(
    () => focusGoalInput.trim() !== (profileGoal ?? '').trim(),
    [focusGoalInput, profileGoal],
  );

  const persistFocusGoal = useCallback(async () => {
    if (!hasUnsavedGoalChanges) {
      return true;
    }
    setSavingGoal(true);
    const normalized = focusGoalInput.trim();
    try {
      const { focus_goal } = await updateFocusGoal(normalized || null);
      const resolved = focus_goal ?? '';
      setProfileGoal(resolved);
      setProfileData(prev =>
        prev
          ? {
              ...prev,
              profile: {
                ...prev.profile,
                focus_goal: focus_goal ?? null,
              },
            }
          : prev,
      );
      setFocusGoalInput(resolved);
      return true;
    } catch (error) {
      Alert.alert('Unable to save focus goal', error instanceof Error ? error.message : 'Please try again.');
      return false;
    } finally {
      setSavingGoal(false);
    }
  }, [focusGoalInput, hasUnsavedGoalChanges, setProfileGoal]);

  const handleEditToggle = useCallback(async () => {
    if (isEditing) {
      const saved = await persistFocusGoal();
      if (!saved) {
        return;
      }
    }
    setIsEditing(prev => !prev);
  }, [isEditing, persistFocusGoal]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos to upload a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setShowAvatarPicker(false);
      
      // Upload to Supabase
      if (asset.base64) {
        setUploadingAvatar(true);
        try {
          const response = await uploadAvatar(asset.base64, asset.mimeType || 'image/jpeg');
          if (response.avatar_url) {
            setProfileImageUri(response.avatar_url);
            Alert.alert('Success', 'Profile picture updated!');
          }
        } catch (error) {
          Alert.alert('Upload failed', 'Could not upload profile picture. Please try again.');
          console.error('Avatar upload error:', error);
        } finally {
          setUploadingAvatar(false);
        }
      } else {
        // Fallback: read file and convert to base64
        try {
          setUploadingAvatar(true);
          const base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: 'base64',
          });
          const response = await uploadAvatar(base64, asset.mimeType || 'image/jpeg');
          if (response.avatar_url) {
            setProfileImageUri(response.avatar_url);
            Alert.alert('Success', 'Profile picture updated!');
          }
        } catch (error) {
          Alert.alert('Upload failed', 'Could not upload profile picture. Please try again.');
          console.error('Avatar upload error:', error);
        } finally {
          setUploadingAvatar(false);
        }
      }
    }
  };

  if (loading && !profileData) {
    return (
      <View style={styles.loadingWrapper}>
        <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Loading your profile…</Text>
      </View>
    );
  }

  const currentStreak = profileData?.profile.current_streak ?? 0;
  const followerCount = profileData?.stats.followers ?? 0;
  const followingCount = profileData?.stats.following ?? 0;
  const buddyCount = profileData?.stats.buddies ?? 0;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton} hitSlop={10}>
              <Text style={styles.iconLabel}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity onPress={handleEditToggle} style={styles.iconButton} hitSlop={10}>
              <Text style={styles.iconLabel}>{isEditing ? '✓' : '✏️'}</Text>
            </TouchableOpacity>
          </View>

          <WatercolorCard style={styles.profileCard} backgroundColor="#fffef7">
            <View style={styles.avatarRow}>
              <TouchableOpacity 
                style={styles.avatarBubble} 
                onPress={() => isEditing && setShowAvatarPicker(!showAvatarPicker)}
                activeOpacity={isEditing ? 0.7 : 1}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <ActivityIndicator size="large" color="#0ea5e9" />
                ) : profileImageUri ? (
                  <Image source={{ uri: profileImageUri }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarEmoji}>{selectedAvatar}</Text>
                )}
                {isEditing && !uploadingAvatar && (
                  <View style={styles.editBadge}>
                    <Text style={styles.editBadgeIcon}>✏️</Text>
                  </View>
                )}
              </TouchableOpacity>
              <View style={styles.streakPill}>
                <Text style={styles.streakIcon}>🔥</Text>
                <Text style={styles.streakText}>{currentStreak} day streak</Text>
              </View>
            </View>

            {showAvatarPicker && isEditing && (
              <View style={styles.avatarPicker}>
                <Text style={styles.pickerTitle}>Choose your avatar</Text>
                
                <TouchableOpacity
                  style={styles.photoPickerButton}
                  onPress={pickImage}
                  activeOpacity={0.7}
                >
                  <Text style={styles.photoPickerIcon}>📷</Text>
                  <Text style={styles.photoPickerText}>Upload from Photos</Text>
                </TouchableOpacity>

                <View style={styles.emojiGrid}>
                  {avatarOptions.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={[
                        styles.emojiOption,
                        selectedAvatar === emoji && !profileImageUri && styles.emojiOptionSelected
                      ]}
                      onPress={() => {
                        setSelectedAvatar(emoji);
                        setProfileImageUri(null);
                        setShowAvatarPicker(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.emojiOptionText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {isEditing ? (
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor="#9ca3af"
              />
            ) : (
              <Text style={styles.nameText}>{name}</Text>
            )}

            {isEditing ? (
              <TextInput
                style={styles.bioInput}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about you"
                placeholderTextColor="#9ca3af"
                multiline
              />
            ) : (
              <>
                <Text style={styles.bioText}>{bio}</Text>
                {displayGoal ? <Text style={styles.goalBadge}>🎯 {displayGoal}</Text> : null}
              </>
            )}
          </WatercolorCard>

          <WatercolorCard style={styles.goalCard} backgroundColor="#fff">
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>30-day focus</Text>
              {!displayGoal && !isEditing ? <Text style={styles.sectionHint}>Set this in Weekly Focus</Text> : null}
            </View>
            {isEditing ? (
              <TextInput
                style={styles.goalInput}
                value={focusGoalInput}
                onChangeText={setFocusGoalInput}
                placeholder="Describe your focus"
                placeholderTextColor="#9ca3af"
              />
            ) : (
              <Text style={[styles.goalCopy, !displayGoal && styles.goalPlaceholder]}>
                {displayGoal || 'Your 30-day goal will appear here once you set it.'}
              </Text>
            )}
            {isEditing && (
              <Text style={styles.goalStatus}>{savingGoal ? 'Saving…' : hasUnsavedGoalChanges ? 'Unsaved changes' : 'Saved'}</Text>
            )}
          </WatercolorCard>

          <WatercolorCard style={styles.statsCard} backgroundColor="#fff">
            <Text style={styles.sectionTitle}>Momentum</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBubble}>
                <Text style={styles.statValue}>{currentStreak}</Text>
                <Text style={styles.statLabel}>Day streak</Text>
              </View>
              <View style={styles.statBubble}>
                <Text style={styles.statValue}>{followerCount}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statBubble}>
                <Text style={styles.statValue}>{followingCount}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
              <View style={styles.statBubble}>
                <Text style={styles.statValue}>{buddyCount}</Text>
                <Text style={styles.statLabel}>Buddies</Text>
              </View>
            </View>
          </WatercolorCard>

          <WatercolorCard style={styles.projectCard} backgroundColor="#fff">
            <Text style={styles.sectionTitle}>Currently building</Text>
            {isEditing ? (
              <TextInput
                style={styles.projectInput}
                value={currentProject}
                onChangeText={setCurrentProject}
                placeholder="What are you building?"
                placeholderTextColor="#9ca3af"
              />
            ) : (
              <View style={styles.projectRow}>
                <Text style={styles.projectIcon}>🚀</Text>
                <Text style={styles.projectText}>{currentProject}</Text>
              </View>
            )}
          </WatercolorCard>

          <WatercolorCard style={styles.actionsCard} backgroundColor="#fff">
            <Text style={styles.sectionTitle}>Quick actions</Text>
            <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('Trophy')} activeOpacity={0.9}>
              <Text style={styles.actionIcon}>🏆</Text>
              <Text style={styles.actionText}>View achievements</Text>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('Progress')} activeOpacity={0.9}>
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionText}>See progress</Text>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('Referrals')} activeOpacity={0.9}>
              <Text style={styles.actionIcon}>🎁</Text>
              <Text style={styles.actionText}>Invite friends</Text>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>
          </WatercolorCard>

          {hubSections.length ? (
            <ProfileHubSections sections={hubSections} navigation={navigation} />
          ) : null}

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
  loadingWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fdfbf7',
  },
  loadingText: {
    marginTop: SPACING.space_2,
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#475569',
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
    paddingTop: SPACING.space_4,
    gap: SPACING.space_3,
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
  iconLabel: {
    fontSize: 20,
    color: '#1f2937',
  },
  headerTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 30,
    color: '#1f2937',
  },
  profileCard: {
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  avatarRow: {
    width: '100%',
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  avatarBubble: {
    width: 110,
    height: 110,
    borderRadius: 48,
    borderWidth: 1.6,
    borderColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    position: 'relative',
  },
  avatarEmoji: {
    fontSize: 48,
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 48,
  },
  photoPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.space_2,
    padding: SPACING.space_3,
    borderRadius: 16,
    borderWidth: 1.6,
    borderColor: '#0ea5e9',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    marginBottom: SPACING.space_3,
  },
  photoPickerIcon: {
    fontSize: 24,
  },
  photoPickerText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0ea5e9',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadgeIcon: {
    fontSize: 14,
  },
  avatarPicker: {
    width: '100%',
    padding: SPACING.space_3,
    borderRadius: 16,
    borderWidth: 1.6,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    gap: SPACING.space_2,
  },
  pickerTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
    textAlign: 'center',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.space_2,
    justifyContent: 'center',
  },
  emojiOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.6,
    borderColor: '#d4d4d8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  emojiOptionSelected: {
    borderColor: '#0ea5e9',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
  },
  emojiOptionText: {
    fontSize: 32,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.space_2,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fee2e2',
  },
  streakIcon: {
    fontSize: 16,
  },
  streakText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  nameText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 32,
    color: '#1f2937',
  },
  nameInput: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 32,
    width: '100%',
    textAlign: 'center',
    borderBottomWidth: 1.2,
    borderColor: '#1f2937',
  },
  bioText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 17,
    color: '#475569',
    textAlign: 'center',
  },
  goalBadge: {
    marginTop: 4,
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#166534',
  },
  bioInput: {
    width: '100%',
    minHeight: 90,
    borderRadius: 20,
    borderWidth: 1.4,
    borderColor: '#1f2937',
    padding: SPACING.space_3,
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
    textAlignVertical: 'top',
  },
  goalCard: {
    gap: SPACING.space_2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 22,
    color: '#1f2937',
  },
  sectionHint: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#94a3b8',
  },
  goalInput: {
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    padding: SPACING.space_2,
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  goalCopy: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 17,
    color: '#1f2937',
  },
  goalStatus: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#64748b',
    marginTop: 6,
  },
  goalPlaceholder: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
  },
  statsCard: {
    gap: SPACING.space_2,
  },
  actionsCard: {
    gap: SPACING.space_2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.space_2,
  },
  statBubble: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    paddingVertical: SPACING.space_2,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  statValue: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 22,
    color: '#1f2937',
  },
  statLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#64748b',
  },
  projectCard: {
    gap: SPACING.space_2,
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  projectIcon: {
    fontSize: 22,
  },
  projectText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  projectInput: {
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    padding: SPACING.space_2,
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    padding: SPACING.space_2,
    backgroundColor: '#fff',
    marginBottom: SPACING.space_2,
  },
  actionIcon: {
    fontSize: 22,
    marginRight: SPACING.space_2,
  },
  actionText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  actionArrow: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  bottomSpacing: {
    height: SPACING.space_6,
  },
});
