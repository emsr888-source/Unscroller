import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TextInput,
  Modal,
  Share,
  Alert,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { SPACING } from '@/core/theme/spacing';
import { useAppStore } from '@/store';
import { reportPost as reportPostRequest, blockUser as blockUserRequest } from '@/services/communityService';
import { COMMUNITY_CHALLENGES } from '@/constants/communityChallenges';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorCard from '@/components/watercolor/WatercolorCard';
import WatercolorButton from '@/components/watercolor/WatercolorButton';

interface CommunityPost {
  id: number;
  userId: string;
  user: string;
  avatar: string;
  streak: number;
  content: string;
  likes: number;
  comments: number;
  time: string;
}

type Props = NativeStackScreenProps<RootStackParamList, 'Community'>;

const POSTS: CommunityPost[] = [
  {
    id: 1,
    userId: 'alex_dev',
    user: 'Alex',
    avatar: '👨‍💻',
    streak: 45,
    content: 'Just hit 45 days! The urge to scroll is almost gone. Building my app has never been easier.',
    likes: 23,
    comments: 5,
    time: '2h ago',
  },
  {
    id: 2,
    userId: 'sarah_design',
    user: 'Sarah',
    avatar: '👩‍🎨',
    streak: 90,
    content: '90 DAYS! 🎉 Shipped 3 projects, gained 500 followers, and feel unstoppable. You can do this!',
    likes: 156,
    comments: 34,
    time: '5h ago',
  },
  {
    id: 3,
    userId: 'mike_runner',
    user: 'Mike',
    avatar: '🏃',
    streak: 7,
    content: 'Week 1 complete. Hardest week of my life but I feel so clear-headed now.',
    likes: 45,
    comments: 12,
    time: '1d ago',
  },
];

const LEADERBOARD = [
  {
    rank: 1,
    user: 'Amelia',
    avatar: '🚀',
    streak: 128,
    minutesSaved: 4320,
    projectsShipped: 12,
  },
  {
    rank: 2,
    user: 'Noah',
    avatar: '🎨',
    streak: 104,
    minutesSaved: 3890,
    projectsShipped: 9,
  },
  {
    rank: 3,
    user: 'Zara',
    avatar: '🧠',
    streak: 97,
    minutesSaved: 3615,
    projectsShipped: 7,
  },
  {
    rank: 4,
    user: 'Liam',
    avatar: '🛠️',
    streak: 82,
    minutesSaved: 3020,
    projectsShipped: 6,
  },
  {
    rank: 5,
    user: 'Sophia',
    avatar: '📚',
    streak: 76,
    minutesSaved: 2845,
    projectsShipped: 5,
  },
];

const COMMUNITY_TABS = ['Feed', 'Challenges', 'Leaderboard'] as const;
type CommunityTab = typeof COMMUNITY_TABS[number];

export default function CommunityScreen({ navigation, route }: Props) {
  const { height } = useWindowDimensions();
  const isCompact = height < 720;
  const { user } = useAppStore();
  const [selectedTab, setSelectedTab] = useState<CommunityTab>(route.params?.initialTab ?? 'Feed');
  const [posts, setPosts] = useState<CommunityPost[]>(POSTS);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<{ [key: number]: Array<{ id: number; user: string; text: string }> }>({
    1: [
      { id: 1, user: 'Emma', text: 'This is so inspiring! 💪' },
      { id: 2, user: 'John', text: 'Keep going!' },
    ],
    2: [{ id: 1, user: 'David', text: 'Amazing achievement! 🎉' }],
    3: [],
  });
  const [composerVisible, setComposerVisible] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('Harassment or abuse');
  const [reportDetails, setReportDetails] = useState('');
  const [reportingPostId, setReportingPostId] = useState<number | null>(null);

  const reportReasons = useMemo(
    () => [
      'Harassment or abuse',
      'Spam or self-promotion',
      'Misinformation',
      'Sensitive or unsafe content',
      'Other',
    ],
    [],
  );

  const lastInitialTabRef = useRef<CommunityTab | undefined>(route.params?.initialTab);

  useEffect(() => {
    const nextInitialTab = route.params?.initialTab;
    if (nextInitialTab && nextInitialTab !== lastInitialTabRef.current) {
      lastInitialTabRef.current = nextInitialTab;
      setSelectedTab(nextInitialTab as CommunityTab);
    }
  }, [route.params?.initialTab]);

  const handleLike = (postId: number) => {
    const isLiked = likedPosts.has(postId);
    const newLikedPosts = new Set(likedPosts);
    
    if (isLiked) {
      newLikedPosts.delete(postId);
    } else {
      newLikedPosts.add(postId);
    }
    
    setLikedPosts(newLikedPosts);
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, likes: isLiked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  const handleComment = (postId: number) => {
    setSelectedPostId(postId);
    setCommentsVisible(true);
  };

  const submitComment = () => {
    if (commentText.trim() && selectedPostId) {
      const newComment = {
        id: (comments[selectedPostId]?.length || 0) + 1,
        user: 'You',
        text: commentText.trim(),
      };
      
      setComments({
        ...comments,
        [selectedPostId]: [...(comments[selectedPostId] || []), newComment],
      });
      
      setPosts(posts.map(post => 
        post.id === selectedPostId 
          ? { ...post, comments: post.comments + 1 }
          : post
      ));
      
      setCommentText('');
      setCommentsVisible(false);
    }
  };

  const openComposer = () => {
    setSelectedTab('Feed');
    setComposerVisible(true);
  };

  const submitNewPost = () => {
    const content = newPostText.trim();
    if (!content) {
      return;
    }

    const newId = Date.now();
    const newPost = {
      id: newId,
      userId: user?.id || 'current-user',
      user: user?.email?.split('@')[0] || 'You',
      avatar: '🧑‍🚀',
      streak: 0,
      content,
      likes: 0,
      comments: 0,
      time: 'Just now',
    };

    setPosts([newPost, ...posts]);
    setComments({
      ...comments,
      [newId]: [],
    });
    setNewPostText('');
    setComposerVisible(false);
  };

  const handleShare = async (post: typeof POSTS[0]) => {
    try {
      await Share.share({
        message: `Check out this post from ${post.user} on Unscroller:\n\n"${post.content}"\n\n🔥 ${post.streak} days scroll-free!`,
      });
    } catch (error) {
      Alert.alert('Share failed', 'Unable to share this post');
    }
  };

  const openReportModal = (postId: number) => {
    setReportingPostId(postId);
    setReportReason(reportReasons[0]);
    setReportDetails('');
    setReportModalVisible(true);
  };

  const submitReport = async () => {
    if (!reportingPostId) {
      return;
    }

    try {
      await reportPostRequest(String(reportingPostId), reportReason, reportDetails.trim() || undefined);
      Alert.alert('Report submitted', 'Thanks for keeping the community safe. Our team will review this post.');
      setReportModalVisible(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to submit report right now.';
      Alert.alert('Report failed', message);
    }
  };

  const confirmBlockUser = (post: CommunityPost) => {
    if (post.userId === (user?.id || 'current-user')) {
      Alert.alert('Action not available', 'You cannot block yourself.');
      return;
    }

    Alert.alert(
      'Block User',
      `You will no longer see posts from ${post.user}. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUserRequest(post.userId);
              Alert.alert('User blocked', `${post.user}'s posts will be hidden going forward.`);
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Unable to block this user right now.';
              Alert.alert('Block failed', message);
            }
          },
        },
      ],
    );
  };

  const handleMoreActions = (post: CommunityPost) => {
    Alert.alert(post.user, 'Moderation tools', [
      {
        text: 'Report post',
        onPress: () => openReportModal(post.id),
      },
      {
        text: `Block ${post.user}`,
        style: 'destructive',
        onPress: () => confirmBlockUser(post),
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const handleFloatingAction = () => {
    if (selectedTab === 'Challenges') {
      navigation.navigate('ChallengeCreate');
      return;
    }
    openComposer();
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, isCompact && styles.scrollCompact]}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton} hitSlop={10}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Community</Text>
            <TouchableOpacity onPress={openComposer} style={styles.iconButton}>
              <Text style={styles.headerAction}>✏️</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabRow}>
            {COMMUNITY_TABS.map(tab => {
              const active = selectedTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabChip, active && styles.tabChipActive]}
                  onPress={() => setSelectedTab(tab)}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.tabChipText, active && styles.tabChipTextActive]}>{tab}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedTab === 'Feed' && (
            <View style={styles.section}>
              {posts.map(post => (
                <WatercolorCard key={post.id} style={styles.postCard}>
                  <View style={styles.postHeader}>
                    <View style={styles.userMeta}>
                      <View style={styles.avatarBadge}>
                        <Text style={styles.avatar}>{post.avatar}</Text>
                      </View>
                      <View>
                        <Text style={styles.username}>{post.user}</Text>
                        <Text style={styles.postTime}>{post.time}</Text>
                      </View>
                    </View>
                    <View style={styles.streakBadge}>
                      <Text style={styles.streakIcon}>🔥</Text>
                      <Text style={styles.streakText}>{post.streak} days</Text>
                    </View>
                  </View>

                  <Text style={styles.postContent}>{post.content}</Text>

                  <View style={styles.postActions}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(post.id)}>
                      <Text style={styles.actionIcon}>{likedPosts.has(post.id) ? '❤️' : '🤍'}</Text>
                      <Text style={[styles.actionLabel, likedPosts.has(post.id) && styles.actionLabelActive]}>{post.likes}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleComment(post.id)}>
                      <Text style={styles.actionIcon}>💬</Text>
                      <Text style={styles.actionLabel}>{post.comments}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleShare(post)}>
                      <Text style={styles.actionIcon}>🔗</Text>
                      <Text style={styles.actionLabel}>Share</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleMoreActions(post)}>
                      <Text style={styles.actionIcon}>⋯</Text>
                      <Text style={styles.actionLabel}>More</Text>
                    </TouchableOpacity>
                  </View>
                </WatercolorCard>
              ))}
            </View>
          )}

          {selectedTab === 'Challenges' && (
            <View style={styles.section}>
              {COMMUNITY_CHALLENGES.map(challenge => (
                <WatercolorCard key={challenge.id} style={styles.challengeCard}>
                  <View style={styles.challengeHeader}>
                    <View>
                      <Text style={styles.challengeTitle}>{challenge.title}</Text>
                      <Text style={styles.challengeDescription}>{challenge.description}</Text>
                    </View>
                    <View style={styles.challengeBadge}>
                      <Text style={styles.challengeBadgeText}>{challenge.difficulty}</Text>
                    </View>
                  </View>

                  <View style={styles.challengeMeta}>
                    <View style={styles.metaColumn}>
                      <Text style={styles.metaLabel}>Participants</Text>
                      <Text style={styles.metaValue}>{challenge.participants.toLocaleString()}</Text>
                    </View>
                    <View style={styles.metaColumn}>
                      <Text style={styles.metaLabel}>Completion</Text>
                      <Text style={styles.metaValue}>{challenge.completion}%</Text>
                    </View>
                    <View style={styles.metaColumn}>
                      <Text style={styles.metaLabel}>Boost</Text>
                      <Text style={styles.metaValue}>{challenge.streakBoost}</Text>
                    </View>
                  </View>

                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${challenge.completion}%` }]} />
                  </View>

                  <WatercolorButton color="yellow" onPress={() => navigation.navigate('ChallengeDetail', { challengeId: challenge.id })}>
                    <Text style={styles.joinButtonText}>Join challenge</Text>
                  </WatercolorButton>
                </WatercolorCard>
              ))}
            </View>
          )}

          {selectedTab === 'Leaderboard' && (
            <View style={styles.section}>
              <WatercolorCard style={styles.leaderboardCard}>
                {LEADERBOARD.map(entry => (
                  <View key={entry.rank} style={styles.leaderboardRow}>
                    <View style={[styles.rankPill, entry.rank <= 3 && styles.rankPillHighlight]}>
                      <Text style={styles.rankPillText}>#{entry.rank}</Text>
                    </View>
                    <View style={styles.leaderboardInfo}>
                      <Text style={styles.leaderboardName}>
                        {entry.avatar} {entry.user}
                      </Text>
                      <Text style={styles.leaderboardMeta}>
                        {entry.projectsShipped} projects • {entry.minutesSaved.toLocaleString()} mins saved
                      </Text>
                    </View>
                    <Text style={styles.leaderboardStreak}>{entry.streak}d</Text>
                  </View>
                ))}
              </WatercolorCard>
            </View>
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>

      <TouchableOpacity style={styles.floatingButton} onPress={handleFloatingAction} activeOpacity={0.9}>
        <Text style={styles.floatingIcon}>+</Text>
      </TouchableOpacity>

      <Modal visible={composerVisible} animationType="fade" transparent onRequestClose={() => setComposerVisible(false)}>
        <View style={styles.overlay}>
          <WatercolorCard style={styles.composerCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Share a win with the squad</Text>
              <TouchableOpacity onPress={() => setComposerVisible(false)} style={styles.iconGhost}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.composerInput}
              placeholder="What progress did you make today?"
              placeholderTextColor="#94a3b8"
              value={newPostText}
              onChangeText={setNewPostText}
              multiline
            />
            <View style={styles.modalFooterRow}>
              <Text style={styles.modalHint}>Highlight the action you took, not the doom scroll.</Text>
              <WatercolorButton
                color="blue"
                onPress={submitNewPost}
                style={!newPostText.trim() && styles.disabledButton}
                activeOpacity={!newPostText.trim() ? 1 : undefined}
              >
                <Text style={styles.joinButtonText}>Post to feed</Text>
              </WatercolorButton>
            </View>
          </WatercolorCard>
        </View>
      </Modal>

      <Modal visible={commentsVisible} animationType="fade" transparent onRequestClose={() => setCommentsVisible(false)}>
        <View style={styles.overlay}>
          <WatercolorCard style={styles.commentsCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setCommentsVisible(false)} style={styles.iconGhost}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.commentsList}>
              {selectedPostId &&
                comments[selectedPostId]?.map(comment => (
                  <View key={comment.id} style={styles.commentItem}>
                    <Text style={styles.commentUser}>{comment.user}</Text>
                    <Text style={styles.commentCopy}>{comment.text}</Text>
                  </View>
                ))}
            </ScrollView>
            <View style={styles.commentComposer}>
              <TextInput
                style={styles.commentField}
                placeholder="Add a comment…"
                placeholderTextColor="#94a3b8"
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity onPress={submitComment} style={styles.sendPill}>
                <Text style={styles.sendText}>Send</Text>
              </TouchableOpacity>
            </View>
          </WatercolorCard>
        </View>
      </Modal>

      <Modal visible={reportModalVisible} animationType="fade" transparent onRequestClose={() => setReportModalVisible(false)}>
        <View style={styles.overlay}>
          <WatercolorCard style={styles.reportCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Report post</Text>
              <TouchableOpacity onPress={() => setReportModalVisible(false)} style={styles.iconGhost}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalHint}>Why are you reporting?</Text>
            <View style={styles.pillGrid}>
              {reportReasons.map(reason => {
                const selected = reportReason === reason;
                return (
                  <TouchableOpacity
                    key={reason}
                    style={[styles.reasonPill, selected && styles.reasonPillActive]}
                    onPress={() => setReportReason(reason)}
                  >
                    <Text style={[styles.reasonText, selected && styles.reasonTextActive]}>{reason}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TextInput
              style={styles.reportInput}
              placeholder="Anything else we should know? (optional)"
              placeholderTextColor="#94a3b8"
              value={reportDetails}
              onChangeText={setReportDetails}
              multiline
            />
            <WatercolorButton color="red" onPress={submitReport}>
              <Text style={styles.joinButtonText}>Submit report</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.space_4,
    paddingBottom: SPACING.space_6,
    paddingTop: SPACING.space_3,
    gap: SPACING.space_4,
  },
  scrollCompact: {
    paddingHorizontal: SPACING.space_3,
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
  iconGhost: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 26,
    color: '#1f2937',
  },
  headerAction: {
    fontSize: 20,
  },
  headerTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 30,
    color: '#1f2937',
  },
  tabRow: {
    flexDirection: 'row',
    gap: SPACING.space_2,
  },
  tabChip: {
    flex: 1,
    paddingVertical: SPACING.space_2,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabChipActive: {
    backgroundColor: '#fee2e2',
  },
  tabChipText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  tabChipTextActive: {
    color: '#1f2937',
  },
  section: {
    gap: SPACING.space_3,
  },
  postCard: {
    gap: SPACING.space_2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  avatarBadge: {
    width: 42,
    height: 42,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  avatar: {
    fontSize: 24,
  },
  username: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  postTime: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 13,
    color: '#94a3b8',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.space_2,
    paddingVertical: SPACING.space_1,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fef9c3',
  },
  streakIcon: {
    fontSize: 14,
  },
  streakText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
  },
  postContent: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 22,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 15,
    color: '#94a3b8',
  },
  actionLabelActive: {
    color: '#ef4444',
  },
  challengeCard: {
    gap: SPACING.space_2,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.space_2,
    flexWrap: 'wrap',
  },
  challengeTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    color: '#1f2937',
  },
  challengeDescription: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 15,
    color: '#475569',
  },
  challengeBadge: {
    flexShrink: 1,
    paddingHorizontal: SPACING.space_2,
    paddingVertical: SPACING.space_1,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#e0e7ff',
    alignSelf: 'flex-start',
    maxWidth: '40%',
    marginTop: SPACING.space_1,
  },
  challengeBadgeText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#1f2937',
  },
  challengeMeta: {
    flexDirection: 'row',
    gap: SPACING.space_3,
  },
  metaColumn: {
    flex: 1,
    gap: 2,
  },
  metaLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#94a3b8',
  },
  metaValue: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  progressBar: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#e4e4e7',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#4f46e5',
  },
  joinButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
    textAlign: 'center',
  },
  leaderboardCard: {
    gap: SPACING.space_2,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.space_2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15, 23, 42, 0.08)',
  },
  rankPill: {
    paddingHorizontal: SPACING.space_2,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
  },
  rankPillHighlight: {
    backgroundColor: '#fde68a',
  },
  rankPillText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#1f2937',
  },
  leaderboardInfo: {
    flex: 1,
    marginHorizontal: SPACING.space_2,
  },
  leaderboardName: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  leaderboardMeta: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#94a3b8',
  },
  leaderboardStreak: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  bottomSpacing: {
    height: SPACING.space_6,
  },
  floatingButton: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1.4,
    borderColor: '#1f2937',
    backgroundColor: '#fde68a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingIcon: {
    fontSize: 28,
    color: '#1f2937',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,15,15,0.6)',
    justifyContent: 'center',
    padding: SPACING.space_4,
  },
  composerCard: {
    gap: SPACING.space_3,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 22,
    color: '#1f2937',
  },
  modalClose: {
    fontSize: 20,
    color: '#1f2937',
  },
  composerInput: {
    minHeight: 140,
    borderRadius: 18,
    borderWidth: 1.4,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    padding: SPACING.space_3,
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
    textAlignVertical: 'top',
  },
  modalFooterRow: {
    gap: SPACING.space_2,
  },
  modalHint: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#94a3b8',
  },
  disabledButton: {
    opacity: 0.5,
  },
  commentsCard: {
    maxHeight: '80%',
    gap: SPACING.space_2,
  },
  commentsList: {
    maxHeight: 260,
  },
  commentItem: {
    marginBottom: SPACING.space_2,
  },
  commentUser: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  commentCopy: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 15,
    color: '#475569',
  },
  commentComposer: {
    flexDirection: 'row',
    gap: SPACING.space_2,
    alignItems: 'flex-end',
  },
  commentField: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    paddingHorizontal: SPACING.space_2,
    paddingVertical: SPACING.space_1,
    fontFamily: 'PatrickHand-Regular',
    fontSize: 15,
    color: '#1f2937',
  },
  sendPill: {
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_1,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#bae6fd',
  },
  sendText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  reportCard: {
    gap: SPACING.space_2,
  },
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.space_2,
  },
  reasonPill: {
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_1,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
  },
  reasonPillActive: {
    backgroundColor: '#fecdd3',
  },
  reasonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#475569',
  },
  reasonTextActive: {
    color: '#1f2937',
  },
  reportInput: {
    minHeight: 120,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    padding: SPACING.space_3,
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
    textAlignVertical: 'top',
  },
});
