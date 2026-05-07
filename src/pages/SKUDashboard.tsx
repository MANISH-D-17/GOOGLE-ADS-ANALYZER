import React, { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SummaryCards from '../components/SummaryCards';
import FilterBar from '../components/FilterBar';
import SKUTable from '../components/SKUTable';
import PageHeader from '../components/PageHeader';
import { SKU, SKUState } from '../data/mockData';
import { getActualSKUs, ActualSKU } from '../data/actualDataLoader';
import { getScaleMultiplier } from '../lib/dataUtils';

interface SKUDashboardProps {
  dateRange: string;
}

const SKUDashboard: React.FC<SKUDashboardProps> = ({ dateRange }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get filters from URL or defaults
  const activeState = (searchParams.get('state') as SKUState | 'all') || 'all';
  const category = searchParams.get('category') || 'all';
  const availability = searchParams.get('availability') || 'all';
  const sort = searchParams.get('sort') || 'spend_desc';
  const search = searchParams.get('search') || '';

  const updateFilters = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all' || value === '') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  const multiplier = getScaleMultiplier(dateRange);
  const actualSKUData = useMemo(() => {
    const rawData = getActualSKUs();
    return rawData.map(s => ({
      ...s,
      spend: s.spend * multiplier,
      revenue: s.revenue * multiplier,
      conversions: s.conversions * multiplier,
      impressions: s.impressions * multiplier,
      clicks: s.clicks * multiplier,
      roas: (s.revenue * multiplier) / (Math.max(1, s.spend * multiplier))
    }));
  }, [multiplier]);


  const filteredSKUs = useMemo(() => {
    return actualSKUData
      .filter(sku => activeState === 'all' || sku.state === activeState)
      .filter(sku => category === 'all' || sku.category === category)
      .filter(sku => availability === 'all' || sku.availability === availability)
      .filter(sku => 
        sku.name.toLowerCase().includes(search.toLowerCase()) || 
        sku.id.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        if (sort === 'spend_desc') return b.spend - a.spend;
        if (sort === 'roas_asc') return a.roas - b.roas;
        if (sort === 'revenue_desc') return b.revenue - a.revenue;
        if (sort === 'impr_desc') return b.impressions - a.impressions;
        if (sort === 'state_bleeders') {
          const priority: Record<SKUState, number> = { bleeder: 0, dead: 1, sleeper: 2, stable: 3, winner: 4 };
          return priority[a.state] - priority[b.state];
        }
        return 0;
      });
  }, [actualSKUData, activeState, category, availability, sort, search]);

  const handleRowClick = (sku: SKU) => {
    // Preserve filters in navigation
    navigate(`/sku/${sku.id}?${searchParams.toString()}`);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <PageHeader 
        title="Overall Dashboard" 
        dateRange="01-May-2026 to 31-May-2026" 
      />
      
      <SummaryCards skus={actualSKUData as any} />

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-indigo-600 rounded-full" />
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Performance by SKU</h2>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
        <FilterBar 
          activeState={activeState} setActiveState={(v) => updateFilters('state', v)}
          category={category} setCategory={(v) => updateFilters('category', v)}
          availability={availability} setAvailability={(v) => updateFilters('availability', v)}
          sort={sort} setSort={(v) => updateFilters('sort', v)}
          search={search} setSearch={(v) => updateFilters('search', v)}
          count={filteredSKUs.length}
          total={actualSKUData.length}
        />
        <SKUTable skus={filteredSKUs} onRowClick={handleRowClick} />
      </div>
    </div>
    </div>
  );
};

export default SKUDashboard;
