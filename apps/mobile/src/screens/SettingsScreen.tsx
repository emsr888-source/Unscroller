import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useAppStore } from '@/store';
import { supabase } from '@/services/supabase';
import { PolicyService } from '@/services/policy';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const { user, subscription, logout } = useAppStore();
  const policy = PolicyService.getCachedPolicy();

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          logout();
        },
      },
    ]);
  };

  const handleRefreshPolicy = async () => {
    try {
      await PolicyService.fetchPolicy();
      Alert.alert('Success', 'Policy updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <SettingRow label="Email" value={user?.email || 'Not signed in'} />
        <SettingRow
          label="Subscription"
          value={subscription?.status === 'active' ? 'Active' : 'Inactive'}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Policy</Text>
        <SettingRow label="Version" value={policy.version} />
        <TouchableOpacity style={styles.button} onPress={handleRefreshPolicy}>
          <Text style={styles.buttonText}>Refresh Policy</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>YouTube Filter</Text>
        <Text style={styles.description}>
          Current mode: {policy.youtubeFilterMode || 'safe'}
        </Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Change Filter Mode</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Screen Time Shields</Text>
        <Text style={styles.description}>
          Block native social apps using iOS Screen Time or Android Focus Mode
        </Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Enable Shields</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Clear All Site Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={handleLogout}>
          <Text style={[styles.buttonText, styles.dangerText]}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Creator Mode v1.0.0</Text>
        <Text style={styles.footerText}>Independent browser. Not affiliated with any platform.</Text>
      </View>
    </ScrollView>
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
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  section: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowLabel: {
    fontSize: 16,
    color: '#fff',
  },
  rowValue: {
    fontSize: 16,
    color: '#888',
  },
  button: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
  },
  dangerButton: {
    backgroundColor: '#ff3b30',
    borderColor: '#ff3b30',
  },
  dangerText: {
    color: '#fff',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
});
