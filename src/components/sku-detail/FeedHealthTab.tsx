import React from 'react';
import { 
  CheckCircle2, AlertCircle, 
  ArrowRight, BarChart3
} from 'lucide-react';
import { FeedHealthData } from '../../data/feedHealth';
import { cn } from '../../lib/utils';
import SectionHeader from '../SectionHeader';

interface FeedHealthTabProps {
  data: FeedHealthData;
}

const FeedHealthTab: React.FC<FeedHealthTabProps> = ({ data }) => {
  const issues = data.attributes.filter(a => a.quality !== 'good');

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Product Feed Status */}
      <div className="space-y-6">
        <SectionHeader title="Feed Diagnostics" />
        <div className={cn(
          "rounded-xl p-8 border flex items-center justify-between shadow-sm relative overflow-hidden",
          data.status === 'active' ? "bg-green-50/30 border-green-100" : "bg-red-50/30 border-red-100"
        )}>
          <div className="flex items-center gap-6 relative z-10">
            <div className={cn(
              "w-16 h-16 rounded-xl flex items-center justify-center shadow-sm",
              data.status === 'active' ? "bg-green-500 text-white" : "bg-red-500 text-white"
            )}>
              {data.status === 'active' ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
            </div>
            <div>
              <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Current Feed Status</div>
              <h3 className={cn(
                "text-3xl font-black tracking-tight",
                data.status === 'active' ? "text-green-600" : "text-red-600"
              )}>
                {data.status === 'active' ? 'APPROVED' : data.status.toUpperCase()}
              </h3>
              <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-tight">Updated 4 hours ago via Content API</p>
            </div>
          </div>
          
          <div className="flex gap-12 relative z-10 border-l border-gray-100 pl-12">
            <div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Issues Found</div>
              <div className="text-2xl font-black text-gray-900">{issues.length}</div>
            </div>
            <div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Health Score</div>
              <div className="text-2xl font-black text-indigo-600">92%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Issue Breakdown */}
        <div className="space-y-6">
          <SectionHeader title="Active Issues" />
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden p-6 space-y-4">
            {issues.length === 0 ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-500">
                  <CheckCircle2 size={24} />
                </div>
                <p className="text-sm font-black text-gray-900">All attributes validated</p>
              </div>
            ) : (
              issues.map((attr, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-gray-50/50 rounded-xl border border-gray-100/50 group hover:bg-white hover:border-red-200 transition-all">
                  <AlertCircle size={18} className={cn("mt-0.5", attr.quality === 'critical' ? "text-red-500" : "text-amber-500")} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-gray-900 tracking-tight">{attr.field.toUpperCase()} Issue</h4>
                      <span className={cn(
                        "text-[9px] font-black uppercase px-2 py-0.5 rounded border",
                        attr.quality === 'critical' ? "bg-red-50 text-red-700 border-red-100" : "bg-amber-50 text-amber-700 border-amber-100"
                      )}>
                        {attr.quality}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-gray-500 mt-1 leading-relaxed">{attr.issue}</p>
                    <button className="mt-3 text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest flex items-center gap-1">
                      Fix in Merchant Center <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Attribute Quality */}
        <div className="space-y-6">
          <SectionHeader title="Attribute Quality" />
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-6">
            {data.attributes.map((attr) => (
              <div key={attr.field} className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight">
                  <span className="text-gray-400">{attr.field}</span>
                  <span className={cn(
                    "font-black",
                    attr.quality === 'good' ? "text-green-600" : attr.quality === 'warning' ? "text-blue-600" : "text-amber-600"
                  )}>{attr.quality === 'good' ? '95%' : attr.quality === 'warning' ? '75%' : '40%'} Health</span>
                </div>
                <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
                  <div 
                    className={cn(
                      "h-full transition-all duration-1000",
                      attr.quality === 'good' ? "bg-green-500" : attr.quality === 'warning' ? "bg-blue-500" : "bg-amber-500"
                    )}
                    style={{ width: attr.quality === 'good' ? '95%' : attr.quality === 'warning' ? '75%' : '40%' }}
                  />
                </div>
              </div>
            ))}

            <div className="mt-8 p-6 bg-indigo-50/50 rounded-xl border border-indigo-100/50 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                  <BarChart3 size={20} strokeWidth={3} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest">Feed Optimization</h4>
                  <p className="text-[10px] font-bold text-indigo-700/70 mt-0.5 uppercase tracking-tight">Unlock 15% more traffic</p>
                </div>
              </div>
              <p className="text-xs font-bold text-indigo-700 leading-relaxed">
                Adding <strong>Product Type</strong> and <strong>Custom Labels</strong> would improve PMax targeting accuracy for this SKU.
              </p>
              <button className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 uppercase tracking-widest">
                Edit Attributes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedHealthTab;
