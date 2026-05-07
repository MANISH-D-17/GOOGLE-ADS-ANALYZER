export interface FeedHealthData {
  skuId: string;
  merchantId: string;
  status: 'active' | 'disapproved' | 'excluded' | 'pending';
  disapprovalReasons: string[];
  attributes: {
    field: string;
    value: string;
    quality: 'good' | 'warning' | 'critical';
    issue?: string;
    recommendation?: string;
  }[];
  listingGroupStatus: string;
  campaignExcluded: boolean;
}

export const FEED_HEALTH_TB_CAL_BLK_M: FeedHealthData = {
  skuId: 'TB-CAL-BLK-M',
  merchantId: 'shopify_IN_8178651857212_44638116217148',
  status: 'active',
  disapprovalReasons: [],
  listingGroupStatus: 'Included in KM | Pmax | Leggings',
  campaignExcluded: false,
  attributes: [
    { field: 'title', value: 'Cotton Ankle Legging - Black M', quality: 'warning', issue: 'Title is 32 characters. Google recommends 70+ characters for Shopping.', recommendation: 'Expand to: "Twin Birds Women Cotton Ankle Legging - Black | Comfortable Daily Wear M"' },
    { field: 'price', value: '₹449', quality: 'good' },
    { field: 'availability', value: 'in stock', quality: 'good' },
    { field: 'image_link', value: 'cdn.shopify.com/...', quality: 'good' },
    { field: 'description', value: 'Premium cotton ankle legging...', quality: 'warning', issue: 'Description is 68 characters. Google allows 5000 characters — major keyword surface wasted.', recommendation: 'Expand description with: fabric composition, care instructions, size chart reference, use cases (under kurti, casual wear, office), color notes' },
    { field: 'product_type', value: 'Leggings > Cotton > Ankle Length', quality: 'good' },
    { field: 'gtin', value: '', quality: 'critical', issue: 'GTIN missing. Google cannot enrich product data from its catalog. This reduces impression share on Shopping.', recommendation: 'Add EAN/UPC barcode. If no barcode, set identifier_exists = false.' },
    { field: 'custom_label_0', value: '', quality: 'warning', issue: 'All custom labels empty. Cannot segment campaign bids by bestseller / new / sale.', recommendation: 'Set custom_label_0 = "winner" (based on ROAS performance). Use custom_label_1 = "cotton" for material. This enables separate budget strategy for best SKUs.' },
    { field: 'sell_on_google_quantity', value: '91', quality: 'good' },
    { field: 'size', value: 'M', quality: 'good' },
  ]
};

export function getFeedHealthForSku(skuId: string): FeedHealthData {
  if (skuId === 'TB-CAL-BLK-M') return FEED_HEALTH_TB_CAL_BLK_M;
  return {
    skuId,
    merchantId: 'shopify_IN_8178651857212_default',
    status: 'active',
    disapprovalReasons: [],
    listingGroupStatus: 'Included in campaign',
    campaignExcluded: false,
    attributes: [
      { field: 'title', value: 'Generic Product Title', quality: 'good' },
      { field: 'price', value: '₹599', quality: 'good' },
      { field: 'availability', value: 'in stock', quality: 'good' },
    ]
  };
}
