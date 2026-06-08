import JSZip from 'jszip';
import Papa from 'papaparse';
import { 
  CompetitorOverview, 
  OverviewResponse, 
  KeywordIntel, 
  AdCreative, 
  BenchmarkReport, 
  AIRecommendation 
} from './competitorApiService';

// Standard template for fallback recommendations if generation needs presets
const RECOMMENDATION_TEMPLATES = {
  cta: {
    type: 'cta',
    priority: 'high',
    title: 'Upgrade Your CTA Strategy',
    description: 'Competitor uses action-oriented CTAs with urgency triggers. Your CTAs lack specificity.',
    actionItems: [
      'Replace generic "Learn More" with "Shop the Collection Now"',
      'Add social proof: "Join 1M+ Happy Customers"',
      'Test urgency: "Today Only — 40% OFF"',
      'Use benefit-first CTAs: "Get Free Delivery Today"'
    ],
    impactScore: 0.85,
    isActioned: false
  },
  creative: {
    type: 'creative',
    priority: 'high',
    title: 'Improve Visual Creative Quality',
    description: 'Competitor runs 70%+ image ads with vibrant product photography. Increase visual ad volume.',
    actionItems: [
      'Increase image ad ratio to 70%+ of total ads',
      'Use lifestyle imagery showing product in real use',
      'Test bright, high-contrast color palettes',
      'Add offer overlays directly on creative'
    ],
    impactScore: 0.82,
    isActioned: false
  },
  keyword: {
    type: 'keyword',
    priority: 'medium',
    title: 'Exploit Keyword Gaps',
    description: 'Competitor targets high-volume fashion intent keywords you are missing.',
    actionItems: [
      'Add long-tail: "affordable women leggings India"',
      'Target competitor brand + style keywords',
      'Expand into "plus size fashion India" segment',
      'Test RLSA campaigns for competitor site visitors'
    ],
    impactScore: 0.75,
    isActioned: false
  },
  offer: {
    type: 'offer',
    priority: 'medium',
    title: 'Strengthen Promotional Offers',
    description: 'Competitor uses structured discount patterns in 30%+ of ads. Align promotional calendar.',
    actionItems: [
      'Launch "Free Shipping on First Order" campaign',
      'Test flat discount messaging: "Flat ₹200 Off"',
      'Create bundle offers: "Buy 3 Get 1 Free"',
      'Align promos with festive calendar (Dussehra, Diwali)'
    ],
    impactScore: 0.72,
    isActioned: false
  },
  positioning: {
    type: 'positioning',
    priority: 'low',
    title: 'Differentiate Product Positioning',
    description: 'Competitor focuses on color variety. Differentiate on comfort, size inclusivity, and quality.',
    actionItems: [
      'Lead with "Sizes XS to 5XL" inclusivity message',
      'Highlight premium fabric sourcing',
      'Test "comfort first" messaging in headlines',
      'Create separate campaigns for different body types'
    ],
    impactScore: 0.65,
    isActioned: false
  }
};

// Preset Go Colors mock competitor data for rich browser-only fallback loading
const PRESET_COMPETITORS: {
  overview: CompetitorOverview;
  keywords: KeywordIntel[];
  creatives: AdCreative[];
  comparison: BenchmarkReport;
  recommendations: AIRecommendation[];
  negatives?: any[];
}[] = [
  {
    overview: {
      id: 'go-colors-presets',
      domain: 'gocolors.com',
      brand: 'Go Colors',
      region: 'IN',
      totalAds: 12,
      imageAds: 9,
      avgScore: 7.8,
      keywordCount: 15,
      topKeywords: ['go colors leggings', 'women bottomwear', 'buy palazzos', 'churidars online', 'colored leggings'],
      lastScraped: new Date().toISOString(),
      totalAdsSeen: 12,
      sessionCount: 1,
      benchmarkScore: 84.5,
      competitorCreativeScore: 7.8
    },
    keywords: [
      { keyword: 'go colors leggings', frequency: 12, relevanceScore: 0.95, intent: 'branded' },
      { keyword: 'women bottomwear', frequency: 8, relevanceScore: 0.85, intent: 'generic' },
      { keyword: 'buy palazzos online', frequency: 6, relevanceScore: 0.78, intent: 'generic' },
      { keyword: 'churidars online', frequency: 5, relevanceScore: 0.72, intent: 'generic' },
      { keyword: 'colored leggings', frequency: 4, relevanceScore: 0.80, intent: 'branded' },
      { keyword: 'comfortable leggings', frequency: 3, relevanceScore: 0.90, intent: 'generic' }
    ],
    creatives: [
      {
        id: 'ad_preset_1',
        externalId: 'cr_preset_1',
        brand: 'Go Colors',
        domain: 'gocolors.com',
        headline: 'Go Colors Leggings — 100+ Colors, Perfect Stretch',
        description: 'Vibrant colors, ultra-soft fabrics, body-adaptive stretch for comfortable style all day long.',
        ctaText: 'Shop Now',
        landingUrl: 'https://gocolors.com',
        adFormat: 'image',
        fashionCategory: 'Bottomwear',
        offerText: '40% OFF First Order',
        emotionalTriggers: ['comfort', 'style', 'confidence'],
        dominantColors: ['#db2777', '#ffffff', '#1e293b'],
        imageUrls: ['https://images.unsplash.com/photo-1506152983158-b4a74a01c721?w=500&auto=format&fit=crop&q=60'],
        firstSeen: '2026-01-01',
        lastSeen: '2026-05-16',
        scores: { creative: 8.2, emotional: 8.5, cta: 8.0, visual: 8.4, keyword: 7.8, composite: 8.2 },
        extractedAt: new Date().toISOString()
      },
      {
        id: 'ad_preset_2',
        externalId: 'cr_preset_2',
        brand: 'Go Colors',
        domain: 'gocolors.com',
        headline: 'Festive Palette Churidars — Premium Ethnic Bottoms',
        description: 'Traditional styling meets contemporary premium materials. Shop sizes XS to 5XL.',
        ctaText: 'Explore Collection',
        landingUrl: 'https://gocolors.com',
        adFormat: 'image',
        fashionCategory: 'Ethnic Wear',
        offerText: 'Starting ₹399',
        emotionalTriggers: ['festive', 'exclusivity', 'trust'],
        dominantColors: ['#f59e0b', '#ffffff', '#78350f'],
        imageUrls: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=500&auto=format&fit=crop&q=60'],
        firstSeen: '2026-02-15',
        lastSeen: '2026-05-16',
        scores: { creative: 7.5, emotional: 7.2, cta: 7.6, visual: 7.8, keyword: 7.0, composite: 7.4 },
        extractedAt: new Date().toISOString()
      }
    ],
    comparison: {
      competitor: { id: 'go-colors-presets', domain: 'gocolors.com', brand: 'Go Colors' },
      benchmark: {
        myCTR: 3.25,
        competitorCTR: 3.65,
        myCPC: 12.80,
        competitorCPC: 14.50,
        myROAS: 4.20,
        myCreativeScore: 8.1,
        competitorCreativeScore: 7.8,
        myKeywordCount: 50,
        competitorKeywordCount: 15,
        overallScore: 82.5,
        strengths: ['Vast physical retail brand search pull', 'Strong CTA alignment with direct conversion hooks'],
        weaknesses: ['Higher CPC rates due to generic search bids', 'Lower organic return on social campaigns'],
        opportunities: ['Exploit Body-Shape category gaps', 'Incorporate high contrast product background creative overlays'],
        threats: ['Aggressive discount pricing matching festive cycles']
      }
    },
    recommendations: [
      {
        id: 'rec_preset_1',
        type: 'cta',
        title: 'Upgrade Your CTA Strategy',
        description: 'Go Colors leverages highly action-driven CTA triggers. Boost your conversions by aligning headlines.',
        actionItems: ['Use benefit-driven "Get Free Delivery Today"', 'Deploy "Shop the Collection Now" over "Learn More"'],
        priority: 'high',
        impactScore: 0.85,
        isActioned: false,
        createdAt: new Date().toISOString()
      }
    ],
    negatives: [
      { term: 'kids activewear', category: 'Target Demographics', matchType: 'Phrase', savings: 'Medium', rationale: 'Twin Birds focuses exclusively on adult women wear. Exclude children\'s activewear searches.' },
      { term: 'mens leggings', category: 'Target Demographics', matchType: 'Phrase', savings: 'High', rationale: 'Twin Birds designs products only for women. Block male-focused queries to avoid ad waste.' },
      { term: 'cheap leggings duplicate', category: 'Bargain / Price Intent', matchType: 'Phrase', savings: 'High', rationale: 'Twin Birds is a premium-tier brand. Clicks from bargain/duplicate searches convert poorly.' },
      { term: 'free leggings sample', category: 'Bargain / Price Intent', matchType: 'Exact', savings: 'Low', rationale: 'Users seeking free samples are low-intent and waste pay-per-click budget.' },
      { term: 'twin birds restaurant', category: 'Ambiguous Intent', matchType: 'Phrase', savings: 'High', rationale: 'Avoid overlaps on food/hospitality searches containing the brand name.' },
      { term: 'angry birds toys', category: 'Ambiguous Intent', matchType: 'Broad', savings: 'High', rationale: 'Block toys and gaming queries containing birds keywords that trigger ad matches.' },
      { term: 'denim jeans stretch', category: 'Out of Scope Products', matchType: 'Phrase', savings: 'Medium', rationale: 'Twin Birds sells knitted bottomwear and shapewear, not denim jeans.' }
    ]
  }
];

export class ClientCompetitorStore {
  private static STORAGE_KEY = 'gads_client_competitors';

  // Load all client competitors
  static getCompetitors() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to read from localStorage:', e);
    }
    // Return defaults if none imported
    return PRESET_COMPETITORS;
  }

  // Clear all database overrides
  static clearAll() {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Save competitor to localStorage
  static saveCompetitor(competitor: typeof PRESET_COMPETITORS[0]) {
    const list = this.getCompetitors();
    // Prevent duplicate domain
    const filtered = list.filter((c: any) => c.overview.domain !== competitor.overview.domain);
    filtered.push(competitor);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }

  // Find competitor data by domain
  static findByDomain(domain?: string) {
    const list = this.getCompetitors();
    if (!domain) return list[0] || PRESET_COMPETITORS[0];
    return list.find((c: any) => c.overview.domain === domain) || PRESET_COMPETITORS[0];
  }

  // Find negatives by domain
  static findNegativesByDomain(domain?: string) {
    const data = this.findByDomain(domain) as any;
    return data.negatives || PRESET_COMPETITORS[0].negatives || [];
  }

  // Generate overview response
  static getOverviewResponse(domain?: string): OverviewResponse {
    const list = this.getCompetitors();
    const overviews = list.map((c: any) => c.overview);
    
    let totalAds = 0;
    let totalKeywords = 0;
    
    overviews.forEach((o: any) => {
      totalAds += o.totalAds;
      totalKeywords += o.keywordCount;
    });

    return {
      competitors: domain ? overviews.filter((o: any) => o.domain === domain) : overviews,
      totalAds,
      totalKeywords,
      totalSessions: list.length,
      lastUpdated: new Date().toISOString()
    };
  }

  // Client side Dynamic ZIP Import Parser
  static async importCompetitorZip(file: File): Promise<{ domain: string, brand: string }> {
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(file);

    // Read metadata files
    const websiteStr = await loadedZip.file('metadata/website.json')?.async('string');
    const adsStr = await loadedZip.file('metadata/ads.json')?.async('string');
    const keywordsStr = await loadedZip.file('metadata/keywords.json')?.async('string');
    const campaignsStr = await loadedZip.file('metadata/campaigns.json')?.async('string');
    const creativesStr = await loadedZip.file('metadata/creatives.json')?.async('string');
    const analysisStr = await loadedZip.file('metadata/analysis.json')?.async('string');

    if (!websiteStr || !adsStr) {
      throw new Error('ZIP missing core required files (metadata/website.json or metadata/ads.json)');
    }

    const website = JSON.parse(websiteStr);
    const domain = website.domain;
    const brand = website.brand || domain.split('.')[0].replace('-', ' ').toUpperCase();
    const region = website.region || 'IN';

    const ads: AdCreative[] = JSON.parse(adsStr).map((ad: any, idx: number) => ({
      id: ad.id || `ad_${Math.random().toString(36).substr(2, 9)}`,
      externalId: ad.externalId || ad.creativeId || `cr_${idx}`,
      brand: ad.brand || brand,
      domain: ad.domain || domain,
      headline: ad.headline || 'Competitor Ad Creative',
      description: ad.description || 'Vibrant catalog designs tailored for premium shoppers.',
      ctaText: ad.ctaText || 'Shop Now',
      landingUrl: ad.landingUrl || `https://${domain}`,
      adFormat: ad.adFormat || 'image',
      fashionCategory: ad.fashionCategory || 'Bottomwear',
      offerText: ad.offerText || '',
      emotionalTriggers: ad.emotionalTriggers || ['comfort', 'style'],
      dominantColors: ad.dominantColors || ['#f97316', '#ffffff'],
      imageUrls: ad.imageUrls || [],
      firstSeen: ad.firstSeen || '2026-01-01',
      lastSeen: ad.lastSeen || '2026-05-16',
      scores: ad.scores || { creative: 7.5, emotional: 7.5, cta: 7.5, visual: 7.5, keyword: 7.5, composite: 7.5 },
      extractedAt: ad.extractedAt || new Date().toISOString()
    }));

    // Parse keywords
    let keywords: KeywordIntel[] = [];
    if (keywordsStr) {
      keywords = JSON.parse(keywordsStr);
    } else {
      // Parse from CSV if keywords.json is absent
      const kwCsvStr = await loadedZip.file('reports/keyword-analysis.csv')?.async('string');
      if (kwCsvStr) {
        const parsed = Papa.parse(kwCsvStr, { header: true });
        keywords = (parsed.data as any[]).map((row: any) => ({
          keyword: row.Keyword || row.keyword,
          frequency: parseInt(row.Frequency || row.frequency || '1'),
          relevanceScore: parseFloat(row.RelevanceScore || row.relevanceScore || row.relevance || '0.5'),
          intent: row.Intent || row.intent || 'generic'
        })).filter(k => k.keyword);
      }
    }

    // Default keywords if still empty
    if (keywords.length === 0) {
      keywords = [
        { keyword: `${brand.toLowerCase()} leggings`, frequency: 10, relevanceScore: 0.90, intent: 'branded' },
        { keyword: 'buy premium leggings', frequency: 7, relevanceScore: 0.80, intent: 'generic' }
      ];
    }

    // Parse Campaigns
    const campaigns = campaignsStr ? JSON.parse(campaignsStr) : [];
    
    // Parse Creative Score
    let avgCreativeScore = 7.5;
    if (analysisStr) {
      const analysisObj = JSON.parse(analysisStr);
      avgCreativeScore = analysisObj.averageCreativeScore || 7.5;
    } else {
      const sum = ads.reduce((acc, curr) => acc + (curr.scores?.composite || 7.5), 0);
      avgCreativeScore = ads.length > 0 ? parseFloat((sum / ads.length).toFixed(1)) : 7.5;
    }

    // 1. Build In-Browser Benchmarking Engine
    const myKeywords = new Set(['twin birds leggings', 'buy leggings online', 'women sports bra', 'activewear women', 'leggings online']);
    const compKeywordsSet = new Set(keywords.map(k => k.keyword.toLowerCase()));
    const overlap = Array.from(myKeywords).filter(k => compKeywordsSet.has(k));
    const overlapPercent = (overlap.length / Math.max(1, compKeywordsSet.size)) * 100;

    const compCtas = ads.map(a => a.ctaText).filter(Boolean);
    const primaryCompCta = compCtas.length > 0 
      ? compCtas.reduce((a, b, _, arr) => arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b)
      : 'Shop Now';

    const compOffers = ads.map(a => a.offerText).filter(Boolean);
    const hasDiscount = compOffers.some(o => o.includes('%') || o.toLowerCase().includes('off'));

    const benchmark: BenchmarkReport = {
      competitor: { id: `client_${domain}`, domain, brand },
      benchmark: {
        myCTR: 3.25,
        competitorCTR: avgCreativeScore < 7.5 ? 2.85 : 3.65,
        myCPC: 12.80,
        competitorCPC: 14.50,
        myROAS: 4.20,
        myCreativeScore: 8.1,
        competitorCreativeScore: avgCreativeScore,
        myKeywordCount: 50,
        competitorKeywordCount: keywords.length,
        overallScore: parseFloat(((8.1 / Math.max(1, avgCreativeScore)) * 100).toFixed(1)),
        strengths: [
          'High creative density on Bottomwear segments',
          `Effective use of "${primaryCompCta}" call-to-actions`
        ],
        weaknesses: [
          'Limited brand term defense outside of direct search queries',
          'Slower performance on non-discounted product sets'
        ],
        opportunities: [
          `Leverage overlapping keyword targets: ${overlap.slice(0, 2).join(', ') || 'leggings online'}`,
          `Test flattening offer structures matching their promo: ${compOffers[0] || '₹200 Off First Purchase'}`
        ],
        threats: [
          hasDiscount ? 'Aggressive price discount campaigns bleeding your traffic' : 'Vibrant photo-led display campaigns dominating desktop placements'
        ]
      }
    };

    // 2. Build In-Browser Recommendation Engine
    const recommendations: AIRecommendation[] = [];
    recommendations.push({
      id: `client_rec_cta_${domain}`,
      type: 'cta',
      title: 'Align CTA Copy to Match Competitor Responses',
      description: `Competitor utilizes '${primaryCompCta}' highly effectively. Align calls to action to boost clicks.`,
      actionItems: [`A/B test "${primaryCompCta}" headlines on PMax products`, 'Deploy secondary benefit descriptions in shopping overlays'],
      priority: 'high',
      impactScore: 0.85,
      isActioned: false,
      createdAt: new Date().toISOString()
    });

    recommendations.push({
      id: `client_rec_creative_${domain}`,
      type: 'creative',
      title: 'Launch Vibrant Product-First Displays',
      description: `Vibrant product displays cover ${Math.round((ads.filter(a => a.adFormat === 'image').length / Math.max(1, ads.length)) * 100)}% of competitor ad sets.`,
      actionItems: ['Generate high-contrast color product overlays', 'Deploy multi-product collage tiles on category landing pages'],
      priority: 'high',
      impactScore: 0.82,
      isActioned: false,
      createdAt: new Date().toISOString()
    });

    if (keywords.length > 50) {
      recommendations.push({
        id: `client_rec_kw_${domain}`,
        type: 'keyword',
        title: 'Bypass Brand Search Bid Squeezes',
        description: 'Competitor has massive keyword sets bidding on generic terms. Optimize long-tail exact keywords.',
        actionItems: ['Target longer tail: "cotton stretch churidars premium"', 'Deploy match keywords to block aggressive search overlaps'],
        priority: 'medium',
        impactScore: 0.75,
        isActioned: false,
        createdAt: new Date().toISOString()
      });
    }

    // Build the finalized local store element
    const competitorElement = {
      overview: {
        id: `client_${domain}`,
        domain,
        brand,
        region,
        totalAds: ads.length,
        imageAds: ads.filter(a => a.adFormat === 'image').length,
        avgScore: avgCreativeScore,
        keywordCount: keywords.length,
        topKeywords: keywords.slice(0, 5).map(k => k.keyword),
        lastScraped: new Date().toISOString(),
        totalAdsSeen: ads.length,
        sessionCount: 1,
        benchmarkScore: benchmark.benchmark.overallScore,
        competitorCreativeScore: avgCreativeScore
      },
      keywords,
      creatives: ads,
      comparison: benchmark,
      recommendations,
      negatives: [
        { term: 'kids activewear', category: 'Target Demographics', matchType: 'Phrase', savings: 'Medium', rationale: 'Twin Birds focuses exclusively on adult women wear. Exclude children\'s clothing searches.' },
        { term: 'mens leggings', category: 'Target Demographics', matchType: 'Phrase', savings: 'High', rationale: 'Twin Birds designs products only for women. Block male-focused queries to avoid waste.' },
        { term: 'cheap leggings duplicate', category: 'Bargain / Price Intent', matchType: 'Phrase', savings: 'High', rationale: 'Twin Birds is a premium-tier brand. Replica or cheap queries convert poorly.' },
        { term: 'free leggings sample', category: 'Bargain / Price Intent', matchType: 'Exact', savings: 'Low', rationale: 'Users seeking free samples are low-intent and waste pay-per-click budget.' },
        { term: `${brand.toLowerCase()} coupons`, category: 'Bargain / Price Intent', matchType: 'Phrase', savings: 'Medium', rationale: `Avoid bidding on coupons or codes for competitor brand ${brand}.` },
        { term: 'twin birds restaurant', category: 'Ambiguous Intent', matchType: 'Phrase', savings: 'High', rationale: 'Avoid overlaps on food/hospitality searches containing the brand name.' },
        { term: 'denim jeans stretch', category: 'Out of Scope Products', matchType: 'Phrase', savings: 'Medium', rationale: 'Twin Birds sells knitted bottomwear and shapewear, not denim jeans.' }
      ]
    };

    // Save and register competitor local override
    this.saveCompetitor(competitorElement);

    return { domain, brand };
  }
}
