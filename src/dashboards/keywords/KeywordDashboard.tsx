import React, { useEffect, useState } from 'react';
import { dataService, TrafficData } from '../../services/dataService';
import { DataTable } from '../../components/tables/DataTable';
import { MetricCard } from '../../components/cards/MetricCard';
import { Search, Users, Activity, BarChart2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export const KeywordDashboard: React.FC<{ dateRange: string }> = ({ dateRange }) => {
  const [data, setData] = useState<TrafficData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const traffic = await dataService.loadTrafficData();
        setData(traffic);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  const totalSessions = data.reduce((acc, curr) => acc + parseInt(curr.Sessions || '0', 10), 0);
  const totalRevenue = data.reduce((acc, curr) => acc + parseFloat(curr['Total revenue'] || '0'), 0);
  const totalNewUsers = data.reduce((acc, curr) => acc + parseInt(curr['New users'] || '0', 10), 0);

  const columns = [
    { 
      key: 'Session primary channel group (Default channel group)', 
      label: 'Channel Group', 
      sortable: true,
      render: (val: string) => (
        <span className="font-semibold text-gray-900">{val}</span>
      )
    },
    { key: 'Sessions', label: 'Sessions', align: 'right' as const, sortable: true },
    { key: 'New users', label: 'New Users', align: 'right' as const, sortable: true },
    { 
      key: 'Engagement rate', 
      label: 'Engagement Rate', 
      align: 'right' as const, 
      sortable: true,
      render: (val: string) => `${(parseFloat(val || '0') * 100).toFixed(2)}%`
    },
    { 
      key: 'Bounce rate', 
      label: 'Bounce Rate', 
      align: 'right' as const, 
      sortable: true,
      render: (val: string) => `${(parseFloat(val || '0') * 100).toFixed(2)}%`
    },
    { 
      key: 'Total revenue', 
      label: 'Revenue (₹)', 
      align: 'right' as const, 
      sortable: true,
      render: (val: string) => parseFloat(val || '0').toFixed(2)
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Keyword Intelligence</h1>
          <p className="text-gray-400 mt-1 font-medium text-sm">Analyze channel performance and conversion rates directly from the dataset.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          label="Total Sessions" 
          value={totalSessions.toLocaleString()} 
          icon={<Activity />}
          isLoading={isLoading}
        />
        <MetricCard 
          label="New Users Acquired" 
          value={totalNewUsers.toLocaleString()} 
          icon={<Users />}
          isLoading={isLoading}
        />
        <MetricCard 
          label="Revenue from Traffic" 
          value={totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} 
          prefix="₹"
          icon={<BarChart2 />}
          isLoading={isLoading}
        />
      </div>

      <div className="mt-8">
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
