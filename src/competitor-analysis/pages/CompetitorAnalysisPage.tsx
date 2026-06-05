import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { 
  BarChart3, 
  Search, 
  Image as ImageIcon, 
  Target, 
  TrendingUp, 
  Brain, 
  Download, 
  RefreshCcw,
  AlertCircle,
  Filter,
  ArrowRight,
  ChevronRight,
  Upload
} from 'lucide-react';
import { useCompetitorData } from '../hooks/useCompetitorData';
import { competitorApiService } from '../services/competitorApiService';
import OverviewMetrics from '../components/OverviewMetrics';
import AdGallery from '../components/AdGallery';
import KeywordIntelligence from '../components/KeywordIntelligence';
import ComparisonEngine from '../components/ComparisonEngine';
import AIRecommendations from '../components/AIRecommendations';
import CampaignTimeline from '../components/CampaignTimeline';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'creative', label: 'Creative Intel', icon: ImageIcon },
  { id: 'keywords', label: 'Keyword Intel', icon: Search },
  { id: 'campaigns', label: 'Campaigns', icon: TrendingUp },
  { id: 'comparison', label: 'Benchmarking', icon: Target },
  { id: 'recommendations', label: 'AI Insights', icon: Brain },
];

const CompetitorAnalysisPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDomain, setSelectedDomain] = useState<string | undefined>(undefined);
  
  // ZIP Import State
  const [imported, setImported] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState(0);

  const { loading, error, overview, keywords, creatives, comparison, recommendations, refetch } = useCompetitorData(selectedDomain);

  const activeCompetitor = overview?.competitors.find(c => c.domain === selectedDomain) || overview?.competitors[0];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.zip')) {
      setImportError('Invalid file type. Please upload a valid .zip competitor export package.');
      return;
    }
    
    setImporting(true);
    setImportError(null);
    setImportProgress(10);
    
    try {
      const interval = setInterval(() => {
        setImportProgress(p => p < 90 ? p + 15 : p);
      }, 150);
      
      const res = await competitorApiService.importZip(file);
      
      clearInterval(interval);
      setImportProgress(100);
      
      setTimeout(() => {
        setSelectedDomain(res.domain);
        setImported(true);
        setImporting(false);
        refetch();
      }, 500);
      
    } catch (err: any) {
      setImporting(false);
      setImportError(err.message || 'Failed to extract, validate or parse the competitor ZIP.');
    }
  };

  // ── Starting Flow: Show ZIP upload dropzone before showing analytics ──
  if (!imported && !selectedDomain) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-8 lg:p-12 bg-[#f8fafc]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="w-full max-w-2xl bg-white border border-gray-100 rounded-[2.5rem] p-12 shadow-xl shadow-gray-200/50 space-y-8 text-center"
        >
          <div className="space-y-4">
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">Import Competitor Intel</h1>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-relaxed mt-2">
              Upload competitor-export.zip package to unzip, validate, and analyze locally.
            </p>
          </div>
          
          <div className="border-2 border-dashed border-gray-200 rounded-3xl p-12 hover:border-gray-950 transition-all duration-300 relative bg-gray-50/50 group">
            <input 
              type="file" 
              accept=".zip" 
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={importing}
            />
            <div className="flex flex-col items-center gap-4">
              <div className="p-5 rounded-2xl bg-white shadow-sm border border-gray-100 text-gray-400 group-hover:bg-gray-900 group-hover:text-white transition-all duration-500">
                <Upload className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-900 uppercase tracking-tight">
                  {importing ? 'Processing Intel ZIP...' : 'Drag & Drop your ZIP here'}
                </p>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">
                  or click to browse files (competitor-export.zip)
                </p>
              </div>
            </div>
          </div>
          
          {importing && (
            <div className="space-y-3">
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <motion.div 
                  className="bg-gray-900 h-full rounded-full" 
                  initial={{ width: 0 }}
                  animate={{ width: `${importProgress}%` }}
                />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Safely extracting ZIP • Verifying media integrity • Computing overlaps ({importProgress}%)
              </p>
            </div>
          )}
          
          {importError && (
            <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-5 text-rose-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-xs font-black uppercase tracking-wide text-left">{importError}</p>
            </div>
          )}
          
          {!importing && overview?.competitors && overview.competitors.length > 0 && (
            <div className="pt-6 border-t border-gray-100 space-y-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Or view historical dataset</p>
              <div className="flex justify-center">
                <select 
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDomain(e.target.value);
                      setImported(true);
                    }
                  }}
                  className="h-12 rounded-2xl border border-gray-100 bg-white px-6 text-[10px] font-black uppercase tracking-[2px] shadow-sm focus:outline-none"
                >
                  <option value="">Select Existing Competitor</option>
                  {overview.competitors.map(c => (
                    <option key={c.id} value={c.domain}>{c.brand}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-32 p-8 lg:p-12 bg-[#f8fafc]">
      {/* Header */}
      <div className="flex items-center justify-between gap-6 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Competitor Intelligence</h1>
          <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">Real-time Ad Tracking & AI Benchmarking</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group/select">
            <select 
              value={selectedDomain || ''} 
              onChange={(e) => setSelectedDomain(e.target.value || undefined)}
              className="h-12 rounded-2xl border border-gray-100 bg-white pl-6 pr-12 text-[10px] font-black uppercase tracking-[2px] shadow-sm transition-all focus:border-gray-300 focus:ring-4 focus:ring-gray-100 focus:outline-none appearance-none"
            >
              <option value="">Global Network</option>
              {overview?.competitors.map(c => (
                <option key={c.id} value={c.domain}>{c.brand}</option>
              ))}
            </select>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 rotate-90 pointer-events-none" />
          </div>
          
          <button 
            onClick={() => {
              setImported(false);
              setSelectedDomain(undefined);
            }}
            className="flex h-12 items-center gap-3 rounded-2xl bg-white px-6 text-[10px] font-black uppercase tracking-[2px] shadow-sm border border-gray-100 transition-all hover:bg-gray-50 active:scale-95 text-gray-900"
          >
            <Upload className="h-4 w-4" />
            Import ZIP
          </button>

          <button 
            onClick={() => refetch()}
            className="flex h-12 items-center gap-3 rounded-2xl bg-white px-6 text-[10px] font-black uppercase tracking-[2px] shadow-sm border border-gray-100 transition-all hover:bg-gray-50 active:scale-95 text-gray-900"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Sync Intel
          </button>
          
          <button className="flex h-12 items-center gap-3 rounded-2xl bg-gray-900 px-6 text-[10px] font-black uppercase tracking-[2px] text-white shadow-2xl shadow-gray-200 transition-all hover:bg-black active:scale-95">
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Standardized Tabs */}
      <div className="flex items-center p-2 bg-white border border-gray-100 rounded-[2rem] shadow-xl shadow-gray-200/50 w-fit overflow-x-auto gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[2px] transition-all whitespace-nowrap flex items-center gap-3",
              activeTab === tab.id 
                ? "bg-gray-900 text-white shadow-2xl shadow-gray-400 scale-105" 
                : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-white" : "text-gray-300")} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Brand Comparison Banner — always visible */}
      {overview && activeCompetitor && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Our Brand */}
          <div className="rounded-2xl border-2 border-indigo-100 bg-indigo-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[3px] text-indigo-400">Our Brand</p>
                <h3 className="text-xl font-black text-indigo-900 mt-1">Twin Birds</h3>
              </div>
              <span className="px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200">
                twinbirds.co.in
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'ROAS', value: '2.80×', note: 'Campaign avg' },
                { label: 'Spend', value: '₹49.5L', note: 'Last 30d' },
                { label: 'Revenue', value: '₹138.75L', note: 'Last 30d' },
              ].map(m => (
                <div key={m.label} className="bg-white rounded-xl p-3 border border-indigo-100">
                  <p className="text-[8px] font-black uppercase tracking-widest text-indigo-300">{m.label}</p>
                  <p className="text-lg font-black text-indigo-900 mt-1">{m.value}</p>
                  <p className="text-[8px] text-indigo-400 font-bold">{m.note}</p>
                </div>
              ))}
            </div>
            {/* Gaps */}
            <div className="mt-4 space-y-1">
              <p className="text-[8px] font-black uppercase tracking-widest text-red-400 mb-2">Known gaps</p>
              {['0% product feed approval — Shopping ads not serving',
                'No video assets — zero YouTube/Shorts coverage',
                '3 negative keywords vs ~50+ competitor average'].map(g => (
                <div key={g} className="flex items-start gap-2 text-[10px] text-red-600 font-bold">
                  <span className="mt-0.5 text-red-400 flex-shrink-0">✕</span> {g}
                </div>
              ))}
            </div>
          </div>

          {/* Competitor */}
          <div className="rounded-2xl border-2 border-gray-100 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[3px] text-gray-400">Competitor</p>
                <h3 className="text-xl font-black text-gray-900 mt-1">{activeCompetitor.brand}</h3>
              </div>
              <span className="px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-gray-100 text-gray-700 rounded-full border border-gray-200">
                {activeCompetitor.domain}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Ads Tracked', value: activeCompetitor.totalAds, note: 'Scraped' },
                { label: 'Creative Score', value: `${activeCompetitor.avgScore || 0}%`, note: 'AI rating' },
                { label: 'Keywords', value: activeCompetitor.keywordCount, note: 'Inferred' },
              ].map(m => (
                <div key={m.label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">{m.label}</p>
                  <p className="text-lg font-black text-gray-900 mt-1">{m.value}</p>
                  <p className="text-[8px] text-gray-400 font-bold">{m.note}</p>
                </div>
              ))}
            </div>
            {/* Strengths */}
            <div className="mt-4 space-y-1">
              <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500 mb-2">Observed advantages</p>
              {(activeCompetitor.topKeywords || []).slice(0, 3).map((kw: string) => (
                <div key={kw} className="flex items-start gap-2 text-[10px] text-emerald-700 font-bold">
                  <span className="mt-0.5 text-emerald-400 flex-shrink-0">✓</span> Ranks for "{kw}"
                </div>
              ))}
              {(activeCompetitor.topKeywords || []).length === 0 && (
                <p className="text-[10px] text-gray-400 font-bold">Run a scrape to see keyword data</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <OverviewMetrics overview={overview} activeCompetitor={activeCompetitor} loading={loading} />
          )}
          {activeTab === 'creative' && (
            <AdGallery creatives={creatives} loading={loading} />
          )}
          {activeTab === 'keywords' && (
            <KeywordIntelligence keywords={keywords} loading={loading} domain={selectedDomain} />
          )}
          {activeTab === 'campaigns' && (
            <CampaignTimeline domain={selectedDomain} loading={loading} />
          )}
          {activeTab === 'comparison' && (
            <ComparisonEngine comparison={comparison} loading={loading} />
          )}
          {activeTab === 'recommendations' && (
            <AIRecommendations recommendations={recommendations} loading={loading} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CompetitorAnalysisPage;
