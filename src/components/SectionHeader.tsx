import React from 'react';
import { cn } from '../lib/utils';

interface SectionHeaderProps {
  title: string;
  className?: string;
  indicatorColor?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, className, indicatorColor = "bg-indigo-600" }) => {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("w-1 h-8 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.4)]", indicatorColor)} />
      <h2 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h2>
    </div>
  );
};

export default SectionHeader;
