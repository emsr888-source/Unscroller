import { hasCustomNativeModules } from './platformCapabilities';

type StorageMap = Map<string, string>;

export interface SafeStorage {
  getString(key: string): string | null;
  set(key: string, value: string): void;
  delete(key: string): void;
  clearAll(): void;
  isFallback: boolean;
}

type MMKVInstance = {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
  clearAll(): void;
};

type MMKVConstructor = new (config: { id: string }) => MMKVInstance;

let MMKVClass: MMKVConstructor | null = null;

if (hasCustomNativeModules) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const { MMKV } = require('react-native-mmkv');
    MMKVClass = MMKV;
  } catch (error) {
    console.warn('[SafeStorage] MMKV unavailable; falling back to in-memory storage', error);
    MMKVClass = null;
  }
}

const isJSIAvailable = typeof globalThis?.nativeCallSyncHook === 'function' && MMKVClass != null;

export const createSafeStorage = (id: string): SafeStorage => {
  let underlying: MMKVInstance | null = null;
  const memory: StorageMap = new Map();

  if (isJSIAvailable && MMKVClass) {
    try {
      underlying = new MMKVClass({ id });
    } catch (error) {
      console.warn(`[SafeStorage] Failed to initialise MMKV (${id}); using in-memory fallback`, error);
      underlying = null;
    }
  }

  const getString = (key: string): string | null => {
    if (underlying) {
      return underlying.getString(key) ?? null;
    }

    return memory.get(key) ?? null;
  };

  const set = (key: string, value: string) => {
    if (underlying) {
      underlying.set(key, value);
      return;
    }

    memory.set(key, value);
  };

  const remove = (key: string) => {
    if (underlying) {
      underlying.delete(key);
      return;
    }

    memory.delete(key);
  };

  const clearAll = () => {
    if (underlying) {
      underlying.clearAll();
      return;
    }

    memory.clear();
  };

  return {
    getString,
    set,
    delete: remove,
    clearAll,
    isFallback: !underlying,
  };
};
