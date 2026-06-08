import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Crown,
  Info,
  ExternalLink,
  RefreshCcw,
  Search,
  Shield,
  ShoppingBag,
  Target,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '../../lib/utils';
import { PageLoader } from '../../components/reusable/PageLoader';

const API = (import.meta as any).env?.VITE_SCRAPER_BACKEND_URL || 'http://localhost:8001';

interface KeywordRow {
  keyword: string;
  intent?: string;
  is_branded?: boolean;
  search_volume: number;
  cpc: number;
  competition: number;
  competition_level: string;
  difficulty: number;
  priority_score?: number;
  action?: string;
  action_label?: string;
  opportunity_tier: string;
  estimated_monthly_traffic?: number;
  estimated_monthly_revenue?: number;
}

interface ShoppingResult {
  position: number;
  title: string;
  price: number;
  domain: string;
  url: string;
  image_url: string;
  rating: number;
  reviews_count: number;
  is_twin_birds: boolean;
  is_competitor: boolean;
}

interface ComparisonData {
  shared_keywords: Array<Record<string, any>>;
  gaps: Array<Record<string, any>>;
  strengths: Array<Record<string, any>>;
  summary: Record<string, number>;
}

const TABS = [
  { id: 'recommendations', label: 'Keyword Priorities', icon: Target },
  { id: 'informational', label: 'Informational Keywords', icon: Search },
  { id: 'buying', label: 'Buying Keywords', icon: ShoppingBag },
  { id: 'shopping-rank', label: 'Google Shopping Rank', icon: Crown },
  { id: 'comparison', label: 'vs Competitor', icon: BarChart3 },
];

function tierColor(tier?: string) {
  if (tier === 'high') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (tier === 'medium') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-gray-50 text-gray-500 border-gray-200';
}

function actionColor(action?: string) {
  const map: Record<string, string> = {
    focus_buying: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    focus_informational: 'bg-blue-50 text-blue-700 border-blue-200',
    protect_brand: 'bg-amber-50 text-amber-700 border-amber-200',
    fix_shopping_gap: 'bg-red-50 text-red-700 border-red-200',
    scale_target: 'bg-purple-50 text-purple-700 border-purple-200',
    monitor: 'bg-gray-50 text-gray-500 border-gray-200',
  };
  return map[action || 'monitor'] || map.monitor;
}

function difficultyLabel(difficulty: number) {
  if (difficulty < 20) return { label: 'Very Easy', color: 'text-emerald-600' };
  if (difficulty < 40) return { label: 'Easy', color: 'text-green-600' };
  if (difficulty < 60) return { label: 'Medium', color: 'text-amber-600' };
  if (difficulty < 80) return { label: 'Hard', color: 'text-orange-600' };
  return { label: 'Very Hard', color: 'text-red-600' };
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API}${path}`);
  if (!response.ok) throw new Error(`API error ${response.status}`);
  return response.json();
}

const NoDataState: React.FC<{ setup?: Record<string, string>; tab?: string }> = ({ setup, tab }) => (
  <div className="flex flex-col items-center justify-center h-64 rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-10 text-center">
    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
      <Search size={24} className="text-gray-400" />
    </div>
    <h3 className="text-sm font-black text-gray-700 uppercase tracking-tight mb-2">
      No live data available{tab ? ` for ${tab}` : ''}
    </h3>
    <p className="text-xs text-gray-400 font-medium mb-5 max-w-sm">
      Real data requires a SerpApi key (free tier: 100 searches/month) or a Google Keyword Planner CSV upload.
    </p>
    {setup && (
      <div className="text-left bg-white rounded-2xl border border-gray-200 p-5 w-full max-w-sm">
        <p className="text-[9px] font-black uppercase tracking-[2px] text-gray-400 mb-3">Setup steps</p>
        {Object.entries(setup).map(([key, val]) => (
          <div key={key} className="flex items-start gap-2 mb-2">
            <span className="text-[10px] font-black text-indigo-500 flex-shrink-0">{key.replace('step', '')}.</span>
            <p className="text-[11px] font-medium text-gray-600">{val}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

const BrandComparisonPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('recommendations');
  const [loading, setLoading] = useState(false);
  const [shoppingLoading, setShoppingLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<KeywordRow[]>([]);
  const [infoKeywords, setInfoKeywords] = useState<KeywordRow[]>([]);
  const [buyingKeywords, setBuyingKeywords] = useState<KeywordRow[]>([]);
  const [shoppingResults, setShoppingResults] = useState<Record<string, ShoppingResult[]>>({});
  const [selectedShoppingKw, setSelectedShoppingKw] = useState('');
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [competitorDomain, setCompetitorDomain] = useState('gocolors.com');
  const [summaryRec, setSummaryRec] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  const loadBuyingKeywords = async () => {
    if (buyingKeywords.length > 0) return buyingKeywords;
    const data = await fetchJson<{ keywords: KeywordRow[] }>('/api/keywords/buying');
    setBuyingKeywords(data.keywords || []);
    return data.keywords || [];
  };

  const loadTab = async (tab: string, force = false) => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'recommendations' && (force || recommendations.length === 0)) {
        const data = await fetchJson<{ recommendations: KeywordRow[]; summary: Record<string, any> }>('/api/keywords/recommendations');
        setRecommendations(data.recommendations || []);
        setSummaryRec(data.summary || {});
      }
      if (tab === 'informational' && (force || infoKeywords.length === 0)) {
        const data = await fetchJson<{ keywords: KeywordRow[] }>('/api/keywords/informational');
        setInfoKeywords(data.keywords || []);
      }
      if (tab === 'buying' && (force || buyingKeywords.length === 0)) {
        await loadBuyingKeywords();
      }
      if (tab === 'shopping-rank') {
        await loadBuyingKeywords();
      }
      if (tab === 'comparison' && (force || !comparison)) {
        const data = await fetchJson<ComparisonData>(`/api/keywords/comparison?competitor_domain=${encodeURIComponent(competitorDomain)}`);
        setComparison(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load DataForSEO intelligence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTab('recommendations');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const radarData = useMemo(() => {
    if (!comparison) return [];
    const summary = comparison.summary;
    return [
      { subject: 'Keyword Count', mine: summary.my_keyword_count || 0, comp: summary.competitor_keyword_count || 0 },
      { subject: 'Buying KW', mine: summary.my_buying_keywords || 0, comp: Math.round((summary.competitor_keyword_count || 0) * 0.3) },
      { subject: 'Info KW', mine: summary.my_info_keywords || 0, comp: Math.round((summary.competitor_keyword_count || 0) * 0.4) },
      { subject: 'Shared KW', mine: summary.shared_count || 0, comp: summary.shared_count || 0 },
    ];
  }, [comparison]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    loadTab(tab);
  };

  const refreshActiveTab = () => {
    if (activeTab === 'recommendations') setRecommendations([]);
    if (activeTab === 'informational') setInfoKeywords([]);
    if (activeTab === 'buying') setBuyingKeywords([]);
    if (activeTab === 'comparison') setComparison(null);
    loadTab(activeTab, true);
  };

  const loadShoppingRank = async (keyword: string) => {
    if (shoppingResults[keyword]) {
      setSelectedShoppingKw(keyword);
      return;
    }
    setShoppingLoading(true);
    setError(null);
    try {
      const data = await fetchJson<{ results: ShoppingResult[] }>(`/api/keywords/shopping-rank?keyword=${encodeURIComponent(keyword)}`);
      setShoppingResults((current) => ({ ...current, [keyword]: data.results || [] }));
      setSelectedShoppingKw(keyword);
    } catch (err: any) {
      setError(err.message || 'Failed to load Google Shopping rank');
    } finally {
      setShoppingLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Brand vs Competitor Intelligence</h1>
          <p className="text-gray-400 mt-1 text-sm font-medium">
            {activeTab === 'comparison'
              ? `Twin Birds vs ${competitorDomain} - DataForSEO India market keyword and comparison intelligence`
              : 'Twin Birds - DataForSEO India market keyword and shopping rank intelligence'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'comparison' && (
            <select
              value={competitorDomain}
              onChange={(event) => {
                const newDomain = event.target.value;
                setCompetitorDomain(newDomain);
                setComparison(null);
                if (activeTab === 'comparison') {
                  setLoading(true);
                  setError(null);
                  fetchJson<ComparisonData>(`/api/keywords/comparison?competitor_domain=${encodeURIComponent(newDomain)}`)
                    .then((data) => {
                      setComparison(data);
                      setLoading(false);
                    })
                    .catch((err) => {
                      setError(err.message || 'Failed to load DataForSEO intelligence');
                      setLoading(false);
                    });
                }
              }}
              className="text-xs font-black bg-white border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="gocolors.com">vs Go Colors</option>
              <option value="jockey.in">vs Jockey</option>
              <option value="lymio.com">vs Lymio</option>
              <option value="zivame.com">vs Zivame</option>
              <option value="clovia.com">vs Clovia</option>
              <option value="ajio.com">vs Ajio</option>
              <option value="myntra.com">vs Myntra</option>
            </select>
          )}
          <button
            onClick={refreshActiveTab}
            className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-xs font-black text-white hover:bg-gray-800 transition-colors"
          >
            <RefreshCcw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metric Glossary Banner */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setGlossaryOpen(!glossaryOpen)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Info size={16} />
            </div>
            <div className="text-left">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-950">
                Data Dictionary & Business Glossary
              </h3>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                Understand how search volumes, CPC, ranking difficulty, and keyword gaps help grow your sales.
              </p>
            </div>
          </div>
          <span className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50/50 px-3 py-1.5 rounded-xl border border-indigo-100/50">
            {glossaryOpen ? 'Hide Guide' : 'Show Guide'}
          </span>
        </button>

        {glossaryOpen && (
          <div className="px-6 pb-6 pt-2 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700">Monthly Volume</h4>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                The average number of times people search for this exact phrase on Google each month in India. Target high-volume terms for maximum brand exposure.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700">Cost Per Click (CPC)</h4>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                The average price advertisers pay for a single click in Google Ads. Higher CPC indicates stronger buying intent and high commercial value.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700">SEO Keyword Difficulty</h4>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                A score from 0 to 100 showing how competitive organic search results are. Scores below 40 represent "Quick Wins" where it is easy to rank page 1.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700">Keyword Gaps</h4>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                Keywords where your competitors (e.g. Go Colors, Jockey, Ajio) are ranking in the top organic results on Google, but Twin Birds is currently missing out on.
              </p>
            </div>
          </div>
        )}
      </div>

      {Object.keys(summaryRec).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Quick Wins" value={summaryRec.quick_wins} icon={Zap} color="indigo" />
          <MetricCard label="Content Opportunities" value={summaryRec.content_opportunities} icon={Search} color="blue" />
          <MetricCard label="Brand Keywords" value={summaryRec.brand_keywords} icon={Shield} color="amber" />
          <MetricCard label="Shopping Gaps" value={summaryRec.shopping_gaps} icon={AlertCircle} color="red" />
        </div>
      )}

      <div className="flex items-center p-1 bg-gray-50 border border-gray-100 rounded-2xl shadow-inner w-fit flex-wrap gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-gray-900 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200/50'
            )}
          >
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            {error}. Ensure the backend is running and DataForSEO credentials are set in backend/.env.
          </p>
        </div>
      )}

      {loading ? (
        <PageLoader icon={<Trophy />} gradient="from-indigo-600 to-violet-600" color="indigo" label="Loading keyword intelligence…" />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {activeTab === 'recommendations' && <RecommendationsTab recommendations={recommendations} />}
            {activeTab === 'informational' && <InformationalTab keywords={infoKeywords} />}
            {activeTab === 'buying' && (
              <BuyingTab
                keywords={buyingKeywords}
                onShoppingRank={(keyword) => {
                  setActiveTab('shopping-rank');
                  loadShoppingRank(keyword);
                }}
              />
            )}
            {activeTab === 'shopping-rank' && (
              <ShoppingRankTab
                keywords={buyingKeywords}
                loading={shoppingLoading}
                selectedKeyword={selectedShoppingKw}
                results={selectedShoppingKw ? shoppingResults[selectedShoppingKw] : undefined}
                onSelect={loadShoppingRank}
              />
            )}
            {activeTab === 'comparison' && comparison && (
              <ComparisonTab comparison={comparison} competitorDomain={competitorDomain} radarData={radarData} />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

const MetricCard: React.FC<{
  label: string;
  value: number;
  icon: LucideIcon;
  color: 'indigo' | 'blue' | 'amber' | 'red';
}> = ({ label, value, icon: Icon, color }) => {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('p-2 rounded-xl', colors[color])}>
          <Icon size={16} />
        </div>
        <p className="text-[9px] font-black uppercase tracking-[2px] text-gray-400">{label}</p>
      </div>
      <p className="text-3xl font-black text-gray-900">{value ?? 0}</p>
    </div>
  );
};

const RecommendationsTab: React.FC<{ recommendations: KeywordRow[] }> = ({ recommendations }) => (
  <div className="space-y-4">
    <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 flex items-start gap-4">
      <div className="p-3 rounded-xl bg-indigo-100/60 text-indigo-700 flex-shrink-0">
        <Target size={20} />
      </div>
      <div>
        <h4 className="text-xs font-black uppercase tracking-wider text-indigo-900">High-Impact Target Recommendations</h4>
        <p className="text-xs text-indigo-700/80 mt-1 font-medium leading-relaxed">
          These are priority keywords calculated by merging search traffic, cost per click, and competitors' gaps. Target <strong>Quick Wins</strong> first to capture high volume with low ranking difficulty, and secure <strong>Protect Brand</strong> terms to block competitors from bid-hijacking your brand name.
        </p>
      </div>
    </div>

    {recommendations.length === 0 ? (
      <NoDataState tab="Keyword Priorities" setup={{
        step1: "Get free SerpApi key at serpapi.com (100 searches/month free)",
        step2: "Add SERPAPI_KEY=your_key to backend/.env",
        step3: "Restart the backend server",
        step4: "Click 'Refresh' on this page to load real recommendations"
      }} />
    ) : (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full min-w-[860px] text-left border-collapse">
        <thead>
          <tr className="bg-gray-50/80 border-b border-gray-100">
            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[2px] text-gray-400 w-8">#</th>
            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[2px] text-gray-400">Keyword</th>
            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[2px] text-gray-400 text-center whitespace-nowrap">Tier</th>
            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[2px] text-gray-400 text-right whitespace-nowrap">Volume</th>
            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[2px] text-gray-400 text-right whitespace-nowrap">CPC</th>
            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[2px] text-gray-400 text-center whitespace-nowrap">Difficulty</th>
            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[2px] text-gray-400 text-right whitespace-nowrap">Est. Revenue/mo</th>
            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[2px] text-gray-400 text-center whitespace-nowrap">Action</th>
          </tr>
        </thead>
        <tbody>
          {recommendations.map((rec, index) => (
            <motion.tr
              key={rec.keyword}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className={cn(
                "border-b border-gray-50 hover:bg-indigo-50/30 transition-colors",
                index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
              )}
            >
              {/* # */}
              <td className="px-4 py-3.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-gray-100 text-[10px] font-black text-gray-500">
                  {index + 1}
                </span>
              </td>

              {/* Keyword + badges + action label */}
              <td className="px-4 py-3.5 max-w-[260px]">
                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                  <span className="text-sm font-black text-gray-900">{rec.keyword}</span>
                  {rec.is_branded && (
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[9px] px-1.5 py-0">Branded</Badge>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 font-medium leading-snug">{rec.action_label}</p>
              </td>

              {/* Tier */}
              <td className="px-4 py-3.5 text-center">
                <Badge className={tierColor(rec.opportunity_tier)}>
                  {rec.opportunity_tier}
                </Badge>
              </td>

              {/* Volume */}
              <td className="px-4 py-3.5 text-right">
                <span className="text-sm font-black text-gray-800 tabular-nums">
                  {rec.search_volume.toLocaleString('en-IN')}
                </span>
              </td>

              {/* CPC */}
              <td className="px-4 py-3.5 text-right">
                <span className="text-sm font-bold text-gray-700 tabular-nums">
                  ₹{rec.cpc.toFixed(2)}
                </span>
              </td>

              {/* Difficulty with bar */}
              <td className="px-4 py-3.5">
                <div className="flex flex-col items-center gap-1 min-w-[72px]">
                  <span className={cn('text-sm font-black tabular-nums', difficultyLabel(rec.difficulty).color)}>
                    {rec.difficulty}
                  </span>
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        rec.difficulty < 20 ? 'bg-emerald-500' :
                        rec.difficulty < 40 ? 'bg-green-500' :
                        rec.difficulty < 60 ? 'bg-amber-500' :
                        rec.difficulty < 80 ? 'bg-orange-500' : 'bg-red-500'
                      )}
                      style={{ width: `${rec.difficulty}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-gray-400 font-semibold">{difficultyLabel(rec.difficulty).label}</span>
                </div>
              </td>

              {/* Est. Revenue */}
              <td className="px-4 py-3.5 text-right">
                <span className="text-sm font-black text-emerald-700 tabular-nums">
                  ₹{(rec.estimated_monthly_revenue || 0).toLocaleString('en-IN')}
                </span>
              </td>

              {/* Action */}
              <td className="px-4 py-3.5 text-center">
                <Badge className={actionColor(rec.action)}>
                  {(rec.action || 'monitor').replace(/_/g, ' ')}
                </Badge>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
    )}
  </div>
);

const InformationalTab: React.FC<{ keywords: KeywordRow[] }> = ({ keywords }) => (
  <div className="space-y-4">
    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 flex items-start gap-4">
      <div className="p-3 rounded-xl bg-blue-100/60 text-blue-700 flex-shrink-0">
        <Search size={20} />
      </div>
      <div>
        <h4 className="text-xs font-black uppercase tracking-wider text-blue-900">Informational Search Intent Opportunities</h4>
        <p className="text-xs text-blue-700/80 mt-1 font-medium leading-relaxed">
          Customers search these queries when they are looking for answers, style guides, size charts, or styling ideas (e.g. "how to style leggings with kurti"). We recommend writing blogs, styling guides, or adding product page FAQs to capture this massive pool of free, top-of-funnel search traffic.
        </p>
      </div>
    </div>
    {keywords.length === 0 ? (
      <NoDataState tab="Informational Keywords" />
    ) : (
      <>
        <VolumeChart keywords={keywords} />
        <KeywordTable keywords={keywords} />
      </>
    )}
  </div>
);

const BuyingTab: React.FC<{ keywords: KeywordRow[]; onShoppingRank: (keyword: string) => void }> = ({ keywords, onShoppingRank }) => (
  <div className="space-y-4">
    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 flex items-start gap-4">
      <div className="p-3 rounded-xl bg-emerald-100/60 text-emerald-700 flex-shrink-0">
        <ShoppingBag size={20} />
      </div>
      <div>
        <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950">High Commercial Value Buying Keywords</h4>
        <p className="text-xs text-emerald-800/80 mt-1 font-medium leading-relaxed">
          These keywords are searched by customers who have their wallets ready and intend to buy immediately (e.g. "buy leggings online"). Add these terms as search themes in your Google Performance Max (PMax) campaigns and optimize product descriptions to increase conversions.
        </p>
      </div>
    </div>
    {keywords.length === 0 ? (
      <NoDataState tab="Buying Keywords" />
    ) : (
      <>
        <div className="flex flex-wrap gap-2">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 w-full mt-2 mb-1">
            Click a keyword to check Google Shopping rank
          </p>
          {keywords.slice(0, 20).map((keyword) => (
            <button
              key={keyword.keyword}
              onClick={() => onShoppingRank(keyword.keyword)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
            >
              {keyword.keyword}
              <ArrowRight size={10} />
            </button>
          ))}
        </div>
        <KeywordTable keywords={keywords} />
      </>
    )}
  </div>
);

const ShoppingRankTab: React.FC<{
  keywords: KeywordRow[];
  loading: boolean;
  selectedKeyword: string;
  results?: ShoppingResult[];
  onSelect: (keyword: string) => void;
}> = ({ keywords, loading, selectedKeyword, results, onSelect }) => {
  const [shoppingView, setShoppingView] = useState<'visual' | 'table'>('visual');

  return (
    <div className="space-y-6">
      <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 flex items-start gap-4">
        <div className="p-3 rounded-xl bg-amber-100/60 text-amber-700 flex-shrink-0">
          <Crown size={20} />
        </div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-amber-950">Google Shopping Shelf Visibility Analyzer</h4>
          <p className="text-xs text-amber-800/80 mt-1 font-medium leading-relaxed">
            Google Shopping displays direct product listings at the top of search result pages. Ranking in the top 3 positions is critical: it yields over 65% of all shopping clicks. Select a buying keyword from the list below to check where Twin Birds stands on the virtual shelf.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 w-full">
          Select a buying keyword to check Google Shopping rank
        </p>
        {keywords.slice(0, 20).map((keyword) => (
          <button
            key={keyword.keyword}
            onClick={() => onSelect(keyword.keyword)}
            className={cn(
              'text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors',
              selectedKeyword === keyword.keyword
                ? 'bg-gray-900 text-white border-gray-900'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
            )}
          >
            {keyword.keyword}
          </button>
        ))}
      </div>
      {loading && <div className="animate-pulse h-32 bg-gray-100 rounded-2xl" />}
      {selectedKeyword && results && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Search Results Layout</h3>
              <a 
                href={`https://www.google.co.in/search?q=${encodeURIComponent(selectedKeyword)}&tbm=shop&gl=in&hl=en`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-gray-50 hover:text-indigo-600 transition-colors shadow-sm"
              >
                Verify Live on Google Shopping <ExternalLink size={10} />
              </a>
            </div>
            <div className="flex p-0.5 bg-gray-100 border border-gray-200 rounded-xl w-fit">
              <button
                onClick={() => setShoppingView('visual')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                  shoppingView === 'visual' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-700"
                )}
              >
                Visual Shelf View
              </button>
              <button
                onClick={() => setShoppingView('table')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                  shoppingView === 'table' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-700"
                )}
              >
                Table Detail View
              </button>
            </div>
          </div>
          <ShoppingRankTable keyword={selectedKeyword} results={results} viewType={shoppingView} />
        </div>
      )}
      {!selectedKeyword && (
        <div className="flex items-center justify-center h-48 text-gray-300">
          <div className="text-center">
            <Crown size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-xs font-black uppercase tracking-widest">Select a keyword above to check Google Shopping rank</p>
          </div>
        </div>
      )}
    </div>
  );
};

const generateAdvisory = (domain: string, summary: Record<string, number>, gaps: Array<Record<string, any>>) => {
  const gapCount = summary.gap_count || 0;
  const sharedCount = summary.shared_count || 0;
  const topGaps = gaps.slice(0, 3).map(g => `"${g.keyword}"`).join(', ');

  let advice = '';
  let actionItem = '';

  if (domain.includes('gocolors')) {
    advice = `Go Colors is highly dominant in leggings. They currently rank for ${gapCount} high-volume keywords where Twin Birds does not rank, particularly in churidar and cotton leggings.`;
    actionItem = `Action Plan: Optimize your landing pages and product copy for ${topGaps} to capture their search traffic.`;
  } else if (domain.includes('jockey')) {
    advice = `Jockey holds a strong grip on premium activewear and gym apparel. You share ${sharedCount} keywords, but Jockey ranks for ${gapCount} keywords in comfort fit and gym wear.`;
    actionItem = `Action Plan: Create specialized collections or blog guides targeting ${topGaps} to rank organically and build brand authority.`;
  } else if (domain.includes('zivame')) {
    advice = `Zivame stands out in saree shapers and petticoats. They have ${gapCount} keyword gaps where they are capturing ready-to-buy traffic from saree wearers.`;
    actionItem = `Action Plan: Run direct shopping campaigns and highlight comfort features for keywords like ${topGaps}.`;
  } else if (domain.includes('clovia')) {
    advice = `Clovia has high volume in budget activewear and sports bras, ranking for ${gapCount} gaps over Twin Birds.`;
    actionItem = `Action Plan: Focus on bid adjustments for competitive shopping feeds targeting ${topGaps}.`;
  } else if (domain.includes('lymio')) {
    advice = `Lymio is leveraging styling guides and kurti pairings to rank for ${gapCount} keywords where we are invisible.`;
    actionItem = `Action Plan: Boost your informational content strategy with styling blogs using keywords like ${topGaps}.`;
  } else {
    advice = `${domain} ranks for ${gapCount} keywords that Twin Birds does not target, representing immediate traffic expansion opportunities.`;
    actionItem = `Action Plan: Target these high-opportunity gaps (${topGaps}) in your SEO roadmap.`;
  }

  return { advice, actionItem };
};

const ComparisonTab: React.FC<{
  comparison: ComparisonData;
  competitorDomain: string;
  radarData: Array<Record<string, any>>;
}> = ({ comparison, competitorDomain, radarData }) => {
  const advisory = useMemo(() => {
    return generateAdvisory(competitorDomain, comparison.summary, comparison.gaps);
  }, [competitorDomain, comparison]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-6 flex items-start gap-4">
        <div className="p-3 rounded-xl bg-orange-100/60 text-orange-700 flex-shrink-0">
          <BarChart3 size={20} />
        </div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-orange-950">Twin Birds vs {competitorDomain} Keyword Share & Gaps</h4>
          <p className="text-xs text-orange-800/80 mt-1 font-medium leading-relaxed">
            This dashboard compares your organic search presence against **{competitorDomain}**. The **Keyword Gaps** section highlights keywords where {competitorDomain} ranks in search results but Twin Birds does not. Targeting these gaps is the fastest way to win back market share.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Twin Birds Keywords" value={comparison.summary.my_keyword_count} />
        <SummaryCard label={`${competitorDomain} Keywords`} value={comparison.summary.competitor_keyword_count} />
        <SummaryCard label="Shared Keywords" value={comparison.summary.shared_count} />
        <SummaryCard label="Keyword Gaps" value={comparison.summary.gap_count} />
      </div>

      {/* Strategic Advisory Card */}
      <div className="bg-gradient-to-r from-indigo-950 to-slate-900 text-white rounded-3xl p-8 shadow-xl border border-indigo-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl text-left">
          <div className="flex items-center gap-2 text-indigo-400">
            <Zap size={16} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[3px]">Strategic SEO Advisory</span>
          </div>
          <p className="text-base font-bold text-slate-100 leading-relaxed">
            {advisory.advice}
          </p>
          <p className="text-xs text-indigo-300 font-semibold leading-relaxed">
            {advisory.actionItem}
          </p>
        </div>
        <div className="bg-indigo-800/30 border border-indigo-700/30 rounded-2xl px-6 py-4 flex-shrink-0 text-center">
          <p className="text-[8px] font-black uppercase tracking-widest text-indigo-400">Traffic Potential</p>
          <p className="text-2xl font-black text-white mt-1">
            +{((comparison.gaps.slice(0, 5).reduce((acc, curr) => acc + (curr.search_volume || 0), 0)) * 0.05).toFixed(0)} / mo
          </p>
          <p className="text-[9px] font-medium text-slate-400 mt-1">Est. new organic clicks</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 h-72 rounded-2xl border border-gray-100 bg-white shadow-sm p-6 flex flex-col justify-between">
          <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-400">Overlap Profile Chart</h4>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fontWeight: 700 }} />
                <Radar name="Twin Birds" dataKey="mine" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.25} />
                <Radar name={competitorDomain} dataKey="comp" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.18} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="px-8 py-6 border-b border-gray-50 text-left">
            <h3 className="text-sm font-black text-gray-900">Keyword Gaps - {competitorDomain} ranks, Twin Birds does not</h3>
            <p className="text-xs text-gray-400 mt-1">These are high-priority traffic opportunities to target next.</p>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="text-[9px] font-black uppercase tracking-[2px] text-gray-400 bg-gray-50/50">
                  <th className="px-8 py-4 text-left">Keyword</th>
                  <th className="px-8 py-4 text-right">Volume</th>
                  <th className="px-8 py-4 text-center">Competitor Rank</th>
                  <th className="px-8 py-4 text-center">Opportunity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {comparison.gaps.slice(0, 10).map((gap) => (
                  <tr key={gap.keyword} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-4 font-bold text-sm text-gray-900 text-left">{gap.keyword}</td>
                    <td className="px-8 py-4 text-right font-black text-sm text-gray-900">
                      {(gap.search_volume || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-8 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-orange-50 text-orange-700 text-xs font-black border border-orange-100">
                        #{gap.rank_absolute || '?'}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <Badge className={tierColor(gap.opportunity_tier)}>{gap.opportunity_tier || 'low'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const VolumeChart: React.FC<{ keywords: KeywordRow[] }> = ({ keywords }) => (
  <div className="h-64 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={keywords.slice(0, 12)} margin={{ top: 5, right: 20, left: 0, bottom: 70 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="keyword" tick={{ fontSize: 9, fontWeight: 700 }} angle={-35} textAnchor="end" interval={0} />
        <YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => value >= 1000 ? `${(Number(value) / 1000).toFixed(0)}K` : `${value}`} />
        <Tooltip
          formatter={(value: number) => [value.toLocaleString('en-IN'), 'Monthly Searches']}
          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.08)' }}
        />
        <Bar dataKey="search_volume" radius={[4, 4, 0, 0]}>
          {keywords.slice(0, 12).map((keyword, index) => <Cell key={keyword.keyword} fill={index < 4 ? '#4f46e5' : '#a5b4fc'} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

const KeywordTable: React.FC<{ keywords: KeywordRow[] }> = ({ keywords }) => (
  <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
    <table className="w-full min-w-[920px] text-left">
      <thead>
        <tr className="bg-gray-50/50 text-[9px] font-black uppercase tracking-[2px] text-gray-400">
          <th className="px-8 py-5">Keyword</th>
          <th className="px-8 py-5 text-right">Monthly Volume</th>
          <th className="px-8 py-5 text-right">CPC</th>
          <th className="px-8 py-5 text-center">Difficulty</th>
          <th className="px-8 py-5 text-center">Competition</th>
          <th className="px-8 py-5 text-center">Opportunity</th>
          <th className="px-8 py-5 text-right">Est. Traffic</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {keywords.map((keyword, index) => {
          const difficulty = difficultyLabel(keyword.difficulty);
          return (
            <motion.tr
              key={keyword.keyword}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.015 }}
              className="hover:bg-gray-50/50 transition-colors"
            >
              <td className="px-8 py-5 text-left">
                <p className="text-sm font-black text-gray-900">{keyword.keyword}</p>
                {keyword.is_branded && <span className="text-[8px] font-black text-amber-600">Branded</span>}
              </td>
              <td className="px-8 py-5 text-right font-black text-sm text-gray-900">
                {keyword.search_volume.toLocaleString('en-IN')}
              </td>
              <td className="px-8 py-5 text-right font-bold text-sm text-gray-700">Rs {keyword.cpc.toFixed(2)}</td>
              <td className="px-8 py-5">
                <div className="flex flex-col gap-1 items-center justify-center min-w-[120px]">
                  <span className={cn('text-xs font-black', difficulty.color)}>
                    {keyword.difficulty} - {difficulty.label}
                  </span>
                  <div className="w-24 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        keyword.difficulty < 20 ? 'bg-emerald-500' :
                        keyword.difficulty < 40 ? 'bg-green-500' :
                        keyword.difficulty < 60 ? 'bg-amber-500' :
                        keyword.difficulty < 80 ? 'bg-orange-500' : 'bg-red-500'
                      )}
                      style={{ width: `${keyword.difficulty}%` }}
                    />
                  </div>
                </div>
              </td>
              <td className="px-8 py-5 text-center">
                <Badge
                  className={
                    keyword.competition_level === 'LOW'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : keyword.competition_level === 'MEDIUM'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                  }
                >
                  {keyword.competition_level}
                </Badge>
              </td>
              <td className="px-8 py-5 text-center">
                <Badge className={tierColor(keyword.opportunity_tier)}>{keyword.opportunity_tier}</Badge>
              </td>
              <td className="px-8 py-5 text-right font-bold text-sm text-indigo-700">
                {(keyword.estimated_monthly_traffic || 0).toLocaleString('en-IN')}
              </td>
            </motion.tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const ShoppingRankTable: React.FC<{ keyword: string; results: ShoppingResult[]; viewType: 'visual' | 'table' }> = ({ keyword, results, viewType }) => {
  const twinBirdsResult = results.find((result) => result.is_twin_birds);

  return (
    <div className="space-y-4">
      <div
        className={cn(
          'rounded-2xl border-2 p-6 flex items-start gap-4 text-left',
          twinBirdsResult
            ? twinBirdsResult.position <= 5
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-amber-200 bg-amber-50'
            : 'border-red-200 bg-red-50'
        )}
      >
        <div
          className={cn(
            'text-3xl font-black',
            twinBirdsResult
              ? twinBirdsResult.position <= 5 ? 'text-emerald-600' : 'text-amber-600'
              : 'text-red-600'
          )}
        >
          {twinBirdsResult ? `#${twinBirdsResult.position}` : '-'}
        </div>
        <div>
          <p className="font-black text-gray-900">Twin Birds on Google Shopping for "{keyword}"</p>
          <p className="text-sm text-gray-600 mt-1">
            {twinBirdsResult
              ? twinBirdsResult.position <= 3
                ? 'Excellent top 3 position. Protect with stable budget and product feed quality.'
                : twinBirdsResult.position <= 10
                  ? 'Visible, but not top 3. Improve product title, product image, and PMax budget.'
                  : 'Low visibility. Prioritize product feed fixes and stronger product titles.'
              : 'Twin Birds was not found on Google Shopping. Fix Merchant Center images, product_type, and PMax search themes.'}
          </p>
        </div>
      </div>

      {viewType === 'visual' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {results.map((result, index) => {
            const isTwin = result.is_twin_birds;
            const isComp = result.is_competitor;
            
            return (
              <a
                key={`${result.domain}-${result.position}-${index}`}
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "group relative bg-white rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
                  isTwin 
                    ? "border-indigo-500 ring-2 ring-indigo-500/5 bg-indigo-50/10 scale-[1.01]" 
                    : isComp 
                      ? "border-orange-200 bg-orange-50/10" 
                      : "border-gray-100"
                )}
              >
                <div className={cn(
                  "absolute top-3 left-3 z-10 flex h-7 w-7 items-center justify-center rounded-xl text-xs font-black shadow-sm",
                  result.position === 1 ? "bg-amber-500 text-white" :
                  result.position <= 3 ? "bg-indigo-600 text-white" : "bg-gray-800 text-white"
                )}>
                  {result.position}
                </div>

                {/* External link icon on hover */}
                <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white/90 backdrop-blur-sm text-gray-600 rounded-lg p-1 shadow-sm border border-gray-100">
                    <ArrowRight size={10} className="-rotate-45" />
                  </div>
                </div>

                <div className={cn(
                  "h-40 w-full relative flex items-center justify-center border-b overflow-hidden",
                  isTwin ? "bg-indigo-50 border-indigo-100" :
                  isComp ? "bg-orange-50/50 border-orange-100" : "bg-gray-50 border-gray-100"
                )}>
                  {isTwin ? (
                    <Crown size={36} className="text-indigo-400 animate-pulse" />
                  ) : (
                    <ShoppingBag size={36} className={cn("opacity-40", isComp ? "text-orange-400" : "text-gray-400")} />
                  )}
                  <div className="absolute bottom-2 right-2">
                    {isTwin && <span className="bg-indigo-600 text-white text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Twin Birds</span>}
                    {isComp && <span className="bg-orange-500 text-white text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Competitor</span>}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between gap-3 text-left">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 truncate">{result.domain}</p>
                    <h4 className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                      {result.title}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-gray-50 pt-3 mt-auto">
                    <span className="text-sm font-black text-gray-900">Rs {result.price.toLocaleString('en-IN')}</span>
                    {result.rating > 0 && (
                      <div className="flex items-center gap-0.5 text-amber-500 font-bold text-[10px]">
                        <span>★</span>
                        <span className="text-gray-600 text-[9px]">{result.rating} ({result.reviews_count})</span>
                      </div>
                    )}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="bg-gray-50/50 text-[9px] font-black uppercase tracking-[2px] text-gray-400">
                <th className="px-8 py-5">Pos</th>
                <th className="px-8 py-5">Product</th>
                <th className="px-8 py-5">Domain</th>
                <th className="px-8 py-5 text-right">Price</th>
                <th className="px-8 py-5 text-right">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {results.map((result, index) => (
                <tr key={`${result.domain}-${result.position}-${index}`} className={cn('hover:bg-gray-50/50 transition-colors', result.is_twin_birds && 'bg-indigo-50/50 border-l-2 border-indigo-500')}>
                  <td className="px-8 py-4">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black',
                        result.position === 1
                          ? 'bg-amber-50 text-amber-600 border border-amber-200'
                          : result.position <= 3
                            ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                            : 'bg-gray-50 text-gray-500 border border-gray-100'
                      )}
                    >
                      {result.is_twin_birds ? <Crown size={14} /> : result.position}
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-sm font-bold text-gray-900 max-w-xs truncate">{result.title}</p>
                    {result.is_twin_birds && <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">Twin Birds</span>}
                    {result.is_competitor && <span className="text-[8px] font-black text-orange-600 uppercase tracking-widest">Competitor</span>}
                  </td>
                  <td className="px-8 py-4 text-xs font-medium text-gray-600">{result.domain}</td>
                  <td className="px-8 py-4 text-right font-black text-sm text-gray-900">Rs {result.price.toLocaleString('en-IN')}</td>
                  <td className="px-8 py-4 text-right text-xs font-medium text-gray-600">
                    {result.rating > 0 ? `${result.rating} (${result.reviews_count})` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const SummaryCard: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
    <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">{label}</p>
    <p className="text-3xl font-black text-gray-900 mt-2">{value ?? 0}</p>
  </div>
);

const MiniMetric: React.FC<{ label: string; value: string; className?: string }> = ({ label, value, className }) => (
  <div className="text-right">
    <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">{label}</p>
    <p className={cn('text-sm font-black text-gray-900', className)}>{value}</p>
  </div>
);

const Badge: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span className={cn('text-[8px] font-black px-2 py-1 rounded-full border uppercase tracking-widest', className)}>
    {children}
  </span>
);

export default BrandComparisonPage;
