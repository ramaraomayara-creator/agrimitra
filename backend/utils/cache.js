'use strict';

/** Tiny in-memory TTL cache. Never served without its timestamp (see callers). */
const store = new Map();

function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

function set(key, value, ttlSeconds) {
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

function del(key) {
  store.delete(key);
}

function stats() {
  return { entries: store.size };
}

module.exports = { get, set, del, stats };
