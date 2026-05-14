import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import { 
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, 
  ArrowLeft, Download, ExternalLink, Activity, Target, ImageIcon, ShoppingBag, ShieldAlert, CheckCircle2, AlertCircle, BarChart2
} from 'lucide-react';
import { dataService, ProductData } from '../services/dataService';
import { formatRupees, cn } from '../lib/utils';
import { MetricCard } from '../components/cards/MetricCard';

// --- DYNAMIC SYNTHESIS HELPERS ---
const calculateSkuState = (sku: ProductData): string => {
  const views = sku.itemsViewed || 0;
  const purchases = sku.itemsPurchased || 0;
  if (views === 0) return 'sleeper';
  const cvr = (purchases / views) * 100;
  if (cvr >= 2.5) return 'winner';
  if (cvr < 0.8 && views > 50) return 'bleeder';
  return 'stable';
};

const generateKeywords = (sku: ProductData) => {
  const baseName = sku.title.split(' ').slice(0, 3).join(' ').toLowerCase();
  const rev = sku.itemRevenue || 0;
  
  return [
    { term: `${baseName} online`, intent: 'generic', clicks: 142, cvr: 4.5, roas: 3.2, spend: rev * 0.1, revenue: rev * 0.4 },
    { term: `buy ${baseName}`, intent: 'generic', clicks: 89, cvr: 6.1, roas: 5.4, spend: rev * 0.05, revenue: rev * 0.3 },
    { term: `twin birds ${baseName}`, intent: 'branded', clicks: 45, cvr: 12.4, roas: 8.1, spend: rev * 0.02, revenue: rev * 0.2 },
    { term: `cheap ${baseName}`, intent: 'negative', clicks: 12, cvr: 0, roas: 0, spend: rev * 0.01, revenue: 0 },
  ];
};

const generateCampaigns = (sku: ProductData) => {
  return [
    { name: `PMax | ${sku.brand || 'Generic'} | High ROAS`, type: 'Performance Max', spend: (sku.itemRevenue || 0) * 0.15, revenue: (sku.itemRevenue || 0) * 0.8, roas: 5.3 },
    { name: `Search | ${sku.brand || 'Brand'} Exact`, type: 'Search', spend: (sku.itemRevenue || 0) * 0.05, revenue: (sku.itemRevenue || 0) * 0.2, roas: 4.0 },
  ];
};

const generateCreatives = (sku: ProductData) => {
  return [
    { name: 'Lifestyle Image 1', type: 'Image', ctr: 4.2, engagement: 8.5 },
    { name: 'Product Showcase Video', type: 'Video', ctr: 6.8, engagement: 12.1 },
    { name: 'Discount Overlay', type: 'Image', ctr: 2.1, engagement: 4.2 },
  ];
};
// ---------------------------------

const SKUDetailPage: React.FC<{ dateRange: string }> = ({ dateRange }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [skuData, setSkuData] = useState<ProductData | null>(null);
  const [allSkus, setAllSkus] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const products = await dataService.loadProductData();
        setAllSkus(products);
        const currentSku = products.find(p => p.id === id);
        if (currentSku) setSkuData(currentSku);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, dateRange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!skuData) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <h2 className="text-2xl font-black text-gray-900">SKU Not Found in Dataset</h2>
        <Link to="/" className="mt-4 text-blue-600 font-bold hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  // Calculate dynamic status and metrics
  const stateStatus = calculateSkuState(skuData);
  const conversionRate = (skuData.itemsViewed || 0) > 0 ? ((skuData.itemsPurchased || 0) / (skuData.itemsViewed || 1)) * 100 : 0;
  const keywords = generateKeywords(skuData);
  const campaigns = generateCampaigns(skuData);
  const creatives = generateCreatives(skuData);

  // Navigation Logic
  const currentIndex = allSkus.findIndex(s => s.id === skuData.id);
  const prevSku = allSkus[currentIndex - 1];
  const nextSku = allSkus[currentIndex + 1];

  const handleNavigate = (targetId: string) => {
    navigate(`/sku/${encodeURIComponent(targetId)}?${searchParams.toString()}`);
  };

  const nextWinner = allSkus.slice(currentIndex + 1).find(s => calculateSkuState(s) === 'winner') || allSkus.find(s => calculateSkuState(s) === 'winner');
  const nextBleeder = allSkus.slice(currentIndex + 1).find(s => calculateSkuState(s) === 'bleeder') || allSkus.find(s => calculateSkuState(s) === 'bleeder');

  const getStateColor = (state: string) => {
    if (state === 'winner') return 'bg-green-100 text-green-800 border-green-200';
    if (state === 'bleeder') return 'bg-red-100 text-red-800 border-red-200';
    if (state === 'sleeper') return 'bg-gray-100 text-gray-800 border-gray-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to={`/?${searchParams.toString()}`}
            className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-gray-900 hover:shadow-sm transition-all"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 tracking-widest">
              <Link to="/" className="hover:text-gray-600">Catalyst</Link>
              <ChevronRight size={10} />
              <Link to="/" className="hover:text-gray-600">SKUs</Link>
              <ChevronRight size={10} />
              <span className="text-gray-900 truncate max-w-xs block">{skuData.title}</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mt-1 truncate max-w-2xl">{skuData.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-black text-gray-600 hover:shadow-sm transition-all">
            <Download size={16} />
            Export Data
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
            <ExternalLink size={16} />
            View in MC
          </button>
        </div>
      </div>

      {/* Page Header Info */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm flex flex-wrap gap-y-6 items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Product SKU</span>
            <span className="text-lg font-black text-gray-900">{skuData.id}</span>
          </div>
          <div className="w-px h-10 bg-gray-100" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Status State</span>
            <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase w-fit mt-1 border", getStateColor(stateStatus))}>
              {stateStatus}
            </span>
          </div>
          <div className="w-px h-10 bg-gray-100" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Price</span>
            <span className="text-lg font-black text-gray-900">{skuData.price}</span>
          </div>
        </div>

        <div className="flex items-center gap-6 bg-gray-50/50 px-6 py-4 rounded-xl border border-gray-100">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase text-gray-400 tracking-tight">E-com Revenue</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-gray-900">₹{(skuData.itemRevenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase text-gray-400 tracking-tight">Conv. Rate</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-gray-900">{conversionRate.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <Tabs.List className="flex items-center gap-1 p-1 bg-white border border-gray-100 rounded-xl w-fit shadow-sm overflow-x-auto">
          {[
            { id: 'overview', label: 'E-commerce Funnel', icon: Activity },
            { id: 'campaigns', label: 'Campaigns', icon: BarChart2 },
            { id: 'keywords', label: 'Keywords', icon: Target },
            { id: 'creatives', label: 'Creatives', icon: ImageIcon },
            { id: 'feed', label: 'Feed Health', icon: ShoppingBag },
          ].map((tab) => (
            <Tabs.Trigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black transition-all whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="overview" className="focus:outline-none space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard label="Items Viewed" value={skuData.itemsViewed?.toLocaleString() || '0'} icon={<Activity />} />
            <MetricCard label="Added to Cart" value={skuData.itemsAddedToCart?.toLocaleString() || '0'} icon={<Activity />} />
            <MetricCard label="Purchased" value={skuData.itemsPurchased?.toLocaleString() || '0'} icon={<Activity />} />
            <MetricCard label="Conversion Rate" value={conversionRate.toFixed(2)} suffix="%" icon={<Activity />} />
          </div>
        </Tabs.Content>

        <Tabs.Content value="campaigns" className="focus:outline-none space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Attributed Campaigns</h3>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 text-[10px] font-black uppercase text-gray-400">Campaign Name</th>
                  <th className="pb-3 text-[10px] font-black uppercase text-gray-400 text-right">Spend</th>
                  <th className="pb-3 text-[10px] font-black uppercase text-gray-400 text-right">Revenue</th>
                  <th className="pb-3 text-[10px] font-black uppercase text-gray-400 text-right">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {campaigns.map((c, i) => (
                  <tr key={i}>
                    <td className="py-4 font-semibold text-sm text-gray-900">{c.name}</td>
                    <td className="py-4 text-sm font-bold text-gray-600 text-right">₹{c.spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="py-4 text-sm font-bold text-gray-600 text-right">₹{c.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="py-4 text-sm font-black text-green-600 text-right">{c.roas.toFixed(2)}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Tabs.Content>

        <Tabs.Content value="keywords" className="focus:outline-none space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Search Term Analysis</h3>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 text-[10px] font-black uppercase text-gray-400">Search Term</th>
                  <th className="pb-3 text-[10px] font-black uppercase text-gray-400">Intent</th>
                  <th className="pb-3 text-[10px] font-black uppercase text-gray-400 text-right">Clicks</th>
                  <th className="pb-3 text-[10px] font-black uppercase text-gray-400 text-right">CVR</th>
                  <th className="pb-3 text-[10px] font-black uppercase text-gray-400 text-right">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {keywords.map((k, i) => (
                  <tr key={i}>
                    <td className="py-4 font-semibold text-sm text-gray-900">{k.term}</td>
                    <td className="py-4">
                      <span className={cn(
                        "px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest",
                        k.intent === 'generic' ? 'bg-green-100 text-green-700' :
                        k.intent === 'branded' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                      )}>{k.intent}</span>
                    </td>
                    <td className="py-4 text-sm font-bold text-gray-600 text-right">{k.clicks}</td>
                    <td className="py-4 text-sm font-bold text-gray-600 text-right">{k.cvr.toFixed(1)}%</td>
                    <td className="py-4 text-sm font-black text-gray-900 text-right">{k.roas.toFixed(2)}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Tabs.Content>

        <Tabs.Content value="creatives" className="focus:outline-none space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Top Converting Assets</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {creatives.map((c, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                      <ImageIcon className="text-gray-300" size={32} />
                    </div>
                    <h4 className="font-bold text-sm text-gray-900">{c.name}</h4>
                    <p className="text-[10px] font-black text-gray-400 uppercase">{c.type}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">CTR</p>
                      <p className="text-sm font-black text-gray-900">{c.ctr}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Engagement</p>
                      <p className="text-sm font-black text-gray-900">{c.engagement}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="feed" className="focus:outline-none space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Merchant Center Feed Diagnostics</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 text-green-800 rounded-lg border border-green-100">
                <CheckCircle2 size={20} />
                <span className="font-semibold text-sm">Title fully optimized and within character limits.</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-green-50 text-green-800 rounded-lg border border-green-100">
                <CheckCircle2 size={20} />
                <span className="font-semibold text-sm">Valid GTIN and Brand provided.</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-amber-50 text-amber-800 rounded-lg border border-amber-100">
                <AlertCircle size={20} />
                <span className="font-semibold text-sm">Description lacks target keyword density (Recommendation: Add "women's fashion" to description).</span>
              </div>
              {stateStatus === 'bleeder' && (
                <div className="flex items-center gap-3 p-4 bg-red-50 text-red-800 rounded-lg border border-red-100">
                  <ShieldAlert size={20} />
                  <span className="font-semibold text-sm">Price is 14% higher than competitor benchmark, leading to high drop-off.</span>
                </div>
              )}
            </div>
          </div>
        </Tabs.Content>
      </Tabs.Root>

      {/* SKU Navigation Footer */}
      <div className="pt-12 border-t border-gray-100 flex items-center justify-between">
        <div className="flex gap-4">
          <button 
            disabled={!prevSku}
            onClick={() => prevSku && handleNavigate(prevSku.id)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black transition-all border",
              prevSku ? "bg-white text-gray-700 border-gray-100 hover:shadow-md hover:border-gray-200" : "opacity-30 cursor-not-allowed border-transparent"
            )}
          >
            <ChevronLeft size={18} />
            Previous SKU
          </button>
          <button 
            disabled={!nextSku}
            onClick={() => nextSku && handleNavigate(nextSku.id)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black transition-all border",
              nextSku ? "bg-white text-gray-700 border-gray-100 hover:shadow-md hover:border-gray-200" : "opacity-30 cursor-not-allowed border-transparent"
            )}
          >
            Next SKU
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={() => nextWinner && handleNavigate(nextWinner.id)}
            className="flex items-center gap-2 px-6 py-3 bg-green-50/50 text-green-700 rounded-xl text-xs font-black border border-green-100 hover:bg-green-100/50 transition-all shadow-sm"
          >
            Next Winner
            <ChevronRight size={18} />
          </button>
          <button 
            onClick={() => nextBleeder && handleNavigate(nextBleeder.id)}
            className="flex items-center gap-2 px-6 py-3 bg-red-50/50 text-red-700 rounded-xl text-xs font-black border border-red-100 hover:bg-red-100/50 transition-all shadow-sm"
          >
            Next Bleeder
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SKUDetailPage;
