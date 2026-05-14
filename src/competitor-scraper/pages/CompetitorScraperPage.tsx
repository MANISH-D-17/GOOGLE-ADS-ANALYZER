import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Globe, Play, Square, RotateCcw,
  Wifi, WifiOff, ShoppingBag, Image, Video, Tag, Grid, Zap, BarChart2
} from 'lucide-react';
import '../styles/scraper.css';
import { useScraperSession } from '../hooks/useScraperSession';
import { ScraperStatusPanel } from '../components/ScraperStatusPanel';
import { ExtractionFeed } from '../components/ExtractionFeed';
import { AssetGallery } from '../components/AssetGallery';
import { KeywordIntelTable } from '../components/KeywordIntelTable';
import { CreativeAnalysisPanel } from '../components/CreativeAnalysisPanel';
import { ExportPanel } from '../components/ExportPanel';

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
    <motion.div whileHover={{ y: -2 }}
      className="scraper-stat-card scraper-glass p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</span>
        <div className="p-2 rounded-lg" style={{ background: `${color}14`, color }}>
          {icon}
        </div>
      </div>
      <span className="text-3xl font-black text-gray-900">{value}</span>
    </motion.div>
  );
}

const CompetitorScraperPage: React.FC = () => {
  const [domain, setDomain] = useState('');
  const [region, setRegion] = useState('IN');

  const {
    status, session, ads, keywords, feedItems, stats,
    backendOnline, isDemoMode,
    startScraping, stopScraping, resetScraper,
  } = useScraperSession();

  const handleStart = async () => {
    if (!domain.trim()) return;
    const cleanDomain = domain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    await startScraping(cleanDomain, region);
  };

  const isRunning = status === 'running';
  const hasResults = ads.length > 0;

  return (
    <div className="scraper-root">
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Ad Intelligence Scraper</h1>
            <p className="text-gray-400 mt-1 font-medium text-sm">
              Extract and analyze competitor ad strategies from Google Ads Transparency Center.
            </p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${backendOnline ? 'scraper-tag-green' : 'scraper-tag-amber'} scraper-tag`}>
            {backendOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
            {backendOnline ? 'Backend Online' : 'Demo Mode'}
          </div>
        </div>

        {/* ── URL Input Section ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="scraper-glass-strong p-6 space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Target Configuration</h2>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !isRunning && handleStart()}
                placeholder="Enter competitor domain (e.g. gocolors.com)"
                className="scraper-input pl-9"
                disabled={isRunning}
              />
            </div>
            <select
              value={region}
              onChange={e => setRegion(e.target.value)}
              className="scraper-select md:w-48"
              disabled={isRunning}
            >
              {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <div className="flex gap-2">
              {!isRunning ? (
                <button onClick={handleStart} disabled={!domain.trim()} className="scraper-btn-primary flex items-center gap-2">
                  <Play size={13} /> Start Scraping
                </button>
              ) : (
                <button onClick={stopScraping}
                  className="scraper-btn-primary flex items-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 12px rgba(239,68,68,0.25)' }}>
                  <Square size={13} /> Stop
                </button>
              )}
              {(hasResults || status !== 'idle') && (
                <button onClick={resetScraper}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 border border-gray-200 hover:border-gray-300 hover:text-gray-700 bg-white transition-all">
                  <RotateCcw size={12} /> Reset
                </button>
              )}
            </div>
          </div>
          {/* Quick examples */}
          {!isRunning && status === 'idle' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Try:</span>
              {['gocolors.com', 'zivame.com', 'clovia.com', 'libas.in'].map(example => (
                <button key={example} onClick={() => setDomain(example)}
                  className="text-[10px] font-black text-gray-500 hover:text-blue-600 transition-colors border border-gray-200 hover:border-blue-200 px-3 py-1 rounded-full bg-white">
                  {example}
                </button>
              ))}
            </div>
          )}
          {isDemoMode && (
            <div className="flex items-center gap-2 text-xs text-amber-600 font-bold bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <WifiOff size={12} />
              Running in Demo Mode — backend not detected. Start the Python server for live scraping.
            </div>
          )}
        </motion.div>

        {/* ── Status + Feed ── */}
        <AnimatePresence>
          {(isRunning || session) && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Dataset Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard label="Total Ads" value={stats.totalAds} icon={<Search size={16} />} color="#2563eb" />
                <StatCard label="Images" value={stats.totalImages} icon={<Image size={16} />} color="#7c3aed" />
                <StatCard label="Videos" value={stats.totalVideos} icon={<Video size={16} />} color="#059669" />
                <StatCard label="Keywords" value={stats.totalKeywords} icon={<Tag size={16} />} color="#d97706" />
                <StatCard label="Categories" value={stats.totalCategories} icon={<Grid size={16} />} color="#dc2626" />
                <StatCard label="Campaigns" value={stats.activeCampaigns} icon={<ShoppingBag size={16} />} color="#ea580c" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Asset Gallery ── */}
        <AnimatePresence>
          {hasResults && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <AssetGallery ads={ads} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Keyword Intel ── */}
        <AnimatePresence>
          {(hasResults || keywords.length > 0) && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <KeywordIntelTable keywords={keywords} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Creative Analysis ── */}
        <AnimatePresence>
          {hasResults && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <CreativeAnalysisPanel ads={ads} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Export ── */}
        <AnimatePresence>
          {(hasResults || status === 'complete') && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <ExportPanel ads={ads} keywords={keywords} isDemoMode={isDemoMode} sessionId={session?.id} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Empty State ── */}
        {status === 'idle' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="scraper-glass p-16 flex flex-col items-center text-center space-y-4">
            <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100">
              <BarChart2 size={36} className="text-blue-600" />
            </div>
            <h3 className="text-xl font-black text-gray-900">Ready to Extract Competitor Intelligence</h3>
            <p className="text-gray-400 text-sm max-w-md font-medium">
              Enter a competitor's domain above and click "Start Scraping" to extract ads, creatives,
              keywords, and campaign strategies from Google Ads Transparency Center.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              {['Headlines', 'CTAs', 'Ad Images', 'Videos', 'Keywords', 'Colors', 'Offers', 'Categories'].map(f => (
                <span key={f} className="scraper-tag scraper-tag-blue">{f}</span>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CompetitorScraperPage;
