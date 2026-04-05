/**
 * Facade module — re-exports from decomposed sync modules.
 * All consumers continue to import from '@/services/syncService'.
 */
export { SyncService, createSyncService } from './sync/syncStrategy';
export { mergeCollectionData, mergePaletteData } from './sync/conflictResolver';
