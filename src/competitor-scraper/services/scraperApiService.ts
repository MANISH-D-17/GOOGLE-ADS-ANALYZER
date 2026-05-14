// ============================================================
// COMPETITOR SCRAPER — API SERVICE
// Isolated: only used by the competitor-scraper module
// ============================================================

import type {
  StartScraperRequest, StartScraperResponse,
  ScraperSession, ScrapedAd, InferredKeyword,
  CreativeAnalysis, ScraperSnapshot, ExportFormat
} from '../types/scraper.types';

const BACKEND_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SCRAPER_BACKEND_URL) || 'http://localhost:8000';

async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error ${response.status}: ${error}`);
  }
  return response.json();
}

export const scraperApiService = {
  /** Start a new scraping session */
  async startScraping(req: StartScraperRequest): Promise<StartScraperResponse> {
    return apiCall<StartScraperResponse>('/api/scraper/start', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  /** Get current status of a session */
  async getStatus(sessionId: string): Promise<ScraperSession> {
    return apiCall<ScraperSession>(`/api/scraper/status?session_id=${sessionId}`);
  },

  /** Get all extracted ads for a session */
  async getResults(sessionId: string): Promise<ScrapedAd[]> {
    return apiCall<ScrapedAd[]>(`/api/scraper/results?session_id=${sessionId}`);
  },

  /** Get inferred keywords for a session */
  async getKeywords(sessionId: string): Promise<InferredKeyword[]> {
    return apiCall<InferredKeyword[]>(`/api/scraper/keywords?session_id=${sessionId}`);
  },

  /** Get creative analysis for a session */
  async getCreativeAnalysis(sessionId: string): Promise<CreativeAnalysis[]> {
    return apiCall<CreativeAnalysis[]>(`/api/scraper/analysis?session_id=${sessionId}`);
  },

  /** Export session data */
  async exportData(sessionId: string, format: ExportFormat): Promise<Blob> {
    const response = await fetch(
      `${BACKEND_URL}/api/scraper/export?session_id=${sessionId}&format=${format}`
    );
    if (!response.ok) throw new Error('Export failed');
    return response.blob();
  },

  /** Get all snapshot history */
  async getSnapshots(): Promise<ScraperSnapshot[]> {
    return apiCall<ScraperSnapshot[]>('/api/scraper/snapshots');
  },

  /** Health check */
  async healthCheck(): Promise<boolean> {
    try {
      await fetch(`${BACKEND_URL}/health`);
      return true;
    } catch {
      return false;
    }
  },
};
