import ky from 'ky';

/**
 * Shared HTTP client for all museum API calls.
 * Provides consistent timeout and retry behavior across all museum services.
 */
export const museumApi = ky.create({
  timeout: 10000,
  retry: {
    limit: 2,
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
  },
});
