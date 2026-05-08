export type SKUState = 'winner' | 'bleeder' | 'sleeper' | 'dead' | 'stable';

export interface SKU {
  id: string;
  name: string;
  category: string;
  state: SKUState;
  availability: 'in_stock' | 'out_of_stock' | 'preorder';
  impressions: number;
  ctr: number;       // percentage e.g. 4.2
  spend: number;     // in rupees
  conversions: number;
  cvr: number;       // percentage
  revenue: number;   // in rupees
  roas: number;
  warning?: string;  // e.g. "low CVR — 0.3%"
}

export const SKU_DATA: SKU[] = [
  { id: 'TB-CAL-BLK-M', name: 'Cotton ankle legging - Black', category: 'Leggings', state: 'winner', availability: 'in_stock', impressions: 184200, ctr: 4.2, spend: 38400, conversions: 142, cvr: 1.8, revenue: 199000, roas: 5.18 },
  { id: 'TB-KU-COR-XL-1018', name: 'Cotton kurti pant - Coral XL', category: 'Kurti', state: 'bleeder', availability: 'in_stock', impressions: 105327, ctr: 2.3, spend: 34033, conversions: 8, cvr: 0.3, revenue: 10230, roas: 0.30, warning: 'low CVR — 0.3%' },
  { id: 'TB-SS-BGE-M', name: 'Saree shaper - Beige M', category: 'Saree shaper', state: 'winner', availability: 'in_stock', impressions: 142800, ctr: 5.1, spend: 28200, conversions: 118, cvr: 1.6, revenue: 165000, roas: 5.86 },
  { id: 'TB-KL-MRN-M', name: 'Kurti legging - Maroon', category: 'Kurti', state: 'winner', availability: 'in_stock', impressions: 124600, ctr: 4.7, spend: 24800, conversions: 96, cvr: 1.6, revenue: 134000, roas: 5.42 },
  { id: 'TB-VAL-NVY-M', name: 'Viscose ankle legging - Navy', category: 'Leggings', state: 'bleeder', availability: 'in_stock', impressions: 96400, ctr: 2.1, spend: 22800, conversions: 8, cvr: 0.4, revenue: 11200, roas: 0.49, warning: 'low CVR — 0.4%' },
  { id: 'TB-KU-GRE-M-1007', name: 'Anarkali legging - Grey M', category: 'Kurti', state: 'winner', availability: 'in_stock', impressions: 135398, ctr: 4.1, spend: 20537, conversions: 109, cvr: 1.9, revenue: 166000, roas: 8.09 },
  { id: 'TB-KU-MAR-S-1001', name: 'Cotton kurti pant - Maroon S', category: 'Kurti', state: 'winner', availability: 'in_stock', impressions: 120116, ctr: 4.9, spend: 20028, conversions: 88, cvr: 1.5, revenue: 135000, roas: 6.75 },
  { id: 'TB-SA-PIN-XXL-1017', name: 'Premium saree shaper - Pink XXL', category: 'Saree shaper', state: 'bleeder', availability: 'in_stock', impressions: 105887, ctr: 2.2, spend: 19580, conversions: 5, cvr: 0.2, revenue: 5839, roas: 0.30, warning: 'low CVR — 0.2%' },
  { id: 'TB-LE-WIN-M-1006', name: 'Premium ankle legging - Wine M', category: 'Leggings', state: 'winner', availability: 'in_stock', impressions: 153053, ctr: 3.9, spend: 19142, conversions: 161, cvr: 2.7, revenue: 219000, roas: 11.44 },
  { id: 'TB-LE-PIN-XXL-1016', name: 'Stretch legging - Pink XXL', category: 'Leggings', state: 'bleeder', availability: 'in_stock', impressions: 110505, ctr: 1.8, spend: 18676, conversions: 9, cvr: 0.5, revenue: 12807, roas: 0.69, warning: 'low CVR — 0.5%' },
  { id: 'TB-CL-MST-M', name: 'Cotton legging - Mustard', category: 'Leggings', state: 'winner', availability: 'in_stock', impressions: 88200, ctr: 4.4, spend: 18600, conversions: 72, cvr: 1.9, revenue: 96400, roas: 5.18 },
  { id: 'TB-CC-WHT-L', name: 'Cotton capri - White', category: 'Leggings', state: 'bleeder', availability: 'in_stock', impressions: 78600, ctr: 1.8, spend: 18400, conversions: 11, cvr: 0.8, revenue: 13200, roas: 0.72, warning: 'high CPC — ₹13 vs avg ₹5' },
  { id: 'TB-LO-MUS-L-1013', name: 'Cotton pyjama - Mustard L', category: 'Loungewear', state: 'bleeder', availability: 'in_stock', impressions: 91752, ctr: 1.7, spend: 17905, conversions: 9, cvr: 0.6, revenue: 11078, roas: 0.62, warning: 'high CPC — ₹11 vs avg ₹5' },
  { id: 'TB-LO-BOT-XXL-1010', name: 'Cotton pyjama - Bottle green XXL', category: 'Loungewear', state: 'winner', availability: 'in_stock', impressions: 92220, ctr: 5.1, spend: 14001, conversions: 80, cvr: 1.7, revenue: 139000, roas: 9.90 },
  { id: 'TB-LO-OLI-S-1012', name: 'Cotton pyjama - Olive S', category: 'Loungewear', state: 'winner', availability: 'in_stock', impressions: 75343, ctr: 5.5, spend: 13827, conversions: 123, cvr: 3.0, revenue: 170000, roas: 12.29 },
  { id: 'TB-SA-BEI-M-1014', name: 'Saree petticoat shaper - Beige M', category: 'Saree shaper', state: 'bleeder', availability: 'in_stock', impressions: 56890, ctr: 1.6, spend: 13518, conversions: 3, cvr: 0.3, revenue: 3503, roas: 0.26, warning: 'low CVR — 0.3%' },
  { id: 'TB-LP-GRY-XL', name: 'Lounge pant - Grey XL', category: 'Loungewear', state: 'bleeder', availability: 'in_stock', impressions: 52400, ctr: 1.4, spend: 12200, conversions: 3, cvr: 0.4, revenue: 3900, roas: 0.32, warning: 'low CVR — 0.4%' },
  { id: 'TB-LO-NAV-XXL-1009', name: 'Cotton co-ord set - Navy XXL', category: 'Loungewear', state: 'winner', availability: 'in_stock', impressions: 68543, ctr: 4.9, spend: 12137, conversions: 62, cvr: 1.8, revenue: 93399, roas: 7.70 },
  { id: 'TB-KU-MUS-L-1008', name: 'Cotton kurti pant - Mustard L', category: 'Kurti', state: 'winner', availability: 'in_stock', impressions: 87348, ctr: 3.7, spend: 11618, conversions: 64, cvr: 2.0, revenue: 108000, roas: 9.33 },
  { id: 'TB-SA-MAR-S-1002', name: 'Saree shaper - Maroon S', category: 'Saree shaper', state: 'winner', availability: 'in_stock', impressions: 69710, ctr: 5.1, spend: 11517, conversions: 54, cvr: 1.5, revenue: 74871, roas: 6.50 },
  { id: 'TB-SA-BOT-XXL-1048', name: 'Premium saree shaper - Bottle green XXL', category: 'Saree shaper', state: 'stable', availability: 'in_stock', impressions: 49014, ctr: 3.7, spend: 11456, conversions: 29, cvr: 1.6, revenue: 44211, roas: 3.86 },
  { id: 'TB-SA-IND-XXL-1011', name: 'Saree petticoat shaper - Indigo XXL', category: 'Saree shaper', state: 'winner', availability: 'in_stock', impressions: 73438, ctr: 4.7, spend: 10988, conversions: 61, cvr: 1.8, revenue: 80748, roas: 7.35 },
  { id: 'TB-LE-BLA-L-1015', name: 'Viscose churidar legging - Black L', category: 'Leggings', state: 'bleeder', availability: 'in_stock', impressions: 48691, ctr: 1.8, spend: 10490, conversions: 4, cvr: 0.4, revenue: 5860, roas: 0.56, warning: 'low CVR — 0.4%' },
  { id: 'TB-SA-COR-XL-1000', name: 'Saree petticoat shaper - Coral XL', category: 'Saree shaper', state: 'winner', availability: 'in_stock', impressions: 67970, ctr: 4.6, spend: 8500, conversions: 75, cvr: 2.4, revenue: 130000, roas: 15.29 },
  { id: 'TB-SA-PIN-M-1004', name: 'Premium saree shaper - Pink M', category: 'Saree shaper', state: 'winner', availability: 'in_stock', impressions: 85473, ctr: 4.1, spend: 8204, conversions: 87, cvr: 2.5, revenue: 143000, roas: 17.40 },
  { id: 'TB-SA-WIN-M-1059', name: 'Saree petticoat shaper - Wine M', category: 'Saree shaper', state: 'stable', availability: 'in_stock', impressions: 48232, ctr: 2.4, spend: 7861, conversions: 12, cvr: 1.0, revenue: 16860, roas: 2.14 },
  { id: 'TB-LE-OLI-XXL-1064', name: 'Cotton ankle legging - Olive XXL', category: 'Leggings', state: 'stable', availability: 'in_stock', impressions: 43207, ctr: 3.7, spend: 7805, conversions: 15, cvr: 0.9, revenue: 21968, roas: 2.81 },
  { id: 'TB-KU-MUS-S-1003', name: 'Kurti legging - Mustard S', category: 'Kurti', state: 'winner', availability: 'in_stock', impressions: 48222, ctr: 4.6, spend: 7550, conversions: 42, cvr: 1.9, revenue: 68160, roas: 9.03 },
  { id: 'TB-SA-WIN-L-1066', name: 'Saree petticoat shaper - Wine L', category: 'Saree shaper', state: 'stable', availability: 'in_stock', impressions: 34403, ctr: 2.9, spend: 6689, conversions: 15, cvr: 1.5, revenue: 18528, roas: 2.77 },
  { id: 'TB-SA-PIN-XL-1068', name: 'Saree petticoat shaper - Pink XL', category: 'Saree shaper', state: 'bleeder', availability: 'in_stock', impressions: 29439, ctr: 2.7, spend: 5626, conversions: 8, cvr: 1.0, revenue: 10973, roas: 1.95, warning: 'high cost / low conv.' },
  { id: 'TB-LE-MUS-XXL-1005', name: 'Stretch legging - Mustard XXL', category: 'Leggings', state: 'winner', availability: 'in_stock', impressions: 61967, ctr: 3.7, spend: 5146, conversions: 47, cvr: 2.0, revenue: 72420, roas: 14.07 },
  { id: 'TB-KU-OLI-S-1065', name: 'Anarkali legging - Olive S', category: 'Kurti', state: 'stable', availability: 'in_stock', impressions: 45285, ctr: 3.0, spend: 5074, conversions: 11, cvr: 0.8, revenue: 16973, roas: 3.35 },
  { id: 'TB-KU-PIN-XXL-1049', name: 'Kurti legging - Pink XXL', category: 'Kurti', state: 'stable', availability: 'in_stock', impressions: 34600, ctr: 3.4, spend: 5065, conversions: 17, cvr: 1.4, revenue: 23486, roas: 4.64 },
  { id: 'TB-LO-CHA-S-1051', name: 'Modal nightdress - Charcoal S', category: 'Loungewear', state: 'winner', availability: 'in_stock', impressions: 34838, ctr: 3.6, spend: 5006, conversions: 16, cvr: 1.3, revenue: 24957, roas: 4.99 },
  { id: 'TB-LO-COR-M-1053', name: 'Lounge pant - Coral M', category: 'Loungewear', state: 'stable', availability: 'in_stock', impressions: 30264, ctr: 2.3, spend: 4814, conversions: 7, cvr: 1.0, revenue: 10302, roas: 2.14 },
  { id: 'TB-SA-MUS-S-1046', name: 'Premium saree shaper - Mustard S', category: 'Saree shaper', state: 'stable', availability: 'in_stock', impressions: 29237, ctr: 2.9, spend: 4029, conversions: 10, cvr: 1.2, revenue: 15015, roas: 3.73 },
  { id: 'TB-KU-MAR-L-1052', name: 'Anarkali legging - Maroon L', category: 'Kurti', state: 'stable', availability: 'in_stock', impressions: 27408, ctr: 3.8, spend: 3835, conversions: 13, cvr: 1.3, revenue: 15988, roas: 4.17 },
  { id: 'TB-SA-GRE-XXL-1061', name: 'Premium saree shaper - Grey XXL', category: 'Saree shaper', state: 'stable', availability: 'in_stock', impressions: 23300, ctr: 3.1, spend: 3523, conversions: 9, cvr: 1.2, revenue: 13177, roas: 3.74 },
  { id: 'TB-LE-OLI-XL-1069', name: 'Cotton ankle legging - Olive XL', category: 'Leggings', state: 'winner', availability: 'in_stock', impressions: 27295, ctr: 2.8, spend: 3469, conversions: 12, cvr: 1.6, revenue: 17885, roas: 5.16 },
  { id: 'TB-LO-BOT-M-1060', name: 'Cotton co-ord set - Bottle green M', category: 'Loungewear', state: 'stable', availability: 'in_stock', impressions: 26506, ctr: 2.7, spend: 3368, conversions: 7, cvr: 1.0, revenue: 9997, roas: 2.97 },
  { id: 'TB-LE-BOT-S-1055', name: 'Premium ankle legging - Bottle green S', category: 'Leggings', state: 'stable', availability: 'in_stock', impressions: 21474, ctr: 3.5, spend: 3283, conversions: 7, cvr: 0.9, revenue: 10479, roas: 3.19 },
  { id: 'TB-SA-COR-L-1056', name: 'Saree petticoat shaper - Coral L', category: 'Saree shaper', state: 'stable', availability: 'in_stock', impressions: 21925, ctr: 3.1, spend: 3117, conversions: 9, cvr: 1.3, revenue: 11501, roas: 3.69 },
  { id: 'TB-SA-IND-XXL-1057', name: 'Saree shaper - Indigo XXL', category: 'Saree shaper', state: 'stable', availability: 'in_stock', impressions: 22689, ctr: 3.1, spend: 3034, conversions: 9, cvr: 1.3, revenue: 14324, roas: 4.72 },
  { id: 'TB-SA-LAV-M-1063', name: 'Saree shaper - Lavender M', category: 'Saree shaper', state: 'stable', availability: 'in_stock', impressions: 15381, ctr: 3.1, spend: 2089, conversions: 5, cvr: 1.0, revenue: 7232, roas: 3.46 },
  { id: 'TB-LO-GRE-L-1067', name: 'Modal nightdress - Grey L', category: 'Loungewear', state: 'stable', availability: 'in_stock', impressions: 17575, ctr: 2.7, spend: 2037, conversions: 6, cvr: 1.3, revenue: 9292, roas: 4.56 },
  { id: 'TB-LO-PIN-XXL-1058', name: 'Cotton co-ord set - Pink XXL', category: 'Loungewear', state: 'winner', availability: 'in_stock', impressions: 13198, ctr: 2.3, spend: 1284, conversions: 5, cvr: 1.7, revenue: 7012, roas: 5.46 },
  { id: 'TB-KL-BTL-M', name: 'Kurti legging - Bottle green', category: 'Kurti', state: 'winner', availability: 'in_stock', impressions: 5200, ctr: 3.6, spend: 1280, conversions: 7, cvr: 3.7, revenue: 9800, roas: 7.66 },
  { id: 'TB-LE-LAV-M-1062', name: 'Cotton ankle legging - Lavender M', category: 'Leggings', state: 'winner', availability: 'in_stock', impressions: 17675, ctr: 2.0, spend: 1260, conversions: 5, cvr: 1.4, revenue: 6562, roas: 5.21 },
  { id: 'TB-SA-GRE-M-1070', name: 'Saree shaper - Grey M', category: 'Saree shaper', state: 'stable', availability: 'in_stock', impressions: 7413, ctr: 3.5, spend: 1177, conversions: 2, cvr: 0.8, revenue: 3159, roas: 2.68 },
  { id: 'TB-MLS-PNK-S', name: 'Modal lounge set - Pink', category: 'Loungewear', state: 'winner', availability: 'in_stock', impressions: 4200, ctr: 3.8, spend: 1100, conversions: 6, cvr: 3.8, revenue: 8800, roas: 8.00 },
  { id: 'TB-SS-BLK-L', name: 'Saree shaper - Black L', category: 'Saree shaper', state: 'stable', availability: 'in_stock', impressions: 3800, ctr: 4.2, spend: 920, conversions: 4, cvr: 2.5, revenue: 5600, roas: 6.09 },
  { id: 'TB-LO-OLI-XL-1050', name: 'Modal lounge set - Olive XL', category: 'Loungewear', state: 'stable', availability: 'in_stock', impressions: 4418, ctr: 2.2, spend: 392, conversions: 1, cvr: 1.0, revenue: 1350, roas: 3.44 },
  { id: 'TB-SA-COR-L-1047', name: 'Premium saree shaper - Coral L', category: 'Saree shaper', state: 'stable', availability: 'in_stock', impressions: 2396, ctr: 3.6, spend: 283, conversions: 1, cvr: 1.1, revenue: 1395, roas: 4.93 },
  { id: 'TB-LE-CHA-L-1036', name: 'Cotton ankle legging - Charcoal L', category: 'Leggings', state: 'sleeper', availability: 'in_stock', impressions: 846, ctr: 4.6, spend: 175, conversions: 2, cvr: 5.1, revenue: 2575, roas: 14.71, warning: 'low impressions, good CVR' },
  { id: 'TB-LE-BEI-XL-1025', name: 'Cotton ankle legging - Beige XL', category: 'Leggings', state: 'sleeper', availability: 'in_stock', impressions: 684, ctr: 4.1, spend: 166, conversions: 1, cvr: 3.6, revenue: 1398, roas: 8.42, warning: 'low impressions, good CVR' },
  { id: 'TB-SA-WHI-XXL-1030', name: 'Premium saree shaper - White XXL', category: 'Saree shaper', state: 'sleeper', availability: 'in_stock', impressions: 872, ctr: 4.1, spend: 159, conversions: 1, cvr: 2.8, revenue: 1450, roas: 9.12, warning: 'low impressions, good CVR' },
  { id: 'TB-KU-BEI-XXL-1026', name: 'Anarkali legging - Beige XXL', category: 'Kurti', state: 'sleeper', availability: 'in_stock', impressions: 911, ctr: 3.5, spend: 146, conversions: 1, cvr: 3.1, revenue: 1668, roas: 11.42, warning: 'low impressions, good CVR' },
  { id: 'TB-SA-WIN-XL-1024', name: 'Saree shaper - Wine XL', category: 'Saree shaper', state: 'sleeper', availability: 'in_stock', impressions: 678, ctr: 4.6, spend: 144, conversions: 1, cvr: 3.2, revenue: 1464, roas: 10.17, warning: 'low impressions, good CVR' },
  { id: 'TB-SA-IND-XL-1054', name: 'Saree petticoat shaper - Indigo XL', category: 'Saree shaper', state: 'stable', availability: 'in_stock', impressions: 2006, ctr: 2.1, spend: 142, conversions: 1, cvr: 2.4, revenue: 1200, roas: 8.45 },
  { id: 'TB-SA-CHA-S-1021', name: 'Premium saree shaper - Charcoal S', category: 'Saree shaper', state: 'sleeper', availability: 'in_stock', impressions: 683, ctr: 4.0, spend: 121, conversions: 1, cvr: 3.6, revenue: 1430, roas: 11.82, warning: 'low impressions, good CVR' },
  { id: 'TB-KU-PIN-XL-1027', name: 'Kurti legging - Pink XL', category: 'Kurti', state: 'sleeper', availability: 'in_stock', impressions: 589, ctr: 4.4, spend: 121, conversions: 1, cvr: 3.8, revenue: 1683, roas: 13.91, warning: 'low impressions, good CVR' },
  { id: 'TB-LO-PIN-M-1022', name: 'Modal lounge set - Pink M', category: 'Loungewear', state: 'sleeper', availability: 'in_stock', impressions: 574, ctr: 4.1, spend: 119, conversions: 1, cvr: 4.2, revenue: 1267, roas: 10.65, warning: 'low impressions, good CVR' },
  { id: 'TB-LO-BOT-M-1019', name: 'Cotton co-ord set - Bottle green M', category: 'Loungewear', state: 'sleeper', availability: 'in_stock', impressions: 825, ctr: 3.3, spend: 111, conversions: 1, cvr: 3.7, revenue: 1243, roas: 11.20, warning: 'low impressions, good CVR' },
  { id: 'TB-KU-IND-L-1023', name: 'Kurti legging - Indigo L', category: 'Kurti', state: 'sleeper', availability: 'in_stock', impressions: 551, ctr: 3.2, spend: 98, conversions: 1, cvr: 5.6, revenue: 1385, roas: 14.13, warning: 'low impressions, good CVR' },
  { id: 'TB-LO-LAV-XXL', name: 'Modal nightdress - Lavender XXL', category: 'Loungewear', state: 'sleeper', availability: 'in_stock', impressions: 492, ctr: 3.9, spend: 91, conversions: 1, cvr: 4.7, revenue: 1190, roas: 13.08, warning: 'low impressions, good CVR' },
  { id: 'TB-KU-CHA-M-1028', name: 'Anarkali legging - Charcoal M', category: 'Kurti', state: 'sleeper', availability: 'in_stock', impressions: 543, ctr: 3.7, spend: 88, conversions: 1, cvr: 4.4, revenue: 1342, roas: 15.25, warning: 'low impressions, good CVR' },
  { id: 'TB-SA-OLI-S-1031', name: 'Saree shaper - Olive S', category: 'Saree shaper', state: 'sleeper', availability: 'in_stock', impressions: 467, ctr: 4.0, spend: 79, conversions: 1, cvr: 5.3, revenue: 1275, roas: 16.14, warning: 'low impressions, good CVR' },
  { id: 'TB-LE-NAV-M-1032', name: 'Premium ankle legging - Navy M', category: 'Leggings', state: 'sleeper', availability: 'in_stock', impressions: 421, ctr: 3.8, spend: 72, conversions: 1, cvr: 6.2, revenue: 1198, roas: 16.64, warning: 'low impressions, good CVR' },
  { id: 'TB-LO-IND-L-1033', name: 'Cotton pyjama - Indigo L', category: 'Loungewear', state: 'sleeper', availability: 'in_stock', impressions: 388, ctr: 3.6, spend: 64, conversions: 1, cvr: 7.1, revenue: 1150, roas: 17.97, warning: 'low impressions, good CVR' },
  { id: 'TB-SA-WHI-M-1034', name: 'Saree shaper - White M', category: 'Saree shaper', state: 'sleeper', availability: 'in_stock', impressions: 352, ctr: 3.5, spend: 57, conversions: 1, cvr: 8.1, revenue: 1295, roas: 22.72, warning: 'low impressions, good CVR' },
  { id: 'TB-KU-WHI-S-1035', name: 'Cotton kurti pant - White S', category: 'Kurti', state: 'sleeper', availability: 'in_stock', impressions: 318, ctr: 3.4, spend: 50, conversions: 1, cvr: 9.2, revenue: 1180, roas: 23.60, warning: 'low impressions, good CVR' },
  { id: 'TB-LE-RED-L-1040', name: 'Stretch legging - Red L', category: 'Leggings', state: 'dead', availability: 'out_of_stock', impressions: 12400, ctr: 0.8, spend: 4200, conversions: 0, cvr: 0, revenue: 0, roas: 0 },
  { id: 'TB-SA-YEL-M-1041', name: 'Saree shaper - Yellow M', category: 'Saree shaper', state: 'dead', availability: 'out_of_stock', impressions: 9800, ctr: 0.6, spend: 3100, conversions: 0, cvr: 0, revenue: 0, roas: 0 },
  { id: 'TB-LO-RED-S-1042', name: 'Cotton pyjama - Red S', category: 'Loungewear', state: 'dead', availability: 'out_of_stock', impressions: 7600, ctr: 0.5, spend: 2800, conversions: 0, cvr: 0, revenue: 0, roas: 0 },
  { id: 'TB-KU-BLU-XL-1043', name: 'Kurti pant - Blue XL', category: 'Kurti', state: 'dead', availability: 'out_of_stock', impressions: 6200, ctr: 0.4, spend: 2100, conversions: 0, cvr: 0, revenue: 0, roas: 0 },
  { id: 'TB-LE-PUR-M-1044', name: 'Churidar legging - Purple M', category: 'Leggings', state: 'dead', availability: 'out_of_stock', impressions: 5100, ctr: 0.3, spend: 1800, conversions: 0, cvr: 0, revenue: 0, roas: 0 },
  { id: 'TB-SA-ORG-XL-1045', name: 'Saree shaper - Orange XL', category: 'Saree shaper', state: 'dead', availability: 'out_of_stock', impressions: 4300, ctr: 0.4, spend: 1500, conversions: 0, cvr: 0, revenue: 0, roas: 0 },
  { id: 'TB-LO-BRN-L-1071', name: 'Lounge pant - Brown L', category: 'Loungewear', state: 'dead', availability: 'out_of_stock', impressions: 3800, ctr: 0.3, spend: 1200, conversions: 0, cvr: 0, revenue: 0, roas: 0 },
  { id: 'TB-KU-TUR-S-1072', name: 'Kurti pant - Turquoise S', category: 'Kurti', state: 'dead', availability: 'out_of_stock', impressions: 2900, ctr: 0.2, spend: 980, conversions: 0, cvr: 0, revenue: 0, roas: 0 },
  { id: 'TB-LE-WHI-XXL-1073', name: 'Cotton legging - White XXL', category: 'Leggings', state: 'dead', availability: 'out_of_stock', impressions: 2100, ctr: 0.2, spend: 720, conversions: 0, cvr: 0, revenue: 0, roas: 0 },
  { id: 'TB-SA-GRN-M-1074', name: 'Saree shaper - Green M', category: 'Saree shaper', state: 'dead', availability: 'out_of_stock', impressions: 1700, ctr: 0.1, spend: 560, conversions: 0, cvr: 0, revenue: 0, roas: 0 },
];

export interface Campaign {
  name: string;
  type: string;
  spend: number;
  revenue: number;
  roas: number;
  conversions: number;
  impressions?: number;
}

export const CAMPAIGN_DATA: Campaign[] = [
  { name: 'KM | Palazzos', type: 'Performance Max', spend: 67623, revenue: 145832, roas: 2.16, conversions: 141 },
  { name: 'KM | Pmax | Leggings', type: 'Performance Max', spend: 175198, revenue: 472962, roas: 2.70, conversions: 464 },
  { name: 'KM | Pmax | SS', type: 'Performance Max', spend: 611076, revenue: 1211694, roas: 1.98, conversions: 1002 },
  { name: 'KM | Pmax | Shimmer Leggings', type: 'Performance Max', spend: 170245, revenue: 525671, roas: 3.09, conversions: 558 },
  { name: 'KM | Feed | Shopping', type: 'Shopping', spend: 483331, revenue: 1652003, roas: 3.42, conversions: 1561 },
  { name: 'Performance Max | Saree Shaper', type: 'Performance Max', spend: 1458528, revenue: 2950913, roas: 2.02, conversions: 1843 },
  { name: 'Search Remarketing | Brand + Products', type: 'Search', spend: 748888, revenue: 3861625, roas: 5.16, conversions: 2201 },
  { name: 'KM | PMax | Kurti Pant', type: 'Performance Max', spend: 1240003, revenue: 3054479, roas: 2.46, conversions: 2052 },
];

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
