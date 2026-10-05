import type { SearchType } from '../unifiedMuseumService';

/**
 * Pluggable artwork-identification layer.
 *
 * An identifier's single responsibility is: given a photo (base64), produce an
 * ordered list of {@link ScanSearchCandidate} search queries. Everything
 * downstream — `runScanSearch` -> `searchAllMuseums` -> the add/like flows — is
 * identifier-agnostic, so identifiers (Google Vision, an LLM via Bedrock, ...)
 * can be swapped or A/B tested without touching the rest of the scan feature.
 */

/** A single search attempt derived from an image. */
export interface ScanSearchCandidate {
  query: string;
  searchType: SearchType;
  /** Relative 0..1 ordering weight; higher is tried first. */
  confidence: number;
  /** Provider-specific provenance, used for logging / debug UI. */
  source: string;
}

/** Contract every identification backend implements. */
export interface ArtworkIdentifier {
  /** Stable machine id, e.g. 'google-vision' | 'bedrock'. */
  readonly id: string;
  /** Human-readable name for debug UI. */
  readonly label: string;
  /** True when the required env/config for this backend is present. */
  isConfigured(): boolean;
  /** Identify the artwork in a base64 image as ordered search candidates. */
  identify(base64Image: string): Promise<ScanSearchCandidate[]>;
}

/** Thrown when a selected identifier is missing its required configuration. */
export class IdentifierConfigError extends Error {
  constructor(identifierId: string, detail: string) {
    super(`Identifier "${identifierId}" is not configured: ${detail}`);
    this.name = 'IdentifierConfigError';
  }
}
