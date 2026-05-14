import React, { useEffect, useState } from 'react';
import { dataService } from '../../services/dataService';
import { MetricCard } from '../../components/cards/MetricCard';
import { DollarSign, MousePointerClick, Eye, ShoppingCart, Percent } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const ExecutiveDashboard: React.FC<{ dateRange: string }> = ({ dateRange }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await dataService.getExecutiveSummary();
        setMetrics(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  // Mock trend data for visual purposes
  const mockTrendData = [
    { name: 'Week 1', revenue: 4000, spend: 2400 },
    { name: 'Week 2', revenue: 3000, spend: 1398 },
    { name: 'Week 3', revenue: 2000, spend: 9800 },
    { name: 'Week 4', revenue: 2780, spend: 3908 },
    { name: 'Week 5', revenue: 1890, spend: 4800 },
    { name: 'Week 6', revenue: 2390, spend: 3800 },
    { name: 'Week 7', revenue: 3490, spend: 4300 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executive Overview</h1>
          <p className="text-gray-500 mt-1">High-level business performance across all campaigns.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          label="Total Revenue" 
          value={metrics?.totalRevenue ? metrics.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'} 
          prefix="₹"
          trend={12.5}
          icon={<DollarSign />}
          isLoading={isLoading}
        />
        <MetricCard 
          label="Total Spend" 
          value={metrics?.totalSpend ? metrics.totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'} 
          prefix="₹"
          trend={-5.2}
          icon={<ShoppingCart />}
          isLoading={isLoading}
        />
        <MetricCard 
          label="Total Users" 
          value={metrics?.totalUsers ? metrics.totalUsers.toLocaleString() : '0'} 
          trend={18.4}
          icon={<Percent />}
          isLoading={isLoading}
        />
        <MetricCard 
          label="Page Views" 
          value={metrics?.totalPageViews ? metrics.totalPageViews.toLocaleString() : '0'} 
          trend={2.1}
          icon={<Eye />}
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue vs Spend Trend</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="spend" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorSpend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Funnel Conversion</h3>
          <div className="space-y-6">
            <div className="relative">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-gray-700">Impressions</span>
                <span className="text-gray-500">{metrics?.totalImpressions?.toLocaleString() || '0'}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="bg-blue-100 h-3 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            
            <div className="relative">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-gray-700">Clicks</span>
                <span className="text-gray-500">{metrics?.totalClicks?.toLocaleString() || '0'}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="bg-blue-300 h-3 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
            
            <div className="relative">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-gray-700">Conversions</span>
                <span className="text-gray-500">{metrics?.totalConversions?.toLocaleString() || '0'}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="bg-blue-600 h-3 rounded-full" style={{ width: '20%' }}></div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <h4 className="font-bold text-indigo-900 mb-1">Insight</h4>
            <p className="text-sm text-indigo-700">Conversion rate from click to purchase is currently hovering around {(metrics?.totalClicks > 0 ? (metrics.totalConversions / metrics.totalClicks) * 100 : 0).toFixed(2)}%. Optimizing the checkout flow could yield a 15% uplift in ROAS.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
