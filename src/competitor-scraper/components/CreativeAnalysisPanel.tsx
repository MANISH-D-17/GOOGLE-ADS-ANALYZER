import React from 'react';
import type { ScrapedAd } from '../types/scraper.types';
import { DEMO_ANALYSIS } from '../utils/demoData';

interface CreativeAnalysisPanelProps { ads: ScrapedAd[]; }

const CTA_STYLE_META: Record<string, { label: string; bg: string; color: string; border: string; desc: string }> = {
  urgency: { label: 'Urgency', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', desc: '"Buy Now", "Last Few Left"' },
  fomo:    { label: 'FOMO',    bg: '#fff7ed', color: '#c2410c', border: '#fed7aa', desc: '"Limited Edition", "Don\'t Miss"' },
  trust:   { label: 'Trust',   bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', desc: '"1M+ Happy Customers"' },
  discount:{ label: 'Discount',bg: '#fffbeb', color: '#b45309', border: '#fde68a', desc: '"40% OFF", "Starting ₹299"' },
  neutral: { label: 'Neutral', bg: '#f8fafc', color: '#475569', border: '#e2e8f0', desc: '"Explore", "Learn More"' },
};

const TRIGGER_COLORS = ['#2563eb', '#7c3aed', '#059669', '#dc2626', '#d97706', '#ea580c', '#db2777'];

export const CreativeAnalysisPanel: React.FC<CreativeAnalysisPanelProps> = ({ ads }) => {
  const allTriggers = ads.flatMap(a => a.emotionalTriggers);
  const triggerFreq = allTriggers.reduce<Record<string, number>>((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc; }, {});

  const allColors = ads.flatMap(a => a.dominantColors);
  const colorFreq = allColors.reduce<Record<string, number>>((acc, c) => { acc[c] = (acc[c] || 0) + 1; return acc; }, {});
  const topColors = Object.entries(colorFreq).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const ctaFreq = DEMO_ANALYSIS.map(a => a.ctaStyle)
    .reduce<Record<string, number>>((acc, c) => { acc[c] = (acc[c] || 0) + 1; return acc; }, {});

  const categories = [...new Set(ads.map(a => a.fashionCategory).filter(Boolean))];
  const sortedTriggers = Object.entries(triggerFreq).sort((a, b) => b[1] - a[1]);

  return (
    <div className="scraper-glass p-6 space-y-6">
      <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Creative Intelligence Analysis</h3>

      {/* Dominant Colors */}
      <div>
        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Dominant Brand Colors</h4>
        {topColors.length === 0 ? (
          <p className="text-gray-400 text-xs font-medium">Colors extracted after scraping completes.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {topColors.map(([hex, count]) => (
              <div key={hex} className="flex flex-col items-center gap-1.5">
                <div className="scraper-color-swatch" style={{ background: hex, width: '32px', height: '32px' }} title={hex} />
                <span className="text-[9px] text-gray-400 font-bold">{count}x</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA Styles */}
      <div>
        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">CTA Style Breakdown</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(ctaFreq).map(([style, count]) => {
            const m = CTA_STYLE_META[style] || { label: style, bg: '#f8fafc', color: '#64748b', border: '#e2e8f0', desc: '' };
            return (
              <div key={style} className="p-4 rounded-xl border" style={{ background: m.bg, borderColor: m.border }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black uppercase tracking-widest" style={{ color: m.color }}>{m.label}</span>
                  <span className="text-lg font-black text-gray-900">{count}</span>
                </div>
                <p className="text-[10px] text-gray-500">{m.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Emotional Triggers */}
      <div>
        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Emotional Triggers</h4>
        {sortedTriggers.length === 0 ? (
          <p className="text-gray-400 text-xs font-medium">Triggers extracted after scraping completes.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sortedTriggers.map(([trigger, count], i) => (
              <div key={trigger} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border"
                style={{ background: TRIGGER_COLORS[i % TRIGGER_COLORS.length] + '10', color: TRIGGER_COLORS[i % TRIGGER_COLORS.length], borderColor: TRIGGER_COLORS[i % TRIGGER_COLORS.length] + '25' }}>
                {trigger}
                <span className="text-[10px] opacity-60">{count}x</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Product Categories Detected</h4>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => <span key={cat} className="scraper-tag scraper-tag-purple">{cat}</span>)}
          </div>
        </div>
      )}
    </div>
  );
};
