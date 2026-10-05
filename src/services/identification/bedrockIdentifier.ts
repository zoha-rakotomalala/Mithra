import Config from 'react-native-config';

import type { SearchType } from '../unifiedMuseumService';

import {
  IdentifierConfigError,
  type ArtworkIdentifier,
  type ScanSearchCandidate,
} from './types';

/**
 * Amazon Bedrock (multimodal LLM) identifier.
 *
 * SECURITY: a mobile client must never hold AWS credentials, and Bedrock
 * requires SigV4/IAM-signed requests. This identifier therefore does NOT call
 * Bedrock directly — it POSTs the image to a *server-side proxy you control*
 * (`ARTWORK_ID_ENDPOINT`) which signs the Bedrock `InvokeModel` call with an
 * IAM role and returns structured JSON. Never replace this with an in-app AWS
 * SDK call or an embedded API key: those are extractable from the bundle.
 *
 * The proxy contract:
 *   Request:  POST { image: "<base64 jpeg/png>" }
 *   Response: {
 *     title?: string;
 *     artist?: string;
 *     year?: string | number;
 *     confidence?: number;                 // 0..1 for the primary guess
 *     alternates?: Array<{                 // optional lower-confidence guesses
 *       title?: string; artist?: string; confidence?: number;
 *     }>;
 *   }
 *
 * Recommended server prompt (Claude/Nova on Bedrock): "Identify the artwork in
 * this image. Respond ONLY with JSON {title, artist, year, confidence}. If you
 * are not reasonably sure, return an empty title. Do not invent an artist."
 *
 * The LLM's advantage over Vision is structured output: it hands back a clean
 * {title, artist} pair, removing the entity-disambiguation guesswork. The
 * curated catalogue search downstream remains the source of truth and guards
 * against hallucination on obscure works.
 */

/** Shape returned by the server-side identification proxy. */
export interface LlmIdentificationResponse {
  title?: string;
  artist?: string;
  year?: string | number;
  confidence?: number;
  alternates?: Array<{
    title?: string;
    artist?: string;
    confidence?: number;
  }>;
}

const DEFAULT_CONFIDENCE = 0.9;
/** Artist search sits just below its title sibling so titles are tried first. */
const ARTIST_CONFIDENCE_PENALTY = 0.1;
const REQUEST_TIMEOUT_MS = 15000;

function clampConfidence(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(Math.max(value, 0), 1);
}

function pushCandidate(
  target: ScanSearchCandidate[],
  seen: Set<string>,
  query: string | undefined,
  searchType: SearchType,
  confidence: number,
  source: string,
): void {
  const trimmed = (query ?? '').trim();
  if (trimmed.length < 3) return;
  const key = `${searchType}:${trimmed.toLowerCase()}`;
  if (seen.has(key)) return;
  seen.add(key);
  target.push({ confidence, query: trimmed, searchType, source });
}

/**
 * Convert a structured LLM identification into ordered search candidates.
 * Pure function — unit tested.
 */
export function buildCandidatesFromLlm(
  response: LlmIdentificationResponse,
): ScanSearchCandidate[] {
  const candidates: ScanSearchCandidate[] = [];
  const seen = new Set<string>();

  const primary = clampConfidence(response.confidence ?? DEFAULT_CONFIDENCE);

  pushCandidate(candidates, seen, response.title, 'title', primary, 'llm-title');
  pushCandidate(
    candidates,
    seen,
    response.artist,
    'artist',
    Math.max(primary - ARTIST_CONFIDENCE_PENALTY, 0),
    'llm-artist',
  );

  (response.alternates ?? []).forEach((alt, index) => {
    const altConfidence = clampConfidence(
      alt.confidence ?? primary - 0.2 - index * 0.05,
    );
    pushCandidate(
      candidates,
      seen,
      alt.title,
      'title',
      altConfidence,
      'llm-alt-title',
    );
    pushCandidate(
      candidates,
      seen,
      alt.artist,
      'artist',
      Math.max(altConfidence - ARTIST_CONFIDENCE_PENALTY, 0),
      'llm-alt-artist',
    );
  });

  return candidates.sort((a, b) => b.confidence - a.confidence);
}

export const bedrockIdentifier: ArtworkIdentifier = {
  id: 'bedrock',
  label: 'Amazon Bedrock',

  isConfigured(): boolean {
    return Boolean(Config.ARTWORK_ID_ENDPOINT);
  },

  async identify(base64Image: string): Promise<ScanSearchCandidate[]> {
    const endpoint = Config.ARTWORK_ID_ENDPOINT;
    if (!endpoint) {
      throw new IdentifierConfigError(
        'bedrock',
        'ARTWORK_ID_ENDPOINT is not set.',
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(endpoint, {
        body: JSON.stringify({ image: base64Image }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Identification proxy returned ${response.status}`);
      }

      const json = (await response.json()) as LlmIdentificationResponse;
      return buildCandidatesFromLlm(json);
    } finally {
      clearTimeout(timeout);
    }
  },
};
