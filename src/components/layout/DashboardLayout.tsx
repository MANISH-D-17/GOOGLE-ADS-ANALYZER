import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart3, 
  Target,
  ImageIcon,
  TrendingUp,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  dateRange: string;
  setDateRange: (range: string) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, dateRange, setDateRange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'executive', label: 'Executive Overview', icon: LayoutDashboard, path: '/' },
    { id: 'keywords', label: 'Keyword Intel', icon: Target, path: '/keywords' },
    { id: 'campaigns', label: 'Campaigns', icon: BarChart3, path: '/campaigns' },
    { id: 'creatives', label: 'Creative Hub', icon: ImageIcon, path: '/creatives' },
    { id: 'competitors', label: 'Competitor Analysis', icon: TrendingUp, path: '/competitors' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row text-slate-700">
      <Sidebar />
      
      <main className="flex-1 md:ml-16 flex flex-col overflow-y-auto">
        <Header 
          dateRange={dateRange} 
          setDateRange={setDateRange} 
          onMobileMenuToggle={() => setIsMobileMenuOpen(true)} 
        />

        <div className="flex-1 p-4 md:p-8 max-w-[1600px] w-full mx-auto">
          {children}
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
                        ? "bg-blue-50 text-blue-600"
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
};
