import React, { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';
import { ProductData } from '../../../services/dataService';
import { cn } from '../../../lib/utils';
import { Package, TrendingUp } from 'lucide-react';

interface SKUOpportunityMatrixProps {
  products: ProductData[];
}

export const SKUOpportunityMatrix: React.FC<SKUOpportunityMatrixProps> = React.memo(({ products }) => {
  const data = useMemo(() => {
    return products
      .filter(p => p.itemsViewed > 0)
      .map(p => {
        // Mock margin between 15% and 60% based on title length hash for consistency
        const hash = p.title.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        const margin = 15 + (hash % 45);
        
        return {
          id: p.id,
          name: p.title.split('-')[0].trim().substring(0, 30) + '...',
          volume: p.itemsViewed, // proxy for search volume
          margin,
          revenue: p.itemRevenue,
          status: margin > 40 && p.itemsViewed > 1000 ? 'Star' :
                  margin > 40 && p.itemsViewed <= 1000 ? 'Opportunity' :
                  margin <= 40 && p.itemsViewed > 1000 ? 'Volume Driver' : 'Review'
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 50); // Top 50 by revenue
  }, [products]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 max-w-xs">
          <p className="text-xs font-black text-gray-900 uppercase mb-2">{data.name}</p>
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Volume: <span className="font-bold text-gray-900">{data.volume}</span></p>
            <p className="text-xs text-gray-500">Margin: <span className="font-bold text-gray-900">{data.margin}%</span></p>
            <p className="text-xs text-gray-500">Revenue: <span className="font-bold text-gray-900">${data.revenue}</span></p>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-50">
            <span className={cn(
              "px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest",
              data.status === 'Star' ? "bg-emerald-50 text-emerald-600" :
              data.status === 'Opportunity' ? "bg-blue-50 text-blue-600" :
              data.status === 'Volume Driver' ? "bg-amber-50 text-amber-600" :
              "bg-gray-50 text-gray-600"
            )}>
              {data.status}
            </span>
          </div>
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
            <Package className="w-5 h-5 text-indigo-500" />
            SKU Opportunity Matrix
          </h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
            Search Volume vs. Profit Margin Potential
          </p>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-400"></div> Stars</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-400"></div> Opps</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-400"></div> Vol Drivers</div>
        </div>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis 
              type="number" 
              dataKey="volume" 
              name="Search Volume" 
              tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 900 }}
              axisLine={false}
              tickLine={false}
              label={{ value: 'Search Volume (Views)', position: 'bottom', fontSize: 10, fontWeight: 900, fill: '#9ca3af', textAnchor: 'middle' }}
            />
            <YAxis 
              type="number" 
              dataKey="margin" 
              name="Margin" 
              unit="%" 
              tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 900 }}
              axisLine={false}
              tickLine={false}
              label={{ value: 'Estimated Margin %', angle: -90, position: 'left', fontSize: 10, fontWeight: 900, fill: '#9ca3af', textAnchor: 'middle' }}
            />
            <ZAxis type="number" dataKey="revenue" range={[50, 400]} name="Revenue" />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            
            <Scatter name="Stars" data={data.filter(d => d.status === 'Star')} fill="#34d399" />
            <Scatter name="Opportunities" data={data.filter(d => d.status === 'Opportunity')} fill="#60a5fa" />
            <Scatter name="Volume Drivers" data={data.filter(d => d.status === 'Volume Driver')} fill="#fbbf24" />
            <Scatter name="Review" data={data.filter(d => d.status === 'Review')} fill="#9ca3af" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
