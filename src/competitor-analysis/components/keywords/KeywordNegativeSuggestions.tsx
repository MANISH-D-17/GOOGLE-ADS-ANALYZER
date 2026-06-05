import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Info, ShieldAlert, FileDown, Layers, HelpCircle } from 'lucide-react';

export interface NegativeKeyword {
  term: string;
  category: string;
  matchType: 'Exact' | 'Phrase' | 'Broad';
  savings: 'High' | 'Medium' | 'Low';
  rationale: string;
}

interface KeywordNegativeSuggestionsProps {
  negatives: NegativeKeyword[];
}

const KeywordNegativeSuggestions: React.FC<KeywordNegativeSuggestionsProps> = ({ negatives }) => {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedTerm, setCopiedTerm] = useState<string | null>(null);

  // Group negatives by category
  const categories = Array.from(new Set(negatives.map((n) => n.category)));

  const handleCopyAll = () => {
    // Standard Google Ads negative keyword import format: line-by-line with brackets/quotes for match type
    const text = negatives
      .map((n) => {
        if (n.matchType === 'Exact') return `[${n.term}]`;
        if (n.matchType === 'Phrase') return `"${n.term}"`;
        return n.term; // Broad match
      })
      .join('\n');

    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopySingle = (n: NegativeKeyword) => {
    let text = n.term;
    if (n.matchType === 'Exact') text = `[${n.term}]`;
    else if (n.matchType === 'Phrase') text = `"${n.term}"`;

    navigator.clipboard.writeText(text);
    setCopiedTerm(n.term);
    setTimeout(() => setCopiedTerm(null), 2000);
  };

  const getMatchTypeStyle = (type: string) => {
    switch (type.toLowerCase()) {
      case 'exact':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'phrase':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getSavingsStyle = (savings: string) => {
    switch (savings.toLowerCase()) {
      case 'high':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100 font-extrabold';
      case 'medium':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Intro Header banner */}
      <div className="rounded-3xl border-2 border-rose-100 bg-rose-50/50 p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-4 rounded-2xl bg-rose-100 text-rose-700">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div>
            <h4 className="text-xl font-black text-rose-900 uppercase tracking-tight">Negative Keywords Advisor</h4>
            <p className="text-sm font-bold text-rose-700 mt-1 max-w-2xl leading-relaxed">
              Based on the crawled competitor's ad queries and active landing page intents, configure these negative terms to block wasted ad spend on unqualified search queries.
            </p>
          </div>
        </div>
        <button
          onClick={handleCopyAll}
          className="flex h-12 items-center gap-3 rounded-2xl bg-rose-600 px-6 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-rose-200 transition-all hover:bg-rose-700 active:scale-95"
        >
          {copiedAll ? (
            <>
              <Check className="h-4 w-4" />
              Copied Match List!
            </>
          ) : (
            <>
              <FileDown className="h-4 w-4" />
              Bulk Copy Google Ads Format
            </>
          )}
        </button>
      </div>

      {/* Main categories dashboard */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {categories.map((cat, idx) => {
          const items = negatives.filter((n) => n.category === cat);
          return (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm flex flex-col"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
                <div className="p-2 rounded-xl bg-gray-900 text-white shadow-md">
                  <Layers className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-[2px]">{cat}</h4>
              </div>

              <div className="space-y-4 flex-1">
                {items.map((item, i) => (
                  <div
                    key={item.term}
                    className="group flex flex-col p-5 rounded-2xl bg-gray-50/50 hover:bg-white border border-gray-50 hover:border-gray-100 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <span className="text-sm font-black text-gray-900 lowercase font-mono">
                        {item.term}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getMatchTypeStyle(
                            item.matchType
                          )}`}
                        >
                          {item.matchType}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getSavingsStyle(
                            item.savings
                          )}`}
                          title="Estimated Savings Score"
                        >
                          {item.savings} Savings
                        </span>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-gray-500 font-bold leading-normal flex items-start gap-2">
                      <Info className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                      {item.rationale}
                    </p>

                    <div className="mt-4 pt-4 border-t border-dashed border-gray-100 flex items-center justify-between">
                      <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">
                        Recommended syntax: {item.matchType === 'Exact' ? `[${item.term}]` : item.matchType === 'Phrase' ? `"${item.term}"` : item.term}
                      </span>
                      <button
                        onClick={() => handleCopySingle(item)}
                        className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        {copiedTerm === item.term ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            Copy Term
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default KeywordNegativeSuggestions;
