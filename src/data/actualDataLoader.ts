import campaigns from './actual/campaigns.json';
import products from './actual/products.json';
import { SEARCH_TERMS_TB_CAL_BLK_M, SEARCH_TERMS_TB_SS_BGE_M, SEARCH_TERMS_TB_KU_COR_XL_1018, SearchTerm } from './searchTerms';

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
