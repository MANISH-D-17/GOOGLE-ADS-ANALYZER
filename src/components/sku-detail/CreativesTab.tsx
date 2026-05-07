import React from 'react';
import { 
  AlertCircle, Video, Image as ImageIcon, 
  Type, Layout, ExternalLink, Play, Plus
} from 'lucide-react';
import { AssetGroup, CreativeHealthScore } from '../../data/assetGroups';
import { cn } from '../../lib/utils';
import SectionHeader from '../SectionHeader';

interface CreativesTabProps {
  assetGroup: AssetGroup;
  health: CreativeHealthScore;
}

const performanceColors = {
  BEST:    'bg-green-50 text-green-700 border-green-200',
  GOOD:    'bg-blue-50 text-blue-700 border-blue-200',
  LOW:     'bg-red-50 text-red-700 border-red-200',
  PENDING: 'bg-gray-50 text-gray-500 border-gray-200',
  UNRATED: 'bg-gray-50 text-gray-400 border-gray-100',
};

const CreativesTab: React.FC<CreativesTabProps> = ({ assetGroup, health }) => {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Creative Health Score */}
      <div className="space-y-6">
        <SectionHeader title="Creative Health" />
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Asset Strength</h3>
              <p className="text-sm font-black text-gray-900">Google Ads AI assessment of asset group quality</p>
            </div>
            <div className="text-right">
              <div className={cn(
                "text-4xl font-black tracking-tighter",
                health.overall >= 80 ? "text-green-600" : health.overall >= 50 ? "text-amber-600" : "text-red-600"
              )}>
                {health.overall}%
              </div>
              <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">Strength Score</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {health.breakdown.map((item) => (
              <div key={item.category} className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight">
                  <span className="text-gray-400">{item.category}</span>
                  <span className="text-gray-900">{item.score}/{item.maxScore}</span>
                </div>
                <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
                  <div 
                    className={cn(
                      "h-full transition-all duration-1000",
                      item.status === 'good' ? "bg-green-500" : item.status === 'warning' ? "bg-amber-500" : "bg-red-500"
                    )}
                    style={{ width: `${(item.score / item.maxScore) * 100}%` }}
                  />
                </div>
                {item.issue && (
                  <div className="flex items-start gap-2 mt-2 bg-gray-50/50 p-2 rounded-lg border border-gray-100/50">
                    <AlertCircle size={12} className={cn("mt-0.5 flex-shrink-0", item.status === 'critical' ? "text-red-500" : "text-amber-500")} />
                    <p className="text-[10px] font-bold text-gray-500 leading-tight">{item.issue}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Headlines & Descriptions */}
        <div className="col-span-12 lg:col-span-7 space-y-8">
          <div className="space-y-6">
            <SectionHeader title="Text Assets" />
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
                <div className="flex items-center gap-2">
                  <Type size={16} className="text-blue-600" />
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Headlines ({assetGroup.headlines.length}/15)</h3>
                </div>
                <button className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest">Suggestions</button>
              </div>
              <div className="space-y-3 px-2">
                {assetGroup.headlines.map((asset, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl group hover:shadow-md hover:border-blue-200 transition-all">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded-[4px] text-[8px] font-black border uppercase tracking-widest",
                        performanceColors[asset.performanceLabel as keyof typeof performanceColors]
                      )}>
                        {asset.performanceLabel}
                      </span>
                      <span className="text-sm font-black text-gray-900">{asset.content}</span>
                    </div>
                    {asset.impressions && (
                      <span className="text-[10px] font-black text-gray-400 group-hover:text-gray-600 uppercase tracking-tight">
                        {asset.impressions.toLocaleString()} Impr.
                      </span>
                    )}
                  </div>
                ))}
                {assetGroup.headlines.length < 15 && (
                  <div className="p-4 border-2 border-dashed border-gray-100 rounded-xl flex items-center justify-center gap-2 text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-all cursor-pointer group bg-gray-50/30">
                    <Plus size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Add Headline</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-2 bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
              <Layout size={16} className="text-blue-600" />
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Descriptions ({assetGroup.descriptions.length}/5)</h3>
            </div>
            <div className="space-y-3 px-2">
              {assetGroup.descriptions.map((asset, i) => (
                <div key={i} className="p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded-[4px] text-[8px] font-black border uppercase tracking-widest",
                      performanceColors[asset.performanceLabel as keyof typeof performanceColors]
                    )}>
                      {asset.performanceLabel}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-700 leading-relaxed">{asset.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Media Assets */}
        <div className="col-span-12 lg:col-span-5 space-y-8">
          <div className="space-y-6">
            <SectionHeader title="Media Assets" />
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
                <div className="flex items-center gap-2">
                  <ImageIcon size={16} className="text-blue-600" />
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Images ({assetGroup.images.length}/20)</h3>
                </div>
                {assetGroup.images.length < 5 && <AlertCircle size={16} className="text-red-500" />}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {assetGroup.images.map((asset, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden aspect-square bg-gray-100 border border-gray-200">
                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-400">
                      <ImageIcon size={32} />
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button className="bg-white p-2 rounded-full shadow-lg">
                        <ExternalLink size={16} className="text-gray-900" />
                      </button>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[8px] font-black border uppercase bg-white/90 backdrop-blur-sm shadow-sm",
                        performanceColors[asset.performanceLabel as keyof typeof performanceColors]?.split(' ')[1]
                      )}>
                        {asset.performanceLabel}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="aspect-square border-2 border-dashed border-gray-100 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-all cursor-pointer bg-gray-50/30">
                  <Plus size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Upload</span>
                </div>
              </div>
            </div>
          </div>

          <div className={cn(
            "rounded-xl overflow-hidden shadow-sm border p-6 space-y-6",
            assetGroup.videos.length === 0 ? "bg-red-50/30 border-red-100" : "bg-white border-gray-100"
          )}>
            <div className="flex items-center justify-between bg-white/50 p-4 rounded-xl border border-gray-100/50">
              <div className="flex items-center gap-2">
                <Video size={16} className="text-red-600" />
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Videos ({assetGroup.videos.length}/5)</h3>
              </div>
              {assetGroup.videos.length === 0 && <AlertCircle size={16} className="text-red-600" />}
            </div>
            <div>
              {assetGroup.videos.length === 0 ? (
                <div className="text-center space-y-6 py-6">
                  <div className="w-16 h-16 bg-white rounded-xl shadow-sm border border-red-100 flex items-center justify-center mx-auto text-red-600">
                    <Video size={32} />
                  </div>
                  <div className="space-y-1 px-4">
                    <h4 className="text-sm font-black text-gray-900">No video assets detected</h4>
                    <p className="text-[10px] font-bold text-gray-500 leading-relaxed uppercase tracking-tight">
                      Missing YouTube presence could throttle campaign reach by 30%.
                    </p>
                  </div>
                  <button className="bg-red-600 text-white px-8 py-4 rounded-xl text-[10px] font-black hover:bg-red-700 transition-all shadow-xl shadow-red-200 uppercase tracking-widest">
                    AI Video Generator
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {assetGroup.videos.map((asset, i) => (
                    <div key={i} className="relative group h-32 rounded-xl overflow-hidden bg-gray-900 border border-white/10 shadow-lg">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play size={32} className="text-white/30 group-hover:text-white/80 transition-all group-hover:scale-110" />
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                        <span className="px-2 py-0.5 rounded text-[8px] font-black border uppercase bg-white/90">
                          {asset.performanceLabel}
                        </span>
                        <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">YouTube Shorts</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreativesTab;
