import { getActualSKUs } from './actualDataLoader';
import { getSearchTermsForSku, SearchTerm } from './searchTerms';
import { CAMPAIGN_SKU_MAP } from './campaignSkuMap';
import { ASSET_GROUP_LEGGINGS_CORE, AssetGroup } from './assetGroups';
import { FEED_HEALTH_TB_CAL_BLK_M, FeedHealthData } from './feedHealth';

export interface AccountKeywordsSummary {
  topTerms: SearchTerm[];
  intentDistribution: { intent: string; spend: number; revenue: number; count: number }[];
  totalSpend: number;
  totalRevenue: number;
}

export function getAccountKeywordsSummary(): AccountKeywordsSummary {
  const topSkus = getActualSKUs().slice(0, 5);
  let allTerms: SearchTerm[] = [];
  
  topSkus.forEach(sku => {
    const mapping = CAMPAIGN_SKU_MAP[sku.id] || { campaign: 'Other', roas: 2.0 };
    const data = getSearchTermsForSku(sku, mapping as any);
    allTerms = [...allTerms, ...data.terms];
  });

  // Sort by spend
  const uniqueTermsMap = new Map<string, SearchTerm>();
  allTerms.forEach(t => {
    if (uniqueTermsMap.has(t.term)) {
      const existing = uniqueTermsMap.get(t.term)!;
      existing.spend += t.spend;
      existing.revenue += t.revenue;
      existing.clicks += t.clicks;
    } else {
      uniqueTermsMap.set(t.term, { ...t });
    }
  });

  const uniqueTerms = Array.from(uniqueTermsMap.values()).sort((a, b) => b.spend - a.spend);

  const intentGroups = ['branded', 'generic_high', 'generic_low', 'on_brand', 'competitor', 'negative'];
  const intentDist = intentGroups.map(intent => {
    const terms = uniqueTerms.filter(t => t.intent === intent);
    return {
      intent,
      spend: terms.reduce((s, t) => s + t.spend, 0),
      revenue: terms.reduce((s, t) => s + t.revenue, 0),
      count: terms.length
    };
  });

  return {
    topTerms: uniqueTerms.slice(0, 20),
    intentDistribution: intentDist,
    totalSpend: uniqueTerms.reduce((s, t) => s + t.spend, 0),
    totalRevenue: uniqueTerms.reduce((s, t) => s + t.revenue, 0),
  };
}

export function getAccountAssetGroups(): AssetGroup[] {
  // Mocking multiple asset groups
  return [
    ASSET_GROUP_LEGGINGS_CORE,
    {
      ...ASSET_GROUP_LEGGINGS_CORE,
      name: 'Kurtis - Festive',
      campaignName: 'KM | PMax | Kurti Pant',
      overallScore: 82,
      headlines: ASSET_GROUP_LEGGINGS_CORE.headlines.slice(0, 12),
    },
    {
      ...ASSET_GROUP_LEGGINGS_CORE,
      name: 'Saree Shapers - Essential',
      campaignName: 'Performance Max | Saree Shaper',
      overallScore: 45,
      missingAssets: ['Video', '6 Images', '3 Headlines'],
    }
  ];
}

export function getAccountFeedHealth() {
  return {
    totalItems: 1240,
    approved: 1182,
    disapproved: 42,
    excluded: 16,
    topIssues: [
      { reason: 'Missing GTIN', count: 480, impact: 'High' },
      { reason: 'Short Titles', count: 320, impact: 'Medium' },
      { reason: 'Low Resolution Images', count: 12, impact: 'Critical' },
      { reason: 'Missing Product Type', count: 85, impact: 'Low' },
    ],
    attributeQuality: [
      { field: 'Title', score: 82 },
      { field: 'Description', score: 64 },
      { field: 'Image', score: 91 },
      { field: 'Price/Availability', score: 100 },
    ]
  };
}
