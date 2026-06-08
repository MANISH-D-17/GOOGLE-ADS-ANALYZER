import React from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  ArrowUpRight, 
  Zap, 
  Target, 
  MessageSquare,
  Sparkles,
  ChevronRight,
  PlusCircle,
  TrendingUp,
  Layout,
  MousePointer2
} from 'lucide-react';
import { AIRecommendation } from '../services/competitorApiService';

interface AIRecommendationsProps {
  recommendations: AIRecommendation[];
  loading: boolean;
}

const AIRecommendations: React.FC<AIRecommendationsProps> = ({ recommendations, loading }) => {
  if (loading && recommendations.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-48 animate-pulse rounded-3xl bg-white shadow-sm border border-gray-100" />
        ))}
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'cta': return MousePointer2;
      case 'creative': return Layout;
      case 'keyword': return Target;
      case 'offer': return Zap;
      case 'headline': return MessageSquare;
      default: return Sparkles;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'rose';
      case 'medium': return 'amber';
      case 'low': return 'blue';
      default: return 'slate';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Hero Stats */}
      <div className="rounded-3xl border border-gray-100 bg-white p-10 shadow-sm">
        <div className="flex items-center gap-6 mb-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-900 text-white shadow-xl shadow-gray-200">
            <Brain className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-gray-900 tracking-tighter">AI Strategy Recommendations</h3>
            <p className="text-gray-500 font-bold italic mt-1">High-impact action items derived from competitor behavior.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-3xl bg-gray-50 p-8 flex items-center justify-between border border-gray-100">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">High Priority</p>
              <p className="text-4xl font-black text-gray-900 mt-2">
                {recommendations.filter(r => r.priority === 'high').length}
              </p>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-rose-50 border-2 border-rose-100 flex items-center justify-center text-rose-600 text-2xl font-black shadow-inner">
              !
            </div>
          </div>
          <div className="rounded-3xl bg-gray-50 p-8 flex items-center justify-between border border-gray-100">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Efficiency Lift</p>
              <p className="text-4xl font-black text-gray-900 mt-2">8.4<span className="text-lg opacity-30">/10</span></p>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
              <TrendingUp className="h-8 w-8" />
            </div>
          </div>
          <div className="rounded-3xl bg-gray-50 p-8 flex items-center justify-between border border-gray-100">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Intel</p>
              <p className="text-4xl font-black text-gray-900 mt-2">{recommendations.length}</p>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-blue-50 border-2 border-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
              <Sparkles className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {recommendations.map((rec, i) => {
          const Icon = getTypeIcon(rec.type);
          const pColor = getPriorityColor(rec.priority);
          
          return (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="group flex flex-col rounded-[2.5rem] border border-gray-100 bg-white p-10 shadow-sm transition-all hover:shadow-2xl hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-8">
                <div className={`p-5 rounded-2xl bg-${pColor}-50 text-${pColor}-600 group-hover:bg-gray-900 group-hover:text-white transition-all duration-500 shadow-sm`}>
                  <Icon className="h-7 w-7" />
                </div>
                <div className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest border ${
                  rec.priority === 'high' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                  rec.priority === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                  'bg-blue-50 text-blue-700 border-blue-100'
                }`}>
                  <div className={`h-2 w-2 rounded-full ${
                    rec.priority === 'high' ? 'bg-rose-600' :
                    rec.priority === 'medium' ? 'bg-amber-600' :
                    'bg-blue-600'
                  } animate-pulse`} />
                  {rec.priority} PRIORITY
                </div>
              </div>

              <h4 className="text-2xl font-black text-gray-900 leading-tight mb-3 group-hover:text-blue-600 transition-colors">{rec.title}</h4>
              <p className="text-sm font-bold text-gray-400 leading-relaxed mb-10">{rec.description}</p>

              <div className="space-y-4 flex-1">
                <p className="text-[10px] font-black text-gray-900 uppercase tracking-[3px] opacity-40">Execution Protocol</p>
                {rec.actionItems.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-50 transition-all group-hover:bg-white group-hover:border-gray-100 group-hover:shadow-md">
                    <PlusCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <p className="text-sm font-black text-gray-700 leading-tight">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 pt-10 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gray-900 flex items-center justify-center shadow-lg shadow-gray-200">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">Est. Impact</span>
                    <span className="text-sm font-black text-gray-900">+{Math.round(rec.impactScore * 100)}% ROI</span>
                  </div>
                </div>
                <button className="flex h-12 items-center gap-3 rounded-2xl bg-gray-900 px-6 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-gray-200 transition-all hover:scale-105 active:scale-95">
                  Execute Intel
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default AIRecommendations;
