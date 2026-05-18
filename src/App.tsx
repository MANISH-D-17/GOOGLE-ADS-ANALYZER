import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ExecutiveDashboard } from './dashboards/executive/ExecutiveDashboard';
import { ProductDashboard } from './dashboards/product/ProductDashboard';
import { KeywordDashboard } from './dashboards/keywords/KeywordDashboard';
import { CampaignDashboard } from './dashboards/campaigns/CampaignDashboard';
import { CreativeDashboard } from './dashboards/creatives/CreativeDashboard';
import SKUDetailPage from './pages/SKUDetailPage';
import CompetitorScraperPage from './competitor-scraper/pages/CompetitorScraperPage';
import CompetitorAnalysisPage from './competitor-analysis/pages/CompetitorAnalysisPage';

function App() {
  const [dateRange, setDateRange] = useState('Last 30d');

  return (
    <DashboardLayout dateRange={dateRange} setDateRange={setDateRange}>
      <Routes>
        <Route path="/" element={<ProductDashboard dateRange={dateRange} />} />
        <Route path="/executive" element={<ExecutiveDashboard dateRange={dateRange} />} />
        <Route path="/keywords" element={<KeywordDashboard dateRange={dateRange} />} />
        <Route path="/campaigns" element={<CampaignDashboard dateRange={dateRange} />} />
        <Route path="/creatives" element={<CreativeDashboard dateRange={dateRange} />} />
        <Route path="/sku/:id" element={<SKUDetailPage dateRange={dateRange} />} />
        <Route path="/competitor-scraper" element={<CompetitorScraperPage />} />
        <Route path="/competitor-analysis" element={<CompetitorAnalysisPage />} />
        <Route path="/competitors" element={<Navigate to="/competitor-analysis" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DashboardLayout>
  );
}

export default App;
