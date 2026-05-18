import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface KeywordVolumeChartProps {
  data: {
    keyword: string;
    volume: number;
    cpc: number;
    competition: number;
  }[];
}

const KeywordVolumeChart: React.FC<KeywordVolumeChartProps> = ({ data }) => {
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          barSize={40}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="keyword" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
            angle={-45}
            textAnchor="end"
            interval={0}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
            tickFormatter={(value) => `${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
          />
          <Tooltip
            cursor={{ fill: '#f8fafc' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{item.keyword}</p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-8">
                        <span className="text-xs font-bold text-gray-600">Monthly Volume</span>
                        <span className="text-xs font-black text-gray-900">{item.volume.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between gap-8">
                        <span className="text-xs font-bold text-gray-600">Est. CPC</span>
                        <span className="text-xs font-black text-blue-600">${item.cpc.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar 
            dataKey="volume" 
            radius={[8, 8, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.volume > 5000 ? '#0f172a' : '#3b82f6'} 
                fillOpacity={0.8 + (entry.volume / Math.max(...data.map(d => d.volume))) * 0.2}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default KeywordVolumeChart;
