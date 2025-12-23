import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

export type BreathPhaseType = 'inhale' | 'hold' | 'exhale' | 'rest';

class BreathAudioCueService {
  private isSpeaking = false;
  private lastPhase: BreathPhaseType | null = null;

  async playPhaseCue(phase: BreathPhaseType): Promise<void> {
    // Don't repeat the same phase cue
    if (this.isSpeaking || this.lastPhase === phase) {
      return;
    }

    this.lastPhase = phase;

    let cueText = '';
    switch (phase) {
      case 'inhale':
        cueText = 'Breathe in';
        break;
      case 'hold':
        cueText = 'Hold';
        break;
      case 'exhale':
        cueText = 'Breathe out';
        break;
      case 'rest':
        cueText = 'Rest';
        break;
    }

    if (!cueText) return;

    try {
      this.isSpeaking = true;
      
      // Configure audio mode for voice playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Use Expo Speech for natural voice
      await Speech.speak(cueText, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.85,
        onDone: () => {
          this.isSpeaking = false;
        },
        onError: () => {
          this.isSpeaking = false;
        },
      });
    } catch (error) {
      console.warn('[BreathAudioCues] Failed to play audio cue:', error);
      this.isSpeaking = false;
    }
  }

  reset(): void {
    this.lastPhase = null;
    this.isSpeaking = false;
    Speech.stop();
  }

  stop(): void {
    Speech.stop();
    this.isSpeaking = false;
  }
}

export const breathAudioCueService = new BreathAudioCueService();
