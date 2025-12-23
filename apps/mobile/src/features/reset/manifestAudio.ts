import { Asset } from 'expo-asset';

import ambientBackground from '@/assets/audio/ambient-background.m4a';
import type { ManifestPreferences } from './types';

type AmbientKey = ManifestPreferences['lastAmbient'];

type AmbientTrack = {
  volume: number;
  asset: Asset;
};

const ambientAsset = Asset.fromModule(ambientBackground);

const AMBIENT_TRACKS: Partial<Record<Exclude<AmbientKey, 'none'>, AmbientTrack>> = {
  frequency: {
    volume: 0.5,
    asset: ambientAsset,
  },
};

export type AmbientTrackSource = {
  uri: string;
  volume: number;
};

export function getAmbientTrackSource(key: AmbientKey | undefined): AmbientTrackSource | null {
  if (!key || key === 'none') {
    return null;
  }

  const track = AMBIENT_TRACKS[key];
  if (!track) {
    return null;
  }

  const { asset, volume } = track;
  if (!asset.localUri && !asset.uri) {
    throw new Error(`Ambient track asset missing URI for key: ${key}`);
  }

  return {
    uri: asset.localUri ?? (asset.uri as string),
    volume,
  };
}
