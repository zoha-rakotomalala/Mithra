import Config from 'react-native-config';

import { bedrockIdentifier } from './bedrockIdentifier';
import type { ArtworkIdentifier } from './types';
import { visionIdentifier } from './visionIdentifier';

export * from './types';
export { visionIdentifier } from './visionIdentifier';
export { bedrockIdentifier } from './bedrockIdentifier';

/**
 * Registered identifiers, in default-preference order. Bedrock (structured LLM
 * output) is preferred when its proxy is configured; Google Vision is the
 * always-available baseline and the final fallback.
 */
export const IDENTIFIERS: ArtworkIdentifier[] = [
  bedrockIdentifier,
  visionIdentifier,
];

/**
 * Choose an identifier.
 * 1. If `preference` names a registered, *configured* identifier, use it.
 * 2. Otherwise use the first configured identifier in registration order.
 * 3. Otherwise fall back to Vision (so behaviour is deterministic even when
 *    nothing is configured — it will surface a clear config error on use).
 * Pure and dependency-injectable for testing.
 */
export function selectIdentifier(
  preference: string | undefined,
  identifiers: ArtworkIdentifier[] = IDENTIFIERS,
): ArtworkIdentifier {
  if (preference) {
    const preferred = identifiers.find((i) => i.id === preference);
    if (preferred?.isConfigured()) return preferred;
  }
  const configured = identifiers.find((i) => i.isConfigured());
  return configured ?? visionIdentifier;
}

/** Resolve the active identifier from env (`ARTWORK_IDENTIFIER` preference). */
export function resolveIdentifier(): ArtworkIdentifier {
  return selectIdentifier(Config.ARTWORK_IDENTIFIER);
}
