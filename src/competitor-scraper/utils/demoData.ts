// ============================================================
// COMPETITOR SCRAPER — DEMO DATA
// Realistic sample data for Demo Mode when backend is offline
// ============================================================

import type {
  ScrapedAd, InferredKeyword, CreativeAnalysis,
  ExtractionFeedItem, ScraperStats
} from '../types/scraper.types';

export const DEMO_ADS: ScrapedAd[] = [
  {
    id: 'ad_001', sessionId: 'demo', brand: 'Go Colors', domain: 'gocolors.com',
    headline: 'Comfort Meets Color — Shop Now', description: 'India\'s most loved bottomwear brand. 100+ colors, premium fabrics, sizes for all.',
    ctaText: 'Shop Now', landingUrl: 'https://gocolors.com/collections/all',
    adFormat: 'image', firstSeen: '2025-03-01', lastSeen: '2025-05-10',
    imageUrls: ['https://picsum.photos/seed/go1/400/300'],
    videoUrls: [], offerText: '40% OFF First Order', emotionalTriggers: ['comfort', 'confidence', 'value'],
    dominantColors: ['#f97316', '#ffffff', '#1a1a1a'], productMentions: ['leggings', 'palazzos', 'churidars'],
    fashionCategory: 'Bottomwear', creativeType: 'Promotional', adPreviewAsset: 'https://picsum.photos/seed/go1/400/300',
    contentHash: 'abc123', extractedAt: new Date().toISOString(),
  },
  {
    id: 'ad_002', sessionId: 'demo', brand: 'Go Colors', domain: 'gocolors.com',
    headline: 'New Arrivals — Festival Season Collection', description: 'Celebrate every moment in style. Ethnic, casuals, and fusion wear starting ₹299.',
    ctaText: 'Explore Collection', landingUrl: 'https://gocolors.com/collections/festive',
    adFormat: 'video', firstSeen: '2025-04-05', lastSeen: '2025-05-12',
    imageUrls: [], videoUrls: ['https://www.w3schools.com/html/mov_bbb.mp4'],
    offerText: 'Starting ₹299', emotionalTriggers: ['celebration', 'festive', 'style'],
    dominantColors: ['#dc2626', '#fbbf24', '#ffffff'], productMentions: ['kurtas', 'ethnic wear', 'fusion'],
    fashionCategory: 'Ethnic Wear', creativeType: 'Brand Awareness', adPreviewAsset: 'https://picsum.photos/seed/go2/400/300',
    contentHash: 'def456', extractedAt: new Date().toISOString(),
  },
  {
    id: 'ad_003', sessionId: 'demo', brand: 'Go Colors', domain: 'gocolors.com',
    headline: 'Free Delivery on Orders Above ₹499', description: 'Shop the widest range of women\'s bottomwear online. Easy returns, fast delivery.',
    ctaText: 'Order Now', landingUrl: 'https://gocolors.com',
    adFormat: 'responsive', firstSeen: '2025-02-15', lastSeen: '2025-05-11',
    imageUrls: ['https://picsum.photos/seed/go3/400/300'], videoUrls: [],
    offerText: 'Free Delivery ₹499+', emotionalTriggers: ['convenience', 'trust', 'savings'],
    dominantColors: ['#10b981', '#ffffff', '#0f172a'], productMentions: ['bottomwear', 'leggings'],
    fashionCategory: 'Casual Wear', creativeType: 'Performance', adPreviewAsset: 'https://picsum.photos/seed/go3/400/300',
    contentHash: 'ghi789', extractedAt: new Date().toISOString(),
  },
  {
    id: 'ad_004', sessionId: 'demo', brand: 'Go Colors', domain: 'gocolors.com',
    headline: 'Go Colors X Bollywood — Limited Edition', description: 'Wear what your favorite stars wear. Limited drops, unlimited style.',
    ctaText: 'Shop Limited Edition', landingUrl: 'https://gocolors.com/bollywood',
    adFormat: 'carousel', firstSeen: '2025-05-01', lastSeen: '2025-05-13',
    imageUrls: ['https://picsum.photos/seed/go4/400/300', 'https://picsum.photos/seed/go5/400/300'],
    videoUrls: [], offerText: 'Limited Edition Drop', emotionalTriggers: ['exclusivity', 'aspiration', 'fomo'],
    dominantColors: ['#7c3aed', '#fbbf24', '#ffffff'], productMentions: ['limited edition', 'celebrity'],
    fashionCategory: 'Premium Fashion', creativeType: 'Influencer', adPreviewAsset: 'https://picsum.photos/seed/go4/400/300',
    contentHash: 'jkl012', extractedAt: new Date().toISOString(),
  },
  {
    id: 'ad_005', sessionId: 'demo', brand: 'Go Colors', domain: 'gocolors.com',
    headline: 'Sizes XS–5XL — Fashion for Every Body', description: 'Inclusive sizing, premium fabric, affordable prices. Every body is a Go Colors body.',
    ctaText: 'Find Your Size', landingUrl: 'https://gocolors.com/size-guide',
    adFormat: 'image', firstSeen: '2025-01-20', lastSeen: '2025-05-09',
    imageUrls: ['https://picsum.photos/seed/go6/400/300'], videoUrls: [],
    offerText: 'All Sizes Available', emotionalTriggers: ['inclusivity', 'body-positive', 'confidence'],
    dominantColors: ['#ec4899', '#ffffff', '#1a1a1a'], productMentions: ['plus size', 'leggings', 'tops'],
    fashionCategory: 'Inclusive Fashion', creativeType: 'Brand Value', adPreviewAsset: 'https://picsum.photos/seed/go6/400/300',
    contentHash: 'mno345', extractedAt: new Date().toISOString(),
  },
];

export const DEMO_KEYWORDS: InferredKeyword[] = [
  { id: 'kw1', keyword: 'buy leggings online india', frequency: 48, relevanceScore: 0.97, intent: 'transactional', sourceAds: ['ad_001', 'ad_003'] },
  { id: 'kw2', keyword: 'go colors bottomwear', frequency: 35, relevanceScore: 0.94, intent: 'navigational', sourceAds: ['ad_001'] },
  { id: 'kw3', keyword: 'women ethnic wear festive', frequency: 29, relevanceScore: 0.88, intent: 'commercial', sourceAds: ['ad_002'] },
  { id: 'kw4', keyword: 'affordable women fashion india', frequency: 52, relevanceScore: 0.85, intent: 'commercial', sourceAds: ['ad_001', 'ad_003', 'ad_005'] },
  { id: 'kw5', keyword: 'free delivery fashion online', frequency: 41, relevanceScore: 0.82, intent: 'transactional', sourceAds: ['ad_003'] },
  { id: 'kw6', keyword: 'plus size women clothing india', frequency: 23, relevanceScore: 0.79, intent: 'commercial', sourceAds: ['ad_005'] },
  { id: 'kw7', keyword: 'celebrity fashion india limited edition', frequency: 18, relevanceScore: 0.76, intent: 'informational', sourceAds: ['ad_004'] },
  { id: 'kw8', keyword: 'cotton palazzo trousers online', frequency: 31, relevanceScore: 0.73, intent: 'transactional', sourceAds: ['ad_001', 'ad_002'] },
  { id: 'kw9', keyword: 'women churidar pants discount', frequency: 26, relevanceScore: 0.69, intent: 'transactional', sourceAds: ['ad_001'] },
  { id: 'kw10', keyword: 'indian women casuals brands', frequency: 19, relevanceScore: 0.65, intent: 'informational', sourceAds: ['ad_003', 'ad_005'] },
];

export const DEMO_ANALYSIS: CreativeAnalysis[] = [
  {
    adId: 'ad_001',
    dominantColors: [
      { hex: '#f97316', percentage: 45, label: 'Brand Orange' },
      { hex: '#ffffff', percentage: 35, label: 'White' },
      { hex: '#1a1a1a', percentage: 20, label: 'Dark' },
    ],
    ctaStyle: 'urgency', emotionalTriggers: ['comfort', 'confidence', 'value'],
    offerStructure: 'Percentage Discount + CTA', productPositioning: 'Value for Money',
    fashionCategory: 'Bottomwear',
  },
  {
    adId: 'ad_002',
    dominantColors: [
      { hex: '#dc2626', percentage: 40, label: 'Festive Red' },
      { hex: '#fbbf24', percentage: 35, label: 'Gold' },
      { hex: '#ffffff', percentage: 25, label: 'White' },
    ],
    ctaStyle: 'fomo', emotionalTriggers: ['celebration', 'festive', 'aspiration'],
    offerStructure: 'Price Anchor (₹299)', productPositioning: 'Aspirational / Festive',
    fashionCategory: 'Ethnic Wear',
  },
];

export const DEMO_STATS: ScraperStats = {
  totalAds: 47,
  totalImages: 89,
  totalVideos: 12,
  totalKeywords: 156,
  totalCategories: 8,
  activeCampaigns: 14,
};

export const DEMO_FEED_ITEMS: ExtractionFeedItem[] = [
  { id: 'f1', timestamp: '10:23:01', headline: 'Comfort Meets Color — Shop Now', cta: 'Shop Now', assetType: 'image', brand: 'Go Colors', status: 'complete' },
  { id: 'f2', timestamp: '10:23:04', headline: 'New Arrivals — Festival Season', cta: 'Explore Collection', assetType: 'video', brand: 'Go Colors', status: 'complete' },
  { id: 'f3', timestamp: '10:23:08', headline: 'Free Delivery on Orders ₹499+', cta: 'Order Now', assetType: 'responsive', brand: 'Go Colors', status: 'complete' },
  { id: 'f4', timestamp: '10:23:11', headline: 'Limited Edition — Bollywood X Go Colors', cta: 'Shop Limited', assetType: 'carousel', brand: 'Go Colors', status: 'processing' },
];
