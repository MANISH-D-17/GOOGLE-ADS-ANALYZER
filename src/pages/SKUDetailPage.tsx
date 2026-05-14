import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, 
  ArrowLeft, Download, ExternalLink, Activity
} from 'lucide-react';
import { dataService, ProductData } from '../services/dataService';
import { formatRupees, cn } from '../lib/utils';
import { MetricCard } from '../components/cards/MetricCard';

const SKUDetailPage: React.FC<{ dateRange: string }> = ({ dateRange }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [skuData, setSkuData] = useState<ProductData | null>(null);
  const [allSkus, setAllSkus] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Navigation Logic
  const currentIndex = allSkus.findIndex(s => s.id === skuData.id);
  const prevSku = allSkus[currentIndex - 1];
  const nextSku = allSkus[currentIndex + 1];

  const handleNavigate = (targetId: string) => {
    navigate(`/sku/${encodeURIComponent(targetId)}?${searchParams.toString()}`);
  };

  const getStatusColor = (availability: string = '') => {
    return availability.toLowerCase().includes('in stock') ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200';
  };

  const conversionRate = (skuData.itemsViewed || 0) > 0 ? ((skuData.itemsPurchased || 0) / (skuData.itemsViewed || 1)) * 100 : 0;

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
              <span className="text-gray-900">{skuData.title}</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mt-1">{skuData.title}</h1>
          </div>
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
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Availability</span>
            <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase w-fit mt-1 border", getStatusColor(skuData.availability))}>
              {skuData.availability || 'Unknown'}
            </span>
          </div>
          <div className="w-px h-10 bg-gray-100" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Price</span>
            <span className="text-lg font-black text-gray-900">{skuData.price}</span>
          </div>
        </div>
      </div>

      {/* Main Content - E-commerce Funnel */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">E-commerce Funnel</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard 
            label="Items Viewed" 
            value={skuData.itemsViewed?.toLocaleString() || '0'} 
            icon={<Activity />}
          />
          <MetricCard 
            label="Added to Cart" 
            value={skuData.itemsAddedToCart?.toLocaleString() || '0'} 
            icon={<Activity />}
          />
          <MetricCard 
            label="Purchased" 
            value={skuData.itemsPurchased?.toLocaleString() || '0'} 
            icon={<Activity />}
          />
          <MetricCard 
            label="Conversion Rate" 
            value={conversionRate.toFixed(2)} 
            suffix="%"
            icon={<Activity />}
          />
        </div>
      </div>

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
      </div>
    </div>
  );
};

export default SKUDetailPage;
