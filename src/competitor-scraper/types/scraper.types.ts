// ============================================================
// COMPETITOR AD INTELLIGENCE SCRAPER — TYPE DEFINITIONS
// Isolated module — do not import into existing dashboards
// ============================================================

export type ScraperStatus = 'idle' | 'running' | 'paused' | 'complete' | 'error';
export type AdFormat = 'image' | 'video' | 'text' | 'carousel' | 'responsive' | 'unknown';
export type IntentType = 'informational' | 'transactional' | 'navigational' | 'commercial';
export type CTAStyle = 'urgency' | 'fomo' | 'trust' | 'discount' | 'neutral';
export type ExportFormat = 'csv' | 'json' | 'zip';

export interface ScrapedAd {
  id: string;
  sessionId: string;
  brand: string;
  domain: string;
  headline: string;
  description: string;
  ctaText: string;
  landingUrl: string;
  adFormat: AdFormat;
  firstSeen: string;
  lastSeen: string;
  imageUrls: string[];
  videoUrls: string[];
  offerText: string;
  emotionalTriggers: string[];
  dominantColors: string[];
  productMentions: string[];
  fashionCategory: string;
  creativeType: string;
  adPreviewAsset: string;
  contentHash: string;
  extractedAt: string;
}

export interface InferredKeyword {
  id: string;
  keyword: string;
  frequency: number;
  relevanceScore: number;
  intent: IntentType;
  sourceAds: string[];
}

export interface DominantColor {
  hex: string;
  percentage: number;
  label: string;
}

export interface CreativeAnalysis {
  adId: string;
  dominantColors: DominantColor[];
  ctaStyle: CTAStyle;
  emotionalTriggers: string[];
  offerStructure: string;
  productPositioning: string;
  fashionCategory: string;
}

export interface ScraperSession {
  id: string;
  domain: string;
  region: string;
  status: ScraperStatus;
  startedAt: string;
  completedAt?: string;
  adsExtracted: number;
  imagesFound: number;
  videosFound: number;
  errorsCount: number;
  progress: number; // 0–100
  estimatedCompletion?: string;
  currentAd?: Partial<ScrapedAd>;
}

export interface ScraperSnapshot {
  id: string;
  sessionId: string;
  capturedAt: string;
  domain: string;
  newAdsAdded: number;
  adsRemoved: number;
  creativesChanged: number;
  campaignsUpdated: number;
}

export interface ExtractionFeedItem {
  id: string;
  timestamp: string;
  headline: string;
  cta: string;
  assetType: AdFormat;
  brand: string;
  status: 'processing' | 'complete' | 'error';
}

export interface ScraperStats {
  totalAds: number;
  totalImages: number;
  totalVideos: number;
  totalKeywords: number;
  totalCategories: number;
  activeCampaigns: number;
}

export interface StartScraperRequest {
  domain: string;
  region: string;
  maxAds?: number;
}

export interface StartScraperResponse {
  sessionId: string;
  message: string;
}
