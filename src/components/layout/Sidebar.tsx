import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart3, 
  Activity, 
  Settings,
  HelpCircle,
  Target,
  ImageIcon,
  TrendingUp,
  Package
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const Sidebar: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'products', label: 'Product Intel', icon: Package, path: '/' },
    { id: 'executive', label: 'Executive Overview', icon: LayoutDashboard, path: '/executive' },
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
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "fixed left-0 top-0 h-screen bg-white border-r border-gray-100 z-50 transition-all duration-300 ease-in-out shadow-xl shadow-gray-200/50 md:block hidden",
        isHovered ? "w-64" : "w-16"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo Area */}
        <div className="h-16 flex items-center px-4 border-b border-gray-50">
          <div className="flex items-center justify-center flex-shrink-0 transition-all duration-500 hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] hover:scale-110 cursor-pointer text-blue-600">
            <Activity size={24} strokeWidth={3} />
          </div>
          {isHovered && (
            <span className="ml-3 font-bold text-gray-900 truncate tracking-tight">
              Kalai <span className="text-blue-600">Works</span>
            </span>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-6 px-3 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center rounded-xl p-2 transition-all group",
                isActive(item.path)
                  ? "bg-blue-50 text-blue-600" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <div className="w-10 flex items-center justify-center flex-shrink-0">
                <item.icon size={20} className={cn(
                  "transition-colors",
                  isActive(item.path) ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                )} />
              </div>
              {isHovered && (
                <span className="ml-2 text-[11px] font-black uppercase tracking-widest whitespace-nowrap opacity-100 transition-opacity duration-300">
                  {item.label}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer Area */}
        <div className="p-3 border-t border-gray-50 space-y-2">
          <button className="w-full flex items-center rounded-xl p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900 group">
            <div className="w-10 flex items-center justify-center flex-shrink-0">
              <Settings size={20} className="text-gray-400 group-hover:text-gray-600" />
            </div>
            {isHovered && <span className="ml-2 text-[11px] font-black uppercase tracking-widest">Settings</span>}
          </button>
          <button className="w-full flex items-center rounded-xl p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900 group">
            <div className="w-10 flex items-center justify-center flex-shrink-0">
              <HelpCircle size={20} className="text-gray-400 group-hover:text-gray-600" />
            </div>
            {isHovered && <span className="ml-2 text-[11px] font-black uppercase tracking-widest">Help</span>}
          </button>
        </div>
      </div>
    </div>
  );
};
