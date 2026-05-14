import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Globe, Play, Square, RotateCcw,
  Wifi, WifiOff, ShoppingBag, Image, Video, Tag, Grid, Zap,
  BarChart2
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
    <motion.div whileHover={{ y: -2 }} className="scraper-stat-card scraper-glass p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</span>
        <div className="p-2 rounded-lg" style={{ background: `${color}15`, color }}>
          {icon}
        </div>
      </div>
      <span className="text-3xl font-black text-white">{value}</span>
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
      <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-8">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                  <Zap size={20} className="text-white" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                  Ad Intelligence Engine
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none">
                Competitor Ad Intelligence
              </h1>
              <p className="text-gray-400 mt-2 text-sm font-medium max-w-xl">
                Extract, analyze, and decode competitor ad strategies from Google Ads Transparency Center in real-time.
              </p>
            </div>
            {/* Backend status badge */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${backendOnline ? 'scraper-tag-green' : 'scraper-tag-amber'} scraper-tag`}>
              {backendOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              {backendOnline ? 'Backend Online' : 'Demo Mode'}
            </div>
          </div>
        </motion.div>

        {/* ── URL Input Section ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
          className="scraper-glass-strong p-6 space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Target Configuration</h2>
          <div className="flex flex-col md:flex-row gap-3">
            {/* Domain Input */}
            <div className="flex-1 relative">
              <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
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
            {/* Region Selector */}
            <select
              value={region}
              onChange={e => setRegion(e.target.value)}
              className="scraper-select md:w-48"
              disabled={isRunning}
            >
              {REGIONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            {/* Action Buttons */}
            <div className="flex gap-2">
              {!isRunning ? (
                <button onClick={handleStart} disabled={!domain.trim()}
                  className="scraper-btn-primary flex items-center gap-2">
                  <Play size={14} /> Start Scraping
                </button>
              ) : (
                <button onClick={stopScraping}
                  className="scraper-btn-primary flex items-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 24px rgba(239,68,68,0.3)' }}>
                  <Square size={14} /> Stop
                </button>
              )}
              {(hasResults || status !== 'idle') && (
                <button onClick={resetScraper}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-gray-400 border border-gray-700 hover:border-gray-500 hover:text-white transition-all">
                  <RotateCcw size={13} /> Reset
                </button>
              )}
            </div>
          </div>
          {/* Hints */}
          {!isRunning && status === 'idle' && (
            <div className="flex flex-wrap gap-2">
              {['gocolors.com', 'zivame.com', 'clovia.com', 'libas.in'].map(example => (
                <button key={example} onClick={() => setDomain(example)}
                  className="text-[10px] font-black text-gray-600 hover:text-blue-400 transition-colors border border-gray-800 hover:border-blue-800 px-3 py-1 rounded-full">
                  {example}
                </button>
              ))}
            </div>
          )}
          {isDemoMode && (
            <div className="flex items-center gap-2 text-xs text-amber-400 font-bold">
              <WifiOff size={12} />
              Running in Demo Mode — start the Python backend for live scraping
            </div>
          )}
        </motion.div>

        {/* ── Status + Feed ── */}
        <AnimatePresence>
          {(isRunning || session) && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ScraperStatusPanel session={session} feedItems={feedItems} isDemoMode={isDemoMode} />
              </div>
              <div>
                <ExtractionFeed items={feedItems} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Dataset Overview Cards ── */}
        <AnimatePresence>
          {(hasResults || isRunning) && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Dataset Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard label="Total Ads" value={stats.totalAds} icon={<Search size={16} />} color="#60a5fa" />
                <StatCard label="Images" value={stats.totalImages} icon={<Image size={16} />} color="#a78bfa" />
                <StatCard label="Videos" value={stats.totalVideos} icon={<Video size={16} />} color="#34d399" />
                <StatCard label="Keywords" value={stats.totalKeywords} icon={<Tag size={16} />} color="#fbbf24" />
                <StatCard label="Categories" value={stats.totalCategories} icon={<Grid size={16} />} color="#f87171" />
                <StatCard label="Campaigns" value={stats.activeCampaigns} icon={<ShoppingBag size={16} />} color="#fb923c" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Asset Gallery ── */}
        <AnimatePresence>
          {hasResults && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <AssetGallery ads={ads} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Keyword Intel ── */}
        <AnimatePresence>
          {(hasResults || keywords.length > 0) && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <KeywordIntelTable keywords={keywords} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Creative Analysis ── */}
        <AnimatePresence>
          {hasResults && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <CreativeAnalysisPanel ads={ads} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Export ── */}
        <AnimatePresence>
          {(hasResults || status === 'complete') && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <ExportPanel ads={ads} keywords={keywords} isDemoMode={isDemoMode} sessionId={session?.id} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Empty State ── */}
        {status === 'idle' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="scraper-glass p-16 flex flex-col items-center text-center space-y-4">
            <div className="p-6 rounded-full" style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
              <BarChart2 size={40} className="text-blue-400" />
            </div>
            <h3 className="text-xl font-black text-white">Ready to Extract Competitor Intelligence</h3>
            <p className="text-gray-500 text-sm max-w-md">
              Enter a competitor's domain above and click "Start Scraping" to begin extracting ads,
              creatives, keywords, and campaign strategies from Google Ads Transparency Center.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
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
