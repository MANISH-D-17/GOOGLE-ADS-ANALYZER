import React, { useState } from 'react';
import type { ScrapedAd } from '../types/scraper.types';
import { ExternalLink, Image as ImageIcon, Video as VideoIcon, FileText } from 'lucide-react';

interface AssetGalleryProps {
  ads: ScrapedAd[];
}

type GalleryTab = 'images' | 'videos' | 'textads';

export const AssetGallery: React.FC<AssetGalleryProps> = ({ ads }) => {
  const [activeTab, setActiveTab] = useState<GalleryTab>('images');

  const imageAds = ads.filter(a => a.imageUrls.length > 0);
  const videoAds = ads.filter(a => a.videoUrls.length > 0);
  const textAds = ads.filter(a => a.adFormat === 'text' || a.adFormat === 'responsive');

  const tabs: { id: GalleryTab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'images', label: 'Images', icon: <ImageIcon size={13} />, count: imageAds.length },
    { id: 'videos', label: 'Videos', icon: <VideoIcon size={13} />, count: videoAds.length },
    { id: 'textads', label: 'Text Ads', icon: <FileText size={13} />, count: textAds.length },
  ];

  return (
    <div className="scraper-glass p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-300">Asset Preview Gallery</h3>
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`scraper-tab flex items-center gap-1.5 ${activeTab === tab.id ? 'active' : ''}`}>
              {tab.icon} {tab.label}
              <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.08)', color: '#9ca3af' }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'images' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {imageAds.length === 0 && <p className="col-span-3 text-gray-500 text-sm text-center py-8">No image ads found yet.</p>}
          {imageAds.map(ad => (
            <div key={ad.id} className="scraper-asset-card group">
              <div className="relative aspect-video overflow-hidden">
                <img src={ad.adPreviewAsset} alt={ad.headline}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${ad.id}/400/250`; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                  <div className="w-full">
                    <p className="text-white text-xs font-bold truncate">{ad.headline}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="scraper-tag scraper-tag-blue">{ad.ctaText}</span>
                      <a href={ad.landingUrl} target="_blank" rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300" onClick={e => e.stopPropagation()}>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-3">
                <p className="text-white text-xs font-semibold truncate">{ad.headline}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  {ad.dominantColors.slice(0, 3).map(c => (
                    <div key={c} className="scraper-color-swatch" style={{ background: c, width: '16px', height: '16px', borderRadius: '4px' }} />
                  ))}
                  <span className="text-gray-500 text-[10px] font-bold ml-auto">{ad.firstSeen}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'videos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videoAds.length === 0 && <p className="col-span-2 text-gray-500 text-sm text-center py-8">No video ads found yet.</p>}
          {videoAds.map(ad => (
            <div key={ad.id} className="scraper-asset-card p-4">
              <video controls className="w-full rounded-lg mb-3" style={{ maxHeight: '200px' }}>
                {ad.videoUrls.map(v => <source key={v} src={v} />)}
                Your browser does not support video.
              </video>
              <p className="text-white text-sm font-bold">{ad.headline}</p>
              <p className="text-gray-400 text-xs mt-1">{ad.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="scraper-tag scraper-tag-green">{ad.ctaText}</span>
                <span className="scraper-tag scraper-tag-purple">{ad.fashionCategory}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'textads' && (
        <div className="space-y-3">
          {textAds.length === 0 && ads.length > 0 && ads.slice(0, 3).map(ad => (
            <div key={ad.id} className="scraper-asset-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-blue-400 text-sm font-black mb-1 hover:underline cursor-pointer">{ad.headline}</p>
                  <p className="text-green-400 text-[11px] font-bold mb-2 truncate">{ad.landingUrl}</p>
                  <p className="text-gray-300 text-xs leading-relaxed">{ad.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="scraper-tag scraper-tag-blue">{ad.ctaText}</span>
                  {ad.offerText && <span className="scraper-tag scraper-tag-amber">{ad.offerText}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {ad.emotionalTriggers.map(t => (
                  <span key={t} className="scraper-tag scraper-tag-purple">{t}</span>
                ))}
                <span className="text-gray-600 text-[10px] font-bold ml-auto">
                  {ad.firstSeen} → {ad.lastSeen}
                </span>
              </div>
            </div>
          ))}
          {textAds.length === 0 && ads.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8">No text ads found yet.</p>
          )}
          {textAds.map(ad => (
            <div key={ad.id} className="scraper-asset-card p-5">
              <p className="text-blue-400 text-sm font-black mb-1">{ad.headline}</p>
              <p className="text-green-400 text-[11px] font-bold mb-2">{ad.landingUrl}</p>
              <p className="text-gray-300 text-xs">{ad.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
