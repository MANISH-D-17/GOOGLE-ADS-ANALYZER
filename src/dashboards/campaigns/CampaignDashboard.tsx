import React, { useEffect, useState } from 'react';
import { dataService, CampaignData } from '../../services/dataService';
import { DataTable } from '../../components/tables/DataTable';
import { MetricCard } from '../../components/cards/MetricCard';
import { Target, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { cn } from '../../lib/utils';

export const CampaignDashboard: React.FC<{ dateRange: string }> = ({ dateRange }) => {
  const [data, setData] = useState<CampaignData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeStrategy, setActiveStrategy] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const campaigns = await dataService.loadCampaignData();
        setData(campaigns);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  const activeCampaignsCount = data.filter(c => c['Campaign status']?.toLowerCase() === 'enabled').length;
  const pausedCampaignsCount = data.filter(c => c['Campaign status']?.toLowerCase() === 'paused').length;

  const columns = [
    { key: 'Campaign', label: 'Campaign Name', sortable: true },
    { 
      key: 'Campaign status', 
      label: 'Status', 
      sortable: true,
      render: (val: string) => (
        <span className={cn(
          "px-2.5 py-1 text-xs font-semibold rounded-full flex items-center w-fit gap-1",
          val?.toLowerCase() === 'enabled' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
        )}>
          {val?.toLowerCase() === 'enabled' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
          {val || 'Unknown'}
        </span>
      )
    },
    { key: 'Budget', label: 'Budget (₹)', align: 'right' as const, sortable: true },
    { key: 'Cost', label: 'Spend (₹)', align: 'right' as const, sortable: true },
    { key: 'Impr.', label: 'Impressions', align: 'right' as const, sortable: true },
    { key: 'Clicks', label: 'Clicks', align: 'right' as const, sortable: true },
    { key: 'Conversions', label: 'Conversions', align: 'right' as const, sortable: true },
    { key: 'Conv. value', label: 'Revenue (₹)', align: 'right' as const, sortable: true },
  ];

  const processedData = data.map(campaign => {
    const cost = parseFloat(campaign.Cost?.replace(/,/g, '') || '0');
    const rev = parseFloat(campaign['Conv. value']?.replace(/,/g, '') || '0');
    const roas = cost > 0 ? rev / cost : 0;
    const strategy = roas > 4 ? "Scale" : roas >= 2 ? "Stable" : "Optimize";
    return { ...campaign, roas, strategy };
  });

  const filteredData = processedData.filter(campaign => {
    if (activeStrategy === 'all') return true;
    return campaign.strategy.toLowerCase() === activeStrategy.toLowerCase();
  });

  const filterSlot = (
    <div className="flex items-center p-1 bg-gray-50 border border-gray-100 rounded-xl shadow-inner w-fit">
      {['all', 'Scale', 'Stable', 'Optimize'].map((s) => (
        <button
          key={s}
          onClick={() => setActiveStrategy(s)}
          className={cn(
            "px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all",
            activeStrategy === s 
              ? "bg-gray-900 text-white shadow-md" 
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-200/50"
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Campaign Analytics</h1>
          <p className="text-gray-400 mt-1 font-medium text-sm">Deep dive into individual campaign performance and ROI.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          label="Active Campaigns" 
          value={activeCampaignsCount} 
          icon={<Target />}
          isLoading={isLoading}
        />
        <MetricCard 
          label="Paused Campaigns" 
          value={pausedCampaignsCount} 
          icon={<AlertCircle />}
          isLoading={isLoading}
        />
        <MetricCard 
          label="Avg. Campaign ROAS" 
          value="2.8" 
          suffix="x"
          trend={15}
          icon={<TrendingUp />}
          isLoading={isLoading}
        />
      </div>

      {!isLoading && (
        <div className="mt-8 bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Spend vs Revenue by Strategy</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={[
                  { strategy: 'Scale', Spend: data.filter(c => (parseFloat(c['Conv. value']?.replace(/,/g, '') || '0') / (parseFloat(c.Cost?.replace(/,/g, '') || '1') || 1)) >= 4).reduce((s, c) => s + parseFloat(c.Cost?.replace(/,/g, '') || '0'), 0), Revenue: data.filter(c => (parseFloat(c['Conv. value']?.replace(/,/g, '') || '0') / (parseFloat(c.Cost?.replace(/,/g, '') || '1') || 1)) >= 4).reduce((s, c) => s + parseFloat(c['Conv. value']?.replace(/,/g, '') || '0'), 0) },
                  { strategy: 'Stable', Spend: data.filter(c => { const r = (parseFloat(c['Conv. value']?.replace(/,/g, '') || '0') / (parseFloat(c.Cost?.replace(/,/g, '') || '1') || 1)); return r >= 2 && r < 4; }).reduce((s, c) => s + parseFloat(c.Cost?.replace(/,/g, '') || '0'), 0), Revenue: data.filter(c => { const r = (parseFloat(c['Conv. value']?.replace(/,/g, '') || '0') / (parseFloat(c.Cost?.replace(/,/g, '') || '1') || 1)); return r >= 2 && r < 4; }).reduce((s, c) => s + parseFloat(c['Conv. value']?.replace(/,/g, '') || '0'), 0) },
                  { strategy: 'Optimize', Spend: data.filter(c => (parseFloat(c['Conv. value']?.replace(/,/g, '') || '0') / (parseFloat(c.Cost?.replace(/,/g, '') || '1') || 1)) < 2).reduce((s, c) => s + parseFloat(c.Cost?.replace(/,/g, '') || '0'), 0), Revenue: data.filter(c => (parseFloat(c['Conv. value']?.replace(/,/g, '') || '0') / (parseFloat(c.Cost?.replace(/,/g, '') || '1') || 1)) < 2).reduce((s, c) => s + parseFloat(c['Conv. value']?.replace(/,/g, '') || '0'), 0) },
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="strategy" tick={{fontSize: 10, fill: '#9ca3af', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 10, fill: '#9ca3af'}} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`} />
                <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend wrapperStyle={{fontSize: '12px', fontWeight: 'bold'}} />
                <Area type="monotone" dataKey="Spend" stackId="1" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.8} />
                <Area type="monotone" dataKey="Revenue" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.8} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="mt-8">
        {isLoading ? (
          <div className="h-64 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <DataTable 
            data={filteredData} 
            columns={columns} 
            filterSlot={filterSlot}
          />
        )}
      </div>
    </div>
  );
};
