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
  ChevronRight
} from 'lucide-react';
import { useCompetitorData } from '../hooks/useCompetitorData';
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
  const { loading, error, overview, keywords, creatives, comparison, recommendations, refetch } = useCompetitorData(selectedDomain);

  const activeCompetitor = overview?.competitors.find(c => c.domain === selectedDomain) || overview?.competitors[0];

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
            <KeywordIntelligence keywords={keywords} loading={loading} />
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
