import React from 'react';
import type { InferredKeyword } from '../types/scraper.types';

interface KeywordIntelTableProps { keywords: InferredKeyword[]; }

const INTENT_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  transactional: { bg: '#f0fdf4', color: '#15803d', label: 'Transactional' },
  commercial:    { bg: '#eff6ff', color: '#1d4ed8', label: 'Commercial' },
  informational: { bg: '#f5f3ff', color: '#6d28d9', label: 'Informational' },
  navigational:  { bg: '#fffbeb', color: '#b45309', label: 'Navigational' },
};

export const KeywordIntelTable: React.FC<KeywordIntelTableProps> = ({ keywords }) => {
  if (!keywords.length) {
    return (
      <div className="scraper-glass p-6 flex items-center justify-center h-40">
        <p className="text-gray-400 text-sm font-bold">Keywords will appear after extraction completes.</p>
      </div>
    );
  }
  const sorted = [...keywords].sort((a, b) => b.relevanceScore - a.relevanceScore);

  return (
    <div className="scraper-glass overflow-hidden">
      <div className="p-5 flex items-center justify-between border-b border-gray-50">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Keyword Intelligence</h3>
        <span className="scraper-tag scraper-tag-blue">{keywords.length} Keywords</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50">
              {['Search Term', 'Intent', 'Frequency', 'Relevance Score', 'Source Ads'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((kw, i) => {
              const s = INTENT_STYLES[kw.intent] || INTENT_STYLES.informational;
              return (
                <tr key={kw.id} className="scraper-table-row border-b border-gray-50 transition-colors"
                  style={{ background: i % 2 === 0 ? 'transparent' : '#fafafa' }}>
                  <td className="px-5 py-3.5">
                    <span className="text-gray-900 text-sm font-semibold">{kw.keyword}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border"
                      style={{ background: s.bg, color: s.color, borderColor: s.color + '30' }}>
                      {s.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-gray-600 text-sm font-bold">{kw.frequency}x</span>
                  </td>
                  <td className="px-5 py-3.5 min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <div className="scraper-relevance-bar flex-1">
                        <div className="scraper-relevance-fill" style={{ width: `${kw.relevanceScore * 100}%` }} />
                      </div>
                      <span className="text-xs font-black text-blue-600 w-10 text-right">
                        {(kw.relevanceScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-gray-400 text-xs font-bold">{kw.sourceAds.length} ads</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
