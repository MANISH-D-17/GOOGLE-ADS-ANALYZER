import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { cn } from '../lib/utils';

interface MetricCardProps {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  color?: string;
  icon: React.ReactNode;
  chartData?: { val: number }[];
  className?: string;
  subtitle?: string;
}

const ChartBackground: React.FC<{ data: { val: number }[]; color: string }> = ({ data, color }) => (
  <div className="absolute inset-0 top-1/2 opacity-5 pointer-events-none -mb-4 transition-opacity group-hover:opacity-10">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <Area 
          type="monotone" 
          dataKey="val" 
          stroke={color} 
          fill={color} 
          strokeWidth={2}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

const MetricCard: React.FC<MetricCardProps> = ({ 
  label, value, change, positive, color = '#3b82f6', icon, chartData, className, subtitle 
}) => {
  const internalChartData = chartData || Array.from({ length: 15 }, () => ({ val: 50 + Math.random() * 50 }));

  return (
    <div className={cn(
      "bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between relative overflow-hidden group transition-all hover:shadow-md",
      className
    )}>
      <ChartBackground data={internalChartData} color={color} />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="text-gray-400 group-hover:text-indigo-600 transition-all duration-300">
            {React.cloneElement(icon as React.ReactElement, { size: 14, strokeWidth: 3 })}
          </div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</div>
        </div>
        <div className="text-3xl font-black text-gray-900 mb-2 tracking-tight">{value}</div>
        
        {subtitle ? (
          <div className="text-[11px] text-gray-500 font-bold">{subtitle}</div>
        ) : (
          <div className={cn(
            "flex items-center gap-1.5 text-[11px] font-black uppercase",
            positive ? "text-green-600" : "text-red-600"
          )}>
            {positive ? <TrendingUp size={12} strokeWidth={3} /> : <TrendingDown size={12} strokeWidth={3} />}
            {change}
            <span className="text-gray-400 font-bold ml-0.5">vs prev</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
