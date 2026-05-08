import campaigns from './actual/campaigns.json';
import products from './actual/products.json';
import { SEARCH_TERMS_TB_CAL_BLK_M, SEARCH_TERMS_TB_SS_BGE_M, SEARCH_TERMS_TB_KU_COR_XL_1018, SearchTerm } from './searchTerms';

export type SKUState = "winner" | "bleeder" | "sleeper" | "dead" | "stable";

export interface ActualSKU {
  id: string;
  name: string;
  category: string;
  availability: string;
  price: string;
  status: 'active' | 'disapproved' | 'excluded' | 'pending';
  attributes: {
    field: string;
    value: string;
    quality: 'good' | 'warning' | 'critical';
    issue?: string;
  }[];
  // Performance metrics
  spend: number;
  revenue: number;
  conversions: number;
  impressions: number;
  roas: number;
  ctr: number;
  cvr: number;
  clicks: number;
  state: 'winner' | 'bleeder' | 'sleeper' | 'dead' | 'stable';
}

const validCampaigns = campaigns.filter(c => c.name !== '--' && c.spend > 0);

// Robust keyword-based mapping
const getKeywords = (name: string) => {
  const n = name.toLowerCase();
  const keywords = [];
  if (n.includes('legging')) keywords.push('legging');
  if (n.includes('saree shaper') || n.includes('ss') || n.includes('sareeshaper')) keywords.push('saree shaper');
  if (n.includes('kurti pant')) keywords.push('kurti pant');
  if (n.includes('palazzo')) keywords.push('palazzo');
  if (n.includes('pant')) keywords.push('pant');
  if (n.includes('top') || n.includes('tee')) keywords.push('top');
  if (n.includes('kids')) keywords.push('kids');
  if (n.includes('shimmer')) keywords.push('shimmer');
  if (n.includes('churidhar') || n.includes('churidar')) keywords.push('churidhar');
  if (n.includes('ankle')) keywords.push('ankle');
  if (n.includes('cropped')) keywords.push('cropped');
  if (n.includes('tights') || n.includes('performance wear')) keywords.push('tights');
  if (n.includes('brand')) keywords.push('brand'); // Brand campaigns
  if (n.includes('shopping') || n.includes('feed') || n.includes('pmax')) keywords.push('all_approved'); // Broad campaigns
  return keywords;
};

const skuToCampaignsMap: Record<string, string[]> = {};
const campaignToSkusMap: Record<string, string[]> = {};

products.forEach(p => {
  const pKeywords = getKeywords(p.name + ' ' + p.category);
  // Add broad identifiers for products
  pKeywords.push('brand');
  if (p.status === 'active') pKeywords.push('all_approved');

  const matchedCampaigns = validCampaigns.filter(c => {
    const cKeywords = getKeywords(c.name);
    return cKeywords.some(ck => pKeywords.includes(ck));
  });

  if (matchedCampaigns.length > 0) {
    skuToCampaignsMap[p.id] = matchedCampaigns.map(c => c.name);
    matchedCampaigns.forEach(c => {
      if (!campaignToSkusMap[c.name]) campaignToSkusMap[c.name] = [];
      campaignToSkusMap[c.name].push(p.id);
    });
  }
});

export const getActualSKUs = (): ActualSKU[] => {
  return products.map(p => {
    const matchedCampaignNames = skuToCampaignsMap[p.id] || [];
    
    let perf = { spend: 0, revenue: 0, conversions: 0, impressions: 0, roas: 0, ctr: 0, clicks: 0, cvr: 0 };
    
    matchedCampaignNames.forEach(cName => {
      const campaign = validCampaigns.find(c => c.name === cName);
      if (campaign) {
        const totalSkusInCampaign = campaignToSkusMap[cName].length;
        const share = 1 / totalSkusInCampaign;
        
        perf.spend += campaign.spend * share;
        perf.revenue += campaign.revenue * share;
        perf.conversions += campaign.conversions * share;
        perf.impressions += campaign.impressions * share;
        perf.clicks += campaign.clicks * share;
      }
    });

    if (matchedCampaignNames.length > 0) {
      perf.roas = perf.revenue / (perf.spend || 1);
      perf.ctr = (perf.clicks / (perf.impressions || 1)) * 100;
      perf.cvr = (perf.conversions / (perf.clicks || 1)) * 100;
    }

    let state: any = 'stable';
    if (perf.roas > 4) state = 'winner';
    else if (perf.roas < 1.5 && perf.spend > 100) state = 'bleeder';
    else if (perf.spend < 10) state = 'sleeper';
    
    return {
      ...p,
      ...perf,
      state: state as any,
      status: p.status as any,
      attributes: p.attributes as any
    };
  });
};

export const getActualCampaigns = () => {
  return validCampaigns.map(c => {
    let intent = 'generic_low';
    const name = c.name.toLowerCase();
    if (name.includes('brand')) intent = 'branded';
    else if (c.roas > 4) intent = 'generic_high';
    else if (c.roas < 1) intent = 'negative';
    
    return {
      ...c,
      intent,
      normalizedStatus: c.status.toLowerCase()
    };
  });
};

export const getActualSearchTerms = (): (SearchTerm & { campaignName: string })[] => {
  const allTerms: (SearchTerm & { campaignName: string })[] = [];
  
  const datasets = [
    SEARCH_TERMS_TB_CAL_BLK_M,
    SEARCH_TERMS_TB_SS_BGE_M,
    SEARCH_TERMS_TB_KU_COR_XL_1018
  ];

  datasets.forEach(ds => {
    ds.terms.forEach(t => {
      allTerms.push({
        ...t,
        campaignName: ds.campaignName
      });
    });
  });

  return allTerms;
};

export const getActualSummary = () => {
  const skus = getActualSKUs();
  const totalSpend = validCampaigns.reduce((acc, c) => acc + c.spend, 0);
  const totalRevenue = validCampaigns.reduce((acc, c) => acc + c.revenue, 0);
  
  return {
    totalSpend,
    totalRevenue,
    totalConversions: validCampaigns.reduce((acc, c) => acc + c.conversions, 0),
    totalImpressions: validCampaigns.reduce((acc, c) => acc + c.impressions, 0),
    skuCount: skus.length,
    approvedCount: skus.filter(s => s.status === 'active').length,
    disapprovedCount: skus.filter(s => s.status === 'disapproved').length,
  };
};

export const GA4_FUNNEL = [
  { event: 'page_view', count: 5387178, convRate: 100, dropRate: 0 },
  { event: 'view_item', count: 2973383, convRate: 55.2, dropRate: 44.8 },
  { event: 'add_to_cart', count: 183617, convRate: 6.2, dropRate: 93.8 },
  { event: 'begin_checkout', count: 60950, convRate: 33.2, dropRate: 66.8 },
  { event: 'purchase', count: 23131, convRate: 38.0, dropRate: 62.0 },
];

export const TRAFFIC_SOURCES = [
  { channel: 'Cross-network', sessions: 652666, revenue: 5770000 },
  { channel: 'Organic Social', sessions: 442720, revenue: 7737000 },
  { channel: 'Organic Shopping', sessions: 159814, revenue: 2740000 },
  { channel: 'Paid Shopping', sessions: 76134, revenue: 1517000 },
];

export const LTV_DATA = [
  { channel: 'Cross-network', users: 430806, ltv: 14.22 },
  { channel: 'Organic Social', users: 260654, ltv: 26.28 },
  { channel: 'Organic Shopping', users: 84451, ltv: 29.71 },
];

export const DEFAULT_SKU_DETAIL = {
  dailyROAS: [
    {day:1,roas:4.5},{day:2,roas:4.3},{day:3,roas:4.8},{day:4,roas:4.2},{day:5,roas:4.6},
    {day:6,roas:5.0},{day:7,roas:4.7},{day:8,roas:4.9},{day:9,roas:5.1},{day:10,roas:4.8},
    {day:11,roas:5.2},{day:12,roas:5.0},{day:13,roas:5.3},{day:14,roas:5.1},{day:15,roas:5.4},
    {day:16,roas:5.2},{day:17,roas:5.5},{day:18,roas:5.3},{day:19,roas:5.6},{day:20,roas:5.4},
    {day:21,roas:5.7},{day:22,roas:5.5},{day:23,roas:5.8},{day:24,roas:5.6},{day:25,roas:5.9},
    {day:26,roas:5.8},{day:27,roas:6.0},{day:28,roas:5.9},{day:29,roas:6.1},{day:30,roas:6.2}
  ],
  searchTerms: [
    { term: 'cotton leggings for women', clicks: 412, cvr: 5.8, roas: 6.4, read: 'core, scale' },
    { term: 'black ankle leggings', clicks: 288, cvr: 6.2, roas: 7.1, read: 'high intent' },
    { term: 'leggings under kurti', clicks: 196, cvr: 4.1, roas: 4.8, read: 'on-brand' },
    { term: 'twin birds leggings', clicks: 142, cvr: 8.4, roas: 9.2, read: 'branded' },
    { term: 'gym leggings women', clicks: 88, cvr: 1.2, roas: 0.8, read: 'add as negative' },
  ],
  funnel: [
    { event: 'view_item', count: 7840, pct: 100 },
    { event: 'add_to_cart', count: 643, pct: 8.2 },
    { event: 'begin_checkout', count: 376, pct: 4.8 },
    { event: 'purchase', count: 142, pct: 1.8 },
  ],
  trafficSources: [
    { channel: 'Paid Search', pct: 64, sessions: 5018 },
    { channel: 'Organic Search', pct: 18, sessions: 1411 },
    { channel: 'Direct', pct: 9, sessions: 706 },
    { channel: 'Social', pct: 6, sessions: 470 },
    { channel: 'Email', pct: 3, sessions: 235 },
  ],
  actions: [
    { rank: 1, title: 'Increase daily budget by 40%', detail: '31% IS lost to budget · Est. revenue lift: ~₹65–80K/month at similar ROAS' },
    { rank: 2, title: 'Add "gym leggings" + "yoga leggings" as negative keywords', detail: '0.8× ROAS on ~₹3,200 spend · Wrong intent audience' },
    { rank: 3, title: 'Investigate Cart→Checkout drop (41%)', detail: '~10pp above benchmark · Likely shipping fee surprise · Test free shipping above ₹699' },
    { rank: 4, title: 'Diversify traffic sources', detail: 'Paid search is 64% of PDP traffic · Build organic + email channels for resilience' },
  ],
  scalingHeadroom: {
    is: '78%',
    lostBudget: '14%',
    lostRank: '8%'
  }
};
