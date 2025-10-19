import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { SubscriptionService } from '@/services/subscription';
import { useAppStore } from '@/store';

type Props = NativeStackScreenProps<RootStackParamList, 'Paywall'>;

export default function PaywallScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const { setSubscription } = useAppStore();

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const packages = await SubscriptionService.getOfferings();
      if (packages.length > 0) {
        const success = await SubscriptionService.purchase(packages[0]);
        if (success) {
          setSubscription({
            status: 'active',
            platform: 'ios',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });
          Alert.alert('Success', 'Subscription activated!');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const success = await SubscriptionService.restore();
      if (success) {
        setSubscription({
          status: 'active',
          platform: 'ios',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
        Alert.alert('Success', 'Subscription restored!');
      } else {
        Alert.alert('No Subscription', 'No active subscription found to restore.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Unlock Creator Mode</Text>
        <Text style={styles.subtitle}>
          Focus on what matters:{'\n'}creating, connecting, posting
        </Text>

        <View style={styles.features}>
          <Feature icon="✅" text="Block feeds, Explore, and Reels/Shorts" />
          <Feature icon="✅" text="Access DMs, Compose, and Profile" />
          <Feature icon="✅" text="6 platforms: IG, X, YT, TikTok, FB, Snap" />
          <Feature icon="✅" text="Cross-device sync" />
          <Feature icon="✅" text="Remote policy updates" />
          <Feature icon="✅" text="Optional Screen Time shields" />
        </View>

        <View style={styles.pricing}>
          <Text style={styles.price}>$9.99</Text>
          <Text style={styles.priceSubtext}>per month</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handlePurchase}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Processing...' : 'Subscribe Now'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={restoring}
        >
          <Text style={styles.restoreText}>
            {restoring ? 'Restoring...' : 'Restore Purchase'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          Auto-renews monthly. Cancel anytime in Settings.{'\n'}
          Terms of Service • Privacy Policy
        </Text>
      </ScrollView>
    </View>
  );
}

function Feature({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.feature}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
    marginBottom: 32,
    lineHeight: 26,
  },
  features: {
    marginBottom: 32,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#ccc',
    flex: 1,
  },
  pricing: {
    alignItems: 'center',
    marginBottom: 32,
    padding: 24,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
  },
  price: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  priceSubtext: {
    fontSize: 16,
    color: '#888',
  },
  button: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  restoreButton: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  restoreText: {
    fontSize: 16,
    color: '#666',
  },
  terms: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});
