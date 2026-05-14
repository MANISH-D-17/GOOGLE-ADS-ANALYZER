import React from 'react';
import type { InferredKeyword } from '../types/scraper.types';

interface KeywordIntelTableProps {
  keywords: InferredKeyword[];
}

const INTENT_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  transactional: { bg: 'rgba(52, 211, 153, 0.15)', color: '#6ee7b7', label: 'Transactional' },
  commercial: { bg: 'rgba(96, 165, 250, 0.15)', color: '#93c5fd', label: 'Commercial' },
  informational: { bg: 'rgba(167, 139, 250, 0.15)', color: '#c4b5fd', label: 'Informational' },
  navigational: { bg: 'rgba(251, 191, 36, 0.15)', color: '#fcd34d', label: 'Navigational' },
};

export const KeywordIntelTable: React.FC<KeywordIntelTableProps> = ({ keywords }) => {
  if (!keywords.length) {
    return (
      <div className="scraper-glass p-6 flex items-center justify-center h-40">
        <p className="text-gray-500 text-sm font-bold">Keywords will appear after extraction completes.</p>
      </div>
    );
  }

  const sorted = [...keywords].sort((a, b) => b.relevanceScore - a.relevanceScore);

  return (
    <div className="scraper-glass overflow-hidden">
      <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-300">Keyword Intelligence</h3>
        <span className="scraper-tag scraper-tag-blue">{keywords.length} Keywords</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {['Search Term', 'Intent', 'Frequency', 'Relevance Score', 'Source Ads'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((kw, i) => {
              const intentStyle = INTENT_STYLES[kw.intent] || INTENT_STYLES.informational;
              return (
                <tr key={kw.id}
                  className="transition-colors"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td className="px-5 py-3.5">
                    <span className="text-white text-sm font-semibold">{kw.keyword}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                      style={{ background: intentStyle.bg, color: intentStyle.color }}>
                      {intentStyle.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-gray-300 text-sm font-bold">{kw.frequency}x</span>
                  </td>
                  <td className="px-5 py-3.5 min-w-[160px]">
                    <div className="flex items-center gap-2">
                      <div className="scraper-relevance-bar flex-1">
                        <div className="scraper-relevance-fill" style={{ width: `${kw.relevanceScore * 100}%` }} />
                      </div>
                      <span className="text-xs font-black text-blue-400 w-10 text-right">
                        {(kw.relevanceScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-gray-500 text-xs font-bold">{kw.sourceAds.length} ads</span>
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
