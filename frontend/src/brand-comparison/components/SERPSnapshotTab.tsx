/**
 * SERPSnapshotTab
 * Embedded SERP snapshot comparison UI for the Brand vs Competitor Intelligence page.
 * Reuses competitorApiService — no duplicate fetch logic.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowUp, ArrowDown, Minus, Play, RefreshCw,
  Database, CheckCircle, AlertCircle, BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { competitorApiService } from '../../competitor-analysis/services/competitorApiService';
import { cn } from '../../lib/utils';

interface KeywordDiff {
  keyword: string;
  positionA: number;
  positionB: number;
  change: number;
  changeType: 'improved' | 'declined' | 'unchanged' | 'new' | 'dropped';
}

const fmt = (fetched_at: string) => {
  const s = fetched_at.endsWith('Z') ? fetched_at : `${fetched_at}Z`;
  return new Date(s).toLocaleString();
};

const domainKey = (d: string) =>
  d.toLowerCase().replace(/\.co\.in$/, '').replace(/\.com$/, '').replace(/\.in$/, '');

interface Props {
  /** If set, the tab will auto-select this as Snapshot B immediately (latest snapshot just saved). */
  latestSnapshotId?: string | null;
}

const SERPSnapshotTab: React.FC<Props> = ({ latestSnapshotId }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [saveStatus, setSaveStatus] = useState<null | 'success' | 'error'>(null);
  const [comparing, setComparing] = useState(false);

  const [snapshotA, setSnapshotA] = useState('');
  const [snapshotB, setSnapshotB] = useState('');
  const [targetDomain, setTargetDomain] = useState('twinbirds');

  const [diffData, setDiffData] = useState<KeywordDiff[]>([]);
  const [filter, setFilter] = useState<'all' | 'improved' | 'declined' | 'new' | 'dropped'>('all');

  // ── Fetch snapshot list ────────────────────────────────────────────────────
  const fetchHistory = useCallback(async (autoSelect = false) => {
    setHistoryLoading(true);
    try {
      const res = await competitorApiService.getSERPHistory();
      const hist = res.history || [];
      setHistory(hist);

      if (autoSelect || latestSnapshotId) {
        if (hist.length > 0) setSnapshotB(hist[0].snapshot_id);
        if (hist.length > 1) setSnapshotA(hist[1].snapshot_id);
      } else {
        if (!snapshotB && hist.length > 0) setSnapshotB(hist[0].snapshot_id);
        if (!snapshotA && hist.length > 1) setSnapshotA(hist[1].snapshot_id);
      }
    } catch (e) {
      console.error('Failed to load SERP history', e);
    } finally {
      setHistoryLoading(false);
    }
  }, [latestSnapshotId, snapshotA, snapshotB]);

  useEffect(() => {
    fetchHistory(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When parent saves a new snapshot, auto-select it
  useEffect(() => {
    if (latestSnapshotId) {
      fetchHistory(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestSnapshotId]);

  // ── Save a standalone SERP-only snapshot ─────────────────────────────────
  const handleSaveSnapshot = async () => {
    setSavingSnapshot(true);
    setSaveStatus(null);
    try {
      await competitorApiService.refreshSERP();
      setSaveStatus('success');
      await fetchHistory(true);
    } catch {
      setSaveStatus('error');
    } finally {
      setSavingSnapshot(false);
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  // ── Compare two snapshots ─────────────────────────────────────────────────
  const handleCompare = async (a = snapshotA, b = snapshotB) => {
    if (!a || !b) return;
    setComparing(true);
    try {
      const [resA, resB] = await Promise.all([
        competitorApiService.getLatestSERP(a),
        competitorApiService.getLatestSERP(b),
      ]);

      const key = domainKey(targetDomain);
      const domainMatches = (d: string) => d.toLowerCase().includes(key);

      const parse = (res: any) => {
        const map = new Map<string, { position: number }>();
        res?.data?.tasks?.forEach((task: any) => {
          const kw = task.data?.keyword || 'unknown';
          const items: any[] = task.result?.[0]?.items || [];
          const item = items.find((i: any) => i.domain && domainMatches(i.domain));
          map.set(kw, { position: item ? (item.rank_group || item.position || 0) : 0 });
        });
        return map;
      };

      const parsedA = parse(resA);
      const parsedB = parse(resB);
      const allKeywords = new Set([...parsedA.keys(), ...parsedB.keys()]);
      const diffs: KeywordDiff[] = [];

      allKeywords.forEach(kw => {
        const posA = parsedA.get(kw)?.position || 0;
        const posB = parsedB.get(kw)?.position || 0;
        let changeType: KeywordDiff['changeType'] = 'unchanged';
        let change = 0;

        if (!posA && posB) changeType = 'new';
        else if (posA && !posB) changeType = 'dropped';
        else if (posA && posB) {
          change = posA - posB;
          if (change > 0) changeType = 'improved';
          else if (change < 0) changeType = 'declined';
        }

        diffs.push({ keyword: kw, positionA: posA, positionB: posB, change, changeType });
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
    .slice(0, 12);
  const summary = {
    improved: diffData.filter(d => d.changeType === 'improved').length,
    declined: diffData.filter(d => d.changeType === 'declined').length,
    new: diffData.filter(d => d.changeType === 'new').length,
    dropped: diffData.filter(d => d.changeType === 'dropped').length,
  };

  return (
    <div className="space-y-8">
      {/* Explainer banner */}
      <div className="bg-indigo-50/60 border border-indigo-100 rounded-3xl p-6 flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-indigo-100/60 text-indigo-700 flex-shrink-0">
          <BarChart3 size={20} />
        </div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-indigo-900">SERP Snapshot Comparison</h4>
          <p className="text-xs text-indigo-700/80 mt-1 font-medium leading-relaxed">
            Every time you click <strong>Refresh All Data</strong> on this page, a live Google Shopping snapshot is automatically saved.
            Select any two snapshots below to compare how your rankings shifted over time.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-6">
        {/* Header row */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 text-xs font-bold text-gray-500 uppercase tracking-widest">
            <span>{history.length} snapshot{history.length !== 1 ? 's' : ''} available</span>
            {historyLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-gray-400" />}
          </div>

          <div className="flex items-center gap-3">
            {saveStatus === 'success' && (
              <span className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">
                <CheckCircle className="w-4 h-4" /> Snapshot Saved!
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">
                <AlertCircle className="w-4 h-4" /> Save Failed
              </span>
            )}
            <button
              onClick={handleSaveSnapshot}
              disabled={savingSnapshot}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-60"
            >
              {savingSnapshot ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              {savingSnapshot ? 'Saving...' : 'Save Snapshot Now'}
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

        {/* Selection row */}
        <div className="flex flex-col lg:flex-row items-end gap-4">
          {/* Domain */}
          <div className="flex-1 space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[2px] text-gray-400">Track Domain</label>
            <input
              type="text"
              value={targetDomain}
              onChange={e => setTargetDomain(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400"
              placeholder="twinbirds"
            />
            <p className="text-[10px] text-gray-400 font-medium">
              Yours: <strong className="text-gray-600">twinbirds</strong> · Competitors: gocolors, myntra, ajio.com, amazon.in
            </p>
          </div>

          {/* Snapshot A */}
          <div className="flex-1 space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[2px] text-gray-400">Snapshot A — Baseline (Older)</label>
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
          <div className="flex-1 space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[2px] text-gray-400">Snapshot B — Latest (Newer)</label>
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

          {/* Compare */}
          <button
            onClick={() => handleCompare()}
            disabled={comparing || !snapshotA || !snapshotB}
            className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
          >
            {comparing
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Play className="w-4 h-4" />}
            Compare
          </button>
        </div>
      </div>

      {/* Empty state */}
      {history.length === 0 && !historyLoading && (
        <div className="flex flex-col items-center justify-center h-56 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200 text-center p-10">
          <Database className="w-10 h-10 text-gray-300 mb-4" />
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-600 mb-2">No snapshots yet</h3>
          <p className="text-xs text-gray-400 font-medium max-w-sm">
            Click <strong>Refresh All Data</strong> or <strong>Save Snapshot Now</strong> to capture your first ranking snapshot.
            You need at least 2 snapshots to compare.
          </p>
        </div>
      )}

      {/* Results */}
      {diffData.length > 0 && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Improved', value: summary.improved, cls: 'text-emerald-500', Icon: ArrowUp },
              { label: 'Declined', value: summary.declined, cls: 'text-rose-500', Icon: ArrowDown },
              { label: 'New', value: summary.new, cls: 'text-blue-500', Icon: null },
              { label: 'Dropped', value: summary.dropped, cls: 'text-gray-400', Icon: null },
            ].map(c => (
              <div key={c.label} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col items-center text-center">
                <span className="text-[10px] font-black uppercase tracking-[2px] text-gray-400 mb-2">{c.label}</span>
                <div className={cn('text-4xl font-black flex items-center gap-2', c.cls)}>
                  {c.value}
                  {c.Icon && <c.Icon className="w-6 h-6" />}
                </div>
              </div>
            ))}
          </div>

          {/* Table + chart */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Table */}
            <div className="xl:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
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
                      <th className="pb-5">Keyword</th>
                      <th className="pb-5">Rank A</th>
                      <th className="pb-5">Rank B</th>
                      <th className="pb-5">Change</th>
                      <th className="pb-5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredData.map((d, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 text-sm font-bold text-gray-900 uppercase max-w-[180px] truncate">{d.keyword}</td>
                        <td className="py-4 text-sm font-bold text-gray-400">{d.positionA || '—'}</td>
                        <td className="py-4 text-sm font-bold text-gray-900">{d.positionB || '—'}</td>
                        <td className="py-4">
                          {d.changeType === 'improved' && <span className="flex items-center gap-1 text-emerald-500 font-black text-xs"><ArrowUp className="w-3 h-3" />{Math.abs(d.change)}</span>}
                          {d.changeType === 'declined' && <span className="flex items-center gap-1 text-rose-500 font-black text-xs"><ArrowDown className="w-3 h-3" />{Math.abs(d.change)}</span>}
                          {d.changeType === 'unchanged' && <Minus className="w-3 h-3 text-gray-300" />}
                          {d.changeType === 'new' && <span className="text-blue-500 font-black text-xs uppercase">New</span>}
                          {d.changeType === 'dropped' && <span className="text-gray-400 font-black text-xs uppercase">Dropped</span>}
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

            {/* Chart */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
              <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase mb-6">Position Shifts</h3>
              {chartData.length > 0 ? (
                <div className="h-[420px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 50, right: 20 }}>
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="keyword" width={100} tick={{ fontSize: 9, fill: '#9ca3af', fontWeight: 900 }} />
                      <Tooltip
                        cursor={{ fill: '#f9fafb' }}
                        contentStyle={{ borderRadius: '16px', border: '1px solid #f3f4f6' }}
                      />
                      <Bar dataKey="change" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.change > 0 ? '#10b981' : '#f43f5e'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-300">
                  <p className="text-xs font-black uppercase tracking-widest text-center">No rank changes to chart</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SERPSnapshotTab;
