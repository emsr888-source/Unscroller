import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TextInput, useWindowDimensions, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';

type Props = NativeStackScreenProps<RootStackParamList, 'Friends'>;

const FRIENDS = [
  { id: 1, name: 'Alex', avatar: '👨‍💻', streak: 45, status: 'online', building: 'Mobile app' },
  { id: 2, name: 'Sarah', avatar: '👩‍🎨', streak: 90, status: 'building', building: 'Design portfolio' },
  { id: 3, name: 'Mike', avatar: '🏃', streak: 7, status: 'offline', building: 'Fitness blog' },
  { id: 4, name: 'Emma', avatar: '👩‍💼', streak: 30, status: 'online', building: 'Startup MVP' },
];

export default function FriendsScreen({ navigation }: Props) {
  const { height } = useWindowDimensions();
  const isCompact = height < 720;
  const [selectedTab, setSelectedTab] = useState('Friends');

  return (
    <ScreenWrapper contentStyle={isCompact ? styles.safeAreaCompact : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />
      
      <View style={styles.stars}>
        {Array.from({ length: 50 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.star,
              {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5 + 0.3,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={10}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Friends</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.tabBar}>
        {['Friends', 'Requests'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.tabActive]}
            onPress={() => setSelectedTab(tab)}
            activeOpacity={0.9}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {selectedTab === 'Friends' && (
          <>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search friends..."
                placeholderTextColor={COLORS.TEXT_SECONDARY}
              />
            </View>

            <View style={styles.friendsList}>
              {FRIENDS.map(friend => (
                <TouchableOpacity key={friend.id} style={styles.friendCard} activeOpacity={0.92}>
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendAvatar}>{friend.avatar}</Text>
                    <View style={styles.friendDetails}>
                      <View style={styles.friendHeader}>
                        <Text style={styles.friendName}>{friend.name}</Text>
                        <View style={[
                          styles.statusDot,
                          friend.status === 'online' && styles.statusOnline,
                          friend.status === 'building' && styles.statusBuilding,
                        ]} />
                      </View>
                      <View style={styles.friendMeta}>
                        <View style={styles.streakBadge}>
                          <Text style={styles.streakIcon}>🔥</Text>
                          <Text style={styles.streakText}>{friend.streak} days</Text>
                        </View>
                        <Text style={styles.buildingText}>Building: {friend.building}</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.messageButton} activeOpacity={0.9}>
                    <Text style={styles.messageIcon}>💬</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {selectedTab === 'Requests' && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No Requests</Text>
            <Text style={styles.emptyText}>
              You'll see friend requests here
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safeAreaCompact: {
    // Compact layout adjustments
  },
  stars: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: COLORS.ACCENT_GRADIENT_START,
    borderRadius: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_5,
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
    borderColor: COLORS.GLASS_BORDER,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backIcon: {
    fontSize: 28,
    color: COLORS.TEXT_PRIMARY,
  },
  headerTitle: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
  },
  placeholder: {
    width: 40,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.space_5,
    marginBottom: SPACING.space_4,
    gap: SPACING.space_2,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.space_3,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tabActive: {
    backgroundColor: 'rgba(77, 161, 255, 0.12)',
    borderColor: 'rgba(77, 161, 255, 0.4)',
  },
  tabText: {
    ...TYPOGRAPHY.Subtext,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
  },
  tabTextActive: {
    color: COLORS.TEXT_PRIMARY,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.space_6,
  },
  searchContainer: {
    paddingHorizontal: SPACING.space_5,
    marginBottom: SPACING.space_4,
  },
  searchInput: {
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: 14,
    paddingHorizontal: SPACING.space_4,
    paddingVertical: SPACING.space_3,
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  friendsList: {
    paddingHorizontal: SPACING.space_5,
    gap: SPACING.space_3,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: 18,
    padding: SPACING.space_4,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.space_3,
  },
  friendAvatar: {
    fontSize: 40,
  },
  friendDetails: {
    flex: 1,
    gap: SPACING.space_1,
  },
  friendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  friendName: {
    ...TYPOGRAPHY.Body,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.GLASS_BORDER,
  },
  statusOnline: {
    backgroundColor: COLORS.SUCCESS_GREEN,
  },
  statusBuilding: {
    backgroundColor: '#ff9500',
  },
  friendMeta: {
    gap: SPACING.space_1,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_1,
  },
  streakIcon: {
    fontSize: 12,
  },
  streakText: {
    fontSize: 12,
    color: '#ff9500',
    fontWeight: '600',
  },
  buildingText: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(77, 161, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(77, 161, 255, 0.35)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  messageIcon: {
    fontSize: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_7,
    gap: SPACING.space_3,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    marginHorizontal: SPACING.space_5,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyIcon: {
    fontSize: 64,
  },
  emptyTitle: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
  },
  emptyText: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: SPACING.space_6,
  },
});
