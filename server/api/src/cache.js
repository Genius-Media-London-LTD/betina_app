// Tiny in-memory TTL cache. Keeps the last value after expiry so callers can
// fall back to slightly stale data when the upstream is down.
export function createCache({ ttlMs, maxEntries = 500 }) {
  const store = new Map(); // key -> { value, expiresAt }

  return {
    /** Fresh value or undefined. */
    get(key) {
      const hit = store.get(key);
      return hit && hit.expiresAt > Date.now() ? hit.value : undefined;
    },
    /** Value even if expired (stale-on-error fallback). */
    getStale(key) {
      return store.get(key)?.value;
    },
    set(key, value) {
      if (store.size >= maxEntries && !store.has(key)) {
        store.delete(store.keys().next().value); // drop oldest
      }
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
    },
  };
}
