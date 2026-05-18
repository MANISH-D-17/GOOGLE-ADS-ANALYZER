import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Maximize2, 
  ExternalLink, 
  Calendar, 
  Palette, 
  Smile,
  Zap,
  Filter,
  CheckCircle2,
  ChevronRight,
  Search,
  Image as ImageIcon
} from 'lucide-react';
import { AdCreative } from '../services/competitorApiService';

interface AdGalleryProps {
  creatives: AdCreative[];
  loading: boolean;
}

const AdGallery: React.FC<AdGalleryProps> = ({ creatives, loading }) => {
  const [selectedAd, setSelectedAd] = useState<AdCreative | null>(null);

  if (loading && creatives.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="aspect-[4/5] animate-pulse rounded-3xl bg-white shadow-sm border border-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Filters bar */}
      <div className="flex flex-wrap items-center justify-between gap-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
            <Filter className="h-4 w-4" />
            Active Filters:
          </div>
          <div className="flex items-center gap-4">
            <select className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-tight text-gray-900 outline-none transition-all focus:border-gray-300">
              <option>All Formats</option>
              <option>Image Ads</option>
              <option>Text Ads</option>
              <option>Video Ads</option>
            </select>
            <select className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-tight text-gray-900 outline-none transition-all focus:border-gray-300">
              <option>All Categories</option>
              <option>Bottomwear</option>
              <option>Ethnic Wear</option>
              <option>Casual Wear</option>
            </select>
          </div>
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
          Syncing {creatives.length} Intel Assets
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {creatives.map((ad, i) => (
          <motion.div
            key={ad.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm transition-all hover:shadow-2xl hover:-translate-y-1"
          >
            {/* Ad Preview Area */}
            <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
              {ad.imageUrls && ad.imageUrls[0] ? (
                <img 
                  src={ad.imageUrls[0]} 
                  alt={ad.headline}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center bg-gray-50">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-gray-900 text-white shadow-xl shadow-gray-200">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-black text-gray-900 leading-tight">{ad.headline}</p>
                  <p className="mt-3 text-xs font-bold text-gray-400 line-clamp-3">{ad.description}</p>
                </div>
              )}
              
              {/* Overlay Actions */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-900/60 opacity-0 backdrop-blur-md transition-all duration-500 group-hover:opacity-100">
                <button 
                  onClick={() => setSelectedAd(ad)}
                  className="flex h-12 w-44 items-center justify-center gap-3 rounded-2xl bg-white text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-2xl transition-all hover:scale-105 active:scale-95"
                >
                  <Maximize2 className="h-4 w-4" />
                  Extract Intel
                </button>
                <a 
                  href={ad.sourceUrl || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex h-12 w-44 items-center justify-center gap-3 rounded-2xl bg-white/10 text-[10px] font-black uppercase tracking-widest text-white shadow-2xl backdrop-blur-xl border border-white/20 transition-all hover:bg-white/20 hover:scale-105 active:scale-95"
                >
                  <ExternalLink className="h-4 w-4" />
                  Source Page
                </a>
              </div>

              {/* Status Badge */}
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-[10px] font-black uppercase tracking-tight text-gray-900 shadow-xl backdrop-blur-md border border-white/50">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Verified Ad
              </div>

              {/* Format Badge */}
              <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900/40 text-white backdrop-blur-md border border-white/10">
                <ImageIcon className="h-4 w-4" />
              </div>
            </div>

            {/* Ad Info */}
            <div className="flex flex-1 flex-col p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">{ad.fashionCategory || 'Bottomwear'}</span>
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-tight">
                  <Calendar className="h-3 w-3" />
                  {ad.firstSeen ? new Date(ad.firstSeen).getFullYear() : '2025'}
                </div>
              </div>
              <h4 className="text-sm font-black text-gray-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">{ad.headline}</h4>
              
              <div className="mt-6 flex items-center justify-between rounded-2xl bg-gray-50 p-4 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gray-900 flex items-center justify-center shadow-lg shadow-gray-200">
                    <span className="text-sm font-black text-white">{Math.round(ad.scores?.composite || 0)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">Intel Score</span>
                  </div>
                </div>
                <div className="flex -space-x-1.5">
                  {ad.dominantColors?.slice(0, 3).map((color, i) => (
                    <div 
                      key={i} 
                      className="h-4 w-4 rounded-full border-2 border-white shadow-sm" 
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedAd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAd(null)}
              className="absolute inset-0 bg-gray-900/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-6xl overflow-hidden rounded-[3rem] bg-white shadow-2xl border border-white/20"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 h-full min-h-[600px]">
                {/* Left: Preview */}
                <div className="relative bg-gray-50 p-12 flex items-center justify-center">
                  {selectedAd.imageUrls && selectedAd.imageUrls[0] ? (
                    <img 
                      src={selectedAd.imageUrls[0]} 
                      alt="Ad Preview" 
                      className="max-h-[700px] w-auto rounded-[2rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)]"
                    />
                  ) : (
                    <div className="text-center p-16 border-4 border-dashed border-gray-200 rounded-[3rem]">
                      <p className="text-gray-400 font-black uppercase tracking-widest">No Visual Assets Found</p>
                    </div>
                  )}
                </div>

                {/* Right: Intel Analysis */}
                <div className="p-12 lg:p-16 flex flex-col">
                  <div className="flex items-center justify-between mb-12">
                    <div>
                      <h3 className="text-3xl font-black text-gray-900 tracking-tighter leading-none">{selectedAd.headline}</h3>
                      <p className="mt-3 text-[10px] font-black uppercase tracking-[4px] text-blue-600">{selectedAd.domain}</p>
                    </div>
                    <div className="flex h-20 w-20 flex-col items-center justify-center rounded-[1.5rem] bg-gray-900 text-white shadow-2xl shadow-gray-400">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Score</p>
                      <p className="text-3xl font-black">{Math.round(selectedAd.scores?.composite || 0)}</p>
                    </div>
                  </div>

                  <div className="space-y-10 flex-1 overflow-y-auto pr-4 custom-scrollbar">
                    {/* Scores Grid */}
                    <div className="grid grid-cols-2 gap-6">
                      {[
                        { label: 'CTA Strength', val: selectedAd.scores?.cta, icon: Zap, color: 'amber' },
                        { label: 'Emotional Impact', val: selectedAd.scores?.emotional, icon: Smile, color: 'emerald' },
                        { label: 'Visual Quality', val: selectedAd.scores?.visual, icon: Palette, color: 'indigo' },
                        { label: 'Keyword Strength', val: selectedAd.scores?.keyword, icon: Search, color: 'blue' },
                      ].map(s => (
                        <div key={s.label} className="rounded-2xl border border-gray-100 bg-gray-50 p-6 transition-all hover:bg-white hover:shadow-xl group/score">
                          <div className="flex items-center justify-between mb-4">
                            <div className={`p-2 rounded-lg bg-${s.color}-50 text-${s.color}-600 group-hover/score:bg-gray-900 group-hover/score:text-white transition-colors`}>
                              <s.icon className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-black text-gray-900">{Math.round(s.val || 0)}%</span>
                          </div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
                          <div className="mt-4 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden shadow-inner">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${s.val}%` }}
                              className={`h-full bg-gray-900`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Insights List */}
                    <div className="space-y-6">
                      <h5 className="text-[10px] font-black text-gray-900 uppercase tracking-[4px]">AI Psychological Mapping</h5>
                      <div className="space-y-4">
                        {selectedAd.emotionalTriggers?.map((trigger, idx) => (
                          <div key={idx} className="flex items-center gap-5 rounded-2xl bg-gray-50 p-5 border border-gray-50 transition-all hover:border-gray-200 hover:bg-white hover:shadow-lg">
                            <div className="h-3 w-3 rounded-full bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.4)]" />
                            <p className="text-sm font-bold text-gray-600">Uses <span className="font-black text-gray-900 uppercase tracking-tighter mx-1">{trigger}</span> as a primary psychological anchor.</p>
                          </div>
                        ))}
                        <div className="flex items-center gap-5 rounded-2xl bg-gray-50 p-5 border border-gray-50 transition-all hover:border-gray-200 hover:bg-white hover:shadow-lg">
                          <div className="h-3 w-3 rounded-full bg-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.4)]" />
                          <p className="text-sm font-bold text-gray-600">Targeting <span className="font-black text-gray-900 uppercase tracking-tighter mx-1">{selectedAd.fashionCategory || 'Bottomwear'}</span> intent clusters.</p>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-10 border-t border-gray-100 flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-gray-900 text-white shadow-lg">
                          <Palette className="h-5 w-5" />
                        </div>
                        <div className="flex gap-2">
                          {selectedAd.dominantColors?.map((color, i) => (
                            <div key={i} className="h-10 w-10 rounded-xl border-4 border-gray-50 shadow-sm" style={{ backgroundColor: color }} title={color} />
                          ))}
                        </div>
                      </div>
                      <button className="flex h-14 items-center gap-3 rounded-[1.5rem] bg-gray-900 px-8 text-[10px] font-black uppercase tracking-[2px] text-white shadow-2xl shadow-gray-400 transition-all hover:scale-105 active:scale-95">
                        Deep Report
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdGallery;
