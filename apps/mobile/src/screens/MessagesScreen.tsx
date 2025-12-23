import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { SPACING } from '@/core/theme/spacing';
import { SafeAreaView } from 'react-native-safe-area-context';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorCard from '@/components/watercolor/WatercolorCard';
import WatercolorButton from '@/components/watercolor/WatercolorButton';
import {
  fetchFriends,
  fetchThreads,
  MessageThread,
  ProfilePreview,
} from '@/services/messageService';

type Props = NativeStackScreenProps<RootStackParamList, 'Messages'>;
const formatRelativeTime = (isoDate: string) => {
  const date = new Date(isoDate);
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const getDisplayName = (profile: ProfilePreview) =>
  profile.full_name || profile.username || 'Creator';

const getAvatarLabel = (profile: ProfilePreview) => {
  const source = profile.avatar_url || getDisplayName(profile);
  return source?.trim()?.charAt(0)?.toUpperCase() || '👤';
};

export default function MessagesScreen({ navigation }: Props) {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [friendsVisible, setFriendsVisible] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friends, setFriends] = useState<ProfilePreview[]>([]);

  const loadThreads = useCallback(async () => {
    try {
      const data = await fetchThreads();
      setThreads(data);
    } catch (error) {
      Alert.alert('Unable to load messages', error instanceof Error ? error.message : 'Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadFriends = useCallback(async () => {
    setFriendsLoading(true);
    try {
      const data = await fetchFriends();
      setFriends(data);
    } catch (error) {
      Alert.alert('Unable to load friends', error instanceof Error ? error.message : 'Try again later.');
    } finally {
      setFriendsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadThreads();
    }, [loadThreads]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadThreads();
  };

  const openThread = (thread: MessageThread) => {
    setThreads(prev =>
      prev.map(item =>
        item.partner.id === thread.partner.id ? { ...item, unreadCount: 0 } : item,
      ),
    );
    navigation.navigate('DirectMessageThread', {
      partnerId: thread.partner.id,
      partnerName: getDisplayName(thread.partner),
      avatar: thread.partner.avatar_url || null,
    });
  };

  const openCompose = () => {
    setFriendsVisible(true);
    if (friends.length === 0) {
      loadFriends();
    }
  };

  const selectFriend = (friend: ProfilePreview) => {
    setFriendsVisible(false);
    navigation.navigate('DirectMessageThread', {
      partnerId: friend.id,
      partnerName: getDisplayName(friend),
      avatar: friend.avatar_url || null,
    });
  };

  const threadContent = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#0ea5e9" />
          <Text style={styles.loadingText}>Syncing your chats…</Text>
        </View>
      );
    }

    if (!threads.length) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySubtitle}>Reach out to your buddy or community friends to get started.</Text>
        </View>
      );
    }

    return threads.map(thread => (
      <TouchableOpacity
        key={thread.partner.id}
        style={[styles.messageCard, thread.unreadCount > 0 && styles.messageCardUnread]}
        onPress={() => openThread(thread)}
        activeOpacity={0.9}
      >
        <View style={styles.avatarBubble}>
          <Text style={styles.avatarText}>{getAvatarLabel(thread.partner)}</Text>
        </View>
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Text style={styles.userName}>{getDisplayName(thread.partner)}</Text>
            <Text style={styles.time}>
              {thread.lastMessage ? formatRelativeTime(thread.lastMessage.created_at) : '—'}
            </Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {thread.lastMessage ? thread.lastMessage.content : 'Say hello and keep each other on track.'}
          </Text>
        </View>
        {thread.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{thread.unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    ));
  }, [loading, threads]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton} hitSlop={10}>
            <Text style={styles.iconLabel}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
          <WatercolorButton color="yellow" onPress={openCompose} style={styles.composeButton}>
            <Text style={styles.composeText}>New chat</Text>
          </WatercolorButton>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#1f2937" />}
          showsVerticalScrollIndicator={false}
        >
          {threadContent}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>

      <Modal visible={friendsVisible} transparent animationType="slide" onRequestClose={() => setFriendsVisible(false)}>
        <View style={styles.modalOverlay}>
          <WatercolorCard style={styles.modalContent} backgroundColor="#fff">
            <Text style={styles.modalTitle}>Start a new chat</Text>
            {friendsLoading ? (
              <ActivityIndicator color="#fb7185" />
            ) : friends.length === 0 ? (
              <Text style={styles.emptySubtitle}>No friends yet. Pair up in the Collaboration Hub!</Text>
            ) : (
              <ScrollView style={styles.friendsList} showsVerticalScrollIndicator={false}>
                {friends.map(friend => (
                  <TouchableOpacity key={friend.id} style={styles.friendRow} onPress={() => selectFriend(friend)}>
                    <View style={styles.avatarBubbleSmall}>
                      <Text style={styles.avatarText}>{getAvatarLabel(friend)}</Text>
                    </View>
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>{getDisplayName(friend)}</Text>
                      {friend.username ? <Text style={styles.friendHandle}>@{friend.username}</Text> : null}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <WatercolorButton color="neutral" onPress={() => setFriendsVisible(false)}>
              <Text style={styles.cancelText}>Close</Text>
            </WatercolorButton>
          </WatercolorCard>
        </View>
      </Modal>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.space_4,
    paddingTop: SPACING.space_3,
    paddingBottom: SPACING.space_3,
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
    fontSize: 22,
    color: '#1f2937',
  },
  headerTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 30,
    color: '#1f2937',
  },
  composeButton: {
    minWidth: 110,
  },
  composeText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.space_5,
    paddingTop: SPACING.space_2,
    paddingBottom: SPACING.space_5,
    gap: SPACING.space_3,
  },
  threadTouchable: {
    marginBottom: SPACING.space_2,
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_3,
  },
  messageCardUnread: {
    backgroundColor: '#eef2ff',
  },
  avatarBubble: {
    width: 52,
    height: 52,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBubbleSmall: {
    width: 44,
    height: 44,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    color: '#1f2937',
  },
  messageContent: {
    flex: 1,
    gap: SPACING.space_1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  time: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#64748b',
  },
  lastMessage: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  unreadBadge: {
    minWidth: 28,
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#fecdd3',
    alignItems: 'center',
  },
  unreadBadgeText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#1f2937',
  },
  bottomSpacing: {
    height: SPACING.space_4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.space_7,
    gap: SPACING.space_2,
  },
  loadingText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  emptyState: {
    alignItems: 'center',
    gap: SPACING.space_2,
    paddingVertical: SPACING.space_6,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 22,
    color: '#1f2937',
  },
  emptySubtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 15,
    textAlign: 'center',
    color: '#475569',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    gap: SPACING.space_3,
  },
  modalTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 22,
    color: '#1f2937',
  },
  friendsList: {
    maxHeight: 280,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_3,
    paddingVertical: SPACING.space_2,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  friendHandle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 15,
    color: '#64748b',
  },
  cancelText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
});
