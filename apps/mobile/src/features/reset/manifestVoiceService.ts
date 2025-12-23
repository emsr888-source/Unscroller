import * as FileSystem from 'expo-file-system/legacy';
import { Buffer } from 'buffer';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TTS_MODEL = 'tts-1-hd';

export type SynthesizeManifestSpeechInput = {
  script: string;
  voice: string;
  speechRate: number;
};

export type SynthesizeManifestSpeechResult = {
  uri: string | null;
  usedFallback: boolean;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => Buffer.from(buffer).toString('base64');

export async function synthesizeManifestSpeech(
  input: SynthesizeManifestSpeechInput
): Promise<SynthesizeManifestSpeechResult> {
  if (!OPENAI_API_KEY) {
    return { uri: null, usedFallback: true };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: TTS_MODEL,
        voice: input.voice,
        input: input.script,
        format: 'mp3',
        speed: input.speechRate,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI TTS error ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const base64 = arrayBufferToBase64(audioBuffer);

    const directory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
    if (!directory) {
      throw new Error('No writable directory available');
    }

    const fileUri = `${directory}manifest-voice-${Date.now()}.mp3`;
    await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });

    return { uri: fileUri, usedFallback: false };
  } catch (error) {
    console.warn('[ManifestVoiceService] Falling back to Expo Speech', error);
    return { uri: null, usedFallback: true };
  }
}
