import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  useWindowDimensions,
  Linking,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useAppStore } from '@/store';
import { supabase } from '@/services/supabase';
import { PolicyService } from '@/services/policy';
import { ScreenTimeShieldService, ShieldConfig } from '@/services/screenTimeShield';
import { SPACING } from '@/core/theme/spacing';
import { AccountService } from '@/services/account';
import { SafeAreaView } from 'react-native-safe-area-context';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorCard from '@/components/watercolor/WatercolorCard';
import WatercolorButton from '@/components/watercolor/WatercolorButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const { user, subscription, logout } = useAppStore(state => ({
    user: state.user,
    subscription: state.subscription,
    logout: state.logout,
  }));
  const policyBypassEnabled = useAppStore(state => state.policyBypassEnabled);
  const setPolicyBypassEnabled = useAppStore(state => state.setPolicyBypassEnabled);
  const policy = PolicyService.getCachedPolicy();
  const [shieldConfig, setShieldConfig] = useState<ShieldConfig>({
    enabled: false,
    blockedApps: [],
    lastUpdated: new Date().toISOString(),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [nativeFilterHelperVisible, setNativeFilterHelperVisible] = useState(false);
  const { height } = useWindowDimensions();
  const isCompact = height < 720;

  useEffect(() => {
    loadShieldConfig();
  }, []);

  const loadShieldConfig = async () => {
    try {
      const shieldService = ScreenTimeShieldService.getInstance();
      await shieldService.initialize();
      const config = await shieldService.getConfig();
      setShieldConfig(config);
    } catch (error: unknown) {
      console.error('Failed to load shield config:', error);
    }
  };

  const handleToggleShields = async () => {
    setIsLoading(true);
    try {
      const shieldService = ScreenTimeShieldService.getInstance();
      
      if (shieldConfig.enabled) {
        // Disable shields
        const success = await shieldService.disableShields();
        if (success !== false) {
          await loadShieldConfig();
        }
      } else {
        // Enable shields
        const success = await shieldService.enableShields();
        if (success !== false) {
          await loadShieldConfig();
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle shields. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase?.auth.signOut();
          logout();
        },
      },
    ]);
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'This will permanently remove your account, subscription, and all saved progress. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const confirmed = await AccountService.deleteAccount();
            if (confirmed) {
              logout();
              Alert.alert('Account Deleted', 'Your account has been removed.');
            }
          },
        },
      ],
    );
  };

  const openDeletionSupport = () => {
    Linking.openURL('https://unscroller.app/support/delete-account').catch(() =>
      Alert.alert('Unable to open link', 'Please visit unscroller.app/support/delete-account for deletion support.'),
    );
  };

  const handleRefreshPolicy = async () => {
    try {
      // Clear cache to force reload of updated embedded policy
      PolicyService.clearCache();
      await PolicyService.fetchPolicy();
      Alert.alert('Success', 'Policy updated successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', errorMessage);
    }
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://unscroller.app/privacy').catch(() =>
      Alert.alert('Unable to open link', 'Visit unscroller.app/privacy to review our policy.'),
    );
  };

  const openTerms = () => {
    Linking.openURL('https://unscroller.app/terms').catch(() =>
      Alert.alert('Unable to open link', 'Visit unscroller.app/terms to review our terms.'),
    );
  };

  const handleDisablePolicyGuards = () => {
    navigation.navigate('PolicyBypassWarning');
  };

  const handleEnablePolicyGuards = () => {
    setPolicyBypassEnabled(false);
    Alert.alert('Guards Restored', 'Distraction filters and URL blocking are active again.');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadShieldConfig();
    setRefreshing(false);
  };

  const openNativeFilterSettings = async () => {
    if (Platform.OS === 'ios') {
      const candidates = [
        'App-Prefs:root=SCREEN_TIME&path=CONTENT_PRIVACY',
        'App-Prefs:root=SCREEN_TIME',
        'App-Prefs:',
      ];
      for (const url of candidates) {
        const supported = await Linking.canOpenURL(url).catch(() => false);
        if (supported) {
          Linking.openURL(url).catch(() =>
            Alert.alert('Screen Time', 'Open Settings → Screen Time → Content & Privacy to continue.')
          );
          return;
        }
      }
      Alert.alert('Unavailable', 'Open Settings → Screen Time → Content & Privacy Restrictions manually to configure web filters.');
      return;
    }

    const action = 'android.settings.DIGITAL_WELLBEING_SETTINGS';
    try {
      const androidSendIntent = (Linking as unknown as { sendIntent?: (intent: string) => Promise<void> }).sendIntent;
      if (androidSendIntent) {
        await androidSendIntent(action);
        return;
      }
    } catch {
      /* continue to fallback */
    }

    Linking.openSettings().catch(() => {
      Alert.alert(
        'Open Digital Wellbeing',
        'Go to Settings → Digital Wellbeing & parental controls to enable SafeSearch and block incognito.'
      );
    });
  };

  const handleNativeFilterDecision = (allow: boolean) => {
    if (allow) {
      openNativeFilterSettings();
    }
    setNativeFilterHelperVisible(false);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, isCompact && styles.scrollContentCompact]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#94a3b8" />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton} hitSlop={10} activeOpacity={0.9}>
              <Text style={styles.iconLabel}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Settings</Text>
            <View style={styles.headerSpacer} />
          </View>

          <WatercolorCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Account</Text>
            <SettingRow label="Email" value={user?.email || 'Not signed in'} />
            <SettingRow label="Subscription" value={subscription?.status === 'active' ? 'Active' : 'Inactive'} />
          </WatercolorCard>

          <WatercolorCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Policy</Text>
            <SettingRow label="Version" value={policy.version} />
            <WatercolorButton color="yellow" onPress={handleRefreshPolicy} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Refresh Policy</Text>
            </WatercolorButton>
            <WatercolorButton color="neutral" onPress={() => navigation.navigate('Disclosures')} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>View Disclosures & Support</Text>
            </WatercolorButton>
            <WatercolorButton color="neutral" onPress={openPrivacyPolicy} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Privacy Policy</Text>
            </WatercolorButton>
            <WatercolorButton color="neutral" onPress={openTerms} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Terms of Use</Text>
            </WatercolorButton>
            <Text style={styles.helperText}>Short on time? Tap the links above for the essentials.</Text>
          </WatercolorCard>

          <WatercolorCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Content Guards</Text>
            <Text style={styles.description}>
              Content guards hide feeds, mute autoplay, and block distracting URLs. Turn them off briefly if a provider requires the full site to
              sign in, then switch them right back on.
            </Text>
            <View style={[styles.guardStatusPill, policyBypassEnabled ? styles.guardStatusOff : styles.guardStatusOn]}>
              <Text style={styles.guardStatusText}>{policyBypassEnabled ? 'Guards Off — login assist mode' : 'Guards Active'}</Text>
            </View>
            {policyBypassEnabled ? (
              <Text style={styles.warningText}>⚠️ Remember to re-enable content guards immediately after finishing your login.</Text>
            ) : null}
            <WatercolorButton
              color={policyBypassEnabled ? 'yellow' : 'red'}
              onPress={policyBypassEnabled ? handleEnablePolicyGuards : handleDisablePolicyGuards}
              style={styles.actionButton}
            >
              <Text style={[styles.actionButtonText, policyBypassEnabled ? null : styles.destructiveText]}>
                {policyBypassEnabled ? 'Restore Content Guards' : 'Temporarily Disable Guards'}
              </Text>
            </WatercolorButton>
          </WatercolorCard>

          <WatercolorCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>System Web Filters</Text>
            <Text style={styles.description}>
              Use Apple Screen Time or Android Digital Wellbeing to block pornography and disable incognito browsing across every installed browser.
            </Text>
            <WatercolorButton color="neutral" onPress={() => setNativeFilterHelperVisible(true)} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Enable Native Pornography Filters</Text>
            </WatercolorButton>
            <Text style={styles.helperText}>We’ll guide you to the right Settings pane so you can finish enabling the filters.</Text>
          </WatercolorCard>

          <WatercolorCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>YouTube Filter</Text>
            <Text style={styles.description}>Current mode: {policy.youtubeFilterMode || 'safe'}</Text>
            <WatercolorButton color="neutral" onPress={() => Alert.alert('Heads up', 'Filter customization coming soon.')}>
              <Text style={styles.actionButtonText}>Change Filter Mode</Text>
            </WatercolorButton>
          </WatercolorCard>

          <WatercolorCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Screen Time Shields</Text>
            <Text style={styles.description}>Block native social apps using iOS Screen Time or Android Focus Mode.</Text>
            <View style={styles.statusRow}>
              <Text style={styles.statusText}>Status: {shieldConfig.enabled ? '✅ Active' : '❌ Inactive'}</Text>
              {shieldConfig.enabled ? <Text style={styles.appsCount}>{shieldConfig.blockedApps.length} apps blocked</Text> : null}
            </View>
            <WatercolorButton color={shieldConfig.enabled ? 'red' : 'yellow'} onPress={handleToggleShields} style={styles.actionButton}>
              <Text style={[styles.actionButtonText, shieldConfig.enabled && styles.destructiveText]}>
                {isLoading ? 'Working…' : shieldConfig.enabled ? 'Disable Shields' : 'Enable Shields'}
              </Text>
            </WatercolorButton>
            {shieldConfig.enabled ? <Text style={styles.hint}>⚡ Native apps are now blocked. Use Unscroller for filtered access!</Text> : null}
            <WatercolorButton color="neutral" onPress={() => navigation.navigate('BlockingPermissions')} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Configure Blocking Permissions</Text>
            </WatercolorButton>
          </WatercolorCard>

          <WatercolorCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Data</Text>
            <WatercolorButton color="neutral" onPress={() => Alert.alert('Data cleared', 'All cached site data has been cleared.')} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Clear All Site Data</Text>
            </WatercolorButton>
          </WatercolorCard>

          <WatercolorCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Account Management</Text>
            <Text style={styles.description}>
              Manage your Unscroller account, including sign out and deletion. Use the link below if you need to request deletion from the web.
            </Text>
            <WatercolorButton color="neutral" onPress={handleLogout} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Sign Out</Text>
            </WatercolorButton>
            <WatercolorButton color="red" onPress={handleDeleteAccount} style={styles.actionButton}>
              <Text style={[styles.actionButtonText, styles.destructiveText]}>Delete Account</Text>
            </WatercolorButton>
            <TouchableOpacity style={styles.linkButton} onPress={openDeletionSupport} activeOpacity={0.9}>
              <Text style={styles.linkText}>Manage or delete from web</Text>
            </TouchableOpacity>
          </WatercolorCard>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Unscroller v1.0.0</Text>
            <Text style={styles.footerText}>Independent browser. Not affiliated with any platform.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={nativeFilterHelperVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNativeFilterHelperVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Enable Native Filters</Text>
            <Text style={styles.modalBody}>
              We’ll open {Platform.OS === 'ios' ? 'Screen Time → Content & Privacy' : 'Digital Wellbeing & parental controls'} so you can
              limit adult sites, disable incognito, and lock in SafeSearch. Follow the on-screen prompts, then return to Unscroller.
            </Text>
            <Text style={styles.modalChecklist}>
              • Limit adult websites / block explicit content{'\n'}• Require approval before using private/incognito tabs{'\n'}• Optionally turn
              off extra browsers you don’t need
            </Text>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => handleNativeFilterDecision(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.modalButtonText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => handleNativeFilterDecision(true)}
                activeOpacity={0.9}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonPrimaryText]}>Open Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
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
    paddingBottom: SPACING.space_5,
    gap: SPACING.space_3,
  },
  scrollContentCompact: {
    paddingTop: SPACING.space_2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.space_2,
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
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
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
  headerSpacer: {
    width: 44,
  },
  sectionCard: {
    gap: SPACING.space_2,
  },
  sectionTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 22,
    color: '#1f2937',
  },
  helperText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 15,
    color: '#64748b',
  },
  description: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 15,
    color: '#475569',
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.space_1,
  },
  rowLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  rowValue: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#94a3b8',
  },
  actionButton: {
    marginTop: SPACING.space_1,
    width: '100%',
  },
  actionButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  destructiveText: {
    color: '#991b1b',
  },
  guardStatusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.space_3,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.2,
  },
  guardStatusOn: {
    borderColor: '#16a34a',
    backgroundColor: '#dcfce7',
  },
  guardStatusOff: {
    borderColor: '#f97316',
    backgroundColor: '#ffedd5',
  },
  guardStatusText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 15,
    color: '#1f2937',
  },
  warningText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#f97316',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 15,
    color: '#475569',
  },
  appsCount: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 15,
    color: '#0ea5e9',
  },
  hint: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#16a34a',
    textAlign: 'center',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: SPACING.space_2,
  },
  linkText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 15,
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
  footer: {
    paddingVertical: SPACING.space_4,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.space_4,
  },
  modalCard: {
    width: '100%',
    borderRadius: 28,
    backgroundColor: '#fff',
    padding: SPACING.space_4,
    gap: SPACING.space_2,
  },
  modalTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    color: '#0f172a',
  },
  modalBody: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
    lineHeight: 22,
  },
  modalChecklist: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#fef3c7',
    borderRadius: 18,
    padding: SPACING.space_2,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: SPACING.space_2,
    marginTop: SPACING.space_2,
  },
  modalButton: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: SPACING.space_2,
    alignItems: 'center',
    borderWidth: 1.4,
  },
  modalButtonSecondary: {
    borderColor: '#94a3b8',
    backgroundColor: '#fff',
  },
  modalButtonPrimary: {
    borderColor: '#1d4ed8',
    backgroundColor: '#bfdbfe',
  },
  modalButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  modalButtonPrimaryText: {
    color: '#0f172a',
    fontWeight: '600',
  },
});
