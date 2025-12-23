import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Linking, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';
import { useBlockingStore, selectBlockingCapability } from '@/features/blocking/blockingStore';
import { BlockService } from '@unscroller/block-service';
import { isNativeBlockServiceAvailable, explainNativeLimitation } from '@/lib/platformCapabilities';

type Props = NativeStackScreenProps<RootStackParamList, 'BlockingPermissions'>;

const ANDROID_SETTINGS = [
  { label: 'Usage access settings', target: 'usage' as const },
  { label: 'Accessibility settings', target: 'accessibility' as const },
  { label: 'Overlay permission', target: 'overlay' as const },
];

export default function BlockingPermissionsScreen({ navigation }: Props) {
  const capability = useBlockingStore(selectBlockingCapability);
  const authorize = useBlockingStore(state => state.authorize);
  const [state, setState] = useState<{ usage: boolean; accessibility: boolean; overlay: boolean }>({
    usage: false,
    accessibility: false,
    overlay: false,
  });
  const nativeAvailable = isNativeBlockServiceAvailable;

  const refreshState = () => {
    if (Platform.OS !== 'android' || !nativeAvailable) return;
    BlockService.getPermissionState()
      .then(setState)
      .catch(() => setState({ usage: false, accessibility: false, overlay: false }));
  };

  useEffect(() => {
    refreshState();
  }, []);

  if (!nativeAvailable) {
    return (
      <ScreenWrapper contentStyle={styles.emptyContainer}>
        <Text style={styles.title}>App Blocking Unavailable in Expo Go</Text>
        <Text style={styles.description}>{explainNativeLimitation('App blocking')}</Text>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Text style={styles.closeText}>Go back</Text>
        </TouchableOpacity>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper contentStyle={styles.container}>
      <Text style={styles.title}>Enable App Blocking</Text>
      <Text style={styles.description}>
        On iOS, enable Screen Time controls and grant Unscroller permission in Settings → Screen Time. On Android, enable Usage Access, Accessibility, and "Display over other apps" so we can block apps during focus sessions.
      </Text>
      <Text style={styles.subtitle}>Grant the required Android permissions so Unscroller can block distracting apps.</Text>
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Why we need this</Text>
        <Text style={styles.infoText}>Usage access lets us see which app is open to block it. Accessibility keeps enforcement active. Overlay shows the blocker on top of the distracting app.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Steps</Text>
        {ANDROID_SETTINGS.map(item => {
          const onPress = () => {
            if (!nativeAvailable) {
              Alert.alert('Unavailable in Expo Go', explainNativeLimitation('Android blocking permissions'));
              return;
            }
            if (Platform.OS === 'android') {
              BlockService.openPermissionSettings(item.target).catch(() => Linking.openSettings());
            } else {
              Linking.openSettings();
            }
          };
          return (
            <TouchableOpacity key={item.label} style={styles.step} activeOpacity={0.85} onPress={onPress}>
              <View style={styles.stepRow}>
                <Text style={styles.stepText}>{item.label}</Text>
                <Text style={[styles.badge, state[item.target] ? styles.badgeOk : styles.badgeWarn]}>
                  {state[item.target] ? 'Granted' : 'Action needed'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          style={[styles.primaryButton, capability.authorized && capability.shieldsAvailable && styles.primaryButtonDone]}
          activeOpacity={0.9}
          onPress={() => {
            if (!nativeAvailable) {
              Alert.alert('Unavailable in Expo Go', explainNativeLimitation('App blocking'));
              return;
            }
            authorize().finally(refreshState).catch(() => undefined);
          }}
        >
          <Text style={styles.primaryButtonText}>{capability.authorized && capability.shieldsAvailable ? 'All set' : 'Refresh status'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
        <Text style={styles.closeText}>Done</Text>
      </TouchableOpacity>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_5,
    backgroundColor: COLORS.BACKGROUND_MAIN,
    gap: SPACING.space_3,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.space_5,
    paddingTop: SPACING.space_5,
    backgroundColor: COLORS.BACKGROUND_MAIN,
  },
  title: {
    ...TYPOGRAPHY.H2,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.space_2,
  },
  description: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.space_3,
  },
  subtitle: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.space_4,
  },
  card: {
    borderRadius: 16,
    padding: SPACING.space_4,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    gap: SPACING.space_2,
  },
  cardTitle: {
    ...TYPOGRAPHY.H4,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.space_2,
  },
  step: {
    paddingVertical: SPACING.space_3,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GLASS_BORDER,
  },
  stepText: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    ...TYPOGRAPHY.Subtext,
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  badgeOk: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    color: '#16A34A',
  },
  badgeWarn: {
    backgroundColor: 'rgba(251,146,60,0.15)',
    color: '#EA580C',
  },
  infoBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    padding: SPACING.space_3,
    marginBottom: SPACING.space_3,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
  },
  infoTitle: {
    ...TYPOGRAPHY.Subtext,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  infoText: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  primaryButton: {
    marginTop: SPACING.space_3,
    paddingVertical: SPACING.space_3,
    borderRadius: 14,
    backgroundColor: COLORS.ACCENT_GRADIENT_START,
    alignItems: 'center',
  },
  primaryButtonDone: {
    backgroundColor: '#22C55E',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  closeButton: {
    marginTop: SPACING.space_4,
    alignSelf: 'center',
    paddingHorizontal: SPACING.space_4,
    paddingVertical: SPACING.space_2,
  },
  closeText: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
});
