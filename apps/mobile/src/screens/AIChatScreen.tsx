import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Keyboard,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import {
  aiServiceDB,
  type Message as AIServiceMessage,
} from '@/services/aiService.database';
import { aiService as aiServiceFallback } from '@/services/aiService';
import { supabase } from '@/services/supabase';
import { SPACING } from '@/core/theme/spacing';
import { createSafeStorage } from '../lib/safeStorage';
import { SafeAreaView } from 'react-native-safe-area-context';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorCard from '@/components/watercolor/WatercolorCard';

type Props = NativeStackScreenProps<RootStackParamList, 'AIChat'>;

type Message = {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    text: "Hey! I'm your AI accountability buddy. I'm here to help you stay on track. How are you feeling today?",
    isUser: false,
    timestamp: new Date(),
  },
];

const QUICK_REPLIES = [
  'Feeling strong 💪',
  'Struggling today',
  'Need motivation',
  'Want to share a win',
];

const DAILY_LIMIT = 50;
const aiUsageStorage = createSafeStorage('ai-buddy-usage');

type DailyUsageRecord = {
  date: string;
  count: number;
};

export default function AIChatScreen({ navigation }: Props) {
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    async function initChat() {
      if (!supabase) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Load conversation history from database
        const history = await aiServiceDB.getConversationHistory(user.id);
        if (history.length > 0) {
          const loadedMessages: Message[] = history.map((msg: AIServiceMessage, idx: number) => ({
            id: idx + 2,
            text: msg.content,
            isUser: msg.role === 'user',
            timestamp: msg.timestamp
          }));
          setMessages([INITIAL_MESSAGES[0], ...loadedMessages]);
        }
      }
    }
    initChat();
  }, []);

  useEffect(() => {
    const todayKey = getTodayKey();
    try {
      const raw = aiUsageStorage.getString('dailyUsage');
      if (!raw) {
        aiUsageStorage.set('dailyUsage', JSON.stringify({ date: todayKey, count: 0 }));
        setDailyCount(0);
        return;
      }
      const parsed = JSON.parse(raw) as DailyUsageRecord;
      if (parsed.date === todayKey) {
        setDailyCount(parsed.count ?? 0);
      } else {
        aiUsageStorage.set('dailyUsage', JSON.stringify({ date: todayKey, count: 0 }));
        setDailyCount(0);
      }
    } catch (error) {
      console.warn('[AIChat] Failed to read daily usage record', error);
      setDailyCount(0);
    }
  }, []);

  const getTodayKey = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const incrementDailyUsage = () => {
    const next = dailyCount + 1;
    setDailyCount(next);
    try {
      const todayKey = getTodayKey();
      const record: DailyUsageRecord = { date: todayKey, count: next };
      aiUsageStorage.set('dailyUsage', JSON.stringify(record));
    } catch (error) {
      console.warn('[AIChat] Failed to persist daily usage record', error);
    }
  };

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || isLoading) {
      return;
    }

    if (dailyCount >= DAILY_LIMIT) {
      Alert.alert(
        'Daily limit reached',
        'You\'ve used 50 AI Buddy messages today. Come back tomorrow for a fresh set, or journal your thoughts in the meantime.',
      );
      return;
    }

    const newMessage: Message = {
      id: Date.now(),
      text,
      isUser: true,
      timestamp: new Date(),
    };

    const conversationSnapshot = [...messages, newMessage];
    setMessages(prev => [...prev, newMessage]);
    incrementDailyUsage();
    setInputText('');
    setIsLoading(true);

    try {
      let aiReplyText: string | null = null;
      let activeUserId = userId;

      if (!activeUserId && supabase) {
        try {
          const { data: sessionData } = await supabase.auth.getUser();
          if (sessionData?.user) {
            activeUserId = sessionData.user.id;
            setUserId(sessionData.user.id);
          }
        } catch (sessionError) {
          console.warn('[AIChat] Failed to refresh Supabase user', sessionError);
        }
      }

      if (activeUserId) {
        // Persisted conversation path
        const response = await aiServiceDB.sendMessage(activeUserId, text);
        aiReplyText = response.message;
      } else {
        // Local fallback when no authenticated user is available
        const historyForFallback: { role: 'user' | 'assistant' | 'system'; content: string }[] =
          conversationSnapshot.map(msg => ({
            role: msg.isUser ? 'user' : 'assistant',
            content: msg.text,
          }));

        const fallbackResponse = await aiServiceFallback.sendMessage(text, historyForFallback);
        aiReplyText = fallbackResponse.text;
      }

      const aiResponse: Message = {
        id: Date.now() + 1,
        text: aiReplyText || "I'm here for you. Let's keep your momentum going. How can I support you right now?",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error getting AI response:', error);

      const fallbackResponse: Message = {
        id: Date.now() + 1,
        text: "I'm here for you. Let's keep your momentum going. How can I support you right now?",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const isSendDisabled = !inputText.trim() || isLoading;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
      <WatercolorBackdrop />
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton} hitSlop={10}>
              <Text style={styles.iconLabel}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>AI Buddy</Text>
              <View style={styles.onlineIndicator} />
            </View>
            <TouchableOpacity style={styles.iconButton} hitSlop={10} onPress={() => navigation.navigate('Journal')}>
              <Text style={styles.iconLabel}>📓</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="always"
          >
            {messages.map(message => (
              <View
                key={message.id}
                style={[
                  styles.messageWrapper,
                  message.isUser ? styles.userMessageWrapper : styles.aiMessageWrapper,
                ]}
              >
                {!message.isUser && (
                  <View style={styles.aiAvatar}>
                    <Text style={styles.aiAvatarText}>🤖</Text>
                  </View>
                )}
                <WatercolorCard
                  style={[
                    styles.messageBubble,
                    message.isUser ? styles.userMessage : styles.aiMessage,
                  ]}
                  backgroundColor={message.isUser ? '#fef3c7' : '#fff'}
                  padding={SPACING.space_2}
                >
                  <Text style={styles.messageText}>{message.text}</Text>
                </WatercolorCard>
              </View>
            ))}

            {messages.length <= 1 && (
              <WatercolorCard style={styles.quickRepliesCard} backgroundColor="#fffef7">
                <Text style={styles.quickRepliesTitle}>Try saying:</Text>
                <View style={styles.quickReplies}>
                  {QUICK_REPLIES.map((reply, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.quickReply}
                      onPress={() => {
                        Keyboard.dismiss();
                        sendMessage(reply);
                      }}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.quickReplyText}>{reply}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </WatercolorCard>
            )}

            {isLoading && (
              <View style={styles.loadingWrapper}>
                <View style={styles.aiAvatar}>
                  <Text style={styles.aiAvatarText}>🤖</Text>
                </View>
                <WatercolorCard style={styles.loadingBubble} backgroundColor="#fff">
                  <ActivityIndicator size="small" color="#fb7185" />
                  <Text style={styles.loadingText}>Thinking...</Text>
                </WatercolorCard>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>

        <View style={styles.composerWrapper}>
          <WatercolorCard style={styles.inputContainer} backgroundColor="#fff">
            <TextInput
              style={styles.input}
              placeholder="Message your buddy..."
              placeholderTextColor="#94a3b8"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, isSendDisabled && styles.sendButtonDisabled]}
              onPress={() => {
                Keyboard.dismiss();
                sendMessage(inputText);
              }}
              activeOpacity={0.85}
              accessibilityState={{ disabled: isSendDisabled }}
            >
              <Text style={styles.sendIcon}>➤</Text>
            </TouchableOpacity>
          </WatercolorCard>
        </View>
      </KeyboardAvoidingView>
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
  keyboardAvoiding: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_4,
    paddingTop: SPACING.space_3,
    paddingBottom: SPACING.space_2,
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
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_1,
  },
  headerTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 28,
    color: '#1f2937',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ade80',
  },
  placeholder: {
    width: 40,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: SPACING.space_4,
    paddingBottom: SPACING.space_5,
    paddingTop: SPACING.space_4,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: SPACING.space_3,
    alignItems: 'flex-end',
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  aiMessageWrapper: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.space_2,
  },
  aiAvatarText: {
    fontSize: 16,
  },
  messageBubble: {
    maxWidth: '75%',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  messageText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 20,
  },
  quickRepliesCard: {
    marginTop: SPACING.space_3,
    gap: SPACING.space_2,
  },
  quickRepliesContainer: {
    marginTop: SPACING.space_3,
  },
  quickRepliesTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
    marginBottom: SPACING.space_2,
  },
  quickReplies: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.space_2,
  },
  quickReply: {
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_2,
  },
  quickReplyText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 15,
    color: '#1f2937',
  },
  composerWrapper: {
    paddingHorizontal: SPACING.space_4,
    paddingBottom: SPACING.space_4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.space_2,
  },
  input: {
    flex: 1,
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
    paddingHorizontal: SPACING.space_2,
    paddingVertical: SPACING.space_1,
    maxHeight: 120,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fde047',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendIcon: {
    fontSize: 20,
    color: '#1f2937',
  },
  loadingWrapper: {
    flexDirection: 'row',
    marginBottom: SPACING.space_3,
    alignItems: 'flex-end',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_2,
    paddingHorizontal: SPACING.space_2,
  },
  loadingText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 15,
    color: '#475569',
  },
  bottomSpacing: {
    height: SPACING.space_6,
  },
});
