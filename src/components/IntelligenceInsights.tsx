import React from 'react';
import { 
  TrendingUp, AlertTriangle, Users, Target, 
  ArrowRight, DollarSign, Activity, Zap
} from 'lucide-react';
import { cn } from '../lib/utils';
import SectionHeader from './SectionHeader';

const IntelligenceInsights: React.FC = () => {
  const insights = [
    {
      title: "GA4 Revenue Discrepancy",
      value: "48% Gap Detected",
      description: "Google Ads reports ₹1.39Cr conversion value while GA4 tracks ₹2.65Cr total revenue. Ensure cross-channel attribution is correctly weighted.",
      type: "warning",
      icon: <AlertTriangle className="text-amber-500" />,
      color: "border-amber-100 bg-amber-50/30"
    },
    {
      title: "LTV Leaderboard",
      value: "Paid Search @ ₹94.92",
      description: "Search users have 7x higher 120-day LTV than PMax (Cross-network) users. Shift budget to Search for high-quality customer acquisition.",
      type: "opportunity",
      icon: <TrendingUp className="text-green-500" />,
      color: "border-green-100 bg-green-50/30"
    },
    {
      title: "Inventory Efficiency",
      value: "13% Ghost Spend",
      description: "527 SKUs are currently out of stock but still receiving impressions in Shopping/PMax. Pausing these could save ₹1.2L/month in wasted spend.",
      type: "critical",
      icon: <Target className="text-red-500" />,
      color: "border-red-100 bg-red-50/30"
    },
    {
      title: "Product Dominance",
      value: "47% Revenue Share",
      description: "Saree Shaper and Kurti Pant categories drive nearly half of total account revenue. Protect these categories with dedicated 'Scalable' bid strategies.",
      type: "info",
      icon: <Zap className="text-indigo-500" />,
      color: "border-indigo-100 bg-indigo-50/30"
    }
  ];

  return (
    <div className="space-y-6">
      <SectionHeader title="Deep Intelligence Insights" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, idx) => (
          <div 
            key={idx} 
            className={cn(
              "p-6 rounded-2xl border shadow-sm flex flex-col gap-4 hover:shadow-md transition-all group",
              insight.color
            )}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                {insight.icon}
              </div>
              <span className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border bg-white shadow-sm",
                insight.type === 'critical' ? "text-red-600 border-red-100" :
                insight.type === 'warning' ? "text-amber-600 border-amber-100" :
                insight.type === 'opportunity' ? "text-green-600 border-green-100" :
                "text-indigo-600 border-indigo-100"
              )}>
                {insight.type}
              </span>
            </div>
            
            <div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Intelligence Signal</div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">{insight.value}</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{insight.title}</p>
            </div>

            <p className="text-xs font-medium text-gray-600 leading-relaxed">
              {insight.description}
            </p>

            <button className="mt-auto flex items-center gap-2 text-[10px] font-black text-gray-900 uppercase tracking-widest hover:gap-3 transition-all">
              Execute Strategy <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntelligenceInsights;
