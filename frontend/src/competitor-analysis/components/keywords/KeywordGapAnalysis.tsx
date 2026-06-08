import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Target, TrendingUp } from 'lucide-react';

interface KeywordGapAnalysisProps {
  gaps: {
    keyword: string;
    my_rank?: number;
    competitor_rank: number;
    search_volume: number;
    opportunity_level: 'high' | 'medium' | 'low';
  }[];
}

const KeywordGapAnalysis: React.FC<KeywordGapAnalysisProps> = ({ gaps }) => {
  return (
    <div className="space-y-4">
      {gaps.map((gap, i) => (
        <motion.div
          key={gap.keyword}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center justify-between p-6 rounded-3xl border border-gray-100 bg-white hover:border-gray-300 transition-all group shadow-sm hover:shadow-xl hover:shadow-gray-200/50"
        >
          <div className="flex items-center gap-6">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
              gap.opportunity_level === 'high' ? 'bg-emerald-50 text-emerald-600' :
              gap.opportunity_level === 'medium' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'
            }`}>
              <Target className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{gap.keyword}</h4>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Monthly Volume:</span>
                <span className="text-[10px] font-black text-gray-900">{gap.search_volume.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-12">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">Your Rank</p>
                <div className="h-8 w-12 flex items-center justify-center rounded-lg bg-gray-50 text-[10px] font-black text-gray-400 border border-gray-100">
                  {gap.my_rank || '-'}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-200" />
              <div className="text-center">
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">Comp. Rank</p>
                <div className="h-8 w-12 flex items-center justify-center rounded-lg bg-blue-50 text-[10px] font-black text-blue-700 border border-blue-100">
                  {gap.competitor_rank}
                </div>
              </div>
            </div>

            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
              gap.opportunity_level === 'high' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' :
              gap.opportunity_level === 'medium' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-100 text-gray-400'
            }`}>
              {gap.opportunity_level} Priority
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default KeywordGapAnalysis;
