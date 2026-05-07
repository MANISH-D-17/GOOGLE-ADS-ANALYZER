// Which PMax campaign serves each product category
export interface CampaignMapping {
  campaign: string;
  campaignType: 'Performance Max' | 'Shopping' | 'Search';
  budget: number;
  roas: number;
  optScore: number;
  listingGroup: string;
  assetGroup: string;
}

export const CAMPAIGN_SKU_MAP: Record<string, CampaignMapping> = {
  // Leggings → KM | Pmax | Leggings
  'TB-CAL-BLK-M':    { campaign: 'KM | Pmax | Leggings',         campaignType: 'Performance Max', budget: 1531, roas: 2.70, optScore: 71.18, listingGroup: 'product_type: Leggings', assetGroup: 'Leggings - Core' },
  'TB-VAL-NVY-M':    { campaign: 'KM | Pmax | Leggings',         campaignType: 'Performance Max', budget: 1531, roas: 2.70, optScore: 71.18, listingGroup: 'product_type: Leggings', assetGroup: 'Leggings - Core' },
  'TB-LE-WIN-M-1006': { campaign: 'KM | Pmax | Leggings',        campaignType: 'Performance Max', budget: 1531, roas: 2.70, optScore: 71.18, listingGroup: 'product_type: Leggings', assetGroup: 'Leggings - Premium' },
  'TB-LE-PIN-XXL-1016': { campaign: 'KM | Pmax | Leggings',      campaignType: 'Performance Max', budget: 1531, roas: 2.70, optScore: 71.18, listingGroup: 'product_type: Leggings', assetGroup: 'Leggings - Core' },
  'TB-CL-MST-M':     { campaign: 'KM | Pmax | Leggings',         campaignType: 'Performance Max', budget: 1531, roas: 2.70, optScore: 71.18, listingGroup: 'product_type: Leggings', assetGroup: 'Leggings - Core' },
  'TB-CC-WHT-L':     { campaign: 'KM | Pmax | Leggings',         campaignType: 'Performance Max', budget: 1531, roas: 2.70, optScore: 71.18, listingGroup: 'product_type: Leggings', assetGroup: 'Leggings - Core' },
  'TB-LE-MUS-XXL-1005': { campaign: 'KM | Pmax | Leggings',      campaignType: 'Performance Max', budget: 1531, roas: 2.70, optScore: 71.18, listingGroup: 'product_type: Leggings', assetGroup: 'Leggings - Core' },
  'TB-LE-OLI-XL-1069': { campaign: 'KM | Pmax | Leggings',       campaignType: 'Performance Max', budget: 1531, roas: 2.70, optScore: 71.18, listingGroup: 'product_type: Leggings', assetGroup: 'Leggings - Core' },
  'TB-LE-BOT-S-1055': { campaign: 'KM | Pmax | Leggings',        campaignType: 'Performance Max', budget: 1531, roas: 2.70, optScore: 71.18, listingGroup: 'product_type: Leggings', assetGroup: 'Leggings - Premium' },
  'TB-LE-LAV-M-1062': { campaign: 'KM | Pmax | Leggings',        campaignType: 'Performance Max', budget: 1531, roas: 2.70, optScore: 71.18, listingGroup: 'product_type: Leggings', assetGroup: 'Leggings - Core' },
  'TB-LE-OLI-XXL-1064': { campaign: 'KM | Pmax | Leggings',      campaignType: 'Performance Max', budget: 1531, roas: 2.70, optScore: 71.18, listingGroup: 'product_type: Leggings', assetGroup: 'Leggings - Core' },

  // Shimmer Leggings → KM | Pmax | Shimmer Leggings
  'TB-LE-BLA-L-1015': { campaign: 'KM | Pmax | Shimmer Leggings', campaignType: 'Performance Max', budget: 1531, roas: 3.09, optScore: 82.88, listingGroup: 'product_type: Shimmer Legging', assetGroup: 'Shimmer - Core' },

  // Kurti / Kurti Pant → KM | PMax | Kurti Pant
  'TB-KU-COR-XL-1018': { campaign: 'KM | PMax | Kurti Pant',     campaignType: 'Performance Max', budget: 6800, roas: 2.46, optScore: 81.21, listingGroup: 'product_type: Kurti Pant', assetGroup: 'Kurti - Cotton' },
  'TB-KL-MRN-M':       { campaign: 'KM | PMax | Kurti Pant',     campaignType: 'Performance Max', budget: 6800, roas: 2.46, optScore: 81.21, listingGroup: 'product_type: Kurti Legging', assetGroup: 'Kurti - Legging' },
  'TB-KU-GRE-M-1007':  { campaign: 'KM | PMax | Kurti Pant',     campaignType: 'Performance Max', budget: 6800, roas: 2.46, optScore: 81.21, listingGroup: 'product_type: Kurti Pant', assetGroup: 'Kurti - Cotton' },
  'TB-KU-MAR-S-1001':  { campaign: 'KM | PMax | Kurti Pant',     campaignType: 'Performance Max', budget: 6800, roas: 2.46, optScore: 81.21, listingGroup: 'product_type: Kurti Pant', assetGroup: 'Kurti - Cotton' },
  'TB-KU-MUS-L-1008':  { campaign: 'KM | PMax | Kurti Pant',     campaignType: 'Performance Max', budget: 6800, roas: 2.46, optScore: 81.21, listingGroup: 'product_type: Kurti Pant', assetGroup: 'Kurti - Cotton' },
  'TB-KU-MUS-S-1003':  { campaign: 'KM | PMax | Kurti Pant',     campaignType: 'Performance Max', budget: 6800, roas: 2.46, optScore: 81.21, listingGroup: 'product_type: Kurti Legging', assetGroup: 'Kurti - Legging' },
  'TB-KL-BTL-M':       { campaign: 'KM | PMax | Kurti Pant',     campaignType: 'Performance Max', budget: 6800, roas: 2.46, optScore: 81.21, listingGroup: 'product_type: Kurti Legging', assetGroup: 'Kurti - Legging' },
  'TB-KU-PIN-XXL-1049': { campaign: 'KM | PMax | Kurti Pant',    campaignType: 'Performance Max', budget: 6800, roas: 2.46, optScore: 81.21, listingGroup: 'product_type: Kurti Legging', assetGroup: 'Kurti - Legging' },
  'TB-KU-OLI-S-1065':  { campaign: 'KM | PMax | Kurti Pant',     campaignType: 'Performance Max', budget: 6800, roas: 2.46, optScore: 81.21, listingGroup: 'product_type: Kurti Pant', assetGroup: 'Kurti - Cotton' },
  'TB-KU-MAR-L-1052':  { campaign: 'KM | PMax | Kurti Pant',     campaignType: 'Performance Max', budget: 6800, roas: 2.46, optScore: 81.21, listingGroup: 'product_type: Kurti Pant', assetGroup: 'Kurti - Cotton' },

  // Saree Shapers → Performance Max | Saree Shaper  OR  KM | Pmax | SS
  'TB-SS-BGE-M':       { campaign: 'Performance Max | Saree Shaper', campaignType: 'Performance Max', budget: 8000, roas: 2.02, optScore: 83.33, listingGroup: 'product_type: Saree Shaper', assetGroup: 'Saree Shaper - All' },
  'TB-SA-PIN-XXL-1017': { campaign: 'Performance Max | Saree Shaper', campaignType: 'Performance Max', budget: 8000, roas: 2.02, optScore: 83.33, listingGroup: 'product_type: Saree Shaper', assetGroup: 'Saree Shaper - Premium' },
  'TB-SA-BEI-M-1014':  { campaign: 'KM | Pmax | SS',             campaignType: 'Performance Max', budget: 3520, roas: 1.98, optScore: 77.44, listingGroup: 'product_type: Saree Petticoat Shaper', assetGroup: 'SS - Petticoat' },
  'TB-SA-IND-XXL-1011': { campaign: 'Performance Max | Saree Shaper', campaignType: 'Performance Max', budget: 8000, roas: 2.02, optScore: 83.33, listingGroup: 'product_type: Saree Shaper', assetGroup: 'Saree Shaper - All' },
  'TB-SA-COR-XL-1000': { campaign: 'Performance Max | Saree Shaper', campaignType: 'Performance Max', budget: 8000, roas: 2.02, optScore: 83.33, listingGroup: 'product_type: Saree Shaper', assetGroup: 'Saree Shaper - All' },
  'TB-SA-PIN-M-1004':  { campaign: 'Performance Max | Saree Shaper', campaignType: 'Performance Max', budget: 8000, roas: 2.02, optScore: 83.33, listingGroup: 'product_type: Saree Shaper', assetGroup: 'Saree Shaper - Premium' },
  'TB-SA-MAR-S-1002':  { campaign: 'Performance Max | Saree Shaper', campaignType: 'Performance Max', budget: 8000, roas: 2.02, optScore: 83.33, listingGroup: 'product_type: Saree Shaper', assetGroup: 'Saree Shaper - All' },
  'TB-SA-BOT-XXL-1048': { campaign: 'KM | Pmax | SS',            campaignType: 'Performance Max', budget: 3520, roas: 1.98, optScore: 77.44, listingGroup: 'product_type: Saree Shaper', assetGroup: 'SS - Premium' },
  'TB-SA-WIN-M-1059':  { campaign: 'KM | Pmax | SS',             campaignType: 'Performance Max', budget: 3520, roas: 1.98, optScore: 77.44, listingGroup: 'product_type: Saree Shaper', assetGroup: 'SS - Core' },
  'TB-SA-WIN-L-1066':  { campaign: 'KM | Pmax | SS',             campaignType: 'Performance Max', budget: 3520, roas: 1.98, optScore: 77.44, listingGroup: 'product_type: Saree Shaper', assetGroup: 'SS - Core' },
  'TB-SA-PIN-XL-1068': { campaign: 'KM | Pmax | SS',             campaignType: 'Performance Max', budget: 3520, roas: 1.98, optScore: 77.44, listingGroup: 'product_type: Saree Shaper', assetGroup: 'SS - Core' },
  'TB-SA-GRE-XXL-1061': { campaign: 'KM | Pmax | SS',            campaignType: 'Performance Max', budget: 3520, roas: 1.98, optScore: 77.44, listingGroup: 'product_type: Saree Shaper', assetGroup: 'SS - Premium' },
  'TB-SA-IND-XL-1054': { campaign: 'KM | Pmax | SS',             campaignType: 'Performance Max', budget: 3520, roas: 1.98, optScore: 77.44, listingGroup: 'product_type: Saree Shaper', assetGroup: 'SS - Core' },
  'TB-SA-COR-L-1056':  { campaign: 'KM | Pmax | SS',             campaignType: 'Performance Max', budget: 3520, roas: 1.98, optScore: 77.44, listingGroup: 'product_type: Saree Shaper', assetGroup: 'SS - Core' },
  'TB-SA-IND-XXL-1057': { campaign: 'KM | Pmax | SS',            campaignType: 'Performance Max', budget: 3520, roas: 1.98, optScore: 77.44, listingGroup: 'product_type: Saree Shaper', assetGroup: 'SS - Core' },
  'TB-SA-LAV-M-1063':  { campaign: 'KM | Pmax | SS',             campaignType: 'Performance Max', budget: 3520, roas: 1.98, optScore: 77.44, listingGroup: 'product_type: Saree Shaper', assetGroup: 'SS - Core' },
  'TB-SA-GRE-M-1070':  { campaign: 'KM | Pmax | SS',             campaignType: 'Performance Max', budget: 3520, roas: 1.98, optScore: 77.44, listingGroup: 'product_type: Saree Shaper', assetGroup: 'SS - Core' },
  'TB-SS-BLK-L':       { campaign: 'Performance Max | Saree Shaper', campaignType: 'Performance Max', budget: 8000, roas: 2.02, optScore: 83.33, listingGroup: 'product_type: Saree Shaper', assetGroup: 'Saree Shaper - All' },
  'TB-SA-MUS-S-1046':  { campaign: 'KM | Pmax | SS',             campaignType: 'Performance Max', budget: 3520, roas: 1.98, optScore: 77.44, listingGroup: 'product_type: Saree Shaper', assetGroup: 'SS - Premium' },
  'TB-SA-CHA-S-1021':  { campaign: 'KM | Pmax | SS',             campaignType: 'Performance Max', budget: 3520, roas: 1.98, optScore: 77.44, listingGroup: 'product_type: Saree Shaper', assetGroup: 'SS - Premium' },
  'TB-SA-WIN-XL-1024': { campaign: 'KM | Pmax | SS',             campaignType: 'Performance Max', budget: 3520, roas: 1.98, optScore: 77.44, listingGroup: 'product_type: Saree Shaper', assetGroup: 'SS - Core' },
  'TB-SA-COR-L-1047':  { campaign: 'KM | Pmax | SS',             campaignType: 'Performance Max', budget: 3520, roas: 1.98, optScore: 77.44, listingGroup: 'product_type: Saree Shaper', assetGroup: 'SS - Premium' },
  'TB-SA-WHI-XXL-1030': { campaign: 'KM | Pmax | SS',            campaignType: 'Performance Max', budget: 3520, roas: 1.98, optScore: 77.44, listingGroup: 'product_type: Saree Shaper', assetGroup: 'SS - Premium' },
  'TB-SA-OLI-S-1031':  { campaign: 'KM | Pmax | SS',             campaignType: 'Performance Max', budget: 3520, roas: 1.98, optScore: 77.44, listingGroup: 'product_type: Saree Shaper', assetGroup: 'SS - Core' },
  'TB-SA-WHI-M-1034':  { campaign: 'KM | Pmax | SS',             campaignType: 'Performance Max', budget: 3520, roas: 1.98, optScore: 77.44, listingGroup: 'product_type: Saree Shaper', assetGroup: 'SS - Core' },

  // Loungewear → KM | Palazzos or KM | Pmax | Leggings (based on variant)
  'TB-LO-BOT-XXL-1010': { campaign: 'KM | Palazzos',             campaignType: 'Performance Max', budget: 1531, roas: 2.16, optScore: 72.20, listingGroup: 'product_type: Loungewear - Pyjama', assetGroup: 'Loungewear - Core' },
  'TB-LO-OLI-S-1012':   { campaign: 'KM | Palazzos',             campaignType: 'Performance Max', budget: 1531, roas: 2.16, optScore: 72.20, listingGroup: 'product_type: Loungewear - Pyjama', assetGroup: 'Loungewear - Core' },
  'TB-LP-GRY-XL':       { campaign: 'KM | Palazzos',             campaignType: 'Performance Max', budget: 1531, roas: 2.16, optScore: 72.20, listingGroup: 'product_type: Loungewear - Pant', assetGroup: 'Loungewear - Core' },
  'TB-LO-NAV-XXL-1009': { campaign: 'KM | Palazzos',             campaignType: 'Performance Max', budget: 1531, roas: 2.16, optScore: 72.20, listingGroup: 'product_type: Loungewear - Co-ord', assetGroup: 'Loungewear - Co-ord' },
  'TB-LO-MUS-L-1013':   { campaign: 'KM | Palazzos',             campaignType: 'Performance Max', budget: 1531, roas: 2.16, optScore: 72.20, listingGroup: 'product_type: Loungewear - Pyjama', assetGroup: 'Loungewear - Core' },
  'TB-LO-CHA-S-1051':   { campaign: 'KM | Palazzos',             campaignType: 'Performance Max', budget: 1531, roas: 2.16, optScore: 72.20, listingGroup: 'product_type: Loungewear - Modal', assetGroup: 'Loungewear - Modal' },
  'TB-LO-COR-M-1053':   { campaign: 'KM | Palazzos',             campaignType: 'Performance Max', budget: 1531, roas: 2.16, optScore: 72.20, listingGroup: 'product_type: Loungewear - Pant', assetGroup: 'Loungewear - Core' },
  'TB-LO-BOT-M-1060':   { campaign: 'KM | Palazzos',             campaignType: 'Performance Max', budget: 1531, roas: 2.16, optScore: 72.20, listingGroup: 'product_type: Loungewear - Co-ord', assetGroup: 'Loungewear - Co-ord' },
  'TB-LO-GRE-L-1067':   { campaign: 'KM | Palazzos',             campaignType: 'Performance Max', budget: 1531, roas: 2.16, optScore: 72.20, listingGroup: 'product_type: Loungewear - Modal', assetGroup: 'Loungewear - Modal' },
  'TB-LO-PIN-XXL-1058': { campaign: 'KM | Palazzos',             campaignType: 'Performance Max', budget: 1531, roas: 2.16, optScore: 72.20, listingGroup: 'product_type: Loungewear - Co-ord', assetGroup: 'Loungewear - Co-ord' },
  'TB-MLS-PNK-S':       { campaign: 'KM | Palazzos',             campaignType: 'Performance Max', budget: 1531, roas: 2.16, optScore: 72.20, listingGroup: 'product_type: Loungewear - Modal', assetGroup: 'Loungewear - Modal' },
  'TB-LO-OLI-XL-1050':  { campaign: 'KM | Palazzos',            campaignType: 'Performance Max', budget: 1531, roas: 2.16, optScore: 72.20, listingGroup: 'product_type: Loungewear - Modal', assetGroup: 'Loungewear - Modal' },
  'TB-LO-LAV-XXL':      { campaign: 'KM | Palazzos',             campaignType: 'Performance Max', budget: 1531, roas: 2.16, optScore: 72.20, listingGroup: 'product_type: Loungewear - Modal', assetGroup: 'Loungewear - Modal' },
  'TB-LO-IND-L-1033':   { campaign: 'KM | Palazzos',             campaignType: 'Performance Max', budget: 1531, roas: 2.16, optScore: 72.20, listingGroup: 'product_type: Loungewear - Pyjama', assetGroup: 'Loungewear - Core' },
  'TB-LO-PIN-M-1022':   { campaign: 'KM | Palazzos',             campaignType: 'Performance Max', budget: 1531, roas: 2.16, optScore: 72.20, listingGroup: 'product_type: Loungewear - Modal', assetGroup: 'Loungewear - Modal' },
  'TB-LO-BOT-M-1019':   { campaign: 'KM | Palazzos',             campaignType: 'Performance Max', budget: 1531, roas: 2.16, optScore: 72.20, listingGroup: 'product_type: Loungewear - Co-ord', assetGroup: 'Loungewear - Co-ord' },
};
