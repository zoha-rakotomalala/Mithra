import { OfflineQueue, QueuedOperation } from '../offlineQueue';

// In-memory mock for MMKV
const mockStore: Record<string, string> = {};

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: (key: string) => mockStore[key] ?? undefined,
    set: (key: string, value: string) => {
      mockStore[key] = value;
    },
    delete: (key: string) => {
      delete mockStore[key];
    },
  })),
}));

function makeOp(overrides: Partial<QueuedOperation> = {}): QueuedOperation {
  return {
    id: overrides.id ?? 'op-1',
    type: overrides.type ?? 'upsert_collection',
    payload: overrides.payload ?? { paintingId: 'p1' },
    createdAt: overrides.createdAt ?? '2025-01-01T00:00:00Z',
    retryCount: overrides.retryCount ?? 0,
  };
}

describe('OfflineQueue', () => {
  let queue: OfflineQueue;

  beforeEach(() => {
    // Clear mock store between tests
    for (const key of Object.keys(mockStore)) {
      delete mockStore[key];
    }
    queue = new OfflineQueue();
  });

  it('starts empty', () => {
    expect(queue.size()).toBe(0);
    expect(queue.getAll()).toEqual([]);
    expect(queue.peek()).toBeNull();
    expect(queue.dequeue()).toBeNull();
  });

  it('enqueues and retrieves operations', () => {
    const op = makeOp({ id: 'op-1' });
    queue.enqueue(op);

    expect(queue.size()).toBe(1);
    expect(queue.peek()).toEqual(op);
    expect(queue.getAll()).toEqual([op]);
  });

  it('dequeues in FIFO order', () => {
    const op1 = makeOp({ id: 'op-1' });
    const op2 = makeOp({ id: 'op-2', type: 'delete_collection' });
    const op3 = makeOp({ id: 'op-3', type: 'upsert_palette' });

    queue.enqueue(op1);
    queue.enqueue(op2);
    queue.enqueue(op3);

    expect(queue.dequeue()).toEqual(op1);
    expect(queue.dequeue()).toEqual(op2);
    expect(queue.dequeue()).toEqual(op3);
    expect(queue.dequeue()).toBeNull();
    expect(queue.size()).toBe(0);
  });

  it('peek does not remove the operation', () => {
    const op = makeOp();
    queue.enqueue(op);

    expect(queue.peek()).toEqual(op);
    expect(queue.peek()).toEqual(op);
    expect(queue.size()).toBe(1);
  });

  it('removes a specific operation by id', () => {
    const op1 = makeOp({ id: 'op-1' });
    const op2 = makeOp({ id: 'op-2' });
    const op3 = makeOp({ id: 'op-3' });

    queue.enqueue(op1);
    queue.enqueue(op2);
    queue.enqueue(op3);

    queue.remove('op-2');

    expect(queue.size()).toBe(2);
    expect(queue.getAll()).toEqual([op1, op3]);
  });

  it('remove is a no-op for non-existent id', () => {
    const op = makeOp({ id: 'op-1' });
    queue.enqueue(op);

    queue.remove('non-existent');

    expect(queue.size()).toBe(1);
    expect(queue.getAll()).toEqual([op]);
  });

  it('clears all operations', () => {
    queue.enqueue(makeOp({ id: 'op-1' }));
    queue.enqueue(makeOp({ id: 'op-2' }));

    queue.clear();

    expect(queue.size()).toBe(0);
    expect(queue.getAll()).toEqual([]);
  });

  it('persists queue to MMKV storage', () => {
    const op = makeOp({ id: 'op-1' });
    queue.enqueue(op);

    // Create a new instance — should read from the same MMKV store
    const queue2 = new OfflineQueue();
    expect(queue2.size()).toBe(1);
    expect(queue2.getAll()).toEqual([op]);
  });

  it('handles corrupted storage data gracefully', () => {
    mockStore['sync_offline_queue'] = 'not-valid-json';

    expect(queue.size()).toBe(0);
    expect(queue.getAll()).toEqual([]);
  });

  it('supports all operation types', () => {
    const ops: QueuedOperation[] = [
      makeOp({ id: '1', type: 'upsert_collection' }),
      makeOp({ id: '2', type: 'delete_collection' }),
      makeOp({ id: '3', type: 'upsert_palette' }),
    ];

    for (const op of ops) {
      queue.enqueue(op);
    }

    expect(queue.getAll()).toEqual(ops);
  });
});
