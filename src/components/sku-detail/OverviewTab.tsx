import React, { useMemo } from 'react';
import { 
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip as RechartsTooltip
} from 'recharts';
import { SKU, DEFAULT_SKU_DETAIL } from '../../data/mockData';
import SectionHeader from '../SectionHeader';

interface OverviewTabProps {
  sku: SKU;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ sku }) => {
  const detail = useMemo(() => {
    if (sku.id === 'TB-CAL-BLK-M') return DEFAULT_SKU_DETAIL;
    
    const dailyROAS = Array.from({ length: 30 }, (_, i) => {
      const day = i + 1;
      let base = sku.roas;
      let trend = 0;
      
      if (sku.state === 'winner') trend = (i / 30) * 2;
      if (sku.state === 'bleeder') trend = -(i / 30) * (sku.roas * 0.8);
      if (sku.state === 'sleeper') trend = (Math.random() - 0.5) * 0.5;
      
      return { day, roas: Math.max(0, base + trend + (Math.random() - 0.5) * 0.4) };
    });

    return {
      ...DEFAULT_SKU_DETAIL,
      dailyROAS,
    };
  }, [sku]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <div className="space-y-6">
            <SectionHeader title="Performance Trend" />
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">30D ROAS Trend</h3>
                  <p className="text-sm font-black text-gray-900 mt-1">Performance vs 4.0x target benchmark</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-[10px] font-black text-gray-400 uppercase">Actual ROAS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-100 border border-dashed border-gray-300" />
                    <span className="text-[10px] font-black text-gray-400 uppercase">Target (4.0x)</span>
                  </div>
                </div>
              </div>
              
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={detail.dailyROAS}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                    <XAxis dataKey="day" fontSize={10} fontWeight={900} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                    <YAxis fontSize={10} fontWeight={900} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} domain={[0, 'auto']} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }} 
                    />
                    <Line type="monotone" dataKey="roas" stroke="#3b82f6" strokeWidth={4} dot={false} activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <SectionHeader title="Purchase Funnel" />
              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm h-full">
                <div className="space-y-6">
                  {detail.funnel.map((step, i) => (
                    <div key={i} className="relative">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{step.event.replace('_', ' ')}</span>
                        <span className="text-sm font-black text-gray-900">{step.count.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
                        <div 
                          className="h-full bg-blue-600 transition-all duration-1000" 
                          style={{ width: `${step.pct}%` }} 
                        />
                      </div>
                      {i < detail.funnel.length - 1 && (
                        <div className="text-[9px] font-black text-blue-600 mt-2 flex justify-center uppercase tracking-tighter">
                          ↓ {detail.funnel[i+1].pct}% conversion rate
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <SectionHeader title="Traffic Sources" />
              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm h-full">
                <div className="space-y-6">
                  {detail.trafficSources.map((source, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{source.channel}</span>
                        <span className="text-xs font-black text-gray-900">{source.pct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
                        <div 
                          className="h-full bg-indigo-600" 
                          style={{ width: `${source.pct}%` }} 
                        />
                      </div>
                      <div className="text-[9px] text-gray-400 font-black mt-2 uppercase tracking-tight">
                        {source.sessions.toLocaleString()} sessions
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="space-y-6">
            <SectionHeader title="Scaling Headroom" />
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-[10px] font-black uppercase mb-2 tracking-widest">
                    <span className="text-gray-400">Impression Share</span>
                    <span className="text-blue-600">{detail.scalingHeadroom.is}</span>
                  </div>
                  <div className="h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
                    <div className="h-full bg-blue-600" style={{ width: detail.scalingHeadroom.is }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-red-50/50 rounded-xl border border-red-100/50">
                    <div className="text-[9px] font-black text-red-400 uppercase mb-1 tracking-widest">Lost (Budget)</div>
                    <div className="text-lg font-black text-red-600">{detail.scalingHeadroom.lostBudget}</div>
                  </div>
                  <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100/50">
                    <div className="text-[9px] font-black text-amber-400 uppercase mb-1 tracking-widest">Lost (Rank)</div>
                    <div className="text-lg font-black text-amber-600">{detail.scalingHeadroom.lostRank}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <SectionHeader title="Smart Actions" indicatorColor="bg-blue-600" />
            <div className="bg-gray-900 rounded-xl p-6 text-white shadow-xl">
              <div className="space-y-4">
                {detail.actions.map((act: { title: string; detail: string }, i: number) => (
                  <div key={i} className="flex gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group border border-white/5 hover:border-white/10">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600/30 transition-colors">
                      <ArrowRight size={14} className="text-white/40 group-hover:text-blue-400" strokeWidth={3} />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-black uppercase text-blue-400 tracking-widest">{act.title}</div>
                      <div className="text-xs font-bold text-white/90 leading-relaxed">{act.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-8 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-900/40 uppercase tracking-widest">
                Apply All Optimizations
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
