import React, { useState, useEffect } from 'react';
import { 
  GMCProduct, 
  RSAAd, 
  editorApiService, 
  RSAHeadline, 
  RSADesc 
} from '../services/editorApiService';
import { ProductEditModal } from '../components/ProductEditModal';
import { ProductCreateModal } from '../components/ProductCreateModal';
import { AdEditorPanel } from '../components/AdEditorPanel';
import { 
  ShoppingBag, 
  Megaphone, 
  RefreshCw, 
  Search, 
  Edit, 
  Package,
  CheckCircle2,
  AlertCircle,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const ProductEditorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'ads'>('products');
  const [products, setProducts] = useState<GMCProduct[]>([]);
  const [ads, setAds] = useState<RSAAd[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<GMCProduct | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [editingAd, setEditingAd] = useState<RSAAd | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'products') loadProducts();
    if (activeTab === 'ads') loadAds();
  }, [activeTab]);

  useEffect(() => {
    if (successMsg || errorMsg) {
      const t = setTimeout(() => {
        setSuccessMsg(null);
        setErrorMsg(null);
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [successMsg, errorMsg]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await editorApiService.listProducts();
      setProducts(data.products || []);
      setErrorMsg(null);
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAds = async () => {
    setLoading(true);
    try {
      const [adsData, campData] = await Promise.all([
        editorApiService.listAds(selectedCampaignId || undefined),
        editorApiService.listCampaigns().catch(() => ({ campaigns: [] })) // Fallback if campaigns fail
      ]);
      setAds(adsData.ads || []);
      setCampaigns(campData.campaigns || []);
      setErrorMsg(null);
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Reload ads when campaign changes
  useEffect(() => {
    if (activeTab === 'ads') {
      loadAds();
    }
  }, [selectedCampaignId]);

  const handleProductSave = async (productId: string, fields: Partial<GMCProduct>) => {
    try {
      await editorApiService.updateProduct(productId, fields);
      setSuccessMsg('Product updated in Merchant Center. Changes reflect within 2–5 minutes.');
      setEditingProduct(null);
      loadProducts();
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const handleProductCreate = async (fields: any) => {
    try {
      await editorApiService.createProduct(fields);
      setSuccessMsg('Product created successfully in Merchant Center! It will appear shortly.');
      setIsCreatingProduct(false);
      loadProducts();
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const handleAdSave = async (adId: string, headlines: RSAHeadline[], descriptions: RSADesc[]) => {
    try {
      await editorApiService.updateAd(adId, headlines, descriptions, editingAd?.finalUrls);
      setSuccessMsg('Ad updated in Google Ads. Changes are live within minutes.');
      setEditingAd(null);
      loadAds();
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.includes(searchQuery);
    const matchAvail = availabilityFilter === 'all' || p.availability === availabilityFilter;
    return matchSearch && matchAvail;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 flex items-center gap-3">
            <Edit className="w-7 h-7 text-indigo-600" />
            Product & Ad Editor
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Edit your Google Merchant Center products and Google Ads campaigns directly.
          </p>
        </div>
        <button
          onClick={activeTab === 'products' ? loadProducts : loadAds}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
        >
          <RefreshCw size={16} className={cn("text-gray-500", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Toasts */}
      <AnimatePresence>
        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-4 rounded-xl flex gap-3 text-sm font-bold shadow-sm">
            <CheckCircle2 size={20} className="text-emerald-500" />
            {successMsg}
          </motion.div>
        )}
        {errorMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-50 text-red-800 border border-red-200 p-4 rounded-xl flex gap-3 text-sm font-bold shadow-sm">
            <AlertCircle size={20} className="text-red-500" />
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-px">
        <button
          onClick={() => setActiveTab('products')}
          className={cn(
            "px-5 py-3 text-sm font-black transition-all flex items-center gap-2 border-b-2",
            activeTab === 'products' ? "border-indigo-600 text-indigo-700" : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300"
          )}
        >
          <ShoppingBag size={18} />
          Merchant Center
        </button>
        <button
          onClick={() => setActiveTab('ads')}
          className={cn(
            "px-5 py-3 text-sm font-black transition-all flex items-center gap-2 border-b-2",
            activeTab === 'ads' ? "border-indigo-600 text-indigo-700" : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300"
          )}
        >
          <Megaphone size={18} />
          Google Ads (RSA)
        </button>
      </div>

      {/* ── PRODUCTS TAB ── */}
      {activeTab === 'products' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text" placeholder="Search by title or ID..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-medium transition-all"
              />
            </div>
            <select
              value={availabilityFilter} onChange={e => setAvailabilityFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none w-48"
            >
              <option value="all">All Availability</option>
              <option value="in stock">In Stock</option>
              <option value="out of stock">Out of Stock</option>
              <option value="preorder">Preorder</option>
            </select>
            <button
              onClick={() => setIsCreatingProduct(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 rounded-xl text-sm font-bold text-white hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
            >
              <Plus size={16} />
              Add Product
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all flex flex-col group">
                <div className="aspect-square bg-gray-50 rounded-xl mb-4 overflow-hidden flex items-center justify-center border border-gray-100/50 p-2">
                  {p.imageLink ? (
                    <img src={p.imageLink} alt={p.title} className="w-full h-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  ) : <Package className="w-12 h-12 text-gray-300" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-2 leading-snug">{p.title}</h3>
                  <p className="text-xs text-gray-400 font-mono mt-1">{p.id.split('~').pop()}</p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="font-black text-gray-800">{p.price.currency} {p.price.value}</span>
                    <Badge className={cn("px-1.5 py-0 text-[9px] w-fit", p.availability === 'in stock' ? "bg-emerald-50 text-emerald-600" : p.availability === 'out of stock' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600")}>
                      {p.availability}
                    </Badge>
                  </div>
                  <button 
                    onClick={() => setEditingProduct(p)}
                    className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {filteredProducts.length === 0 && !loading && (
            <div className="py-20 text-center text-gray-400 font-medium">No products found matching your filters.</div>
          )}
        </motion.div>
      )}

      {/* ── ADS TAB ── */}
      {activeTab === 'ads' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Filter by Campaign</label>
              <select
                value={selectedCampaignId} onChange={e => setSelectedCampaignId(e.target.value)}
                className="w-full max-w-md px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
              >
                <option value="">All Campaigns</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.status})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200">
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Ad Group</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Assets</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Final URL</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ads.map(ad => (
                  <React.Fragment key={ad.id}>
                    <tr className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-gray-900 text-sm">{ad.adGroupName}</div>
                        <div className="text-xs text-gray-400 font-medium mt-0.5">{ad.campaignName}</div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge className={cn(ad.status === 'ENABLED' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600')}>
                          {ad.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-xs font-bold text-gray-600">
                        {ad.headlines.length} Headlines, {ad.descriptions.length} Descriptions
                      </td>
                      <td className="px-5 py-4">
                        <a href={ad.finalUrls[0]} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 font-medium hover:underline max-w-[200px] truncate block">
                          {ad.finalUrls[0]}
                        </a>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setEditingAd(editingAd?.id === ad.id ? null : ad)}
                          className="px-4 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          {editingAd?.id === ad.id ? 'Close' : 'Edit Assets'}
                        </button>
                      </td>
                    </tr>
                    {/* Inline Editor */}
                    <AnimatePresence>
                      {editingAd?.id === ad.id && (
                        <tr>
                          <td colSpan={5} className="p-0 border-none bg-gray-50/50">
                            <AdEditorPanel 
                              ad={ad} 
                              onClose={() => setEditingAd(null)}
                              onSave={handleAdSave}
                            />
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            {ads.length === 0 && !loading && (
              <div className="py-20 text-center text-gray-400 font-medium">No responsive search ads found.</div>
            )}
          </div>
        </motion.div>
      )}

      {/* Modal Portals */}
      {editingProduct && (
        <ProductEditModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={handleProductSave}
        />
      )}
      
      {isCreatingProduct && (
        <ProductCreateModal
          onClose={() => setIsCreatingProduct(false)}
          onCreate={handleProductCreate}
        />
      )}

    </div>
  );
};

const Badge: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold", className)}>
    {children}
  </span>
);
