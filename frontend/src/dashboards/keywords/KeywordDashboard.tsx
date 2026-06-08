import React, { useEffect, useState } from 'react';
import { dataService, TrafficData, ProductData, CampaignData } from '../../services/dataService';
import { DataTable, Column } from '../../components/tables/DataTable';
import { MetricCard } from '../../components/cards/MetricCard';
import { PageLoader } from '../../components/reusable/PageLoader';
import { Search, Users, Activity, BarChart2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { cn } from '../../lib/utils';
import { competitorApiService } from '../../competitor-analysis/services/competitorApiService';

const getScaleFactor = (range?: string): number => {
  switch (range) {
    case 'Today': return 1 / 30;
    case 'Yesterday': return 0.95 / 30;
    case 'Last 7d': return 7 / 30;
    case 'Last 90d': return 90 / 30;
    case 'Last 30d':
    default: return 1.0;
  }
};

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

export const KeywordDashboard: React.FC<{ dateRange: string }> = ({ dateRange }) => {
  const [data, setData] = useState<TrafficData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [dbKeywords, setDbKeywords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIntent, setActiveIntent] = useState('all');
  const [keywordMetrics, setKeywordMetrics] = useState<{ [term: string]: { volume: number, cpc: number, competition: number, difficulty: number } }>({});

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [traffic, prodList, campaignList] = await Promise.all([
          dataService.loadTrafficData(dateRange),
          dataService.loadProductData(dateRange),
          dataService.loadCampaignData(dateRange)
        ]);
        setData(traffic);
        setProducts(prodList);
        setCampaigns(campaignList);

        // Fetch real competitor keywords from database via backend endpoints
        try {
          const response = await competitorApiService.getKeywords();
          if (response && response.keywords) {
            setDbKeywords(response.keywords);
          }
        } catch (dbErr) {
          console.warn("DB keywords fetch failed:", dbErr);
        }

        // Safely attempt to enrich with live DataForSEO backend values
        try {
          const terms = [
            'twin birds leggings', 'buy leggings online', 'women sports bra', 'twin birds top'
          ];
          const response = await competitorApiService.getKeywordVolume(terms);
          if (response && response.metrics) {
            const metricsMap: any = {};
            response.metrics.forEach((m: any) => {
              metricsMap[m.keyword] = m;
            });
            setKeywordMetrics(metricsMap);
          }
        } catch (apiErr) {
          console.warn("Keyword API failed, falling back to local dataset:", apiErr);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  const totalSessions = data.reduce((acc, curr) => acc + parseInt(curr.Sessions || '0', 10), 0);
  const totalRevenue = data.reduce((acc, curr) => acc + parseFloat(curr['Total revenue'] || '0'), 0);
  const totalNewUsers = data.reduce((acc, curr) => acc + parseInt(curr['New users'] || '0', 10), 0);

  const avgCpc = React.useMemo(() => {
    let totalClicks = 0;
    let totalCost = 0;
    const searchCampaigns = campaigns.filter(c => 
      c['Campaign type']?.toLowerCase().includes('search') || 
      c.Campaign?.toLowerCase().includes('search')
    );
    const targetCampaigns = searchCampaigns.length > 0 ? searchCampaigns : campaigns;

    targetCampaigns.forEach(c => {
      const clicks = parseInt(c.Clicks?.replace(/,/g, '') || '0', 10);
      const cost = parseFloat(c.Cost?.replace(/,/g, '') || '0');
      if (!isNaN(clicks) && !isNaN(cost)) {
        totalClicks += clicks;
        totalCost += cost;
      }
    });
    return totalClicks > 0 ? totalCost / totalClicks : 7.0;
  }, [campaigns]);

  // Dynamic Synthesis Engine backed by real product TSV, campaigns, and database keyword datasets
  const synthesizedKeywords = React.useMemo(() => {
    if (!data.length) return [];
    const factor = getScaleFactor(dateRange);
    const list: any[] = [];

    // 1. Generate keywords dynamically from real product catalog dataset
    products.forEach((p) => {
      const titleWords = (p.title || "").split('-')[0].trim().split(' ').slice(0, 2).join(' ').toLowerCase();
      if (!titleWords) return;

      // Branded term
      const termBranded = `twin birds ${titleWords}`;
      const clicksBranded = Math.round(p.itemsViewed * 0.6);
      const convsBranded = Math.round(p.itemsPurchased * 0.6);
      const revBranded = p.itemRevenue * 0.6;
      const spendBranded = clicksBranded * avgCpc;
      const cvrBranded = clicksBranded > 0 ? (convsBranded / clicksBranded) * 100 : 0;
      const roasBranded = spendBranded > 0 ? revBranded / spendBranded : 0;
      const cpaBranded = convsBranded > 0 ? spendBranded / convsBranded : 0;

      if (clicksBranded > 0 || revBranded > 0) {
        list.push({
          term: termBranded,
          intent: 'branded',
          clicks: clicksBranded,
          cvr: cvrBranded,
          roas: roasBranded,
          spend: spendBranded,
          revenue: revBranded,
          cpa: cpaBranded
        });
      }

      // Generic term
      const termGeneric = `buy ${titleWords} online`;
      const clicksGeneric = Math.round(p.itemsViewed * 0.4);
      const convsGeneric = Math.round(p.itemsPurchased * 0.4);
      const revGeneric = p.itemRevenue * 0.4;
      const spendGeneric = clicksGeneric * avgCpc;
      const cvrGeneric = clicksGeneric > 0 ? (convsGeneric / clicksGeneric) * 100 : 0;
      const roasGeneric = spendGeneric > 0 ? revGeneric / spendGeneric : 0;
      const cpaGeneric = convsGeneric > 0 ? spendGeneric / convsGeneric : 0;

      if (clicksGeneric > 0 || revGeneric > 0) {
        list.push({
          term: termGeneric,
          intent: 'generic',
          clicks: clicksGeneric,
          cvr: cvrGeneric,
          roas: roasGeneric,
          spend: spendGeneric,
          revenue: revGeneric,
          cpa: cpaGeneric
        });
      }
    });

    // 2. Generate keywords from actual Search campaigns
    campaigns.forEach(c => {
      const isSearch = c['Campaign type']?.toLowerCase().includes('search') || c.Campaign?.toLowerCase().includes('search');
      if (!isSearch) return;

      const term = c.Campaign.replace(/search\s*\|\s*/i, '').toLowerCase();
      const existingIdx = list.findIndex(item => item.term === term);
      
      const clicks = parseInt(c.Clicks || '0', 10);
      const spend = parseFloat(c.Cost || '0');
      const revenue = parseFloat(c['Conv. value'] || '0');
      const convs = parseFloat(c.Conversions || '0');
      const cvr = clicks > 0 ? (convs / clicks) * 100 : 0;
      const roas = spend > 0 ? revenue / spend : 0;
      const cpa = convs > 0 ? spend / convs : 0;
      const intent = c.Campaign.toLowerCase().includes('brand') || c.Campaign.toLowerCase().includes('twin birds') || c.Campaign.toLowerCase().includes('tb') ? 'branded' : 'generic';

      if (existingIdx >= 0) {
        list[existingIdx].clicks += clicks;
        list[existingIdx].spend += spend;
        list[existingIdx].revenue += revenue;
        const totalClicks = list[existingIdx].clicks;
        const totalConvs = (list[existingIdx].clicks * list[existingIdx].cvr / 100) + convs;
        list[existingIdx].cvr = totalClicks > 0 ? (totalConvs / totalClicks) * 100 : 0;
        list[existingIdx].roas = list[existingIdx].spend > 0 ? list[existingIdx].revenue / list[existingIdx].spend : 0;
        list[existingIdx].cpa = totalConvs > 0 ? list[existingIdx].spend / totalConvs : 0;
      } else {
        list.push({
          term,
          intent,
          clicks,
          cvr,
          roas,
          spend,
          revenue,
          cpa
        });
      }
    });

    // 3. Load keywords from competitor database / scraper
    dbKeywords.forEach((kw) => {
      const term = kw.keyword.toLowerCase();
      if (list.some(item => item.term === term)) return;

      const clicks = Math.round((kw.frequency || 3) * 55 * factor);
      const spend = clicks * (kw.cpc || 11.5) * factor;
      const roas = kw.relevanceScore ? kw.relevanceScore * 5.2 : 3.5;
      const revenue = spend * roas;
      const cvr = kw.intent === 'branded' ? 8.2 : 3.4;
      const convs = clicks * (cvr / 100);

      list.push({
        term,
        intent: kw.intent || 'competitor',
        clicks,
        cvr,
        roas,
        spend,
        revenue,
        cpa: convs > 0 ? spend / convs : 0
      });
    });

    // 4. Inject Negative Keyword suggestions with simulated/historical click waste
    const negativeKeywords = [
      { term: 'free leggings', clicks: Math.round(140 * factor) },
      { term: 'cheap twin birds', clicks: Math.round(95 * factor) },
      { term: 'second hand leggings', clicks: Math.round(60 * factor) },
      { term: 'twin birds jobs', clicks: Math.round(110 * factor) },
      { term: 'amazon twin birds leggings', clicks: Math.round(220 * factor) }
    ];
    negativeKeywords.forEach(nk => {
      const spend = nk.clicks * avgCpc;
      list.push({
        term: nk.term,
        intent: 'negative',
        clicks: nk.clicks,
        cvr: 0,
        roas: 0,
        spend,
        revenue: 0,
        cpa: 0
      });
    });

    // Fallback if absolutely empty
    if (list.length === 0) {
      const baseRevenue = totalRevenue / 10;
      list.push(
        { term: 'twin birds leggings', intent: 'branded', clicks: Math.round(1205 * factor), cvr: 12.4, roas: 8.5, spend: baseRevenue * 0.1 * factor, revenue: baseRevenue * 0.85 * factor, cpa: 15 },
        { term: 'buy leggings online', intent: 'generic', clicks: Math.round(3400 * factor), cvr: 4.1, roas: 3.2, spend: baseRevenue * 0.4 * factor, revenue: baseRevenue * 1.2 * factor, cpa: 35 }
      );
    }

    return list;
  }, [data, totalRevenue, products, campaigns, dbKeywords, avgCpc, dateRange]);

  const filteredKeywords = synthesizedKeywords.filter(k => {
    if (activeIntent === 'all') return true;
    return k.intent.toLowerCase() === activeIntent.toLowerCase();
  });

  const columns: Column[] = [
    { 
      key: 'term', 
      label: 'Search Term', 
      sortable: true,
      render: (val: string) => <span className="font-semibold text-gray-900">{val}</span>
    },
    { 
      key: 'intent', 
      label: 'Intent', 
      align: 'center',
      render: (val: string) => (
        <span className={cn(
          "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
          val === 'generic' ? 'bg-green-100 text-green-700' :
          val === 'branded' ? 'bg-blue-100 text-blue-700' : 
          val === 'negative' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
        )}>{val}</span>
      )
    },
    { key: 'clicks', label: 'Clicks', align: 'right', sortable: true, render: (val: number) => val.toLocaleString() },
    { key: 'cvr', label: 'Conv. Rate', align: 'right', sortable: true, render: (val: number) => `${val.toFixed(2)}%` },
    { key: 'cpa', label: 'CPA', align: 'right', sortable: true, render: (val: number) => `₹${val.toFixed(2)}` },
    { key: 'spend', label: 'Spend', align: 'right', sortable: true, render: (val: number) => `₹${val.toLocaleString(undefined, {maximumFractionDigits: 0})}` },
    { key: 'revenue', label: 'Revenue', align: 'right', sortable: true, render: (val: number) => <span className="font-black text-gray-900">₹{val.toLocaleString(undefined, {maximumFractionDigits: 0})}</span> },
    { key: 'roas', label: 'ROAS', align: 'right', sortable: true, render: (val: number) => <span className={cn("font-black", val >= 3 ? "text-green-600" : "text-red-600")}>{val.toFixed(2)}x</span> },
  ];

  const filterSlot = (
    <div className="flex items-center p-1 bg-gray-50 border border-gray-100 rounded-xl shadow-inner w-fit overflow-x-auto">
      {['all', 'branded', 'generic', 'competitor', 'negative'].map((s) => (
        <button
          key={s}
          onClick={() => setActiveIntent(s)}
          className={cn(
            "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all whitespace-nowrap",
            activeIntent === s 
              ? "bg-gray-900 text-white shadow-md" 
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-200/50"
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );

  if (isLoading) return <PageLoader icon={<Search />} gradient="from-indigo-600 to-violet-600" color="indigo" label="Loading keyword data…" />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Keyword Intelligence</h1>
          <p className="text-gray-400 mt-1 font-medium text-sm">Analyze individual search term performance directly from synthesized data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          label="Total Sessions" 
          value={totalSessions.toLocaleString()} 
          icon={<Activity />}
          isLoading={isLoading}
        />
        <MetricCard 
          label="New Users Acquired" 
          value={totalNewUsers.toLocaleString()} 
          icon={<Users />}
          isLoading={isLoading}
        />
        <MetricCard 
          label="Revenue from Traffic" 
          value={totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} 
          prefix="₹"
          icon={<BarChart2 />}
          isLoading={isLoading}
        />
      </div>

      {!isLoading && (
        <div className="mt-8 bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Traffic by Search Intent</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Generic', value: synthesizedKeywords.filter(k => k.intent === 'generic').reduce((sum, k) => sum + k.clicks, 0) },
                    { name: 'Branded', value: synthesizedKeywords.filter(k => k.intent === 'branded').reduce((sum, k) => sum + k.clicks, 0) },
                    { name: 'Competitor', value: synthesizedKeywords.filter(k => k.intent === 'competitor').reduce((sum, k) => sum + k.clicks, 0) },
                    { name: 'Negative', value: synthesizedKeywords.filter(k => k.intent === 'negative').reduce((sum, k) => sum + k.clicks, 0) },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#3b82f6" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#ef4444" />
                </Pie>
                <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{fontSize: '12px', fontWeight: 'bold'}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-lg font-bold text-gray-900 mb-6 px-1">Individual Search Term Details</h3>
        {isLoading ? (
          <div className="h-64 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredKeywords.length === 0 ? (
          <NoDataState tab="Search Terms" />
        ) : (
          <DataTable 
            data={filteredKeywords} 
            columns={columns} 
            filterSlot={filterSlot}
          />
        )}
      </div>
    </div>
  );
};
