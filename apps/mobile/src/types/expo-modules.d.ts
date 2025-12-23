declare module 'expo-speech' {
  export type Voice = {
    identifier?: string;
    name?: string;
    quality?: 'Default' | 'Enhanced';
    language?: string;
  };

  export function speak(text: string, options?: {
    language?: string;
    pitch?: number;
    rate?: number;
    voice?: string;
    onStart?: () => void;
    onDone?: () => void;
    onStopped?: () => void;
    onError?: () => void;
  }): void;

  export function stop(): void;
  export function pause(): void;
  export function resume(): void;
  export function getAvailableVoicesAsync(): Promise<Voice[]>;
}

declare module 'expo-av' {
  export namespace Audio {
    type Mode = {
      allowsRecordingIOS?: boolean;
      interruptionModeIOS?: number;
      playsInSilentModeIOS?: boolean;
      interruptionModeAndroid?: number;
      shouldDuckAndroid?: boolean;
      staysActiveInBackground?: boolean;
      playThroughEarpieceAndroid?: boolean;
    };

    type SoundStatus = {
      isPlaying?: boolean;
      isLooping?: boolean;
      volume?: number;
      shouldPlay?: boolean;
      positionMillis?: number;
      durationMillis?: number;
    };

    class Sound {
      static createAsync(source: { uri: string }, initialStatus?: SoundStatus): Promise<{ sound: Sound; status: SoundStatus }>;
      unloadAsync(): Promise<void>;
      stopAsync(): Promise<void>;
      setStatusAsync(status: SoundStatus): Promise<void>;
    }

    function setAudioModeAsync(mode: Mode): Promise<void>;
  }
}
