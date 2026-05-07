export interface AssetItem {
  type: 'headline' | 'description' | 'image' | 'video' | 'sitelink';
  content: string;
  performanceLabel: 'BEST' | 'GOOD' | 'LOW' | 'PENDING' | 'UNRATED';
  impressions?: number;
  clicks?: number;
  conversions?: number;
  pinned?: boolean;
  issue?: string;  // e.g. "too short", "duplicate of another headline"
}

export interface AssetGroup {
  name: string;
  campaignName: string;
  status: 'ENABLED' | 'PAUSED' | 'REMOVED';
  finalUrl: string;
  headlines: AssetItem[];      // up to 15
  descriptions: AssetItem[];   // up to 5
  images: AssetItem[];         // up to 20
  videos: AssetItem[];         // up to 5
  sitelinks: AssetItem[];
  overallScore: number;        // 0-100, Google's asset group quality score
  missingAssets: string[];     // what's missing
  audienceSignals: string[];   // which GA4 audiences are used
}

export interface CreativeHealthScore {
  overall: number;  // 0-100
  breakdown: {
    category: string;
    score: number;
    maxScore: number;
    status: 'good' | 'warning' | 'critical';
    issue?: string;
  }[];
}

export const ASSET_GROUP_LEGGINGS_CORE: AssetGroup = {
  name: 'Leggings - Core',
  campaignName: 'KM | Pmax | Leggings',
  status: 'ENABLED',
  finalUrl: 'https://twinbirds.co.in/collections/leggings',
  overallScore: 64,
  missingAssets: ['landscape image (1.91:1 ratio)', 'video asset', '5+ more headlines needed (only 8 of 15 filled)'],
  audienceSignals: ['Cart abandoners - all products', 'Purchasers - last 90 days', 'In-market: Women\'s Activewear', 'In-market: Women\'s Fashion'],
  headlines: [
    { type: 'headline', content: 'Shop Twin Birds Leggings', performanceLabel: 'BEST', impressions: 48200, clicks: 1928, conversions: 87 },
    { type: 'headline', content: 'Cotton Ankle Leggings Online', performanceLabel: 'BEST', impressions: 41600, clicks: 1664, conversions: 71 },
    { type: 'headline', content: 'Premium Women\'s Leggings', performanceLabel: 'GOOD', impressions: 32100, clicks: 1284, conversions: 48 },
    { type: 'headline', content: 'Comfortable Cotton Leggings', performanceLabel: 'GOOD', impressions: 28400, clicks: 1136, conversions: 42 },
    { type: 'headline', content: 'Buy Leggings Under ₹500', performanceLabel: 'LOW', impressions: 18900, clicks: 378, conversions: 6, issue: 'Price claim may cause wrong-intent traffic. Consider removing.' },
    { type: 'headline', content: 'Twin Birds - Trusted Apparel', performanceLabel: 'LOW', impressions: 14200, clicks: 284, conversions: 4, issue: 'Too generic. Not product-specific enough.' },
    { type: 'headline', content: 'Black Ankle Legging For Women', performanceLabel: 'GOOD', impressions: 26700, clicks: 1068, conversions: 39 },
    { type: 'headline', content: 'Best Leggings For Everyday Wear', performanceLabel: 'GOOD', impressions: 24100, clicks: 964, conversions: 35 },
  ],
  descriptions: [
    { type: 'description', content: 'Shop premium cotton ankle leggings from Twin Birds. Comfortable fit for all-day wear. Available in multiple colors and sizes.', performanceLabel: 'BEST', impressions: 52800, clicks: 2112, conversions: 98 },
    { type: 'description', content: 'Twin Birds cotton leggings — soft, durable, and perfect under kurtis. Free shipping on orders above ₹499.', performanceLabel: 'GOOD', impressions: 38400, clicks: 1536, conversions: 62 },
    { type: 'description', content: 'High-quality women\'s leggings at affordable prices. 4-way stretch fabric for maximum comfort.', performanceLabel: 'GOOD', impressions: 29100, clicks: 1164, conversions: 43 },
  ],
  images: [
    { type: 'image', content: 'Product on white background — Black legging', performanceLabel: 'BEST' },
    { type: 'image', content: 'Lifestyle photo — woman in legging + kurti', performanceLabel: 'GOOD' },
    { type: 'image', content: 'Product flat lay — multiple colors', performanceLabel: 'GOOD' },
    { type: 'image', content: 'Close-up fabric texture shot', performanceLabel: 'LOW', issue: 'Low engagement. Fabric closeup does not show fit or style.' },
  ],
  videos: [],
  sitelinks: [
    { type: 'sitelink', content: 'All Leggings →  twinbirds.co.in/collections/leggings', performanceLabel: 'GOOD' },
    { type: 'sitelink', content: 'Saree Shapers → twinbirds.co.in/collections/saree-shaper', performanceLabel: 'GOOD' },
    { type: 'sitelink', content: 'Offers & Deals → twinbirds.co.in/pages/offers', performanceLabel: 'GOOD' },
  ],
};

export const CREATIVE_HEALTH_TB_CAL_BLK_M: CreativeHealthScore = {
  overall: 64,
  breakdown: [
    { category: 'Headlines', score: 8, maxScore: 15, status: 'warning', issue: '7 headline slots empty. Every empty slot = Google has fewer variations to test.' },
    { category: 'Descriptions', score: 3, maxScore: 5, status: 'warning', issue: '2 description slots unused.' },
    { category: 'Images', score: 4, maxScore: 20, status: 'critical', issue: 'Only 4 images. Missing landscape format blocks Display/YouTube placements.' },
    { category: 'Videos', score: 0, maxScore: 5, status: 'critical', issue: 'No video = zero YouTube/Shorts coverage.' },
    { category: 'Sitelinks', score: 3, maxScore: 10, status: 'warning', issue: 'Only 3 sitelinks. Add product category + size guide + return policy links.' },
    { category: 'Asset quality', score: 6, maxScore: 10, status: 'warning', issue: '2 LOW-rated headlines dragging performance. Remove and replace.' },
  ]
};

export function getAssetGroupForSku(skuId: string): AssetGroup {
  // Defaulting to Leggings Core for now as per user request example
  return ASSET_GROUP_LEGGINGS_CORE;
}

export function getCreativeHealthForSku(skuId: string): CreativeHealthScore {
  if (skuId === 'TB-CAL-BLK-M') return CREATIVE_HEALTH_TB_CAL_BLK_M;
  return {
    overall: 85,
    breakdown: [
      { category: 'Headlines', score: 12, maxScore: 15, status: 'good' },
      { category: 'Descriptions', score: 5, maxScore: 5, status: 'good' },
      { category: 'Images', score: 15, maxScore: 20, status: 'good' },
      { category: 'Videos', score: 2, maxScore: 5, status: 'warning' },
      { category: 'Sitelinks', score: 8, maxScore: 10, status: 'good' },
    ]
  };
}
