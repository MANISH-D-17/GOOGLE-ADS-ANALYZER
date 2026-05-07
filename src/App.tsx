import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import SKUDashboard from './pages/SKUDashboard';
import CampaignOverview from './pages/CampaignOverview';
import SKUDetailPage from './pages/SKUDetailPage';
import KeywordsDashboard from './pages/KeywordsDashboard';
import CreativesDashboard from './pages/CreativesDashboard';
import FeedHealthDashboard from './pages/FeedHealthDashboard';
import { Search, Bell, Menu, X } from 'lucide-react';
import { cn } from './lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Target, ImageIcon, ShoppingBag, BarChart3 
} from 'lucide-react';

function App() {
  const [dateRange, setDateRange] = useState('Last 30d');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dateOptions = ['Today', 'Yesterday', 'Last 7d', 'Last 30d', 'Last 90d'];

  const navItems = [
    { id: 'skus', label: 'SKUs', icon: LayoutDashboard, path: '/' },
    { id: 'keywords', label: 'Keywords', icon: Target, path: '/keywords' },
    { id: 'creatives', label: 'Creatives', icon: ImageIcon, path: '/creatives' },
    { id: 'feed', label: 'Feed', icon: ShoppingBag, path: '/feed-health' },
    { id: 'campaigns', label: 'Campaigns', icon: BarChart3, path: '/campaigns' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] flex flex-col md:flex-row">
      <Sidebar />
      
      <main className="flex-1 md:ml-16 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-gray-500 hover:text-gray-900"
            >
              <Menu size={20} />
            </button>
            <div className="text-sm font-bold text-gray-900 md:block hidden">Catalyst <span className="text-gray-400 font-medium">· Twin Birds</span></div>
            <div className="text-sm font-bold text-gray-900 md:hidden block">Kalai Works</div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-50 border border-gray-100 rounded-lg p-1 mr-4">
              {dateOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setDateRange(opt)}
                  className={cn(
                    "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                    dateRange === opt 
                      ? "bg-white text-gray-900 shadow-sm border border-gray-200" 
                      : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-4 border-l border-gray-100 pl-4 ml-2">
              <div className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                <Search size={18} />
              </div>
              <div className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                <Bell size={18} />
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                C
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
          <Routes>
            <Route path="/" element={<SKUDashboard dateRange={dateRange} />} />
            <Route path="/keywords" element={<KeywordsDashboard dateRange={dateRange} />} />
            <Route path="/creatives" element={<CreativesDashboard dateRange={dateRange} />} />
            <Route path="/feed-health" element={<FeedHealthDashboard dateRange={dateRange} />} />
            <Route path="/campaigns" element={<CampaignOverview dateRange={dateRange} />} />
            <Route path="/sku/:id" element={<SKUDetailPage dateRange={dateRange} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[100] md:hidden">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
              <div className="h-16 flex items-center justify-between px-6 border-b border-gray-50">
                <span className="font-bold text-gray-900">Navigation</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-gray-900">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm",
                      isActive(item.path)
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
