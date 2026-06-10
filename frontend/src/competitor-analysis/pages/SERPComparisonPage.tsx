import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowUp, ArrowDown, Minus, Play, RefreshCw, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { competitorApiService } from '../services/competitorApiService';
import { cn } from '../../lib/utils';

interface KeywordDiff {
  keyword: string;
  positionA: number;
  positionB: number;
  change: number;
  changeType: 'improved' | 'declined' | 'unchanged' | 'new' | 'dropped';
  domainA: string;
  domainB: string;
  urlA: string;
  urlB: string;
}

const fmt = (fetched_at: string) => {
  const s = fetched_at.endsWith('Z') ? fetched_at : `${fetched_at}Z`;
  return new Date(s).toLocaleString();
};

const SERPComparisonPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [saveStatus, setSaveStatus] = useState<null | 'success' | 'error'>(null);
  const [comparing, setComparing] = useState(false);

  const [snapshotA, setSnapshotA] = useState<string>('');
  const [snapshotB, setSnapshotB] = useState<string>('');
  const [targetDomain, setTargetDomain] = useState<string>('twinbirds');

  const [diffData, setDiffData] = useState<KeywordDiff[]>([]);
  const [filter, setFilter] = useState<'all' | 'improved' | 'declined' | 'new' | 'dropped'>('all');

  // Fetch the snapshot history from backend — always fresh
  const fetchHistory = useCallback(async (autoSelect = false) => {
    setHistoryLoading(true);
    try {
      const res = await competitorApiService.getSERPHistory();
      const hist = res.history || [];
      setHistory(hist);

      if (autoSelect) {
        // Auto-select the two most recent snapshots
        if (hist.length > 0) setSnapshotB(hist[0].snapshot_id); // newest
        if (hist.length > 1) setSnapshotA(hist[1].snapshot_id); // second newest
      } else {
        // Check for URL params first
        const paramA = searchParams.get('a');
        const paramB = searchParams.get('b');
        if (paramA) setSnapshotA(paramA);
        else if (hist.length > 1) setSnapshotA(hist[1].snapshot_id);
        if (paramB) setSnapshotB(paramB);
        else if (hist.length > 0) setSnapshotB(hist[0].snapshot_id);
      }
    } catch (e) {
      console.error('Failed to load SERP history', e);
    } finally {
      setHistoryLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchHistory(false);
  }, [fetchHistory]);

  // Save a brand new snapshot then re-fetch history and auto-select it
  const handleSaveSnapshot = async () => {
    setSavingSnapshot(true);
    setSaveStatus(null);
    try {
      await competitorApiService.refreshSERP();
      setSaveStatus('success');
      // Re-fetch history and auto-select the new snapshot
      await fetchHistory(true);
    } catch (e) {
      console.error('Failed to save snapshot', e);
      setSaveStatus('error');
    } finally {
      setSavingSnapshot(false);
      // Clear success badge after 4s
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  const handleCompare = async (a = snapshotA, b = snapshotB) => {
    if (!a || !b) return;
    setComparing(true);
    try {
      const [resA, resB] = await Promise.all([
        competitorApiService.getLatestSERP(a),
        competitorApiService.getLatestSERP(b)
      ]);

      // Helper: match domain using flexible partial-match.
      // SerpApi stores short names like 'twinbirds', 'gocolors', 'myntra'.
      // But users may type 'twinbirds.co.in' — strip TLD for matching.
      const domainKey = targetDomain.toLowerCase().replace(/\.co\.in$/, '').replace(/\.com$/, '').replace(/\.in$/, '');
      const domainMatches = (d: string) => d.toLowerCase().includes(domainKey);

      // Parse each snapshot, finding rank for targetDomain specifically
      const parsedA = new Map<string, { position: number; domain: string; url: string }>();
      resA?.data?.tasks?.forEach((task: any) => {
        const kw = task.data?.keyword || 'unknown';
        const items: any[] = task.result?.[0]?.items || [];
        const item = items.find((i: any) => i.domain && domainMatches(i.domain));
        parsedA.set(kw, item
          ? { position: item.rank_group || item.position || 0, domain: item.domain || '', url: item.url || '' }
          : { position: 0, domain: '', url: '' });
      });

      const parsedB = new Map<string, { position: number; domain: string; url: string }>();
      resB?.data?.tasks?.forEach((task: any) => {
        const kw = task.data?.keyword || 'unknown';
        const items: any[] = task.result?.[0]?.items || [];
        const item = items.find((i: any) => i.domain && domainMatches(i.domain));
        parsedB.set(kw, item
          ? { position: item.rank_group || item.position || 0, domain: item.domain || '', url: item.url || '' }
          : { position: 0, domain: '', url: '' });
      });

      const allKeywords = new Set([...parsedA.keys(), ...parsedB.keys()]);
      const diffs: KeywordDiff[] = [];

      allKeywords.forEach(kw => {
        const aData = parsedA.get(kw);
        const bData = parsedB.get(kw);

        const posA = aData?.position || 0;
        const posB = bData?.position || 0;

        let changeType: KeywordDiff['changeType'] = 'unchanged';
        let change = 0;

        if (!posA && posB) { changeType = 'new'; }
        else if (posA && !posB) { changeType = 'dropped'; }
        else if (posA && posB) {
          change = posA - posB; // Positive = improved (moved up the rankings)
          if (change > 0) changeType = 'improved';
          else if (change < 0) changeType = 'declined';
        }

        diffs.push({
          keyword: kw,
          positionA: posA,
          positionB: posB,
          change,
          changeType,
          domainA: aData?.domain || '-',
          domainB: bData?.domain || '-',
          urlA: aData?.url || '-',
          urlB: bData?.url || '-',
        });
      });

      setDiffData(diffs);
    } catch (e) {
      console.error('Comparison failed', e);
    } finally {
      setComparing(false);
    }
  };

  const filteredData = filter === 'all' ? diffData : diffData.filter(d => d.changeType === filter);
  const chartData = diffData
    .filter(d => d.changeType === 'improved' || d.changeType === 'declined')
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 15);

  const summary = {
    improved: diffData.filter(d => d.changeType === 'improved').length,
    declined: diffData.filter(d => d.changeType === 'declined').length,
    new: diffData.filter(d => d.changeType === 'new').length,
    dropped: diffData.filter(d => d.changeType === 'dropped').length,
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link to="/competitor-analysis" className="p-2 bg-white rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">SERP Position Comparison</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Compare keyword rankings between two data snapshots</p>
          </div>
        </div>

        {/* Save Snapshot button — primary action */}
        <div className="flex items-center gap-3">
          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">
              <CheckCircle className="w-4 h-4" />
              Snapshot Saved!
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">
              <AlertCircle className="w-4 h-4" />
              Save Failed
            </div>
          )}
          <button
            onClick={handleSaveSnapshot}
            disabled={savingSnapshot}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-60"
          >
            {savingSnapshot
              ? <RefreshCw className="w-4 h-4 animate-spin" />
              : <Database className="w-4 h-4" />}
            {savingSnapshot ? 'Saving...' : 'Save New Snapshot'}
          </button>
          <button
            onClick={() => fetchHistory(false)}
            disabled={historyLoading}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-60"
          >
            <RefreshCw className={cn('w-4 h-4', historyLoading && 'animate-spin')} />
            Reload List
          </button>
        </div>
      </div>

      {/* Snapshot selection + compare */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-[10px] font-black uppercase tracking-[2px] text-gray-400">
            {history.length} snapshot{history.length !== 1 ? 's' : ''} available
          </span>
          {historyLoading && <RefreshCw className="w-3 h-3 animate-spin text-gray-400" />}
        </div>

        <div className="flex flex-col lg:flex-row items-end gap-6">
          {/* Target domain */}
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[2px] text-gray-400">Track Domain</label>
            <input
              type="text"
              value={targetDomain}
              onChange={e => setTargetDomain(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              placeholder="e.g. twinbirds"
            />
            <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
              SerpApi short names — yours: <strong className="text-gray-700">twinbirds</strong> · competitors: gocolors, myntra, ajio.com, amazon.in, jockeyindia
            </p>
          </div>

          {/* Snapshot A */}
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[2px] text-gray-400">Snapshot A (Older / Baseline)</label>
            <select
              value={snapshotA}
              onChange={e => setSnapshotA(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="">Select snapshot...</option>
              {history.map(h => (
                <option key={h.snapshot_id} value={h.snapshot_id}>
                  {fmt(h.fetched_at)} — {h.keyword_count} keywords
                </option>
              ))}
            </select>
          </div>

          {/* Snapshot B */}
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[2px] text-gray-400">Snapshot B (Newer / Latest)</label>
            <select
              value={snapshotB}
              onChange={e => setSnapshotB(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="">Select snapshot...</option>
              {history.map(h => (
                <option key={h.snapshot_id} value={h.snapshot_id}>
                  {fmt(h.fetched_at)} — {h.keyword_count} keywords
                </option>
              ))}
            </select>
          </div>

          {/* Compare button */}
          <button
            onClick={() => handleCompare()}
            disabled={comparing || !snapshotA || !snapshotB}
            className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
          >
            {comparing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-4 h-4" />}
            Compare Data
          </button>
        </div>
      </div>

      {/* Empty state if no snapshots */}
      {history.length === 0 && !historyLoading && (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200 text-center p-10">
          <Database className="w-10 h-10 text-gray-300 mb-4" />
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-600 mb-2">No snapshots yet</h3>
          <p className="text-xs text-gray-400 font-medium mb-6 max-w-sm">
            Click <strong>Save New Snapshot</strong> above to capture a live Google Shopping rankings snapshot. You need at least 2 snapshots to compare.
          </p>
        </div>
      )}

      {/* Results */}
      {diffData.length > 0 && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Improved', value: summary.improved, color: 'text-emerald-500', icon: ArrowUp },
              { label: 'Declined', value: summary.declined, color: 'text-rose-500', icon: ArrowDown },
              { label: 'New Keywords', value: summary.new, color: 'text-blue-500', icon: null },
              { label: 'Dropped', value: summary.dropped, color: 'text-gray-400', icon: null },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-black uppercase tracking-[2px] text-gray-400 mb-2">{card.label}</span>
                <div className={cn('text-4xl font-black flex items-center gap-2', card.color)}>
                  {card.value}
                  {card.icon && <card.icon className="w-6 h-6" />}
                </div>
              </div>
            ))}
          </div>

          {/* Table + Chart */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Comparison Table</h3>
                <div className="flex items-center gap-2 p-1.5 bg-gray-50 border border-gray-100 rounded-3xl flex-wrap">
                  {(['all', 'improved', 'declined', 'new', 'dropped'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        'px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all',
                        filter === f ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400 hover:text-gray-900'
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-50 text-[10px] font-black uppercase tracking-[2px] text-gray-400">
                      <th className="pb-6">Keyword</th>
                      <th className="pb-6">Pos A</th>
                      <th className="pb-6">Pos B</th>
                      <th className="pb-6">Change</th>
                      <th className="pb-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredData.map((d, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4">
                          <span className="text-sm font-bold text-gray-900 uppercase">{d.keyword}</span>
                        </td>
                        <td className="py-4">
                          <span className="text-sm font-bold text-gray-400">{d.positionA || '—'}</span>
                        </td>
                        <td className="py-4">
                          <span className="text-sm font-bold text-gray-900">{d.positionB || '—'}</span>
                        </td>
                        <td className="py-4">
                          {d.changeType === 'improved' && <span className="flex items-center gap-1 text-emerald-500 font-black text-xs"><ArrowUp className="w-3 h-3" /> {Math.abs(d.change)}</span>}
                          {d.changeType === 'declined' && <span className="flex items-center gap-1 text-rose-500 font-black text-xs"><ArrowDown className="w-3 h-3" /> {Math.abs(d.change)}</span>}
                          {d.changeType === 'unchanged' && <span className="text-gray-300 font-black text-xs"><Minus className="w-3 h-3" /></span>}
                          {d.changeType === 'new' && <span className="text-blue-500 font-black text-xs uppercase tracking-widest">New</span>}
                          {d.changeType === 'dropped' && <span className="text-gray-400 font-black text-xs uppercase tracking-widest">Dropped</span>}
                        </td>
                        <td className="py-4">
                          <span className={cn(
                            'px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest',
                            d.changeType === 'improved' && 'bg-emerald-50 text-emerald-600',
                            d.changeType === 'declined' && 'bg-rose-50 text-rose-600',
                            d.changeType === 'unchanged' && 'bg-gray-50 text-gray-500',
                            d.changeType === 'new' && 'bg-blue-50 text-blue-600',
                            d.changeType === 'dropped' && 'bg-gray-50 text-gray-500',
                          )}>
                            {d.changeType}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
              <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase mb-8">Position Shifts</h3>
              <div className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 50, right: 20 }}>
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="keyword" width={100} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 900 }} />
                    <Tooltip
                      cursor={{ fill: '#f9fafb' }}
                      contentStyle={{ borderRadius: '16px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="change" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.change > 0 ? '#10b981' : '#f43f5e'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SERPComparisonPage;
