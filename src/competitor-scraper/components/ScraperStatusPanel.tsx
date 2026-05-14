import React from 'react';
import type { ScraperSession, ExtractionFeedItem } from '../types/scraper.types';
import { Activity, Image, Video, AlertCircle, Clock } from 'lucide-react';

interface ScraperStatusPanelProps {
  session: ScraperSession | null;
  feedItems: ExtractionFeedItem[];
  isDemoMode: boolean;
}

function StatBadge({ label, value, icon, color }: { label: string; value: number | string; icon: React.ReactNode; color: string }) {
  return (
    <div className="scraper-glass p-4 flex items-center gap-3">
      <div className="p-2 rounded-lg" style={{ background: `${color}18`, color }}>
        {icon}
      </div>
      <div>
        <div className="text-xs text-gray-400 font-bold uppercase tracking-widest">{label}</div>
        <div className="text-xl font-black text-white mt-0.5">{value}</div>
      </div>
    </div>
  );
}

export const ScraperStatusPanel: React.FC<ScraperStatusPanelProps> = ({ session, isDemoMode }) => {
  if (!session) return null;

  const eta = session.progress < 100
    ? `~${Math.ceil((100 - session.progress) * 0.6 / 60)} min`
    : 'Complete';

  return (
    <div className="scraper-glass p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="scraper-pulse-dot" />
          <span className="text-white font-black text-sm uppercase tracking-widest">
            {session.status === 'running' ? 'Scraping in Progress' :
             session.status === 'complete' ? 'Extraction Complete' :
             session.status === 'paused' ? 'Paused' : session.status}
          </span>
          {isDemoMode && (
            <span className="scraper-tag scraper-tag-amber">Demo Mode</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clock size={12} />
          <span className="font-bold">{session.status !== 'complete' ? `ETA: ${eta}` : 'Done'}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400 font-bold">Overall Progress</span>
          <span className="text-xs font-black text-blue-400">{session.progress}%</span>
        </div>
        <div className="scraper-progress-bar">
          <div className="scraper-progress-fill" style={{ width: `${session.progress}%` }} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBadge label="Ads Found" value={session.adsExtracted} icon={<Activity size={16} />} color="#60a5fa" />
        <StatBadge label="Images" value={session.imagesFound} icon={<Image size={16} />} color="#a78bfa" />
        <StatBadge label="Videos" value={session.videosFound} icon={<Video size={16} />} color="#34d399" />
        <StatBadge label="Errors" value={session.errorsCount} icon={<AlertCircle size={16} />} color="#f87171" />
      </div>

      {/* Domain + Region */}
      <div className="flex items-center gap-4 pt-1">
        <div className="text-xs text-gray-500 font-bold">
          Target: <span className="text-blue-400">{session.domain}</span>
        </div>
        <div className="text-xs text-gray-500 font-bold">
          Region: <span className="text-purple-400">{session.region.toUpperCase()}</span>
        </div>
        <div className="text-xs text-gray-500 font-bold">
          Started: <span className="text-gray-300">{new Date(session.startedAt).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};
