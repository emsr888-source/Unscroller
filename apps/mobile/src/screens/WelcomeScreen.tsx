import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Creator Mode</Text>
        <Text style={styles.subtitle}>Distraction-Free Social Browser</Text>
        <Text style={styles.description}>
          Post, DM, and manage your social profiles—{'\n'}
          without feeds, Reels, Shorts, or Spotlight
        </Text>

        <View style={styles.providers}>
          <Text style={styles.providersText}>
            📷 Instagram • 𝕏 X • ▶️ YouTube{'\n'}
            🎵 TikTok • 👤 Facebook • 👻 Snapchat
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Auth')}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Independent browser. Not affiliated with any social platform.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    color: '#888',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
    marginBottom: 48,
  },
  providers: {
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
  },
  providersText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 28,
  },
  footer: {
    paddingBottom: 24,
  },
  button: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  disclaimer: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
