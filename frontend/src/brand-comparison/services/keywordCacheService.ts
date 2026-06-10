/**
 * Keyword Cache Service
 * Persists all keyword intelligence data to localStorage so the page
 * never hits the backend on a normal visit — only when Refresh is clicked.
 */

const CACHE_KEY = 'gads_keyword_cache';
const STALE_HOURS = 24;

export interface KeywordCachePayload {
  savedAt: string;          // ISO timestamp
  recommendations: any[];
  summaryRec: Record<string, any>;
  infoKeywords: any[];
  buyingKeywords: any[];
  /** Keyed by competitor domain */
  comparison: Record<string, any>;
  serpSnapshotId: string | null;
}

function now(): string {
  return new Date().toISOString();
}

export const keywordCacheService = {
  /** Read the full cache payload. Returns null if nothing stored yet. */
  load(): KeywordCachePayload | null {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as KeywordCachePayload;
    } catch {
      return null;
    }
  },

  /** Save the full payload. */
  save(payload: Omit<KeywordCachePayload, 'savedAt'>): KeywordCachePayload {
    const full: KeywordCachePayload = { ...payload, savedAt: now() };
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(full));
    } catch (e) {
      console.warn('[KeywordCache] localStorage write failed:', e);
    }
    return full;
  },

  /** Clear the cache (e.g. after a hard reset). */
  clear() {
    localStorage.removeItem(CACHE_KEY);
  },

  /** Returns true if cached data is older than STALE_HOURS. */
  isStale(payload: KeywordCachePayload): boolean {
    const savedMs = new Date(payload.savedAt).getTime();
    return Date.now() - savedMs > STALE_HOURS * 60 * 60 * 1000;
  },

  /** Human-readable "Saved at 09 Jun 2026, 10:53 AM" label. */
  formatSavedAt(payload: KeywordCachePayload): string {
    return new Date(payload.savedAt).toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },
};
