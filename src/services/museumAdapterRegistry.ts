import type { MuseumServiceAdapter } from './types/museumAdapter';

const adapterRegistry = new Map<string, MuseumServiceAdapter>();

export function registerAdapter(adapter: MuseumServiceAdapter): void {
  adapterRegistry.set(adapter.museumId, adapter);
}

export function getAdapter(museumId: string): MuseumServiceAdapter | undefined {
  return adapterRegistry.get(museumId);
}
