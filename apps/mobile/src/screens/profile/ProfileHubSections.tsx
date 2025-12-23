import React from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import WatercolorCard from '@/components/watercolor/WatercolorCard';
import { SPACING } from '@/core/theme/spacing';
import { COLORS } from '@/core/theme/colors';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { UserProfileResponse } from '@/services/messageService';

type RouteConfig = {
  name: keyof RootStackParamList;
  params?: Record<string, unknown>;
};

export type ContentItem = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  timestamp?: string;
  badge?: string;
  icon?: string;
  route?: RouteConfig;
};

export type HubSectionViewModel = {
  key: string;
  title: string;
  icon: string;
  emptyCopy: string;
  latest?: ContentItem;
  items: ContentItem[];
};

const createRoute = (name: keyof RootStackParamList, params?: Record<string, unknown>): RouteConfig => ({ name, params });

export function buildProfileSections(profile: UserProfileResponse): HubSectionViewModel[] {
  if (!profile) return [];

  const truncate = (value?: string | null, limit = 120) => {
    if (!value) return '';
    return value.length > limit ? `${value.slice(0, limit)}…` : value;
  };

  const communityItems: ContentItem[] = (profile.hubCollections?.communityPosts || []).map(post => ({
    id: post.id,
    title: truncate(post.content, 140) || 'Community update',
    subtitle: post.comments_count ? `${post.comments_count} comments` : undefined,
    timestamp: post.created_at,
    icon: '💬',
    route: createRoute('Community', { initialTab: 'Feed' }),
  }));

  const partnershipItems: ContentItem[] = (profile.partnershipPosts || []).map(post => ({
    id: post.id,
    title: truncate(post.headline, 100),
    subtitle: truncate(post.project_summary, 140),
    timestamp: post.updated_at,
    badge: post.status,
    icon: '🤝',
    route: createRoute('CollaborationHub', { initialTab: 'partnerships' }),
  }));

  const challengesCreatedItems: ContentItem[] = (profile.hubCollections?.challengesCreated || []).map(challenge => ({
    id: challenge.id,
    title: challenge.title,
    subtitle: truncate(challenge.description, 140),
    badge: `${challenge.metric} • ${challenge.target}`,
    timestamp: challenge.created_at,
    icon: challenge.cover_emoji || '🏁',
    route: createRoute('ChallengeDetail', { challengeId: challenge.id }),
  }));

  const challengesJoinedItems: ContentItem[] = (profile.hubCollections?.challengesJoined || []).map(entry => ({
    id: entry.id,
    title: entry.challenge?.title || 'Challenge',
    subtitle: truncate(entry.challenge?.description, 120),
    badge: entry.completed ? 'Completed' : `${entry.current_progress}/${entry.challenge?.target ?? '?'}`,
    timestamp: entry.joined_at,
    icon: entry.challenge?.cover_emoji || '📈',
    route: createRoute('ChallengeDetail', { challengeId: entry.challenge?.id || entry.id }),
  }));

  const buildItems: ContentItem[] = (profile.hubCollections?.buildUpdates || []).map(update => ({
    id: update.id,
    title: update.project?.title || 'Build update',
    subtitle: truncate(update.content, 140),
    badge: update.milestone || (update.progress_percent != null ? `${update.progress_percent}%` : undefined),
    timestamp: update.created_at,
    icon: '🚀',
    route: createRoute('BuildProjectThread', { projectId: update.project?.id || update.project_id }),
  }));

  const sections: HubSectionViewModel[] = [
    {
      key: 'community',
      title: 'Community Hub',
      icon: '💬',
      emptyCopy: 'No community stories yet.',
      latest: profile.latestContent?.community
        ? {
            id: profile.latestContent.community.id,
            title: truncate(profile.latestContent.community.content, 140) || 'Community update',
            subtitle: profile.latestContent.community.comments_count
              ? `${profile.latestContent.community.comments_count} comments`
              : undefined,
            timestamp: profile.latestContent.community.created_at,
            icon: '💬',
            route: createRoute('Community', { initialTab: 'Feed' }),
          }
        : undefined,
      items: communityItems,
    },
    {
      key: 'partnership',
      title: 'Partnership Hub',
      icon: '🤝',
      emptyCopy: 'No partnership posts yet.',
      latest: profile.latestContent?.partnership
        ? {
            id: profile.latestContent.partnership.id,
            title: truncate(profile.latestContent.partnership.headline, 100),
            subtitle: truncate(profile.latestContent.partnership.project_summary, 140),
            timestamp: profile.latestContent.partnership.updated_at,
            badge: profile.latestContent.partnership.status,
            icon: '🤝',
            route: createRoute('CollaborationHub', { initialTab: 'partnerships' }),
          }
        : undefined,
      items: partnershipItems,
    },
    {
      key: 'challengesCreated',
      title: 'Challenges Created',
      icon: '🏁',
      emptyCopy: 'No created challenges yet.',
      latest: profile.latestContent?.challengesCreated
        ? {
            id: profile.latestContent.challengesCreated.id,
            title: profile.latestContent.challengesCreated.title,
            subtitle: truncate(profile.latestContent.challengesCreated.description, 140),
            badge: `${profile.latestContent.challengesCreated.metric} • ${profile.latestContent.challengesCreated.target}`,
            timestamp: profile.latestContent.challengesCreated.created_at,
            icon: profile.latestContent.challengesCreated.cover_emoji || '🏁',
            route: createRoute('ChallengeDetail', { challengeId: profile.latestContent.challengesCreated.id }),
          }
        : undefined,
      items: challengesCreatedItems,
    },
    {
      key: 'challengesJoined',
      title: 'Challenges Joined',
      icon: '📈',
      emptyCopy: 'No joined challenges yet.',
      latest: profile.latestContent?.challengesJoined
        ? {
            id: profile.latestContent.challengesJoined.id,
            title: profile.latestContent.challengesJoined.challenge?.title || 'Challenge',
            subtitle: truncate(profile.latestContent.challengesJoined.challenge?.description, 140),
            badge: profile.latestContent.challengesJoined.completed ? 'Completed' : 'In progress',
            timestamp: profile.latestContent.challengesJoined.joined_at,
            icon: profile.latestContent.challengesJoined.challenge?.cover_emoji || '📈',
            route: createRoute('ChallengeDetail', {
              challengeId: profile.latestContent.challengesJoined.challenge?.id || profile.latestContent.challengesJoined.id,
            }),
          }
        : undefined,
      items: challengesJoinedItems,
    },
    {
      key: 'build',
      title: 'Build in Public',
      icon: '🚀',
      emptyCopy: 'No build updates yet.',
      latest: profile.latestContent?.build
        ? {
            id: profile.latestContent.build.id,
            title: profile.latestContent.build.project?.title || 'Build update',
            subtitle: truncate(profile.latestContent.build.content, 140),
            badge:
              profile.latestContent.build.milestone ||
              (profile.latestContent.build.progress_percent != null
                ? `${profile.latestContent.build.progress_percent}%`
                : undefined),
            timestamp: profile.latestContent.build.created_at,
            icon: '🚀',
            route: createRoute('BuildProjectThread', {
              projectId: profile.latestContent.build.project?.id || profile.latestContent.build.project_id,
            }),
          }
        : undefined,
      items: buildItems,
    },
  ];

  return sections;
}

interface SectionsProps {
  sections: HubSectionViewModel[];
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

export const ProfileHubSections: React.FC<SectionsProps> = ({ sections, navigation }) => {
  const nav = navigation as unknown as {
    navigate: (screen: keyof RootStackParamList, params?: Record<string, unknown>) => void;
  };

  const goToRoute = (item?: ContentItem) => {
    if (!item?.route) return;
    nav.navigate(item.route.name, item.route.params);
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return undefined;
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.sectionStack}>
      {sections.map(section => (
        <WatercolorCard key={section.key} backgroundColor="#fff" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleWrapper}>
              <Text style={styles.sectionIcon}>{section.icon}</Text>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            {section.items.length ? (
              <TouchableOpacity
                onPress={() =>
                  nav.navigate('UserContentList', {
                    title: section.title,
                    items: section.items,
                  })
                }
              >
                <Text style={styles.viewAll}>View all →</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {section.latest ? (
            <TouchableOpacity
              activeOpacity={section.latest.route ? 0.85 : 1}
              disabled={!section.latest.route}
              onPress={() => goToRoute(section.latest)}
              style={styles.latestTouchable}
            >
              <View style={styles.latestHeader}>
                <View style={styles.latestTitleWrapper}>
                  {section.latest.icon ? <Text style={styles.latestIcon}>{section.latest.icon}</Text> : null}
                  <Text style={styles.latestTitle}>{section.latest.title}</Text>
                </View>
                {section.latest.badge ? <Text style={styles.latestBadge}>{section.latest.badge}</Text> : null}
              </View>
              {section.latest.subtitle ? <Text style={styles.latestSubtitle}>{section.latest.subtitle}</Text> : null}
              {section.latest.description ? <Text style={styles.latestDescription}>{section.latest.description}</Text> : null}
              {section.latest.timestamp ? (
                <Text style={styles.latestTimestamp}>{formatTimestamp(section.latest.timestamp)}</Text>
              ) : null}
            </TouchableOpacity>
          ) : (
            <Text style={styles.emptyCopy}>{section.emptyCopy}</Text>
          )}
        </WatercolorCard>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionStack: {
    gap: SPACING.space_3,
  },
  sectionCard: {
    gap: SPACING.space_2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  viewAll: {
    fontSize: 14,
    color: COLORS.ACCENT_GRADIENT_START,
    fontWeight: '600',
  },
  latestTouchable: {
    gap: SPACING.space_1,
  },
  latestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  latestTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_2,
    flex: 1,
  },
  latestIcon: {
    fontSize: 18,
  },
  latestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  latestBadge: {
    fontSize: 12,
    color: COLORS.ACCENT_GRADIENT_START,
    fontWeight: '600',
  },
  latestSubtitle: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  latestDescription: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
  latestTimestamp: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  emptyCopy: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
});
