/**
 * Competitor Intelligence API Service
 * Handles all requests to /api/competitor-analysis/*
 */

const API_BASE_URL = import.meta.env.VITE_SCRAPER_BACKEND_URL || 'http://localhost:8000';

export interface CompetitorOverview {
  id: string;
  domain: string;
  brand: string;
  region: string;
  totalAds: number;
  imageAds: number;
  avgScore: number;
  keywordCount: number;
  topKeywords: string[];
  lastScraped: string | null;
  totalAdsSeen: number;
  sessionCount: number;
  benchmarkScore: number | null;
  competitorCreativeScore: number | null;
}

export interface OverviewResponse {
  competitors: CompetitorOverview[];
  totalAds: number;
  totalKeywords: number;
  totalSessions: number;
  lastUpdated: string;
}

export interface KeywordIntel {
  keyword: string;
  frequency: number;
  relevanceScore: number;
  intent: string;
  competitor?: string;
}

export interface AdCreative {
  id: string;
  externalId: string;
  brand: string;
  domain: string;
  headline: string;
  description: string;
  ctaText: string;
  landingUrl: string;
  adFormat: string;
  fashionCategory: string;
  offerText: string;
  emotionalTriggers: string[];
  dominantColors: string[];
  imageUrls: string[];
  firstSeen: string;
  lastSeen: string;
  scores: {
    creative: number;
    emotional: number;
    cta: number;
    visual: number;
    keyword: number;
    composite: number;
  };
  extractedAt: string;
}

export interface BenchmarkReport {
  competitor: {
    id: string;
    domain: string;
    brand: string;
  };
  benchmark: {
    myCTR: number;
    competitorCTR: number;
    myCPC: number;
    competitorCPC: number;
    myROAS: number;
    myCreativeScore: number;
    competitorCreativeScore: number;
    myKeywordCount: number;
    competitorKeywordCount: number;
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
}

export interface AIRecommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  actionItems: string[];
  priority: string;
  impactScore: number;
  isActioned: boolean;
  createdAt: string;
}

export const competitorApiService = {
  getOverview: async (domain?: string): Promise<OverviewResponse> => {
    const url = new URL(`${API_BASE_URL}/api/competitor-analysis/overview`);
    if (domain) url.searchParams.append('domain', domain);
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to fetch overview');
    return response.json();
  },

  getKeywords: async (domain?: string, limit = 30): Promise<{ keywords: KeywordIntel[], total: number }> => {
    const url = new URL(`${API_BASE_URL}/api/competitor-analysis/keywords`);
    if (domain) url.searchParams.append('domain', domain);
    url.searchParams.append('limit', limit.toString());
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to fetch keywords');
    return response.json();
  },

  getCreatives: async (params: { domain?: string, format?: string, category?: string, limit?: number, offset?: number }): Promise<{ ads: AdCreative[], total: number }> => {
    const url = new URL(`${API_BASE_URL}/api/competitor-analysis/creatives`);
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value.toString());
    });
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to fetch creatives');
    return response.json();
  },

  getComparison: async (domain?: string): Promise<BenchmarkReport | { reports: any[] }> => {
    const url = new URL(`${API_BASE_URL}/api/competitor-analysis/comparison`);
    if (domain) url.searchParams.append('domain', domain);
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to fetch comparison');
    return response.json();
  },

  getRecommendations: async (domain?: string): Promise<{ recommendations: AIRecommendation[] }> => {
    const url = new URL(`${API_BASE_URL}/api/competitor-analysis/recommendations`);
    if (domain) url.searchParams.append('domain', domain);
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to fetch recommendations');
    return response.json();
  },

  triggerStorage: async (sessionId: string, domain: string, region = 'IN'): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/api/competitor-analysis/trigger-scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, domain, region })
    });
    if (!response.ok) throw new Error('Failed to trigger storage');
    return response.json();
  },

  getSnapshots: async (): Promise<{ snapshots: any[] }> => {
    const response = await fetch(`${API_BASE_URL}/api/competitor-analysis/snapshots`);
    if (!response.ok) throw new Error('Failed to fetch snapshots');
    return response.json();
  },

  deleteSession: async (sessionId: string): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/api/competitor-analysis/session/${sessionId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete session');
    return response.json();
  }
};
