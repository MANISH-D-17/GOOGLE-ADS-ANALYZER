import React, { useEffect, useState } from 'react';
import { MetricCard } from '../../components/cards/MetricCard';
import { ImageIcon, MousePointerClick, Heart, Eye } from 'lucide-react';
import { DataTable, Column } from '../../components/tables/DataTable';
import { cn } from '../../lib/utils';
import { dataService, CampaignData } from '../../services/dataService';

export const CreativeDashboard: React.FC<{ dateRange: string }> = ({ dateRange }) => {
  const [data, setData] = useState<CampaignData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const columns: Column[] = [
    { key: 'Campaign', label: 'Campaign Asset Group', sortable: true, render: (val: string) => <span className="font-semibold text-gray-900">{val}</span> },
    { key: 'Campaign type', label: 'Type', sortable: true, render: (val: string) => <span className="text-[10px] font-black uppercase text-gray-400 bg-gray-50 px-2 py-1 rounded">{val}</span> },
    { key: 'Clicks', label: 'Clicks', align: 'right', sortable: true },
    { key: 'Impressions', label: 'Impressions', align: 'right', sortable: true },
    { key: 'Cost', label: 'Spend', align: 'right', sortable: true, render: (val: string) => <span className="text-sm font-black text-gray-900">₹{val}</span> },
    { key: 'Conv. value', label: 'Revenue Generated', align: 'right', sortable: true, render: (val: string) => <span className="text-sm font-black text-gray-900">₹{val}</span> },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Creative Analytics</h1>
          <p className="text-gray-500 mt-1">Showing Campaign-level performance as a proxy for Creative performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard 
          label="Avg. Creative CTR" 
          value="0" 
          suffix="%"
          icon={<MousePointerClick />}
          isLoading={isLoading}
        />
        <MetricCard 
          label="Top Format" 
          value="Performance Max" 
          icon={<ImageIcon />}
          isLoading={isLoading}
        />
        <MetricCard 
          label="Avg. Engagement Rate" 
          value="0" 
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

      <div className="mt-8">
        <h3 className="text-lg font-bold text-gray-900 mb-6 px-1">Asset Group Performance Details</h3>
        {isLoading ? (
          <div className="h-64 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <DataTable 
            data={data} 
            columns={columns} 
          />
        )}
      </div>
    </div>
  );
};
