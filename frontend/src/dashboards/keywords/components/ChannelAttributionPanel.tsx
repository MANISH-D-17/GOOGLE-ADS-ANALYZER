import React, { useMemo } from 'react';
import { TrafficData } from '../../../services/dataService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { GitMerge } from 'lucide-react';

interface ChannelAttributionPanelProps {
  trafficData: TrafficData[];
}

export const ChannelAttributionPanel: React.FC<ChannelAttributionPanelProps> = React.memo(({ trafficData }) => {
  const chartData = useMemo(() => {
    // Group by channel
    const channels: Record<string, { sessions: number, conversions: number, revenue: number }> = {};
    
    trafficData.forEach(row => {
      let channel = row['Session primary channel group (Default channel group)'] || 'Other';
      if (channel.includes('Organic Search')) channel = 'Organic Search';
      else if (channel.includes('Paid Search')) channel = 'Paid Search';
      else if (channel.includes('Direct')) channel = 'Direct';
      else if (channel.includes('Social')) channel = 'Social';
      else channel = 'Other';

      if (!channels[channel]) {
        channels[channel] = { sessions: 0, conversions: 0, revenue: 0 };
      }
      
      const rev = parseFloat(row['Total revenue'] || '0');
      channels[channel].sessions += parseInt(row.Sessions || '0', 10);
      channels[channel].revenue += rev;
      // Mock conversions based on revenue assuming ~$45 AOV
      channels[channel].conversions += Math.round(rev / 45);
    });

    return Object.entries(channels)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.conversions - a.conversions);
  }, [trafficData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 max-w-xs">
          <p className="text-xs font-black text-gray-900 uppercase mb-2">{label}</p>
          {payload.map((entry: any, i: number) => (
            <div key={i} className="flex justify-between gap-4 text-xs font-bold mb-1">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="text-gray-900">
                {entry.name === 'Revenue' ? `$${entry.value.toFixed(2)}` : entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm col-span-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-purple-500" />
            Channel Attribution
          </h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
            Breakdown of traffic channels by Conversions and Revenue
          </p>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 50, right: 20 }}>
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={120} 
              tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 900 }} 
              axisLine={false} 
              tickLine={false} 
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
            <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
            <Bar dataKey="conversions" name="Conversions" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
            <Bar dataKey="sessions" name="Sessions" stackId="a" fill="#c4b5fd" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
