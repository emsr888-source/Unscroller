import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, useWindowDimensions, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

const NOTIFICATIONS = [
  {
    id: 1,
    type: 'achievement',
    icon: '🏆',
    title: 'New Achievement Unlocked!',
    message: 'You earned "7 Days Strong"',
    time: '2h ago',
    read: false,
  },
  {
    id: 2,
    type: 'social',
    icon: '👥',
    title: 'Sarah started following you',
    message: 'Check out their builds',
    time: '5h ago',
    read: false,
  },
  {
    id: 3,
    type: 'reminder',
    icon: '⏰',
    title: 'Daily Check-In Reminder',
    message: 'Keep your streak alive!',
    time: '1d ago',
    read: true,
  },
  {
    id: 4,
    type: 'community',
    icon: '💬',
    title: 'Mike commented on your post',
    message: '"Keep building! 🚀"',
    time: '1d ago',
    read: true,
  },
  {
    id: 5,
    type: 'milestone',
    icon: '🎉',
    title: 'Streak Milestone!',
    message: '30 days scroll-free',
    time: '2d ago',
    read: true,
  },
];

export default function NotificationsScreen({ navigation }: Props) {
  const { height } = useWindowDimensions();
  const isCompact = height < 720;
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

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
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
          activeOpacity={0.9}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'unread' && styles.filterButtonActive]}
          onPress={() => setFilter('unread')}
          activeOpacity={0.9}
        >
          <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptyText}>No new notifications</Text>
          </View>
        ) : (
          filteredNotifications.map(notif => (
            <TouchableOpacity
              key={notif.id}
              style={[styles.notifCard, !notif.read && styles.notifCardUnread]}
              onPress={() => markAsRead(notif.id)}
              activeOpacity={0.9}
            >
              <View style={styles.notifIcon}>
                <Text style={styles.notifIconText}>{notif.icon}</Text>
              </View>
              <View style={styles.notifContent}>
                <Text style={styles.notifTitle}>{notif.title}</Text>
                <Text style={styles.notifMessage}>{notif.message}</Text>
                <Text style={styles.notifTime}>{notif.time}</Text>
              </View>
              {!notif.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))
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
    paddingBottom: SPACING.space_4,
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
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.space_5,
    gap: SPACING.space_3,
    marginBottom: SPACING.space_5,
  },
  filterButton: {
    flex: 1,
    paddingVertical: SPACING.space_3,
    borderRadius: 12,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  filterButtonActive: {
    backgroundColor: 'rgba(77, 161, 255, 0.12)',
    borderColor: 'rgba(77, 161, 255, 0.4)',
  },
  filterText: {
    ...TYPOGRAPHY.Subtext,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
  },
  filterTextActive: {
    color: COLORS.TEXT_PRIMARY,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.space_6,
    paddingHorizontal: SPACING.space_5,
    gap: SPACING.space_3,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.space_4,
    gap: SPACING.space_3,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  notifCardUnread: {
    backgroundColor: 'rgba(77, 161, 255, 0.12)',
    borderColor: 'rgba(77, 161, 255, 0.35)',
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(77, 161, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifIconText: {
    fontSize: 20,
  },
  notifContent: {
    flex: 1,
    gap: SPACING.space_1,
  },
  notifTitle: {
    ...TYPOGRAPHY.Body,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  notifMessage: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  notifTime: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.ACCENT_GRADIENT_START,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_7,
    gap: SPACING.space_4,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: 16,
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
  },
  bottomSpacing: {
    height: SPACING.space_6,
  },
});
