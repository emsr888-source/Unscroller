import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity } from 'react-native';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import type { AVPlaybackStatus } from 'expo-av/build/AV';
import { InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av/build/Audio.types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { SPACING } from '@/core/theme/spacing';
import { useResetStore } from '@/features/reset/resetStore';
import { VOICE_PRESETS } from '@/features/reset/voicePresets';
import { synthesizeManifestSpeech } from '@/features/reset/manifestVoiceService';
import { getAmbientTrackSource } from '@/features/reset/manifestAudio';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorCard from '@/components/watercolor/WatercolorCard';
import WatercolorButton from '@/components/watercolor/WatercolorButton';

type Props = NativeStackScreenProps<RootStackParamList, 'ManifestSession'>;

type PlaybackState = 'idle' | 'playing' | 'paused' | 'completed';

export default function ManifestSessionScreen({ route, navigation }: Props) {
  const { prompt, script, usedFallback } = route.params;
  const { manifest, logSession } = useResetStore(
    useCallback(
      state => ({
        manifest: state.manifest,
        logSession: state.logSession,
      }),
      []
    )
  );

  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [voiceState, setVoiceState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [usingExpoVoice, setUsingExpoVoice] = useState<boolean>(false);
  const [voiceStatusMessage, setVoiceStatusMessage] = useState<string | null>(null);
  const hasLoggedRef = useRef(false);
  const autoStartRef = useRef(false);
  const narrationSoundRef = useRef<Audio.Sound | null>(null);
  const ambientSoundRef = useRef<Audio.Sound | null>(null);

  const voicePreset = useMemo(() => VOICE_PRESETS[manifest.lastVoice as keyof typeof VOICE_PRESETS] ?? VOICE_PRESETS.system_female, [manifest.lastVoice]);

  const logCompletion = useCallback(() => {
    if (hasLoggedRef.current) {
      return;
    }
    logSession({
      kind: 'manifest',
      presetId: 'custom_prompt',
      durationSec: manifest.lastDurationMin * 60,
    });
    hasLoggedRef.current = true;
  }, [logSession, manifest.lastDurationMin]);

  const startExpoSpeech = useCallback(() => {
    setUsingExpoVoice(true);
    setPlaybackState('playing');
    setVoiceState('ready');
    setVoiceStatusMessage(null);
    Speech.stop();
    Speech.speak(script, {
      rate: manifest.lastSpeechRate,
      language: voicePreset.language,
      pitch: voicePreset.pitch,
      onDone: () => {
        setPlaybackState('completed');
        logCompletion();
      },
      onStopped: () => {
        setPlaybackState('idle');
      },
      onError: () => {
        setPlaybackState('idle');
        setError('Narration stopped unexpectedly. Tap play to resume.');
      },
    });
  }, [logCompletion, manifest.lastSpeechRate, script, voicePreset.language, voicePreset.pitch]);

  const handleSoundStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) {
        if ('error' in status && status.error) {
          console.warn('[ManifestSession] OpenAI audio error', status.error);
          setError('Narration playback interrupted. Using device voice instead.');
          setVoiceState('error');
          setUsingExpoVoice(true);
          startExpoSpeech();
        }
        return;
      }

      if (status.didJustFinish) {
        setPlaybackState('completed');
        logCompletion();
      }
    },
    [logCompletion, startExpoSpeech]
  );

  const startOpenAiSound = useCallback(async () => {
    const sound = narrationSoundRef.current;
    if (!sound) {
      startExpoSpeech();
      return;
    }

    try {
      await sound.setStatusAsync({ shouldPlay: false, positionMillis: 0 }).catch(() => undefined);
      setUsingExpoVoice(false);
      setPlaybackState('playing');
      await sound.setStatusAsync({ shouldPlay: true });
      if (ambientSoundRef.current) {
        await ambientSoundRef.current.setStatusAsync({ shouldPlay: true }).catch(() => undefined);
      }
    } catch (err) {
      console.warn('[ManifestSession] Failed to play generated audio', err);
      setError('Unable to play generated narration. Using device voice instead.');
      setVoiceState('error');
      setUsingExpoVoice(true);
      startExpoSpeech();
    }
  }, [startExpoSpeech]);

  const startPlayback = useCallback(() => {
    setError(null);
    hasLoggedRef.current = false;

    if (voiceState === 'loading') {
      autoStartRef.current = true;
      setVoiceStatusMessage(prev => prev ?? 'Preparing narration...');
      return;
    }

    if (!usingExpoVoice && narrationSoundRef.current) {
      autoStartRef.current = false;
      void narrationSoundRef.current
        .setStatusAsync({ shouldPlay: true })
        .catch(() => undefined);
      if (ambientSoundRef.current) {
        void ambientSoundRef.current.setStatusAsync({ shouldPlay: true }).catch(() => undefined);
      }
      return;
    }

    autoStartRef.current = false;
    startExpoSpeech();
  }, [startExpoSpeech, voiceState, usingExpoVoice]);

  const handlePause = useCallback(() => {
    if (!usingExpoVoice && narrationSoundRef.current) {
      void narrationSoundRef.current.setStatusAsync({ shouldPlay: false }).catch(() => undefined);
      if (ambientSoundRef.current) {
        void ambientSoundRef.current.setStatusAsync({ shouldPlay: false }).catch(() => undefined);
      }
    } else {
      Speech.pause();
    }
    setPlaybackState('paused');
  }, [usingExpoVoice]);

  const handleResume = useCallback(() => {
    if (!usingExpoVoice && narrationSoundRef.current) {
      void narrationSoundRef.current.setStatusAsync({ shouldPlay: true }).catch(() => undefined);
      if (ambientSoundRef.current) {
        void ambientSoundRef.current.setStatusAsync({ shouldPlay: true }).catch(() => undefined);
      }
    } else {
      Speech.resume();
    }
    setPlaybackState('playing');
  }, [usingExpoVoice]);

  const handleStop = useCallback(() => {
    if (!usingExpoVoice && narrationSoundRef.current) {
      void narrationSoundRef.current
        .setStatusAsync({ shouldPlay: false, positionMillis: 0 })
        .catch(() => undefined);
      if (ambientSoundRef.current) {
        void ambientSoundRef.current.setStatusAsync({ shouldPlay: false }).catch(() => undefined);
      }
    } else {
      Speech.stop();
    }
    setPlaybackState('idle');
  }, [usingExpoVoice]);

  useEffect(() => {
    let isCancelled = false;
    autoStartRef.current = true;

    const prepareNarration = async () => {
      setVoiceState('loading');
      setVoiceStatusMessage('Crafting your personalized narration...');
      setUsingExpoVoice(false);

      try {
        const result = await synthesizeManifestSpeech({
          script,
          voice: voicePreset.openAiVoice,
          speechRate: manifest.lastSpeechRate,
        });

        if (isCancelled) {
          return;
        }

        if (result.uri) {
          setVoiceStatusMessage('Loading studio voice...');
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: false,
            playsInSilentModeIOS: true,
            interruptionModeIOS: InterruptionModeIOS.DoNotMix,
            interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          });

          const studioSoundObject = await Audio.Sound.createAsync(
            { uri: result.uri },
            { shouldPlay: false, volume: 1 }
          );
          const studioSound = studioSoundObject.sound ?? null;
          if (studioSound) {
            const withUpdater = studioSound as unknown as {
              setOnPlaybackStatusUpdate?: (callback: (status: AVPlaybackStatus) => void) => void;
            };
            withUpdater.setOnPlaybackStatusUpdate?.(handleSoundStatusUpdate);
          }
          narrationSoundRef.current = studioSound;

          const ambientTrack = getAmbientTrackSource(manifest.lastAmbient);
          if (ambientTrack) {
            const ambientSoundObject = await Audio.Sound.createAsync(
              { uri: ambientTrack.uri },
              { shouldPlay: false, volume: ambientTrack.volume }
            );
            ambientSoundRef.current = ambientSoundObject.sound ?? null;
          }
          setVoiceState('ready');
          setVoiceStatusMessage(null);

          if (autoStartRef.current) {
            autoStartRef.current = false;
            await startOpenAiSound();
          }
          return;
        }

        throw new Error('No audio URI returned');
      } catch (error) {
        if (isCancelled) {
          return;
        }
        console.warn('[ManifestSession] Falling back to Expo speech', error);
        setVoiceState('error');
        setVoiceStatusMessage('Using device voice while we prepare audio.');
        setUsingExpoVoice(true);

        if (autoStartRef.current) {
          autoStartRef.current = false;
          startExpoSpeech();
        }
      }
    };

    prepareNarration();

    return () => {
      isCancelled = true;
      autoStartRef.current = false;
      narrationSoundRef.current?.stopAsync().catch(() => undefined);
      narrationSoundRef.current?.unloadAsync().catch(() => undefined);
      ambientSoundRef.current?.stopAsync().catch(() => undefined);
      ambientSoundRef.current?.unloadAsync().catch(() => undefined);
      narrationSoundRef.current = null;
      ambientSoundRef.current = null;
      Speech.stop();
    };
  }, [handleSoundStatusUpdate, manifest.lastSpeechRate, script, startExpoSpeech, startOpenAiSound, voicePreset.openAiVoice]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton} accessibilityRole="button">
              <Text style={styles.iconLabel}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Guided visualization</Text>
            <View style={styles.iconGhost} />
          </View>

          <WatercolorCard style={styles.promptCard} backgroundColor="#fff">
            <Text style={styles.promptHeading}>Intention</Text>
            <Text style={styles.promptText}>{prompt}</Text>
            {usedFallback ? <Text style={styles.promptHint}>Offline-friendly script in use.</Text> : null}
          </WatercolorCard>

          <WatercolorCard style={styles.scriptCard} backgroundColor="#fffef7">
            <ScrollView style={styles.scriptScroll} contentContainerStyle={styles.scriptContent} showsVerticalScrollIndicator={false}>
              {script.split('\n').map((paragraph, index) => (
                <Text key={index.toString()} style={styles.scriptText}>
                  {paragraph || ' '}
                </Text>
              ))}
            </ScrollView>
          </WatercolorCard>

          {voiceStatusMessage ? <Text style={styles.statusMessage}>{voiceStatusMessage}</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.controlsRow}>
            <WatercolorButton color="yellow" onPress={() => {
              if (playbackState === 'playing') {
                handlePause();
              } else if (playbackState === 'paused') {
                handleResume();
              } else {
                startPlayback();
              }
            }}>
              <Text style={styles.controlButtonText}>
                {playbackState === 'playing' ? 'Pause' : playbackState === 'paused' ? 'Resume' : 'Play narration'}
              </Text>
            </WatercolorButton>
            <TouchableOpacity style={styles.stopButton} onPress={handleStop} accessibilityRole="button">
              <Text style={styles.stopButtonText}>Stop</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.space_4,
    paddingBottom: SPACING.space_6,
    paddingTop: SPACING.space_4,
    gap: SPACING.space_4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  iconLabel: {
    fontSize: 24,
    color: '#1f2937',
  },
  headerTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 28,
    color: '#1f2937',
  },
  iconGhost: {
    width: 44,
    height: 44,
  },
  promptCard: {
    gap: SPACING.space_2,
  },
  promptHeading: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  promptText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  promptHint: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#f97316',
  },
  scriptCard: {
    maxHeight: 320,
  },
  scriptScroll: {
    maxHeight: 300,
  },
  scriptContent: {
    gap: SPACING.space_2,
  },
  scriptText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
  },
  statusMessage: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
  },
  errorText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
  },
  controlsRow: {
    gap: SPACING.space_3,
  },
  controlButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  stopButton: {
    marginTop: SPACING.space_2,
    paddingVertical: SPACING.space_2,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  stopButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
});
