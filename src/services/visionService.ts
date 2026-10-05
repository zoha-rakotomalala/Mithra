import Config from 'react-native-config';

import type { ScanSearchCandidate } from './identification/types';

// Re-exported for backward compatibility; the canonical definition now lives in
// the pluggable identification layer.
export type { ScanSearchCandidate } from './identification/types';

/**
 * Google Cloud Vision integration for the "scan a painting" feature.
 *
 * The flow deliberately does NOT invent a new painting-creation path. Instead
 * it turns a photo into one or more *search queries*, which are then fed into
 * the existing `searchAllMuseums` pipeline (see `scanMatchService`). Matches
 * therefore come back as real, schema-correct, cached `Painting` objects that
 * are indistinguishable from a normal Search result.
 *
 * Vision features used:
 *  - WEB_DETECTION  -> best-guess labels + web entities (great for famous art)
 *  - TEXT_DETECTION -> reads museum wall placards (artist / title text)
 *  - LABEL_DETECTION-> generic labels, used only as a weak fallback
 */

const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

/** Structured, provider-agnostic result of analysing a photo. */
export interface VisionArtworkGuess {
  /** Google's single best textual guess for the image (highest signal). */
  bestGuessLabels: string[];
  /** Web entity descriptions, most-confident first, generic terms removed. */
  webEntities: string[];
  /** OCR text from a wall placard, if any. Null when nothing legible. */
  detectedText: string | null;
  /** Generic labels (painting, portrait, ...). Weak signal, fallback only. */
  labels: string[];
}

/** A single search attempt derived from the Vision guess. See
 * `identification/types` for the canonical `ScanSearchCandidate` type. */

/** Thrown when the Vision API key has not been configured in the env. */
export class VisionConfigError extends Error {
  constructor() {
    super(
      'GOOGLE_VISION_API_KEY is not set. Add it to your .env and rebuild the app.',
    );
    this.name = 'VisionConfigError';
  }
}

/** Thrown when the Vision request itself fails (network / API error). */
export class VisionRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VisionRequestError';
  }
}

/**
 * Generic, non-identifying terms that Vision loves to return for any artwork.
 * They must never become a search query on their own.
 */
const GENERIC_ART_TERMS = new Set<string>([
  'art',
  'artwork',
  'work of art',
  'fine art',
  'visual arts',
  'modern art',
  'contemporary art',
  'art exhibition',
  'art museum',
  'museum',
  'painting',
  'oil painting',
  'acrylic paint',
  'watercolor paint',
  'watercolor painting',
  'paint',
  'painter',
  'artist',
  'portrait',
  'self-portrait',
  'still life',
  'landscape painting',
  'picture frame',
  'frame',
  'canvas',
  'illustration',
  'drawing',
  'sketch',
  'image',
  'picture',
  'photograph',
  'photography',
  'stock photography',
  'mural',
  'poster',
  'wall',
]);

function isGeneric(term: string): boolean {
  return GENERIC_ART_TERMS.has(term.trim().toLowerCase());
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * Analyse a base64-encoded JPEG/PNG and return a structured guess.
 * Reads the API key lazily so the module is safe to import in tests.
 */
export async function analyzeArtwork(
  base64Image: string,
): Promise<VisionArtworkGuess> {
  const apiKey = Config.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    throw new VisionConfigError();
  }

  const requestBody = {
    requests: [
      {
        image: { content: base64Image },
        features: [
          { maxResults: 15, type: 'WEB_DETECTION' },
          { maxResults: 1, type: 'TEXT_DETECTION' },
          { maxResults: 10, type: 'LABEL_DETECTION' },
        ],
      },
    ],
  };

  let json: any;
  try {
    const response = await fetch(`${VISION_API_URL}?key=${apiKey}`, {
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    json = await response.json();
    if (!response.ok) {
      const apiMessage =
        json?.error?.message || `Vision API returned ${response.status}`;
      throw new VisionRequestError(apiMessage);
    }
  } catch (error) {
    if (error instanceof VisionRequestError) throw error;
    throw new VisionRequestError(
      error instanceof Error ? error.message : 'Vision request failed',
    );
  }

  const result = json?.responses?.[0] ?? {};
  if (result.error?.message) {
    throw new VisionRequestError(result.error.message);
  }

  return parseVisionResponse(result);
}

/** Convert a raw Vision `responses[0]` object into a `VisionArtworkGuess`. */
export function parseVisionResponse(result: any): VisionArtworkGuess {
  const web = result?.webDetection ?? {};

  const bestGuessLabels: string[] = (web.bestGuessLabels ?? [])
    .map((entry: any) => normalizeWhitespace(entry?.label ?? ''))
    .filter((label: string) => label.length > 0);

  const webEntities: string[] = (web.webEntities ?? [])
    .filter((entity: any) => typeof entity?.description === 'string')
    .sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0))
    .map((entity: any) => normalizeWhitespace(entity.description))
    .filter((desc: string) => desc.length >= 3 && !isGeneric(desc));

  const fullText: string =
    result?.fullTextAnnotation?.text ??
    result?.textAnnotations?.[0]?.description ??
    '';
  const detectedText = normalizeWhitespace(fullText) || null;

  const labels: string[] = (result?.labelAnnotations ?? [])
    .map((label: any) => normalizeWhitespace(label?.description ?? ''))
    .filter((desc: string) => desc.length > 0);

  return { bestGuessLabels, detectedText, labels, webEntities };
}

/**
 * Turn a Vision guess into an ordered list of search candidates.
 * Pure function — unit tested. Candidates are de-duplicated (case-insensitive)
 * and returned highest-confidence first.
 */
export function buildSearchCandidates(
  guess: VisionArtworkGuess,
): ScanSearchCandidate[] {
  const candidates: ScanSearchCandidate[] = [];
  const seen = new Set<string>();

  const push = (candidate: ScanSearchCandidate) => {
    const query = normalizeWhitespace(candidate.query);
    if (query.length < 3 || isGeneric(query)) return;
    const key = `${candidate.searchType}:${query.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push({ ...candidate, query });
  };

  // 1. Best-guess label: Google's strongest single interpretation → title.
  guess.bestGuessLabels.forEach((label, index) => {
    push({
      confidence: 0.95 - index * 0.05,
      query: label,
      searchType: 'title',
      source: 'bestGuess',
    });
  });

  // 2. Top web entities. A single entity may be either the artwork title OR
  //    the artist, so emit both a title and an artist attempt for the leaders.
  guess.webEntities.slice(0, 4).forEach((entity, index) => {
    push({
      confidence: 0.82 - index * 0.08,
      query: entity,
      searchType: 'title',
      source: 'webEntity',
    });
    if (index < 2) {
      push({
        confidence: 0.6 - index * 0.08,
        query: entity,
        searchType: 'artist',
        source: 'webEntity',
      });
    }
  });

  // 3. Placard OCR: split into lines; the leading lines are usually the
  //    artist and the title. Also try the condensed full text as a title.
  if (guess.detectedText) {
    const lines = guess.detectedText
      .split(/\n|·|\||—|–/)
      .map((line) => normalizeWhitespace(line))
      .filter((line) => line.length >= 3 && !isGeneric(line));

    lines.slice(0, 3).forEach((line, index) => {
      push({
        confidence: 0.5 - index * 0.05,
        query: line,
        searchType: index === 0 ? 'artist' : 'title',
        source: 'placardLine',
      });
    });
  }

  // 4. Weak fallback: only non-generic labels, lowest priority.
  guess.labels.filter((label) => !isGeneric(label)).slice(0, 2).forEach(
    (label, index) => {
      push({
        confidence: 0.2 - index * 0.05,
        query: label,
        searchType: 'title',
        source: 'label',
      });
    },
  );

  return candidates.sort((a, b) => b.confidence - a.confidence);
}
