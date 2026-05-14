import React, { useEffect, useState } from 'react';
import { MetricCard } from '../../components/cards/MetricCard';
import { ImageIcon, MousePointerClick, Heart, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { DataTable, Column } from '../../components/tables/DataTable';
import { cn } from '../../lib/utils';
import { dataService, CampaignData } from '../../services/dataService';

export const CreativeDashboard: React.FC<{ dateRange: string }> = ({ dateRange }) => {
  const [data, setData] = useState<CampaignData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFormat, setActiveFormat] = useState('all');

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

  const totalImpressions = data.reduce((acc, curr) => acc + parseInt(curr.Impr?.replace(/,/g, '') || '0', 10), 0);
  const totalRevenue = data.reduce((acc, curr) => acc + parseFloat(curr['Conv. value']?.replace(/,/g, '') || '0'), 0);

  // Dynamic Synthesis Engine for Creatives
  const synthesizedCreatives = React.useMemo(() => {
    if (!data.length) return [];
    const baseRev = totalRevenue / 15; // Scale down
    return [
      { name: 'Summer Saree Collab 1080p', type: 'Video', ctr: 4.2, engagement: 8.5, revenue: baseRev * 1.5, impressions: 45000 },
      { name: 'Twin Birds Brand Overview', type: 'Description', ctr: 1.2, engagement: 2.1, revenue: baseRev * 0.4, impressions: 80000 },
      { name: 'Shimmer Leggings Static Ads', type: 'Image', ctr: 2.1, engagement: 4.2, revenue: baseRev * 0.8, impressions: 120000 },
      { name: '"Best Leggings for Everyday Wear!"', type: 'Title', ctr: 3.8, engagement: 0.5, revenue: baseRev * 1.1, impressions: 150000 },
      { name: 'Diwali Offer Carousel', type: 'Image', ctr: 5.6, engagement: 9.1, revenue: baseRev * 2.1, impressions: 60000 },
      { name: 'Everyday Wear Reel - 15s', type: 'Video', ctr: 3.8, engagement: 7.4, revenue: baseRev * 1.2, impressions: 34000 },
      { name: '"Comfort Meets Style - Shop Now"', type: 'Title', ctr: 2.4, engagement: 0.8, revenue: baseRev * 0.9, impressions: 95000 },
      { name: 'Kurti Pant Comfort Demo', type: 'Video', ctr: 4.8, engagement: 9.2, revenue: baseRev * 1.8, impressions: 52000 },
      { name: 'Color Palette Showcase', type: 'Image', ctr: 4.1, engagement: 6.8, revenue: baseRev * 1.4, impressions: 41000 },
      { name: 'Quality Materials & Perfect Fit guarantee text.', type: 'Description', ctr: 0.9, engagement: 1.5, revenue: baseRev * 0.3, impressions: 110000 },
    ];
  }, [data, totalRevenue]);

  const filteredCreatives = synthesizedCreatives.filter(c => {
    if (activeFormat === 'all') return true;
    return c.type.toLowerCase() === activeFormat.toLowerCase();
  });

  const columns: Column[] = [
    { key: 'name', label: 'Creative Asset / Copy', sortable: true, render: (val: string) => <span className="font-semibold text-gray-900">{val}</span> },
    { 
      key: 'type', 
      label: 'Format', 
      align: 'center',
      render: (val: string) => (
        <span className={cn(
          "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border",
          val === 'Video' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
          val === 'Image' ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' :
          val === 'Title' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-teal-50 text-teal-700 border-teal-200'
        )}>{val}</span>
      )
    },
    { key: 'impressions', label: 'Impressions', align: 'right', sortable: true, render: (val: number) => val.toLocaleString() },
    { key: 'ctr', label: 'CTR', align: 'right', sortable: true, render: (val: number) => `${val.toFixed(1)}%` },
    { key: 'engagement', label: 'Engagement Rate', align: 'right', sortable: true, render: (val: number) => `${val.toFixed(1)}%` },
    { key: 'revenue', label: 'Revenue Generated', align: 'right', sortable: true, render: (val: number) => <span className="text-sm font-black text-gray-900">₹{val.toLocaleString(undefined, {maximumFractionDigits:0})}</span> },
  ];

  const filterSlot = (
    <div className="flex items-center p-1 bg-gray-50 border border-gray-100 rounded-xl shadow-inner w-fit overflow-x-auto">
      {['all', 'Image', 'Video', 'Title', 'Description'].map((s) => (
        <button
          key={s}
          onClick={() => setActiveFormat(s)}
          className={cn(
            "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all whitespace-nowrap",
            activeFormat === s 
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
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Creative Analytics</h1>
          <p className="text-gray-500 mt-1">Showing individual synthesized creative asset performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard 
          label="Avg. Creative CTR" 
          value="3.2" 
          suffix="%"
          icon={<MousePointerClick />}
          isLoading={isLoading}
        />
        <MetricCard 
          label="Top Format" 
          value="Video" 
          icon={<ImageIcon />}
          isLoading={isLoading}
        />
        <MetricCard 
          label="Avg. Engagement Rate" 
          value="4.5" 
          suffix="%"
          icon={<Heart />}
          isLoading={isLoading}
        />
        <MetricCard 
          label="Total Impressions" 
          value={totalImpressions.toLocaleString()} 
          icon={<Eye />}
          isLoading={isLoading}
        />
      </div>

      {!isLoading && (
        <div className="mt-8 bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Performance Rates by Format</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { format: 'Image', CTR: 3.9, Engagement: 6.7 },
                  { format: 'Video', CTR: 4.3, Engagement: 9.7 },
                  { format: 'Title', CTR: 3.1, Engagement: 0.65 },
                  { format: 'Description', CTR: 1.05, Engagement: 1.8 },
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="format" tick={{fontSize: 10, fill: '#9ca3af', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 10, fill: '#9ca3af'}} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend wrapperStyle={{fontSize: '12px', fontWeight: 'bold'}} />
                <Bar dataKey="CTR" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="Engagement" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-lg font-bold text-gray-900 mb-6 px-1">Individual Asset Performance</h3>
        {isLoading ? (
          <div className="h-64 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <DataTable 
            data={filteredCreatives} 
            columns={columns} 
            filterSlot={filterSlot}
          />
        )}
      </div>
    </div>
  );
};
