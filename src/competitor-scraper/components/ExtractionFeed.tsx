import React, { useRef, useEffect } from 'react';
import type { ExtractionFeedItem } from '../types/scraper.types';

interface ExtractionFeedProps {
  items: ExtractionFeedItem[];
}

const FORMAT_COLORS: Record<string, string> = {
  image: '#a78bfa',
  video: '#34d399',
  carousel: '#f59e0b',
  responsive: '#60a5fa',
  text: '#94a3b8',
  unknown: '#6b7280',
};

export const ExtractionFeed: React.FC<ExtractionFeedProps> = ({ items }) => {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [items.length]);

  if (!items.length) {
    return (
      <div className="scraper-glass p-6 flex items-center justify-center h-48">
        <p className="text-gray-500 text-sm font-bold">Waiting for extraction to begin...</p>
      </div>
    );
  }

  return (
    <div className="scraper-glass p-4 space-y-2">
      <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 px-2 mb-3">
        Live Extraction Feed
      </h3>
      <div ref={feedRef} className="space-y-2 max-h-64 overflow-y-auto pr-1"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
        {items.map((item) => (
          <div key={item.id} className="scraper-feed-item flex items-center gap-3 px-3 py-2.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            {/* Status indicator */}
            <div className="flex-shrink-0">
              {item.status === 'processing' ? (
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              ) : item.status === 'complete' ? (
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-red-400" />
              )}
            </div>

            {/* Format badge */}
            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
              style={{ background: `${FORMAT_COLORS[item.assetType]}15`, color: FORMAT_COLORS[item.assetType], border: `1px solid ${FORMAT_COLORS[item.assetType]}30` }}>
              {item.assetType}
            </span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{item.headline}</p>
              <p className="text-gray-500 text-[10px] font-bold mt-0.5">CTA: {item.cta}</p>
            </div>

            {/* Timestamp */}
            <span className="text-[10px] text-gray-600 font-bold flex-shrink-0">{item.timestamp}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
