import React, { useEffect, useState, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { PageLoader } from './components/reusable/PageLoader';
import { ErrorBoundary } from './components/reusable/ErrorBoundary';
import { ServerIcon } from 'lucide-react';
import { Toaster } from 'sonner';

// Lazy loaded routes
const ExecutiveDashboard = React.lazy(() => import('./dashboards/executive/ExecutiveDashboard').then(m => ({ default: m.ExecutiveDashboard })));
const ProductDashboard = React.lazy(() => import('./dashboards/product/ProductDashboard').then(m => ({ default: m.ProductDashboard })));
const KeywordDashboard = React.lazy(() => import('./dashboards/keywords/KeywordDashboard').then(m => ({ default: m.KeywordDashboard })));
const CampaignDashboard = React.lazy(() => import('./dashboards/campaigns/CampaignDashboard').then(m => ({ default: m.CampaignDashboard })));
const CreativeDashboard = React.lazy(() => import('./dashboards/creatives/CreativeDashboard').then(m => ({ default: m.CreativeDashboard })));
const SKUDetailPage = React.lazy(() => import('./pages/SKUDetailPage'));
const CompetitorScraperPage = React.lazy(() => import('./competitor-scraper/pages/CompetitorScraperPage'));
const CompetitorAnalysisPage = React.lazy(() => import('./competitor-analysis/pages/CompetitorAnalysisPage'));
const BrandComparisonPage = React.lazy(() => import('./brand-comparison/pages/BrandComparisonPage'));

const BACKEND = (import.meta as any).env?.VITE_SCRAPER_BACKEND_URL || 'http://localhost:8001';
const MAX_WAIT_MS = 15_000;   // give up after 15 s
const POLL_MS     = 1_500;    // retry every 1.5 s

type ReadyState = 'loading' | 'ready' | 'timeout';

function App() {
  const [dateRange, setDateRange] = useState('Last 30d');
  const [appReady, setAppReady] = useState<ReadyState>('loading');

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();

    const ping = async () => {
      if (cancelled) return;

      // Give up after MAX_WAIT_MS — render the app anyway so it isn't stuck forever
      if (Date.now() - startedAt >= MAX_WAIT_MS) {
        if (!cancelled) setAppReady('timeout');
        return;
      }

      try {
        const res = await fetch(`${BACKEND}/health`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          if (!cancelled) setAppReady('ready');
          return; // done — stop polling
        }
      } catch {
        // backend not yet reachable — fall through to retry
      }

      // Retry after POLL_MS
      setTimeout(ping, POLL_MS);
    };

    ping();
    return () => { cancelled = true; };
  }, []);

  // Show loader until backend is confirmed up (or timeout)
  if (appReady === 'loading') {
    return <PageLoader icon={<ServerIcon />} gradient="from-indigo-600 to-violet-600" color="indigo" label="Connecting to backend…" />;
  }

  return (
    <DashboardLayout dateRange={dateRange} setDateRange={setDateRange}>
      <Toaster position="top-right" richColors />
      <ErrorBoundary>
        <Suspense fallback={<PageLoader icon={<ServerIcon />} gradient="from-indigo-600 to-violet-600" color="indigo" label="Loading..." />}>
          <Routes>
            <Route path="/" element={<ProductDashboard dateRange={dateRange} />} />
            <Route path="/executive" element={<ExecutiveDashboard dateRange={dateRange} />} />
            <Route path="/keywords" element={<KeywordDashboard dateRange={dateRange} />} />
            <Route path="/campaigns" element={<CampaignDashboard dateRange={dateRange} />} />
            <Route path="/creatives" element={<CreativeDashboard dateRange={dateRange} />} />
            <Route path="/sku/:id" element={<SKUDetailPage dateRange={dateRange} />} />
            <Route path="/competitor-scraper" element={<CompetitorScraperPage />} />
            <Route path="/competitor-analysis" element={<CompetitorAnalysisPage />} />

            <Route path="/brand-vs-competitor" element={<BrandComparisonPage />} />
            <Route path="/competitors" element={<Navigate to="/competitor-analysis" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </DashboardLayout>
  );
}

export default App;
