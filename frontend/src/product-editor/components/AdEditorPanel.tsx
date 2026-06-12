import React, { useState } from 'react';
import { RSAAd, RSAHeadline, RSADesc } from '../services/editorApiService';
import { Save, AlertTriangle, Plus, X, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Props {
  ad: RSAAd;
  onClose: () => void;
  onSave: (id: string, headlines: RSAHeadline[], descriptions: RSADesc[]) => Promise<void>;
}

export const AdEditorPanel: React.FC<Props> = ({ ad, onClose, onSave }) => {
  const [headlines, setHeadlines] = useState<RSAHeadline[]>(ad.headlines);
  const [descriptions, setDescriptions] = useState<RSADesc[]>(ad.descriptions);
  const [saving, setSaving] = useState(false);

  const addHeadline = () => {
    if (headlines.length < 15) setHeadlines([...headlines, { text: '', pinnedField: null }]);
  };
  const updateHeadline = (index: number, text: string) => {
    const next = [...headlines];
    next[index].text = text;
    setHeadlines(next);
  };
  const setHeadlinePin = (index: number, pin: string | null) => {
    const next = [...headlines];
    next[index].pinnedField = pin;
    setHeadlines(next);
  };
  const removeHeadline = (index: number) => {
    setHeadlines(headlines.filter((_, i) => i !== index));
  };

  const addDesc = () => {
    if (descriptions.length < 4) setDescriptions([...descriptions, { text: '', pinnedField: null }]);
  };
  const updateDesc = (index: number, text: string) => {
    const next = [...descriptions];
    next[index].text = text;
    setDescriptions(next);
  };
  const setDescPin = (index: number, pin: string | null) => {
    const next = [...descriptions];
    next[index].pinnedField = pin;
    setDescriptions(next);
  };
  const removeDesc = (index: number) => {
    setDescriptions(descriptions.filter((_, i) => i !== index));
  };

  // Validations
  const errors: string[] = [];
  if (headlines.length < 3) errors.push("At least 3 headlines required.");
  if (descriptions.length < 2) errors.push("At least 2 descriptions required.");
  if (headlines.some(h => h.text.length > 30)) errors.push("Each headline max 30 characters.");
  if (descriptions.some(d => d.text.length > 90)) errors.push("Each description max 90 characters.");
  
  const headlineTexts = headlines.map(h => h.text.trim().toLowerCase()).filter(Boolean);
  const uniqueHeadlines = new Set(headlineTexts);
  if (uniqueHeadlines.size !== headlineTexts.length) errors.push("Headlines must be unique.");

  const handleSave = async () => {
    if (errors.length > 0) return;
    setSaving(true);
    await onSave(ad.id, headlines, descriptions);
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-gray-50 border border-t-0 border-indigo-100 rounded-b-2xl p-6 shadow-inner"
    >
      <div className="bg-blue-50/50 border border-blue-100 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
        <AlertTriangle size={16} className="text-blue-500" />
        <p className="text-sm text-blue-800">
          <strong>Responsive Search Ads rotate components.</strong> Google will dynamically test combinations of your headlines and descriptions to serve the best performing ones.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        
        {/* HEADLINES */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-gray-800 flex items-center gap-2">
              Headlines <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-[10px]">{headlines.length}/15</span>
            </h3>
            <button 
              onClick={addHeadline} disabled={headlines.length >= 15}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 flex items-center gap-1"
            >
              <Plus size={14}/> Add Headline
            </button>
          </div>
          <div className="space-y-3">
            {headlines.map((h, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 relative">
                  <input
                    type="text" value={h.text} onChange={(e) => updateHeadline(i, e.target.value)}
                    placeholder="Enter headline..."
                    className={cn("w-full rounded-lg border p-2.5 text-sm pr-16 focus:ring-2 outline-none transition-all",
                      h.text.length > 30 ? "border-red-400 focus:ring-red-100" : "border-gray-300 focus:ring-indigo-100 focus:border-indigo-400"
                    )}
                  />
                  <span className={cn("absolute right-3 top-3 text-[10px] font-bold", 
                    h.text.length > 30 ? "text-red-500" : h.text.length > 28 ? "text-amber-500" : "text-gray-400"
                  )}>
                    {h.text.length} / 30
                  </span>
                </div>
                <select
                  value={h.pinnedField || ""}
                  onChange={(e) => setHeadlinePin(i, e.target.value || null)}
                  className="bg-white border border-gray-300 text-xs rounded-lg p-2.5 w-[110px] outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                >
                  <option value="">No Pin</option>
                  <option value="HEADLINE_1">Position 1</option>
                  <option value="HEADLINE_2">Position 2</option>
                  <option value="HEADLINE_3">Position 3</option>
                </select>
                <button onClick={() => removeHeadline(i)} className="mt-2.5 text-gray-400 hover:text-red-500 p-1">
                  <X size={16}/>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* DESCRIPTIONS */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-gray-800 flex items-center gap-2">
              Descriptions <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-[10px]">{descriptions.length}/4</span>
            </h3>
            <button 
              onClick={addDesc} disabled={descriptions.length >= 4}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 flex items-center gap-1"
            >
              <Plus size={14}/> Add Description
            </button>
          </div>
          <div className="space-y-3">
            {descriptions.map((d, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 relative">
                  <textarea
                    value={d.text} onChange={(e) => updateDesc(i, e.target.value)}
                    placeholder="Enter description..." rows={2}
                    className={cn("w-full rounded-lg border p-2.5 text-sm pr-16 focus:ring-2 outline-none transition-all resize-none",
                      d.text.length > 90 ? "border-red-400 focus:ring-red-100" : "border-gray-300 focus:ring-indigo-100 focus:border-indigo-400"
                    )}
                  />
                  <span className={cn("absolute right-3 bottom-3 text-[10px] font-bold", 
                    d.text.length > 90 ? "text-red-500" : d.text.length > 85 ? "text-amber-500" : "text-gray-400"
                  )}>
                    {d.text.length} / 90
                  </span>
                </div>
                <select
                  value={d.pinnedField || ""}
                  onChange={(e) => setDescPin(i, e.target.value || null)}
                  className="bg-white border border-gray-300 text-xs rounded-lg p-2.5 w-[110px] outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 h-[64px]"
                >
                  <option value="">No Pin</option>
                  <option value="DESCRIPTION_1">Position 1</option>
                  <option value="DESCRIPTION_2">Position 2</option>
                </select>
                <button onClick={() => removeDesc(i)} className="mt-[20px] text-gray-400 hover:text-red-500 p-1">
                  <X size={16}/>
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="mt-8 flex items-center justify-between">
        <div className="flex-1 mr-6">
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold p-3 rounded-lg flex gap-4">
              <span className="shrink-0 flex items-center gap-1"><AlertTriangle size={14}/> Cannot Save:</span>
              <ul className="list-disc pl-4 space-y-1">
                {errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onClose} disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || errors.length > 0}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Pushing...' : 'Push to Google Ads'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
