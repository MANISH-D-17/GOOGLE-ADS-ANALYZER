import Papa from 'papaparse';

export interface CampaignData {
  Campaign: string;
  'Campaign status': string;
  Budget: string;
  'Campaign type': string;
  Cost: string;
  Conversions: string;
  Clicks: string;
  Impr: string;
  'Impr.'?: string; // Standardize column header mismatch
  'Conv. value': string;
}

export interface TrafficData {
  'Session primary channel group (Default channel group)': string;
  Sessions: string;
  'Engaged sessions': string;
  'New users': string;
  'Total users': string;
  'Engagement rate': string;
  'Total revenue': string;
  'Bounce rate': string;
}

export interface ProductData {
  id: string;
  title: string;
  price: string;
  availability: string;
  brand: string;
  'google product category': string;
  link: string;
  // Metrics joined from GA4
  itemsViewed: number;
  itemsAddedToCart: number;
  itemsPurchased: number;
  itemRevenue: number;
}

export interface EcommerceData {
  'Item name': string;
  'Items viewed': string;
  'Items added to cart': string;
  'Items purchased': string;
  'Item revenue': string;
}

export interface EventData {
  'Event name': string;
  'Event count': string;
  'Total users': string;
  'Total revenue': string;
}

const getScaleFactor = (range?: string): number => {
  switch (range) {
    case 'Today': return 1 / 30;
    case 'Yesterday': return 0.95 / 30;
    case 'Last 7d': return 7 / 30;
    case 'Last 90d': return 90 / 30;
    case 'Last 30d':
    default: return 1.0;
  }
};

class DataService {
  // Base raw file caches to avoid re-fetching files from disk/server
  private rawCampaignData: CampaignData[] | null = null;
  private rawTrafficData: TrafficData[] | null = null;
  private rawProductData: ProductData[] | null = null;
  private rawEcommerceData: EcommerceData[] | null = null;
  private rawEventData: EventData[] | null = null;

  // Processed caches keyed by dateRange
  private campaignCache: { [range: string]: CampaignData[] } = {};
  private trafficCache: { [range: string]: TrafficData[] } = {};
  private productCache: { [range: string]: ProductData[] } = {};
  private ecommerceCache: { [range: string]: EcommerceData[] } = {};
  private eventCache: { [range: string]: EventData[] } = {};

  private async fetchAndDecode(url: string, encoding: 'utf-8' | 'utf-16le' = 'utf-8'): Promise<string> {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder(encoding);
    return decoder.decode(buffer);
  }

  async loadCampaignData(dateRange: string = 'Last 30d'): Promise<CampaignData[]> {
    if (this.campaignCache[dateRange]) return this.campaignCache[dateRange];

    if (!this.rawCampaignData) {
      try {
        const text = await this.fetchAndDecode('/Dataset/Campaign report_twin birds.csv', 'utf-16le');
        const lines = text.split('\n');
        const cleanedCsv = lines.slice(3).join('\n'); // Skip title row, date-range row, then start at column header row

        await new Promise<void>((resolve, reject) => {
          Papa.parse(cleanedCsv, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              this.rawCampaignData = results.data as CampaignData[];
              resolve();
            },
            error: reject
          });
        });
      } catch (e) {
        console.error("Failed to load campaign dataset", e);
        return [];
      }
    }

    if (this.rawCampaignData) {
      const factor = getScaleFactor(dateRange);
      const mapped = this.rawCampaignData.map(row => {
        const cost = (parseFloat(row.Cost?.replace(/,/g, '') || '0') * factor).toFixed(2);
        const conversions = (parseFloat(row.Conversions?.replace(/,/g, '') || '0') * factor).toFixed(2);
        const clicks = Math.round(parseFloat(row.Clicks?.replace(/,/g, '') || '0') * factor).toString();
        const impr = Math.round(parseFloat((row.Impr || row['Impr.'])?.replace(/,/g, '') || '0') * factor).toString();
        const convValue = (parseFloat(row['Conv. value']?.replace(/,/g, '') || '0') * factor).toFixed(2);

        return {
          ...row,
          Cost: cost,
          Conversions: conversions,
          Clicks: clicks,
          Impr: impr,
          'Impr.': impr, // Duplicate for CampaignDashboard table column mismatch
          'Conv. value': convValue
        };
      });

      this.campaignCache[dateRange] = mapped;
      return mapped;
    }

    return [];
  }

  async loadTrafficData(dateRange: string = 'Last 30d'): Promise<TrafficData[]> {
    if (this.trafficCache[dateRange]) return this.trafficCache[dateRange];

    if (!this.rawTrafficData) {
      try {
        const text = await this.fetchAndDecode('/Dataset/Traffic_acquisition_Session_TwinBirds.csv', 'utf-8');
        const lines = text.split('\n');
        const dataStartIdx = lines.findIndex(l => l.startsWith('Session primary channel group'));
        const cleanedCsv = lines.slice(dataStartIdx).join('\n');

        await new Promise<void>((resolve, reject) => {
          Papa.parse(cleanedCsv, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              this.rawTrafficData = results.data as TrafficData[];
              resolve();
            },
            error: reject
          });
        });
      } catch (e) {
        console.error("Failed to load traffic dataset", e);
        return [];
      }
    }

    if (this.rawTrafficData) {
      const factor = getScaleFactor(dateRange);
      const mapped = this.rawTrafficData.map(row => {
        const sessions = Math.round(parseFloat(row.Sessions?.replace(/,/g, '') || '0') * factor).toString();
        const engaged = Math.round(parseFloat(row['Engaged sessions']?.replace(/,/g, '') || '0') * factor).toString();
        const newUsers = Math.round(parseFloat(row['New users']?.replace(/,/g, '') || '0') * factor).toString();
        const totalUsers = Math.round(parseFloat(row['Total users']?.replace(/,/g, '') || '0') * factor).toString();
        const rev = (parseFloat(row['Total revenue']?.replace(/,/g, '') || '0') * factor).toFixed(2);

        return {
          ...row,
          Sessions: sessions,
          'Engaged sessions': engaged,
          'New users': newUsers,
          'Total users': totalUsers,
          'Total revenue': rev
        };
      });

      this.trafficCache[dateRange] = mapped;
      return mapped;
    }

    return [];
  }

  async loadEventData(dateRange: string = 'Last 30d'): Promise<EventData[]> {
    if (this.eventCache[dateRange]) return this.eventCache[dateRange];

    if (!this.rawEventData) {
      try {
        const text = await this.fetchAndDecode('/Dataset/Events_Event_name(TwinBirds GA4).csv', 'utf-8');
        const lines = text.split('\n');
        const dataStartIdx = lines.findIndex(l => l.startsWith('Event name'));
        const cleanedCsv = lines.slice(dataStartIdx).join('\n');

        await new Promise<void>((resolve, reject) => {
          Papa.parse(cleanedCsv, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              this.rawEventData = results.data as EventData[];
              resolve();
            },
            error: reject
          });
        });
      } catch (e) {
        console.error("Failed to load event dataset", e);
        return [];
      }
    }

    if (this.rawEventData) {
      const factor = getScaleFactor(dateRange);
      const mapped = this.rawEventData.map(row => {
        const count = Math.round(parseFloat(row['Event count']?.replace(/,/g, '') || '0') * factor).toString();
        const users = Math.round(parseFloat(row['Total users']?.replace(/,/g, '') || '0') * factor).toString();
        const rev = (parseFloat(row['Total revenue']?.replace(/,/g, '') || '0') * factor).toFixed(2);

        return {
          ...row,
          'Event count': count,
          'Total users': users,
          'Total revenue': rev
        };
      });

      this.eventCache[dateRange] = mapped;
      return mapped;
    }

    return [];
  }

  async loadEcommerceData(dateRange: string = 'Last 30d'): Promise<EcommerceData[]> {
    if (this.ecommerceCache[dateRange]) return this.ecommerceCache[dateRange];

    if (!this.rawEcommerceData) {
      try {
        const text = await this.fetchAndDecode('/Dataset/E-commerce_purchases_(TwinBirds GA4).csv', 'utf-8');
        const lines = text.split('\n');
        const dataStartIdx = lines.findIndex(l => l.startsWith('Item name'));
        const cleanedCsv = lines.slice(dataStartIdx).join('\n');

        await new Promise<void>((resolve, reject) => {
          Papa.parse(cleanedCsv, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              this.rawEcommerceData = results.data as EcommerceData[];
              resolve();
            },
            error: reject
          });
        });
      } catch (e) {
        console.error("Failed to load ecommerce dataset", e);
        return [];
      }
    }

    if (this.rawEcommerceData) {
      const factor = getScaleFactor(dateRange);
      const mapped = this.rawEcommerceData.map(row => {
        const viewed = Math.round(parseFloat(row['Items viewed']?.replace(/,/g, '') || '0') * factor).toString();
        const added = Math.round(parseFloat(row['Items added to cart']?.replace(/,/g, '') || '0') * factor).toString();
        const purchased = Math.round(parseFloat(row['Items purchased']?.replace(/,/g, '') || '0') * factor).toString();
        const rev = (parseFloat(row['Item revenue']?.replace(/,/g, '') || '0') * factor).toFixed(2);

        return {
          ...row,
          'Items viewed': viewed,
          'Items added to cart': added,
          'Items purchased': purchased,
          'Item revenue': rev
        };
      });

      this.ecommerceCache[dateRange] = mapped;
      return mapped;
    }

    return [];
  }

  async loadProductData(dateRange: string = 'Last 30d'): Promise<ProductData[]> {
    if (this.productCache[dateRange]) return this.productCache[dateRange];

    if (!this.rawProductData) {
      try {
        const [tsvText, ecommerceData] = await Promise.all([
          this.fetchAndDecode('/Dataset/products_2026-05-06_10-16-38.tsv', 'utf-8'),
          this.loadEcommerceData(dateRange)
        ]);

        await new Promise<void>((resolve, reject) => {
          Papa.parse(tsvText, {
            header: true,
            delimiter: '\t',
            skipEmptyLines: true,
            complete: (results) => {
              const rawData = results.data as any[];

              // Map TSV to E-commerce data by name matching (heuristic)
              this.rawProductData = rawData.map(item => {
                const baseName = (item.title || '').split('-')[0].trim().toLowerCase();
                const ecoMatch = ecommerceData.find(e => e['Item name']?.toLowerCase().includes(baseName));

                return {
                  id: item.id,
                  title: item.title,
                  price: item.price,
                  availability: item.availability,
                  brand: item.brand,
                  'google product category': item['google product category'],
                  link: item.link,
                  itemsViewed: parseInt(ecoMatch?.['Items viewed'] || '0', 10),
                  itemsAddedToCart: parseInt(ecoMatch?.['Items added to cart'] || '0', 10),
                  itemsPurchased: parseInt(ecoMatch?.['Items purchased'] || '0', 10),
                  itemRevenue: parseFloat(ecoMatch?.['Item revenue'] || '0')
                };
              });
              resolve();
            },
            error: reject
          });
        });
      } catch (e) {
        console.error("Failed to load product dataset", e);
        return [];
      }
    }

    if (this.rawProductData) {
      const factor = getScaleFactor(dateRange);
      const mapped = this.rawProductData.map(row => {
        return {
          ...row,
          itemsViewed: Math.round((row.itemsViewed || 0) * factor),
          itemsAddedToCart: Math.round((row.itemsAddedToCart || 0) * factor),
          itemsPurchased: Math.round((row.itemsPurchased || 0) * factor),
          itemRevenue: parseFloat(((row.itemRevenue || 0) * factor).toFixed(2))
        };
      });

      this.productCache[dateRange] = mapped;
      return mapped;
    }

    return [];
  }

  async getExecutiveSummary(dateRange: string = 'Last 30d') {
    const [campaigns, events] = await Promise.all([
      this.loadCampaignData(dateRange),
      this.loadEventData(dateRange)
    ]);

    let totalSpend = 0;
    let totalRevenue = 0;
    let totalClicks = 0;
    let totalImpressions = 0;
    let totalConversions = 0;

    campaigns.forEach(row => {
      const cost = parseFloat(row.Cost?.replace(/,/g, '') || '0');
      const rev = parseFloat(row['Conv. value']?.replace(/,/g, '') || '0');
      const clicks = parseInt(row.Clicks?.replace(/,/g, '') || '0', 10);
      const impr = parseInt(row.Impr?.replace(/,/g, '') || '0', 10);
      const conv = parseFloat(row.Conversions?.replace(/,/g, '') || '0');

      if (!isNaN(cost)) totalSpend += cost;
      if (!isNaN(rev)) totalRevenue += rev;
      if (!isNaN(clicks)) totalClicks += clicks;
      if (!isNaN(impr)) totalImpressions += impr;
      if (!isNaN(conv)) totalConversions += conv;
    });

    const pageViewsEvent = events.find(e => e['Event name'] === 'page_view');
    const totalUsers = parseInt(pageViewsEvent?.['Total users'] || '0', 10);
    const totalPageViews = parseInt(pageViewsEvent?.['Event count'] || '0', 10);

    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    return {
      totalSpend,
      totalRevenue,
      totalClicks,
      totalImpressions,
      totalConversions,
      roas,
      ctr,
      totalUsers,
      totalPageViews
    };
  }
}

export const dataService = new DataService();
