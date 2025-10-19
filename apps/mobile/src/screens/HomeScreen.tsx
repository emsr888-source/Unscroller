import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { PROVIDERS } from '@/constants/providers';
import { ProviderId } from '@/types';
import { PolicyService } from '@/services/policy';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const handleProviderPress = (providerId: ProviderId) => {
    navigation.navigate('ProviderWebView', { providerId });
  };

  const handleQuickAction = (providerId: ProviderId, actionUrl: string) => {
    navigation.navigate('ProviderWebView', { providerId });
    // TODO: Pass initial URL to WebView
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Creator Mode</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Your Platforms</Text>

        <View style={styles.grid}>
          {PROVIDERS.map(provider => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onPress={() => handleProviderPress(provider.id)}
              onQuickAction={handleQuickAction}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function ProviderCard({
  provider,
  onPress,
  onQuickAction,
}: {
  provider: (typeof PROVIDERS)[0];
  onPress: () => void;
  onQuickAction: (providerId: ProviderId, url: string) => void;
}) {
  const quickActions = PolicyService.getQuickActions(provider.id);

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardHeader} onPress={onPress}>
        <Text style={styles.cardIcon}>{provider.icon}</Text>
        <Text style={styles.cardName}>{provider.name}</Text>
      </TouchableOpacity>

      <View style={styles.quickActions}>
        {quickActions.dm && (
          <QuickActionButton
            icon="💬"
            label="DM"
            onPress={() => onQuickAction(provider.id, quickActions.dm!)}
          />
        )}
        {quickActions.compose && (
          <QuickActionButton
            icon="✏️"
            label="Post"
            onPress={() => onQuickAction(provider.id, quickActions.compose!)}
          />
        )}
        {quickActions.profile && (
          <QuickActionButton
            icon="👤"
            label="Profile"
            onPress={() => onQuickAction(provider.id, quickActions.profile!)}
          />
        )}
        {quickActions.notifications && (
          <QuickActionButton
            icon="🔔"
            label="Alerts"
            onPress={() => onQuickAction(provider.id, quickActions.notifications!)}
          />
        )}
      </View>
    </View>
  );
}

function QuickActionButton({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickActionButton} onPress={onPress}>
      <Text style={styles.quickActionIcon}>{icon}</Text>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  settingsIcon: {
    fontSize: 24,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
    marginBottom: 16,
  },
  grid: {
    gap: 16,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  cardName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickActionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  quickActionLabel: {
    fontSize: 12,
    color: '#ccc',
  },
});
