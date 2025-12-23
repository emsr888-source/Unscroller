import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import {
  DirectMessage,
  fetchConversation,
  getUserProfile,
  markThreadAsRead,
  respondToBuddyRequest,
  sendBuddyRequest,
  sendDirectMessage,
  UserProfileResponse,
} from '@/services/messageService';
import { blockUser } from '@/services/communityService';
import { supabase } from '@/services/supabase';

const POLL_INTERVAL = 5000;

const getAvatarSymbol = (icon?: string | null, name?: string | null) => {
  if (icon && icon.trim()) {
    return icon.trim();
  }
  if (name && name.trim()) {
    return name.trim().charAt(0).toUpperCase();
  }
  return '👤';
};

type Props = NativeStackScreenProps<RootStackParamList, 'DirectMessageThread'>;

export default function DirectMessageThreadScreen({ navigation, route }: Props) {
  const { partnerId, partnerName, avatar } = route.params;
  const partnerBadge = getAvatarSymbol(avatar, partnerName ?? null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<UserProfileResponse | null>(null);
  const [buddyActionLoading, setBuddyActionLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (mounted) {
        setCurrentUserId(data.user?.id ?? null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const loadConversation = useCallback(async () => {
    try {
      const data = await fetchConversation(partnerId);
      setMessages(data);
    } catch (error) {
      Alert.alert('Unable to load conversation', error instanceof Error ? error.message : 'Try again shortly.');
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  const loadBuddyStatus = useCallback(async () => {
    try {
      const profile = await getUserProfile(partnerId);
      setPartnerProfile(profile);
    } catch (error) {
      Alert.alert('Unable to load buddy status', error instanceof Error ? error.message : 'Try again shortly.');
    }
  }, [partnerId]);

  useFocusEffect(
    useCallback(() => {
      loadConversation();
      loadBuddyStatus();
      markThreadAsRead(partnerId).catch(() => undefined);
      const interval = setInterval(() => {
        loadConversation();
        loadBuddyStatus();
        markThreadAsRead(partnerId).catch(() => undefined);
      }, POLL_INTERVAL);
      return () => clearInterval(interval);
    }, [loadConversation, loadBuddyStatus, partnerId]),
  );

  useEffect(() => {
    if (messages.length) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!(partnerProfile?.relationships.isBuddy ?? false)) {
      Alert.alert('Buddies only', 'Send a buddy request before messaging.');
      return;
    }
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await sendDirectMessage(partnerId, text);
      setInput('');
      await loadConversation();
      await markThreadAsRead(partnerId);
    } catch (error) {
      Alert.alert('Message failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSending(false);
    }
  };

  const confirmBlock = () => {
    Alert.alert(
      'Block user',
      `You will no longer receive messages from ${partnerName ?? 'this user'}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser(partnerId);
              Alert.alert('Blocked', `${partnerName ?? 'This user'} has been blocked.`);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Unable to block', error instanceof Error ? error.message : 'Please try again later.');
            }
          },
        },
      ],
    );
  };

  const MessageBubble = ({ message }: { message: DirectMessage }) => {
    const isUser = message.sender_id === currentUserId;
    return (
      <View style={[styles.messageRow, isUser ? styles.rowEnd : styles.rowStart]}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.partnerBubble]}>
          <Text style={[styles.messageText, isUser && styles.userText]}>{message.content}</Text>
          <Text style={styles.timestamp}>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
      </View>
    );
  };

  const handleSendBuddyRequest = async () => {
    setBuddyActionLoading(true);
    try {
      await sendBuddyRequest(partnerId);
      await loadBuddyStatus();
      Alert.alert('Request sent', 'They will need to accept before chatting.');
    } catch (error) {
      Alert.alert('Unable to send request', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBuddyActionLoading(false);
    }
  };

  const handleRespondToBuddyRequest = async (action: 'accept' | 'decline') => {
    if (!partnerProfile?.relationships.buddyRequestId) return;
    setBuddyActionLoading(true);
    try {
      await respondToBuddyRequest(partnerProfile.relationships.buddyRequestId, action);
      await loadBuddyStatus();
    } catch (error) {
      Alert.alert('Unable to update request', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBuddyActionLoading(false);
    }
  };

  const buddyRelationship = partnerProfile?.relationships;
  const canMessage = buddyRelationship?.isBuddy ?? false;
  const showBuddyGate = useMemo(() => {
    if (!buddyRelationship) return false;
    return !buddyRelationship.isBuddy;
  }, [buddyRelationship]);

  const renderBuddyGate = () => {
    if (!showBuddyGate || !buddyRelationship) return null;
    return (
      <View style={styles.buddyGateCard}>
        {buddyRelationship.buddyRequestStatus === 'pending' ? (
          buddyRelationship.buddyRequestDirection === 'incoming' ? (
            <>
              <Text style={styles.buddyGateTitle}>Buddy request pending</Text>
              <Text style={styles.buddyGateSubtitle}>Accept to unlock DMs.</Text>
              <View style={styles.buddyGateButtons}>
                <TouchableOpacity
                  style={[styles.buddyGateButton, styles.acceptButton]}
                  onPress={() => handleRespondToBuddyRequest('accept')}
                  disabled={buddyActionLoading}
                >
                  <Text style={styles.buddyGateButtonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.buddyGateButton, styles.declineButton]}
                  onPress={() => handleRespondToBuddyRequest('decline')}
                  disabled={buddyActionLoading}
                >
                  <Text style={styles.buddyGateButtonText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.buddyGateTitle}>Waiting on acceptance</Text>
              <Text style={styles.buddyGateSubtitle}>You’ll be able to chat once they accept.</Text>
            </>
          )
        ) : (
          <>
            <Text style={styles.buddyGateTitle}>Buddy required</Text>
            <Text style={styles.buddyGateSubtitle}>Send a buddy request to start messaging.</Text>
            <TouchableOpacity
              style={[styles.buddyGateButton, styles.acceptButton]}
              onPress={handleSendBuddyRequest}
              disabled={buddyActionLoading}
            >
              <Text style={styles.buddyGateButtonText}>
                {buddyActionLoading ? 'Sending…' : 'Send buddy request'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={10}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.avatarBubble}>
            <Text style={styles.avatarText}>{partnerBadge}</Text>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{partnerName || 'Conversation'}</Text>
            <Text style={styles.headerSubtitle}>Direct Messages</Text>
          </View>
          <TouchableOpacity style={styles.blockButton} onPress={confirmBlock}>
            <Text style={styles.blockText}>Block</Text>
          </TouchableOpacity>
        </View>

        {renderBuddyGate()}
        <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={styles.messagesContent} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator color={COLORS.ACCENT_GRADIENT_START} style={styles.loader} />
          ) : (
            messages.map(message => <MessageBubble key={message.id} message={message} />)
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            style={[styles.input, !canMessage && styles.inputDisabled]}
            placeholder={
              canMessage ? 'Message...' : 'Buddy up to unlock messaging'
            }
            placeholderTextColor={COLORS.TEXT_SECONDARY}
            value={input}
            onChangeText={setInput}
            multiline
            editable={canMessage}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!input.trim() || sending || !canMessage) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!input.trim() || sending || !canMessage}
          >
            {sending ? <ActivityIndicator color={COLORS.BACKGROUND_MAIN} /> : <Text style={styles.sendIcon}>➤</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.BACKGROUND_MAIN },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_5,
    paddingTop: SPACING.space_5,
    paddingBottom: SPACING.space_3,
    gap: SPACING.space_3,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: COLORS.TEXT_PRIMARY,
  },
  avatarBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(77, 161, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ACCENT_GRADIENT_START,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    ...TYPOGRAPHY.H4,
    color: COLORS.TEXT_PRIMARY,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  blockButton: {
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
  },
  blockText: {
    ...TYPOGRAPHY.Subtext,
    color: '#ff1744',
    fontWeight: '600',
  },
  messages: {
    flex: 1,
    paddingHorizontal: SPACING.space_4,
  },
  messagesContent: {
    paddingBottom: SPACING.space_4,
    gap: SPACING.space_2,
  },
  buddyGateCard: {
    marginHorizontal: SPACING.space_4,
    marginTop: SPACING.space_2,
    marginBottom: SPACING.space_2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    padding: SPACING.space_3,
    gap: SPACING.space_2,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
  },
  buddyGateTitle: {
    ...TYPOGRAPHY.H4,
    color: COLORS.TEXT_PRIMARY,
  },
  buddyGateSubtitle: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  buddyGateButtons: {
    flexDirection: 'row',
    gap: SPACING.space_2,
  },
  buddyGateButton: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  buddyGateButtonText: {
    ...TYPOGRAPHY.Subtext,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  acceptButton: {
    borderColor: '#16a34a',
  },
  declineButton: {
    borderColor: '#f87171',
  },
  loader: {
    marginTop: SPACING.space_6,
  },
  messageRow: {
    flexDirection: 'row',
  },
  rowEnd: {
    justifyContent: 'flex-end',
  },
  rowStart: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_2,
    borderRadius: 18,
    borderWidth: 1,
  },
  userBubble: {
    backgroundColor: COLORS.ACCENT_GRADIENT_START,
    borderColor: COLORS.ACCENT_GRADIENT_START,
  },
  partnerBubble: {
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderColor: COLORS.GLASS_BORDER,
  },
  messageText: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_PRIMARY,
  },
  userText: {
    color: COLORS.BACKGROUND_MAIN,
  },
  timestamp: {
    ...TYPOGRAPHY.Subtext,
    alignSelf: 'flex-end',
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.space_2,
    paddingHorizontal: SPACING.space_4,
    paddingVertical: SPACING.space_3,
    borderTopWidth: 1,
    borderTopColor: COLORS.GLASS_BORDER,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    borderRadius: 20,
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_2,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    color: COLORS.TEXT_PRIMARY,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.ACCENT_GRADIENT_START,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.TEXT_SECONDARY,
  },
  sendIcon: {
    color: COLORS.BACKGROUND_MAIN,
    fontSize: 18,
    fontWeight: '700',
  },
});
