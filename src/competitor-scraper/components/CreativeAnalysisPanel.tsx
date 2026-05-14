import React from 'react';
import type { ScrapedAd } from '../types/scraper.types';
import { DEMO_ANALYSIS } from '../utils/demoData';

interface CreativeAnalysisPanelProps {
  ads: ScrapedAd[];
}

const CTA_STYLE_META: Record<string, { label: string; color: string; desc: string }> = {
  urgency: { label: 'Urgency', color: '#f87171', desc: 'Time-pressure tactics: "Buy Now", "Last Few Left"' },
  fomo: { label: 'FOMO', color: '#fb923c', desc: 'Fear of Missing Out: "Limited Edition", "Don\'t Miss"' },
  trust: { label: 'Trust', color: '#34d399', desc: 'Social proof: "1M+ Happy Customers", "Verified Brand"' },
  discount: { label: 'Discount', color: '#fbbf24', desc: 'Price anchoring: "40% OFF", "Starting ₹299"' },
  neutral: { label: 'Neutral', color: '#94a3b8', desc: 'Informational: "Explore", "Learn More"' },
};

const TRIGGER_COLORS = ['#60a5fa', '#a78bfa', '#34d399', '#f87171', '#fbbf24', '#fb923c', '#ec4899'];

export const CreativeAnalysisPanel: React.FC<CreativeAnalysisPanelProps> = ({ ads }) => {
  const allTriggers = ads.flatMap(a => a.emotionalTriggers);
  const triggerFrequency = allTriggers.reduce<Record<string, number>>((acc, t) => {
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const allColors = ads.flatMap(a => a.dominantColors);
  const colorFreq = allColors.reduce<Record<string, number>>((acc, c) => {
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});
  const topColors = Object.entries(colorFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const ctaStyles = DEMO_ANALYSIS.map(a => a.ctaStyle);
  const ctaFreq = ctaStyles.reduce<Record<string, number>>((acc, c) => {
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});

  const categories = [...new Set(ads.map(a => a.fashionCategory).filter(Boolean))];
  const sortedTriggers = Object.entries(triggerFrequency).sort((a, b) => b[1] - a[1]);

  return (
    <div className="scraper-glass p-6 space-y-6">
      <h3 className="text-sm font-black uppercase tracking-widest text-gray-300">Creative Intelligence Analysis</h3>

      {/* Dominant Colors */}
      <div>
        <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Dominant Brand Colors</h4>
        {topColors.length === 0 ? (
          <p className="text-gray-600 text-xs">Colors extracted after scraping completes.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {topColors.map(([hex, count]) => (
              <div key={hex} className="flex flex-col items-center gap-1.5">
                <div className="scraper-color-swatch" style={{ background: hex, width: '36px', height: '36px' }} title={hex} />
                <span className="text-[9px] text-gray-500 font-bold">{count}x</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA Styles */}
      <div>
        <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">CTA Style Breakdown</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(ctaFreq).map(([style, count]) => {
            const meta = CTA_STYLE_META[style] || { label: style, color: '#94a3b8', desc: '' };
            return (
              <div key={style} className="p-3 rounded-xl" style={{ background: `${meta.color}10`, border: `1px solid ${meta.color}25` }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black uppercase tracking-widest" style={{ color: meta.color }}>{meta.label}</span>
                  <span className="text-lg font-black text-white">{count}</span>
                </div>
                <p className="text-[10px] text-gray-500">{meta.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Emotional Triggers */}
      <div>
        <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Emotional Triggers</h4>
        {sortedTriggers.length === 0 ? (
          <p className="text-gray-600 text-xs">Triggers extracted after scraping completes.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sortedTriggers.map(([trigger, count], i) => (
              <div key={trigger} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: `${TRIGGER_COLORS[i % TRIGGER_COLORS.length]}15`, color: TRIGGER_COLORS[i % TRIGGER_COLORS.length], border: `1px solid ${TRIGGER_COLORS[i % TRIGGER_COLORS.length]}25` }}>
                {trigger}
                <span className="text-[10px] opacity-70">{count}x</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fashion Categories */}
      {categories.length > 0 && (
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Product Categories Detected</h4>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <span key={cat} className="scraper-tag scraper-tag-purple">{cat}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
