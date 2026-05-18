import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  TrendingUp, 
  Target, 
  Zap, 
  Tag,
  ArrowUpRight,
  Filter,
  BarChart3,
  Globe,
  PieChart,
  Split
} from 'lucide-react';
import { KeywordIntel } from '../services/competitorApiService';
import { cn } from '../../lib/utils';

// New Components
import KeywordVolumeChart from './keywords/KeywordVolumeChart';
import KeywordGapAnalysis from './keywords/KeywordGapAnalysis';
import SERPPositionTable from './keywords/SERPPositionTable';
import SearchIntentDistribution from './keywords/SearchIntentDistribution';

interface KeywordIntelligenceProps {
  keywords: KeywordIntel[];
  loading: boolean;
}

const KeywordIntelligence: React.FC<KeywordIntelligenceProps> = ({ keywords, loading }) => {
  const [activeView, setActiveView] = useState<'nlp' | 'volume' | 'serp' | 'gap'>('nlp');

  if (loading && keywords.length === 0) {
    return (
      <div className="space-y-6">
        <div className="h-64 animate-pulse rounded-[2.5rem] bg-white shadow-sm border border-gray-100" />
        <div className="h-96 animate-pulse rounded-[2.5rem] bg-white shadow-sm border border-gray-100" />
      </div>
    );
  }

  // Use real data if available, otherwise show empty state
  const volumeData = keywords.filter(k => k.search_volume !== undefined).map(k => ({
    keyword: k.keyword,
    volume: k.search_volume || 0,
    cpc: k.cpc || 0,
    competition: k.competition_level || 0
  }));

  const gapData = keywords.filter(k => k.is_gap).map(k => ({
    keyword: k.keyword,
    my_rank: k.my_rank,
    competitor_rank: k.competitor_rank || 0,
    search_volume: k.search_volume || 0,
    opportunity_level: k.opportunity_level || 'low'
  }));

  const serpData: any[] = []; // This should come from a separate API call or prop

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Sub-navigation for Keyword Intelligence */}
      <div className="flex items-center gap-2 p-1.5 bg-white border border-gray-100 rounded-3xl w-fit shadow-sm">
        {[
          { id: 'nlp', label: 'NLP Inference', icon: Search },
          { id: 'volume', label: 'Search Volume', icon: BarChart3 },
          { id: 'serp', label: 'SERP Intel', icon: Globe },
          { id: 'gap', label: 'Keyword Gap', icon: Split },
        ].map(view => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id as any)}
            className={cn(
              "px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeView === view.id ? "bg-gray-900 text-white shadow-xl shadow-gray-200" : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <view.icon className="h-3.5 w-3.5" />
            {view.label}
          </button>
        ))}
      </div>

      {activeView === 'nlp' && (
        <>
          {/* Search Intent Distribution */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4 mb-8">
            <div className="lg:col-span-1 rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-[2px] text-gray-400 mb-6">Intent Mix</h3>
                <SearchIntentDistribution data={[
                    { name: 'Commercial', value: keywords.filter(k => k.intent === 'commercial').length, color: '#3b82f6' },
                    { name: 'Transactional', value: keywords.filter(k => k.intent === 'transactional').length, color: '#10b981' },
                    { name: 'Informational', value: keywords.filter(k => k.intent === 'informational').length, color: '#f59e0b' },
                ]} />
            </div>

            <div className="lg:col-span-3 grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { label: 'Commercial Intent', list: keywords.filter(k => k.intent === 'commercial').slice(0, 8), color: 'blue', icon: Zap },
                { label: 'Transactional Intent', list: keywords.filter(k => k.intent === 'transactional').slice(0, 8), color: 'emerald', icon: Target },
                { label: 'Informational Intent', list: keywords.filter(k => k.intent === 'informational').slice(0, 8), color: 'amber', icon: Tag },
              ].map((group, i) => (
                <motion.div
                  key={group.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm"
                >
                  <div className="flex items-center gap-4 mb-8">
                    <div className={`p-3 rounded-2xl bg-${group.color}-50 text-${group.color}-600`}>
                      <group.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-[2px] text-gray-900">{group.label}</h3>
                  </div>
                  <div className="space-y-4">
                    {group.list.map((kw: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className={`h-2 w-2 rounded-full bg-${group.color}-500/20 group-hover:bg-${group.color}-500 transition-all duration-300`} />
                          <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900 transition-colors">{kw.keyword}</span>
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter group-hover:text-gray-600">{kw.frequency}x</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* NLP Table */}
          <div className="rounded-[2.5rem] border border-gray-100 bg-white p-10 shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">NLP Keyword Inference</h3>
                <p className="mt-1 text-xs font-bold text-gray-400 uppercase tracking-widest">Inferred from competitor headlines and landing page patterns.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50 text-[10px] font-black uppercase tracking-[2px] text-gray-400">
                    <th className="pb-6">Keyword Term</th>
                    <th className="pb-6">Search Intent</th>
                    <th className="pb-6 text-center">Frequency</th>
                    <th className="pb-6 text-center">Relevance</th>
                    <th className="pb-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {keywords.map((kw, i) => (
                    <motion.tr key={i} className="group transition-colors hover:bg-gray-50/50">
                      <td className="py-6">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white shadow-lg shadow-gray-200">
                            <Search className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-black text-gray-900 uppercase">{kw.keyword}</span>
                        </div>
                      </td>
                      <td className="py-6">
                        <div className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border ${
                          kw.intent === 'commercial' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          kw.intent === 'transactional' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {kw.intent}
                        </div>
                      </td>
                      <td className="py-6 text-center">
                        <span className="text-[10px] font-black uppercase tracking-tight text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg">
                          {kw.frequency} appearances
                        </span>
                      </td>
                      <td className="py-6 text-center">
                        <div className="mx-auto flex h-10 w-24 flex-col justify-center">
                          <span className="text-[10px] font-black text-gray-900 mb-2">{kw.relevanceScore}/10</span>
                          <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${kw.relevanceScore * 10}%` }}
                              className="h-full bg-gray-900" 
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-6 text-right">
                        <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-gray-400 shadow-sm border border-gray-100 transition-all hover:bg-gray-900 hover:text-white active:scale-95 ml-auto">
                          <ArrowUpRight className="h-4 w-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeView === 'volume' && (
        <div className="rounded-[2.5rem] border border-gray-100 bg-white p-10 shadow-sm">
          <div className="mb-10">
            <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Search Volume Analysis</h3>
            <p className="mt-1 text-xs font-bold text-gray-400 uppercase tracking-widest">Enterprise-grade search volume data from DataForSEO.</p>
          </div>
          <KeywordVolumeChart data={volumeData} />
        </div>
      )}

      {activeView === 'gap' && (
        <div className="rounded-[2.5rem] border border-gray-100 bg-white p-10 shadow-sm">
          <div className="mb-10">
            <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Keyword Gap Analysis</h3>
            <p className="mt-1 text-xs font-bold text-gray-400 uppercase tracking-widest">Identifying keywords where competitors rank but you are missing.</p>
          </div>
          <KeywordGapAnalysis gaps={gapData} />
        </div>
      )}

      {activeView === 'serp' && (
        <div className="rounded-[2.5rem] border border-gray-100 bg-white p-10 shadow-sm">
          <div className="mb-10">
            <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">SERP Intelligence</h3>
            <p className="mt-1 text-xs font-bold text-gray-400 uppercase tracking-widest">Real-time organic search rankings and featured snippet status.</p>
          </div>
          <SERPPositionTable results={serpData} />
        </div>
      )}
    </div>
  );
};

export default KeywordIntelligence;
