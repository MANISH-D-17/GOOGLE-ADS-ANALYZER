import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  Activity,
  Zap,
  ArrowRight
} from 'lucide-react';

interface CampaignTimelineProps {
  domain?: string;
  loading: boolean;
}

const CampaignTimeline: React.FC<CampaignTimelineProps> = ({ domain, loading }) => {
  if (loading) {
    return <div className="h-96 animate-pulse rounded-3xl bg-white shadow-sm border border-gray-100" />;
  }

  // Mock timeline data based on seasonal patterns
  const timelineData = [
    { month: 'Jan', ads: 12, campaigns: 2, impact: 65 },
    { month: 'Feb', ads: 18, campaigns: 3, impact: 72 },
    { month: 'Mar', ads: 25, campaigns: 4, impact: 85 },
    { month: 'Apr', ads: 15, campaigns: 2, impact: 60 },
    { month: 'May', ads: 30, campaigns: 5, impact: 92 },
    { month: 'Jun', ads: 22, campaigns: 4, impact: 78 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Ad Volume Area Chart */}
      <div className="rounded-3xl border border-gray-100 bg-white p-10 shadow-sm">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tighter">Ad Activity Lifecycle</h3>
            <p className="mt-1 text-sm text-gray-500 font-bold italic">Historical volume and campaign frequency for <strong className="text-blue-600 ml-1">{domain || 'Active Network'}</strong>.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-2 border border-gray-100">
            <button className="rounded-xl bg-white px-5 py-2 text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-xl border border-gray-100">6 Months</button>
            <button className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">1 Year</button>
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="colorAds" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }}
                dy={15}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '20px' }}
              />
              <Area 
                type="monotone" 
                dataKey="ads" 
                stroke="#2563eb" 
                strokeWidth={5}
                fillOpacity={1} 
                fill="url(#colorAds)" 
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Campaign Details Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Identified Campaigns */}
        <div className="rounded-3xl border border-gray-100 bg-white p-10 shadow-sm">
          <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
              <Activity className="h-6 w-6" />
            </div>
            Campaign Clusters
          </h3>
          
          <div className="space-y-4">
            {[
              { name: 'Summer Bottomwear Launch', theme: 'Casual Comfort', ads: 14, status: 'Active', color: 'emerald' },
              { name: 'Festive Ethnic Series', theme: 'Traditional Wear', ads: 9, status: 'Active', color: 'emerald' },
              { name: 'Monsoon Clearance', theme: 'Flash Sale', ads: 5, status: 'Ended', color: 'gray' },
              { name: 'New Arrivals Fall 25', theme: 'Trend Focus', ads: 12, status: 'Draft', color: 'blue' },
            ].map((camp, i) => (
              <div key={i} className="group flex items-center justify-between rounded-[2rem] border border-gray-50 bg-gray-50/50 p-6 transition-all hover:bg-white hover:shadow-2xl hover:border-blue-100">
                <div className="flex items-center gap-5">
                  <div className={`h-12 w-12 flex items-center justify-center rounded-2xl bg-${camp.color}-50 text-${camp.color}-600 group-hover:bg-gray-900 group-hover:text-white transition-all duration-500`}>
                    <Zap className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 text-sm">{camp.name}</h4>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{camp.theme}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-black text-gray-900">{camp.ads} Ads</p>
                  <span className={`text-[10px] font-black uppercase tracking-widest text-${camp.color}-600`}>{camp.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Seasonality Trends */}
        <div className="rounded-3xl border border-gray-100 bg-white p-10 shadow-sm">
          <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
              <Calendar className="h-6 w-6" />
            </div>
            Annual Seasonality
          </h3>
          
          <div className="space-y-8">
            {[
              { season: 'Festive Season (Oct - Dec)', level: 95, color: 'indigo' },
              { season: 'End of Season Sale (Jan - Feb)', level: 82, color: 'blue' },
              { season: 'Summer Collection (Mar - May)', level: 74, color: 'sky' },
              { season: 'Mid-Season (Jun - Sep)', level: 45, color: 'slate' },
            ].map((season, i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-gray-400">{season.season}</span>
                  <span className={`text-${season.color}-600`}>{season.level}% Intensity</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${season.level}%` }}
                    className={`h-full bg-gray-900 shadow-lg`}
                  />
                </div>
              </div>
            ))}
            
            <div className="mt-10 rounded-3xl bg-indigo-900 p-8 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-all duration-700" />
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[3px]">Strategic Insight</p>
              </div>
              <p className="mt-5 text-sm font-bold leading-relaxed text-indigo-100">
                Competitor activity usually peaks <strong className="text-white">14 days prior</strong> to major festivals. Schedule refreshes accordingly.
              </p>
              <button className="mt-8 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white hover:gap-5 transition-all">
                Sync Marketing Calendar
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignTimeline;
