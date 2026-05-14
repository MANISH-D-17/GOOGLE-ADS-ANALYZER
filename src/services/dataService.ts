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

class DataService {
  private campaignData: CampaignData[] | null = null;
  private trafficData: TrafficData[] | null = null;
  private productData: ProductData[] | null = null;
  private ecommerceData: EcommerceData[] | null = null;
  private eventData: EventData[] | null = null;

  private async fetchAndDecode(url: string, encoding: 'utf-8' | 'utf-16le' = 'utf-8'): Promise<string> {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder(encoding);
    return decoder.decode(buffer);
  }

  async loadCampaignData(): Promise<CampaignData[]> {
    if (this.campaignData) return this.campaignData;
    try {
      const text = await this.fetchAndDecode('/Dataset/Campaign report_twin birds.csv', 'utf-16le');
      const lines = text.split('\n');
      const cleanedCsv = lines.slice(2).join('\n'); // Skip first 2 title lines

      return new Promise((resolve, reject) => {
        Papa.parse(cleanedCsv, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            this.campaignData = results.data as CampaignData[];
            resolve(this.campaignData);
          },
          error: reject
        });
      });
    } catch (e) {
      console.error("Failed to load campaign dataset", e);
      return [];
    }
  }

  async loadTrafficData(): Promise<TrafficData[]> {
    if (this.trafficData) return this.trafficData;
    try {
      const text = await this.fetchAndDecode('/Dataset/Traffic_acquisition_Session_TwinBirds.csv', 'utf-8');
      const lines = text.split('\n');
      const dataStartIdx = lines.findIndex(l => l.startsWith('Session primary channel group'));
      const cleanedCsv = lines.slice(dataStartIdx).join('\n');

      return new Promise((resolve, reject) => {
        Papa.parse(cleanedCsv, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            this.trafficData = results.data as TrafficData[];
            resolve(this.trafficData);
          },
          error: reject
        });
      });
    } catch (e) {
      console.error("Failed to load traffic dataset", e);
      return [];
    }
  }

  async loadEventData(): Promise<EventData[]> {
    if (this.eventData) return this.eventData;
    try {
      const text = await this.fetchAndDecode('/Dataset/Events_Event_name(TwinBirds GA4).csv', 'utf-8');
      const lines = text.split('\n');
      const dataStartIdx = lines.findIndex(l => l.startsWith('Event name'));
      const cleanedCsv = lines.slice(dataStartIdx).join('\n');

      return new Promise((resolve, reject) => {
        Papa.parse(cleanedCsv, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            this.eventData = results.data as EventData[];
            resolve(this.eventData);
          },
          error: reject
        });
      });
    } catch (e) {
      console.error("Failed to load event dataset", e);
      return [];
    }
  }

  async loadEcommerceData(): Promise<EcommerceData[]> {
    if (this.ecommerceData) return this.ecommerceData;
    try {
      const text = await this.fetchAndDecode('/Dataset/E-commerce_purchases_(TwinBirds GA4).csv', 'utf-8');
      const lines = text.split('\n');
      const dataStartIdx = lines.findIndex(l => l.startsWith('Item name'));
      const cleanedCsv = lines.slice(dataStartIdx).join('\n');

      return new Promise((resolve, reject) => {
        Papa.parse(cleanedCsv, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            this.ecommerceData = results.data as EcommerceData[];
            resolve(this.ecommerceData);
          },
          error: reject
        });
      });
    } catch (e) {
      console.error("Failed to load ecommerce dataset", e);
      return [];
    }
  }

  async loadProductData(): Promise<ProductData[]> {
    if (this.productData) return this.productData;
    try {
      const [tsvText, ecommerceData] = await Promise.all([
        this.fetchAndDecode('/Dataset/products_2026-05-06_10-16-38.tsv', 'utf-8'),
        this.loadEcommerceData()
      ]);
      
      return new Promise((resolve, reject) => {
        Papa.parse(tsvText, {
          header: true,
          delimiter: '\t',
          skipEmptyLines: true,
          complete: (results) => {
            const rawData = results.data as any[];
            
            // Map TSV to E-commerce data by name matching (heuristic)
            this.productData = rawData.slice(0, 500).map(item => {
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
            resolve(this.productData);
          },
          error: reject
        });
      });
    } catch (e) {
      console.error("Failed to load product dataset", e);
      return [];
    }
  }

  async getExecutiveSummary() {
    const [campaigns, events] = await Promise.all([
      this.loadCampaignData(),
      this.loadEventData()
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
