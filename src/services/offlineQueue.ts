import { MMKV } from 'react-native-mmkv';

const QUEUE_KEY = 'sync_offline_queue';

const storage = new MMKV({ id: 'sync-queue' });

export interface QueuedOperation {
  id: string;
  type: 'upsert_collection' | 'delete_collection' | 'upsert_palette';
  payload: any;
  createdAt: string;
  retryCount: number;
}

export class OfflineQueue {
  private readQueue(): QueuedOperation[] {
    const raw = storage.getString(QUEUE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as QueuedOperation[];
    } catch {
      return [];
    }
  }

  private writeQueue(queue: QueuedOperation[]): void {
    storage.set(QUEUE_KEY, JSON.stringify(queue));
  }

  enqueue(operation: QueuedOperation): void {
    const queue = this.readQueue();
    queue.push(operation);
    this.writeQueue(queue);
  }

  dequeue(): QueuedOperation | null {
    const queue = this.readQueue();
    if (queue.length === 0) return null;
    const first = queue.shift()!;
    this.writeQueue(queue);
    return first;
  }

  peek(): QueuedOperation | null {
    const queue = this.readQueue();
    return queue.length > 0 ? queue[0] : null;
  }

  getAll(): QueuedOperation[] {
    return this.readQueue();
  }

  remove(operationId: string): void {
    const queue = this.readQueue().filter(op => op.id !== operationId);
    this.writeQueue(queue);
  }

  clear(): void {
    storage.delete(QUEUE_KEY);
  }

  size(): number {
    return this.readQueue().length;
  }
}

export const offlineQueue = new OfflineQueue();
