import React from 'react';
import type { ScraperSession, ExtractionFeedItem } from '../types/scraper.types';
import { Activity, Image, Video, AlertCircle, Clock, Search, Zap } from 'lucide-react';

interface ScraperStatusPanelProps {
  session: ScraperSession | null;
  feedItems: ExtractionFeedItem[];
  isDemoMode: boolean;
}

function StatBadge({ label, value, icon, color }: { label: string; value: number | string; icon: React.ReactNode; color: string }) {
  return (
    <div className="scraper-glass p-4 flex items-center gap-3">
      <div className="p-2 rounded-lg" style={{ background: `${color}12`, color }}>
        {icon}
      </div>
      <div>
        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{label}</div>
        <div className="text-xl font-black text-gray-900 mt-0.5">{value}</div>
      </div>
    </div>
  );
}

export const ScraperStatusPanel: React.FC<ScraperStatusPanelProps> = ({ session, isDemoMode }) => {
  if (!session) return null;

  const phase = session.currentPhase || 'init';
  const isScrolling = phase === 'scrolling';
  const isExtracting = phase === 'extracting';

  const phaseLabel = isScrolling
    ? 'Scanning Ad Tiles...'
    : isExtracting
    ? 'Extracting Ad Details'
    : session.status === 'running'
    ? 'Scraping in Progress'
    : session.status === 'complete'
    ? 'Extraction Complete'
    : session.status === 'paused'
    ? 'Stopped — Data Ready'
    : session.status;

  const phaseColor = isScrolling ? '#d97706' : isExtracting ? '#2563eb' : '#111827';
  const eta = session.progress < 100 ? `~${Math.ceil((100 - session.progress) * 0.6 / 60)} min` : 'Complete';

  return (
    <div className="scraper-glass p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="scraper-pulse-dot" style={{ background: phaseColor }} />
          <span className="text-gray-900 font-black text-sm uppercase tracking-widest">
            {phaseLabel}
          </span>
          {isDemoMode && <span className="scraper-tag scraper-tag-amber">Demo Mode</span>}
          {isScrolling && (
            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full"
              style={{ background: '#fef3c712', color: '#d97706', border: '1px solid #fde68a' }}>
              <Search size={10} /> Scanning
            </span>
          )}
          {isExtracting && (
            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full"
              style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
              <Zap size={10} /> Extracting
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 font-bold">
          <Clock size={12} />
          <span>{session.status !== 'complete' ? `ETA: ${eta}` : 'Done'}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
            {isScrolling ? 'Tile Discovery Progress' : isExtracting ? 'Extraction Progress' : 'Overall Progress'}
          </span>
          <span className="text-xs font-black" style={{ color: phaseColor }}>{session.progress}%</span>
        </div>
        <div className="scraper-progress-bar">
          <div className="scraper-progress-fill" style={{ width: `${session.progress}%`, background: phaseColor }} />
        </div>
        {isScrolling && (
          <p className="text-[10px] text-amber-500 font-bold mt-1">
            {session.adsExtracted} ad tiles found — extraction begins after scanning completes
          </p>
        )}
        {isExtracting && (
          <p className="text-[10px] text-blue-500 font-bold mt-1">
            Opening each ad detail page to extract headline, images, and metadata
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBadge label={isScrolling ? 'Tiles Found' : 'Ads Found'} value={session.adsExtracted} icon={<Activity size={15} />} color="#2563eb" />
        <StatBadge label="Images" value={session.imagesFound} icon={<Image size={15} />} color="#7c3aed" />
        <StatBadge label="Videos" value={session.videosFound} icon={<Video size={15} />} color="#059669" />
        <StatBadge label="Errors" value={session.errorsCount} icon={<AlertCircle size={15} />} color="#dc2626" />
      </div>

      {/* Meta info */}
      <div className="flex items-center gap-4 flex-wrap pt-1 border-t border-gray-50">
        <div className="text-xs text-gray-400 font-bold">
          Target: <span className="text-blue-600">{session.domain}</span>
        </div>
        <div className="text-xs text-gray-400 font-bold">
          Region: <span className="text-indigo-600 font-black">{session.region.toUpperCase()}</span>
        </div>
        <div className="text-xs text-gray-400 font-bold">
          Started: <span className="text-gray-600">{new Date(session.startedAt).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

