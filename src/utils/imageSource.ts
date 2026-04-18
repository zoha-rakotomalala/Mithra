import FastImage, { type Source, type Priority } from 'react-native-fast-image';

/**
 * Build a FastImage source with museum-specific headers.
 * AIC's IIIF server (artic.edu) requires a Referer header or Cloudflare returns 403.
 */
export function museumImageSource(
  uri: string | undefined,
  priority: Priority = FastImage.priority.normal,
): Source {
  const headers: Record<string, string> | undefined = uri?.includes(
    'artic.edu/iiif',
  )
    ? { Referer: 'https://www.artic.edu/' }
    : undefined;

  return {
    uri: uri || '',
    priority,
    cache: FastImage.cacheControl.web,
    headers,
  };
}
