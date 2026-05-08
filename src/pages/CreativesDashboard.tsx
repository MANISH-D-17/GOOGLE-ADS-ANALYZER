import React, { useState, useMemo, useEffect } from 'react';
import { 
  AlertCircle, Video, ImageIcon, 
  Type, Layout, ExternalLink, Play,
  Activity, Zap, Search, Filter,
  ChevronLeft, ChevronRight, Link as LinkIcon
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import SectionHeader from '../components/SectionHeader';
import { cn } from '../lib/utils';
import { getAccountAssetGroups } from '../data/aggregatedData';
import { getDateRangeString } from '../lib/dataUtils';
import { AssetGroup, AssetItem } from '../data/assetGroups';

const performanceColors = {
  BEST:    'bg-green-50 text-green-700 border-green-200',
  GOOD:    'bg-blue-50 text-blue-700 border-blue-200',
  LOW:     'bg-red-50 text-red-700 border-red-200',
  PENDING: 'bg-gray-50 text-gray-500 border-gray-200',
  UNRATED: 'bg-gray-50 text-gray-400 border-gray-100',
};

const PAGE_SIZE = 10;
const MEDIA_PAGE_SIZE = 10; // Can adjust if needed for grids

// Helper Component for Pagination Controls
const PaginationControls = ({ page, totalPages, setPage }: { page: number, totalPages: number, setPage: (p: number) => void }) => {
  return (
    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between mt-auto">
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
        Page {page} of {Math.max(1, totalPages)}
      </span>
      <div className="flex gap-2">
        <button 
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          <ChevronLeft size={14} />
        </button>
        <button 
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages || totalPages === 0}
          className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

const CreativesDashboard: React.FC<{ dateRange: string }> = ({ dateRange }) => {
  const [headlinesPage, setHeadlinesPage] = useState(1);
  const [descriptionsPage, setDescriptionsPage] = useState(1);
  const [sitelinksPage, setSitelinksPage] = useState(1);
  const [imagesPage, setImagesPage] = useState(1);
  const [videosPage, setVideosPage] = useState(1);

  const assetGroups = useMemo(() => getAccountAssetGroups(), []);

  const filteredAssetGroups = assetGroups;

  const accountHealth = useMemo(() => {
    const total = filteredAssetGroups.reduce((s: number, g: AssetGroup) => s + g.overallScore, 0);
    return filteredAssetGroups.length > 0 ? Math.round(total / filteredAssetGroups.length) : 0;
  }, [filteredAssetGroups]);

  const aggregateMetrics = useMemo(() => {
    let headlines = 0, descriptions = 0, images = 0, videos = 0, sitelinks = 0;
    const len = filteredAssetGroups.length;
    filteredAssetGroups.forEach(g => {
      headlines += g.headlines?.length || 0;
      descriptions += g.descriptions?.length || 0;
      images += g.images?.length || 0;
      videos += g.videos?.length || 0;
      sitelinks += g.sitelinks?.length || 0;
    });
    return {
      headlines, maxHeadlines: len * 15,
      descriptions, maxDescriptions: len * 5,
      images, maxImages: len * 20,
      videos, maxVideos: len * 5,
      sitelinks, maxSitelinks: len * 10
    };
  }, [filteredAssetGroups]);

  // Flattened Arrays
  const allHeadlines = useMemo(() => {
    const arr: (AssetItem & { groupName: string })[] = [];
    filteredAssetGroups.forEach(g => g.headlines?.forEach(a => arr.push({ ...a, groupName: g.name })));
    return arr;
  }, [filteredAssetGroups]);

  const allDescriptions = useMemo(() => {
    const arr: (AssetItem & { groupName: string })[] = [];
    filteredAssetGroups.forEach(g => g.descriptions?.forEach(a => arr.push({ ...a, groupName: g.name })));
    return arr;
  }, [filteredAssetGroups]);

  const allSitelinks = useMemo(() => {
    const arr: (AssetItem & { groupName: string })[] = [];
    filteredAssetGroups.forEach(g => g.sitelinks?.forEach(a => arr.push({ ...a, groupName: g.name })));
    return arr;
  }, [filteredAssetGroups]);

  const allImages = useMemo(() => {
    const arr: (AssetItem & { groupName: string })[] = [];
    filteredAssetGroups.forEach(g => g.images?.forEach(a => arr.push({ ...a, groupName: g.name })));
    return arr;
  }, [filteredAssetGroups]);

  const allVideos = useMemo(() => {
    const arr: (AssetItem & { groupName: string })[] = [];
    filteredAssetGroups.forEach(g => g.videos?.forEach(a => arr.push({ ...a, groupName: g.name })));
    return arr;
  }, [filteredAssetGroups]);

  // Paginated Data
  const getPaginated = (arr: any[], page: number, size: number) => {
    const start = (page - 1) * size;
    return arr.slice(start, start + size);
  };

  const paginatedHeadlines = getPaginated(allHeadlines, headlinesPage, PAGE_SIZE);
  const paginatedDescriptions = getPaginated(allDescriptions, descriptionsPage, PAGE_SIZE);
  const paginatedSitelinks = getPaginated(allSitelinks, sitelinksPage, PAGE_SIZE);
  const paginatedImages = getPaginated(allImages, imagesPage, MEDIA_PAGE_SIZE);
  const paginatedVideos = getPaginated(allVideos, videosPage, MEDIA_PAGE_SIZE);

  // Page Counts
  const pagesHeadlines = Math.max(1, Math.ceil(allHeadlines.length / PAGE_SIZE));
  const pagesDescriptions = Math.max(1, Math.ceil(allDescriptions.length / PAGE_SIZE));
  const pagesSitelinks = Math.max(1, Math.ceil(allSitelinks.length / PAGE_SIZE));
  const pagesImages = Math.max(1, Math.ceil(allImages.length / MEDIA_PAGE_SIZE));
  const pagesVideos = Math.max(1, Math.ceil(allVideos.length / MEDIA_PAGE_SIZE));

  useEffect(() => {
    if (headlinesPage > pagesHeadlines) setHeadlinesPage(pagesHeadlines);
    if (descriptionsPage > pagesDescriptions) setDescriptionsPage(pagesDescriptions);
    if (sitelinksPage > pagesSitelinks) setSitelinksPage(pagesSitelinks);
    if (imagesPage > pagesImages) setImagesPage(pagesImages);
    if (videosPage > pagesVideos) setVideosPage(pagesVideos);
  }, [pagesHeadlines, pagesDescriptions, pagesSitelinks, pagesImages, pagesVideos, 
      headlinesPage, descriptionsPage, sitelinksPage, imagesPage, videosPage]);

  // Reusable Text List Item
  const renderTextAsset = (asset: AssetItem & { groupName: string }, i: number) => (
    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-gray-100 rounded-xl group hover:shadow-md hover:border-blue-200 transition-all gap-4">
      <div className="flex items-start sm:items-center gap-3">
        <span className={cn(
          "px-2 py-0.5 rounded-[4px] text-[8px] font-black border uppercase tracking-widest flex-shrink-0 mt-0.5 sm:mt-0",
          performanceColors[asset.performanceLabel as keyof typeof performanceColors] || performanceColors.UNRATED
        )}>
          {asset.performanceLabel}
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-gray-900 leading-snug">{asset.content}</span>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight mt-1 truncate max-w-[250px]">{asset.groupName}</span>
        </div>
      </div>
      {asset.impressions !== undefined && (
        <span className="text-[10px] font-black text-gray-400 group-hover:text-gray-600 uppercase tracking-tight whitespace-nowrap">
          {asset.impressions.toLocaleString()} Impr.
        </span>
      )}
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <PageHeader 
        title="Creative Intelligence" 
        dateRange={getDateRangeString(dateRange)} 
      />

      {/* Global Creative Health */}
      <div className="space-y-6">
        <SectionHeader title="Creative Health" />
        <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Asset Strength</h3>
              <p className="text-sm font-black text-gray-900">Google Ads AI assessment of asset group quality</p>
            </div>
            <div className="text-right">
              <div className={cn(
                "text-4xl font-black tracking-tighter",
                accountHealth >= 80 ? "text-green-600" : accountHealth >= 50 ? "text-amber-600" : "text-red-600"
              )}>
                {accountHealth}%
              </div>
              <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">Strength Score</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { category: 'Headlines', score: aggregateMetrics.headlines, maxScore: aggregateMetrics.maxHeadlines },
              { category: 'Descriptions', score: aggregateMetrics.descriptions, maxScore: aggregateMetrics.maxDescriptions },
              { category: 'Images', score: aggregateMetrics.images, maxScore: aggregateMetrics.maxImages },
              { category: 'Videos', score: aggregateMetrics.videos, maxScore: aggregateMetrics.maxVideos },
              { category: 'Sitelinks', score: aggregateMetrics.sitelinks, maxScore: aggregateMetrics.maxSitelinks },
            ].map((item) => {
               const percentage = item.maxScore > 0 ? (item.score / item.maxScore) * 100 : 0;
               const status = percentage >= 80 ? 'good' : percentage >= 50 ? 'warning' : 'critical';
               return (
                 <div key={item.category} className="space-y-3">
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight">
                     <span className="text-gray-400">{item.category}</span>
                     <span className="text-gray-900">{item.score}/{item.maxScore}</span>
                   </div>
                   <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
                     <div 
                       className={cn(
                         "h-full transition-all duration-1000",
                         status === 'good' ? "bg-green-500" : status === 'warning' ? "bg-amber-500" : "bg-red-500"
                       )}
                       style={{ width: `${percentage}%` }}
                     />
                   </div>
                 </div>
               );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-12">
        {/* Headlines Section */}
        <div className="space-y-6 flex flex-col">
          <SectionHeader title="Headlines" />
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-6 flex-1 space-y-6">
              <div className="flex items-center justify-between bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
                <div className="flex items-center gap-2">
                  <Type size={16} className="text-blue-600" />
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    All Headlines ({allHeadlines.length})
                  </h3>
                </div>
              </div>
              <div className="space-y-3 px-2">
                {paginatedHeadlines.map(renderTextAsset)}
                {paginatedHeadlines.length === 0 && (
                  <div className="p-8 text-center text-sm font-medium text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">No headlines found.</div>
                )}
              </div>
            </div>
            <PaginationControls page={headlinesPage} totalPages={pagesHeadlines} setPage={setHeadlinesPage} />
          </div>
        </div>

        {/* Descriptions Section */}
        <div className="space-y-6 flex flex-col">
          <SectionHeader title="Descriptions" />
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-6 flex-1 space-y-6">
              <div className="flex items-center justify-between bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
                <div className="flex items-center gap-2">
                  <Layout size={16} className="text-blue-600" />
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    All Descriptions ({allDescriptions.length})
                  </h3>
                </div>
              </div>
              <div className="space-y-3 px-2">
                {paginatedDescriptions.map(renderTextAsset)}
                {paginatedDescriptions.length === 0 && (
                  <div className="p-8 text-center text-sm font-medium text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">No descriptions found.</div>
                )}
              </div>
            </div>
            <PaginationControls page={descriptionsPage} totalPages={pagesDescriptions} setPage={setDescriptionsPage} />
          </div>
        </div>

        {/* Sitelinks Section */}
        <div className="space-y-6 flex flex-col">
          <SectionHeader title="Sitelinks" />
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-6 flex-1 space-y-6">
              <div className="flex items-center justify-between bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
                <div className="flex items-center gap-2">
                  <LinkIcon size={16} className="text-blue-600" />
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    All Sitelinks ({allSitelinks.length})
                  </h3>
                </div>
              </div>
              <div className="space-y-3 px-2">
                {paginatedSitelinks.map(renderTextAsset)}
                {paginatedSitelinks.length === 0 && (
                  <div className="p-8 text-center text-sm font-medium text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">No sitelinks found.</div>
                )}
              </div>
            </div>
            <PaginationControls page={sitelinksPage} totalPages={pagesSitelinks} setPage={setSitelinksPage} />
          </div>
        </div>

        {/* Images Section */}
        <div className="space-y-6 flex flex-col">
          <SectionHeader title="Images" />
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-6 flex-1 space-y-6">
              <div className="flex items-center justify-between bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
                <div className="flex items-center gap-2">
                  <ImageIcon size={16} className="text-blue-600" />
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    All Images ({allImages.length})
                  </h3>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {paginatedImages.map((asset, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden aspect-square bg-gray-50 border border-gray-200 shadow-sm flex flex-col">
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <div className="w-full h-full flex flex-col items-center justify-center text-center gap-2">
                        <ImageIcon size={28} className="text-gray-300" />
                        <span className="text-[8px] font-bold text-gray-400 line-clamp-3 leading-tight px-2">{asset.content}</span>
                      </div>
                    </div>
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gray-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                      <button className="bg-white p-2.5 rounded-full shadow-lg hover:scale-105 transition-transform">
                        <ExternalLink size={16} className="text-gray-900" />
                      </button>
                      <span className="text-[8px] font-black text-white uppercase tracking-widest bg-black/50 px-2 py-0.5 rounded truncate max-w-[80%] text-center">
                        {asset.groupName}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2 z-10">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-[4px] text-[8px] font-black border uppercase tracking-widest shadow-sm",
                        performanceColors[asset.performanceLabel as keyof typeof performanceColors] || performanceColors.UNRATED
                      )}>
                        {asset.performanceLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              {paginatedImages.length === 0 && (
                <div className="p-8 text-center text-sm font-medium text-gray-400 border-2 border-dashed border-gray-100 rounded-xl h-full flex items-center justify-center">
                  No images found.
                </div>
              )}
            </div>
            <PaginationControls page={imagesPage} totalPages={pagesImages} setPage={setImagesPage} />
          </div>
        </div>

        {/* Videos Section */}
        <div className="space-y-6 flex flex-col">
          <SectionHeader title="Videos" />
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-6 flex-1 space-y-6">
              <div className="flex items-center justify-between bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
                <div className="flex items-center gap-2">
                  <Video size={16} className="text-red-600" />
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    All Videos ({allVideos.length})
                  </h3>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedVideos.map((asset, i) => (
                  <div key={i} className="relative group h-32 rounded-xl overflow-hidden bg-gray-900 border border-white/10 shadow-lg">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play size={32} className="text-white/30 group-hover:text-white/80 transition-all group-hover:scale-110" />
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                      <span className="text-[8px] font-black text-white uppercase tracking-widest bg-black/50 px-2 py-0.5 rounded truncate max-w-[80%] text-center">
                        {asset.groupName}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded-[4px] text-[8px] font-black border uppercase tracking-widest shadow-sm",
                        performanceColors[asset.performanceLabel as keyof typeof performanceColors] || performanceColors.UNRATED
                      )}>
                        {asset.performanceLabel}
                      </span>
                      <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">YouTube Shorts</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {paginatedVideos.length === 0 && (
                <div className="p-8 text-center text-sm font-medium text-gray-400 border-2 border-dashed border-gray-100 rounded-xl flex items-center justify-center">
                  No video assets found.
                </div>
              )}
            </div>
            <PaginationControls page={videosPage} totalPages={pagesVideos} setPage={setVideosPage} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreativesDashboard;
