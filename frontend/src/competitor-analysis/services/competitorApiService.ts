/**
 * Competitor Intelligence API Service
 * Handles all requests to /api/competitor-analysis/*
 */
import { z } from 'zod';
import { ClientCompetitorStore } from './clientCompetitorStore';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8001';

// --- ZOD SCHEMAS ---
export const CompetitorOverviewSchema = z.object({
  id: z.string(),
  domain: z.string(),
  brand: z.string(),
  region: z.string(),
  totalAds: z.number(),
  imageAds: z.number(),
  avgScore: z.number(),
  keywordCount: z.number(),
  topKeywords: z.array(z.string()),
  lastScraped: z.string().nullable(),
  totalAdsSeen: z.number(),
  sessionCount: z.number(),
  benchmarkScore: z.number().nullable(),
  competitorCreativeScore: z.number().nullable(),
});

export const OverviewResponseSchema = z.object({
  competitors: z.array(CompetitorOverviewSchema),
  totalAds: z.number(),
  totalKeywords: z.number(),
  totalSessions: z.number(),
  lastUpdated: z.string(),
});

export const KeywordIntelSchema = z.object({
  keyword: z.string(),
  frequency: z.number(),
  relevanceScore: z.number(),
  intent: z.string(),
  competitor: z.string().optional(),
  search_volume: z.number().optional(),
  cpc: z.number().optional(),
  competition_level: z.number().optional(),
  is_gap: z.boolean().optional(),
  my_rank: z.number().optional(),
  competitor_rank: z.number().optional(),
  opportunity_level: z.string().optional(),
});

export const AdCreativeSchema = z.object({
  id: z.string(),
  externalId: z.string(),
  brand: z.string(),
  domain: z.string(),
  headline: z.string(),
  description: z.string().nullable().optional(),
  ctaText: z.string().nullable().optional(),
  landingUrl: z.string().nullable().optional(),
  adFormat: z.string(),
  fashionCategory: z.string(),
  offerText: z.string().nullable().optional(),
  emotionalTriggers: z.array(z.string()),
  dominantColors: z.array(z.string()),
  imageUrls: z.array(z.string()),
  firstSeen: z.string().nullable().optional(),
  lastSeen: z.string().nullable().optional(),
  scores: z.object({
    creative: z.number(),
    emotional: z.number(),
    cta: z.number(),
    visual: z.number(),
    keyword: z.number(),
    composite: z.number(),
  }),
  extractedAt: z.string().nullable().optional(),
});

export const BenchmarkReportSchema = z.object({
  competitor: z.object({
    id: z.string(),
    domain: z.string(),
    brand: z.string(),
  }).optional(),
  benchmark: z.object({
    myCTR: z.number(),
    competitorCTR: z.number(),
    myCPC: z.number(),
    competitorCPC: z.number(),
    myROAS: z.number(),
    myCreativeScore: z.number(),
    competitorCreativeScore: z.number(),
    myKeywordCount: z.number(),
    competitorKeywordCount: z.number(),
    overallScore: z.number(),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    opportunities: z.array(z.string()),
    threats: z.array(z.string()),
  }),
});

export const AIRecommendationSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  description: z.string(),
  actionItems: z.array(z.string()),
  priority: z.string(),
  impactScore: z.number(),
  isActioned: z.boolean(),
  createdAt: z.string(),
});

// --- TYPES ---
export type CompetitorOverview = z.infer<typeof CompetitorOverviewSchema>;
export type OverviewResponse = z.infer<typeof OverviewResponseSchema>;
export type KeywordIntel = z.infer<typeof KeywordIntelSchema>;
export type AdCreative = z.infer<typeof AdCreativeSchema>;
export type BenchmarkReport = z.infer<typeof BenchmarkReportSchema>;
export type AIRecommendation = z.infer<typeof AIRecommendationSchema>;

// Helper to validate and return
function validate<T>(schema: z.ZodSchema<T>, data: any): T {
  try {
    return schema.parse(data);
  } catch (e) {
    console.error("Zod Validation Error:", e);
    return data as T;
  }
}

export const competitorApiService = {
  getOverview: async (domain?: string): Promise<OverviewResponse> => {
    const data = await ClientCompetitorStore.getOverviewResponse(domain);
    return validate(OverviewResponseSchema, data);
  },

  getKeywords: async (domain?: string, limit = 30): Promise<{ keywords: KeywordIntel[], total: number }> => {
    const data = ClientCompetitorStore.findByDomain(domain);
    const keywords = data.keywords;
    return { 
      keywords: keywords.slice(0, limit).map((k: any) => validate(KeywordIntelSchema, k)), 
      total: keywords.length 
    };
  },

  getCreatives: async (params: { domain?: string, format?: string, category?: string, limit?: number, offset?: number }): Promise<{ ads: AdCreative[], total: number }> => {
    const data = ClientCompetitorStore.findByDomain(params.domain);
    let ads = data.creatives;
    
    if (params.format && params.format !== 'all') {
      ads = ads.filter((ad: AdCreative) => ad.adFormat.toLowerCase() === params.format!.toLowerCase());
    }
    if (params.category && params.category !== 'all') {
      ads = ads.filter((ad: AdCreative) => ad.fashionCategory.toLowerCase() === params.category!.toLowerCase());
    }
    
    const limit = params.limit || 50;
    const offset = params.offset || 0;
    const paginated = ads.slice(offset, offset + limit);
    return { 
      ads: paginated.map((a: any) => validate(AdCreativeSchema, a)), 
      total: ads.length 
    };
  },

  getComparison: async (domain?: string): Promise<BenchmarkReport | { reports: any[] }> => {
    const data = ClientCompetitorStore.findByDomain(domain);
    if (data.comparison && 'benchmark' in data.comparison) {
      return validate(BenchmarkReportSchema, data.comparison);
    }
    return data.comparison;
  },

  getRecommendations: async (domain?: string): Promise<{ recommendations: AIRecommendation[] }> => {
    const data = ClientCompetitorStore.findByDomain(domain);
    return { 
      recommendations: data.recommendations.map((r: any) => validate(AIRecommendationSchema, r)) 
    };
  },

  triggerStorage: async (sessionId: string, domain: string, region = 'IN'): Promise<any> => {
    return { status: 'success', sessionId, domain, region };
  },

  getSnapshots: async (): Promise<{ snapshots: any[] }> => {
    const list = ClientCompetitorStore.getCompetitors();
    return {
      snapshots: list.map((c: any) => ({
        id: c.overview.id,
        sessionKey: c.overview.id,
        brand: c.overview.brand,
        domain: c.overview.domain,
        region: c.overview.region,
        status: 'complete',
        adsExtracted: c.overview.totalAds,
        startedAt: c.overview.lastScraped,
        completedAt: c.overview.lastScraped
      }))
    };
  },

  deleteSession: async (sessionId: string): Promise<any> => {
    const list = ClientCompetitorStore.getCompetitors();
    const filtered = list.filter((c: any) => c.overview.id !== sessionId);
    localStorage.setItem('gads_client_competitors', JSON.stringify(filtered));
    return { status: 'deleted' };
  },

  getKeywordVolume: async (keywords: string[]): Promise<{ metrics: { keyword: string, volume: number, cpc: number, competition: number, difficulty: number }[] }> => {
    const metrics = keywords.map(kw => ({
      keyword: kw,
      volume: 1200 + Math.round(Math.random() * 5000),
      cpc: 8.5 + parseFloat((Math.random() * 10).toFixed(2)),
      competition: 0.4 + parseFloat((Math.random() * 0.5).toFixed(2)),
      difficulty: 30 + Math.round(Math.random() * 40)
    }));
    return { metrics };
  },

  getNegativeKeywords: async (domain?: string): Promise<{ negatives: any[] }> => {
    const negatives = ClientCompetitorStore.findNegativesByDomain(domain);
    return { negatives };
  },

  importZip: async (file: File): Promise<{ status: string, domain: string, brand: string, sessionId: string, competitorId: string }> => {
    try {
      const res = await ClientCompetitorStore.importCompetitorZip(file);
      return {
        status: 'success',
        domain: res.domain,
        brand: res.brand,
        sessionId: `client_${res.domain}`,
        competitorId: `client_${res.domain}`
      };
    } catch (err: any) {
      throw new Error(err.message || 'Failed to extract or validate ZIP file in browser.');
    }
  },

  // --- SERP CACHE METHODS ---
  getLatestSERP: async (snapshotId?: string): Promise<any> => {
    try {
      const url = snapshotId 
        ? `${API_BASE_URL}/api/serp-cache/latest?snapshot_id=${snapshotId}`
        : `${API_BASE_URL}/api/serp-cache/latest`;
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      if (!response.ok) throw new Error("Failed to fetch latest SERP");
      return await response.json();
    } catch (e) {
      console.error(e);
      return { snapshot_id: null, data: null };
    }
  },

  refreshSERP: async (): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/serp-cache/refresh`, { method: 'POST' });
      if (!response.ok) throw new Error("Failed to refresh SERP");
      return await response.json();
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  getSERPHistory: async (): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/serp-cache/history`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      if (!response.ok) throw new Error("Failed to fetch SERP history");
      return await response.json();
    } catch (e) {
      console.error(e);
      return { history: [] };
    }
  }
};
