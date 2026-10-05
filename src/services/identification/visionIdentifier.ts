import Config from 'react-native-config';

import { analyzeArtwork, buildSearchCandidates } from '../visionService';

import type { ArtworkIdentifier, ScanSearchCandidate } from './types';

/**
 * Google Cloud Vision identifier. Wraps the existing Vision client
 * (`analyzeArtwork` + `buildSearchCandidates`) behind the pluggable
 * {@link ArtworkIdentifier} contract.
 */
export const visionIdentifier: ArtworkIdentifier = {
  id: 'google-vision',
  label: 'Google Vision',

  isConfigured(): boolean {
    return Boolean(Config.GOOGLE_VISION_API_KEY);
  },

  async identify(base64Image: string): Promise<ScanSearchCandidate[]> {
    const guess = await analyzeArtwork(base64Image);
    return buildSearchCandidates(guess);
  },
};
