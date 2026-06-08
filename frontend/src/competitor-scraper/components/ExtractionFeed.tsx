import React, { useRef, useEffect } from 'react';
import type { ExtractionFeedItem } from '../types/scraper.types';

const FORMAT_COLORS: Record<string, { bg: string; text: string }> = {
  image:     { bg: '#f5f3ff', text: '#7c3aed' },
  video:     { bg: '#f0fdf4', text: '#059669' },
  carousel:  { bg: '#fffbeb', text: '#d97706' },
  responsive:{ bg: '#eff6ff', text: '#2563eb' },
  text:      { bg: '#f8fafc', text: '#64748b' },
  unknown:   { bg: '#f8fafc', text: '#94a3b8' },
};

interface ExtractionFeedProps { items: ExtractionFeedItem[]; }

export const ExtractionFeed: React.FC<ExtractionFeedProps> = ({ items }) => {
  const feedRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (feedRef.current) feedRef.current.scrollTop = 0; }, [items.length]);

  if (!items.length) {
    return (
      <div className="scraper-glass p-6 flex flex-col items-center justify-center h-48 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-blue-500 animate-spin" />
        <p className="text-gray-400 text-sm font-bold">Connecting to scraper...</p>
        <p className="text-gray-300 text-[10px] font-bold uppercase tracking-widest">Waiting for tiles to scan</p>
      </div>
    );
  }

  const processingCount = items.filter(i => i.status === 'processing').length;
  const completeCount = items.filter(i => i.status === 'complete').length;

  return (
    <div className="scraper-glass p-4 space-y-2">
      <div className="flex items-center justify-between px-2 mb-3">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Live Feed</h3>
        <div className="flex items-center gap-2">
          {processingCount > 0 && (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
              {processingCount} scanning
            </span>
          )}
          {completeCount > 0 && (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
              {completeCount} extracted
            </span>
          )}
        </div>
      </div>
      <div ref={feedRef} className="space-y-1.5 max-h-64 overflow-y-auto pr-1"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}>
        {items.map((item) => {
          const style = FORMAT_COLORS[item.assetType] || FORMAT_COLORS.unknown;
          const isScanning = item.status === 'processing';
          return (
            <div key={item.id} className="scraper-feed-item flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-50 bg-gray-50/50">
              <div className="flex-shrink-0">
                {isScanning
                  ? <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  : item.status === 'complete'
                  ? <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  : <div className="w-2 h-2 rounded-full bg-red-400" />}
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={isScanning
                  ? { background: '#fef3c7', color: '#d97706' }
                  : { background: style.bg, color: style.text }}>
                {isScanning ? 'scanning' : item.assetType}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 text-xs font-semibold truncate">{item.headline}</p>
                <p className="text-gray-400 text-[10px] font-bold mt-0.5">
                  {isScanning ? item.cta : `CTA: ${item.cta}`}
                </p>
              </div>
              <span className="text-[10px] text-gray-400 font-bold flex-shrink-0">{item.timestamp}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
