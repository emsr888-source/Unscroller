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
  fetchThreads,
  BuddyListItem,
  BuddyRequestsResponse,
  MessageThread,
  ProfilePreview,
} from '@/services/messageService';
import buddyService from '@/services/buddyService';

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
  const [buddiesLoading, setBuddiesLoading] = useState(false);
  const [buddyRequestsLoading, setBuddyRequestsLoading] = useState(false);
  const [buddies, setBuddies] = useState<BuddyListItem[]>([]);
  const [buddyRequests, setBuddyRequests] = useState<BuddyRequestsResponse | null>(null);
  const [requestActionId, setRequestActionId] = useState<string | null>(null);

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

  const loadBuddies = useCallback(
    async (force = false) => {
      setBuddiesLoading(true);
      try {
        const list = await buddyService.listBuddies({ force });
        setBuddies(list);
      } catch (error) {
        Alert.alert('Unable to load buddies', error instanceof Error ? error.message : 'Try again later.');
      } finally {
        setBuddiesLoading(false);
      }
    },
    [],
  );

  const loadBuddyRequests = useCallback(async () => {
    setBuddyRequestsLoading(true);
    try {
      const requests = await buddyService.getBuddyRequests();
      setBuddyRequests(requests);
    } catch (error) {
      Alert.alert('Unable to load buddy requests', error instanceof Error ? error.message : 'Try again later.');
    } finally {
      setBuddyRequestsLoading(false);
    }
  }, []);

  const handleBuddyRequestAction = useCallback(
    async (requestId: string, action: 'accept' | 'decline') => {
      setRequestActionId(requestId);
      try {
        await buddyService.respondToRequest(requestId, action);
        await Promise.all([loadBuddyRequests(), loadBuddies(true)]);
      } catch (error) {
        Alert.alert('Unable to update request', error instanceof Error ? error.message : 'Try again later.');
      } finally {
        setRequestActionId(null);
      }
    },
    [loadBuddyRequests, loadBuddies],
  );

  useFocusEffect(
    useCallback(() => {
      loadThreads();
      loadBuddies(true);
      loadBuddyRequests();
    }, [loadThreads, loadBuddies, loadBuddyRequests]),
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
    if (!buddies.length) {
      loadBuddies();
    }
  };

  const selectBuddy = (buddyEntry: BuddyListItem) => {
    setFriendsVisible(false);
    navigation.navigate('DirectMessageThread', {
      partnerId: buddyEntry.buddy.id,
      partnerName: getDisplayName(buddyEntry.buddy),
      avatar: buddyEntry.buddy.avatar_url || null,
    });
  };

  const renderBuddyRequestCard = () => {
    if (buddyRequestsLoading && !buddyRequests) {
      return (
        <WatercolorCard style={styles.requestCard} backgroundColor="#fff">
          <ActivityIndicator color="#0ea5e9" />
        </WatercolorCard>
      );
    }
    if (
      !buddyRequests ||
      (buddyRequests.incoming.length === 0 && buddyRequests.outgoing.length === 0)
    ) {
      return null;
    }

    const formatRequestName = (preview: ProfilePreview) =>
      preview.full_name || preview.username || 'Creator';

    return (
      <WatercolorCard style={styles.requestCard} backgroundColor="#fff">
        <Text style={styles.requestTitle}>Buddy requests</Text>
        {buddyRequests.incoming.length ? (
          <View style={styles.requestSection}>
            <Text style={styles.requestSectionLabel}>Incoming</Text>
            {buddyRequests.incoming.map(request => (
              <View key={request.id} style={styles.requestRow}>
                <View style={styles.requestInfo}>
                  <Text style={styles.friendName}>{formatRequestName(request.from_user)}</Text>
                  <Text style={styles.friendHandle}>
                    Sent {new Date(request.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.requestButtons}>
                  <TouchableOpacity
                    style={[styles.requestButton, styles.acceptButton]}
                    onPress={() => handleBuddyRequestAction(request.id, 'accept')}
                    disabled={requestActionId === request.id}
                  >
                    <Text style={styles.requestButtonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.requestButton, styles.declineButton]}
                    onPress={() => handleBuddyRequestAction(request.id, 'decline')}
                    disabled={requestActionId === request.id}
                  >
                    <Text style={styles.requestButtonText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : null}
        {buddyRequests.outgoing.length ? (
          <View style={styles.requestSection}>
            <Text style={styles.requestSectionLabel}>Outgoing</Text>
            {buddyRequests.outgoing.map(request => (
              <View key={request.id} style={styles.requestRow}>
                <View style={styles.requestInfo}>
                  <Text style={styles.friendName}>{formatRequestName(request.to_user)}</Text>
                  <Text style={styles.friendHandle}>Pending acceptance</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </WatercolorCard>
    );
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
          {renderBuddyRequestCard()}
          {threadContent}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>

      <Modal visible={friendsVisible} transparent animationType="slide" onRequestClose={() => setFriendsVisible(false)}>
        <View style={styles.modalOverlay}>
          <WatercolorCard style={styles.modalContent} backgroundColor="#fff">
            <Text style={styles.modalTitle}>Start a new chat</Text>
            {buddiesLoading ? (
              <ActivityIndicator color="#fb7185" />
            ) : buddies.length === 0 ? (
              <Text style={styles.emptySubtitle}>No buddies yet. Pair up in the Collaboration Hub!</Text>
            ) : (
              <ScrollView style={styles.friendsList} showsVerticalScrollIndicator={false}>
                {buddies.map(entry => (
                  <TouchableOpacity key={entry.pairId} style={styles.friendRow} onPress={() => selectBuddy(entry)}>
                    <View style={styles.avatarBubbleSmall}>
                      <Text style={styles.avatarText}>{getAvatarLabel(entry.buddy)}</Text>
                    </View>
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>{getDisplayName(entry.buddy)}</Text>
                      {entry.buddy.username ? <Text style={styles.friendHandle}>@{entry.buddy.username}</Text> : null}
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
  requestCard: {
    gap: SPACING.space_2,
  },
  requestTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    color: '#1f2937',
  },
  requestSection: {
    gap: SPACING.space_2,
  },
  requestSectionLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.space_2,
  },
  requestInfo: {
    flex: 1,
  },
  requestButtons: {
    flexDirection: 'row',
    gap: SPACING.space_2,
  },
  requestButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: SPACING.space_2,
    paddingVertical: 4,
  },
  acceptButton: {
    borderColor: '#16a34a',
  },
  declineButton: {
    borderColor: '#f87171',
  },
  requestButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#1f2937',
  },
});
