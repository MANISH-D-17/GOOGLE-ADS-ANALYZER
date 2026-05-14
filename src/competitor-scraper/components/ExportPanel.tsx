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
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = ['ID','Brand','Domain','Headline','Description','CTA','Landing URL','Ad Format','First Seen','Last Seen','Offer Text','Fashion Category'];
    const rows = ads.map(ad => [ad.id, ad.brand, ad.domain, `"${ad.headline}"`, `"${ad.description}"`, ad.ctaText, ad.landingUrl, ad.adFormat, ad.firstSeen, ad.lastSeen, `"${ad.offerText}"`, ad.fashionCategory]);
    return new Blob([[headers, ...rows].map(r => r.join(',')).join('\n')], { type: 'text/csv' });
  };
  const exportJSON = () => new Blob([JSON.stringify({ ads, keywords, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });

  const handleExport = async (format: ExportFormat) => {
    setExporting(format);
    try {
      let blob: Blob;
      const filename = `competitor_intel_${Date.now()}`;
      if (isDemoMode || !sessionId) {
        blob = format === 'csv' ? exportCSV() : exportJSON();
      } else {
        blob = await scraperApiService.exportData(sessionId, format);
      }
      downloadBlob(blob, `${filename}.${format === 'zip' ? 'json' : format}`);
      setExported(format);
      setTimeout(() => setExported(null), 3000);
    } catch (err) { console.error('Export error:', err); }
    finally { setExporting(null); }
  };

  const buttons = [
    { format: 'csv' as ExportFormat, label: 'Export CSV',       icon: <FileText size={15} />,  bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    { format: 'json' as ExportFormat, label: 'Export JSON',     icon: <FileJson size={15} />,   bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    { format: 'zip' as ExportFormat,  label: 'Export Media ZIP', icon: <Archive size={15} />,   bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' },
  ];

  return (
    <div className="scraper-glass p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Export Data</h3>
        <span className="text-xs text-gray-400 font-bold">{ads.length} ads ready</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {buttons.map(({ format, label, icon, bg, color, border }) => {
          const isExporting = exporting === format;
          const isExported = exported === format;
          return (
            <button key={format} onClick={() => handleExport(format)}
              disabled={isExporting || ads.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border"
              style={{ background: isExported ? '#f0fdf4' : bg, color: isExported ? '#15803d' : color, borderColor: isExported ? '#bbf7d0' : border, opacity: ads.length === 0 ? 0.4 : 1 }}>
              {isExporting ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> :
               isExported  ? <CheckCircle size={15} /> : icon}
              {isExported ? 'Downloaded!' : isExporting ? 'Exporting...' : label}
            </button>
          );
        })}
      </div>
      {ads.length === 0 && (
        <p className="text-center text-xs text-gray-400 font-bold">Start a scraping session to enable exports.</p>
      )}
    </div>
  );
};
