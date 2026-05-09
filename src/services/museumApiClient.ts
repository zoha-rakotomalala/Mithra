import ky from 'ky';

export const museumApi = ky.create({
  timeout: 10000,
  retry: {
    limit: 2,
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
  },
});

const AUTH_TIMEOUT_MS = 15000;

export function withTimeout<T>(
  promise: Promise<T>,
  ms: number = AUTH_TIMEOUT_MS,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), ms),
    ),
  ]);
}
