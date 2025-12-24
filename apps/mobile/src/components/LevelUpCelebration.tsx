import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { LevelUpPayload } from '@/state/gamificationEvents';
import { SPACING } from '@/core/theme/spacing';

interface LevelUpCelebrationProps {
  visible: boolean;
  payload?: LevelUpPayload;
  onClose: () => void;
}

const CONFETTI_COLORS = ['#fde68a', '#fbcfe8', '#a5f3fc', '#c4b5fd'];

export function LevelUpCelebration({ visible, payload, onClose }: LevelUpCelebrationProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  const confetti = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      pulse.stopAnimation();
      confetti.stopAnimation();
      return;
    }

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(confetti, {
        toValue: 1,
        duration: 2600,
        useNativeDriver: true,
      })
    ).start();
  }, [confetti, pulse, visible]);

  if (!payload) {
    return null;
  }

  const cardScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.confettiLayer, { opacity: 0.6, transform: [{ translateY: confetti.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) }] }]}> 
          {CONFETTI_COLORS.map((color, index) => (
            <View key={color} style={[styles.confettiDot, { backgroundColor: color, left: `${index * 20 + 4}%` }]} />
          ))}
        </Animated.View>
        <Animated.View style={[styles.card, { transform: [{ scale: cardScale }] }]}> 
          <LinearGradient colors={['#fef3c7', '#e0e7ff', '#f5d0fe']} style={styles.cardGlow} />
          <View style={styles.cardContent}>
            <Text style={styles.headline}>Level Up!</Text>
            <Text style={styles.levelNumber}>Level {payload.level}</Text>
            <Text style={styles.subtitle}>{payload.title}</Text>
            {payload.celebration ? <Text style={styles.message}>{payload.celebration}</Text> : null}

            {payload.unlockedAchievements?.length ? (
              <View style={styles.achievementSection}>
                <Text style={styles.sectionLabel}>New Achievements</Text>
                {payload.unlockedAchievements.map(achievement => (
                  <View key={achievement.id} style={styles.achievementRow}>
                    <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                    <View style={styles.achievementCopy}>
                      <Text style={styles.achievementTitle}>{achievement.title}</Text>
                      <Text style={styles.achievementDescription}>{achievement.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.closeButtonText}>Keep Building</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 20, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.space_4,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 32,
    padding: SPACING.space_5,
    backgroundColor: 'rgba(255,255,255,0.9)',
    overflow: 'hidden',
  },
  cardGlow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  cardContent: {
    gap: SPACING.space_2,
  },
  headline: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    letterSpacing: 1,
    textAlign: 'center',
    color: '#0f172a',
  },
  levelNumber: {
    fontFamily: 'AmaticSC-Regular',
    fontSize: 60,
    textAlign: 'center',
    color: '#0f172a',
  },
  subtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    textAlign: 'center',
    color: '#1f2937',
  },
  message: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    textAlign: 'center',
    color: '#475569',
  },
  achievementSection: {
    marginTop: SPACING.space_2,
    gap: SPACING.space_2,
  },
  sectionLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: SPACING.space_2,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.08)',
    gap: SPACING.space_2,
  },
  achievementIcon: {
    fontSize: 28,
  },
  achievementCopy: {
    flex: 1,
  },
  achievementTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#0f172a',
  },
  achievementDescription: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#475569',
  },
  closeButton: {
    marginTop: SPACING.space_3,
    borderRadius: 999,
    backgroundColor: '#0f172a',
    paddingVertical: SPACING.space_2,
    alignItems: 'center',
  },
  closeButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#fefce8',
  },
  confettiLayer: {
    position: 'absolute',
    top: 80,
    width: '100%',
    height: 160,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confettiDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
