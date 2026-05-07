import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import { 
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, 
  ArrowLeft, Download, ExternalLink, Activity, Target,
  ImageIcon, ShoppingBag
} from 'lucide-react';
import { SKU } from '../data/mockData';
import { getActualSKUs } from '../data/actualDataLoader';
import { CAMPAIGN_SKU_MAP } from '../data/campaignSkuMap';
import { getSearchTermsForSku } from '../data/searchTerms';
import { getAssetGroupForSku, getCreativeHealthForSku } from '../data/assetGroups';
import { getFeedHealthForSku } from '../data/feedHealth';
import { formatRupees, cn, getStatusColor } from '../lib/utils';

// Tab Components
import OverviewTab from '../components/sku-detail/OverviewTab';
import KeywordsTab from '../components/sku-detail/KeywordsTab';
import CreativesTab from '../components/sku-detail/CreativesTab';
import FeedHealthTab from '../components/sku-detail/FeedHealthTab';

interface SKUDetailPageProps {
  dateRange: string;
}

const SKUDetailPage: React.FC<SKUDetailPageProps> = ({ dateRange }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');

  const allSkus = useMemo(() => getActualSKUs(), []);
  const sku = useMemo(() => allSkus.find(s => s.id === id), [allSkus, id]);
  
  if (!sku) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <h2 className="text-2xl font-black text-gray-900">SKU Not Found</h2>
        <Link to="/" className="mt-4 text-blue-600 font-bold hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  const mapping = CAMPAIGN_SKU_MAP[sku.id] || {
    campaign: 'Performance Max | Generic',
    campaignType: 'Performance Max',
    budget: 1500,
    roas: 2.5,
    optScore: 75,
    listingGroup: 'product_type: All',
    assetGroup: 'Generic Assets'
  };

  const keywordsData = getSearchTermsForSku(sku, mapping);
  const assetGroup = getAssetGroupForSku(sku.id);
  const creativeHealth = getCreativeHealthForSku(sku.id);
  const feedHealth = getFeedHealthForSku(sku.id);

  // Navigation Logic
  const currentIndex = allSkus.findIndex(s => s.id === sku.id);
  const prevSku = allSkus[currentIndex - 1];
  const nextSku = allSkus[currentIndex + 1];

  const handleNavigate = (targetId: string) => {
    navigate(`/sku/${targetId}?${searchParams.toString()}`);
  };

  const nextWinner = allSkus.slice(currentIndex + 1).find(s => s.state === 'winner') || allSkus.find(s => s.state === 'winner');
  const nextBleeder = allSkus.slice(currentIndex + 1).find(s => s.state === 'bleeder') || allSkus.find(s => s.state === 'bleeder');

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
              <span className="text-gray-900">{sku.name}</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mt-1">{sku.name}</h1>
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
            <span className="text-lg font-black text-gray-900">{sku.id}</span>
          </div>
          <div className="w-px h-10 bg-gray-100" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Status State</span>
            <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase w-fit mt-1 border", getStatusColor(sku.state))}>
              {sku.state}
            </span>
          </div>
          <div className="w-px h-10 bg-gray-100" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Category</span>
            <span className="text-lg font-black text-gray-900">{sku.category}</span>
          </div>
          <div className="w-px h-10 bg-gray-100" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Campaign</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-bold text-gray-900">{mapping.campaign}</span>
              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase rounded border border-indigo-100">PMax</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 bg-gray-50/50 px-6 py-4 rounded-xl border border-gray-100">
          {[
            { label: 'Spend', value: formatRupees(sku.spend), pos: false, change: '12%' },
            { label: 'Revenue', value: formatRupees(sku.revenue), pos: true, change: '24%' },
            { label: 'ROAS', value: `${sku.roas.toFixed(2)}x`, pos: sku.roas >= 4, change: '8%' },
            { label: 'Convs', value: sku.conversions, pos: true, change: '15%' },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-gray-400 tracking-tight">{stat.label}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-gray-900">{stat.value}</span>
                <span className={cn("text-[9px] font-black flex items-center gap-0.5 uppercase", stat.pos ? "text-green-600" : "text-red-600")}>
                  {stat.pos ? <TrendingUp size={10} strokeWidth={3} /> : <TrendingDown size={10} strokeWidth={3} />}
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <Tabs.List className="flex items-center gap-1 p-1 bg-white border border-gray-100 rounded-xl w-fit shadow-sm">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'keywords', label: 'Keywords', icon: Target },
            { id: 'creatives', label: 'Creatives', icon: ImageIcon },
            { id: 'feed', label: 'Feed Health', icon: ShoppingBag },
          ].map((tab) => (
            <Tabs.Trigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black transition-all",
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

        <Tabs.Content value="overview" className="focus:outline-none">
          <OverviewTab sku={sku} />
        </Tabs.Content>

        <Tabs.Content value="keywords" className="focus:outline-none">
          <KeywordsTab sku={sku} mapping={mapping} data={keywordsData} />
        </Tabs.Content>

        <Tabs.Content value="creatives" className="focus:outline-none">
          <CreativesTab assetGroup={assetGroup} health={creativeHealth} />
        </Tabs.Content>

        <Tabs.Content value="feed" className="focus:outline-none">
          <FeedHealthTab data={feedHealth} />
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
