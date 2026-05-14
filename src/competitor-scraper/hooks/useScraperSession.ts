// ============================================================
// COMPETITOR SCRAPER — SESSION HOOK
// Manages scraping session state + backend polling
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  ScraperStatus, ScraperSession, ScrapedAd,
  InferredKeyword, ExtractionFeedItem, ScraperStats
} from '../types/scraper.types';
import { scraperApiService } from '../services/scraperApiService';
import {
  DEMO_ADS, DEMO_KEYWORDS, DEMO_FEED_ITEMS, DEMO_STATS
} from '../utils/demoData';

interface UseScraperSessionReturn {
  status: ScraperStatus;
  session: ScraperSession | null;
  ads: ScrapedAd[];
  keywords: InferredKeyword[];
  feedItems: ExtractionFeedItem[];
  stats: ScraperStats;
  backendOnline: boolean;
  isDemoMode: boolean;
  startScraping: (domain: string, region: string) => Promise<void>;
  stopScraping: () => void;
  resetScraper: () => void;
}

const DEFAULT_STATS: ScraperStats = { totalAds: 0, totalImages: 0, totalVideos: 0, totalKeywords: 0, totalCategories: 0, activeCampaigns: 0 };

export function useScraperSession(): UseScraperSessionReturn {
  const [status, setStatus] = useState<ScraperStatus>('idle');
  const [session, setSession] = useState<ScraperSession | null>(null);
  const [ads, setAds] = useState<ScrapedAd[]>([]);
  const [keywords, setKeywords] = useState<InferredKeyword[]>([]);
  const [feedItems, setFeedItems] = useState<ExtractionFeedItem[]>([]);
  const [stats, setStats] = useState<ScraperStats>(DEFAULT_STATS);
  const [backendOnline, setBackendOnline] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const demoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const demoProgressRef = useRef(0);

  // Check backend health on mount
  useEffect(() => {
    scraperApiService.healthCheck().then(setBackendOnline);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; }
    if (demoIntervalRef.current) { clearInterval(demoIntervalRef.current); demoIntervalRef.current = null; }
  }, []);

  const startDemoMode = useCallback((domain: string, region: string) => {
    setIsDemoMode(true);
    setStatus('running');
    demoProgressRef.current = 0;

    const demoSession: ScraperSession = {
      id: 'demo-session', domain, region, status: 'running',
      startedAt: new Date().toISOString(), adsExtracted: 0,
      imagesFound: 0, videosFound: 0, errorsCount: 0, progress: 0,
    };
    setSession(demoSession);
    setFeedItems([]);

    let adIndex = 0;
    let feedIndex = 0;

    demoIntervalRef.current = setInterval(() => {
      demoProgressRef.current = Math.min(demoProgressRef.current + Math.random() * 4 + 1, 100);
      const progress = demoProgressRef.current;

      // Drip feed items
      if (feedIndex < DEMO_FEED_ITEMS.length) {
        setFeedItems(prev => {
          if (prev.find(f => f.id === DEMO_FEED_ITEMS[feedIndex].id)) return prev;
          const item: ExtractionFeedItem = { ...DEMO_FEED_ITEMS[feedIndex], status: 'complete' as const };
          return [item, ...prev].slice(0, 20);
        });
        feedIndex++;
      }

      // Drip ads
      if (adIndex < DEMO_ADS.length && Math.random() > 0.5) {
        const newAd = DEMO_ADS[adIndex];
        setAds(prev => prev.find(a => a.id === newAd.id) ? prev : [...prev, newAd]);
        adIndex++;
      }

      const extracted = Math.floor((progress / 100) * DEMO_STATS.totalAds);
      const imgs = Math.floor((progress / 100) * DEMO_STATS.totalImages);
      const vids = Math.floor((progress / 100) * DEMO_STATS.totalVideos);

      setSession(prev => prev ? {
        ...prev, progress: Math.floor(progress),
        adsExtracted: extracted, imagesFound: imgs, videosFound: vids,
        status: progress >= 100 ? 'complete' : 'running',
      } : null);

      setStats({
        totalAds: extracted, totalImages: imgs, totalVideos: vids,
        totalKeywords: Math.floor((progress / 100) * DEMO_STATS.totalKeywords),
        totalCategories: Math.min(Math.floor(progress / 13), DEMO_STATS.totalCategories),
        activeCampaigns: Math.min(Math.floor(progress / 7), DEMO_STATS.activeCampaigns),
      });

      if (progress >= 100) {
        stopPolling();
        setStatus('complete');
        setAds(DEMO_ADS);
        setKeywords(DEMO_KEYWORDS);
        setStats(DEMO_STATS);
      }
    }, 600);
  }, [stopPolling]);

  const startLiveMode = useCallback(async (domain: string, region: string) => {
    setStatus('running');
    setIsDemoMode(false);
    const { sessionId } = await scraperApiService.startScraping({ domain, region });
    sessionIdRef.current = sessionId;

    pollIntervalRef.current = setInterval(async () => {
      try {
        const sess = await scraperApiService.getStatus(sessionId);
        setSession(sess);
        setStatus(sess.status);
        if (sess.status === 'complete' || sess.status === 'error') {
          stopPolling();
          if (sess.status === 'complete') {
            const [results, kws] = await Promise.all([
              scraperApiService.getResults(sessionId),
              scraperApiService.getKeywords(sessionId),
            ]);
            setAds(results);
            setKeywords(kws);
            setStats({
              totalAds: results.length,
              totalImages: results.flatMap(a => a.imageUrls).length,
              totalVideos: results.flatMap(a => a.videoUrls).length,
              totalKeywords: kws.length,
              totalCategories: new Set(results.map(a => a.fashionCategory)).size,
              activeCampaigns: sess.adsExtracted,
            });
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);
  }, [stopPolling]);

  const startScraping = useCallback(async (domain: string, region: string) => {
    stopPolling();
    setAds([]); setKeywords([]); setFeedItems([]); setStats(DEFAULT_STATS);
    try {
      if (backendOnline) {
        await startLiveMode(domain, region);
      } else {
        startDemoMode(domain, region);
      }
    } catch {
      startDemoMode(domain, region);
    }
  }, [backendOnline, startLiveMode, startDemoMode, stopPolling]);

  const stopScraping = useCallback(() => {
    stopPolling();
    setStatus('paused');
    setSession(prev => prev ? { ...prev, status: 'paused' } : null);
  }, [stopPolling]);

  const resetScraper = useCallback(() => {
    stopPolling();
    setStatus('idle');
    setSession(null);
    setAds([]); setKeywords([]); setFeedItems([]); setStats(DEFAULT_STATS);
    setIsDemoMode(false);
  }, [stopPolling]);

  return { status, session, ads, keywords, feedItems, stats, backendOnline, isDemoMode, startScraping, stopScraping, resetScraper };
}
