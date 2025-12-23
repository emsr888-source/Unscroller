import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SPACING } from '@/core/theme/spacing';

type Props = {
  visible: boolean;
  message?: string;
  onConfirm: () => void;
  onDismiss: () => void;
};

const DEFAULT_MESSAGE =
  'Your phone needs to grant Unscroller access to Screen Time (iOS) or Digital Wellbeing (Android) so we can block other apps during focus sessions.';

export default function BlockingPermissionPrompt({ visible, message = DEFAULT_MESSAGE, onConfirm, onDismiss }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Enable native blocking</Text>
          <Text style={styles.body}>{message}</Text>
          <Text style={styles.list}>
            • Verify Usage Access / Screen Time permissions{'\n'}• Let Unscroller display the blocking shield over other apps{'\n'}• Come back and
            start your focus session
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={onDismiss} activeOpacity={0.85}>
              <Text style={styles.secondaryLabel}>Not now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={onConfirm} activeOpacity={0.9}>
              <Text style={styles.primaryLabel}>Open setup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    padding: SPACING.space_4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 28,
    backgroundColor: '#fff',
    padding: SPACING.space_4,
    gap: SPACING.space_2,
  },
  title: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    color: '#0f172a',
  },
  body: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
    lineHeight: 22,
  },
  list: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#e0f2fe',
    borderRadius: 18,
    padding: SPACING.space_2,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.space_2,
    marginTop: SPACING.space_2,
  },
  button: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: SPACING.space_2,
    alignItems: 'center',
    borderWidth: 1.4,
  },
  secondaryButton: {
    borderColor: '#cbd5f5',
    backgroundColor: '#fff',
  },
  primaryButton: {
    borderColor: '#1d4ed8',
    backgroundColor: '#bfdbfe',
  },
  secondaryLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  primaryLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '600',
  },
});
