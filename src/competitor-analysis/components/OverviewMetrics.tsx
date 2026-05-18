import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Layers, 
  Target, 
  Zap, 
  TrendingUp, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Brain
} from 'lucide-react';
import { OverviewResponse, CompetitorOverview } from '../services/competitorApiService';

interface OverviewMetricsProps {
  overview: OverviewResponse | null;
  activeCompetitor: CompetitorOverview | undefined;
  loading: boolean;
}

const OverviewMetrics: React.FC<OverviewMetricsProps> = ({ overview, activeCompetitor, loading }) => {
  if (loading && !overview) {
    return <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-32 animate-pulse rounded-3xl bg-white shadow-sm border border-gray-100" />
      ))}
    </div>;
  }

  const stats = [
    { 
      label: 'Total Tracked Ads', 
      value: activeCompetitor?.totalAds || overview?.totalAds || 0, 
      icon: Layers, 
      color: 'blue',
      trend: '+12%',
      trendUp: true
    },
    { 
      label: 'Active Campaigns', 
      value: activeCompetitor?.sessionCount || overview?.totalSessions || 0, 
      icon: Activity, 
      color: 'emerald',
      trend: '+4',
      trendUp: true
    },
    { 
      label: 'Avg Creative Score', 
      value: `${activeCompetitor?.avgScore || 0}%`, 
      icon: Zap, 
      color: 'amber',
      trend: '+2.4%',
      trendUp: true
    },
    { 
      label: 'Keyword Coverage', 
      value: activeCompetitor?.keywordCount || overview?.totalKeywords || 0, 
      icon: Target, 
      color: 'indigo',
      trend: '-2%',
      trendUp: false
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className={`rounded-2xl bg-${stat.color}-50 p-3 text-${stat.color}-600`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-tight ${stat.trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {stat.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {stat.trend}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                <h3 className="mt-1 text-2xl font-black text-gray-900 tracking-tight">{stat.value}</h3>
              </div>
              <div className={`absolute bottom-0 left-0 h-1 w-full bg-${stat.color}-600 opacity-0 transition-opacity group-hover:opacity-100`} />
            </motion.div>
          );
        })}
      </div>

      {/* Main Stats and List */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Competitor Ranking/List */}
        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm lg:col-span-2">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 tracking-tight">Tracked Competitors</h3>
              <p className="text-sm text-gray-500 mt-1">Real-time intelligence from 15+ domains</p>
            </div>
            <button className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700">View Network</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-50 text-[10px] font-black uppercase tracking-[2px] text-gray-400">
                  <th className="pb-4">Competitor</th>
                  <th className="pb-4">Category</th>
                  <th className="pb-4 text-center">Ads Captured</th>
                  <th className="pb-4 text-center">Score Index</th>
                  <th className="pb-4 text-right">Last Intel Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {overview?.competitors.map((comp) => (
                  <tr key={comp.id} className="group transition-colors hover:bg-gray-50/50">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-sm font-black text-white shadow-lg shadow-gray-200">
                          {comp.brand.substring(0, 1)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 leading-tight">{comp.brand}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{comp.domain}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">Bottomwear</span>
                    </td>
                    <td className="py-4 text-center text-sm font-bold text-gray-900">{comp.totalAds}</td>
                    <td className="py-4 text-center">
                      <div className="mx-auto flex h-9 w-16 flex-col items-center justify-center rounded-xl bg-blue-50 border border-blue-100">
                        <span className="text-xs font-black text-blue-600">{comp.avgScore}%</span>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <span className="text-[10px] font-black uppercase tracking-tight text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                        {comp.lastScraped ? new Date(comp.lastScraped).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Small Insight Card */}
        <div className="rounded-3xl border border-gray-900 bg-gray-900 p-8 text-white shadow-2xl shadow-gray-200 flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-blue-600/20 blur-3xl group-hover:bg-blue-600/30 transition-all duration-700" />
          
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <h3 className="mt-8 text-2xl font-black tracking-tight leading-tight">Intelligence Summary</h3>
          <p className="mt-4 text-sm font-medium leading-relaxed text-gray-400">
            Based on our recent analysis, <strong className="text-white font-black">{activeCompetitor?.brand || 'competitors'}</strong> are significantly increasing focus on 
            <span className="text-blue-400 font-bold italic ml-1">ethnic wear</span> and festive collections.
          </p>
          <div className="mt-10 space-y-4 flex-1">
            <div className="flex items-start gap-4 rounded-2xl bg-white/5 p-4 border border-white/5 hover:bg-white/10 transition-colors">
              <Zap className="h-5 w-5 text-amber-400 mt-1" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">New Strategy</p>
                <p className="text-xs font-bold text-white mt-1">7 new ads using "Flat ₹499" framing detected</p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-2xl bg-white/5 p-4 border border-white/5 hover:bg-white/10 transition-colors">
              <Users className="h-5 w-5 text-sky-400 mt-1" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Peak Signal</p>
                <p className="text-xs font-bold text-white mt-1">Visual creative scores up 14% this week</p>
              </div>
            </div>
          </div>
          <button className="mt-10 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-sm font-black text-gray-900 shadow-xl transition-all hover:scale-[1.02] active:scale-95">
            Deep Dive Analysis
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OverviewMetrics;
