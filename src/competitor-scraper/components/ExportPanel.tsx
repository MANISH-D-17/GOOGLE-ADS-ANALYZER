import React, { useState } from 'react';
import { Download, FileText, FileJson, Archive, CheckCircle } from 'lucide-react';
import { scraperApiService } from '../services/scraperApiService';
import type { ScrapedAd, InferredKeyword, ExportFormat } from '../types/scraper.types';

interface ExportPanelProps {
  ads: ScrapedAd[];
  keywords: InferredKeyword[];
  sessionId?: string;
  isDemoMode: boolean;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ ads, keywords, sessionId, isDemoMode }) => {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [exported, setExported] = useState<ExportFormat | null>(null);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = ['ID', 'Brand', 'Domain', 'Headline', 'Description', 'CTA', 'Landing URL', 'Ad Format', 'First Seen', 'Last Seen', 'Offer Text', 'Fashion Category'];
    const rows = ads.map(ad => [
      ad.id, ad.brand, ad.domain, `"${ad.headline}"`, `"${ad.description}"`,
      ad.ctaText, ad.landingUrl, ad.adFormat, ad.firstSeen, ad.lastSeen,
      `"${ad.offerText}"`, ad.fashionCategory,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    return new Blob([csv], { type: 'text/csv' });
  };

  const exportJSON = () => {
    const payload = { ads, keywords, exportedAt: new Date().toISOString(), totalAds: ads.length };
    return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  };

  const handleExport = async (format: ExportFormat) => {
    setExporting(format);
    try {
      let blob: Blob;
      const filename = `competitor_intel_${Date.now()}`;

      if (isDemoMode || !sessionId) {
        if (format === 'csv') blob = exportCSV();
        else if (format === 'json') blob = exportJSON();
        else {
          // For ZIP in demo mode, just export JSON
          blob = exportJSON();
          downloadBlob(blob, `${filename}.json`);
          setExported(format);
          setTimeout(() => setExported(null), 3000);
          return;
        }
      } else {
        blob = await scraperApiService.exportData(sessionId, format);
      }

      downloadBlob(blob, `${filename}.${format}`);
      setExported(format);
      setTimeout(() => setExported(null), 3000);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(null);
    }
  };

  const buttons = [
    { format: 'csv' as ExportFormat, label: 'Export CSV', icon: <FileText size={16} />, color: '#34d399' },
    { format: 'json' as ExportFormat, label: 'Export JSON', icon: <FileJson size={16} />, color: '#60a5fa' },
    { format: 'zip' as ExportFormat, label: 'Export Media ZIP', icon: <Archive size={16} />, color: '#a78bfa' },
  ];

  return (
    <div className="scraper-glass p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-300">Export Data</h3>
        <span className="text-xs text-gray-500 font-bold">{ads.length} ads ready</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {buttons.map(({ format, label, icon, color }) => {
          const isExporting = exporting === format;
          const isExported = exported === format;
          return (
            <button key={format}
              onClick={() => handleExport(format)}
              disabled={isExporting || ads.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
              style={{
                background: `${color}12`,
                color: isExported ? '#34d399' : color,
                border: `1px solid ${isExported ? '#34d399' : color}30`,
                opacity: ads.length === 0 ? 0.4 : 1,
              }}>
              {isExporting ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isExported ? (
                <CheckCircle size={16} />
              ) : (
                icon
              )}
              <span>{isExported ? 'Downloaded!' : isExporting ? 'Exporting...' : label}</span>
            </button>
          );
        })}
      </div>
      {ads.length === 0 && (
        <p className="text-center text-xs text-gray-600 font-bold">Start a scraping session to enable exports.</p>
      )}
    </div>
  );
};
