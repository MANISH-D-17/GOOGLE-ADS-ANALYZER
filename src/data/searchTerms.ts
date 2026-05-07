import { ActualSKU } from './actualDataLoader';
import { CampaignMapping } from './campaignSkuMap';

export type KeywordIntent = 'branded' | 'generic_high' | 'generic_low' | 'competitor' | 'negative' | 'on_brand';

export interface SearchTerm {
  term: string;
  clicks: number;
  impressions: number;
  ctr: number;       // percentage
  cvr: number;       // percentage
  roas: number;
  spend: number;     // rupees
  revenue: number;   // rupees
  intent: KeywordIntent;
  action: 'scale' | 'monitor' | 'add_negative' | 'optimize_bid' | 'add_to_search';
  actionNote: string;
  matchedVia: 'title' | 'headline' | 'description' | 'brand' | 'url';
}

export interface SearchTermsData {
  skuId: string;
  campaignName: string;
  totalTerms: number;
  terms: SearchTerm[];
  negativeKeywords: string[];  // already added negatives
  recommendedNegatives: string[];  // recommended to add
}

export const SEARCH_TERMS_TB_CAL_BLK_M: SearchTermsData = {
  skuId: 'TB-CAL-BLK-M',
  campaignName: 'KM | Pmax | Leggings',
  totalTerms: 28,
  negativeKeywords: ['kids leggings', 'yoga mat', 'leggings with pockets men'],
  recommendedNegatives: ['gym leggings', 'yoga leggings', 'workout leggings', 'compression leggings'],
  terms: [
    { term: 'cotton leggings for women', clicks: 412, impressions: 8240, ctr: 5.0, cvr: 5.8, roas: 6.4, spend: 2884, revenue: 18457, intent: 'generic_high', action: 'scale', actionNote: 'Core term. Highest volume + ROAS above target. Increase budget allocation.', matchedVia: 'title' },
    { term: 'black ankle leggings', clicks: 288, impressions: 5760, ctr: 5.0, cvr: 6.2, roas: 7.1, spend: 2016, revenue: 14313, intent: 'generic_high', action: 'scale', actionNote: 'High-intent descriptive term. Matches title exactly. Scale.', matchedVia: 'title' },
    { term: 'twin birds leggings', clicks: 142, impressions: 1775, ctr: 8.0, cvr: 8.4, roas: 9.2, spend: 994, revenue: 9144, intent: 'branded', action: 'scale', actionNote: 'Branded term. Highest CVR. Protect this traffic. Also run in Search campaign.', matchedVia: 'brand' },
    { term: 'twin birds cotton legging', clicks: 98, impressions: 1225, ctr: 8.0, cvr: 9.1, roas: 11.2, spend: 686, revenue: 7683, intent: 'branded', action: 'scale', actionNote: 'Branded + product term. Extremely high intent. Scale within branded budget.', matchedVia: 'brand' },
    { term: 'leggings under kurti', clicks: 196, impressions: 4900, ctr: 4.0, cvr: 4.1, roas: 4.8, spend: 1372, revenue: 6586, intent: 'on_brand', action: 'monitor', actionNote: 'On-brand use case. ROAS above target. Monitor trend before scaling.', matchedVia: 'description' },
    { term: 'ankle length leggings', clicks: 167, impressions: 3913, ctr: 4.3, cvr: 4.5, roas: 5.2, spend: 1169, revenue: 6079, intent: 'generic_high', action: 'scale', actionNote: 'Descriptive term. Matches product attribute. Good ROAS.', matchedVia: 'title' },
    { term: 'cotton legging black', clicks: 144, impressions: 3200, ctr: 4.5, cvr: 5.1, roas: 5.9, spend: 1008, revenue: 5947, intent: 'generic_high', action: 'scale', actionNote: 'Color + material match. High conversion intent.', matchedVia: 'title' },
    { term: 'leggings for daily wear', clicks: 134, impressions: 3350, ctr: 4.0, cvr: 3.7, roas: 4.3, spend: 938, revenue: 4033, intent: 'generic_high', action: 'monitor', actionNote: 'Lifestyle term. ROAS just above target. Monitor.', matchedVia: 'description' },
    { term: 'women leggings cotton', clicks: 121, impressions: 2834, ctr: 4.3, cvr: 4.2, roas: 4.9, spend: 847, revenue: 4150, intent: 'generic_high', action: 'monitor', actionNote: 'Generic + material. Solid ROAS. Can scale cautiously.', matchedVia: 'title' },
    { term: 'comfortable leggings for women', clicks: 98, impressions: 2450, ctr: 4.0, cvr: 3.5, roas: 4.1, spend: 686, revenue: 2812, intent: 'generic_high', action: 'monitor', actionNote: 'Comfort-based search. Marginally above target ROAS. Monitor.', matchedVia: 'description' },
    { term: 'slim fit leggings', clicks: 87, impressions: 2175, ctr: 4.0, cvr: 3.4, roas: 3.9, spend: 609, revenue: 2375, intent: 'generic_high', action: 'optimize_bid', actionNote: 'ROAS below target (3.9 vs 4.0). Slightly reduce bid allocation.', matchedVia: 'description' },
    { term: 'kurti legging combo', clicks: 76, impressions: 1900, ctr: 4.0, cvr: 4.8, roas: 5.6, spend: 532, revenue: 2979, intent: 'on_brand', action: 'monitor', actionNote: 'Combo search. Strong buyer intent. Ensure product page highlights pairing.', matchedVia: 'description' },
    { term: 'black cotton legging india', clicks: 68, impressions: 1700, ctr: 4.0, cvr: 5.0, roas: 5.8, spend: 476, revenue: 2760, intent: 'generic_high', action: 'scale', actionNote: 'Geo-qualified intent. Good ROAS. Scale.', matchedVia: 'title' },
    { term: 'gym leggings women', clicks: 88, impressions: 2200, ctr: 4.0, cvr: 1.2, roas: 0.8, spend: 616, revenue: 492, intent: 'negative', action: 'add_negative', actionNote: '0.8× ROAS. Wrong intent — gym buyer, not everyday wear buyer. Add as negative immediately.', matchedVia: 'headline' },
    { term: 'yoga leggings', clicks: 64, impressions: 1600, ctr: 4.0, cvr: 0.9, roas: 0.6, spend: 448, revenue: 268, intent: 'negative', action: 'add_negative', actionNote: '0.6× ROAS. Yoga buyer wants different product features. Add as negative.', matchedVia: 'headline' },
    { term: 'workout leggings cotton', clicks: 52, impressions: 1300, ctr: 4.0, cvr: 1.1, roas: 0.7, spend: 364, revenue: 254, intent: 'negative', action: 'add_negative', actionNote: '0.7× ROAS. Activewear intent. Wrong audience for this SKU.', matchedVia: 'headline' },
    { term: 'compression leggings women', clicks: 41, impressions: 1025, ctr: 4.0, cvr: 0.8, roas: 0.5, spend: 287, revenue: 143, intent: 'negative', action: 'add_negative', actionNote: '0.5× ROAS. Medical/athletic intent. Completely wrong audience.', matchedVia: 'headline' },
    { term: 'churidar legging cotton', clicks: 58, impressions: 1450, ctr: 4.0, cvr: 3.8, roas: 4.4, spend: 406, revenue: 1786, intent: 'on_brand', action: 'monitor', actionNote: 'Style-specific search. Good ROAS. Monitor conversion rate.', matchedVia: 'description' },
    { term: 'ladies legging black', clicks: 49, impressions: 1225, ctr: 4.0, cvr: 4.2, roas: 4.9, spend: 343, revenue: 1680, intent: 'generic_high', action: 'monitor', actionNote: 'Solid term. Matches product. Monitor.', matchedVia: 'title' },
    { term: 'buy leggings online india', clicks: 44, impressions: 1100, ctr: 4.0, cvr: 3.9, roas: 4.5, spend: 308, revenue: 1386, intent: 'generic_high', action: 'monitor', actionNote: 'Purchase-intent search. Decent ROAS. Monitor.', matchedVia: 'headline' },
    { term: 'freesize legging women', clicks: 39, impressions: 975, ctr: 4.0, cvr: 2.8, roas: 3.2, spend: 273, revenue: 873, intent: 'generic_low', action: 'optimize_bid', actionNote: 'Low ROAS. Size-ambiguous search. Reduce bid or add size-specific negative.', matchedVia: 'description' },
    { term: 'cotton pants for women', clicks: 34, impressions: 850, ctr: 4.0, cvr: 2.1, roas: 2.4, spend: 238, revenue: 571, intent: 'generic_low', action: 'optimize_bid', actionNote: 'ROAS below target. Broad pants intent. Reduce bid.', matchedVia: 'title' },
    { term: 'jockey leggings women', clicks: 28, impressions: 700, ctr: 4.0, cvr: 1.4, roas: 1.2, spend: 196, revenue: 235, intent: 'competitor', action: 'add_negative', actionNote: 'Competitor brand search (Jockey). User looking for Jockey, not Twin Birds. Add as negative.', matchedVia: 'headline' },
    { term: 'lymio leggings', clicks: 22, impressions: 550, ctr: 4.0, cvr: 0.9, roas: 0.7, spend: 154, revenue: 107, intent: 'competitor', action: 'add_negative', actionNote: 'Competitor brand. Wrong audience. Add as negative.', matchedVia: 'headline' },
    { term: 'leggings below 200', clicks: 31, impressions: 775, ctr: 4.0, cvr: 0.6, roas: 0.4, spend: 217, revenue: 86, intent: 'negative', action: 'add_negative', actionNote: 'Price-sensitive searcher. Our price point is ₹449+. Will never convert. Add as negative.', matchedVia: 'headline' },
    { term: 'kids leggings cotton', clicks: 18, impressions: 450, ctr: 4.0, cvr: 0.0, roas: 0.0, spend: 126, revenue: 0, intent: 'negative', action: 'add_negative', actionNote: 'Wrong demographic. Zero conversions. Already added as negative.', matchedVia: 'headline' },
    { term: 'ankle legging formal', clicks: 27, impressions: 675, ctr: 4.0, cvr: 3.1, roas: 3.6, spend: 189, revenue: 680, intent: 'generic_low', action: 'optimize_bid', actionNote: 'Formal context. Slightly below target ROAS. Reduce bid.', matchedVia: 'description' },
    { term: 'twin birds churidar', clicks: 21, impressions: 263, ctr: 8.0, cvr: 7.2, roas: 8.4, spend: 147, revenue: 1234, intent: 'branded', action: 'scale', actionNote: 'Branded category search. Very high CVR. Scale aggressively.', matchedVia: 'brand' },
  ]
};

export const SEARCH_TERMS_TB_SS_BGE_M: SearchTermsData = {
  skuId: 'TB-SS-BGE-M',
  campaignName: 'Performance Max | Saree Shaper',
  totalTerms: 22,
  negativeKeywords: ['saree undergarment cheap', 'saree petticoat under 100'],
  recommendedNegatives: ['saree petticoat plain', 'saree shapewear heavy', 'saree waist trainer'],
  terms: [
    { term: 'saree shaper', clicks: 524, impressions: 8733, ctr: 6.0, cvr: 7.2, roas: 8.4, spend: 3144, revenue: 26409, intent: 'generic_high', action: 'scale', actionNote: 'Exact category match. Best performing term. Max budget here.', matchedVia: 'title' },
    { term: 'twin birds saree shaper', clicks: 312, impressions: 3900, ctr: 8.0, cvr: 11.2, roas: 14.1, spend: 1872, revenue: 26395, intent: 'branded', action: 'scale', actionNote: 'Branded + product. Exceptional ROAS. Protect at all costs.', matchedVia: 'brand' },
    { term: 'saree shaper beige', clicks: 198, impressions: 2475, ctr: 8.0, cvr: 9.8, roas: 11.6, spend: 1188, revenue: 13780, intent: 'generic_high', action: 'scale', actionNote: 'Color-specific search. Matches SKU exactly. Scale.', matchedVia: 'title' },
    { term: 'slimming saree shapewear', clicks: 176, impressions: 4400, ctr: 4.0, cvr: 5.4, roas: 6.3, spend: 1056, revenue: 6652, intent: 'generic_high', action: 'scale', actionNote: 'Feature-based search. Converts well. Scale.', matchedVia: 'description' },
    { term: 'saree inner wear shaper', clicks: 144, impressions: 3600, ctr: 4.0, cvr: 4.8, roas: 5.6, spend: 864, revenue: 4838, intent: 'on_brand', action: 'monitor', actionNote: 'Use-case search. Good ROAS. Monitor before scaling.', matchedVia: 'description' },
    { term: 'shapewear for saree', clicks: 132, impressions: 3300, ctr: 4.0, cvr: 4.2, roas: 4.9, spend: 792, revenue: 3880, intent: 'on_brand', action: 'monitor', actionNote: 'Alternate phrasing. Solid ROAS. Monitor.', matchedVia: 'description' },
    { term: 'saree shaper m size', clicks: 98, impressions: 1633, ctr: 6.0, cvr: 8.7, roas: 10.2, spend: 588, revenue: 5997, intent: 'generic_high', action: 'scale', actionNote: 'Size-specific search. Very high CVR. Scale.', matchedVia: 'title' },
    { term: 'cotton saree shaper', clicks: 87, impressions: 2175, ctr: 4.0, cvr: 5.1, roas: 5.9, spend: 522, revenue: 3079, intent: 'generic_high', action: 'scale', actionNote: 'Material + category. High intent. Scale.', matchedVia: 'description' },
    { term: 'saree shapewear online india', clicks: 76, impressions: 1900, ctr: 4.0, cvr: 4.4, roas: 5.1, spend: 456, revenue: 2325, intent: 'generic_high', action: 'monitor', actionNote: 'Purchase intent geo-qualified. Good ROAS. Monitor.', matchedVia: 'headline' },
    { term: 'saree waist shaper', clicks: 64, impressions: 1600, ctr: 4.0, cvr: 2.8, roas: 3.2, spend: 384, revenue: 1228, intent: 'generic_low', action: 'optimize_bid', actionNote: 'ROAS below target. Slightly different product (waist-focused). Reduce bid.', matchedVia: 'description' },
    { term: 'saree petticoat shaper', clicks: 54, impressions: 1350, ctr: 4.0, cvr: 3.9, roas: 4.5, spend: 324, revenue: 1458, intent: 'on_brand', action: 'monitor', actionNote: 'Adjacent product category. Acceptable ROAS. Monitor.', matchedVia: 'description' },
    { term: 'saree shaper cheap', clicks: 48, impressions: 1200, ctr: 4.0, cvr: 1.2, roas: 0.9, spend: 288, revenue: 259, intent: 'negative', action: 'add_negative', actionNote: 'Price-sensitive searcher. Below cost ROAS. Add negative.', matchedVia: 'headline' },
    { term: 'saree shapewear flipkart', clicks: 41, impressions: 1025, ctr: 4.0, cvr: 0.8, roas: 0.6, spend: 246, revenue: 147, intent: 'competitor', action: 'add_negative', actionNote: 'Platform-specific search (Flipkart). User wants to buy elsewhere. Add as negative.', matchedVia: 'headline' },
    { term: 'saree waist trainer', clicks: 36, impressions: 900, ctr: 4.0, cvr: 0.6, roas: 0.5, spend: 216, revenue: 108, intent: 'negative', action: 'add_negative', actionNote: 'Wrong product category (trainer ≠ shaper). Add as negative.', matchedVia: 'headline' },
    { term: 'saree shape belt', clicks: 28, impressions: 700, ctr: 4.0, cvr: 1.1, roas: 0.8, spend: 168, revenue: 134, intent: 'negative', action: 'add_negative', actionNote: 'Belt-style product intent. Different product. Add as negative.', matchedVia: 'headline' },
  ]
};

export const SEARCH_TERMS_TB_KU_COR_XL_1018: SearchTermsData = {
  skuId: 'TB-KU-COR-XL-1018',
  campaignName: 'KM | PMax | Kurti Pant',
  totalTerms: 24,
  negativeKeywords: [],
  recommendedNegatives: ['kurti pant combo set', 'only kurti no pant', 'readymade salwar', 'palazzo pants', 'bootcut pants'],
  terms: [
    { term: 'kurti pant set', clicks: 287, impressions: 5740, ctr: 5.0, cvr: 0.7, roas: 0.5, spend: 2009, revenue: 1004, intent: 'generic_low', action: 'add_negative', actionNote: 'CRITICAL: "Set" searcher wants kurti + pant combo. We sell only the pant. 95% bounce rate. Add as negative.', matchedVia: 'title' },
    { term: 'cotton kurti pant', clicks: 198, impressions: 3960, ctr: 5.0, cvr: 1.5, roas: 1.1, spend: 1386, revenue: 1524, intent: 'generic_high', action: 'optimize_bid', actionNote: 'Core term but ROAS below target. Check if product page explains it\'s pants-only.', matchedVia: 'title' },
    { term: 'kurti bottom wear coral', clicks: 144, impressions: 2400, ctr: 6.0, cvr: 2.1, roas: 1.8, spend: 1008, revenue: 1814, intent: 'generic_high', action: 'optimize_bid', actionNote: 'Color + category match. Below target ROAS. Reduce bid, improve product page.', matchedVia: 'title' },
    { term: 'xl kurti pants women', clicks: 112, impressions: 1866, ctr: 6.0, cvr: 2.4, roas: 2.2, spend: 784, revenue: 1724, intent: 'generic_high', action: 'optimize_bid', actionNote: 'Size-specific. Better intent. Still below ROAS target. Work on page.', matchedVia: 'title' },
    { term: 'salwar pants cotton', clicks: 98, impressions: 2450, ctr: 4.0, cvr: 0.4, roas: 0.3, spend: 686, revenue: 205, intent: 'negative', action: 'add_negative', actionNote: 'Salwar intent ≠ kurti pant. Different garment. Zero conversion potential. Add as negative.', matchedVia: 'headline' },
    { term: 'readymade palazzo pant', clicks: 76, impressions: 1900, ctr: 4.0, cvr: 0.0, roas: 0.0, spend: 532, revenue: 0, intent: 'negative', action: 'add_negative', actionNote: 'Palazzo ≠ kurti pant. Zero conversions. Add as negative immediately.', matchedVia: 'headline' },
    { term: 'bootcut cotton pant women', clicks: 64, impressions: 1600, ctr: 4.0, cvr: 0.0, roas: 0.0, spend: 448, revenue: 0, intent: 'negative', action: 'add_negative', actionNote: 'Style mismatch. Zero conversions. Add as negative.', matchedVia: 'headline' },
    { term: 'twin birds kurti pant', clicks: 58, impressions: 725, ctr: 8.0, cvr: 5.2, roas: 4.8, spend: 406, revenue: 1948, intent: 'branded', action: 'scale', actionNote: 'Branded term. High CVR. Scale. Also add to Search Remarketing campaign.', matchedVia: 'brand' },
    { term: 'kurti matching bottom', clicks: 52, impressions: 1300, ctr: 4.0, cvr: 1.8, roas: 1.4, spend: 364, revenue: 509, intent: 'generic_low', action: 'optimize_bid', actionNote: '"Matching" implies set intent. Below ROAS. Reduce bid.', matchedVia: 'description' },
    { term: 'coral pants women xl', clicks: 43, impressions: 716, ctr: 6.0, cvr: 3.7, roas: 3.4, spend: 301, revenue: 1023, intent: 'generic_high', action: 'optimize_bid', actionNote: 'Specific intent. Below ROAS target. Optimize.', matchedVia: 'title' },
  ]
};

export function generateSyntheticSearchTerms(sku: ActualSKU, mapping: CampaignMapping): SearchTermsData {
  const words = sku.name.toLowerCase().split(' ').filter(w => w.length > 3);
  const coreTerm = words.slice(0, 2).join(' ');
  
  const terms: SearchTerm[] = [
    { 
      term: coreTerm, 
      clicks: Math.floor(sku.conversions * 5), 
      impressions: Math.floor(sku.impressions * 0.1), 
      ctr: sku.ctr, 
      cvr: sku.cvr, 
      roas: sku.roas, 
      spend: Math.floor(sku.spend * 0.4), 
      revenue: Math.floor(sku.revenue * 0.4), 
      intent: sku.state === 'winner' ? 'generic_high' : 'generic_low',
      action: sku.roas > 4 ? 'scale' : 'optimize_bid',
      actionNote: 'Synthetic data based on SKU performance.',
      matchedVia: 'title'
    },
    { 
      term: `twin birds ${coreTerm}`, 
      clicks: Math.floor(sku.conversions * 2), 
      impressions: Math.floor(sku.impressions * 0.02), 
      ctr: sku.ctr * 1.5, 
      cvr: sku.cvr * 2, 
      roas: sku.roas * 1.5, 
      spend: Math.floor(sku.spend * 0.1), 
      revenue: Math.floor(sku.revenue * 0.2), 
      intent: 'branded',
      action: 'scale',
      actionNote: 'Branded term for this SKU.',
      matchedVia: 'brand'
    }
  ];

  return {
    skuId: sku.id,
    campaignName: mapping.campaign,
    totalTerms: 12,
    terms,
    negativeKeywords: [],
    recommendedNegatives: ['cheap ' + coreTerm, 'free ' + coreTerm]
  };
}

export function getSearchTermsForSku(sku: ActualSKU, mapping: CampaignMapping): SearchTermsData {
  if (sku.id === 'TB-CAL-BLK-M') return SEARCH_TERMS_TB_CAL_BLK_M;
  if (sku.id === 'TB-SS-BGE-M') return SEARCH_TERMS_TB_SS_BGE_M;
  if (sku.id === 'TB-KU-COR-XL-1018') return SEARCH_TERMS_TB_KU_COR_XL_1018;
  return generateSyntheticSearchTerms(sku, mapping);
}
