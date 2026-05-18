import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Globe, Play, Square, RotateCcw,
  Wifi, WifiOff, ShoppingBag, Image, Video, Tag, Grid, Zap, BarChart2,
  Trash2, History, ChevronRight, Download
} from 'lucide-react';
import '../styles/scraper.css';
import { useScraperSession } from '../hooks/useScraperSession';
import { ScraperStatusPanel } from '../components/ScraperStatusPanel';
import { ExtractionFeed } from '../components/ExtractionFeed';
import { AssetGallery } from '../components/AssetGallery';
import { KeywordIntelTable } from '../components/KeywordIntelTable';
import { CreativeAnalysisPanel } from '../components/CreativeAnalysisPanel';
import { ExportPanel } from '../components/ExportPanel';
import { competitorApiService } from '../../competitor-analysis/services/competitorApiService';
import { cn } from '../../lib/utils';

const REGIONS = [
  { value: 'IN', label: '🇮🇳 India' },
  { value: 'US', label: '🇺🇸 United States' },
  { value: 'UK', label: '🇬🇧 United Kingdom' },
  { value: 'AU', label: '🇦🇺 Australia' },
  { value: 'SG', label: '🇸🇬 Singapore' },
  { value: 'AE', label: '🇦🇪 UAE' },
];

function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: React.ReactNode; color: string }) {
  return (
    <motion.div whileHover={{ y: -4 }}
      className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm flex flex-col gap-4 transition-all hover:shadow-xl group">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-[2px] text-gray-400">{label}</span>
        <div className="p-3 rounded-2xl bg-gray-50 text-gray-400 group-hover:bg-gray-900 group-hover:text-white transition-all duration-500">
          {icon}
        </div>
      </div>
      <span className="text-4xl font-black text-gray-900 tracking-tighter">{value}</span>
    </motion.div>
  );
}

const CompetitorScraperPage: React.FC = () => {
  const [domain, setDomain] = useState('');
  const [region, setRegion] = useState('IN');
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const {
    status, session, ads, keywords, feedItems, stats,
    backendOnline, isDemoMode,
    startScraping, stopScraping, resetScraper,
  } = useScraperSession();

  const fetchHistory = async () => {
    if (!backendOnline) return;
    setLoadingHistory(true);
    try {
      const data = await competitorApiService.getSnapshots();
      setSnapshots(data.snapshots || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [backendOnline]);

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to delete this session and all its data?')) return;
    try {
      await competitorApiService.deleteSession(sessionId);
      await fetchHistory();
    } catch (err) {
      alert('Failed to delete session');
    }
  };

  const handleStart = async () => {
    if (!domain.trim()) return;
    const cleanDomain = domain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    await startScraping(cleanDomain, region);
  };

  const isRunning = status === 'running';
  const hasResults = ads.length > 0;

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-32 p-8 lg:p-12 bg-[#f8fafc]">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Ad Intelligence Scraper</h1>
          <p className="text-sm font-bold text-gray-400 mt-2 uppercase tracking-widest">
            Extract & Store competitor strategies from Transparency Center
          </p>
        </div>
        <div className={cn(
          "flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] shadow-sm border transition-all",
          backendOnline ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
        )}>
          {backendOnline ? <Wifi size={14} className="animate-pulse" /> : <WifiOff size={14} />}
          {backendOnline ? 'Cloud Node Online' : 'Local Sandbox Mode'}
        </div>
      </div>

      {/* ── URL Input Section ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="rounded-[2.5rem] border border-gray-100 bg-white p-12 shadow-xl shadow-gray-200/50 space-y-8">
        <h2 className="text-[10px] font-black uppercase tracking-[4px] text-gray-400">Target Intel Protocol</h2>
        <div className="flex flex-col md:flex-row gap-5">
          <div className="flex-1 relative">
            <Globe size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !isRunning && handleStart()}
              placeholder="Enter competitor domain (e.g. gocolors.com)"
              className="h-16 w-full rounded-2xl border border-gray-100 bg-gray-50 pl-16 pr-8 text-base font-bold text-gray-900 shadow-inner focus:border-gray-900 focus:bg-white focus:outline-none transition-all"
              disabled={isRunning}
            />
          </div>
          <div className="relative group/select">
            <select
              value={region}
              onChange={e => setRegion(e.target.value)}
              className="h-16 w-full md:w-64 rounded-2xl border border-gray-100 bg-gray-50 px-8 text-[10px] font-black uppercase tracking-[2px] text-gray-900 appearance-none shadow-inner focus:border-gray-900 focus:bg-white focus:outline-none transition-all"
              disabled={isRunning}
            >
              {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 rotate-90 pointer-events-none" />
          </div>
          <div className="flex gap-4">
            {!isRunning ? (
              <button onClick={handleStart} disabled={!domain.trim()} className="flex h-16 items-center gap-4 rounded-2xl bg-gray-900 px-10 text-[10px] font-black uppercase tracking-[3px] text-white shadow-2xl shadow-gray-400 transition-all hover:bg-black active:scale-95 disabled:opacity-50">
                <Play size={16} /> Start Intel
              </button>
            ) : (
              <button onClick={stopScraping}
                className="flex h-16 items-center gap-4 rounded-2xl bg-rose-600 px-10 text-[10px] font-black uppercase tracking-[3px] text-white shadow-2xl shadow-rose-200 transition-all hover:bg-rose-700 active:scale-95">
                <Square size={16} /> Kill Task
              </button>
            )}
            {(hasResults || status !== 'idle') && (
              <button onClick={resetScraper}
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-gray-400 border border-gray-100 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 active:rotate-180 duration-500">
                <RotateCcw size={20} />
              </button>
            )}
          </div>
        </div>
        
        {!isRunning && status === 'idle' && (
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Target Examples:</span>
            {['gocolors.com', 'zivame.com', 'clovia.com', 'libas.in'].map(example => (
              <button key={example} onClick={() => setDomain(example)}
                className="text-[10px] font-black text-gray-500 hover:text-blue-600 hover:border-blue-600 transition-all border border-gray-100 px-5 py-2 rounded-xl bg-gray-50 hover:bg-white hover:shadow-lg">
                {example}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Status + Feed ── */}
      <AnimatePresence>
        {(isRunning || session) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <ScraperStatusPanel session={session} feedItems={feedItems} isDemoMode={isDemoMode} />
            </div>
            <ExtractionFeed items={feedItems} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dataset Overview Cards ── */}
      <AnimatePresence>
        {(hasResults || isRunning) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <h2 className="text-[10px] font-black uppercase tracking-[4px] text-gray-400">Real-time Intel Scoreboard</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
              <StatCard label="Ads" value={stats.totalAds} icon={<Search size={20} />} color="#2563eb" />
              <StatCard label="Media" value={stats.totalImages} icon={<Image size={20} />} color="#7c3aed" />
              <StatCard label="Clips" value={stats.totalVideos} icon={<Video size={20} />} color="#10b981" />
              <StatCard label="Tags" value={stats.totalKeywords} icon={<Tag size={20} />} color="#f59e0b" />
              <StatCard label="Logic" value={stats.totalCategories} icon={<Grid size={20} />} color="#ef4444" />
              <StatCard label="Campaign" value={stats.activeCampaigns} icon={<ShoppingBag size={20} />} color="#f97316" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Asset Gallery ── */}
      <AnimatePresence>
        {hasResults && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="flex items-center gap-4">
               <div className="h-2 w-12 bg-blue-600 rounded-full" />
               <h2 className="text-[10px] font-black uppercase tracking-[4px] text-gray-400">Captured Intelligence Assets</h2>
            </div>
            <AssetGallery ads={ads} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Keyword Intel ── */}
      <AnimatePresence>
        {(hasResults || keywords.length > 0) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="flex items-center gap-4">
               <div className="h-2 w-12 bg-emerald-600 rounded-full" />
               <h2 className="text-[10px] font-black uppercase tracking-[4px] text-gray-400">Linguistic Intel Vector</h2>
            </div>
            <KeywordIntelTable keywords={keywords} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Creative Analysis ── */}
      <AnimatePresence>
        {hasResults && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="flex items-center gap-4">
               <div className="h-2 w-12 bg-purple-600 rounded-full" />
               <h2 className="text-[10px] font-black uppercase tracking-[4px] text-gray-400">Creative Score Diagnostics</h2>
            </div>
            <CreativeAnalysisPanel ads={ads} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Export ── */}
      <AnimatePresence>
        {(hasResults || status === 'complete') && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="flex items-center gap-4">
               <div className="h-2 w-12 bg-rose-600 rounded-full" />
               <h2 className="text-[10px] font-black uppercase tracking-[4px] text-gray-400">Intel Extraction Protocol</h2>
            </div>
            <ExportPanel ads={ads} keywords={keywords} isDemoMode={isDemoMode} sessionId={session?.id} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Scrape History ── */}
      {!isRunning && backendOnline && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-[1.5rem] bg-gray-900 text-white shadow-2xl shadow-gray-400">
                <History size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase leading-none">Intelligence Archive</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Historical extraction snapshots</p>
              </div>
            </div>
            <button 
              onClick={fetchHistory} 
              className="flex items-center gap-2 h-12 rounded-2xl border border-gray-100 bg-white px-6 text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-sm transition-all hover:bg-gray-50 active:scale-95"
            >
              <RotateCcw size={14} className={loadingHistory ? 'animate-spin' : ''} />
              Sync Archive
            </button>
          </div>
          
          <div className="rounded-[2.5rem] border border-gray-100 bg-white shadow-xl shadow-gray-200/50 overflow-hidden p-3">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-50 text-[10px] font-black uppercase tracking-[3px] text-gray-400">
                  <th className="px-8 py-6">Intel Target</th>
                  <th className="px-8 py-6">Region</th>
                  <th className="px-8 py-6 text-center">Ads Captured</th>
                  <th className="px-8 py-6 text-center">Media Assets</th>
                  <th className="px-8 py-6">Last Sync</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {snapshots.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center gap-6">
                        <div className="p-8 rounded-full bg-gray-50 border border-gray-100 shadow-inner">
                          <History size={48} className="text-gray-200" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-lg font-black text-gray-900 uppercase tracking-tighter">No Intel Found</p>
                          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Start a new scrape to populate the archive.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  snapshots.map((snap) => (
                    <tr key={snap.id} className="group hover:bg-gray-50 transition-all duration-300">
                      <td className="px-8 py-8">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-gray-900 text-white flex items-center justify-center font-black text-xl shadow-xl shadow-gray-400 group-hover:scale-110 transition-transform duration-500">
                            {snap.brand?.substring(0, 1) || snap.domain?.substring(0, 1)}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 text-base leading-none">{snap.brand || snap.domain}</p>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">{snap.domain}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-8">
                        <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 px-4 py-2 rounded-xl border border-gray-200 text-gray-900">{snap.region || 'IN'}</span>
                      </td>
                      <td className="px-8 py-8 text-center">
                        <span className="text-lg font-black text-gray-900">{snap.adsExtracted || 0}</span>
                      </td>
                      <td className="px-8 py-8 text-center text-sm font-black text-gray-400 uppercase tracking-widest">
                        {snap.imagesFound || 0} Assets
                      </td>
                      <td className="px-8 py-8 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                        {snap.completedAt ? new Date(snap.completedAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-8 py-8 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button 
                            onClick={() => handleDeleteSession(snap.id)}
                            className="p-4 text-gray-300 hover:text-white hover:bg-rose-600 rounded-2xl transition-all active:scale-90 shadow-sm border border-gray-50 hover:border-rose-700"
                            title="Purge Intel"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ── Empty State ── */}
      {status === 'idle' && !hasResults && snapshots.length === 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          className="rounded-[3rem] border border-dashed border-gray-200 bg-white p-24 flex flex-col items-center text-center space-y-8 shadow-inner">
          <div className="p-10 rounded-full bg-blue-50 border border-blue-100 shadow-xl shadow-blue-100/50">
            <BarChart2 size={64} className="text-blue-600" />
          </div>
          <div className="space-y-4 max-w-lg">
            <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Ready for Extraction</h3>
            <p className="text-gray-400 text-base font-bold leading-relaxed uppercase tracking-widest">
              Enter a competitor domain above to map their digital footprint across the Google Ads network.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {['Headlines', 'CTAs', 'Ad Images', 'Videos', 'Keywords', 'Colors', 'Offers', 'Categories'].map(f => (
              <span key={f} className="px-6 py-2 rounded-full bg-gray-50 border border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">{f}</span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CompetitorScraperPage;
