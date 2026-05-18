import React from 'react';
import { motion } from 'framer-motion';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { 
  Target, 
  Shield, 
  AlertTriangle, 
  Lightbulb, 
  TrendingUp,
  Zap,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Info
} from 'lucide-react';
import { BenchmarkReport } from '../services/competitorApiService';

interface ComparisonEngineProps {
  comparison: BenchmarkReport | null;
  loading: boolean;
}

const ComparisonEngine: React.FC<ComparisonEngineProps> = ({ comparison, loading }) => {
  if (loading && !comparison) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-[400px] animate-pulse rounded-2xl bg-white shadow-sm border border-slate-100" />
        <div className="h-[400px] animate-pulse rounded-2xl bg-white shadow-sm border border-slate-100" />
      </div>
    );
  }

  const b = comparison?.benchmark;
  const c = comparison?.competitor;
  
  const radarData = [
    { subject: 'CTR', A: b?.myCTR || 0, B: b?.competitorCTR || 0, fullMark: 10 },
    { subject: 'Creative', A: b?.myCreativeScore || 0, B: b?.competitorCreativeScore || 0, fullMark: 100 },
    { subject: 'CPC', A: (b?.myCPC || 0) * 5, B: (b?.competitorCPC || 0) * 5, fullMark: 100 },
    { subject: 'Keywords', A: b?.myKeywordCount || 0, B: b?.competitorKeywordCount || 0, fullMark: 100 },
    { subject: 'ROAS', A: (b?.myROAS || 0) * 10, B: 35, fullMark: 100 },
  ];

  const groupedBarData = [
    { metric: 'CTR %', mine: b?.myCTR || 0, competitor: b?.competitorCTR || 0 },
    { metric: 'Creative Score', mine: b?.myCreativeScore || 0, competitor: b?.competitorCreativeScore || 0 },
    { metric: 'CPC (Scaled)', mine: (b?.myCPC || 0) * 10, competitor: (b?.competitorCPC || 0) * 10 },
    { metric: 'Keywords', mine: b?.myKeywordCount || 0, competitor: b?.competitorKeywordCount || 0 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Graphical Side-by-Side Comparison */}
      <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Graphical Comparison</h3>
            <p className="text-sm text-gray-500 mt-1">Side-by-side performance benchmarking vs {c?.brand || 'Competitor'}</p>
          </div>
          <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-600" />
              <span className="text-[10px] font-black uppercase tracking-tight text-gray-600">Twin Birds</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gray-400" />
              <span className="text-[10px] font-black uppercase tracking-tight text-gray-600">{c?.brand || 'Competitor'}</span>
            </div>
          </div>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={groupedBarData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="metric" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                dy={10}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xl">
                        <p className="text-xs font-black text-gray-900 mb-2 uppercase tracking-widest">{payload[0].payload.metric}</p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-8">
                            <span className="text-[10px] font-bold text-blue-600">Twin Birds</span>
                            <span className="text-sm font-black text-gray-900">{payload[0].value}</span>
                          </div>
                          <div className="flex items-center justify-between gap-8">
                            <span className="text-[10px] font-bold text-gray-400">{c?.brand || 'Competitor'}</span>
                            <span className="text-sm font-black text-gray-900">{payload[1].value}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="mine" 
                fill="#2563eb" 
                radius={[6, 6, 0, 0]} 
                barSize={32}
                animationDuration={1500}
              />
              <Bar 
                dataKey="competitor" 
                fill="#94a3b8" 
                radius={[6, 6, 0, 0]} 
                barSize={32}
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Radar Comparison */}
        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className="mb-8 flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Competitive Radar</h3>
            <div className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 border border-blue-100">
              Intel View
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                <Radar
                  name="Twin Birds"
                  dataKey="A"
                  stroke="#2563eb"
                  fill="#2563eb"
                  fillOpacity={0.15}
                  strokeWidth={3}
                />
                <Radar
                  name="Competitor"
                  dataKey="B"
                  stroke="#94a3b8"
                  fill="#94a3b8"
                  fillOpacity={0.1}
                  strokeWidth={3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Overall Benchmark Score */}
        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm flex flex-col items-center justify-center">
          <div className="text-center mb-10">
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Market Health Index</h3>
            <p className="text-sm text-gray-500 mt-1">Aggregated strength vs {c?.brand || 'Competitor'}</p>
          </div>
          
          <div className="relative flex h-48 w-48 items-center justify-center rounded-full border-[12px] border-slate-50">
            <div className="text-center">
              <p className="text-5xl font-black text-gray-900 tracking-tighter">{Math.round(b?.overallScore || 0)}</p>
              <p className="text-[10px] font-black uppercase tracking-[3px] text-gray-400 mt-1">INDEX</p>
            </div>
            <svg className="absolute inset-0 h-48 w-48 -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="84"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                strokeDasharray={`${(b?.overallScore || 0) * 5.27}, 527`}
                className="text-blue-600"
              />
            </svg>
          </div>
          
          <div className="mt-10 w-full grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <p className="text-[10px] font-black uppercase tracking-tight text-gray-400 mb-1">My ROAS</p>
              <p className="text-xl font-black text-gray-900">{b?.myROAS}x</p>
            </div>
            <div className="flex flex-col items-center p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <p className="text-[10px] font-black uppercase tracking-tight text-gray-400 mb-1">Keywords</p>
              <p className="text-xl font-black text-gray-900">+{b?.competitorKeywordCount}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* SWOT Analysis */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Strengths', list: b?.strengths, icon: CheckCircle2, color: 'emerald', bg: 'bg-emerald-50' },
          { label: 'Weaknesses', list: b?.weaknesses, icon: XCircle, color: 'rose', bg: 'bg-rose-50' },
          { label: 'Opportunities', list: b?.opportunities, icon: Lightbulb, color: 'amber', bg: 'bg-amber-50' },
          { label: 'Threats', list: b?.threats, icon: Shield, color: 'indigo', bg: 'bg-indigo-50' },
        ].map((swot, i) => (
          <motion.div
            key={swot.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className={`rounded-2xl p-6 ${swot.bg} border border-white shadow-sm`}
          >
            <div className="flex items-center gap-3 mb-6">
              <swot.icon className={`h-5 w-5 text-${swot.color}-600`} />
              <h3 className={`text-sm font-black uppercase tracking-widest text-${swot.color}-900`}>{swot.label}</h3>
            </div>
            <ul className="space-y-4">
              {swot.list?.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-${swot.color}-600/30`} />
                  <p className={`text-[11px] font-bold leading-relaxed text-${swot.color}-800/80`}>{item}</p>
                </li>
              ))}
              {(!swot.list || swot.list.length === 0) && (
                <p className="text-[11px] italic text-slate-400">No data detected</p>
              )}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ComparisonEngine;
