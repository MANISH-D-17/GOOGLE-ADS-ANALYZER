import React from 'react';
import { 
  CreditCard, IndianRupee, Zap, ShoppingBag 
} from 'lucide-react';
import { formatRupees } from '../lib/utils';
import { SKU } from '../data/mockData';
import MetricCard from './MetricCard';
import SectionHeader from './SectionHeader';

import { ActualSKU } from '../data/actualDataLoader';

interface SummaryCardsProps {
  skus: SKU[] | ActualSKU[];
  overrideTotals?: {
    totalSpend: number;
    totalRevenue: number;
    totalConversions: number;
    blendedRoas: number;
    spendChange: string;
    revenueChange: string;
    roasChange: string;
    convChange: string;
  };
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ skus, overrideTotals }) => {
  // Calculate totals
  const totalSpend = overrideTotals?.totalSpend ?? skus.reduce((acc, s) => acc + s.spend, 0);
  const totalRevenue = overrideTotals?.totalRevenue ?? skus.reduce((acc, s) => acc + s.revenue, 0);
  const totalConversions = overrideTotals?.totalConversions ?? skus.reduce((acc, s) => acc + s.conversions, 0);
  const blendedRoas = overrideTotals?.blendedRoas ?? (totalRevenue / (totalSpend || 1));

  // Group calculations
  const winnerSKUs = skus.filter(s => s.state === 'winner');
  const bleederSKUs = skus.filter(s => s.state === 'bleeder');
  const sleeperSKUs = skus.filter(s => s.state === 'sleeper');
  const deadSKUs = skus.filter(s => s.state === 'dead');

  const winnerRevenue = winnerSKUs.reduce((acc, s) => acc + s.revenue, 0);
  const winnerRevenuePct = Math.round((winnerRevenue / (totalRevenue || 1)) * 100);
  const bleederSpend = bleederSKUs.reduce((acc, s) => acc + s.spend, 0);

  const kpis = [
    { label: 'Spend', value: formatRupees(totalSpend), change: overrideTotals?.spendChange || '+6.2%', positive: true, color: '#3b82f6', icon: <CreditCard /> },
    { label: 'Revenue', value: formatRupees(totalRevenue), change: overrideTotals?.revenueChange || '+14.8%', positive: true, color: '#10b981', icon: <IndianRupee /> },
    { label: 'Blended ROAS', value: `${blendedRoas.toFixed(2)}x`, change: overrideTotals?.roasChange || '+8.1%', positive: true, color: '#8b5cf6', icon: <Zap /> },
    { label: 'Conversions', value: totalConversions.toLocaleString(), change: overrideTotals?.convChange || '+11.4%', positive: true, color: '#10b981', icon: <ShoppingBag /> },
  ];

  const states = [
    { label: 'Winners', count: winnerSKUs.length.toString(), subtitle: `${winnerRevenuePct}% of revenue from this group`, color: '#10b981', dot: 'bg-green-600' },
    { label: 'Bleeders', count: bleederSKUs.length.toString(), subtitle: `${formatRupees(bleederSpend)} wasted spend`, color: '#ef4444', dot: 'bg-red-600' },
    { label: 'Sleepers', count: sleeperSKUs.length.toString(), subtitle: 'Activation candidates', color: '#f59e0b', dot: 'bg-amber-600' },
    { label: 'Deads', count: deadSKUs.length.toString(), subtitle: `of ${skus.length} active SKUs`, color: '#6b7280', dot: 'bg-gray-500' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader title="Metrics Overview" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <MetricCard 
            key={idx} 
            label={kpi.label} 
            value={kpi.value} 
            change={kpi.change} 
            positive={kpi.positive} 
            color={kpi.color} 
            icon={kpi.icon}
          />
        ))}
      </div>

      {/* State Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {states.map((state, idx) => (
          <MetricCard 
            key={idx} 
            label={state.label} 
            value={state.count} 
            subtitle={state.subtitle}
            color={state.color}
            icon={<div className={cn("w-1.5 h-1.5 rounded-full", state.dot)} />}
            positive={true}
            change=""
          />
        ))}
      </div>
    </div>
  );
};

import { cn } from '../lib/utils';
export default SummaryCards;
