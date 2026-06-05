import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Crown,
  Info,
  RefreshCcw,
  Search,
  Shield,
  ShoppingBag,
  Target,
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
            Twin Birds vs {competitorDomain} - DataForSEO India market keyword and shopping rank intelligence
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={competitorDomain}
            onChange={(event) => {
              setCompetitorDomain(event.target.value);
              setComparison(null);
            }}
            className="text-xs font-black bg-white border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="gocolors.com">vs Go Colors</option>
            <option value="jockey.in">vs Jockey</option>
            <option value="lymio.com">vs Lymio</option>
            <option value="zivame.com">vs Zivame</option>
            <option value="clovia.com">vs Clovia</option>
          </select>
          <button
            onClick={refreshActiveTab}
            className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-xs font-black text-white hover:bg-gray-800 transition-colors"
          >
            <RefreshCcw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
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
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
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
    <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl p-4">
      <Info size={14} className="text-indigo-500 flex-shrink-0" />
      <p className="text-xs text-indigo-700 font-medium">
        Keywords are ranked by search volume, difficulty, competition, brand protection value, and buying intent.
      </p>
    </div>
    {recommendations.map((rec, index) => (
      <motion.div
        key={rec.keyword}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.02 }}
        className="flex items-start justify-between gap-4 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
      >
        <div className="flex items-start gap-4 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-xs font-black text-gray-600">
            {index + 1}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-black text-gray-900">{rec.keyword}</h4>
              {rec.is_branded && <Badge className="bg-amber-50 text-amber-700 border-amber-200">Branded</Badge>}
              <Badge className={tierColor(rec.opportunity_tier)}>{rec.opportunity_tier} opportunity</Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1 font-medium leading-relaxed">{rec.action_label}</p>
          </div>
        </div>
        <div className="flex items-center gap-6 ml-4 flex-shrink-0 flex-wrap justify-end">
          <MiniMetric label="Volume" value={rec.search_volume.toLocaleString('en-IN')} />
          <MiniMetric label="CPC" value={`Rs ${rec.cpc.toFixed(2)}`} />
          <MiniMetric label="Difficulty" value={`${rec.difficulty} - ${difficultyLabel(rec.difficulty).label}`} className={difficultyLabel(rec.difficulty).color} />
          <MiniMetric label="Est. Revenue" value={`Rs ${(rec.estimated_monthly_revenue || 0).toLocaleString('en-IN')}/mo`} className="text-emerald-700" />
          <Badge className={actionColor(rec.action)}>{(rec.action || 'monitor').replace(/_/g, ' ')}</Badge>
        </div>
      </motion.div>
    ))}
  </div>
);

const InformationalTab: React.FC<{ keywords: KeywordRow[] }> = ({ keywords }) => (
  <div className="space-y-4">
    <p className="text-xs text-gray-500 font-medium bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
      Informational keywords are content and SEO opportunities for blog posts, size guides, how-to videos, and FAQs.
    </p>
    <VolumeChart keywords={keywords} />
    <KeywordTable keywords={keywords} />
  </div>
);

const BuyingTab: React.FC<{ keywords: KeywordRow[]; onShoppingRank: (keyword: string) => void }> = ({ keywords, onShoppingRank }) => (
  <div className="space-y-4">
    <p className="text-xs text-gray-500 font-medium bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
      Buying-intent keywords are direct conversion targets for Google Shopping, Search campaigns, and PMax.
    </p>
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
  </div>
);

const ShoppingRankTab: React.FC<{
  keywords: KeywordRow[];
  loading: boolean;
  selectedKeyword: string;
  results?: ShoppingResult[];
  onSelect: (keyword: string) => void;
}> = ({ keywords, loading, selectedKeyword, results, onSelect }) => (
  <div className="space-y-6">
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
    {selectedKeyword && results && <ShoppingRankTable keyword={selectedKeyword} results={results} />}
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

const ComparisonTab: React.FC<{
  comparison: ComparisonData;
  competitorDomain: string;
  radarData: Array<Record<string, any>>;
}> = ({ comparison, competitorDomain, radarData }) => (
  <div className="space-y-8">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <SummaryCard label="Twin Birds Keywords" value={comparison.summary.my_keyword_count} />
      <SummaryCard label={`${competitorDomain} Keywords`} value={comparison.summary.competitor_keyword_count} />
      <SummaryCard label="Shared Keywords" value={comparison.summary.shared_count} />
      <SummaryCard label="Keyword Gaps" value={comparison.summary.gap_count} />
    </div>

    <div className="h-72 rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={radarData}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 700 }} />
          <Radar name="Twin Birds" dataKey="mine" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.25} />
          <Radar name={competitorDomain} dataKey="comp" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.18} />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>

    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-8 py-6 border-b border-gray-50">
        <h3 className="text-sm font-black text-gray-900">Keyword Gaps - {competitorDomain} ranks, Twin Birds does not</h3>
        <p className="text-xs text-gray-400 mt-1">These are high-priority traffic opportunities to target next.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="text-[9px] font-black uppercase tracking-[2px] text-gray-400 bg-gray-50/50">
              <th className="px-8 py-4 text-left">Keyword</th>
              <th className="px-8 py-4 text-right">Volume</th>
              <th className="px-8 py-4 text-center">Competitor Rank</th>
              <th className="px-8 py-4 text-center">Intent</th>
              <th className="px-8 py-4 text-center">Opportunity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {comparison.gaps.slice(0, 20).map((gap) => (
              <tr key={gap.keyword} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-4 font-bold text-sm text-gray-900">{gap.keyword}</td>
                <td className="px-8 py-4 text-right font-black text-sm text-gray-900">
                  {(gap.search_volume || 0).toLocaleString('en-IN')}
                </td>
                <td className="px-8 py-4 text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-orange-50 text-orange-700 text-xs font-black border border-orange-100">
                    #{gap.rank_absolute || '?'}
                  </span>
                </td>
                <td className="px-8 py-4 text-center">
                  <Badge
                    className={
                      gap.intent === 'buying'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : gap.intent === 'informational'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                    }
                  >
                    {gap.intent || 'generic'}
                  </Badge>
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
);

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
              <td className="px-8 py-5">
                <p className="text-sm font-black text-gray-900">{keyword.keyword}</p>
                {keyword.is_branded && <span className="text-[8px] font-black text-amber-600">Branded</span>}
              </td>
              <td className="px-8 py-5 text-right font-black text-sm text-gray-900">
                {keyword.search_volume.toLocaleString('en-IN')}
              </td>
              <td className="px-8 py-5 text-right font-bold text-sm text-gray-700">Rs {keyword.cpc.toFixed(2)}</td>
              <td className="px-8 py-5 text-center">
                <span className={cn('text-xs font-black', difficulty.color)}>{keyword.difficulty} - {difficulty.label}</span>
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

const ShoppingRankTable: React.FC<{ keyword: string; results: ShoppingResult[] }> = ({ keyword, results }) => {
  const twinBirdsResult = results.find((result) => result.is_twin_birds);

  return (
    <div className="space-y-4">
      <div
        className={cn(
          'rounded-2xl border-2 p-6 flex items-start gap-4',
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
                ? 'Excellent top 3 position. Protect with budget and feed quality.'
                : twinBirdsResult.position <= 10
                  ? 'Visible, but not top 3. Improve product title, image, and PMax budget.'
                  : 'Low visibility. Prioritize product feed fixes and stronger product titles.'
              : 'Twin Birds was not found on Google Shopping. Fix Merchant Center images, product_type, and PMax search themes.'}
          </p>
        </div>
      </div>

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
