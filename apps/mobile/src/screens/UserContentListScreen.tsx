import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';

import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorCard from '@/components/watercolor/WatercolorCard';

const formatTimestamp = (timestamp?: string) => {
  if (!timestamp) return undefined;
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

type Props = NativeStackScreenProps<RootStackParamList, 'UserContentList'>;

const UserContentListScreen: React.FC<Props> = ({ navigation, route }) => {
  const { title, subtitle, items } = route.params;
  const nav = navigation as any;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTextWrapper}>
            <Text style={styles.headerTitle}>{title}</Text>
            {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
          </View>
          <View style={styles.backButton} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {items.length === 0 ? (
            <WatercolorCard backgroundColor="#fff" style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🌌</Text>
              <Text style={styles.emptyTitle}>Nothing to see yet</Text>
              <Text style={styles.emptySubtitle}>When this user shares more in this hub, it will appear here.</Text>
            </WatercolorCard>
          ) : (
            items.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemTouchable}
                disabled={!item.route}
                onPress={() => item.route && nav.navigate(item.route.name, item.route.params)}
                activeOpacity={item.route ? 0.85 : 1}
              >
                <WatercolorCard backgroundColor="#fff" style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemTitleWrapper}>
                      {item.icon ? <Text style={styles.itemIcon}>{item.icon}</Text> : null}
                      <Text style={styles.itemTitle}>{item.title}</Text>
                    </View>
                    {item.badge ? <Text style={styles.itemBadge}>{item.badge}</Text> : null}
                  </View>
                  {item.subtitle ? <Text style={styles.itemSubtitle}>{item.subtitle}</Text> : null}
                  <View style={styles.itemFooter}>
                    {item.timestamp ? <Text style={styles.itemTimestamp}>{formatTimestamp(item.timestamp)}</Text> : <View />}
                    {item.route ? <Text style={styles.itemLink}>View →</Text> : null}
                  </View>
                </WatercolorCard>
              </TouchableOpacity>
            ))
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_MAIN,
  },
  safeArea: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.space_4,
    paddingVertical: SPACING.space_3,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  backIcon: {
    fontSize: 20,
    color: COLORS.TEXT_PRIMARY,
  },
  headerTextWrapper: {
    flex: 1,
    paddingHorizontal: SPACING.space_3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.space_4,
    paddingBottom: SPACING.space_6,
    gap: SPACING.space_3,
  },
  itemTouchable: {
    width: '100%',
  },
  itemCard: {
    gap: SPACING.space_2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_2,
    flex: 1,
  },
  itemIcon: {
    fontSize: 20,
  },
  itemTitle: {
    fontSize: 18,
    color: COLORS.TEXT_PRIMARY,
    flexShrink: 1,
  },
  itemBadge: {
    fontSize: 13,
    color: COLORS.ACCENT_GRADIENT_START,
    fontWeight: '600',
  },
  itemSubtitle: {
    fontSize: 15,
    color: COLORS.TEXT_SECONDARY,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTimestamp: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
  itemLink: {
    fontSize: 14,
    color: COLORS.ACCENT_GRADIENT_START,
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  emptyIcon: {
    fontSize: 42,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    color: COLORS.TEXT_SECONDARY,
  },
  bottomSpacing: {
    height: SPACING.space_4,
  },
});

export default UserContentListScreen;
