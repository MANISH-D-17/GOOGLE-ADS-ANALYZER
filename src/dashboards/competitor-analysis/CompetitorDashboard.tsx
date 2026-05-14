import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const CompetitorDashboard: React.FC<{ dateRange: string }> = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in duration-500">
      <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
        <ShieldAlert size={40} className="text-gray-400" />
      </div>
      <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Competitor Dataset Required</h1>
      <p className="text-gray-500 max-w-md mx-auto font-medium">
        There is currently no competitor intelligence dataset located in your <code className="bg-gray-100 px-2 py-1 rounded text-gray-800">/Dataset</code> folder. 
      </p>
      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-6 text-left max-w-lg mx-auto shadow-sm">
        <h3 className="font-bold text-blue-900 mb-2">How to activate this dashboard:</h3>
        <ul className="list-disc list-inside text-sm text-blue-800 space-y-2">
          <li>Export your Competitor Benchmark data from Google Ads or a 3rd-party tool.</li>
          <li>Save the file as <code className="font-bold">competitor_analysis.csv</code>.</li>
          <li>Place it inside the <code className="font-bold">public/Dataset/</code> directory.</li>
        </ul>
      </div>
    </div>
  );
};
