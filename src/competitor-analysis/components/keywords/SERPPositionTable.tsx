import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Crown } from 'lucide-react';

interface SERPPositionTableProps {
  results: {
    position: number;
    url: string;
    domain: string;
    title: string;
    is_featured: boolean;
  }[];
}

const SERPPositionTable: React.FC<SERPPositionTableProps> = ({ results }) => {
  return (
    <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-gray-50/50 text-[10px] font-black uppercase tracking-[2px] text-gray-400">
            <th className="px-8 py-6">Pos</th>
            <th className="px-8 py-6">Target Page</th>
            <th className="px-8 py-6">Domain</th>
            <th className="px-8 py-6 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {results.map((result, i) => (
            <motion.tr 
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="group hover:bg-gray-50/50 transition-colors"
            >
              <td className="px-8 py-6">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-black ${
                  result.position === 1 ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                  result.position <= 3 ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-gray-50 text-gray-400 border border-gray-100'
                }`}>
                  {result.is_featured ? <Crown className="h-4 w-4" /> : result.position}
                </div>
              </td>
              <td className="px-8 py-6">
                <div className="max-w-md">
                  <h5 className="text-sm font-bold text-gray-900 truncate">{result.title}</h5>
                  <p className="text-[10px] font-medium text-gray-400 truncate mt-0.5">{result.url}</p>
                </div>
              </td>
              <td className="px-8 py-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">
                  {result.domain}
                </span>
              </td>
              <td className="px-8 py-6 text-right">
                <a 
                  href={result.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-gray-400 border border-gray-100 shadow-sm transition-all hover:bg-gray-900 hover:text-white hover:border-gray-900"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SERPPositionTable;
