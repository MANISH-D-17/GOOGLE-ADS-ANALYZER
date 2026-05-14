import React, { useEffect, useState } from 'react';
import { dataService, ProductData } from '../../services/dataService';
import { DataTable, Column } from '../../components/tables/DataTable';
import { MetricCard } from '../../components/cards/MetricCard';
import { Package, Activity, DollarSign, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';

import { useNavigate } from 'react-router-dom';

export const ProductDashboard: React.FC<{ dateRange: string }> = ({ dateRange }) => {
  const [data, setData] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAvailability, setActiveAvailability] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const products = await dataService.loadProductData();
        setData(products);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  const activeCount = data.filter(p => p.availability?.includes('in stock')).length;
  const totalRevenue = data.reduce((sum, item) => sum + (item.itemRevenue || 0), 0);
  const totalPurchases = data.reduce((sum, item) => sum + (item.itemsPurchased || 0), 0);
  const avgRoas = totalRevenue > 0 ? totalRevenue / (totalPurchases || 1) : 0; // Simplified for demo

  const columns: Column[] = [
    { 
      key: 'title', 
      label: 'Product / Category', 
      sortable: true,
      className: 'w-[300px]',
      render: (val: string, row: ProductData) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors">
            {val?.split('-')[0]?.trim() || val}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
              {row['google product category'] || row.brand}
            </span>
            <span className="text-[10px] text-gray-300 font-bold uppercase tracking-tight">•</span>
            <span className="text-[10px] text-gray-400 font-black tracking-tight max-w-[150px] truncate">
              {row.id}
            </span>
          </div>
        </div>
      )
    },
    { 
      key: 'availability', 
      label: 'Availability', 
      align: 'center',
      className: 'w-[100px]',
      render: (val: string) => {
        const inStock = val?.includes('in stock');
        return (
          <div className={cn(
            "w-2.5 h-2.5 rounded-full mx-auto ring-4 ring-offset-0",
            inStock ? "bg-green-500 ring-green-50" : "bg-red-500 ring-red-50"
          )} />
        );
      }
    },
    { 
      key: 'itemsViewed', 
      label: 'Items Viewed', 
      align: 'right', 
      sortable: true,
      render: (val: number) => <span className="text-sm font-bold text-gray-600">{val?.toLocaleString()}</span>
    },
    { 
      key: 'itemsAddedToCart', 
      label: 'Added to Cart', 
      align: 'right', 
      sortable: true,
      render: (val: number) => <span className="text-sm font-bold text-gray-600">{val?.toLocaleString()}</span>
    },
    { 
      key: 'itemsPurchased', 
      label: 'Purchased', 
      align: 'right', 
      sortable: true,
      render: (val: number) => <span className="text-sm font-bold text-gray-600">{val}</span>
    },
    { 
      key: 'itemRevenue', 
      label: 'Revenue', 
      align: 'right', 
      sortable: true,
      render: (val: number) => <span className="text-sm font-black text-gray-900">₹{val?.toLocaleString()}</span>
    },
    { 
      key: 'conversionRate', 
      label: 'Conv. Rate', 
      align: 'right',
      render: (_, row: ProductData) => {
        const rate = (row.itemsViewed || 0) > 0 ? (row.itemsPurchased || 0) / (row.itemsViewed || 1) * 100 : 0;
        return (
          <span className={cn(
            "text-sm font-black",
            rate >= 2 ? "text-green-600" : rate < 0.5 ? "text-red-600" : "text-blue-600"
          )}>
            {rate.toFixed(2)}%
          </span>
        );
      }
    }
  ];

  const filteredData = data.filter(product => {
    if (activeAvailability === 'all') return true;
    const inStock = product.availability?.includes('in stock');
    if (activeAvailability === 'in stock') return inStock;
    if (activeAvailability === 'out of stock') return !inStock;
    return true;
  });

  const filterSlot = (
    <div className="flex items-center p-1 bg-gray-50 border border-gray-100 rounded-xl shadow-inner w-fit">
      {['all', 'in stock', 'out of stock'].map((s) => (
        <button
          key={s}
          onClick={() => setActiveAvailability(s)}
          className={cn(
            "px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all",
            activeAvailability === s 
              ? "bg-gray-900 text-white shadow-md" 
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-200/50"
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Product Intelligence</h1>
          <p className="text-gray-400 mt-1 font-medium text-sm">Analyze individual SKU performance across networks.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard 
          label="Total Products" 
          value={data.length} 
          icon={<Package />}
          isLoading={isLoading}
          change="+12"
          positive={true}
        />
        <MetricCard 
          label="In Stock" 
          value={activeCount} 
          icon={<Activity />}
          isLoading={isLoading}
          change="+5"
          positive={true}
          color="#10b981"
        />
        <MetricCard 
          label="Product Revenue" 
          value={totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} 
          prefix="₹"
          icon={<DollarSign />}
          isLoading={isLoading}
          change="8.4%"
          positive={true}
          color="#8b5cf6"
        />
        <MetricCard 
          label="Avg. Product ROAS" 
          value={avgRoas.toFixed(2)} 
          suffix="x"
          icon={<TrendingUp />}
          isLoading={isLoading}
          change="12%"
          positive={true}
          color="#f59e0b"
        />
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="h-64 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <DataTable 
            data={filteredData} 
            columns={columns} 
            onRowClick={(row) => navigate(`/sku/${encodeURIComponent(row.id)}`)}
            filterSlot={filterSlot}
          />
        )}
      </div>
    </div>
  );
};
